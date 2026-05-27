import { afterEach, describe, expect, it, vi } from "vitest";

import pLimitCompat from "../../../utils/async/pLimitCompat.js";
import {
    fetchWithTimeout,
    isAbortError,
    truncateErrorText,
} from "../../../utils/net/networkUtils.js";

type TestGlobal = typeof globalThis & {
    fetch: ReturnType<typeof vi.fn>;
};

const globalRef = globalThis as TestGlobal;

const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

function delay(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            pendingTimers.delete(timer);
            resolve();
        }, delayMs);
        pendingTimers.add(timer);
    });
}

describe("async concurrency limiter", () => {
    // eslint-disable-next-line vitest/no-hooks -- Timer cleanup prevents leaked async handles between cases.
    afterEach(() => {
        for (const timer of pendingTimers) {
            clearTimeout(timer);
        }
        pendingTimers.clear();
    });

    it("limits concurrent factories and preserves result order", async () => {
        expect.assertions(3);

        const limit = pLimitCompat(2);
        let activeCount = 0;
        let maxActiveCount = 0;

        const tasks = [
            30,
            10,
            20,
            5,
        ].map((delayMs, index) =>
            limit(async () => {
                activeCount++;
                maxActiveCount = Math.max(maxActiveCount, activeCount);
                await delay(delayMs);
                activeCount--;
                return index;
            })
        );

        await expect(Promise.all(tasks)).resolves.toStrictEqual([
            0,
            1,
            2,
            3,
        ]);
        expect(maxActiveCount).toBe(2);
        expect(activeCount).toBe(0);
    });

    it("falls back to serial execution for invalid concurrency", async () => {
        expect.assertions(2);

        const limit = pLimitCompat(0);
        let activeCount = 0;
        let maxActiveCount = 0;
        const tasks = Array.from({ length: 3 }, (_, index) =>
            limit(async () => {
                activeCount++;
                maxActiveCount = Math.max(maxActiveCount, activeCount);
                await Promise.resolve();
                activeCount--;
                return index;
            })
        );

        await expect(Promise.all(tasks)).resolves.toStrictEqual([
            0,
            1,
            2,
        ]);
        expect(maxActiveCount).toBe(1);
    });

    it("continues queued work after a rejected factory", async () => {
        expect.assertions(3);

        const limit = pLimitCompat(1);
        const expectedError = new Error("failed task");
        const first = limit(async () => {
            throw expectedError;
        });
        const second = limit(() => "recovered");

        await expect(first).rejects.toThrow(expectedError);
        await expect(second).resolves.toBe("recovered");
        expect(isAbortError(expectedError) ? "abort" : "other").toBe("other");
    });
});

describe("network utilities", () => {
    // eslint-disable-next-line vitest/no-hooks -- Restores mocked globals and timers after network helper tests.
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("passes an AbortController signal to fetch and clears the timeout", async () => {
        expect.assertions(8);

        const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
        const clearSpy = vi.spyOn(globalThis, "clearTimeout");
        const response = new Response("ok", { status: 200 });
        const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(response);
        globalRef.fetch = fetchSpy;

        await expect(
            fetchWithTimeout("https://example.test", 100)
        ).resolves.toBe(response);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        const fetchCall = fetchSpy.mock.calls.at(0);
        if (fetchCall === undefined) {
            throw new Error("fetch was not called");
        }
        const [
            url,
            init,
        ] = fetchCall;
        expect(url).toBe("https://example.test");
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        expect(init?.signal?.aborted).toBe(false);

        const timeoutCall = timeoutSpy.mock.calls.at(0);
        if (timeoutCall === undefined) {
            throw new Error("setTimeout was not called");
        }
        const [
            timeoutHandler,
            timeoutDelay,
        ] = timeoutCall;
        expect(typeof timeoutHandler).toBe("function");
        expect(timeoutDelay).toBe(100);
        expect(clearSpy).toHaveBeenCalledWith(expect.anything());
    });

    it("aborts the fetch signal when the timeout elapses", async () => {
        expect.assertions(4);
        vi.useFakeTimers();

        const abortEvents: string[] = [];
        const fetchSpy = vi.fn<typeof fetch>((_url, init) => {
            if (!(init?.signal instanceof AbortSignal)) {
                throw new TypeError("Expected fetch timeout signal");
            }
            const listenerCleanup = new AbortController();
            const timeoutSignal = init.signal;
            const handleAbort = () => {
                abortEvents.push("abort");
                listenerCleanup.abort();
            };
            timeoutSignal.addEventListener("abort", handleAbort, {
                signal: listenerCleanup.signal,
            });
            return new Promise<Response>(() => {});
        });
        globalRef.fetch = fetchSpy;

        void fetchWithTimeout("https://example.test/slow", 250);
        await vi.advanceTimersByTimeAsync(249);
        expect(abortEvents).toStrictEqual([]);

        await vi.advanceTimersByTimeAsync(1);
        expect(abortEvents).toStrictEqual(["abort"]);

        const fetchCall = fetchSpy.mock.calls.at(0);
        if (fetchCall === undefined) {
            throw new Error("fetch was not called");
        }
        expect(fetchCall[0]).toBe("https://example.test/slow");
        expect(fetchCall[1]?.signal?.aborted).toBe(true);
    });

    it("detects abort errors and rejects unrelated values", () => {
        expect.assertions(4);

        expect(isAbortError({ name: "AbortError" }) ? "abort" : "other").toBe(
            "abort"
        );
        expect(isAbortError(new Error("AbortError")) ? "abort" : "other").toBe(
            "other"
        );
        expect(isAbortError("AbortError") ? "abort" : "other").toBe("other");
        expect(isAbortError(null) ? "abort" : "other").toBe("other");
    });

    it("truncates long error text and ignores missing values", () => {
        expect.assertions(3);

        expect(truncateErrorText("abcdef", 3)).toBe("abc…");
        expect(truncateErrorText("abc", 3)).toBe("abc");
        expect(truncateErrorText(undefined)).toBe("");
    });
});

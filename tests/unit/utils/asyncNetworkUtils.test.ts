import { afterEach, describe, expect, it, vi } from "vitest";

import pLimitCompat from "../../../electron-app/utils/async/pLimitCompat.js";
import {
    fetchWithTimeout,
    isAbortError,
    truncateErrorText,
} from "../../../electron-app/utils/net/networkUtils.js";

type TestGlobal = typeof globalThis & {
    fetch: ReturnType<typeof vi.fn>;
};

const globalRef = globalThis as TestGlobal;

const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

type FetchCall = Parameters<typeof fetch>;
type TimeoutCall = Parameters<typeof setTimeout>;

function getRequiredFetchCall(calls: FetchCall[], index = 0): FetchCall {
    const call = calls[index];

    if (!call) {
        throw new Error(`Expected fetch call ${index}`);
    }

    return call;
}

function getRequiredFetchInit(call: FetchCall): RequestInit {
    const init = call[1];

    if (!init) {
        throw new Error("Expected fetch init options");
    }

    return init;
}

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
        expect.assertions(2);

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
        expect({
            activeCount,
            maxActiveCount,
        }).toStrictEqual({
            activeCount: 0,
            maxActiveCount: 2,
        });
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
        expect({ maxActiveCount }).toStrictEqual({ maxActiveCount: 1 });
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
        expect.assertions(4);

        const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
        const clearSpy = vi.spyOn(globalThis, "clearTimeout");
        const response = new Response("ok", { status: 200 });
        const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(response);
        globalRef.fetch = fetchSpy;

        await expect(
            fetchWithTimeout("https://example.test", 100)
        ).resolves.toBe(response);

        expect(fetchSpy).toHaveBeenCalledOnce();
        const fetchCall = getRequiredFetchCall(fetchSpy.mock.calls);
        const [url] = fetchCall;
        const requiredInit = getRequiredFetchInit(fetchCall);
        const timeoutCall = timeoutSpy.mock.calls[0] as TimeoutCall;
        const [timeoutHandler, timeoutMs] = timeoutCall;
        const timeoutHandle = timeoutSpy.mock.results[0]?.value;

        expect({
            signalAborted:
                requiredInit.signal instanceof AbortSignal
                    ? requiredInit.signal.aborted
                    : null,
            signalIsAbortSignal: requiredInit.signal instanceof AbortSignal,
            timeoutHandlerType: typeof timeoutHandler,
            timeoutMs,
            url,
        }).toStrictEqual({
            signalAborted: false,
            signalIsAbortSignal: true,
            timeoutHandlerType: "function",
            timeoutMs: 100,
            url: "https://example.test",
        });
        expect(clearSpy).toHaveBeenCalledWith(timeoutHandle);
    });

    it("fetches through an injected network runtime", async () => {
        expect.assertions(8);

        const response = new Response("ok", { status: 200 });
        const timeoutMs = Number("125");
        const timer = 47 as ReturnType<typeof globalThis.setTimeout>;
        const clearTimeout = vi.fn<(handle: typeof timer) => void>();
        const controller = new AbortController();
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
            response
        );
        const setTimeout = vi.fn((callback: () => void, delay: number) => {
            expect(callback).toBeTypeOf("function");
            expect(delay).toBe(timeoutMs);

            return timer;
        });
        const createAbortController = vi.fn(() => controller);

        await expect(
            fetchWithTimeout("https://example.test", timeoutMs, {}, {
                clearTimeout,
                createAbortController,
                fetch,
                setTimeout,
            })
        ).resolves.toBe(response);

        expect(createAbortController).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledOnce();
        expect(fetch).toHaveBeenCalledWith("https://example.test", {
            signal: controller.signal,
        });
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(controller.signal.aborted).toBe(false);
    });

    it("aborts the fetch signal when the timeout elapses", async () => {
        expect.assertions(3);
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

        const fetchCall = getRequiredFetchCall(fetchSpy.mock.calls);
        const init = getRequiredFetchInit(fetchCall);
        expect({
            signalAborted:
                init.signal instanceof AbortSignal ? init.signal.aborted : null,
            signalIsAbortSignal: init.signal instanceof AbortSignal,
            url: fetchCall[0],
        }).toStrictEqual({
            signalAborted: true,
            signalIsAbortSignal: true,
            url: "https://example.test/slow",
        });
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

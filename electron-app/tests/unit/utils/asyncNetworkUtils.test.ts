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

        const tasks = [30, 10, 20, 5].map((delayMs, index) =>
            limit(async () => {
                activeCount++;
                maxActiveCount = Math.max(maxActiveCount, activeCount);
                await delay(delayMs);
                activeCount--;
                return index;
            })
        );

        await expect(Promise.all(tasks)).resolves.toStrictEqual([0, 1, 2, 3]);
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

        await expect(Promise.all(tasks)).resolves.toStrictEqual([0, 1, 2]);
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
        expect.assertions(4);

        const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
        const clearSpy = vi.spyOn(globalThis, "clearTimeout");
        const response = new Response("ok", { status: 200 });
        const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(response);
        globalRef.fetch = fetchSpy;

        await expect(fetchWithTimeout("https://example.test", 100)).resolves.toBe(
            response
        );

        expect(fetchSpy).toHaveBeenCalledWith(
            "https://example.test",
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
        expect(clearSpy).toHaveBeenCalledWith(expect.anything());
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

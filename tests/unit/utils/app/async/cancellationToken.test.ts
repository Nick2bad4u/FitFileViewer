import { afterEach, describe, expect, it, vi } from "vitest";

import {
    CancellationToken,
    CancellationTokenSource,
    createTimeoutCancellationToken,
    delay,
    isCancellationError,
} from "../../../../../electron-app/utils/app/async/cancellationToken.js";

describe("cancellationToken", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("notifies listeners exactly once when cancelled", () => {
        expect.assertions(2);

        const token = new CancellationToken();
        const listener = vi.fn<() => void>();

        token.onCancel(listener);
        token.cancel();
        token.cancel();

        expect(token.isCancelled).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
    });

    it("allows registered listeners to unsubscribe", () => {
        expect.assertions(1);

        const token = new CancellationToken();
        let listenerCalls = 0;
        const listener = (): void => {
            listenerCalls += 1;
        };
        const unsubscribe = token.onCancel(listener);

        unsubscribe();
        token.cancel();

        expect(listenerCalls).toBe(0);
    });

    it("auto-cancels timeout token sources after the configured delay", () => {
        expect.assertions(2);

        vi.useFakeTimers();

        const timeoutMs = Number("50");
        const source = createTimeoutCancellationToken(timeoutMs);

        expect(source.token.isCancelled).toBe(false);
        vi.advanceTimersByTime(timeoutMs);
        expect(source.token.isCancelled).toBe(true);
    });

    it("clears timeout token timers when cancelled early", () => {
        expect.assertions(2);

        vi.useFakeTimers();

        const timeoutMs = Number("100");
        const source = createTimeoutCancellationToken(timeoutMs);

        source.cancel();

        expect(source.token.isCancelled).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("creates timeout tokens through an injected timer runtime", () => {
        expect.assertions(5);

        const clearTimeout = vi.fn<(handle: number) => void>();
        let scheduledCallback: (() => void) | undefined;
        const setTimeout = vi.fn((callback: () => void, timeout: number) => {
            scheduledCallback = callback;
            expect(timeout).toBe(250);

            return 41;
        });

        const source = createTimeoutCancellationToken(250, {
            clearTimeout,
            setTimeout,
        });

        expect(source.token.isCancelled).toBe(false);
        expect(setTimeout).toHaveBeenCalledOnce();

        scheduledCallback?.();

        expect(source.token.isCancelled).toBe(true);
        expect(clearTimeout).toHaveBeenCalledWith(41);
    });

    it("resolves delay after the configured timeout", async () => {
        expect.assertions(1);

        vi.useFakeTimers();

        const delayMs = Number("25");
        const delayed = delay(delayMs);

        vi.advanceTimersByTime(delayMs);

        await expect(delayed).resolves.toBeUndefined();
    });

    it("rejects delay when the token is cancelled", async () => {
        expect.assertions(2);

        vi.useFakeTimers();
        const source = new CancellationTokenSource();
        const delayMs = Number("100");
        const delayed = delay(delayMs, source.token);

        source.cancel();

        await expect(delayed).rejects.toThrow("Operation was cancelled");
        expect(vi.getTimerCount()).toBe(0);
    });

    it("delays through an injected timer runtime", async () => {
        expect.assertions(5);

        const delayMs = Number("75");
        const clearTimeout = vi.fn<(handle: number) => void>();
        let scheduledCallback: (() => void) | undefined;
        const setTimeout = vi.fn((callback: () => void, timeout: number) => {
            scheduledCallback = callback;
            expect(timeout).toBe(delayMs);

            return 51;
        });

        const delayed = delay(delayMs, undefined, {
            clearTimeout,
            setTimeout,
        });

        expect(setTimeout).toHaveBeenCalledOnce();

        scheduledCallback?.();

        await expect(delayed).resolves.toBeUndefined();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(scheduledCallback).toBeTypeOf("function");
    });

    it("identifies cancellation errors", () => {
        expect.assertions(2);

        expect(isCancellationError(new Error("Operation was cancelled"))).toBe(
            true
        );
        expect(isCancellationError(new Error("Other failure"))).toBe(false);
    });
});

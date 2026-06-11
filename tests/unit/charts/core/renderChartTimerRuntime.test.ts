import { describe, expect, it, vi } from "vitest";

import { getRenderChartTimerRuntime } from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

describe("getRenderChartTimerRuntime", () => {
    it("routes timer scheduling and clearing through the injected scope", () => {
        expect.assertions(3);

        const timeoutId = 7 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >(() => timeoutId);
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const runtime = getRenderChartTimerRuntime({
            clearTimeout: clearTimeoutMock,
            setTimeout: setTimeoutMock,
        });
        const callback = () => undefined;

        const scheduledTimeout = runtime.setTimeout(callback, 125);
        runtime.clearTimeout(scheduledTimeout);

        expect(scheduledTimeout).toBe(timeoutId);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 125);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timeoutId);
    });

    it("waits by scheduling a timeout through the injected scope", async () => {
        expect.assertions(3);

        let scheduledCallback: (() => void) | undefined;
        const timeoutId = 8 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >((callback) => {
            scheduledCallback = callback;
            return timeoutId;
        });
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const runtime = getRenderChartTimerRuntime({
            clearTimeout: clearTimeoutMock,
            setTimeout: setTimeoutMock,
        });

        const promise = runtime.waitForNextTask();

        expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 0);

        scheduledCallback?.();
        await promise;

        expect(clearTimeoutMock).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
    });

    it("fails clearly when timer functions are unavailable", () => {
        expect.assertions(2);

        const timeoutId = 9 as ReturnType<typeof setTimeout>;

        expect(() =>
            getRenderChartTimerRuntime({}).setTimeout(() => undefined, 0)
        ).toThrow("render chart timers require setTimeout");
        expect(() =>
            getRenderChartTimerRuntime({}).clearTimeout(timeoutId)
        ).toThrow("render chart timers require clearTimeout");
    });
});

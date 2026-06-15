import { describe, expect, it, vi } from "vitest";

import { getRenderChartTimerRuntime as getChartTimerRuntime } from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

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
        const timerRuntime = getChartTimerRuntime({
            clearTimeout: clearTimeoutMock,
            setTimeout: setTimeoutMock,
        });
        const callback = () => undefined;
        const scheduleDelay = 125;

        const scheduledTimeout = timerRuntime.setTimeout(
            callback,
            scheduleDelay
        );
        timerRuntime.clearTimeout(scheduledTimeout);

        expect(scheduledTimeout).toBe(timeoutId);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, scheduleDelay);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timeoutId);
    });

    it("waits by scheduling a timeout through the injected scope", async () => {
        expect.assertions(4);

        let resolved = false;
        let scheduledDelay: number | undefined;
        let scheduledCallback: (() => void) | undefined;
        const timeoutId = 8 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >((callback, delay) => {
            scheduledCallback = callback;
            scheduledDelay = delay;
            return timeoutId;
        });
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const timerRuntime = getChartTimerRuntime({
            clearTimeout: clearTimeoutMock,
            setTimeout: setTimeoutMock,
        });

        const promise = timerRuntime.waitForNextTask().then(() => {
            resolved = true;
        });

        expect({ resolved, scheduledDelay }).toStrictEqual({
            resolved: false,
            scheduledDelay: 0,
        });

        scheduledCallback?.();
        await promise;

        expect(resolved).toStrictEqual(true);
        expect(clearTimeoutMock).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
    });

    it("fails clearly when timer functions are unavailable", () => {
        expect.assertions(2);

        const timeoutId = 9 as ReturnType<typeof setTimeout>;

        expect(() =>
            getChartTimerRuntime({}).setTimeout(() => undefined, 0)
        ).toThrow("render chart timers require setTimeout");
        expect(() =>
            getChartTimerRuntime({}).clearTimeout(timeoutId)
        ).toThrow("render chart timers require clearTimeout");
    });
});

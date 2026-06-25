import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRenderChartTimerRuntime as getChartTimerRuntime,
    type RenderChartTimerRuntimeScope,
} from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

describe("getRenderChartTimerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("routes timer scheduling and clearing through the injected scope", () => {
        expect.assertions(5);

        const timeoutId = 7 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >(() => timeoutId);
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const dateNowMock = vi.fn<() => number>(() => 12_345);
        const timerRuntime = getChartTimerRuntime({
            getClearTimeout: () => clearTimeoutMock,
            getDateNow: () => dateNowMock,
            getSetTimeout: () => setTimeoutMock,
        });
        const callback = () => undefined;
        const scheduleDelay = 125;

        const scheduledTimeout = timerRuntime.setTimeout(
            callback,
            scheduleDelay
        );
        timerRuntime.clearTimeout(scheduledTimeout);
        const timestamp = timerRuntime.dateNow();

        expect(scheduledTimeout).toBe(timeoutId);
        expect(timestamp).toBe(12_345);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, scheduleDelay);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timeoutId);
        expect(dateNowMock).toHaveBeenCalledOnce();
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
            getClearTimeout: () => clearTimeoutMock,
            getSetTimeout: () => setTimeoutMock,
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

    it("resolves production timer defaults through browser runtime providers", () => {
        expect.assertions(5);

        const timeoutId = 10 as ReturnType<typeof setTimeout>;
        const callback = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >(() => timeoutId);
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const dateNowMock = vi.spyOn(Date, "now").mockReturnValue(98_765);
        const scheduleDelay = 250;

        vi.stubGlobal("setTimeout", setTimeoutMock);
        vi.stubGlobal("clearTimeout", clearTimeoutMock);

        const timerRuntime = getChartTimerRuntime();

        expect(timerRuntime.setTimeout(callback, scheduleDelay)).toBe(
            timeoutId
        );
        timerRuntime.clearTimeout(timeoutId);
        expect(timerRuntime.dateNow()).toBe(98_765);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, scheduleDelay);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timeoutId);
        expect(dateNowMock).toHaveBeenCalledOnce();
    });

    it("fails clearly when timer functions are unavailable", () => {
        expect.assertions(3);

        const timeoutId = 9 as ReturnType<typeof setTimeout>;

        expect(() =>
            getChartTimerRuntime({}).setTimeout(() => undefined, 0)
        ).toThrow("render chart timers require setTimeout");
        expect(() => getChartTimerRuntime({}).clearTimeout(timeoutId)).toThrow(
            "render chart timers require clearTimeout"
        );
        expect(() => getChartTimerRuntime({}).dateNow()).toThrow(
            "render chart timers require dateNow"
        );
    });

    it("ignores legacy direct timer scope properties", () => {
        expect.assertions(4);

        const timeoutId = 11 as ReturnType<typeof setTimeout>;
        const legacyDateNow = vi.fn<() => number>(() => 1);
        const timerRuntime = getChartTimerRuntime({
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            dateNow: legacyDateNow,
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as RenderChartTimerRuntimeScope);

        expect(() => timerRuntime.setTimeout(() => undefined, 0)).toThrow(
            "render chart timers require setTimeout"
        );
        expect(() => timerRuntime.clearTimeout(timeoutId)).toThrow(
            "render chart timers require clearTimeout"
        );
        expect(() => timerRuntime.dateNow()).toThrow(
            "render chart timers require dateNow"
        );
        expect(legacyDateNow).not.toHaveBeenCalled();
    });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getRenderChartTimerRuntime as getChartTimerRuntime,
    type RenderChartTimeout,
    type RenderChartTimerRuntimeScope,
} from "../../../../electron-app/utils/charts/core/renderChartTimerRuntime.js";

describe("getRenderChartTimerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("routes timer scheduling and clearing through the injected scope", () => {
        expect.assertions(5);

        const timeoutId = 7 as RenderChartTimeout;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timeoutId);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
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
        const timeoutId = 8 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>((callback, delay) => {
            scheduledCallback = callback;
            scheduledDelay = delay;
            return timeoutId;
        });
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const timerRuntime = getChartTimerRuntime({
            getClearTimeout: () => clearTimeoutMock,
            getDateNow: () => undefined,
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

        const timeoutId = 10 as BrowserTimerHandle;
        const callback = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timeoutId);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
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

    it("fails clearly when explicit scopes omit timer providers", () => {
        expect.assertions(1);

        expect(() =>
            getChartTimerRuntime({} as unknown as RenderChartTimerRuntimeScope)
        ).toThrow("render chart timers require a clearTimeout provider");
    });

    it("fails clearly when individual timer providers are omitted", () => {
        expect.assertions(3);

        expect(() =>
            getChartTimerRuntime({
                getDateNow: () => undefined,
                getSetTimeout: () => undefined,
            } as unknown as RenderChartTimerRuntimeScope)
        ).toThrow("render chart timers require a clearTimeout provider");
        expect(() =>
            getChartTimerRuntime({
                getClearTimeout: () => undefined,
                getSetTimeout: () => undefined,
            } as unknown as RenderChartTimerRuntimeScope)
        ).toThrow("render chart timers require a dateNow provider");
        expect(() =>
            getChartTimerRuntime({
                getClearTimeout: () => undefined,
                getDateNow: () => undefined,
            } as unknown as RenderChartTimerRuntimeScope)
        ).toThrow("render chart timers require a setTimeout provider");
    });

    it("fails clearly when timer provider slots are undefined", () => {
        expect.assertions(3);

        expect(() =>
            getChartTimerRuntime({
                getClearTimeout: undefined,
                getDateNow: () => undefined,
                getSetTimeout: () => undefined,
            })
        ).toThrow("render chart timers require a clearTimeout provider");
        expect(() =>
            getChartTimerRuntime({
                getClearTimeout: () => undefined,
                getDateNow: undefined,
                getSetTimeout: () => undefined,
            })
        ).toThrow("render chart timers require a dateNow provider");
        expect(() =>
            getChartTimerRuntime({
                getClearTimeout: () => undefined,
                getDateNow: () => undefined,
                getSetTimeout: undefined,
            })
        ).toThrow("render chart timers require a setTimeout provider");
    });

    it("fails clearly when explicit providers return unavailable timer functions", () => {
        expect.assertions(3);

        const timeoutId = 9 as BrowserTimerHandle;
        const runtime = getChartTimerRuntime({
            getClearTimeout: () => undefined,
            getDateNow: () => undefined,
            getSetTimeout: () => undefined,
        });

        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "render chart timers require setTimeout"
        );
        expect(() => runtime.clearTimeout(timeoutId)).toThrow(
            "render chart timers require clearTimeout"
        );
        expect(() => runtime.dateNow()).toThrow(
            "render chart timers require dateNow"
        );
    });

    it("ignores legacy direct timer scope properties", () => {
        expect.assertions(2);

        const legacyDateNow = vi.fn<() => number>(() => 1);

        expect(() =>
            getChartTimerRuntime({
                clearTimeout() {
                    throw new Error("legacy clearTimeout should not run");
                },
                dateNow: legacyDateNow,
                setTimeout() {
                    throw new Error("legacy setTimeout should not run");
                },
            } as unknown as RenderChartTimerRuntimeScope)
        ).toThrow("render chart timers require a clearTimeout provider");
        expect(legacyDateNow).not.toHaveBeenCalled();
    });
});

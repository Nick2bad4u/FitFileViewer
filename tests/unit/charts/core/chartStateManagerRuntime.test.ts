import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChartStateManagerRuntimeScope } from "../../../../electron-app/utils/charts/core/chartStateManagerRuntime.js";
import { getChartStateManagerRuntime } from "../../../../electron-app/utils/charts/core/chartStateManagerRuntime.js";

describe("getChartStateManagerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("routes timers through the injected runtime scope", () => {
        expect.assertions(5);

        const timer = 42 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >(() => timer);
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const dateNow = vi.fn<() => number>(() => 123_456);
        const {
            clearRenderTimeout: clearChartTimeout,
            dateNow: getRuntimeDateNow,
            setRenderTimeout: setChartTimeout,
        } = getChartStateManagerRuntime({
            getClearTimeout: () => clearTimeoutMock,
            getDateNow: () => dateNow,
            getSetTimeout: () => setTimeoutMock,
        });
        const callback = () => undefined;

        const timeout = setChartTimeout(callback, 250);
        clearChartTimeout(timeout);
        const timestamp = getRuntimeDateNow();

        expect(timeout).toBe(timer);
        expect(timestamp).toBe(123_456);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 250);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timeout);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("resolves chart render and controls elements from the injected document", () => {
        expect.assertions(3);

        const container = document.createElement("div");
        container.id = "chartjs-chart-container";
        document.body.appendChild(container);

        const controlsPanel = document.createElement("div");
        controlsPanel.className = "chart-controls";
        document.body.appendChild(controlsPanel);

        const runtime = getChartStateManagerRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.getChartRenderContainer()).toBe(container);
        expect(runtime.getControlsPanel()).toBe(controlsPanel);

        document.body.innerHTML = "";

        expect(runtime.getControlsPanel()).toBeNull();
    });

    it("resolves production timer defaults through browser runtime providers", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const timer = 44 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >(() => timer);
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const dateNow = vi.spyOn(Date, "now").mockReturnValue(654_321);
        const scheduleDelay = 125;

        vi.stubGlobal("setTimeout", setTimeoutMock);
        vi.stubGlobal("clearTimeout", clearTimeoutMock);

        const runtime = getChartStateManagerRuntime();
        const scheduled = {
            handle: runtime.setRenderTimeout(callback, scheduleDelay),
        };

        runtime.clearRenderTimeout(scheduled.handle);

        expect(scheduled.handle).toBe(timer);
        expect(runtime.dateNow()).toBe(654_321);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, scheduleDelay);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("fails clearly when timer functions are unavailable", () => {
        expect.assertions(3);

        const timeout = 1 as ReturnType<typeof setTimeout>;

        expect(() =>
            getChartStateManagerRuntime({}).setRenderTimeout(() => undefined, 0)
        ).toThrow("ChartStateManager requires setTimeout");
        expect(() =>
            getChartStateManagerRuntime({}).clearRenderTimeout(timeout)
        ).toThrow("ChartStateManager requires clearTimeout");
        expect(() => getChartStateManagerRuntime({}).dateNow()).toThrow(
            "ChartStateManager requires dateNow"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(6);

        const container = document.createElement("div");
        container.id = "chartjs-chart-container";
        document.body.appendChild(container);
        const timeout = 1 as ReturnType<typeof setTimeout>;
        const legacyScope = {
            clearTimeout: vi.fn<typeof globalThis.clearTimeout>(),
            dateNow: vi.fn<() => number>(() => 1),
            document,
            HTMLElement,
            setTimeout: vi.fn<typeof globalThis.setTimeout>(() => timeout),
        } as unknown as ChartStateManagerRuntimeScope;
        const runtime = getChartStateManagerRuntime(legacyScope);

        expect(runtime.getChartRenderContainer()).toBeNull();
        expect(runtime.getControlsPanel()).toBeNull();
        expect(() => runtime.setRenderTimeout(() => undefined, 0)).toThrow(
            "ChartStateManager requires setTimeout"
        );
        expect(() => runtime.clearRenderTimeout(timeout)).toThrow(
            "ChartStateManager requires clearTimeout"
        );
        expect(() => runtime.dateNow()).toThrow(
            "ChartStateManager requires dateNow"
        );
        expect(legacyScope.dateNow).not.toHaveBeenCalled();

        document.body.innerHTML = "";
    });
});

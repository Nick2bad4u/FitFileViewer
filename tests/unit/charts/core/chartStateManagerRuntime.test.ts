import { describe, expect, it, vi } from "vitest";

import type { ChartStateManagerRuntimeScope } from "../../../../electron-app/utils/charts/core/chartStateManagerRuntime.js";
import { getChartStateManagerRuntime } from "../../../../electron-app/utils/charts/core/chartStateManagerRuntime.js";

describe("getChartStateManagerRuntime", () => {
    it("routes timers through the injected runtime scope", () => {
        expect.assertions(3);

        const timer = 42 as ReturnType<typeof setTimeout>;
        const setTimeoutMock = vi.fn<
            (
                callback: () => void,
                delay: number
            ) => ReturnType<typeof setTimeout>
        >(() => timer);
        const clearTimeoutMock =
            vi.fn<(timeout: ReturnType<typeof setTimeout>) => void>();
        const {
            clearRenderTimeout: clearChartTimeout,
            setRenderTimeout: setChartTimeout,
        } = getChartStateManagerRuntime({
            getClearTimeout: () => clearTimeoutMock,
            getSetTimeout: () => setTimeoutMock,
        });
        const callback = () => undefined;

        const timeout = setChartTimeout(callback, 250);
        clearChartTimeout(timeout);

        expect(timeout).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 250);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timeout);
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

    it("fails clearly when timer functions are unavailable", () => {
        expect.assertions(2);

        const timeout = 1 as ReturnType<typeof setTimeout>;

        expect(() =>
            getChartStateManagerRuntime({}).setRenderTimeout(() => undefined, 0)
        ).toThrow("ChartStateManager requires setTimeout");
        expect(() =>
            getChartStateManagerRuntime({}).clearRenderTimeout(timeout)
        ).toThrow("ChartStateManager requires clearTimeout");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const container = document.createElement("div");
        container.id = "chartjs-chart-container";
        document.body.appendChild(container);
        const timeout = 1 as ReturnType<typeof setTimeout>;
        const legacyScope = {
            clearTimeout: vi.fn<typeof globalThis.clearTimeout>(),
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

        document.body.innerHTML = "";
    });
});

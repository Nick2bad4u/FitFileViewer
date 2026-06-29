import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";
import type {
    ChartStateManagerRuntimeScope,
    ChartStateManagerTimeout,
} from "../../../../electron-app/utils/charts/core/chartStateManagerRuntime.js";
import { getChartStateManagerRuntime } from "../../../../electron-app/utils/charts/core/chartStateManagerRuntime.js";

const unavailableTimerScope = {
    getClearTimeout: () => undefined,
    getDateNow: () => undefined,
    getDocument: () => undefined,
    getHTMLElement: () => undefined,
    getSetTimeout: () => undefined,
} satisfies ChartStateManagerRuntimeScope;

describe("getChartStateManagerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("routes timers through the injected runtime scope", () => {
        expect.assertions(5);

        const timer = 42 as ChartStateManagerTimeout;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
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
            ...unavailableTimerScope,
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.getChartRenderContainer()).toBe(container);
        expect(runtime.getControlsPanel()).toBe(controlsPanel);

        document.body.innerHTML = "";

        expect(runtime.getControlsPanel()).toBeNull();
    });

    it("resolves production DOM defaults through browser runtime providers", () => {
        expect.assertions(2);

        const documentRef = document.implementation.createHTMLDocument(
            "chart state manager"
        );
        const container = documentRef.createElement("div");
        container.id = "chartjs-chart-container";
        documentRef.body.append(container);

        const controlsPanel = documentRef.createElement("div");
        controlsPanel.className = "chart-controls";
        documentRef.body.append(controlsPanel);

        vi.stubGlobal("document", documentRef);

        const runtime = getChartStateManagerRuntime();

        expect(runtime.getChartRenderContainer()).toBe(container);
        expect(runtime.getControlsPanel()).toBe(controlsPanel);
    });

    it("resolves production timer defaults through browser runtime providers", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const timer = 44 as ChartStateManagerTimeout;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
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

        const timeout = 1 as ChartStateManagerTimeout;

        expect(() =>
            getChartStateManagerRuntime(unavailableTimerScope).setRenderTimeout(
                () => undefined,
                0
            )
        ).toThrow("ChartStateManager requires setTimeout");
        expect(() =>
            getChartStateManagerRuntime(
                unavailableTimerScope
            ).clearRenderTimeout(timeout)
        ).toThrow("ChartStateManager requires clearTimeout");
        expect(() =>
            getChartStateManagerRuntime(unavailableTimerScope).dateNow()
        ).toThrow("ChartStateManager requires dateNow");
    });

    it("fails clearly when timer providers are omitted", () => {
        expect.assertions(3);

        const timeout = 1 as ChartStateManagerTimeout;
        const omittedProviderScope =
            {} as unknown as ChartStateManagerRuntimeScope;

        expect(() =>
            getChartStateManagerRuntime(omittedProviderScope).setRenderTimeout(
                () => undefined,
                0
            )
        ).toThrow("ChartStateManager requires a setTimeout provider");
        expect(() =>
            getChartStateManagerRuntime(
                omittedProviderScope
            ).clearRenderTimeout(timeout)
        ).toThrow("ChartStateManager requires a clearTimeout provider");
        expect(() =>
            getChartStateManagerRuntime(omittedProviderScope).dateNow()
        ).toThrow("ChartStateManager requires a dateNow provider");
    });

    it("fails clearly when DOM providers are omitted", () => {
        expect.assertions(3);

        const omittedProviderScope =
            {} as unknown as ChartStateManagerRuntimeScope;
        const omittedHTMLElementProviderScope = {
            getClearTimeout: () => undefined,
            getDateNow: () => undefined,
            getDocument: () => document,
            getSetTimeout: () => undefined,
        } as unknown as ChartStateManagerRuntimeScope;

        expect(() =>
            getChartStateManagerRuntime(
                omittedProviderScope
            ).getChartRenderContainer()
        ).toThrow("ChartStateManager requires a document provider");
        expect(() =>
            getChartStateManagerRuntime(omittedProviderScope).getControlsPanel()
        ).toThrow("ChartStateManager requires a document provider");
        expect(() =>
            getChartStateManagerRuntime(
                omittedHTMLElementProviderScope
            ).getControlsPanel()
        ).toThrow("ChartStateManager requires an HTMLElement provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(6);

        const container = document.createElement("div");
        container.id = "chartjs-chart-container";
        document.body.appendChild(container);
        const timeout = 1 as ChartStateManagerTimeout;
        const legacyScope = {
            clearTimeout: vi.fn<BrowserClearTimeout>(),
            dateNow: vi.fn<() => number>(() => 1),
            document,
            HTMLElement,
            setTimeout: vi.fn<BrowserSetTimeout>(() => timeout),
        } as unknown as ChartStateManagerRuntimeScope;
        const runtime = getChartStateManagerRuntime(legacyScope);

        expect(() => runtime.getChartRenderContainer()).toThrow(
            "ChartStateManager requires a document provider"
        );
        expect(() => runtime.getControlsPanel()).toThrow(
            "ChartStateManager requires a document provider"
        );
        expect(() => runtime.setRenderTimeout(() => undefined, 0)).toThrow(
            "ChartStateManager requires a setTimeout provider"
        );
        expect(() => runtime.clearRenderTimeout(timeout)).toThrow(
            "ChartStateManager requires a clearTimeout provider"
        );
        expect(() => runtime.dateNow()).toThrow(
            "ChartStateManager requires a dateNow provider"
        );
        expect(legacyScope.dateNow).not.toHaveBeenCalled();

        document.body.innerHTML = "";
    });
});

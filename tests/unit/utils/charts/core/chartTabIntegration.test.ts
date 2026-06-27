import { describe, expect, it, vi } from "vitest";

type StateListener = (
    newValue: unknown,
    oldValue: unknown,
    path: string
) => void;

const stateValues = vi.hoisted(() => new Map<string, unknown>());
const stateListeners = vi.hoisted(() => new Map<string, StateListener>());

const clearChartStateMock = vi.hoisted(() => vi.fn<() => void>());
const debouncedRenderMock = vi.hoisted(() =>
    vi.fn<(reason?: string) => void>()
);
const forceRenderMock = vi.hoisted(() => vi.fn<(reason?: string) => void>());
const getChartInfoMock = vi.hoisted(() =>
    vi.fn<() => object>(() => ({ isRendered: false }))
);
const getActiveTabInfoMock = vi.hoisted(() =>
    vi.fn<() => object>(() => ({ name: stateValues.get("ui.activeTab") }))
);
const switchToTabMock = vi.hoisted(() =>
    vi.fn<(tabName: string) => boolean>((tabName) => tabName === "chartjs")
);
const showNotificationMock = vi.hoisted(() =>
    vi.fn<(message: string, type: string) => void>()
);
const getRawDataMock = vi.hoisted(() =>
    vi.fn<() => unknown>(() => stateValues.get("fitFile.rawData"))
);
const getRendererActiveTabMock = vi.hoisted(() =>
    vi.fn<() => string>(() => {
        const activeTab = stateValues.get("ui.activeTab");
        return typeof activeTab === "string" ? activeTab : "summary";
    })
);
const isRendererChartTabMock = vi.hoisted(() =>
    vi.fn<(tabName: unknown) => boolean>(
        (tabName) => tabName === "chart" || tabName === "chartjs"
    )
);
const subscribeToActiveFitRawDataChangeMock = vi.hoisted(() =>
    vi.fn<
        (callback: (data: unknown, previousData: unknown) => void) => () => void
    >((callback) => {
        stateListeners.set("fitFile.rawData", callback as StateListener);
        return () => {
            stateListeners.delete("fitFile.rawData");
        };
    })
);
const subscribeToAppOpeningFileMock = vi.hoisted(() =>
    vi.fn<(callback: StateListener) => () => void>((callback) => {
        stateListeners.set("app.isOpeningFile", callback);
        return () => {
            stateListeners.delete("app.isOpeningFile");
        };
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/activeFitRawDataState.js"),
    () => ({
        getActiveFitRawData: getRawDataMock,
        subscribeToActiveFitRawDataChange:
            subscribeToActiveFitRawDataChangeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/appDomainState.js"),
    () => ({
        subscribeToAppOpeningFile: subscribeToAppOpeningFileMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/rendererActiveTabState.js"),
    () => ({
        getRendererActiveTab: getRendererActiveTabMock,
        isRendererChartTab: isRendererChartTabMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        FitFileSelectors: {
            getRawData: getRawDataMock,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerBootstrap.js"),
    () => ({
        ensureChartStateManagerRegistered: () => ({
            clearChartState: clearChartStateMock,
            debouncedRender: debouncedRenderMock,
            forceRender: forceRenderMock,
            getChartInfo: getChartInfoMock,
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/tabs/tabStateManager.js"),
    () => ({
        tabStateManager: {
            getActiveTabInfo: getActiveTabInfoMock,
            switchToTab: switchToTabMock,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: showNotificationMock,
    })
);

import { ChartTabIntegration } from "../../../../../electron-app/utils/charts/core/chartTabIntegration.js";

function resetState(): void {
    stateValues.clear();
    stateListeners.clear();
    clearChartStateMock.mockClear();
    debouncedRenderMock.mockClear();
    forceRenderMock.mockClear();
    getChartInfoMock.mockClear();
    getActiveTabInfoMock.mockClear();
    switchToTabMock.mockClear();
    showNotificationMock.mockClear();
    getRawDataMock.mockClear();
    getRendererActiveTabMock.mockClear();
    isRendererChartTabMock.mockClear();
    subscribeToActiveFitRawDataChangeMock.mockClear();
    subscribeToAppOpeningFileMock.mockClear();
    getRawDataMock.mockImplementation(() => stateValues.get("fitFile.rawData"));
    getRendererActiveTabMock.mockImplementation(() => {
        const activeTab = stateValues.get("ui.activeTab");
        return typeof activeTab === "string" ? activeTab : "summary";
    });
    isRendererChartTabMock.mockImplementation(
        (tabName) => tabName === "chart" || tabName === "chartjs"
    );
    document.body.replaceChildren();
}

describe(ChartTabIntegration, () => {
    it("enables the chart tab and renders when active data arrives", () => {
        expect.assertions(4);

        resetState();
        stateValues.set("ui.activeTab", "chartjs");
        const button = document.createElement("button");
        button.id = "tab_chartjs";
        button.disabled = true;
        button.classList.add("disabled");
        document.body.append(button);
        const integration = new ChartTabIntegration(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        integration.handleDataChange({ recordMesgs: [{ timestamp: 1 }] });

        expect(button).toHaveProperty("disabled", false);
        expect(button.className).toBe("");
        expect(button.style.opacity).toBe("1");
        expect(debouncedRenderMock).toHaveBeenCalledWith(
            "New data loaded via integration"
        );

        logSpy.mockRestore();
    });

    it("disables the chart tab and clears chart state when data is cleared", () => {
        expect.assertions(4);

        resetState();
        const button = document.createElement("button");
        button.id = "tab_chart";
        document.body.append(button);
        const integration = new ChartTabIntegration(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        integration.handleDataChange(null);

        expect(button).toHaveProperty("disabled", true);
        expect(button.classList.contains("disabled")).toBe(true);
        expect(button.style.opacity).toBe("0.5");
        expect(clearChartStateMock).toHaveBeenCalledOnce();

        logSpy.mockRestore();
    });

    it("subscribes to state changes without exposing a global singleton", () => {
        expect.assertions(7);

        resetState();
        stateValues.set("ui.activeTab", "chartjs");
        stateValues.set("fitFile.rawData", { recordMesgs: [{}] });
        const integration = new ChartTabIntegration(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        integration.initialize();
        stateListeners.get("fitFile.rawData")?.(
            { recordMesgs: [{}] },
            { recordMesgs: [] },
            "fitFile.rawData"
        );
        stateListeners.get("app.isOpeningFile")?.(
            false,
            true,
            "app.isOpeningFile"
        );

        expect({ isInitialized: integration.isInitialized }).toStrictEqual({
            isInitialized: true,
        });
        expect(subscribeToActiveFitRawDataChangeMock).toHaveBeenCalledWith(
            expect.any(Function)
        );
        expect(subscribeToAppOpeningFileMock).toHaveBeenCalledWith(
            expect.any(Function)
        );
        expect(stateListeners.get("fitFile.rawData")).toBeTypeOf("function");
        expect(stateListeners.get("app.isOpeningFile")).toBeTypeOf("function");
        expect(Reflect.has(globalThis, "chartTabIntegration")).toBe(false);
        expect(debouncedRenderMock).toHaveBeenCalledWith(
            "Integration check after file load"
        );

        logSpy.mockRestore();
    });

    it("blocks manual refresh and tab switching without loaded data", () => {
        expect.assertions(3);

        resetState();
        const integration = new ChartTabIntegration();

        expect({
            refreshResult: integration.refreshCharts("test refresh"),
            switchResult: integration.switchToChartTab(),
        }).toStrictEqual({ refreshResult: false, switchResult: false });
        expect(forceRenderMock).not.toHaveBeenCalled();
        expect(showNotificationMock).toHaveBeenCalledTimes(2);
    });

    it("reports status and delegates tab switching when data exists", () => {
        expect.assertions(4);

        resetState();
        stateValues.set("fitFile.rawData", { recordMesgs: [{}] });
        stateValues.set("ui.activeTab", "chart");
        const integration = new ChartTabIntegration();

        expect({
            refreshResult: integration.refreshCharts("test refresh"),
            switchResult: integration.switchToChartTab(),
        }).toStrictEqual({ refreshResult: true, switchResult: true });
        expect(forceRenderMock).toHaveBeenCalledWith("test refresh");
        expect(switchToTabMock).toHaveBeenCalledWith("chartjs");
        expect(integration.getStatus()).toStrictEqual({
            chartState: { isRendered: false },
            chartTabActive: true,
            hasData: true,
            isInitialized: false,
            tabState: { name: "chart" },
        });
    });
});

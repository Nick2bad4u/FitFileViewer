import { describe, expect, it, vi } from "vitest";

type StateListener = (
    newValue: unknown,
    oldValue: unknown,
    path: string
) => void;

const stateValues = vi.hoisted(() => new Map<string, unknown>());
const stateListeners = vi.hoisted(() => new Map<string, StateListener>());

const getStateMock = vi.hoisted(() =>
    vi.fn<(path: string) => unknown>((path) => stateValues.get(path))
);
const subscribeMock = vi.hoisted(() =>
    vi.fn<(path: string, callback: StateListener) => () => void>(
        (path, callback) => {
            stateListeners.set(path, callback);
            return () => {
                stateListeners.delete(path);
            };
        }
    )
);

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

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: getStateMock,
        subscribe: subscribeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManager.js"),
    () => ({
        chartStateManager: {
            clearChartState: clearChartStateMock,
            debouncedRender: debouncedRenderMock,
            forceRender: forceRenderMock,
            getChartInfo: getChartInfoMock,
        },
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

type ChartTabIntegrationTestGlobal = typeof globalThis & {
    chartTabIntegration?: ChartTabIntegration;
};

const testGlobal = globalThis as ChartTabIntegrationTestGlobal;

function resetState(): void {
    stateValues.clear();
    stateListeners.clear();
    getStateMock.mockClear();
    subscribeMock.mockClear();
    clearChartStateMock.mockClear();
    debouncedRenderMock.mockClear();
    forceRenderMock.mockClear();
    getChartInfoMock.mockClear();
    getActiveTabInfoMock.mockClear();
    switchToTabMock.mockClear();
    showNotificationMock.mockClear();
    document.body.replaceChildren();
    delete testGlobal.chartTabIntegration;
}

describe(ChartTabIntegration, () => {
    it("enables the chart tab and renders when active data arrives", () => {
        expect.assertions(3);

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

        expect({
            disabled: button.disabled,
            hasDisabledClass: button.classList.contains("disabled"),
        }).toStrictEqual({ disabled: false, hasDisabledClass: false });
        expect(button.style.opacity).toBe("1");
        expect(debouncedRenderMock).toHaveBeenCalledWith(
            "New data loaded via integration"
        );

        logSpy.mockRestore();
    });

    it("disables the chart tab and clears chart state when data is cleared", () => {
        expect.assertions(3);

        resetState();
        const button = document.createElement("button");
        button.id = "tab_chart";
        document.body.append(button);
        const integration = new ChartTabIntegration(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        integration.handleDataChange(null);

        expect({
            disabled: button.disabled,
            hasDisabledClass: button.classList.contains("disabled"),
        }).toStrictEqual({ disabled: true, hasDisabledClass: true });
        expect(button.style.opacity).toBe("0.5");
        expect(clearChartStateMock).toHaveBeenCalledOnce();

        logSpy.mockRestore();
    });

    it("subscribes to state changes and exposes the singleton-compatible global", () => {
        expect.assertions(7);

        resetState();
        stateValues.set("ui.activeTab", "chartjs");
        stateValues.set("globalData", { recordMesgs: [{}] });
        const integration = new ChartTabIntegration(),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        integration.initialize();
        stateListeners.get("globalData")?.(
            { recordMesgs: [{}] },
            { recordMesgs: [] },
            "globalData"
        );
        stateListeners.get("app.isOpeningFile")?.(
            false,
            true,
            "app.isOpeningFile"
        );

        const firstSubscribeCall = subscribeMock.mock.calls[0],
            secondSubscribeCall = subscribeMock.mock.calls[1];

        expect({ isInitialized: integration.isInitialized }).toStrictEqual({
            isInitialized: true,
        });
        expect(firstSubscribeCall?.[0]).toBe("globalData");
        expect(firstSubscribeCall?.[1]).toBeTypeOf("function");
        expect(secondSubscribeCall?.[0]).toBe("app.isOpeningFile");
        expect(secondSubscribeCall?.[1]).toBeTypeOf("function");
        expect(testGlobal.chartTabIntegration).toBe(integration);
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
        stateValues.set("globalData", { recordMesgs: [{}] });
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

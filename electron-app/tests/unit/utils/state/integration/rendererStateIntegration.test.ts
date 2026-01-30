import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const switchTabMock = vi.fn();
const loadFileMock = vi.fn();
const renderChartMock = vi.fn();
const renderMapMock = vi.fn();
const renderTableMock = vi.fn();
const switchThemeMock = vi.fn();

const hasDataMock = vi.fn();
const isTabActiveMock = vi.fn();
const areChartsRenderedMock = vi.fn();
const isMapRenderedMock = vi.fn();
const areTablesRenderedMock = vi.fn();

const toggleChartControlsMock = vi.fn();

const getStateMock = vi.fn();
const setStateMock = vi.fn();
const subscribeMock = vi.fn();

const initializeCompleteStateSystemMock = vi.fn();

type SubscriptionHandler = (value: unknown) => void;

let subscriptionHandlers: Map<string, SubscriptionHandler[]>;
let unsubscribeRegistry: Map<SubscriptionHandler, ReturnType<typeof vi.fn>>;
let stateStore: Map<string, unknown>;

vi.mock("../../../../../utils/app/lifecycle/appActions.js", () => ({
    AppActions: {
        switchTab: switchTabMock,
        loadFile: loadFileMock,
        renderChart: renderChartMock,
        renderMap: renderMapMock,
        renderTable: renderTableMock,
        switchTheme: switchThemeMock,
    },
    AppSelectors: {
        hasData: hasDataMock,
        isTabActive: isTabActiveMock,
        areChartsRendered: areChartsRenderedMock,
        isMapRendered: isMapRenderedMock,
        areTablesRendered: areTablesRenderedMock,
    },
}));

vi.mock("../../../../../utils/state/core/stateManager.js", () => ({
    getState: getStateMock,
    setState: setStateMock,
    subscribe: subscribeMock,
}));

vi.mock("../../../../../utils/state/domain/uiStateManager.js", () => ({
    UIActions: {
        toggleChartControls: toggleChartControlsMock,
    },
}));

vi.mock("../../../../../utils/state/integration/stateIntegration.js", () => ({
    initializeCompleteStateSystem: initializeCompleteStateSystemMock,
}));

async function importTarget() {
    return import("../../../../../utils/state/integration/rendererStateIntegration.js");
}

function getHandlers(key: string): SubscriptionHandler[] {
    return subscriptionHandlers.get(key) ?? [];
}

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    subscriptionHandlers = new Map();
    unsubscribeRegistry = new Map();
    stateStore = new Map<string, unknown>();

    stateStore.set("ui.activeTab", "summary");
    stateStore.set("ui.theme", "light");
    stateStore.set("isLoading", false);
    stateStore.set("charts.controlsVisible", false);

    subscribeMock.mockImplementation(
        (key: string, handler: SubscriptionHandler) => {
            const handlers = subscriptionHandlers.get(key) ?? [];
            handlers.push(handler);
            subscriptionHandlers.set(key, handlers);

            const unsubscribe = vi.fn(() => {
                const currentHandlers = subscriptionHandlers.get(key);
                if (!currentHandlers) {
                    return;
                }
                const index = currentHandlers.indexOf(handler);
                if (index !== -1) {
                    currentHandlers.splice(index, 1);
                }
            });
            unsubscribeRegistry.set(handler, unsubscribe);
            return unsubscribe;
        }
    );

    getStateMock.mockImplementation((key: string) => stateStore.get(key));
    setStateMock.mockImplementation((key: string, value: unknown) => {
        stateStore.set(key, value);
    });

    hasDataMock.mockReturnValue(true);
    isTabActiveMock.mockImplementation(
        (tab: string) => tab === stateStore.get("ui.activeTab")
    );
    areChartsRenderedMock.mockReturnValue(false);
    isMapRenderedMock.mockReturnValue(false);
    areTablesRenderedMock.mockReturnValue(false);

    document.body.innerHTML = "";
    document.head.innerHTML = "";
    delete (globalThis as any).electronAPI;
});

afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    delete (globalThis as any).electronAPI;
});

describe("rendererStateIntegration", () => {
    it("exampleStateUsage interacts with state, actions, and subscriptions", async () => {
        vi.useFakeTimers();
        stateStore.set("ui.activeTab", "summary");
        stateStore.set("ui.theme", "light");
        stateStore.set("isLoading", false);

        hasDataMock.mockReturnValue(true);
        isTabActiveMock.mockImplementation((tab: string) => tab === "chart");

        const module = await importTarget();

        module.exampleStateUsage();

        expect(getStateMock).toHaveBeenCalledWith("ui.activeTab");
        expect(getStateMock).toHaveBeenCalledWith("ui.theme");
        expect(getStateMock).toHaveBeenCalledWith("isLoading");

        expect(setStateMock).toHaveBeenCalledWith(
            "ui.theme",
            "dark",
            expect.objectContaining({ source: "exampleFunction" })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            true,
            expect.objectContaining({ source: "exampleFunction" })
        );

        expect(switchTabMock).toHaveBeenCalledWith("chart");
        expect(loadFileMock).toHaveBeenCalledWith(
            { records: [] },
            "path/to/file.fit"
        );
        expect(toggleChartControlsMock).toHaveBeenCalled();
        expect(hasDataMock).toHaveBeenCalled();
        expect(isTabActiveMock).toHaveBeenCalledWith("chart");

        const handlers = getHandlers("ui.activeTab");
        expect(handlers.length).toBe(1);
        const unsubscribe = unsubscribeRegistry.get(handlers[0]);
        if (!unsubscribe) {
            throw new Error(
                "Expected unsubscribe handler for exampleStateUsage subscription"
            );
        }

        vi.advanceTimersByTime(5000);
        expect(unsubscribe).toHaveBeenCalled();
    });

    it("initializeRendererWithNewStateSystem wires subscriptions and responds to changes", async () => {
        const tabContentSummary = document.createElement("div");
        tabContentSummary.className = "tab-content";
        tabContentSummary.dataset.tabContent = "summary";
        document.body.append(tabContentSummary);

        const tabContentChart = document.createElement("div");
        tabContentChart.className = "tab-content";
        tabContentChart.dataset.tabContent = "chart";
        document.body.append(tabContentChart);

        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "chartjs-settings-wrapper";
        document.body.append(settingsWrapper);

        const tabButton = document.createElement("button");
        tabButton.dataset.tab = "map";
        document.body.append(tabButton);

        const themeButton = document.createElement("button");
        themeButton.dataset.theme = "dark";
        document.body.append(themeButton);

        let fileOpenCallback:
            | ((data: unknown, path: string) => void)
            | undefined;
        (globalThis as any).electronAPI = {
            onFileOpened: vi.fn(
                (handler: (data: unknown, path: string) => void) => {
                    fileOpenCallback = handler;
                }
            ),
        };

        const module = await importTarget();

        module.initializeRendererWithNewStateSystem();

        expect(initializeCompleteStateSystemMock).toHaveBeenCalled();
        expect((globalThis as any).electronAPI.onFileOpened).toHaveBeenCalled();

        fileOpenCallback?.({ foo: "bar" }, "sample.fit");
        expect(loadFileMock).toHaveBeenCalledWith({ foo: "bar" }, "sample.fit");

        tabButton.click();
        expect(switchTabMock).toHaveBeenCalledWith("map");

        themeButton.click();
        expect(switchThemeMock).toHaveBeenCalledWith("dark");

        const activeTabHandlers = getHandlers("ui.activeTab");
        expect(activeTabHandlers.length).toBeGreaterThanOrEqual(2);
        const [componentHandler, reactiveHandler] = activeTabHandlers;
        if (!componentHandler || !reactiveHandler) {
            throw new Error(
                "Expected component and reactive handlers for ui.activeTab"
            );
        }

        switchTabMock.mockClear();
        hasDataMock.mockReturnValue(false);
        componentHandler("map");
        expect(switchTabMock).toHaveBeenCalledWith("summary");

        hasDataMock.mockReturnValue(true);
        stateStore.set("globalData", { data: true });
        areChartsRenderedMock.mockReturnValue(false);
        isMapRenderedMock.mockReturnValue(false);
        areTablesRenderedMock.mockReturnValue(false);

        setStateMock.mockClear();
        componentHandler("map");
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            true,
            expect.objectContaining({ source: "loadMapTab" })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            false,
            expect.objectContaining({ source: "loadMapTab" })
        );

        setStateMock.mockClear();
        componentHandler("chart");
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            true,
            expect.objectContaining({ source: "loadChartTab" })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            false,
            expect.objectContaining({ source: "loadChartTab" })
        );

        setStateMock.mockClear();
        componentHandler("table");
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            true,
            expect.objectContaining({ source: "loadTableTab" })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            false,
            expect.objectContaining({ source: "loadTableTab" })
        );

        reactiveHandler("chart");
        expect(tabContentSummary.style.display).toBe("none");
        expect(tabContentChart.style.display).toBe("block");

        const themeHandlers = getHandlers("ui.theme");
        expect(themeHandlers.length).toBeGreaterThan(0);
        const themeHandler = themeHandlers[0];
        if (!themeHandler) {
            throw new Error("Expected theme handler");
        }
        themeHandler("dark");
        expect(document.documentElement.dataset.theme).toBe("dark");

        const controlsHandlers = getHandlers("charts.controlsVisible");
        expect(controlsHandlers.length).toBeGreaterThan(0);
        const controlsHandler = controlsHandlers[0];
        if (!controlsHandler) {
            throw new Error("Expected controls visibility handler");
        }
        controlsHandler(true);
        expect(settingsWrapper.style.display).toBe("block");
        controlsHandler(false);
        expect(settingsWrapper.style.display).toBe("none");

        const globalHandlers = getHandlers("globalData");
        expect(globalHandlers.length).toBeGreaterThan(0);
        const globalHandler = globalHandlers[0];
        if (!globalHandler) {
            throw new Error("Expected globalData handler");
        }
        setStateMock.mockClear();
        stateStore.set("ui.activeTab", "chart");
        globalHandler({ rows: [] });
        expect(setStateMock).toHaveBeenCalledWith(
            "charts.isRendered",
            false,
            expect.objectContaining({
                source: "updateAllComponents",
                silent: true,
            })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "map.isRendered",
            false,
            expect.objectContaining({
                source: "updateAllComponents",
                silent: true,
            })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "tables.isRendered",
            false,
            expect.objectContaining({
                source: "updateAllComponents",
                silent: true,
            })
        );
        expect(setStateMock).toHaveBeenCalledWith(
            "isLoading",
            true,
            expect.objectContaining({ source: "loadChartTab" })
        );

        const chartRenderedHandlers = getHandlers("charts.isRendered");
        expect(chartRenderedHandlers.length).toBeGreaterThan(0);
        const chartRenderedHandler = chartRenderedHandlers[0];
        if (!chartRenderedHandler) {
            throw new Error("Expected charts.isRendered handler");
        }
        chartRenderedHandler(true);

        const loadingHandlers = getHandlers("isLoading");
        expect(loadingHandlers.length).toBeGreaterThan(0);
        const loadingHandler = loadingHandlers[0];
        if (!loadingHandler) {
            throw new Error("Expected isLoading handler");
        }
        loadingHandler(true);
    });

    it("migrateExistingRenderer provides guidance without throwing", async () => {
        const module = await importTarget();
        expect(() => module.migrateExistingRenderer()).not.toThrow();
    });
});

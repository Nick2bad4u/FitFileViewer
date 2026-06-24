import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type SubscriptionHandler = (value: unknown) => void;
type Unsubscribe = () => void;

const switchTabMock = vi.fn<(tab: string) => void>();
const loadFileMock = vi.fn<(data: unknown, filePath: string) => void>();
const renderChartMock = vi.fn<() => void>();
const renderMapMock = vi.fn<() => void>();
const renderTableMock = vi.fn<() => void>();
const switchThemeMock = vi.fn<(theme: string) => void>();

const hasDataMock = vi.fn<() => boolean>();
const isTabActiveMock = vi.fn<(tab: string) => boolean>();
const areChartsRenderedMock = vi.fn<() => boolean>();
const isMapRenderedMock = vi.fn<() => boolean>();
const areTablesRenderedMock = vi.fn<() => boolean>();

const toggleChartControlsMock = vi.fn<() => void>();
const getRawDataMock = vi.fn<() => unknown>();

const getStateMock = vi.fn<(key: string) => unknown>();
const setStateMock =
    vi.fn<(key: string, value: unknown, options?: unknown) => void>();
const subscribeMock =
    vi.fn<(key: string, handler: SubscriptionHandler) => Unsubscribe>();

const initializeCompleteStateSystemMock = vi.fn<() => void>();

let subscriptionHandlers: Map<string, SubscriptionHandler[]>;
let unsubscribeRegistry: Map<
    SubscriptionHandler,
    ReturnType<typeof vi.fn<Unsubscribe>>
>;
let stateStore: Map<string, unknown>;

vi.mock(
    import("../../../../../electron-app/utils/app/lifecycle/appActions.js"),
    () => ({
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
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: getStateMock,
        setState: setStateMock,
        subscribe: subscribeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        FitFileSelectors: {
            getLapMessages: () => {
                const rawData = getRawDataMock();
                if (rawData === null || typeof rawData !== "object") {
                    return [];
                }
                const lapMesgs = (rawData as { lapMesgs?: unknown }).lapMesgs;
                return Array.isArray(lapMesgs) ? lapMesgs : [];
            },
            getRawData: getRawDataMock,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/uiStateManager.js"),
    () => ({
        UIActions: {
            toggleChartControls: toggleChartControlsMock,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/integration/stateIntegration.js"),
    () => ({
        initializeCompleteStateSystem: initializeCompleteStateSystemMock,
    })
);

async function importTarget() {
    return import("../../../../../electron-app/utils/state/integration/rendererStateIntegration.js");
}

type RendererStateElectronApi = {
    onFileOpened: ReturnType<
        typeof vi.fn<(handler: (data: unknown, path: string) => void) => void>
    >;
};

function createElectronApiScope(api: RendererStateElectronApi): {
    readonly getElectronAPI: () => RendererStateElectronApi;
} {
    return {
        getElectronAPI: () => api,
    };
}

function getHandlers(key: string): SubscriptionHandler[] {
    return subscriptionHandlers.get(key) ?? [];
}

function requireValue<T>(value: T | undefined, message: string): T {
    if (value === undefined) {
        throw new Error(message);
    }

    return value;
}

beforeEach(async () => {
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

            const unsubscribe = vi.fn<Unsubscribe>(() => {
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
    getRawDataMock.mockImplementation(() => stateStore.get("fitFile.rawData"));

    hasDataMock.mockReturnValue(true);
    isTabActiveMock.mockImplementation(
        (tab: string) => tab === stateStore.get("ui.activeTab")
    );
    areChartsRenderedMock.mockReturnValue(false);
    isMapRenderedMock.mockReturnValue(false);
    areTablesRenderedMock.mockReturnValue(false);

    document.body.replaceChildren();
    document.head.replaceChildren();
});

afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    document.head.replaceChildren();
});

describe("rendererStateIntegration", () => {
    it("exampleStateUsage interacts with state, actions, and subscriptions", async () => {
        expect.assertions(12);

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
        expect(toggleChartControlsMock).toHaveBeenCalledWith();
        expect(hasDataMock).toHaveBeenCalledWith();
        expect(isTabActiveMock).toHaveBeenCalledWith("chart");

        const handlers = getHandlers("ui.activeTab");
        expect(handlers).toHaveLength(1);
        const unsubscribe = requireValue(
            unsubscribeRegistry.get(handlers[0]!),
            "Expected unsubscribe handler for exampleStateUsage subscription"
        );

        vi.advanceTimersByTime(5000);
        expect(unsubscribe).toHaveBeenCalledWith();
    });

    it("initializeRendererWithNewStateSystem wires subscriptions and responds to changes", async () => {
        expect.assertions(21);

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
        const rendererStateApi: RendererStateElectronApi = {
            onFileOpened: vi.fn<
                (handler: (data: unknown, path: string) => void) => void
            >((handler: (data: unknown, path: string) => void) => {
                fileOpenCallback = handler;
            }),
        };
        const electronApiScope = createElectronApiScope(rendererStateApi);

        const module = await importTarget();

        module.initializeRendererWithNewStateSystem({ electronApiScope });

        expect(initializeCompleteStateSystemMock).toHaveBeenCalledWith();
        expect(rendererStateApi.onFileOpened).toHaveBeenCalledWith(
            expect.any(Function)
        );

        requireValue(
            fileOpenCallback,
            "Expected file-open callback to be registered"
        )({ foo: "bar" }, "sample.fit");
        expect(loadFileMock).toHaveBeenCalledWith({ foo: "bar" }, "sample.fit");

        tabButton.click();
        expect(switchTabMock).toHaveBeenCalledWith("map");

        themeButton.click();
        expect(switchThemeMock).toHaveBeenCalledWith("dark");

        const activeTabHandlers = getHandlers("ui.activeTab");
        const [componentHandler, reactiveHandler] = activeTabHandlers;
        const requiredComponentHandler = requireValue(
            componentHandler,
            "Expected component handler for ui.activeTab"
        );
        const requiredReactiveHandler = requireValue(
            reactiveHandler,
            "Expected reactive handler for ui.activeTab"
        );

        switchTabMock.mockClear();
        hasDataMock.mockReturnValue(false);
        requiredComponentHandler("map");
        expect(switchTabMock).toHaveBeenCalledWith("summary");

        hasDataMock.mockReturnValue(true);
        stateStore.set("fitFile.rawData", { data: true });
        areChartsRenderedMock.mockReturnValue(false);
        isMapRenderedMock.mockReturnValue(false);
        areTablesRenderedMock.mockReturnValue(false);

        setStateMock.mockClear();
        requiredComponentHandler("map");
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
        requiredComponentHandler("chart");
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
        requiredComponentHandler("table");
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
        expect(getRawDataMock.mock.calls.length).toBeGreaterThanOrEqual(3);

        requiredReactiveHandler("chart");
        expect({
            chartDisplay: tabContentChart.style.display,
            summaryDisplay: tabContentSummary.style.display,
        }).toEqual({
            chartDisplay: "block",
            summaryDisplay: "none",
        });

        const themeHandlers = getHandlers("ui.theme");
        const themeHandler = requireValue(
            themeHandlers[0],
            "Expected theme handler"
        );
        themeHandler("dark");
        expect(document.documentElement.dataset.theme).toBe("dark");

        const controlsHandlers = getHandlers("charts.controlsVisible");
        const controlsHandler = requireValue(
            controlsHandlers[0],
            "Expected controls visibility handler"
        );
        controlsHandler(true);
        expect(settingsWrapper.style.display).toBe("block");
        controlsHandler(false);
        expect(settingsWrapper.style.display).toBe("none");

        const globalHandlers = getHandlers("fitFile.rawData");
        const globalHandler = requireValue(
            globalHandlers[0],
            "Expected fitFile.rawData handler"
        );
        setStateMock.mockClear();
        areChartsRenderedMock.mockClear();
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
        expect(areChartsRenderedMock).toHaveBeenCalledOnce();

        const chartRenderedHandlers = getHandlers("charts.isRendered");
        const chartRenderedHandler = requireValue(
            chartRenderedHandlers[0],
            "Expected charts.isRendered handler"
        );
        chartRenderedHandler(true);

        const loadingHandlers = getHandlers("isLoading");
        const loadingHandler = requireValue(
            loadingHandlers[0],
            "Expected isLoading handler"
        );
        loadingHandler(true);
    });

    it("migrateExistingRenderer provides guidance without throwing", async () => {
        expect.assertions(1);

        const module = await importTarget();
        expect(() => module.migrateExistingRenderer()).not.toThrow();
    });
});

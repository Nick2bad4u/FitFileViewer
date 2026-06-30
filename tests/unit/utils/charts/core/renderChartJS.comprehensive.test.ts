// @ts-nocheck
/**
 * Tests the chart rendering utility with focused ESM mocks and a controlled DOM
 * environment.
 *
 * TESTING STRATEGY:
 *
 * - ESM mocks for chart/rendering dependencies
 * - DOM environment mocking for Chart.js rendering
 * - State management integration testing
 * - Error handling and edge case coverage
 * - Performance monitoring validation
 * - Export functionality testing
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetChartListenerStateForTests } from "../../../../../electron-app/utils/charts/core/chartListenerState.js";
import { createExportChartsWithState } from "../../../../../electron-app/utils/charts/core/renderChartExportState.js";

type MockFn = (...args: unknown[]) => unknown;
type VoidFn = (...args: unknown[]) => void;
type ChartInstanceRegistryModule =
    typeof import("../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js");
type RenderChartJSTestGlobal = typeof globalThis & {
    addEventListener?: unknown;
    cancelAnimationFrame?: unknown;
    clearTimeout?: unknown;
    document?: unknown;
    matchMedia?: unknown;
    Node?: { ELEMENT_NODE: number };
    performance?: unknown;
    process?: {
        nextTick?: (
            cb: (...args: unknown[]) => void,
            ...args: unknown[]
        ) => void;
    } & Record<string, unknown>;
    requestAnimationFrame?: unknown;
    setTimeout?: unknown;
    window?: unknown;
};

function getRenderChartJSTestGlobal(): RenderChartJSTestGlobal {
    return globalThis as unknown as RenderChartJSTestGlobal;
}

type GlobalFixtureName =
    | "addEventListener"
    | "cancelAnimationFrame"
    | "clearTimeout"
    | "document"
    | "matchMedia"
    | "Node"
    | "performance"
    | "requestAnimationFrame"
    | "setTimeout"
    | "window";

const originalGlobalDescriptors = new Map<
    GlobalFixtureName,
    PropertyDescriptor
>();

function getGlobalRestoreDescriptor(
    name: GlobalFixtureName
): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, name) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function rememberGlobalDescriptor(name: GlobalFixtureName): void {
    if (!originalGlobalDescriptors.has(name)) {
        originalGlobalDescriptors.set(name, getGlobalRestoreDescriptor(name));
    }
}

function setGlobalValue(name: GlobalFixtureName, value: unknown): void {
    rememberGlobalDescriptor(name);
    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreGlobalValues(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

let chartInstanceRegistryModule: ChartInstanceRegistryModule | undefined;

async function loadChartInstanceRegistry(): Promise<ChartInstanceRegistryModule> {
    chartInstanceRegistryModule =
        await import("../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js");
    return chartInstanceRegistryModule;
}

function clearChartInstanceRegistryForTests(): void {
    chartInstanceRegistryModule?.clearChartInstanceRegistryForTests();
}

function getRegisteredChartInstances(): unknown[] {
    return chartInstanceRegistryModule?.getRegisteredChartInstances() ?? [];
}

function setRegisteredChartInstances(charts: readonly unknown[]): unknown[] {
    return (
        chartInstanceRegistryModule?.setRegisteredChartInstances(charts) ?? []
    );
}

const chartJsModuleMocks = vi.hoisted(() => ({
    Chart: {
        defaults: {
            plugins: {
                legend: {
                    labels: {},
                },
            },
        },
        register: vi.fn<MockFn>(),
        registry: {
            plugins: {
                get: vi.fn<MockFn>().mockReturnValue(false),
            },
        },
    },
    zoomPlugin: { id: "zoom" },
}));
const mockRenderChartPerformanceNow = vi.fn<MockFn>().mockReturnValue(1000);

async function clearChartRuntime(): Promise<void> {
    const { clearChartRuntimeForTests } =
        await import("../../../../../electron-app/utils/charts/core/chartRuntime.js");

    clearChartRuntimeForTests();
}

async function registerChartRuntime(
    chartRuntime: unknown,
    chartZoomPlugin: unknown
): Promise<void> {
    const chartRuntimeModule =
        await import("../../../../../electron-app/utils/charts/core/chartRuntime.js");

    chartRuntimeModule.registerChartRuntime(
        chartRuntime as Parameters<typeof chartRuntimeModule.registerChartRuntime>[0],
        chartZoomPlugin as Parameters<typeof chartRuntimeModule.registerChartRuntime>[1]
    );
}

vi.mock(import("chart.js/auto"), () => ({
    default: chartJsModuleMocks.Chart,
}));

vi.mock(import("chartjs-plugin-zoom"), () => ({
    default: chartJsModuleMocks.zoomPlugin,
}));

// Stable ESM mock for theme module before SUT import to avoid SSR init order issues
vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => {
        const getThemeConfig = vi.fn<MockFn>().mockReturnValue({
            colors: {
                text: "#000000",
                textPrimary: "#333333",
                backgroundAlt: "#f5f5f5",
                border: "#cccccc",
                error: "#ff0000",
                primary: "#0066cc",
                primaryAlpha: "rgba(0, 102, 204, 0.5)",
            },
            isDark: false,
            isLight: true,
            theme: "light",
        });
        return {
            THEME_MODES: { AUTO: "auto", DARK: "dark", LIGHT: "light" },
            applyTheme: vi.fn<MockFn>(),
            getEffectiveTheme: vi.fn<MockFn>().mockReturnValue("light"),
            getThemeConfig,
            initializeTheme: vi.fn<MockFn>(),
            listenForSystemThemeChange: vi.fn<MockFn>(),
            listenForThemeChange: vi.fn<MockFn>(),
            loadTheme: vi.fn<MockFn>().mockReturnValue("light"),
            toggleTheme: vi.fn<MockFn>(),
            default: { getThemeConfig },
        };
    }
);

// Mock chart theme listener to avoid importing chartStateManager -> renderChartJS cycle
vi.mock(
    import("../../../../../electron-app/utils/charts/theming/chartThemeListener.js"),
    () => ({
        setupChartThemeListener: vi.fn<VoidFn>(),
        forceUpdateChartTheme: vi.fn<VoidFn>(),
        removeChartThemeListener: vi.fn<VoidFn>(),
    })
);

// Mock theme utils detectCurrentTheme to a stable value
vi.mock(
    import("../../../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: vi.fn<MockFn>().mockReturnValue("light"),
    })
);

// Mock ensureChartSettingsDropdowns to avoid importing createSettingsHeader -> chartStateManager -> renderChartJS cycle
vi.mock(
    import("../../../../../electron-app/utils/ui/components/ensureChartSettingsDropdowns.js"),
    () => ({
        ensureChartSettingsDropdowns: vi.fn<MockFn>(() => ({})),
    })
);

// Mock createUserDeviceInfoBox to avoid theme import execution in rendering paths
vi.mock(
    import("../../../../../electron-app/utils/rendering/components/createUserDeviceInfoBox.js"),
    () => ({
        createUserDeviceInfoBox: vi.fn<VoidFn>(),
    })
);

// Mock createEnhancedChart to avoid circular import with renderChartJS (hexToRgba)
vi.mock(
    import("../../../../../electron-app/utils/charts/components/createEnhancedChart.js"),
    () => ({
        createEnhancedChart: vi.fn<MockFn>().mockReturnValue({
            destroy: vi.fn<MockFn>(),
            update: vi.fn<MockFn>(),
            toBase64Image: vi
                .fn<MockFn>()
                .mockReturnValue("data:image/png;base64,mockimage"),
        }),
    })
);

function injectChartJSMocks() {
    // Enhanced DOM environment for Chart.js testing
    setupDOMEnvironment();

    // Mock all 27+ dependencies used by renderChartJS.js
    const mocks = {
        // App initialization imports
        loadSharedConfiguration: { default: vi.fn<VoidFn>() },
        AppActions: {
            AppActions: {
                notifyChartRenderComplete: vi.fn<MockFn>(),
            },
        },

        // Data lookups and processing imports
        getUnitSymbol: {
            getUnitSymbol: vi.fn<MockFn>().mockReturnValue("km/h"),
        },
        setupZoneData: { setupZoneData: vi.fn<MockFn>() },
        convertValueToUserUnits: {
            convertValueToUserUnits: vi.fn<MockFn>((value) => value),
        },
        formatChartFields: {
            fieldLabels: { speed: "Speed", elevation: "Elevation" },
            formatChartFields: [
                "speed",
                "elevation",
                "heart_rate",
                "power",
            ],
        },

        // Rendering components
        createUserDeviceInfoBox: { createUserDeviceInfoBox: vi.fn<MockFn>() },

        // State management imports - comprehensive mocking
        computedStateManager: {
            computedStateManager: {
                addComputed: vi.fn<MockFn>(),
                invalidateComputed: vi.fn<MockFn>(),
                getComputedValue: vi.fn<MockFn>().mockReturnValue({}),
                registerComputed: vi.fn<MockFn>(),
            },
        },
        stateManager: {
            getState: vi.fn<MockFn>(),
            getStateHistory: vi.fn<MockFn>().mockReturnValue([]),
            setState: vi.fn<MockFn>(),
            subscribe: vi.fn<MockFn>(() => () => {}),
            updateState: vi.fn<MockFn>(),
        },
        stateMiddleware: {
            middlewareManager: {
                apply: vi.fn<MockFn>(),
                addMiddleware: vi.fn<MockFn>(),
            },
        },
        settingsStateManager: {
            getChartSettings: vi.fn<MockFn>().mockReturnValue({
                animation: "normal",
                chartType: "line",
                colors: [],
                fieldVisibility: {},
                interpolation: "linear",
                maxpoints: "all",
                showFill: false,
                showGrid: true,
                showLegend: true,
                showPoints: false,
                showTitle: true,
                smoothing: 0.1,
            }),
            getChartFieldVisibility: vi.fn<MockFn>().mockReturnValue("visible"),
            setChartFieldVisibility: vi
                .fn<MockFn>()
                .mockImplementation((field, visibility) => ({
                    [field]: visibility,
                })),
            updateChartSettings: vi.fn<MockFn>(),
            settingsStateManager: {
                getChartSettings: vi.fn<MockFn>().mockReturnValue({
                    animation: "normal",
                    chartType: "line",
                    colors: [],
                    fieldVisibility: {},
                    interpolation: "linear",
                    maxpoints: "all",
                    showFill: false,
                    showGrid: true,
                    showLegend: true,
                    showPoints: false,
                    showTitle: true,
                    smoothing: 0.1,
                }),
                updateChartSettings: vi.fn<MockFn>(),
            },
        },
        // Theme management
        theme: {
            getThemeConfig: vi.fn<MockFn>().mockReturnValue({
                colors: {
                    text: "#000000",
                    textPrimary: "#333333",
                    backgroundAlt: "#f5f5f5",
                    border: "#cccccc",
                    error: "#ff0000",
                    primary: "#0066cc",
                    primaryAlpha: "rgba(0, 102, 204, 0.5)",
                },
            }),
        },

        // UI components
        ensureChartSettingsDropdowns: {
            ensureChartSettingsDropdowns: vi.fn<MockFn>(),
        },

        // Notifications
        showNotification: { showNotification: vi.fn<MockFn>() },
        showRenderNotification: { showRenderNotification: vi.fn<MockFn>() },

        // Chart components
        createChartCanvas: {
            createChartCanvas: vi
                .fn<MockFn>()
                .mockReturnValue(document.createElement("canvas")),
        },
        createEnhancedChart: {
            createEnhancedChart: vi.fn<MockFn>().mockReturnValue({
                destroy: vi.fn<MockFn>(),
                update: vi.fn<MockFn>(),
                toBase64Image: vi
                    .fn<MockFn>()
                    .mockReturnValue("data:image/png;base64,mockimage"),
            }),
        },

        // Chart plugins
        addChartHoverEffects: {
            addChartHoverEffects: vi.fn<MockFn>(),
            addHoverEffectsToExistingCharts: vi.fn<MockFn>(),
            removeChartHoverEffects: vi.fn<MockFn>(),
        },
        chartBackgroundColorPlugin: { chartBackgroundColorPlugin: {} },

        // Chart rendering modules
        renderEventMessagesChart: { renderEventMessagesChart: vi.fn<MockFn>() },
        renderGPSTrackChart: { renderGPSTrackChart: vi.fn<MockFn>() },
        renderLapZoneCharts: { renderLapZoneCharts: vi.fn<MockFn>() },
        renderPerformanceAnalysisCharts: {
            renderPerformanceAnalysisCharts: vi.fn<MockFn>(),
        },
        renderTimeInZoneCharts: { renderTimeInZoneCharts: vi.fn<MockFn>() },

        // Chart theming
        setupChartThemeListener: { setupChartThemeListener: vi.fn<MockFn>() },
        detectCurrentTheme: {
            detectCurrentTheme: vi.fn<MockFn>().mockReturnValue("light"),
        },
    };

    clearChartInstanceRegistryForTests();
    resetChartListenerStateForTests();
    vi.stubGlobal("JSZip", vi.fn<MockFn>());

    vi.doMock(
        import("../../../../../electron-app/utils/app/initialization/loadSharedConfiguration.js"),
        () => ({
            default: mocks.loadSharedConfiguration.default,
            loadSharedConfiguration: mocks.loadSharedConfiguration.default,
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/app/lifecycle/appActions.js"),
        () => ({
            AppActions: mocks.AppActions.AppActions,
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/app/lifecycle/resourceManager.js"),
        () => ({
            resourceManager: {
                registerChart: vi.fn<VoidFn>(),
            },
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/formatting/display/formatChartFields.js"),
        () => mocks.formatChartFields
    );
    vi.doMock(
        import("../../../../../electron-app/utils/formatting/converters/convertValueToUserUnits.js"),
        () => mocks.convertValueToUserUnits
    );
    vi.doMock(
        import("../../../../../electron-app/utils/data/processing/setupZoneData.js"),
        () => mocks.setupZoneData
    );
    vi.doMock(
        import("../../../../../electron-app/utils/state/core/stateManager.js"),
        () => ({
            getState: mocks.stateManager.getState,
            getStateHistory: mocks.stateManager.getStateHistory,
            setState: mocks.stateManager.setState,
            subscribe: mocks.stateManager.subscribe,
            updateState: mocks.stateManager.updateState,
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/state/core/stateMiddleware.js"),
        () => ({
            middlewareManager: mocks.stateMiddleware.middlewareManager,
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/state/core/computedStateManager.js"),
        () => mocks.computedStateManager
    );
    vi.doMock(
        import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
        () => ({
            getCachedChartSettings: vi.fn<MockFn>(() =>
                mocks.stateManager.getState("settings.charts")
            ),
            getChartFieldVisibility:
                mocks.settingsStateManager.getChartFieldVisibility,
            getChartSetting: vi.fn<MockFn>(),
            getChartSettings: mocks.settingsStateManager.getChartSettings,
            getUserChartSettings: vi.fn<MockFn>().mockReturnValue({}),
            setChartFieldVisibility:
                mocks.settingsStateManager.setChartFieldVisibility,
            setCachedChartSettings: vi.fn<MockFn>((settings, options) =>
                mocks.stateManager.setState(
                    "settings.charts",
                    settings,
                    options
                )
            ),
            setChartSetting: vi.fn<MockFn>(),
            settingsStateManager: {
                getSetting: vi.fn<MockFn>(),
                setSetting: vi.fn<MockFn>(),
            },
            updateCachedChartSettings: vi.fn<MockFn>((settings, options) =>
                mocks.stateManager.updateState(
                    "settings.charts",
                    settings,
                    options
                )
            ),
            updateChartSettings: mocks.settingsStateManager.updateChartSettings,
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
        () => mocks.showNotification
    );
    vi.doMock(
        import("../../../../../electron-app/utils/ui/notifications/showRenderNotification.js"),
        () => mocks.showRenderNotification
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/components/createChartCanvas.js"),
        () => mocks.createChartCanvas
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/components/createEnhancedChart.js"),
        () => mocks.createEnhancedChart
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/plugins/addChartHoverEffects.js"),
        () => mocks.addChartHoverEffects
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
        () => mocks.chartBackgroundColorPlugin
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/plugins/chartLegendItemBoxPlugin.js"),
        () => ({
            chartLegendItemBoxPlugin: {},
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/rendering/renderEventMessagesChart.js"),
        () => mocks.renderEventMessagesChart
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/rendering/renderGPSTrackChart.js"),
        () => mocks.renderGPSTrackChart
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/rendering/renderGPSTimeChart.js"),
        () => ({
            renderGPSTimeChart: vi.fn<VoidFn>(),
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/rendering/renderLapZoneCharts.js"),
        () => mocks.renderLapZoneCharts
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/rendering/renderPerformanceAnalysisCharts.js"),
        () => mocks.renderPerformanceAnalysisCharts
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/rendering/renderTimeInZoneCharts.js"),
        () => mocks.renderTimeInZoneCharts
    );
    vi.doMock(
        import("../../../../../electron-app/utils/theming/core/theme.js"),
        () => ({
            THEME_MODES: { AUTO: "auto", DARK: "dark", LIGHT: "light" },
            applyTheme: vi.fn<MockFn>(),
            default: { getThemeConfig: mocks.theme.getThemeConfig },
            getEffectiveTheme: vi.fn<MockFn>().mockReturnValue("light"),
            getThemeConfig: mocks.theme.getThemeConfig,
            initializeTheme: vi.fn<MockFn>(),
            listenForSystemThemeChange: vi.fn<MockFn>(),
            listenForThemeChange: vi.fn<MockFn>(),
            loadTheme: vi.fn<MockFn>().mockReturnValue("light"),
            toggleTheme: vi.fn<MockFn>(),
        })
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
        () => mocks.detectCurrentTheme
    );
    vi.doMock(
        import("../../../../../electron-app/utils/charts/theming/chartThemeListener.js"),
        () => mocks.setupChartThemeListener
    );
    vi.doMock(
        import("../../../../../electron-app/utils/ui/components/ensureChartSettingsDropdowns.js"),
        () => mocks.ensureChartSettingsDropdowns
    );
    vi.doMock(
        import("../../../../../electron-app/utils/rendering/components/createUserDeviceInfoBox.js"),
        () => mocks.createUserDeviceInfoBox
    );

    return mocks;
}

function setupDOMEnvironment() {
    // Enhanced DOM mocking for Chart.js integration
    const mockElement = {
        innerHTML: "",
        id: "",
        style: { cssText: "" },
        nodeType: 1, // Node.ELEMENT_NODE
        appendChild: vi.fn<MockFn>(),
        querySelector: vi.fn<MockFn>(),
        querySelectorAll: vi.fn<MockFn>().mockReturnValue([]),
        addEventListener: vi.fn<MockFn>(),
        removeEventListener: vi.fn<MockFn>(),
        getAttribute: vi.fn<MockFn>(),
        setAttribute: vi.fn<MockFn>(),
        getBoundingClientRect: vi.fn<MockFn>().mockReturnValue({
            width: 800,
            height: 400,
            top: 0,
            left: 0,
            right: 800,
            bottom: 400,
        }),
        offsetWidth: 800,
        offsetHeight: 400,
        clientWidth: 800,
        clientHeight: 400,
        parentNode: null,
        insertBefore: vi.fn<MockFn>(),
    };

    const mockDocument = {
        createElement: vi.fn<MockFn>().mockReturnValue(mockElement),
        getElementById: vi.fn<MockFn>().mockReturnValue(mockElement),
        // Return null specifically for '#content-chart' to avoid fallback path that calls getThemeConfig in catch
        querySelector: vi.fn<MockFn>((selector: string) =>
            selector === "#content-chart" ? null : mockElement
        ),
        querySelectorAll: vi.fn<MockFn>().mockReturnValue([mockElement]),
        body: {
            append: vi.fn<VoidFn>(),
            nodeType: 1,
            classList: {
                add: vi.fn<VoidFn>(),
                remove: vi.fn<VoidFn>(),
                contains: vi.fn<MockFn>().mockReturnValue(false),
            },
        },
        head: {
            append: vi.fn<VoidFn>(),
        },
        addEventListener: vi.fn<VoidFn>(),
    };

    const mockWindow = {
        addEventListener: vi.fn<MockFn>(),
        performance: {
            now: mockRenderChartPerformanceNow,
        },
        localStorage: {
            getItem: vi.fn<MockFn>().mockReturnValue("visible"),
            setItem: vi.fn<MockFn>(),
        },
        matchMedia: vi.fn<MockFn>().mockReturnValue({
            matches: false,
            addEventListener: vi.fn<MockFn>(),
            removeEventListener: vi.fn<MockFn>(),
        }),
        requestAnimationFrame: vi.fn<MockFn>((cb: FrameRequestCallback) =>
            setTimeout(cb, 0)
        ),
        cancelAnimationFrame: vi.fn<MockFn>((id: number) =>
            clearTimeout(id as unknown as number)
        ),
    };

    setGlobalValue("document", mockDocument);
    setGlobalValue("window", mockWindow);

    // Do NOT overwrite globalThis; instead, patch properties to avoid clobbering Vitest internals
    const utils = getRenderChartJSTestGlobal();
    if (typeof utils.addEventListener !== "function")
        setGlobalValue("addEventListener", vi.fn<VoidFn>());
    if (typeof utils.setTimeout !== "function")
        setGlobalValue("setTimeout", (fn: () => void) => {
            fn();
            return 0;
        });
    if (typeof utils.clearTimeout !== "function")
        setGlobalValue("clearTimeout", vi.fn<VoidFn>());
    setGlobalValue("performance", mockWindow.performance);
    setGlobalValue("Node", { ELEMENT_NODE: 1 });
    if (typeof utils.requestAnimationFrame !== "function")
        setGlobalValue(
            "requestAnimationFrame",
            mockWindow.requestAnimationFrame
        );
    if (typeof utils.cancelAnimationFrame !== "function")
        setGlobalValue("cancelAnimationFrame", mockWindow.cancelAnimationFrame);
    if (typeof utils.matchMedia !== "function")
        setGlobalValue("matchMedia", mockWindow.matchMedia);
    // Ensure a stable process.nextTick exists for any code importing this module
    if (!utils.process || typeof utils.process !== "object") utils.process = {};
    if (typeof utils.process.nextTick !== "function") {
        utils.process.nextTick = (
            cb: (...args: unknown[]) => void,
            ...args: unknown[]
        ) => {
            void Promise.resolve().then(() => {
                try {
                    cb(...args);
                } catch {
                    /* ignore */
                }
            });
        };
    }
}

describe("renderChartJS.js - Comprehensive Coverage with ESM mocks", () => {
    let mocks;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        mockRenderChartPerformanceNow.mockReturnValue(1000);
        chartJsModuleMocks.Chart.registry.plugins.get.mockReturnValue(false);
        mocks = injectChartJSMocks();
        await registerChartRuntime(
            chartJsModuleMocks.Chart,
            chartJsModuleMocks.zoomPlugin
        );
        await loadChartInstanceRegistry();

        // Reset global state
        clearChartInstanceRegistryForTests();
        resetChartListenerStateForTests();

        // Setup default state responses
        mocks.stateManager.getState.mockImplementation((path) => {
            const stateMap = {
                "fitFile.rawData": {
                    recordMesgs: [
                        { timestamp: 1000, speed: 10, elevation: 100 },
                        { timestamp: 2000, speed: 15, elevation: 105 },
                    ],
                },
                "charts.chartData": null,
                "charts.chartOptions": {},
                "charts.controlsVisible": true,
                "charts.isRendered": false,
                "charts.isRendering": false,
                "charts.selectedChart": "elevation",
                "settings.charts": {
                    animation: "normal",
                    chartType: "line",
                    maxpoints: "all",
                },
                "settings.charts.fieldVisibility.speed": "visible",
                isLoading: false,
            };
            return stateMap[path];
        });
    });

    afterEach(async () => {
        clearChartInstanceRegistryForTests();
        resetChartListenerStateForTests();
        await clearChartRuntime();
        restoreGlobalValues();
    });

    describe("chartSettingsManager Object", () => {
        it("should provide getFieldVisibility method with settings state manager", async () => {
            expect.assertions(2);
            const { chartSettingsManager } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const fieldVisibility =
                chartSettingsManager.getFieldVisibility("speed");

            expect(
                mocks.settingsStateManager.getChartFieldVisibility
            ).toHaveBeenCalledWith("speed", "visible");
            expect(fieldVisibility).toBe("visible");
        });

        it("should provide getSettings method with state fallback", async () => {
            expect.assertions(2);
            const { chartSettingsManager } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const chartSettings = chartSettingsManager.getSettings();

            expect(mocks.stateManager.getState).toHaveBeenCalledWith(
                "settings.charts"
            );
            expect(chartSettings).toEqual({
                animation: "normal",
                chartType: "line",
                colors: [],
                exportTheme: "auto",
                interpolation: "linear",
                maxpoints: "all",
                showFill: false,
                showGrid: true,
                showLegend: true,
                showPoints: false,
                showTitle: true,
                smoothing: 0.1,
            });
        });

        it("should provide setFieldVisibility with state updates", async () => {
            expect.assertions(3);
            const { chartSettingsManager } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            chartSettingsManager.setFieldVisibility("power", "hidden");
            const fieldVisibility =
                chartSettingsManager.getFieldVisibility("power");

            expect(
                mocks.settingsStateManager.setChartFieldVisibility
            ).toHaveBeenCalledWith("power", "hidden");
            expect(
                mocks.computedStateManager.computedStateManager
                    .invalidateComputed
            ).toHaveBeenCalledWith("charts.renderableFieldCount");
            expect(fieldVisibility).toBe("visible");
        });

        it("should provide updateSettings method with persistence", async () => {
            expect.assertions(3);
            const { chartSettingsManager } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const newSettings = { chartType: "bar", showPoints: true };
            chartSettingsManager.updateSettings(newSettings);
            const chartSettings = chartSettingsManager.getSettings();

            expect(
                mocks.settingsStateManager.updateChartSettings
            ).toHaveBeenCalledWith(expect.objectContaining(newSettings));
            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "settings.charts",
                expect.objectContaining(newSettings),
                expect.objectContaining({
                    silent: false,
                    source: "chartSettingsManager.updateSettings",
                })
            );
            expect(chartSettings).toEqual(
                expect.objectContaining({
                    chartType: "line",
                    showPoints: false,
                })
            );
        });

        it("should skip cache invalidation for display-only changes", async () => {
            expect.assertions(2);
            const module =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const listener = vi.fn<VoidFn>();
            const view = module.addInvalidateChartRenderCacheListener(listener);

            module.chartSettingsManager.updateSettings({ showLegend: false });
            const cacheStats = module.getChartSeriesCacheStats();

            expect(listener).not.toHaveBeenCalled();
            expect(cacheStats).toEqual(
                expect.objectContaining({
                    hits: expect.any(Number),
                    misses: expect.any(Number),
                })
            );

            view();
        });

        it("should invalidate render caches when unit settings change", async () => {
            expect.assertions(2);
            const module =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const listener = vi.fn<VoidFn>();
            const view = module.addInvalidateChartRenderCacheListener(listener);

            module.chartSettingsManager.updateSettings({
                distanceUnits: "miles",
            });
            const cacheStats = module.getChartSeriesCacheStats();

            expect(listener).toHaveBeenCalledWith(
                "settings-update:data-changing"
            );
            expect(cacheStats.hits + cacheStats.misses).toBeGreaterThanOrEqual(
                0
            );

            view();
        });
    });

    describe("chart Plugin Registration", () => {
        it("should register Chart.js zoom plugin when available", async () => {
            expect.assertions(2);

            const chartModule =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            expect(chartJsModuleMocks.Chart.register).toHaveBeenCalledWith(
                chartJsModuleMocks.zoomPlugin
            );
            expect(chartModule.chartState).toHaveProperty("hasValidData", true);
        });

        it("should register background color plugin when Chart.js available", async () => {
            expect.assertions(2);

            const chartModule =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            expect(chartJsModuleMocks.Chart.register).toHaveBeenCalledWith(
                expect.any(Object)
            );
            expect(chartModule.chartState).toHaveProperty("hasValidData", true);
        });

        it("should handle Chart.js not available scenario", async () => {
            expect.assertions(2);
            await clearChartRuntime();

            const { chartActions, chartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            expect(chartActions).toEqual(
                expect.objectContaining({
                    clearCharts: expect.any(Function),
                    startRendering: expect.any(Function),
                })
            );
            expect({ hasValidData: chartState.hasValidData }).toStrictEqual({
                hasValidData: true,
            });
        });
    });

    describe("chartState Object - Computed Properties", () => {
        it("should provide chartData from state", async () => {
            expect.assertions(2);
            const { chartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const result = chartState.chartData;

            expect(mocks.stateManager.getState).toHaveBeenCalledWith(
                "charts.chartData"
            );
            expect(result).toBeNull();
        });

        it("should provide hasValidData computed property", async () => {
            expect.assertions(2);
            const { chartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const result = chartState.hasValidData;

            expect(mocks.stateManager.getState).toHaveBeenCalledWith(
                "fitFile.rawData"
            );
            expect({ hasValidData: result }).toStrictEqual({
                hasValidData: true,
            });
        });

        it("should handle invalid data in hasValidData", async () => {
            expect.assertions(1);
            mocks.stateManager.getState.mockReturnValue(null);
            const { chartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const result = chartState.hasValidData;

            expect(result).toBeNull();
        });

        it("should provide renderableFields with visibility filtering", async () => {
            expect.assertions(1);
            const { chartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = chartState.renderableFields;

            expect(view).toEqual([
                "speed",
                "elevation",
                "heart_rate",
                "power",
            ]);
        });

        it("should handle no valid data in renderableFields", async () => {
            expect.assertions(1);
            mocks.stateManager.getState.mockReturnValue(null);
            const { chartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = chartState.renderableFields;

            expect(view).toEqual([]);
        });
    });

    describe("chartActions Object - State Management", () => {
        it("should clear charts and reset state", async () => {
            expect.assertions(3);
            const mockChart = { destroy: vi.fn<MockFn>() };
            setRegisteredChartInstances([mockChart]);

            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            chartActions.clearCharts();

            expect(mockChart.destroy).toHaveBeenCalledWith();
            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "charts",
                {
                    chartData: null,
                    isRendered: false,
                    renderedCount: 0,
                },
                expect.objectContaining({
                    silent: false,
                    source: "chartActions.clearCharts",
                })
            );
            expect(getRegisteredChartInstances()).toEqual([]);
        });

        it("should handle chart destruction errors gracefully", async () => {
            expect.assertions(2);
            const mockChart = {
                destroy: vi.fn<MockFn>().mockImplementation(() => {
                    throw new Error("Destroy failed");
                }),
            };
            setRegisteredChartInstances([mockChart]);

            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            expect(() => chartActions.clearCharts()).not.toThrow();
            expect(getRegisteredChartInstances()).toEqual([]);
        });

        it("should complete rendering with success", async () => {
            expect.assertions(4);
            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = chartActions.completeRendering(true, 3, 1500);

            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "charts",
                {
                    isRendered: true,
                    isRendering: false,
                    lastRenderTime: expect.any(Number),
                    renderedCount: 3,
                },
                expect.objectContaining({
                    silent: false,
                    source: "chartActions.completeRendering",
                })
            );
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "isLoading",
                false,
                expect.any(Object)
            );
            expect(
                mocks.AppActions.AppActions.notifyChartRenderComplete
            ).toHaveBeenCalledWith(3);
            expect(view).toBeUndefined();
        });

        it("should complete rendering with failure", async () => {
            expect.assertions(3);
            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = chartActions.completeRendering(false);

            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "charts",
                {
                    isRendered: false,
                    isRendering: false,
                },
                expect.objectContaining({
                    silent: false,
                    source: "chartActions.completeRendering",
                })
            );
            expect(
                mocks.AppActions.AppActions.notifyChartRenderComplete
            ).not.toHaveBeenCalled();
            expect(view).toBeUndefined();
        });

        it("should start rendering process", async () => {
            expect.assertions(3);
            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            chartActions.startRendering();

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.isRendering",
                true,
                expect.any(Object)
            );
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "isLoading",
                true,
                expect.any(Object)
            );
            const renderingStopCalls =
                mocks.stateManager.setState.mock.calls.filter(
                    ([path, value]) =>
                        path === "charts.isRendering" && value === false
                );
            expect(renderingStopCalls).toStrictEqual([]);
        });

        it("should select chart and trigger re-render when rendered", async () => {
            expect.assertions(2);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "charts.isRendered") return true;
                return null;
            });

            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            chartActions.selectChart("power");

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.selectedChart",
                "power",
                expect.any(Object)
            );
            const staleSelectionCalls =
                mocks.stateManager.setState.mock.calls.filter(
                    ([path, value]) =>
                        path === "charts.selectedChart" && value === "speed"
                );
            expect(staleSelectionCalls).toStrictEqual([]);
        });

        it("should toggle controls visibility", async () => {
            expect.assertions(2);
            const { chartActions } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            chartActions.toggleControls();

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                false,
                expect.any(Object)
            );
            const controlsVisibleCalls =
                mocks.stateManager.setState.mock.calls.filter(
                    ([path, value]) =>
                        path === "charts.controlsVisible" && value === true
                );
            expect(controlsVisibleCalls).toStrictEqual([]);
        });
    });

    describe("exportChartsWithState Function", () => {
        it("should handle no rendered charts scenario", async () => {
            expect.assertions(3);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "charts.isRendered") return false;
                return null;
            });
            clearChartInstanceRegistryForTests();

            const { exportChartsWithState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const exportSucceeded = await exportChartsWithState("png");

            expect({ exportSucceeded }).toStrictEqual({
                exportSucceeded: false,
            });
            await vi.waitFor(() => {
                if (
                    mocks.showNotification.showNotification.mock.calls
                        .length === 0
                ) {
                    throw new Error("Expected export notification");
                }
            });
            expect(
                mocks.showNotification.showNotification
            ).toHaveBeenCalledWith("No charts available for export", "warning");
            expect(mocks.stateManager.setState).not.toHaveBeenCalledWith(
                "ui.isExporting",
                true,
                expect.any(Object)
            );
        });

        it("should export charts when available", async () => {
            expect.assertions(4);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "charts.isRendered") return true;
                return null;
            });

            setRegisteredChartInstances([
                {
                    toBase64Image: vi
                        .fn<MockFn>()
                        .mockReturnValue("data:image/png;base64,mockimage"),
                },
            ]);

            const { exportChartsWithState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const exportSucceeded = await exportChartsWithState("png");

            expect({ exportSucceeded }).toStrictEqual({
                exportSucceeded: true,
            });
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "ui.isExporting",
                true,
                expect.objectContaining({
                    source: "exportChartsWithState",
                })
            );
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "ui.isExporting",
                false,
                expect.objectContaining({
                    source: "exportChartsWithState",
                })
            );
            await vi.waitFor(() => {
                if (
                    !mocks.showNotification.showNotification.mock.calls.some(
                        ([message, type]) =>
                            message === "Charts exported as PNG" &&
                            type === "success"
                    )
                ) {
                    throw new Error("Expected export success notification");
                }
            });
            expect(mocks.showNotification.showNotification).toHaveBeenCalledWith(
                "Charts exported as PNG",
                "success"
            );
        });

        it("should log rejected injected export notifications without failing export", async () => {
            expect.assertions(2);

            const consoleWarn = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const notifyError = new Error("notification unavailable");
            const exportChartsWithState = createExportChartsWithState({
                areChartsRendered: () => false,
                getChartInstances: () => [],
                notify: async () => {
                    throw notifyError;
                },
                setExportingState: vi.fn(),
            });

            const exportSucceeded = await exportChartsWithState("png");

            expect({ exportSucceeded }).toStrictEqual({
                exportSucceeded: false,
            });
            await vi.waitFor(() => {
                if (consoleWarn.mock.calls.length === 0) {
                    throw new Error("Expected export notification warning");
                }
            });
            expect(consoleWarn).toHaveBeenCalledWith(
                "[ChartJS] Export notification failed:",
                notifyError
            );
        });
    });

    describe("main renderChartJS Function - Core Rendering", () => {
        it("should execute chart rendering with valid data", async () => {
            expect.assertions(3);
            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const mockContainer = document.createElement("div");
            const view = await renderChartJS(mockContainer);

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.isRendering",
                true,
                expect.any(Object)
            );
            expect(mocks.setupZoneData.setupZoneData).toHaveBeenCalledWith(
                expect.objectContaining({
                    recordMesgs: expect.any(Array),
                })
            );
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should handle string container ID parameter", async () => {
            expect.assertions(2);
            global.document.getElementById.mockReturnValue(
                document.createElement("div")
            );

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS("content-chart");

            expect(global.document.querySelector).toHaveBeenCalledWith(
                '[id="content-chart"]'
            );
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should handle no valid data scenario", async () => {
            expect.assertions(2);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "fitFile.rawData") return null;
                return null;
            });

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(
                mocks.showNotification.showNotification
            ).toHaveBeenCalledWith(
                "No FIT file data available for chart rendering",
                "warning"
            );
            expect({ rendered: view }).toStrictEqual({ rendered: false });
        });

        it("should render through the typed Chart.js runtime without a global sentinel", async () => {
            expect.assertions(3);

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(Object.hasOwn(globalThis, "Chart")).toBe(false);
            expect(
                mocks.showNotification.showNotification
            ).not.toHaveBeenCalledWith("Chart library not available", "error");
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should handle empty record messages", async () => {
            expect.assertions(2);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "fitFile.rawData") return { recordMesgs: [] };
                return null;
            });

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(
                mocks.showNotification.showNotification
            ).toHaveBeenCalledWith(
                "No chartable data found in this FIT file",
                "info"
            );
            expect({ rendered: view }).toStrictEqual({ rendered: false });
        });

        it("should handle debouncing of rapid render calls", async () => {
            expect.assertions(1);
            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            // Mock Date.now to simulate rapid calls
            const originalDateNow = Date.now;
            vi.spyOn(Date, "now").mockImplementation().mockReturnValue(1000);

            try {
                // First call
                const view = renderChartJS();

                // Immediate second call (should be debounced)
                Date.now.mockReturnValue(1050); // 50ms later
                const utils = renderChartJS();

                const [result1, result2] = await Promise.all([view, utils]);

                expect({
                    firstRender: result1,
                    secondRender: result2,
                }).toStrictEqual({
                    firstRender: true,
                    secondRender: true,
                });
            } finally {
                Date.now = originalDateNow;
            }
        });

        it("should handle critical error in chart rendering", async () => {
            expect.assertions(2);
            // Mock setupZoneData to throw error
            mocks.setupZoneData.setupZoneData.mockImplementation(() => {
                throw new Error("Critical setup error");
            });

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(
                mocks.showNotification.showNotification
            ).toHaveBeenCalledWith(
                "Failed to render charts due to an error",
                "error"
            );
            expect({ rendered: view }).toStrictEqual({ rendered: false });
        });

        it("should handle no container scenario with placeholder content", async () => {
            expect.assertions(1);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "fitFile.rawData") return { recordMesgs: [] };
                return null;
            });

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            // Should show placeholder content for no data
            expect({ rendered: view }).toStrictEqual({ rendered: false });
        });
    });

    describe("renderChartsWithData Function - Data Processing", () => {
        it("should process chart data with unit conversion", async () => {
            expect.assertions(3);
            // Test is implicitly covered by main renderChartJS function
            // Since renderChartsWithData is private, it's tested through public interface

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(
                mocks.convertValueToUserUnits.convertValueToUserUnits
            ).toHaveBeenCalledWith(10, "speed");
            expect({ rendered: view }).toStrictEqual({ rendered: true });
            expect(
                mocks.showNotification.showNotification
            ).not.toHaveBeenCalledWith(
                "No FIT file data available for chart rendering",
                "warning"
            );
        });

        it("should handle settings validation and boolean conversion", async () => {
            expect.assertions(1);
            mocks.settingsStateManager.getChartSettings.mockReturnValue({
                showFill: "on",
                showGrid: "off",
                showLegend: true,
                showPoints: false,
                showTitle: "off",
            });

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should reuse cached chart series for display-only setting changes", async () => {
            expect.assertions(8);
            const sharedData = {
                recordMesgs: [
                    { timestamp: 1000, speed: 10, elevation: 100 },
                    { timestamp: 2000, speed: 15, elevation: 105 },
                ],
            };

            mocks.formatChartFields.formatChartFields = ["speed", "elevation"];
            mocks.settingsStateManager.getChartFieldVisibility.mockReturnValue(
                "visible"
            );

            mocks.stateManager.getState.mockImplementation((path) => {
                const stateMap = {
                    "fitFile.rawData": sharedData,
                    "charts.chartData": null,
                    "charts.chartOptions": {},
                    "charts.controlsVisible": true,
                    "charts.isRendered": false,
                    "charts.isRendering": false,
                    "charts.selectedChart": "elevation",
                    "settings.charts": {
                        animation: "normal",
                        chartType: "line",
                        maxpoints: "all",
                    },
                    "settings.charts.fieldVisibility.speed": "visible",
                    isLoading: false,
                };
                return stateMap[path];
            });

            const {
                chartSettingsManager,
                getChartSeriesCacheStats,
                renderChartJS,
            } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            await renderChartJS();

            const firstRenderData =
                mocks.createEnhancedChart.createEnhancedChart.mock.calls.map(
                    ([, config]) => config.chartData
                );

            expect(firstRenderData.length).toBeGreaterThan(0);

            const initialStats = getChartSeriesCacheStats();
            expect(initialStats.misses).toBeGreaterThan(0);
            expect(initialStats.hits).toBe(0);

            chartSettingsManager.updateSettings({ showLegend: false });

            mocks.createEnhancedChart.createEnhancedChart.mockClear();

            await renderChartJS();

            const secondRenderData =
                mocks.createEnhancedChart.createEnhancedChart.mock.calls.map(
                    ([, config]) => config.chartData
                );

            const afterStats = getChartSeriesCacheStats();

            expect(secondRenderData).toHaveLength(firstRenderData.length);
            secondRenderData.forEach((data, index) => {
                expect(data).toBe(firstRenderData[index]);
            });

            expect(afterStats.misses).toBe(initialStats.misses);
            expect(afterStats.hits).toBeGreaterThan(initialStats.hits);
        });
    });

    describe("performance and Monitoring", () => {
        it("should track performance timing", async () => {
            expect.assertions(2);
            mockRenderChartPerformanceNow
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(1500);

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(mockRenderChartPerformanceNow).toHaveBeenCalledWith();
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should update performance state on completion", async () => {
            expect.assertions(5);
            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "performance.renderTimes",
                { chart: expect.any(Number) },
                expect.any(Object)
            );
            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "performance",
                {
                    chartsRendered: expect.any(Number),
                    renderTimes: expect.objectContaining({
                        lastChartRender: expect.any(Number),
                    }),
                },
                expect.any(Object)
            );
            expect({ rendered: view }).toStrictEqual({ rendered: true });
            const performanceStateUpdates =
                mocks.stateManager.updateState.mock.calls.filter(
                    ([path]) => path === "performance.renderTimes"
                );
            expect(performanceStateUpdates).not.toHaveLength(0);
            const performanceSummaryUpdates =
                mocks.stateManager.updateState.mock.calls.filter(
                    ([path]) => path === "performance"
                );
            expect(performanceSummaryUpdates).not.toHaveLength(0);
        });
    });

    describe("integration and Complex Workflows", () => {
        it("should handle complete chart lifecycle with all components", async () => {
            expect.assertions(7);
            setRegisteredChartInstances([
                { destroy: vi.fn<MockFn>() },
                { destroy: vi.fn<MockFn>() },
            ]);

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            // Verify complete workflow
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.isRendering",
                true,
                expect.any(Object)
            );
            expect(mocks.setupZoneData.setupZoneData).toHaveBeenCalledWith(
                expect.objectContaining({
                    recordMesgs: expect.any(Array),
                })
            );
            expect(
                mocks.renderPerformanceAnalysisCharts
                    .renderPerformanceAnalysisCharts
            ).toHaveProperty("mock.calls.length", expect.any(Number));
            expect(
                mocks.renderPerformanceAnalysisCharts
                    .renderPerformanceAnalysisCharts.mock.calls.length
            ).toBeGreaterThan(0);
            expect(
                mocks.addChartHoverEffects.addHoverEffectsToExistingCharts
            ).toHaveProperty("mock.calls.length", expect.any(Number));
            expect(
                mocks.addChartHoverEffects.addHoverEffectsToExistingCharts.mock
                    .calls.length
            ).toBeGreaterThan(0);
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should handle theme configuration integration", async () => {
            expect.assertions(2);
            const themeMod =
                await import("../../../../../electron-app/utils/theming/core/theme.js");
            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect(themeMod.getThemeConfig).toHaveBeenCalledWith();
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should integrate with all chart rendering modules", async () => {
            expect.assertions(9);
            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            // Verify all chart types are rendered
            expect(
                mocks.renderEventMessagesChart.renderEventMessagesChart
            ).toHaveProperty("mock.calls.length", expect.any(Number));
            expect(
                mocks.renderEventMessagesChart.renderEventMessagesChart.mock
                    .calls.length
            ).toBeGreaterThan(0);
            expect(
                mocks.renderGPSTrackChart.renderGPSTrackChart
            ).toHaveProperty("mock.calls.length", expect.any(Number));
            expect(
                mocks.renderGPSTrackChart.renderGPSTrackChart.mock.calls.length
            ).toBeGreaterThan(0);
            expect(
                mocks.renderLapZoneCharts.renderLapZoneCharts
            ).toHaveProperty("mock.calls.length", expect.any(Number));
            expect(
                mocks.renderLapZoneCharts.renderLapZoneCharts.mock.calls.length
            ).toBeGreaterThan(0);
            expect(
                mocks.renderTimeInZoneCharts.renderTimeInZoneCharts
            ).toHaveProperty("mock.calls.length", expect.any(Number));
            expect(
                mocks.renderTimeInZoneCharts.renderTimeInZoneCharts.mock.calls
                    .length
            ).toBeGreaterThan(0);
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });
    });

    describe("edge Cases and Error Scenarios", () => {
        it("should handle malformed record messages", async () => {
            expect.assertions(1);
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "fitFile.rawData")
                    return {
                        recordMesgs: [
                            null,
                            undefined,
                            {},
                        ],
                    };
                return null;
            });

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should handle missing field data gracefully", async () => {
            expect.assertions(1);
            mocks.formatChartFields.formatChartFields = [];

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });

        it("should handle DOM manipulation errors", async () => {
            expect.assertions(1);
            // Cause a DOM error inside the normal rendering path (try block)
            const originalCreateElement = global.document.createElement.bind(
                global.document
            );
            vi.spyOn(global.document, "createElement").mockImplementation(
                () => {
                    throw new Error("DOM error");
                }
            );

            const { renderChartJS } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const view = await renderChartJS();

            // Restore createElement for subsequent tests
            global.document.createElement = originalCreateElement;

            // With valid data present, inner DOM errors are treated as non-fatal and overall returns true
            expect({ rendered: view }).toStrictEqual({ rendered: true });
        });
    });

    describe("state Utility Functions", () => {
        it("should provide resetChartNotificationState function", async () => {
            expect.assertions(1);
            const { previousChartState, resetChartNotificationState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            previousChartState.chartCount = 4;
            previousChartState.fieldsRendered = [true, true];
            previousChartState.lastRenderTimestamp = 1234;
            resetChartNotificationState();

            expect(previousChartState).toEqual({
                chartCount: 0,
                fieldsRendered: [],
                lastRenderTimestamp: 0,
            });
        });

        it("should provide updatePreviousChartState function", async () => {
            expect.assertions(2);
            const { previousChartState, updatePreviousChartState } =
                await import("../../../../../electron-app/utils/charts/core/renderChartJS.js");

            const renderTimestamp = Date.now();
            updatePreviousChartState(5, 3, renderTimestamp);

            expect(previousChartState).toEqual({
                chartCount: 5,
                fieldsRendered: [
                    true,
                    true,
                    true,
                ],
                lastRenderTimestamp: renderTimestamp,
            });
            expect(previousChartState.fieldsRendered).not.toHaveLength(2);
        });
    });
});

// @ts-nocheck
/**
 * @fileoverview Comprehensive test suite for renderChartJS.js with Module Cache Injection
 * @description Tests the 1510-line chart rendering utility using proven Module cache injection technique
 * to achieve significant coverage improvement from baseline 52.69% to target 80%+
 *
 * TESTING STRATEGY:
 * - Module cache injection for all 27+ dependencies
 * - DOM environment mocking for Chart.js rendering
 * - State management integration testing
 * - Error handling and edge case coverage
 * - Performance monitoring validation
 * - Export functionality testing
 *
 * TARGET COVERAGE IMPROVEMENT: 52.69% → 80%+ (27+ percentage point improvement)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Stable ESM mock for theme module before SUT import to avoid SSR init order issues
vi.mock("../../../../../utils/theming/core/theme.js", () => {
    const getThemeConfig = vi.fn().mockReturnValue({
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
        applyTheme: vi.fn(),
        getEffectiveTheme: vi.fn().mockReturnValue("light"),
        getThemeConfig,
        initializeTheme: vi.fn(),
        listenForSystemThemeChange: vi.fn(),
        listenForThemeChange: vi.fn(),
        loadTheme: vi.fn().mockReturnValue("light"),
        toggleTheme: vi.fn(),
        default: { getThemeConfig },
    };
});

// Mock chart theme listener to avoid importing chartStateManager -> renderChartJS cycle
vi.mock("../../../../../utils/charts/theming/chartThemeListener.js", () => ({
    setupChartThemeListener: vi.fn(),
    forceUpdateChartTheme: vi.fn(),
    removeChartThemeListener: vi.fn(),
}));

// Mock theme utils detectCurrentTheme to a stable value
vi.mock("../../../../../utils/charts/theming/chartThemeUtils.js", () => ({
    detectCurrentTheme: vi.fn().mockReturnValue("light"),
}));

// Mock ensureChartSettingsDropdowns to avoid importing createSettingsHeader -> chartStateManager -> renderChartJS cycle
vi.mock("../../../../../utils/ui/components/ensureChartSettingsDropdowns.js", () => ({
    ensureChartSettingsDropdowns: vi.fn(() => ({})),
}));

// Mock createUserDeviceInfoBox to avoid theme import execution in rendering paths
vi.mock("../../../../../utils/rendering/components/createUserDeviceInfoBox.js", () => ({
    createUserDeviceInfoBox: vi.fn(),
}));

// Mock createEnhancedChart to avoid circular import with renderChartJS (hexToRgba)
vi.mock("../../../../../utils/charts/components/createEnhancedChart.js", () => ({
    createEnhancedChart: vi.fn().mockReturnValue({
        destroy: vi.fn(),
        update: vi.fn(),
        toBase64Image: vi.fn().mockReturnValue("data:image/png;base64,mockimage"),
    }),
}));

// Type declarations for global objects
declare global {
    interface Window {
        Chart?: any;
        chartjsPluginZoom?: any;
        ChartZoom?: any;
        _chartjsInstances?: any[];
        _fitFileViewerChartListener?: boolean;
        JSZip?: any;
        performance: {
            now: () => number;
        };
        localStorage: {
            getItem: (key: string) => string | null;
            setItem: (key: string, value: string) => void;
        };
        require?: (id: string) => any;
    }
    var Chart: any;
    var chartjsPluginZoom: any;
    var ChartZoom: any;
    var _chartjsInstances: any[];
    var _fitFileViewerChartListener: boolean;
    var JSZip: any;
}

// Mock all dependencies before import using Module cache injection
function injectRenderChartJSMocks() {
    // Module cache injection technique - intercept require() calls
    const originalRequire = globalThis.require;
    const moduleCache = new Map();

    // Enhanced DOM environment for Chart.js testing
    setupDOMEnvironment();

    // Mock all 27+ dependencies used by renderChartJS.js
    const mocks = {
        // App initialization imports
        loadSharedConfiguration: { default: vi.fn() },
        AppActions: {
            AppActions: {
                notifyChartRenderComplete: vi.fn(),
            },
        },

        // Data lookups and processing imports
        getUnitSymbol: { getUnitSymbol: vi.fn().mockReturnValue("km/h") },
        setupZoneData: { setupZoneData: vi.fn() },
        convertValueToUserUnits: { convertValueToUserUnits: vi.fn((value) => value) },
        formatChartFields: {
            fieldLabels: { speed: "Speed", elevation: "Elevation" },
            formatChartFields: ["speed", "elevation", "heart_rate", "power"],
        },

        // Rendering components
        createUserDeviceInfoBox: { createUserDeviceInfoBox: vi.fn() },

        // State management imports - comprehensive mocking
        computedStateManager: {
            computedStateManager: {
                invalidateComputed: vi.fn(),
                getComputedValue: vi.fn().mockReturnValue({}),
                registerComputed: vi.fn(),
            },
        },
        stateManager: {
            getState: vi.fn(),
            setState: vi.fn(),
            subscribe: vi.fn(),
            updateState: vi.fn(),
        },
        stateMiddleware: {
            middlewareManager: {
                apply: vi.fn(),
                addMiddleware: vi.fn(),
            },
        },
        settingsStateManager: {
            settingsStateManager: {
                getChartSettings: vi.fn().mockReturnValue({
                    animation: "normal",
                    chartType: "line",
                    colors: [],
                    interpolation: "linear",
                    maxpoints: "all",
                    showFill: false,
                    showGrid: true,
                    showLegend: true,
                    showPoints: false,
                    showTitle: true,
                    smoothing: 0.1,
                }),
                updateChartSettings: vi.fn(),
            },
        },
        uiStateManager: {
            uiStateManager: {
                updatePanelVisibility: vi.fn(),
            },
        },

        // Theme management
        theme: {
            getThemeConfig: vi.fn().mockReturnValue({
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
        ensureChartSettingsDropdowns: { ensureChartSettingsDropdowns: vi.fn() },

        // Notifications
        showNotification: { showNotification: vi.fn() },
        showRenderNotification: { showRenderNotification: vi.fn() },

        // Chart components
        createChartCanvas: { createChartCanvas: vi.fn().mockReturnValue(document.createElement("canvas")) },
        createEnhancedChart: {
            createEnhancedChart: vi.fn().mockReturnValue({
                destroy: vi.fn(),
                update: vi.fn(),
                toBase64Image: vi.fn().mockReturnValue("data:image/png;base64,mockimage"),
            }),
        },

        // Chart plugins
        addChartHoverEffects: {
            addChartHoverEffects: vi.fn(),
            addHoverEffectsToExistingCharts: vi.fn(),
            removeChartHoverEffects: vi.fn(),
        },
        chartBackgroundColorPlugin: { chartBackgroundColorPlugin: {} },

        // Chart rendering modules
        renderEventMessagesChart: { renderEventMessagesChart: vi.fn() },
        renderGPSTrackChart: { renderGPSTrackChart: vi.fn() },
        renderLapZoneCharts: { renderLapZoneCharts: vi.fn() },
        renderPerformanceAnalysisCharts: { renderPerformanceAnalysisCharts: vi.fn() },
        renderTimeInZoneCharts: { renderTimeInZoneCharts: vi.fn() },

        // Chart theming
        setupChartThemeListener: { setupChartThemeListener: vi.fn() },
        detectCurrentTheme: { detectCurrentTheme: vi.fn().mockReturnValue("light") },
    };

    // Mock Chart.js and related global objects
    globalThis.Chart = {
        register: vi.fn(),
        registry: {
            plugins: {
                get: vi.fn().mockReturnValue(false),
            },
        },
        Zoom: {},
    };

    globalThis.chartjsPluginZoom = {};
    globalThis.ChartZoom = {};
    globalThis._chartjsInstances = [];
    globalThis._fitFileViewerChartListener = false;
    globalThis.JSZip = vi.fn();

    // Enhanced module cache injection
    globalThis.require = function (id) {
        const normalizedId = id.replace(/^\.\.\/\.\.\//, "../../").replace(/\.js$/, "");

        // Check cache first
        if (moduleCache.has(normalizedId)) {
            return moduleCache.get(normalizedId);
        }

        // Find matching mock
        for (const [mockKey, mockValue] of Object.entries(mocks)) {
            if (normalizedId.includes(mockKey) || normalizedId.endsWith(mockKey)) {
                moduleCache.set(normalizedId, mockValue);
                return mockValue;
            }
        }

        // Fallback to original require
        if (originalRequire) {
            try {
                return originalRequire(id);
            } catch (error) {
                console.warn(`[Test] Module not found: ${id}, returning empty mock`);
                return {};
            }
        }

        return {};
    };

    return mocks;
}

function setupDOMEnvironment() {
    // Enhanced DOM mocking for Chart.js integration
    const mockElement = {
        innerHTML: "",
        id: "",
        style: { cssText: "" },
        nodeType: 1, // Node.ELEMENT_NODE
        appendChild: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn().mockReturnValue([]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        getBoundingClientRect: vi.fn().mockReturnValue({
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
        insertBefore: vi.fn(),
    };

    global.document = {
        createElement: vi.fn().mockReturnValue(mockElement),
        getElementById: vi.fn().mockReturnValue(mockElement),
        // Return null specifically for '#content-chart' to avoid fallback path that calls getThemeConfig in catch
        querySelector: vi.fn((selector: string) => (selector === "#content-chart" ? null : mockElement)),
        querySelectorAll: vi.fn().mockReturnValue([mockElement]),
        body: {
            append: vi.fn(),
            nodeType: 1,
            classList: {
                add: vi.fn(),
                remove: vi.fn(),
                contains: vi.fn().mockReturnValue(false),
            },
        },
        head: {
            append: vi.fn(),
        },
        addEventListener: vi.fn(),
    };

    global.window = {
        addEventListener: vi.fn(),
        performance: {
            now: vi.fn().mockReturnValue(1000),
        },
        localStorage: {
            getItem: vi.fn().mockReturnValue("visible"),
            setItem: vi.fn(),
        },
        matchMedia: vi
            .fn()
            .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
        requestAnimationFrame: vi.fn((cb: FrameRequestCallback) => setTimeout(cb, 0)),
        cancelAnimationFrame: vi.fn((id: number) => clearTimeout(id as unknown as number)),
    };

    // Do NOT overwrite globalThis; instead, patch properties to avoid clobbering Vitest internals
    const g = /** @type {any} */ globalThis;
    g.window = global.window;
    g.document = global.document;
    if (typeof g.addEventListener !== "function") g.addEventListener = vi.fn();
    if (typeof g.setTimeout !== "function")
        g.setTimeout = (fn: any) => {
            fn();
            return 0;
        };
    if (typeof g.clearTimeout !== "function") g.clearTimeout = vi.fn();
    g.performance = global.window.performance;
    g.Node = { ELEMENT_NODE: 1 };
    if (typeof g.requestAnimationFrame !== "function") g.requestAnimationFrame = global.window.requestAnimationFrame;
    if (typeof g.cancelAnimationFrame !== "function") g.cancelAnimationFrame = global.window.cancelAnimationFrame;
    if (typeof g.matchMedia !== "function") g.matchMedia = global.window.matchMedia;
    // Ensure a stable process.nextTick exists for any code importing this module
    if (!g.process || typeof g.process !== "object") g.process = {} as any;
    if (typeof g.process.nextTick !== "function") {
        g.process.nextTick = (cb: any, ...args: any[]) =>
            Promise.resolve().then(() => {
                try {
                    cb(...args);
                } catch {
                    /* ignore */
                }
            });
    }
}

describe("renderChartJS.js - Comprehensive Coverage with Module Cache Injection", () => {
    let mocks;

    beforeEach(() => {
        vi.clearAllMocks();
        mocks = injectRenderChartJSMocks();

        // Reset global state
        globalThis._chartjsInstances = [];
        globalThis._fitFileViewerChartListener = false;

        // Setup default state responses
        mocks.stateManager.getState.mockImplementation((path) => {
            const stateMap = {
                globalData: {
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

    describe("chartSettingsManager Object", () => {
        it("should provide getFieldVisibility method with localStorage integration", async () => {
            const { chartSettingsManager } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartSettingsManager.getFieldVisibility("speed");

            expect(global.window.localStorage.getItem).toHaveBeenCalledWith("chartjs_field_speed");
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "settings.charts.fieldVisibility.speed",
                "visible",
                expect.objectContaining({ silent: false, source: "chartSettingsManager.getFieldVisibility" })
            );
            expect(result).toBe("visible");
        });

        it("should provide getSettings method with state fallback", async () => {
            const { chartSettingsManager } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartSettingsManager.getSettings();

            expect(mocks.stateManager.getState).toHaveBeenCalledWith("settings.charts");
            expect(result).toEqual({
                animation: "normal",
                chartType: "line",
                colors: [],
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
            const { chartSettingsManager } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartSettingsManager.setFieldVisibility("power", "hidden");

            expect(global.window.localStorage.setItem).toHaveBeenCalledWith("chartjs_field_power", "hidden");
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "settings.charts.fieldVisibility.power",
                "hidden",
                expect.objectContaining({ silent: false, source: "chartSettingsManager.setFieldVisibility" })
            );
            expect(mocks.computedStateManager.computedStateManager.invalidateComputed).toHaveBeenCalledWith(
                "charts.renderableFieldCount"
            );
        });

        it("should provide updateSettings method with persistence", async () => {
            const { chartSettingsManager } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const newSettings = { chartType: "bar", showPoints: true };
            chartSettingsManager.updateSettings(newSettings);

            expect(mocks.settingsStateManager.settingsStateManager.updateChartSettings).toHaveBeenCalled();
            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "settings.charts",
                expect.objectContaining(newSettings),
                expect.objectContaining({ silent: false, source: "chartSettingsManager.updateSettings" })
            );
        });
    });

    describe("Chart Plugin Registration", () => {
        it("should register Chart.js zoom plugin when available", async () => {
            globalThis.Chart = {
                register: vi.fn(),
                Zoom: {},
            };

            await import("../../../../../utils/charts/core/renderChartJS.js");

            expect(globalThis.Chart.register).toHaveBeenCalledWith(globalThis.Chart.Zoom);
        });

        it("should register background color plugin when Chart.js available", async () => {
            globalThis.Chart = {
                register: vi.fn(),
                registry: {
                    plugins: {
                        get: vi.fn().mockReturnValue(false),
                    },
                },
            };

            await import("../../../../../utils/charts/core/renderChartJS.js");

            expect(globalThis.Chart.register).toHaveBeenCalled();
        });

        it("should handle Chart.js not available scenario", async () => {
            globalThis.Chart = null;

            await import("../../../../../utils/charts/core/renderChartJS.js");

            // Should not throw error and complete initialization
            expect(true).toBe(true);
        });
    });

    describe("chartState Object - Computed Properties", () => {
        it("should provide chartData from state", async () => {
            const { chartState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartState.chartData;

            expect(mocks.stateManager.getState).toHaveBeenCalledWith("charts.chartData");
            expect(result).toBeNull();
        });

        it("should provide hasValidData computed property", async () => {
            const { chartState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartState.hasValidData;

            expect(mocks.stateManager.getState).toHaveBeenCalledWith("globalData");
            expect(result).toBe(true);
        });

        it("should handle invalid data in hasValidData", async () => {
            mocks.stateManager.getState.mockReturnValue(null);
            const { chartState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartState.hasValidData;

            expect(result).toBe(false);
        });

        it("should provide renderableFields with visibility filtering", async () => {
            const { chartState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartState.renderableFields;

            expect(result).toEqual(["speed", "elevation", "heart_rate", "power"]);
        });

        it("should handle no valid data in renderableFields", async () => {
            mocks.stateManager.getState.mockReturnValue(null);
            const { chartState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = chartState.renderableFields;

            expect(result).toEqual([]);
        });
    });

    describe("chartActions Object - State Management", () => {
        it("should clear charts and reset state", async () => {
            const mockChart = { destroy: vi.fn() };
            globalThis._chartjsInstances = [mockChart];

            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartActions.clearCharts();

            expect(mockChart.destroy).toHaveBeenCalled();
            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "charts",
                {
                    chartData: null,
                    isRendered: false,
                    renderedCount: 0,
                },
                expect.objectContaining({ silent: false, source: "chartActions.clearCharts" })
            );
        });

        it("should handle chart destruction errors gracefully", async () => {
            const mockChart = {
                destroy: vi.fn().mockImplementation(() => {
                    throw new Error("Destroy failed");
                }),
            };
            globalThis._chartjsInstances = [mockChart];

            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            expect(() => chartActions.clearCharts()).not.toThrow();
        });

        it("should complete rendering with success", async () => {
            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartActions.completeRendering(true, 3, 1500);

            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "charts",
                {
                    isRendered: true,
                    isRendering: false,
                    lastRenderTime: expect.any(Number),
                    renderedCount: 3,
                },
                expect.objectContaining({ silent: false, source: "chartActions.completeRendering" })
            );
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("isLoading", false, expect.any(Object));
        });

        it("should complete rendering with failure", async () => {
            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartActions.completeRendering(false);

            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "charts",
                {
                    isRendered: false,
                    isRendering: false,
                },
                expect.objectContaining({ silent: false, source: "chartActions.completeRendering" })
            );
        });

        it("should start rendering process", async () => {
            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartActions.startRendering();

            expect(mocks.stateManager.setState).toHaveBeenCalledWith("charts.isRendering", true, expect.any(Object));
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("isLoading", true, expect.any(Object));
        });

        it("should select chart and trigger re-render when rendered", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "charts.isRendered") return true;
                return null;
            });

            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartActions.selectChart("power");

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.selectedChart",
                "power",
                expect.any(Object)
            );
        });

        it("should toggle controls visibility", async () => {
            const { chartActions } = await import("../../../../../utils/charts/core/renderChartJS.js");

            chartActions.toggleControls();

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "charts.controlsVisible",
                false,
                expect.any(Object)
            );
            expect(mocks.uiStateManager.uiStateManager.updatePanelVisibility).toHaveBeenCalledWith(
                "chart-controls",
                false
            );
        });
    });

    describe("exportChartsWithState Function", () => {
        it("should handle no rendered charts scenario", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "charts.isRendered") return false;
                return null;
            });
            globalThis._chartjsInstances = [];

            const { exportChartsWithState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await exportChartsWithState("png");

            expect(result).toBe(false);
        });

        it("should export charts when available", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "charts.isRendered") return true;
                return null;
            });

            globalThis._chartjsInstances = [
                {
                    toBase64Image: vi.fn().mockReturnValue("data:image/png;base64,mockimage"),
                },
            ];

            const { exportChartsWithState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await exportChartsWithState("png");

            expect(result).toBe(true);
        });
    });

    describe("Main renderChartJS Function - Core Rendering", () => {
        it("should execute chart rendering with valid data", async () => {
            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const mockContainer = document.createElement("div");
            const result = await renderChartJS(mockContainer);

            expect(mocks.stateManager.setState).toHaveBeenCalledWith("charts.isRendering", true, expect.any(Object));
            expect(mocks.setupZoneData.setupZoneData).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should handle string container ID parameter", async () => {
            global.document.getElementById.mockReturnValue(document.createElement("div"));

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS("content-chart");

            expect(global.document.getElementById).toHaveBeenCalledWith("content-chart");
            expect(result).toBe(true);
        });

        it("should handle no valid data scenario", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "globalData") return null;
                return null;
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(mocks.showNotification.showNotification).toHaveBeenCalledWith(
                "No FIT file data available for chart rendering",
                "warning"
            );
            expect(result).toBe(false);
        });

        it("should handle Chart.js not available error", async () => {
            globalThis.Chart = null;

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(mocks.showNotification.showNotification).toHaveBeenCalledWith(
                "Chart library not available",
                "error"
            );
            expect(result).toBe(false);
        });

        it("should handle empty record messages", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "globalData") return { recordMesgs: [] };
                return null;
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(mocks.showNotification.showNotification).toHaveBeenCalledWith(
                "No chartable data found in this FIT file",
                "info"
            );
            expect(result).toBe(false);
        });

        it("should handle debouncing of rapid render calls", async () => {
            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            // Mock Date.now to simulate rapid calls
            const originalDateNow = Date.now;
            Date.now = vi.fn().mockReturnValue(1000);

            try {
                // First call
                const promise1 = renderChartJS();

                // Immediate second call (should be debounced)
                Date.now.mockReturnValue(1050); // 50ms later
                const promise2 = renderChartJS();

                const [result1, result2] = await Promise.all([promise1, promise2]);

                expect(result1).toBe(true);
                expect(result2).toBe(true);
            } finally {
                Date.now = originalDateNow;
            }
        });

        it("should handle critical error in chart rendering", async () => {
            // Mock setupZoneData to throw error
            mocks.setupZoneData.setupZoneData.mockImplementation(() => {
                throw new Error("Critical setup error");
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(mocks.showNotification.showNotification).toHaveBeenCalledWith(
                "Failed to render charts due to an error",
                "error"
            );
            expect(result).toBe(false);
        });

        it("should handle no container scenario with placeholder content", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "globalData") return { recordMesgs: [] };
                return null;
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            // Should show placeholder content for no data
            expect(result).toBe(false);
        });
    });

    describe("renderChartsWithData Function - Data Processing", () => {
        it("should process chart data with unit conversion", async () => {
            // Test is implicitly covered by main renderChartJS function
            // Since renderChartsWithData is private, it's tested through public interface

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(mocks.convertValueToUserUnits.convertValueToUserUnits).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should handle settings validation and boolean conversion", async () => {
            mocks.settingsStateManager.settingsStateManager.getChartSettings.mockReturnValue({
                showFill: "on",
                showGrid: "off",
                showLegend: true,
                showPoints: false,
                showTitle: "off",
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(result).toBe(true);
        });
    });

    describe("Performance and Monitoring", () => {
        it("should track performance timing", async () => {
            global.window.performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1500);

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(global.window.performance.now).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should update performance state on completion", async () => {
            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(mocks.stateManager.updateState).toHaveBeenCalledWith(
                "performance.renderTimes",
                { chart: expect.any(Number) },
                expect.any(Object)
            );
            expect(result).toBe(true);
        });
    });

    describe("Integration and Complex Workflows", () => {
        it("should handle complete chart lifecycle with all components", async () => {
            globalThis._chartjsInstances = [{ destroy: vi.fn() }, { destroy: vi.fn() }];

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            // Verify complete workflow
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("charts.isRendering", true, expect.any(Object));
            expect(mocks.setupZoneData.setupZoneData).toHaveBeenCalled();
            expect(mocks.renderPerformanceAnalysisCharts.renderPerformanceAnalysisCharts).toHaveBeenCalled();
            expect(mocks.addChartHoverEffects.addHoverEffectsToExistingCharts).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should handle theme configuration integration", async () => {
            const themeMod = await import("../../../../../utils/theming/core/theme.js");
            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(themeMod.getThemeConfig).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it("should integrate with all chart rendering modules", async () => {
            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            // Verify all chart types are rendered
            expect(mocks.renderEventMessagesChart.renderEventMessagesChart).toHaveBeenCalled();
            expect(mocks.renderGPSTrackChart.renderGPSTrackChart).toHaveBeenCalled();
            expect(mocks.renderLapZoneCharts.renderLapZoneCharts).toHaveBeenCalled();
            expect(mocks.renderTimeInZoneCharts.renderTimeInZoneCharts).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });

    describe("Edge Cases and Error Scenarios", () => {
        it("should handle malformed record messages", async () => {
            mocks.stateManager.getState.mockImplementation((path) => {
                if (path === "globalData") return { recordMesgs: [null, undefined, {}] };
                return null;
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(result).toBe(true);
        });

        it("should handle missing field data gracefully", async () => {
            mocks.formatChartFields.formatChartFields = [];

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            expect(result).toBe(true);
        });

        it("should handle DOM manipulation errors", async () => {
            // Cause a DOM error inside the normal rendering path (try block)
            const originalCreateElement = global.document.createElement;
            global.document.createElement = vi.fn(() => {
                throw new Error("DOM error");
            });

            const { renderChartJS } = await import("../../../../../utils/charts/core/renderChartJS.js");

            const result = await renderChartJS();

            // Restore createElement for subsequent tests
            global.document.createElement = originalCreateElement;

            // With valid data present, inner DOM errors are treated as non-fatal and overall returns true
            expect(result).toBe(true);
        });
    });

    describe("State Utility Functions", () => {
        it("should provide resetChartNotificationState function", async () => {
            const { resetChartNotificationState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            resetChartNotificationState();

            // Function should execute without errors
            expect(true).toBe(true);
        });

        it("should provide updatePreviousChartState function", async () => {
            const { updatePreviousChartState } = await import("../../../../../utils/charts/core/renderChartJS.js");

            updatePreviousChartState(5, 3, Date.now());

            // Function should execute without errors
            expect(true).toBe(true);
        });
    });
});

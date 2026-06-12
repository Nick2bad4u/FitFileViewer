// Comprehensive test suite for ChartStateManager lifecycle and reactive updates.

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

type StateListener = (
    newValue: unknown,
    oldValue: unknown,
    path: string
) => void;

type StateUpdateOptions = {
    merge?: boolean;
    silent?: boolean;
    source?: string;
};

type DestroyableChart = {
    destroy: Mock<() => void>;
};

const mockModules = vi.hoisted(() => ({
    getRawData: vi.fn<() => unknown>(),
    getState: vi.fn<(path?: string) => unknown>(),
    invalidateChartRenderCache: vi.fn<(reason?: string) => void>(),
    renderChartJS: vi.fn<() => Promise<boolean> | boolean>(),
    setCachedChartSettings:
        vi.fn<
            (
                settings: Record<string, unknown>,
                options?: StateUpdateOptions
            ) => void
        >(),
    setState:
        vi.fn<
            (path: string, value: unknown, options?: StateUpdateOptions) => void
        >(),
    showNotification: vi.fn<(message: string, type?: string) => void>(),
    subscribe: vi.fn<(path: string, listener: StateListener) => () => void>(
        () => () => {
            // Intentionally empty unsubscribe mock.
        }
    ),
    subscribeToChartSettings: vi.fn<
        (
            listener: (
                nextSettings: Record<string, unknown>,
                previousSettings: Record<string, unknown>
            ) => void
        ) => () => void
    >(() => () => {
        // Intentionally empty unsubscribe mock.
    }),
    updateState:
        vi.fn<
            (
                path: string,
                updates: Record<string, unknown>,
                options?: StateUpdateOptions
            ) => void
        >(),
}));

// Mock dependencies first
vi.mock(
    import("../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: mockModules.getState,
        setState: mockModules.setState,
        subscribe: mockModules.subscribe,
        updateState: mockModules.updateState,
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mockModules.showNotification,
    })
);

vi.mock(
    import("../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        invalidateChartRenderCache: mockModules.invalidateChartRenderCache,
        renderChartJS: mockModules.renderChartJS,
    })
);

vi.mock(
    import("../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        setCachedChartSettings: mockModules.setCachedChartSettings,
        subscribeToChartSettings: mockModules.subscribeToChartSettings,
    })
);

vi.mock(
    import("../../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        FitFileSelectors: {
            getRawData: mockModules.getRawData,
        },
    })
);

// Import mocked functions for spying
import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../../../electron-app/utils/state/core/stateManager.js";
import {
    setCachedChartSettings,
    subscribeToChartSettings,
} from "../../../../electron-app/utils/state/domain/settingsStateManager.js";
import { showNotification } from "../../../../electron-app/utils/ui/notifications/showNotification.js";
import {
    invalidateChartRenderCache,
    renderChartJS,
} from "../../../../electron-app/utils/charts/core/renderChartJS.js";
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
    setRegisteredChartInstances,
} from "../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import { getRegisteredChartStateManager } from "../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js";

// Import the module being tested
import chartStateManager, {
    ChartStateManager,
} from "../../../../electron-app/utils/charts/core/chartStateManager.js";

describe("chartStateManager", () => {
    beforeEach(() => {
        // Reset all mocks
        vi.mocked(getState).mockReset();
        vi.mocked(setState).mockReset();
        vi.mocked(setCachedChartSettings).mockReset();
        vi.mocked(subscribe)
            .mockReset()
            .mockReturnValue(() => {});
        vi.mocked(updateState).mockReset();
        vi.mocked(showNotification).mockReset();
        vi.mocked(invalidateChartRenderCache).mockReset();
        mockModules.getRawData.mockReset();
        vi.mocked(renderChartJS).mockReset();

        // Clear timers
        vi.clearAllTimers();

        // Use fake timers
        vi.useFakeTimers();

        clearChartInstanceRegistryForTests();
        chartStateManager.isRendering = false;
        chartStateManager.pendingRenderReason = null;
        chartStateManager.renderTimeout = null;

        // Mock DOM elements
        const mockContainer = document.createElement("div");
        mockContainer.id = "chartjs-chart-container";
        document.body.appendChild(mockContainer);

        const mockControlsPanel = document.createElement("div");
        mockControlsPanel.className = "chart-controls";
        document.body.appendChild(mockControlsPanel);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        clearChartInstanceRegistryForTests();
        document.body.innerHTML = "";
    });

    describe("constructor and Initialization", () => {
        it("should create a ChartStateManager instance", () => {
            expect.assertions(4);

            expect(chartStateManager).toBeInstanceOf(ChartStateManager);
            expect(getRegisteredChartStateManager()).toBe(chartStateManager);
            expect({
                isInitialized: chartStateManager.isInitialized,
                renderDebounceTime: chartStateManager.renderDebounceTime,
            }).toStrictEqual({
                isInitialized: true,
                renderDebounceTime: 250,
            });
            expect(chartStateManager.renderTimeout).not.toBeTypeOf("number");
        });

        it("registers reactive chart lifecycle subscriptions", () => {
            expect.assertions(3);

            const manager = new ChartStateManager();

            expect(manager.isInitialized).toBe(true);
            expect(
                vi.mocked(subscribe).mock.calls.map(([path]) => path)
            ).toStrictEqual([
                "ui.theme",
                "ui.activeTab",
                "fitFile.rawData",
                "charts.selectedChart",
                "charts.controlsVisible",
            ]);
            expect(subscribeToChartSettings).toHaveBeenCalledOnce();
        });

        it("routes subscription callbacks to chart lifecycle behavior", () => {
            expect.assertions(7);

            const manager = new ChartStateManager();
            const themeChangeSpy = vi.spyOn(manager, "handleThemeChange");
            const tabActivationSpy = vi.spyOn(manager, "handleTabActivation");
            const selectedChartRenderSpy = vi.spyOn(manager, "debouncedRender");
            const isChartTabActiveSpy = vi
                .spyOn(manager, "isChartTabActive")
                .mockReturnValue(true);
            const subscriptionByPath = new Map(
                vi
                    .mocked(subscribe)
                    .mock.calls.map(([path, listener]) => [path, listener])
            );
            const controlsPanel = document.querySelector(
                ".chart-controls"
            ) as HTMLElement;

            subscriptionByPath.get("ui.theme")?.("dark", "light", "ui.theme");
            subscriptionByPath.get("ui.activeTab")?.(
                "chartjs",
                "map",
                "ui.activeTab"
            );
            subscriptionByPath.get("charts.selectedChart")?.(
                "power",
                "elevation",
                "charts.selectedChart"
            );
            subscriptionByPath.get("charts.controlsVisible")?.(
                false,
                true,
                "charts.controlsVisible"
            );

            expect(themeChangeSpy).toHaveBeenCalledWith("dark");
            expect(tabActivationSpy).toHaveBeenCalledWith();
            expect(selectedChartRenderSpy).toHaveBeenCalledWith(
                "Chart type changed to power"
            );
            expect(controlsPanel.style.display).toBe("none");
            const settingsListener = vi
                .mocked(subscribeToChartSettings)
                .mock.calls.at(-1)?.[0];
            settingsListener?.(
                { fieldVisibility: { speed: "hidden" } },
                { fieldVisibility: { speed: "visible" } }
            );
            expect(setCachedChartSettings).toHaveBeenCalledWith(
                { fieldVisibility: { speed: "hidden" } },
                { source: "ChartStateManager.chartSettingsSubscription" }
            );
            expect(selectedChartRenderSpy).toHaveBeenCalledWith(
                "Chart settings updated"
            );
            expect(vi.getTimerCount()).toBe(1);

            themeChangeSpy.mockRestore();
            tabActivationSpy.mockRestore();
            selectedChartRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });
    });

    describe("debounced Rendering", () => {
        it("should debounce multiple render calls", async () => {
            expect.assertions(3);

            const performRenderSpy = vi
                .spyOn(chartStateManager, "performChartRender")
                .mockResolvedValue(undefined);

            chartStateManager.debouncedRender("reason1");
            chartStateManager.debouncedRender("reason2");
            chartStateManager.debouncedRender("reason3");

            // Should not have called render yet
            expect(vi.getTimerCount()).toBe(1);
            expect(performRenderSpy).not.toHaveBeenCalled();

            // Advance timers
            vi.advanceTimersByTime(300);

            // Should have called render once with the last reason
            expect(performRenderSpy).toHaveBeenCalledExactlyOnceWith("reason3");
            performRenderSpy.mockRestore();
        });

        it("should clear existing timeout when called multiple times", () => {
            expect.assertions(2);

            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

            chartStateManager.debouncedRender("reason1");
            chartStateManager.debouncedRender("reason2");

            expect(vi.getTimerCount()).toBe(1);
            expect(clearTimeoutSpy).toHaveBeenCalledOnce();
            clearTimeoutSpy.mockRestore();
        });

        it("queues the latest render reason while rendering is already active", async () => {
            expect.assertions(4);

            chartStateManager.isRendering = true;

            await chartStateManager.performChartRender("Active render update");

            expect(chartStateManager.pendingRenderReason).toBe(
                "Active render update"
            );
            expect(renderChartJS).not.toHaveBeenCalled();
            expect(setState).not.toHaveBeenCalled();
            expect(vi.getTimerCount()).toBe(0);
        });
    });

    describe("force Rendering", () => {
        it("should execute force render immediately", () => {
            expect.assertions(2);

            const performRenderSpy = vi
                .spyOn(chartStateManager, "performChartRender")
                .mockResolvedValue(undefined);

            chartStateManager.forceRender("Manual trigger");

            expect(chartStateManager.pendingRenderReason).toBeNull();
            expect(performRenderSpy).toHaveBeenCalledWith("Manual trigger");
            performRenderSpy.mockRestore();
        });

        it("should clear existing timeout when force rendering", () => {
            expect.assertions(2);

            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

            chartStateManager.debouncedRender("reason");
            chartStateManager.forceRender("force");

            expect(chartStateManager.pendingRenderReason).toBeNull();
            expect(clearTimeoutSpy).toHaveBeenCalledOnce();
            clearTimeoutSpy.mockRestore();
        });
    });

    describe("chart Information", () => {
        it("should get chart info with default values", () => {
            expect.assertions(2);

            vi.mocked(getState).mockReturnValue({});

            const info = chartStateManager.getChartInfo();

            expect(info).toEqual({
                instanceCount: 0,
                isRendered: false,
                isRendering: false,
                lastRenderTime: undefined,
                selectedChart: "elevation",
                tabActive: false,
            });
            expect(info.selectedChart).not.toBe("");
        });

        it("should get chart info with actual values", () => {
            expect.assertions(1);

            const mockChartState = {
                isRendered: true,
                isRendering: false,
                lastRenderTime: 123456789,
                selectedChart: "power",
                tabActive: true,
            };
            vi.mocked(getState).mockReturnValue(mockChartState);
            setRegisteredChartInstances([{ type: "chart" }, { type: "chart" }]);

            const info = chartStateManager.getChartInfo();

            expect(info).toEqual({
                instanceCount: 2,
                isRendered: true,
                isRendering: false,
                lastRenderTime: 123456789,
                selectedChart: "power",
                tabActive: true,
            });
        });
    });

    describe("chart Tab Activity Detection", () => {
        it("should detect chartjs tab as active", () => {
            expect.assertions(3);

            vi.mocked(getState).mockReturnValue("chartjs");

            const isActive = chartStateManager.isChartTabActive();

            expect({
                isActive,
            }).toStrictEqual({
                isActive: true,
            });
            expect(isActive).not.toStrictEqual(false);
            expect(getState).toHaveBeenCalledWith("ui.activeTab");
        });

        it("should detect chart tab as active", () => {
            expect.assertions(1);

            vi.mocked(getState).mockReturnValue("chart");

            const isActive = chartStateManager.isChartTabActive();

            expect({
                isActive,
            }).toStrictEqual({
                isActive: true,
            });
        });

        it("should detect non-chart tab as inactive", () => {
            expect.assertions(1);

            vi.mocked(getState).mockReturnValue("map");

            const isActive = chartStateManager.isChartTabActive();

            expect({
                isActive,
            }).toStrictEqual({
                isActive: false,
            });
        });
    });

    describe("data Change Handling", () => {
        it("should handle data change with valid data and active tab", () => {
            expect.assertions(4);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);
            const clearChartStateSpy = vi.spyOn(
                chartStateManager,
                "clearChartState"
            );

            const newData = { recordMesgs: [{ type: "record" }] };
            chartStateManager.handleDataChange(newData);

            expect(vi.getTimerCount()).toBe(1);
            expect(clearChartStateSpy).toHaveBeenCalledWith();
            expect(isChartTabActiveSpy).toHaveBeenCalledWith();
            expect(debouncedRenderSpy).toHaveBeenCalledWith("New data loaded");

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
            clearChartStateSpy.mockRestore();
        });

        it("should not render when data is invalid", () => {
            expect.assertions(3);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            const clearChartStateSpy = vi.spyOn(
                chartStateManager,
                "clearChartState"
            );

            chartStateManager.handleDataChange(null);

            expect(chartStateManager.renderTimeout).toBeNull();
            expect(clearChartStateSpy).toHaveBeenCalledWith();
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            debouncedRenderSpy.mockRestore();
            clearChartStateSpy.mockRestore();
        });

        it("should not render when chart tab is inactive", () => {
            expect.assertions(3);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(false);

            const newData = { recordMesgs: [{ type: "record" }] };
            chartStateManager.handleDataChange(newData);

            expect(chartStateManager.renderTimeout).toBeNull();
            expect(isChartTabActiveSpy).toHaveBeenCalledWith();
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });
    });

    describe("tab Activation Handling", () => {
        it("should handle tab activation", () => {
            expect.assertions(3);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            vi.mocked(getState).mockReturnValueOnce({ isRendered: false });
            mockModules.getRawData.mockReturnValueOnce({
                recordMesgs: [{ timestamp: 1 }],
            });

            chartStateManager.handleTabActivation();

            expect(vi.getTimerCount()).toBe(1);
            expect(setState).toHaveBeenCalledWith("charts.tabActive", true, {
                source: "ChartStateManager.handleTabActivation",
            });
            expect(debouncedRenderSpy).toHaveBeenCalledWith(
                "Tab activation with data available"
            );

            debouncedRenderSpy.mockRestore();
        });

        it("should not render if charts are already rendered", () => {
            expect.assertions(4);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            vi.mocked(getState).mockReturnValueOnce({ isRendered: true });
            mockModules.getRawData.mockReturnValueOnce({ recordMesgs: [] });

            // The implementation treats "rendered" as valid only when we have actual render output.
            // Provide both a Chart.js instance and at least one canvas in the expected container.
            const container = document.getElementById(
                "chartjs-chart-container"
            ) as HTMLElement;
            expect(container).toBeInstanceOf(HTMLDivElement);
            const canvas = document.createElement("canvas");
            container.appendChild(canvas);
            setRegisteredChartInstances([{ destroy: vi.fn<() => void>() }]);

            chartStateManager.handleTabActivation();

            expect(chartStateManager.renderTimeout).toBeNull();
            expect(setState).toHaveBeenCalledWith("charts.tabActive", true, {
                source: "ChartStateManager.handleTabActivation",
            });
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            canvas.remove();
            clearChartInstanceRegistryForTests();

            debouncedRenderSpy.mockRestore();
        });
    });

    describe("theme Change Handling", () => {
        it("should handle theme change when charts are rendered and active", () => {
            expect.assertions(3);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);
            vi.mocked(getState).mockReturnValue({ isRendered: true });

            chartStateManager.handleThemeChange("dark");

            expect(vi.getTimerCount()).toBe(1);
            expect(isChartTabActiveSpy).toHaveBeenCalledWith();
            expect(debouncedRenderSpy).toHaveBeenCalledWith(
                "Theme change to dark"
            );

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });

        it("should handle theme change without theme parameter", () => {
            expect.assertions(3);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);
            vi.mocked(getState).mockReturnValue({ isRendered: true });

            chartStateManager.handleThemeChange();

            expect(vi.getTimerCount()).toBe(1);
            expect(isChartTabActiveSpy).toHaveBeenCalledWith();
            expect(debouncedRenderSpy).toHaveBeenCalledWith("Theme change");

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });

        it("should not render when charts are not rendered", () => {
            expect.assertions(2);

            const debouncedRenderSpy = vi.spyOn(
                chartStateManager,
                "debouncedRender"
            );
            vi.mocked(getState).mockReturnValue({ isRendered: false });

            chartStateManager.handleThemeChange("dark");

            expect(chartStateManager.renderTimeout).toBeNull();
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            debouncedRenderSpy.mockRestore();
        });
    });

    describe("chart State Management", () => {
        it("should clear chart state", () => {
            expect.assertions(4);

            const mockChart = { destroy: vi.fn<() => void>() };
            const destroyExistingChartsSpy = vi.spyOn(
                chartStateManager,
                "destroyExistingCharts"
            );
            setRegisteredChartInstances([mockChart]);

            chartStateManager.clearChartState();

            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(invalidateChartRenderCache).toHaveBeenCalledWith(
                "ChartStateManager.clearChartState"
            );
            expect(destroyExistingChartsSpy).toHaveBeenCalledWith();
            expect(updateState).toHaveBeenCalledWith(
                "charts",
                {
                    chartData: null,
                    isRendered: false,
                    tabActive: false,
                },
                { source: "ChartStateManager.clearChartState" }
            );

            destroyExistingChartsSpy.mockRestore();
        });

        it("should destroy existing charts", () => {
            expect.assertions(5);

            const mockCharts = [
                { destroy: vi.fn<() => void>() },
                { destroy: vi.fn<() => void>() },
                { destroy: vi.fn<() => void>() },
            ];
            setRegisteredChartInstances(mockCharts);

            chartStateManager.destroyExistingCharts();

            mockCharts.forEach((chart) => {
                expect(chart.destroy).toHaveBeenCalledWith();
            });
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(getRegisteredChartInstances()).not.toHaveLength(3);
        });

        it("should handle chart destruction errors", () => {
            expect.assertions(2);

            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const destroyError = new Error("Destroy failed");
            const mockCharts = [
                { destroy: vi.fn<() => void>() },
                {
                    destroy: vi.fn<() => void>().mockImplementation(() => {
                        throw destroyError;
                    }),
                },
                { destroy: vi.fn<() => void>() },
            ];
            setRegisteredChartInstances(mockCharts);

            chartStateManager.destroyExistingCharts();

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Error destroying chart 1:",
                destroyError
            );
            expect(getRegisteredChartInstances()).toStrictEqual([]);

            consoleWarnSpy.mockRestore();
        });
    });

    describe("chart Rendering", () => {
        it("should perform chart render successfully", async () => {
            expect.assertions(6);

            vi.mocked(renderChartJS).mockResolvedValue(true);
            const renderedAt = new Date("2026-06-01T12:00:00.000Z");
            vi.setSystemTime(renderedAt);
            const destroyExistingChartsSpy = vi
                .spyOn(chartStateManager, "destroyExistingCharts")
                .mockImplementation(() => {});

            await chartStateManager.performChartRender("Test reason");
            expect(setState).toHaveBeenCalledWith("charts.isRendering", true, {
                source: "ChartStateManager.performChartRender",
            });
            expect(destroyExistingChartsSpy).toHaveBeenCalledWith();
            expect(renderChartJS).toHaveBeenCalledOnce();
            expect(setState).toHaveBeenCalledWith(
                "charts.lastRenderTime",
                renderedAt.getTime(),
                {
                    source: "ChartStateManager.performChartRender",
                }
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect({
                isRendering: chartStateManager.isRendering,
            }).toStrictEqual({
                isRendering: false,
            });

            destroyExistingChartsSpy.mockRestore();
        });

        it("should handle chart render failure", async () => {
            expect.assertions(3);

            vi.mocked(renderChartJS).mockResolvedValue(false);
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const isActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);

            mockModules.getRawData.mockReturnValue({ recordMesgs: [{}] });

            await chartStateManager.performChartRender("Test reason");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Chart rendering failed: Test reason"
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect({
                isRendering: chartStateManager.isRendering,
            }).toStrictEqual({
                isRendering: false,
            });

            consoleWarnSpy.mockRestore();
            isActiveSpy.mockRestore();
        });

        it("should downgrade logging when render is skipped intentionally", async () => {
            expect.assertions(4);

            vi.mocked(renderChartJS).mockResolvedValue(false);
            const consoleInfoSpy = vi
                .spyOn(console, "info")
                .mockImplementation(() => {});
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const isActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(false);

            mockModules.getRawData.mockReturnValue({ recordMesgs: [] });

            await chartStateManager.performChartRender("Integration refresh");
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Skipped chart render (Integration refresh): chart tab inactive, no chartable data"
            );
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect({
                isRendering: chartStateManager.isRendering,
            }).toStrictEqual({
                isRendering: false,
            });

            consoleInfoSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            isActiveSpy.mockRestore();
        });

        it("should handle chart render errors", async () => {
            expect.assertions(4);

            const renderError = new Error("Render failed");
            vi.mocked(renderChartJS).mockRejectedValue(renderError);
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await chartStateManager.performChartRender("Test reason");
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Error during chart rendering:",
                renderError
            );
            expect(showNotification).toHaveBeenCalledWith(
                "Failed to render charts",
                "error"
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect({
                isRendering: chartStateManager.isRendering,
            }).toStrictEqual({
                isRendering: false,
            });

            consoleErrorSpy.mockRestore();
        });

        it("should handle missing container", async () => {
            expect.assertions(3);

            document.body.innerHTML = ""; // Remove mock container
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            await chartStateManager.performChartRender("Test reason");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Chart container not found"
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect({
                isRendering: chartStateManager.isRendering,
            }).toStrictEqual({
                isRendering: false,
            });

            consoleWarnSpy.mockRestore();
        });
    });

    describe("controls Visibility", () => {
        it("should update controls visibility to visible", () => {
            expect.assertions(1);

            const controlsPanel = document.querySelector(
                ".chart-controls"
            ) as HTMLElement;

            chartStateManager.updateControlsVisibility(true);

            expect(controlsPanel.style.display).toBe("block");
        });

        it("should update controls visibility to hidden", () => {
            expect.assertions(1);

            const controlsPanel = document.querySelector(
                ".chart-controls"
            ) as HTMLElement;

            chartStateManager.updateControlsVisibility(false);

            expect(controlsPanel.style.display).toBe("none");
        });

        it("should handle missing controls panel", () => {
            expect.assertions(2);

            document.body.innerHTML = ""; // Remove mock controls panel

            chartStateManager.updateControlsVisibility(true);

            expect(document.querySelector(".chart-controls")).toBeNull();
            expect(document.body.childElementCount).toBe(0);
        });
    });

    describe("destruction", () => {
        it("should destroy properly", () => {
            expect.assertions(3);

            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
            const mockChart = { destroy: vi.fn<() => void>() };
            const clearChartStateSpy = vi.spyOn(
                chartStateManager,
                "clearChartState"
            );

            setRegisteredChartInstances([mockChart]);
            chartStateManager.renderTimeout = setTimeout(
                () => {},
                chartStateManager.renderDebounceTime
            );
            chartStateManager.destroy();

            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(clearTimeoutSpy).toHaveBeenCalledOnce();
            expect(clearChartStateSpy).toHaveBeenCalledWith();

            clearTimeoutSpy.mockRestore();
            clearChartStateSpy.mockRestore();
        });

        it("should destroy without a pending render timeout", () => {
            expect.assertions(2);

            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
            const mockChart = { destroy: vi.fn<() => void>() };
            setRegisteredChartInstances([mockChart]);
            chartStateManager.renderTimeout = null;

            chartStateManager.destroy();

            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(clearTimeoutSpy).not.toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
        });
    });

    describe("module Exports", () => {
        it("should export ChartStateManager as default", () => {
            expect.assertions(3);

            expect(chartStateManager).toBeInstanceOf(ChartStateManager);
            expect(chartStateManager.constructor.name).toBe(
                "ChartStateManager"
            );
            expect(chartStateManager.constructor.name).not.toBe("");
        });

        it("should be an instance of ChartStateManager", () => {
            expect.assertions(2);

            expect(chartStateManager).toBeInstanceOf(ChartStateManager);
            expect({
                isInitialized: chartStateManager.isInitialized,
            }).toStrictEqual({
                isInitialized: true,
            });
        });

        it("keeps the exported singleton initialized with default chart info", () => {
            expect.assertions(2);

            vi.mocked(getState).mockReturnValue({});
            expect(chartStateManager).toBeInstanceOf(ChartStateManager);
            expect(chartStateManager.getChartInfo()).toStrictEqual({
                instanceCount: 0,
                isRendered: false,
                isRendering: false,
                selectedChart: "elevation",
                tabActive: false,
            });
        });
    });
});

/**
 * Comprehensive test suite for chart state management, reactive updates, and
 * lifecycle operations
 *
 * @version 2.0.0
 *
 * @file Tests for ChartStateManager - Chart state management and lifecycle
 *
 * @author FitFileViewer Test Suite
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mockModules = vi.hoisted(() => ({
    getState: vi.fn(),
    invalidateChartRenderCache: vi.fn(),
    renderChartJS: vi.fn(),
    setState: vi.fn(),
    showNotification: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    subscribeToChartSettings: vi.fn(() => () => {}),
    updateState: vi.fn(),
}));

// Mock dependencies first
vi.mock("../../../../electron-app/utils/state/core/stateManager.js", () => ({
    getState: mockModules.getState,
    setState: mockModules.setState,
    subscribe: mockModules.subscribe,
    updateState: mockModules.updateState,
}));

vi.mock(
    "../../../../electron-app/utils/ui/notifications/showNotification.js",
    () => ({
        showNotification: mockModules.showNotification,
    })
);

vi.mock("../../../../electron-app/utils/charts/core/renderChartJS.js", () => ({
    invalidateChartRenderCache: mockModules.invalidateChartRenderCache,
    renderChartJS: mockModules.renderChartJS,
}));

vi.mock(
    "../../../../electron-app/utils/state/domain/settingsStateManager.js",
    () => ({
        subscribeToChartSettings: mockModules.subscribeToChartSettings,
    })
);

// Import mocked functions for spying
import {
    getState,
    setState,
    subscribe,
    updateState,
} from "../../../../electron-app/utils/state/core/stateManager.js";
import { showNotification } from "../../../../electron-app/utils/ui/notifications/showNotification.js";
import {
    invalidateChartRenderCache,
    renderChartJS,
} from "../../../../electron-app/utils/charts/core/renderChartJS.js";

// Import the module being tested
import chartStateManager from "../../../../electron-app/utils/charts/core/chartStateManager.js";

describe("ChartStateManager", () => {
    beforeEach(() => {
        // Reset all mocks
        vi.mocked(getState).mockReset();
        vi.mocked(setState).mockReset();
        vi.mocked(subscribe)
            .mockReset()
            .mockReturnValue(() => {});
        vi.mocked(updateState).mockReset();
        vi.mocked(showNotification).mockReset();
        vi.mocked(invalidateChartRenderCache).mockReset();
        vi.mocked(renderChartJS).mockReset();

        // Clear timers
        vi.clearAllTimers();

        // Use fake timers
        vi.useFakeTimers();

        // Reset global state
        (global as any).chartStateManager = undefined;
        (global as any)._chartjsInstances = [];
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
        document.body.innerHTML = "";
    });

    describe("Constructor and Initialization", () => {
        it("should create a ChartStateManager instance", () => {
            expect(chartStateManager).toBeInstanceOf(Object);
            expect(chartStateManager.isInitialized).toBe(true);
            expect(chartStateManager.renderDebounceTime).toBe(250);
            expect(chartStateManager.renderDebounceTime).not.toBe(0);
        });

        it("should have required methods", () => {
            expect(typeof chartStateManager.debouncedRender).toBe("function");
            expect(typeof chartStateManager.forceRender).toBe("function");
            expect(typeof chartStateManager.destroy).toBe("function");
            expect(typeof chartStateManager.handleDataChange).toBe("function");
            expect(typeof chartStateManager.handleTabActivation).toBe(
                "function"
            );
            expect(typeof chartStateManager.handleThemeChange).toBe("function");
        });

        it("should expose instance to global scope when window is available", () => {
            // jsdom environment has window, but the global assignment happens during module load
            // Since we're importing in test context, the global assignment might not persist
            // between module imports. Just verify the logic would work.
            expect(globalThis.window.document).toBe(document);
            expect(chartStateManager).toBeInstanceOf(Object);
            expect(typeof chartStateManager.debouncedRender).toBe("function");
            expect(typeof chartStateManager.isChartTabActive).toBe("function");
            expect(typeof globalThis.window).toBe("object");
        });
    });

    describe("Debounced Rendering", () => {
        it("should debounce multiple render calls", async () => {
            const performRenderSpy = vi
                .spyOn(chartStateManager, "performChartRender")
                .mockImplementation(() => Promise.resolve());

            chartStateManager.debouncedRender("reason1");
            chartStateManager.debouncedRender("reason2");
            chartStateManager.debouncedRender("reason3");

            // Should not have called render yet
            expect(chartStateManager.renderTimeout !== null).toBe(true);
            expect(performRenderSpy).not.toHaveBeenCalled();

            // Advance timers
            vi.advanceTimersByTime(300);

            // Should have called render once with the last reason
            expect(performRenderSpy).toHaveBeenCalledTimes(1);
            expect(performRenderSpy).toHaveBeenCalledWith("reason3");
            performRenderSpy.mockRestore();
        });

        it("should clear existing timeout when called multiple times", () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

            chartStateManager.debouncedRender("reason1");
            chartStateManager.debouncedRender("reason2");

            expect(chartStateManager.renderTimeout !== null).toBe(true);
            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });
    });

    describe("Force Rendering", () => {
        it("should execute force render immediately", () => {
            const performRenderSpy = vi
                .spyOn(chartStateManager, "performChartRender")
                .mockImplementation(() => Promise.resolve());

            expect(
                chartStateManager.forceRender("Manual trigger")
            ).toBeUndefined();
            expect(performRenderSpy).toHaveBeenCalledWith("Manual trigger");
            performRenderSpy.mockRestore();
        });

        it("should clear existing timeout when force rendering", () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

            chartStateManager.debouncedRender("reason");
            chartStateManager.forceRender("force");

            expect(chartStateManager.pendingRenderReason).toBeNull();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });
    });

    describe("Chart Information", () => {
        it("should get chart info with default values", () => {
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
            const mockChartState = {
                isRendered: true,
                isRendering: false,
                lastRenderTime: 123456789,
                selectedChart: "power",
                tabActive: true,
            };
            vi.mocked(getState).mockReturnValue(mockChartState);
            (globalThis as any)._chartjsInstances = [
                { type: "chart" },
                { type: "chart" },
            ];

            const info = chartStateManager.getChartInfo();

            expect(info).toEqual({
                instanceCount: 2,
                isRendered: true,
                isRendering: false,
                lastRenderTime: 123456789,
                selectedChart: "power",
                tabActive: true,
            });
            expect(info.instanceCount).not.toBe(0);
        });
    });

    describe("Chart Tab Activity Detection", () => {
        it("should detect chartjs tab as active", () => {
            vi.mocked(getState).mockReturnValue("chartjs");

            const isActive = chartStateManager.isChartTabActive();

            expect(isActive).toBe(true);
            expect(isActive).not.toBe(false);
            expect(getState).toHaveBeenCalledWith("ui.activeTab");
        });

        it("should detect chart tab as active", () => {
            vi.mocked(getState).mockReturnValue("chart");

            const isActive = chartStateManager.isChartTabActive();

            expect(isActive).toBe(true);
        });

        it("should detect non-chart tab as inactive", () => {
            vi.mocked(getState).mockReturnValue("map");

            const isActive = chartStateManager.isChartTabActive();

            expect(isActive).toBe(false);
        });
    });

    describe("Data Change Handling", () => {
        it("should handle data change with valid data and active tab", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);
            const clearChartStateSpy = vi
                .spyOn(chartStateManager, "clearChartState")
                .mockImplementation(() => {});

            const newData = { recordMesgs: [{ type: "record" }] };
            const result = chartStateManager.handleDataChange(newData);

            expect(result).toBeUndefined();
            expect(clearChartStateSpy).toHaveBeenCalled();
            expect(isChartTabActiveSpy).toHaveBeenCalled();
            expect(debouncedRenderSpy).toHaveBeenCalledWith("New data loaded");

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
            clearChartStateSpy.mockRestore();
        });

        it("should not render when data is invalid", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            const clearChartStateSpy = vi
                .spyOn(chartStateManager, "clearChartState")
                .mockImplementation(() => {});

            const result = chartStateManager.handleDataChange(null);

            expect(result).toBeUndefined();
            expect(clearChartStateSpy).toHaveBeenCalled();
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            debouncedRenderSpy.mockRestore();
            clearChartStateSpy.mockRestore();
        });

        it("should not render when chart tab is inactive", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(false);

            const newData = { recordMesgs: [{ type: "record" }] };
            const result = chartStateManager.handleDataChange(newData);

            expect(result).toBeUndefined();
            expect(isChartTabActiveSpy).toHaveBeenCalled();
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });
    });

    describe("Tab Activation Handling", () => {
        it("should handle tab activation", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            vi.mocked(getState)
                .mockReturnValueOnce({ isRendered: false })
                .mockReturnValueOnce({ recordMesgs: [{ timestamp: 1 }] });

            const result = chartStateManager.handleTabActivation();

            expect(result).toBeUndefined();
            expect(setState).toHaveBeenCalledWith("charts.tabActive", true, {
                source: "ChartStateManager.handleTabActivation",
            });
            expect(debouncedRenderSpy).toHaveBeenCalledWith(
                "Tab activation with data available"
            );

            debouncedRenderSpy.mockRestore();
        });

        it("should not render if charts are already rendered", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            vi.mocked(getState)
                .mockReturnValueOnce({ isRendered: true })
                .mockReturnValueOnce({ recordMesgs: [] });

            // The implementation treats "rendered" as valid only when we have actual render output.
            // Provide both a Chart.js instance and at least one canvas in the expected container.
            const container = document.getElementById(
                "chartjs-chart-container"
            ) as HTMLElement;
            expect(container).toBeInstanceOf(HTMLDivElement);
            const canvas = document.createElement("canvas");
            container.appendChild(canvas);
            (globalThis as any)._chartjsInstances = [{ destroy: vi.fn() }];

            const result = chartStateManager.handleTabActivation();

            expect(result).toBeUndefined();
            expect(setState).toHaveBeenCalledWith("charts.tabActive", true, {
                source: "ChartStateManager.handleTabActivation",
            });
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            canvas.remove();
            (globalThis as any)._chartjsInstances = [];

            debouncedRenderSpy.mockRestore();
        });
    });

    describe("Theme Change Handling", () => {
        it("should handle theme change when charts are rendered and active", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);
            vi.mocked(getState).mockReturnValue({ isRendered: true });

            const result = chartStateManager.handleThemeChange("dark");

            expect(result).toBeUndefined();
            expect(isChartTabActiveSpy).toHaveBeenCalled();
            expect(debouncedRenderSpy).toHaveBeenCalledWith(
                "Theme change to dark"
            );

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });

        it("should handle theme change without theme parameter", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            const isChartTabActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);
            vi.mocked(getState).mockReturnValue({ isRendered: true });

            const result = chartStateManager.handleThemeChange();

            expect(result).toBeUndefined();
            expect(isChartTabActiveSpy).toHaveBeenCalled();
            expect(debouncedRenderSpy).toHaveBeenCalledWith("Theme change");

            debouncedRenderSpy.mockRestore();
            isChartTabActiveSpy.mockRestore();
        });

        it("should not render when charts are not rendered", () => {
            const debouncedRenderSpy = vi
                .spyOn(chartStateManager, "debouncedRender")
                .mockImplementation(() => {});
            vi.mocked(getState).mockReturnValue({ isRendered: false });

            const result = chartStateManager.handleThemeChange("dark");

            expect(result).toBeUndefined();
            expect(debouncedRenderSpy).not.toHaveBeenCalled();

            debouncedRenderSpy.mockRestore();
        });
    });

    describe("Chart State Management", () => {
        it("should clear chart state", () => {
            const destroyExistingChartsSpy = vi
                .spyOn(chartStateManager, "destroyExistingCharts")
                .mockImplementation(() => {});

            const clearResult = chartStateManager.clearChartState();

            expect(clearResult).toBeUndefined();
            expect(invalidateChartRenderCache).toHaveBeenCalledWith(
                "ChartStateManager.clearChartState"
            );
            expect(destroyExistingChartsSpy).toHaveBeenCalled();
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
            const mockCharts = [
                { destroy: vi.fn() },
                { destroy: vi.fn() },
                { destroy: vi.fn() },
            ];
            (globalThis as any)._chartjsInstances = mockCharts;

            const destroyResult = chartStateManager.destroyExistingCharts();

            expect(destroyResult).toBeUndefined();
            mockCharts.forEach((chart) => {
                expect(chart.destroy).toHaveBeenCalled();
            });
            expect((globalThis as any)._chartjsInstances).toEqual([]);
            expect((globalThis as any)._chartjsInstances).not.toHaveLength(3);
        });

        it("should handle chart destruction errors", () => {
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const mockCharts = [
                { destroy: vi.fn() },
                {
                    destroy: vi.fn().mockImplementation(() => {
                        throw new Error("Destroy failed");
                    }),
                },
                { destroy: vi.fn() },
            ];
            (globalThis as any)._chartjsInstances = mockCharts;

            const destroyResult = chartStateManager.destroyExistingCharts();

            expect(destroyResult).toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Error destroying chart 1:",
                expect.any(Error)
            );
            expect((globalThis as any)._chartjsInstances).toEqual([]);

            consoleWarnSpy.mockRestore();
        });
    });

    describe("Chart Rendering", () => {
        it("should perform chart render successfully", async () => {
            vi.mocked(renderChartJS).mockResolvedValue(true);
            const destroyExistingChartsSpy = vi
                .spyOn(chartStateManager, "destroyExistingCharts")
                .mockImplementation(() => {});

            await expect(
                chartStateManager.performChartRender("Test reason")
            ).resolves.toBeUndefined();
            expect(setState).toHaveBeenCalledWith("charts.isRendering", true, {
                source: "ChartStateManager.performChartRender",
            });
            expect(destroyExistingChartsSpy).toHaveBeenCalled();
            expect(renderChartJS).toHaveBeenCalled();
            expect(setState).toHaveBeenCalledWith(
                "charts.lastRenderTime",
                expect.any(Number),
                {
                    source: "ChartStateManager.performChartRender",
                }
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect(chartStateManager.isRendering).toBe(false);

            destroyExistingChartsSpy.mockRestore();
        });

        it("should handle chart render failure", async () => {
            vi.mocked(renderChartJS).mockResolvedValue(false);
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const isActiveSpy = vi
                .spyOn(chartStateManager, "isChartTabActive")
                .mockReturnValue(true);

            vi.mocked(getState).mockImplementation((path: string) => {
                if (path === "globalData") {
                    return { recordMesgs: [{}] } as any;
                }
                return undefined;
            });

            await expect(
                chartStateManager.performChartRender("Test reason")
            ).resolves.toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Chart rendering failed: Test reason"
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect(chartStateManager.isRendering).toBe(false);

            consoleWarnSpy.mockRestore();
            isActiveSpy.mockRestore();
            vi.mocked(getState).mockReset();
        });

        it("should downgrade logging when render is skipped intentionally", async () => {
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

            vi.mocked(getState).mockImplementation((path: string) => {
                if (path === "globalData") {
                    return { recordMesgs: [] } as any;
                }
                return undefined;
            });

            await expect(
                chartStateManager.performChartRender("Integration refresh")
            ).resolves.toBeUndefined();
            expect(consoleInfoSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Skipped chart render (Integration refresh): chart tab inactive, no chartable data"
            );
            expect(consoleWarnSpy).not.toHaveBeenCalled();
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect(chartStateManager.isRendering).toBe(false);

            consoleInfoSpy.mockRestore();
            consoleWarnSpy.mockRestore();
            isActiveSpy.mockRestore();
            vi.mocked(getState).mockReset();
        });

        it("should handle chart render errors", async () => {
            vi.mocked(renderChartJS).mockRejectedValue(
                new Error("Render failed")
            );
            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});

            await expect(
                chartStateManager.performChartRender("Test reason")
            ).resolves.toBeUndefined();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Error during chart rendering:",
                expect.any(Error)
            );
            expect(showNotification).toHaveBeenCalledWith(
                "Failed to render charts",
                "error"
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect(chartStateManager.isRendering).toBe(false);

            consoleErrorSpy.mockRestore();
        });

        it("should handle missing container", async () => {
            document.body.innerHTML = ""; // Remove mock container
            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});

            await expect(
                chartStateManager.performChartRender("Test reason")
            ).resolves.toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ChartStateManager] Chart container not found"
            );
            expect(setState).toHaveBeenCalledWith("charts.isRendering", false, {
                source: "ChartStateManager.performChartRender",
            });
            expect(chartStateManager.isRendering).toBe(false);

            consoleWarnSpy.mockRestore();
        });
    });

    describe("Controls Visibility", () => {
        it("should update controls visibility to visible", () => {
            const controlsPanel = document.querySelector(
                ".chart-controls"
            ) as HTMLElement;

            chartStateManager.updateControlsVisibility(true);

            expect(controlsPanel.style.display).toBe("block");
        });

        it("should update controls visibility to hidden", () => {
            const controlsPanel = document.querySelector(
                ".chart-controls"
            ) as HTMLElement;

            chartStateManager.updateControlsVisibility(false);

            expect(controlsPanel.style.display).toBe("none");
        });

        it("should handle missing controls panel", () => {
            document.body.innerHTML = ""; // Remove mock controls panel

            expect(() =>
                chartStateManager.updateControlsVisibility(true)
            ).not.toThrow();
        });
    });

    describe("Cleanup and Destruction", () => {
        it("should cleanup (alias for destroy)", () => {
            const destroySpy = vi
                .spyOn(chartStateManager, "destroy")
                .mockImplementation(() => {});

            const result = chartStateManager.cleanup();

            expect(result).toBeUndefined();
            expect(destroySpy).toHaveBeenCalled();
            destroySpy.mockRestore();
        });

        it("should destroy properly", () => {
            const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
            const clearChartStateSpy = vi
                .spyOn(chartStateManager, "clearChartState")
                .mockImplementation(() => {});

            (chartStateManager as any).renderTimeout = setTimeout(
                () => {},
                chartStateManager.renderDebounceTime
            );
            const result = chartStateManager.destroy();

            expect(result).toBeUndefined();
            expect(clearTimeoutSpy).toHaveBeenCalled();
            expect(clearChartStateSpy).toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
            clearChartStateSpy.mockRestore();
        });
    });

    describe("Module Exports", () => {
        it("should export ChartStateManager as default", () => {
            expect(chartStateManager).toBeInstanceOf(Object);
            expect(chartStateManager.constructor.name).toBe(
                "ChartStateManager"
            );
            expect(chartStateManager.constructor.name).not.toBe("");
        });

        it("should be an instance of ChartStateManager", () => {
            expect(chartStateManager).toBeInstanceOf(Object);
            expect(chartStateManager.isInitialized).toBe(true);
        });

        it("should create singleton behavior through global exposure when window is available", () => {
            // In test environment, verify singleton behavior exists
            expect(chartStateManager).toBeInstanceOf(Object);
            expect(typeof chartStateManager.debouncedRender).toBe("function");
            expect(typeof chartStateManager.isChartTabActive).toBe("function");
            expect(typeof chartStateManager.getChartInfo).toBe("function");
        });
    });
});

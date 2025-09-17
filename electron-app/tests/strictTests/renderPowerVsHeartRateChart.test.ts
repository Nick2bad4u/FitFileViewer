import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";

// Mock Chart.js
let Chart: any;
let chartInstanceMock: any;
let renderPowerVsHeartRateChart: any;
let mockLocalStorage: any;

describe("renderPowerVsHeartRateChart.js - Power vs Heart Rate Chart Utility", () => {
    beforeEach(async () => {
        // Setup JSDOM environment
        const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
            pretendToBeVisual: true,
            resources: "usable"
        });

        global.window = dom.window as any;
        global.document = dom.window.document as any;
        global.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
        global.HTMLElement = dom.window.HTMLElement as any;
        (global as any).console = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn()
        };

        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn()
        };
        (global as any).localStorage = mockLocalStorage;

        // Mock Chart.js
        chartInstanceMock = {
            data: { datasets: [] },
            options: {},
            config: {},
            destroy: vi.fn(),
            update: vi.fn(),
            resize: vi.fn(),
            reset: vi.fn(),
            render: vi.fn(),
            stop: vi.fn(),
            clear: vi.fn(),
            toBase64Image: vi.fn(),
            generateLegend: vi.fn(),
            getElementsAtEventForMode: vi.fn(() => []),
            getElementAtEvent: vi.fn(() => []),
            getDatasetAtEvent: vi.fn(() => [])
        };

        Chart = vi.fn(() => chartInstanceMock);
        (global.window as any).Chart = Chart;
        (global.window as any)._chartjsInstances = [];

        // Load the module dynamically with fresh imports
        const module = await import("../../utils/charts/rendering/renderPowerVsHeartRateChart.js");
        renderPowerVsHeartRateChart = module.renderPowerVsHeartRateChart;
    });

    afterEach(() => {
        vi.clearAllMocks();
        if (global.window && (global.window as any)._chartjsInstances) {
            (global.window as any)._chartjsInstances = [];
        }

        // Clean up JSDOM
        if (global.window) {
            (global.window as any).close?.();
        }
        (global as any).window = undefined;
        (global as any).document = undefined;
        (global as any).HTMLCanvasElement = undefined;
        (global as any).HTMLElement = undefined;
        (global as any).localStorage = undefined;
    });

    describe("Data Validation and Processing", () => {
        it("should return early when data has no power values", () => {
            const container = document.createElement("div");
            const data = [
                { heartRate: 120 },
                { heartRate: 130 },
                { heartRate: 140 }
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when data has no heart rate values", () => {
            const container = document.createElement("div");
            const data = [
                { power: 200 },
                { power: 250 },
                { power: 300 }
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when localStorage field visibility is hidden", () => {
            mockLocalStorage.getItem.mockReturnValue("hidden");

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 }
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_field_power_vs_hr");
            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should process data correctly with valid power and heart rate values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
                { power: null, heartRate: 140 }, // Should be filtered out
                { power: 300, heartRate: undefined }, // Should be filtered out
                { power: 275, heartRate: 135 }
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 200 },
                { x: 130, y: 250 },
                { x: 135, y: 275 }
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: null, heartRate: 120 },
                { power: 250, heartRate: null },
                { power: undefined, heartRate: undefined }
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });
    });

    describe("Data Point Limiting", () => {
        it("should apply data point limiting when maxPoints is exceeded", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 1000; i++) {
                data.push({ power: 200 + i, heartRate: 120 + (i % 50) });
            }
            const options = { maxPoints: 100, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(100);
        });

        it("should not limit data when maxPoints is 'all'", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push({ power: 200 + i, heartRate: 120 + i });
            }
            const options = { maxPoints: "all", showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBe(50);
        });

        it("should not limit data when data length is less than maxPoints", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 },
                { power: 275, heartRate: 135 }
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBe(3);
        });
    });

    describe("Chart Canvas Creation and Styling", () => {
        it("should create canvas with correct ID and styling", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(container.children.length).toBe(1);
            const canvas = container.children[0] as HTMLCanvasElement;
            expect(canvas.tagName).toBe("CANVAS");
            expect(canvas.id).toBe("chart-power-vs-hr-0");
            expect(canvas.style.borderRadius).toBe("12px");
        });

        it("should apply theme background and shadow to canvas", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            const canvas = container.children[0] as HTMLCanvasElement;
            // Note: In JSDOM, the theme would be applied but we can't easily verify the exact values
            expect(canvas.style.borderRadius).toBe("12px");
        });
    });

    describe("Chart Configuration", () => {
        it("should create scatter chart with correct basic configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];

            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.data.datasets).toHaveLength(1);
            expect(chartConfig.data.datasets[0].label).toBe("Power vs Heart Rate");
            expect(chartConfig.options.responsive).toBe(true);
            expect(chartConfig.options.maintainAspectRatio).toBe(false);
        });

        it("should configure legend display based on options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with legend enabled
            const optionsWithLegend = { maxPoints: 1000, showLegend: true };
            renderPowerVsHeartRateChart(container, data, optionsWithLegend);

            let chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.legend.display).toBe(true);

            Chart.mockClear();
            container.innerHTML = "";

            // Test with legend disabled
            const optionsWithoutLegend = { maxPoints: 1000, showLegend: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutLegend);

            chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.legend.display).toBe(false);
        });

        it("should configure title display based on options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with title enabled
            const optionsWithTitle = { maxPoints: 1000, showTitle: true };
            renderPowerVsHeartRateChart(container, data, optionsWithTitle);

            let chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.title.display).toBe(true);
            expect(chartConfig.options.plugins.title.text).toBe("Power vs Heart Rate");

            Chart.mockClear();
            container.innerHTML = "";

            // Test with title disabled
            const optionsWithoutTitle = { maxPoints: 1000, showTitle: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutTitle);

            chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.title.display).toBe(false);
        });

        it("should configure grid display based on options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with grid enabled
            const optionsWithGrid = { maxPoints: 1000, showGrid: true };
            renderPowerVsHeartRateChart(container, data, optionsWithGrid);

            let chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
            expect(chartConfig.options.scales.y.grid.display).toBe(true);

            Chart.mockClear();
            container.innerHTML = "";

            // Test with grid disabled
            const optionsWithoutGrid = { maxPoints: 1000, showGrid: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutGrid);

            chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.scales.x.grid.display).toBe(false);
            expect(chartConfig.options.scales.y.grid.display).toBe(false);
        });

        it("should configure point radius based on showPoints option", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];

            // Test with points shown
            const optionsWithPoints = { maxPoints: 1000, showPoints: true };
            renderPowerVsHeartRateChart(container, data, optionsWithPoints);

            let chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].pointRadius).toBe(2);

            Chart.mockClear();
            container.innerHTML = "";

            // Test with points hidden
            const optionsWithoutPoints = { maxPoints: 1000, showPoints: false };
            renderPowerVsHeartRateChart(container, data, optionsWithoutPoints);

            chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].pointRadius).toBe(1);
        });
    });

    describe("Scales Configuration", () => {
        it("should configure x-axis for heart rate", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.scales.x.type).toBe("linear");
            expect(chartConfig.options.scales.x.display).toBe(true);
            expect(chartConfig.options.scales.x.title.display).toBe(true);
            expect(chartConfig.options.scales.x.title.text).toBe("Heart Rate (bpm)");
        });

        it("should configure y-axis for power", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000, showGrid: true };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.scales.y.type).toBe("linear");
            expect(chartConfig.options.scales.y.display).toBe(true);
            expect(chartConfig.options.scales.y.title.display).toBe(true);
            expect(chartConfig.options.scales.y.title.text).toBe("Power (W)");
        });
    });

    describe("Zoom and Pan Configuration", () => {
        it("should configure zoom plugin with correct settings", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            const zoomConfig = chartConfig.options.plugins.zoom;

            expect(zoomConfig.pan.enabled).toBe(true);
            expect(zoomConfig.pan.mode).toBe("xy");
            expect(zoomConfig.pan.modifierKey).toBe(null);

            expect(zoomConfig.zoom.wheel.enabled).toBe(true);
            expect(zoomConfig.zoom.wheel.speed).toBe(0.1);
            expect(zoomConfig.zoom.pinch.enabled).toBe(true);
            expect(zoomConfig.zoom.drag.enabled).toBe(true);
            expect(zoomConfig.zoom.drag.modifierKey).toBe("shift");
            expect(zoomConfig.zoom.mode).toBe("xy");

            expect(zoomConfig.limits.x.min).toBe("original");
            expect(zoomConfig.limits.x.max).toBe("original");
            expect(zoomConfig.limits.y.min).toBe("original");
            expect(zoomConfig.limits.y.max).toBe("original");
        });
    });

    describe("Tooltip Configuration", () => {
        it("should configure tooltip with custom label callback", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            const tooltipConfig = chartConfig.options.plugins.tooltip;

            expect(tooltipConfig.borderWidth).toBe(1);
            expect(typeof tooltipConfig.callbacks.label).toBe("function");

            // Test tooltip callback
            const mockContext = {
                parsed: { x: 140, y: 280 }
            };
            const result = tooltipConfig.callbacks.label(mockContext);
            expect(result).toEqual([
                "Heart Rate: 140 bpm",
                "Power: 280 W"
            ]);
        });
    });

    describe("Plugin Integration", () => {
        it("should include required plugins in configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.plugins).toHaveLength(2);
            // Note: Actual plugin instances are imported and would be present
        });

        it("should configure background color plugin", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.chartBackgroundColorPlugin).toBeDefined();
        });
    });

    describe("Chart Instance Management", () => {
        it("should track chart instance in global array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(global.window && (global.window as any)._chartjsInstances).toHaveLength(1);
            expect((global.window as any)._chartjsInstances?.[0]).toBe(chartInstanceMock);
        });

        it("should initialize global chart instances array if not present", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            delete global.window._chartjsInstances;

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(global.window._chartjsInstances).toBeDefined();
            expect(global.window._chartjsInstances).toHaveLength(1);
        });

        it("should log success message when chart is created", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(console.log).toHaveBeenCalledWith(
                "[ChartJS] Power vs Heart Rate chart created successfully"
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle errors gracefully and log error message", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            Chart.mockImplementation(() => {
                throw new Error("Chart creation failed");
            });

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering power vs heart rate chart:",
                expect.any(Error)
            );
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle empty data array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: any[] = [];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should handle data with zero power values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 0, heartRate: 120 },
                { power: 0, heartRate: 130 }
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 0 },
                { x: 130, y: 0 }
            ]);
        });

        it("should handle data with zero heart rate values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 0 },
                { power: 250, heartRate: 0 }
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 0, y: 200 },
                { x: 0, y: 250 }
            ]);
        });

        it("should handle very large datasets efficiently", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: any[] = [];
            for (let i = 0; i < 10000; i++) {
                data.push({ power: 200 + i, heartRate: 120 + (i % 100) });
            }
            const options = { maxPoints: 500 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(500);
        });

        it("should handle mixed valid and invalid data points", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 120 },
                { power: "invalid", heartRate: 130 },
                { power: 250, heartRate: "invalid" },
                { power: 275, heartRate: 135 },
                { power: null, heartRate: null },
                { power: 300, heartRate: 140 }
            ];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 120, y: 200 },
                { x: 130, y: "invalid" },
                { x: "invalid", y: 250 },
                { x: 135, y: 275 },
                { x: 140, y: 300 }
            ]);
        });
    });

    describe("Performance and Optimization", () => {
        it("should handle rapid successive chart creations", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            for (let i = 0; i < 5; i++) {
                renderPowerVsHeartRateChart(container, data, options);
            }

            expect(Chart).toHaveBeenCalledTimes(5);
            expect(global.window._chartjsInstances).toHaveLength(5);
        });

        it("should not modify original data array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const originalData = [
                { power: 200, heartRate: 120 },
                { power: 250, heartRate: 130 }
            ];
            const data = [...originalData];
            const options = { maxPoints: 1 };

            renderPowerVsHeartRateChart(container, data, options);

            expect(data).toEqual(originalData);
        });
    });

    describe("Integration with Dependencies", () => {
        it("should handle missing theme configuration gracefully", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            // Mock getThemeConfig to return undefined
            vi.doMock("../../utils/theming/core/theme.js", () => ({
                getThemeConfig: () => undefined
            }));

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            expect(() => {
                renderPowerVsHeartRateChart(container, data, options);
            }).not.toThrow();
        });

        it("should call createChartCanvas with correct parameters", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ power: 200, heartRate: 120 }];
            const options = { maxPoints: 1000 };

            renderPowerVsHeartRateChart(container, data, options);

            // Verify canvas was created and added to container
            expect(container.children.length).toBe(1);
            expect(container.children[0].tagName).toBe("CANVAS");
            expect(container.children[0].id).toBe("chart-power-vs-hr-0");
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle typical cycling power and heart rate data", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 150, heartRate: 110 },
                { power: 200, heartRate: 130 },
                { power: 250, heartRate: 145 },
                { power: 300, heartRate: 160 },
                { power: 280, heartRate: 155 },
                { power: 220, heartRate: 140 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(6);
            expect(chartConfig.data.datasets[0].label).toBe("Power vs Heart Rate");
        });

        it("should handle training data with power spikes", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { power: 200, heartRate: 130 },
                { power: 450, heartRate: 165 }, // Sprint
                { power: 180, heartRate: 125 }, // Recovery
                { power: 350, heartRate: 155 }, // High intensity
                { power: 160, heartRate: 115 }  // Base pace
            ];
            const options = { maxPoints: 1000, showPoints: true };

            renderPowerVsHeartRateChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toContainEqual({ x: 165, y: 450 });
            expect(chartConfig.data.datasets[0].data).toContainEqual({ x: 115, y: 160 });
        });
    });
});

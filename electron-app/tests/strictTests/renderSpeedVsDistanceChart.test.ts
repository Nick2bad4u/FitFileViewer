import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";

// Mock Chart.js
let Chart: any;
let chartInstanceMock: any;
let renderSpeedVsDistanceChart: any;
let mockLocalStorage: any;

describe("renderSpeedVsDistanceChart.js - Speed vs Distance Chart Utility", () => {
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
        const module = await import("../../utils/charts/rendering/renderSpeedVsDistanceChart.js");
        renderSpeedVsDistanceChart = module.renderSpeedVsDistanceChart;
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
        it("should return early when data has no speed values", () => {
            const container = document.createElement("div");
            const data = [
                { distance: 1000 },
                { distance: 2000 },
                { distance: 3000 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when data has no distance values", () => {
            const container = document.createElement("div");
            const data = [
                { speed: 5.5 },
                { speed: 6.0 },
                { speed: 4.8 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when localStorage field visibility is hidden", () => {
            mockLocalStorage.getItem.mockReturnValue("hidden");

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, distance: 1000 },
                { speed: 6.0, distance: 2000 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_field_speed_vs_distance");
            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should process data correctly with valid speed and distance values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, distance: 1000 },
                { speed: 6.0, distance: 2000 },
                { speed: null, distance: 3000 }, // Should be filtered out
                { speed: 4.8, distance: undefined }, // Should be filtered out
                { speed: 5.2, distance: 2500 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 1, y: 5.5 }, // Distance converted from meters to km, speed stays same (no conversion)
                { x: 2, y: 6.0 },
                { x: 2.5, y: 5.2 }
            ]);
        });

        it("should handle enhancedSpeed preference over speed", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, enhancedSpeed: 5.8, distance: 1000 },
                { speed: 6.0, enhancedSpeed: 6.2, distance: 2000 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toEqual([
                { x: 1, y: 5.8 }, // enhancedSpeed used instead of speed, no conversion
                { x: 2, y: 6.2 }
            ]);
        });

        it("should return early when no valid data points exist after filtering", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: null, distance: 1000 },
                { speed: 5.5, distance: null },
                { speed: undefined, distance: undefined }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

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
                data.push({ speed: 5.0 + (i * 0.01), distance: 100 * i });
            }
            const options = { maxPoints: 100, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(100);
        });

        it("should not limit data when maxPoints is 'all'", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push({ speed: 5.0 + i, distance: 1000 * i });
            }
            const options = { maxPoints: "all", showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBe(50);
        });

        it("should handle data point limiting with exact step calculation", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 200; i++) {
                data.push({ speed: 5.0 + i, distance: 100 * i });
            }
            const options = { maxPoints: 50, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(50);
        });
    });

    describe("Chart Configuration", () => {
        it("should create scatter chart with correct type and configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 5.5, distance: 1000 },
                { speed: 6.0, distance: 2000 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.data.datasets[0].label).toBe("Speed vs Distance");
            expect(chartConfig.data.datasets[0].showLine).toBe(true);
            expect(chartConfig.data.datasets[0].fill).toBe(false);
            expect(chartConfig.data.datasets[0].tension).toBe(0.1);
            expect(chartConfig.data.datasets[0].borderWidth).toBe(2);
        });

        it("should configure chart options based on provided options - all enabled", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].pointRadius).toBe(2);
            expect(chartConfig.options.plugins.legend.display).toBe(true);
            expect(chartConfig.options.plugins.title.display).toBe(true);
            expect(chartConfig.options.plugins.title.text).toBe("Speed vs Distance");
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
            expect(chartConfig.options.scales.y.grid.display).toBe(true);
        });

        it("should configure chart options based on provided options - all disabled", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: false, showLegend: false, showTitle: false, showGrid: false };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].pointRadius).toBe(1);
            expect(chartConfig.options.plugins.legend.display).toBe(false);
            expect(chartConfig.options.plugins.title.display).toBe(false);
            expect(chartConfig.options.scales.x.grid.display).toBe(false);
            expect(chartConfig.options.scales.y.grid.display).toBe(false);
        });

        it("should set correct axis titles and configuration", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.scales.x.type).toBe("linear");
            expect(chartConfig.options.scales.x.display).toBe(true);
            expect(chartConfig.options.scales.x.title.display).toBe(true);
            expect(chartConfig.options.scales.x.title.text).toContain("Distance");

            expect(chartConfig.options.scales.y.type).toBe("linear");
            expect(chartConfig.options.scales.y.display).toBe(true);
            expect(chartConfig.options.scales.y.title.display).toBe(true);
            expect(chartConfig.options.scales.y.title.text).toContain("Speed");
        });

        it("should configure zoom and pan options correctly", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.zoom.pan.enabled).toBe(true);
            expect(chartConfig.options.plugins.zoom.pan.mode).toBe("x");
            expect(chartConfig.options.plugins.zoom.zoom.wheel.enabled).toBe(true);
            expect(chartConfig.options.plugins.zoom.zoom.pinch.enabled).toBe(true);
            expect(chartConfig.options.plugins.zoom.zoom.drag.enabled).toBe(true);
            expect(chartConfig.options.plugins.zoom.zoom.mode).toBe("x");
            expect(chartConfig.options.plugins.zoom.limits.x.min).toBe("original");
            expect(chartConfig.options.plugins.zoom.limits.x.max).toBe("original");
            expect(chartConfig.options.plugins.zoom.limits.y.min).toBe("original");
            expect(chartConfig.options.plugins.zoom.limits.y.max).toBe("original");
        });
    });

    describe("Canvas Creation and Styling", () => {
        it("should create canvas with correct ID and styling", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(container.children.length).toBe(1);
            const canvas = container.children[0] as HTMLCanvasElement;
            expect(canvas.tagName).toBe("CANVAS");
            expect(canvas.id).toBe("chart-speed-vs-distance-0"); // Actual format from createChartCanvas
            expect(canvas.style.borderRadius).toBe("12px");
        });

        it("should append canvas to container", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(container.children.length).toBe(1);
            expect(container.children[0]).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe("Chart Instance Management", () => {
        it("should add chart instance to global instances array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect((global.window as any)._chartjsInstances).toHaveLength(1);
            expect((global.window as any)._chartjsInstances[0]).toBe(chartInstanceMock);
        });

        it("should initialize global instances array if it doesn't exist", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            (global.window as any)._chartjsInstances = undefined;

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect((global.window as any)._chartjsInstances).toBeDefined();
            expect((global.window as any)._chartjsInstances).toHaveLength(1);
        });

        it("should log success message when chart is created", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(console.log).toHaveBeenCalledWith("[ChartJS] Speed vs Distance chart created successfully");
        });
    });

    describe("Tooltip Configuration", () => {
        it("should configure tooltip with distance and speed formatting", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.tooltip).toBeDefined();
            expect(chartConfig.options.plugins.tooltip.callbacks.label).toBeDefined();
            expect(typeof chartConfig.options.plugins.tooltip.callbacks.label).toBe("function");
        });

        it("should format tooltip correctly with kilometers distance units", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return "kilometers";
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 1, y: 19.8 } // 1 km, 19.8 km/h
            };

            const result = tooltipCallback(mockContext);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            expect(result[0]).toContain("Distance:");
            expect(result[1]).toContain("Speed:");
        });

        it("should format tooltip correctly with feet distance units", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return "feet";
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 3280.84, y: 19.8 } // feet, km/h
            };

            const result = tooltipCallback(mockContext);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
        });

        it("should format tooltip correctly with miles distance units", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return "miles";
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 0.621371, y: 19.8 } // miles, km/h
            };

            const result = tooltipCallback(mockContext);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
        });

        it("should handle tooltip formatting with default units when no localStorage value", () => {
            mockLocalStorage.getItem.mockImplementation((key: string) => {
                if (key === "chartjs_field_speed_vs_distance") return null;
                if (key === "chartjs_distanceUnits") return null;
                return null;
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
            const mockContext = {
                parsed: { x: 1, y: 19.8 }
            };

            const result = tooltipCallback(mockContext);
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
        });
    });

    describe("Plugin Configuration", () => {
        it("should include chartZoomResetPlugin and chartBackgroundColorPlugin", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.plugins).toBeDefined();
            expect(chartConfig.plugins).toHaveLength(2);
        });

        it("should configure chartBackgroundColorPlugin with theme colors", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.chartBackgroundColorPlugin).toBeDefined();
        });
    });

    describe("Error Handling", () => {
        it("should handle Chart.js constructor throwing error", () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            Chart.mockImplementation(() => {
                throw new Error("Chart creation failed");
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            expect(() => {
                renderSpeedVsDistanceChart(container, data, options);
            }).not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
        });

        it("should handle errors during canvas creation", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            // Mock window.Chart to throw an error when instantiated
            const mockChart = vi.fn().mockImplementation(() => {
                throw new Error("Chart creation failed");
            });

            // Setup the Chart mock on window
            Object.defineProperty(window, 'Chart', {
                value: mockChart,
                writable: true,
                configurable: true
            });

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];

            expect(() => {
                renderSpeedVsDistanceChart(container, data, { maxPoints: 100 });
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });

        it("should handle null container gracefully", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            expect(() => {
                renderSpeedVsDistanceChart(null as any, data, options);
            }).not.toThrow();

            expect(console.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering speed vs distance chart:",
                expect.any(Error)
            );
        });
    });

    describe("Responsive Configuration", () => {
        it("should set responsive and maintainAspectRatio options", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [{ speed: 5.5, distance: 1000 }];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.options.responsive).toBe(true);
            expect(chartConfig.options.maintainAspectRatio).toBe(false);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty data array", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data: any[] = [];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should handle data with zero values", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [
                { speed: 0, distance: 0 },
                { speed: 5.5, distance: 1000 }
            ];
            const options = { maxPoints: 1000, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(2);
        });

        it("should handle fractional maxPoints calculation", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const container = document.createElement("div");
            const data = [];
            for (let i = 0; i < 100; i++) {
                data.push({ speed: 5.0 + i, distance: 100 * i });
            }
            const options = { maxPoints: 33, showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderSpeedVsDistanceChart(container, data, options);

            expect(Chart).toHaveBeenCalled();
            const chartConfig = Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(33);
        });
    });
});

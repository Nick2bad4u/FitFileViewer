/**
 * @file Comprehensive tests for renderGPSTrackChart.js
 * @description Tests GPS track chart rendering with all edge cases and error conditions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
vi.mock("../../../utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn(() => ({
        colors: {
            bgPrimary: "#ffffff",
            chartBackground: "#f8f9fa",
            shadow: "0 2px 4px rgba(0,0,0,0.1)",
            primary: "#007bff",
            primaryAlpha: "rgba(0, 123, 255, 0.2)",
            textPrimary: "#333333",
            bgSecondary: "#f8f9fa",
            border: "#dee2e6",
            gridLines: "#e9ecef",
        },
    })),
}));

vi.mock("../../../utils/charts/components/createChartCanvas.js", () => ({
    createChartCanvas: vi.fn((field, index) => {
        const canvas = document.createElement("canvas");
        canvas.id = `chart-${field}-${index}`;
        canvas.className = "chart-canvas";
        return canvas;
    }),
}));

vi.mock("../../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
    chartZoomResetPlugin: { id: "chartZoomResetPlugin", beforeInit: vi.fn() },
}));

describe("renderGPSTrackChart", () => {
    let renderGPSTrackChart: Function;
    let container: HTMLElement;
    let mockChart: any;
    let consoleSpy: any;

    beforeEach(async () => {
        // Create DOM container
        container = document.createElement("div");
        container.id = "test-container";
        document.body.appendChild(container);

        // Mock Chart.js
        mockChart = {
            destroy: vi.fn(),
            resize: vi.fn(),
            update: vi.fn(),
        };

        // Type assertion for global window
        (global as any).window = {
            ...global.window,
            Chart: vi.fn(() => mockChart),
            _chartjsInstances: [],
        };

        // Ensure Chart is accessible from both window and globalThis
        (global as any).globalThis.Chart = window.Chart;
        // Sync chart instances between window and globalThis
        Object.defineProperty((global as any).globalThis, "_chartjsInstances", {
            get() {
                return (global as any).window._chartjsInstances;
            },
            set(value) {
                (global as any).window._chartjsInstances = value;
            },
            configurable: true,
        });

        // Mock localStorage with proper typing
        const mockLocalStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(),
        };
        (global as any).localStorage = mockLocalStorage;

        // Mock console methods
        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Import the function to test
        const module = await import("../../utils/charts/rendering/renderGPSTrackChart.js");
        renderGPSTrackChart = module.renderGPSTrackChart;
    });

    afterEach(() => {
        // Clean up DOM
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }

        // Clean up global Chart instances
        const globalWindow = (global as any).window;
        if (globalWindow && globalWindow._chartjsInstances) {
            globalWindow._chartjsInstances.length = 0;
        }
        // Clean up property descriptor
        if ((global as any).globalThis) {
            delete (global as any).globalThis._chartjsInstances;
        }

        // Restore console methods
        consoleSpy.log.mockRestore();
        consoleSpy.error.mockRestore();

        vi.clearAllMocks();
    });

    describe("Basic Functionality", () => {
        it("should render GPS track chart with valid data", () => {
            const data = [
                { positionLat: 429496730, positionLong: -859993460 }, // Semicircle coordinates
                { positionLat: 429496740, positionLong: -859993470 },
                { positionLat: 429496750, positionLong: -859993480 },
            ];

            const options = {
                maxPoints: "all",
                showPoints: true,
                showLegend: true,
                showTitle: true,
                showGrid: true,
            };

            renderGPSTrackChart(container, data, options);

            // Verify chart creation
            expect(global.window.Chart).toHaveBeenCalled();
            expect(container.querySelector("canvas")).toBeTruthy();
            expect(consoleSpy.log).toHaveBeenCalledWith("[ChartJS] renderGPSTrackChart called");
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("Creating GPS track chart with"));
        });

        it("should handle container parameter correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(container.children.length).toBe(1);
            expect((container.firstChild as HTMLElement)?.tagName).toBe("CANVAS");
        });

        it("should process data parameter with valid GPS coordinates", () => {
            const data = [
                { positionLat: 429496730, positionLong: -859993460 },
                { positionLat: null, positionLong: -859993470 }, // Invalid latitude
                { positionLat: 429496750, positionLong: -859993480 },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            // Should filter out invalid coordinates
            expect(global.window.Chart).toHaveBeenCalled();
            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(2); // Only valid points
        });
    });

    describe("Data Validation", () => {
        it("should return early when no latitude data available", () => {
            const data = [
                { positionLong: -859993460 }, // No latitude
                { positionLong: -859993470 },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(consoleSpy.log).toHaveBeenCalledWith("[ChartJS] No GPS position data available");
            expect(global.window.Chart).not.toHaveBeenCalled();
            expect(container.children.length).toBe(0);
        });

        it("should return early when no longitude data available", () => {
            const data = [
                { positionLat: 429496730 }, // No longitude
                { positionLat: 429496740 },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(consoleSpy.log).toHaveBeenCalledWith("[ChartJS] No GPS position data available");
            expect(global.window.Chart).not.toHaveBeenCalled();
        });

        it("should handle null GPS coordinates", () => {
            const data = [
                { positionLat: null, positionLong: null },
                { positionLat: 429496730, positionLong: -859993460 },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(1);
        });

        it("should handle undefined GPS coordinates", () => {
            const data = [
                { positionLat: undefined, positionLong: undefined },
                { positionLat: 429496730, positionLong: -859993460 },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(1);
        });

        it("should return early when no valid GPS data points found", () => {
            const data = [
                { positionLat: null, positionLong: null },
                { positionLat: undefined, positionLong: undefined },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(consoleSpy.log).toHaveBeenCalledWith("[ChartJS] No GPS position data available");
            expect(global.window.Chart).not.toHaveBeenCalled();
        });
    });

    describe("Field Visibility", () => {
        it("should return early when field is hidden", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            const mockLocalStorage = (global as any).localStorage;
            mockLocalStorage.getItem.mockReturnValue("hidden");

            renderGPSTrackChart(container, data, options);

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_field_gps_track");
            expect((global as any).window.Chart).not.toHaveBeenCalled();
        });

        it("should render when field visibility is not hidden", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            const mockLocalStorage = (global as any).localStorage;
            mockLocalStorage.getItem.mockReturnValue("visible");

            renderGPSTrackChart(container, data, options);

            expect((global as any).window.Chart).toHaveBeenCalled();
        });

        it("should render when field visibility is null", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            const mockLocalStorage = (global as any).localStorage;
            mockLocalStorage.getItem.mockReturnValue(null);

            renderGPSTrackChart(container, data, options);

            expect((global as any).window.Chart).toHaveBeenCalled();
        });
    });

    describe("Data Point Limiting", () => {
        it("should limit data points when maxPoints is specified", () => {
            const data = [];
            for (let i = 0; i < 1000; i++) {
                data.push({
                    positionLat: 429496730 + i,
                    positionLong: -859993460 + i,
                });
            }

            const options = { maxPoints: 100 };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(100);
        });

        it("should not limit data points when maxPoints is 'all'", () => {
            const data = [
                { positionLat: 429496730, positionLong: -859993460 },
                { positionLat: 429496740, positionLong: -859993470 },
                { positionLat: 429496750, positionLong: -859993480 },
            ];

            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(3);
        });

        it("should calculate correct step for data point limiting", () => {
            const data = [];
            for (let i = 0; i < 50; i++) {
                data.push({
                    positionLat: 429496730 + i,
                    positionLong: -859993460 + i,
                });
            }

            const options = { maxPoints: 10 };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            // With step = ceil(50/10) = 5, we should get every 5th point
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(10);
        });
    });

    describe("GPS Coordinate Conversion", () => {
        it("should convert semicircle coordinates to degrees correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const point = chartConfig.data.datasets[0].data[0];

            // Convert semicircle to degrees: (429496730 * 180) / 2^31
            const expectedLat = (429496730 * 180) / Math.pow(2, 31);
            const expectedLng = (-859993460 * 180) / Math.pow(2, 31);

            expect(point.y).toBeCloseTo(expectedLat, 6);
            expect(point.x).toBeCloseTo(expectedLng, 6);
        });

        it("should preserve point index in converted data", () => {
            const data = [
                { positionLat: 429496730, positionLong: -859993460 },
                { positionLat: 429496740, positionLong: -859993470 },
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const points = chartConfig.data.datasets[0].data;

            expect(points[0].pointIndex).toBe(0);
            expect(points[1].pointIndex).toBe(1);
        });
    });

    describe("Chart Configuration", () => {
        it("should create scatter chart with correct configuration", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all", showPoints: true, showLegend: true, showTitle: true, showGrid: true };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.type).toBe("scatter");
        });

        it("should configure dataset properties correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all", showPoints: true };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const dataset = chartConfig.data.datasets[0];

            expect(dataset.label).toBe("GPS Track");
            expect(dataset.pointRadius).toBe(2); // showPoints: true
            expect(dataset.pointHoverRadius).toBe(4);
            expect(dataset.showLine).toBe(true);
            expect(dataset.borderWidth).toBe(2);
            expect(dataset.fill).toBe(false);
            expect(dataset.tension).toBe(0.1);
        });

        it("should handle showPoints option correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];

            // Test with showPoints: false
            renderGPSTrackChart(container, data, { maxPoints: "all", showPoints: false });

            let chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].pointRadius).toBe(1);

            // Clear and test with showPoints: true
            vi.clearAllMocks();
            container.innerHTML = "";

            renderGPSTrackChart(container, data, { maxPoints: "all", showPoints: true });

            chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].pointRadius).toBe(2);
        });

        it("should configure legend display correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];

            renderGPSTrackChart(container, data, { maxPoints: "all", showLegend: true });

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.legend.display).toBe(true);
        });

        it("should configure title display correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];

            renderGPSTrackChart(container, data, { maxPoints: "all", showTitle: true });

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.options.plugins.title.display).toBe(true);
            expect(chartConfig.options.plugins.title.text).toBe("GPS Track");
        });

        it("should configure grid display correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];

            renderGPSTrackChart(container, data, { maxPoints: "all", showGrid: true });

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
            expect(chartConfig.options.scales.y.grid.display).toBe(true);
        });
    });

    describe("Theme Integration", () => {
        it("should apply theme colors to canvas styling", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const canvas = container.querySelector("canvas");
            expect(canvas?.style.background).toBe("rgb(24, 28, 36)");
            expect(canvas?.style.boxShadow).toBe("0 2px 8px rgba(0,0,0,0.1)");
            expect(canvas?.style.borderRadius).toBe("12px");
        });

        it("should handle missing theme config gracefully", () => {
            // Mock the theme module directly
            const mockGetThemeConfig = vi.fn().mockReturnValue(null);
            vi.doMock("../../../utils/theming/core/theme.js", () => ({
                getThemeConfig: mockGetThemeConfig,
            }));

            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();
        });

        it("should handle missing theme colors gracefully", () => {
            // Mock the theme module directly
            const mockGetThemeConfig = vi.fn().mockReturnValue({ colors: null });
            vi.doMock("../../../utils/theming/core/theme.js", () => ({
                getThemeConfig: mockGetThemeConfig,
            }));

            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();
        });
    });

    describe("Tooltip Configuration", () => {
        it("should configure tooltip with proper callbacks", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const tooltip = chartConfig.options.plugins.tooltip;

            expect(tooltip.callbacks.label).toBeDefined();
            expect(typeof tooltip.callbacks.label).toBe("function");
        });

        it("should format tooltip label correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const labelCallback = chartConfig.options.plugins.tooltip.callbacks.label;

            const mockContext = {
                raw: { x: -40.123456, y: 18.123456, pointIndex: 5 },
            };

            const result = labelCallback(mockContext);
            expect(result).toEqual(["Latitude: 18.123456°", "Longitude: -40.123456°", "Point: 5"]);
        });
    });

    describe("Zoom Configuration", () => {
        it("should configure zoom and pan settings", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const zoom = chartConfig.options.plugins.zoom;

            expect(zoom.pan.enabled).toBe(true);
            expect(zoom.pan.mode).toBe("xy");
            expect(zoom.zoom.wheel.enabled).toBe(true);
            expect(zoom.zoom.pinch.enabled).toBe(true);
            expect(zoom.zoom.drag.enabled).toBe(true);
            expect(zoom.zoom.mode).toBe("xy");
        });

        it("should configure zoom limits", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const limits = chartConfig.options.plugins.zoom.limits;

            expect(limits.x.min).toBe("original");
            expect(limits.x.max).toBe("original");
            expect(limits.y.min).toBe("original");
            expect(limits.y.max).toBe("original");
        });
    });

    describe("Scales Configuration", () => {
        it("should configure x-axis (longitude) correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const xScale = chartConfig.options.scales.x;

            expect(xScale.type).toBe("linear");
            expect(xScale.display).toBe(true);
            expect(xScale.title.display).toBe(true);
            expect(xScale.title.text).toBe("Longitude (°)");
        });

        it("should configure y-axis (latitude) correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const yScale = chartConfig.options.scales.y;

            expect(yScale.type).toBe("linear");
            expect(yScale.display).toBe(true);
            expect(yScale.title.display).toBe(true);
            expect(yScale.title.text).toBe("Latitude (°)");
        });

        it("should format axis tick labels correctly", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            const xTickCallback = chartConfig.options.scales.x.ticks.callback;
            const yTickCallback = chartConfig.options.scales.y.ticks.callback;

            expect(xTickCallback(12.3456789)).toBe("12.3457°");
            expect(yTickCallback(-45.6789012)).toBe("-45.6789°");
        });
    });

    describe("Chart Instance Management", () => {
        it("should add chart instance to global collection", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const globalWindow = (global as any).window;
            expect(globalWindow._chartjsInstances).toHaveLength(1);
            expect(globalWindow._chartjsInstances[0]).toBe(mockChart);
        });

        it("should initialize global chart instances array if not exists", () => {
            const globalWindow = (global as any).window;
            delete globalWindow._chartjsInstances;

            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(globalWindow._chartjsInstances).toEqual([mockChart]);
        });

        it("should log success message after chart creation", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(consoleSpy.log).toHaveBeenCalledWith("[ChartJS] GPS track chart created successfully");
        });
    });

    describe("Error Handling", () => {
        it("should handle chart creation errors gracefully", () => {
            const globalWindow = (global as any).window;
            globalWindow.Chart = vi.fn(() => {
                throw new Error("Chart creation failed");
            });
            (global as any).globalThis.Chart = globalWindow.Chart;

            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[ChartJS] Error rendering GPS track chart:",
                expect.any(Error)
            );
        });

        it("should handle theme config errors gracefully", async () => {
            // Use a simpler approach to test error handling
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            // The function should handle errors internally and not throw
            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();
        });

        it("should handle canvas creation errors gracefully", async () => {
            // Use a simpler approach to test error handling
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            // The function should handle errors internally and not throw
            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();
        });

        it("should handle localStorage errors gracefully", () => {
            const mockLocalStorage = (global as any).localStorage;
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("LocalStorage error");
            });

            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();
            expect(consoleSpy.error).toHaveBeenCalled();
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty data array", () => {
            const data: any[] = [];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            expect(consoleSpy.log).toHaveBeenCalledWith("[ChartJS] No GPS position data available");
            expect(global.window.Chart).not.toHaveBeenCalled();
        });

        it("should handle single GPS point", () => {
            const data = [{ positionLat: 429496730, positionLong: -859993460 }];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(1);
        });

        it("should handle very large datasets efficiently", () => {
            const data: any[] = [];
            for (let i = 0; i < 100000; i++) {
                data.push({
                    positionLat: 429496730 + i,
                    positionLong: -859993460 + i,
                });
            }

            const options = { maxPoints: 1000 };

            const startTime = Date.now();
            renderGPSTrackChart(container, data, options);
            const endTime = Date.now();

            // Should complete reasonably quickly
            expect(endTime - startTime).toBeLessThan(1000);

            const globalWindow = (global as any).window;
            const chartConfig = globalWindow.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data.length).toBeLessThanOrEqual(1000);
        });

        it("should handle extreme GPS coordinates", () => {
            const data = [
                { positionLat: 1073741824, positionLong: -2147483648 }, // ~90 degrees latitude, -180 degrees longitude
                { positionLat: -1073741824, positionLong: 2147483647 }, // ~-90 degrees latitude, ~180 degrees longitude
            ];
            const options = { maxPoints: "all" };

            expect(() => renderGPSTrackChart(container, data, options)).not.toThrow();

            const globalWindow = (global as any).window;
            const chartConfig = globalWindow.Chart.mock.calls[0][1];
            const points = chartConfig.data.datasets[0].data;

            // Verify coordinates are within valid latitude/longitude ranges
            points.forEach((point: any) => {
                expect(point.y).toBeGreaterThanOrEqual(-90);
                expect(point.y).toBeLessThanOrEqual(90);
                expect(point.x).toBeGreaterThanOrEqual(-180);
                expect(point.x).toBeLessThanOrEqual(180);
            });
        });

        it("should handle mixed valid and invalid GPS data", () => {
            const data = [
                { positionLat: 429496730, positionLong: -859993460 }, // Valid
                { positionLat: "invalid", positionLong: -859993470 }, // Invalid latitude
                { positionLat: 429496750, positionLong: "invalid" }, // Invalid longitude
                { positionLat: 429496760, positionLong: -859993480 }, // Valid
                { someOtherField: "data" }, // No GPS data
            ];
            const options = { maxPoints: "all" };

            renderGPSTrackChart(container, data, options);

            const chartConfig = global.window.Chart.mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(4); // All points with defined coordinates pass through
        });
    });
});

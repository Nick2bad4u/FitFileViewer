import { describe, expect, it, vi } from "vitest";
import {
    clearChartRuntimeForTests,
    registerChartRuntime,
} from "../../../electron-app/utils/charts/core/chartRuntime.js";
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
} from "../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import { chartSettingsManager } from "../../../electron-app/utils/charts/core/renderChartJS.js";
import { renderGPSTrackChart } from "../../../electron-app/utils/charts/rendering/renderGPSTrackChart.js";

const themeMocks = vi.hoisted(() => ({
    getThemeConfig: vi.fn<() => ThemeConfigMock>().mockReturnValue({
        colors: {
            bgPrimary: "#ffffff",
            chartBackground: "#f8f9fa",
            chartBorder: "#dee2e6",
            chartSurface: "#23263a",
            gridLines: "#e9ecef",
            primary: "#007bff",
            primaryAlpha: "rgba(0, 123, 255, 0.2)",
            shadow: "0 2px 4px rgba(0,0,0,0.1)",
            text: "#ffffff",
            textPrimary: "#333333",
        },
    }),
}));
const chartJsMocks = vi.hoisted(() => ({
    Chart: vi.fn<ChartConstructor>(),
}));

vi.mock(import("../../../electron-app/utils/theming/core/theme.js"), () => ({
    getThemeConfig: themeMocks.getThemeConfig,
}));
vi.mock(import("chart.js/auto"), () => ({
    default: chartJsMocks.Chart,
}));

type GpsDatum = {
    readonly positionLat?: null | number | string;
    readonly positionLong?: null | number | string;
    readonly someOtherField?: string;
};

type ThemeConfigMock = {
    readonly colors: Record<string, string>;
};

type GpsPoint = {
    readonly pointIndex: number;
    readonly x: number;
    readonly y: number;
};

type DatasetConfig = {
    readonly backgroundColor: string;
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly data: GpsPoint[];
    readonly fill: boolean;
    readonly label: string;
    readonly pointHoverRadius: number;
    readonly pointRadius: number;
    readonly showLine: boolean;
    readonly tension: number;
};

type ChartConfig = {
    readonly data: {
        readonly datasets: [DatasetConfig];
    };
    readonly options: {
        readonly plugins: {
            readonly chartBackgroundColorPlugin: {
                readonly backgroundColor: string;
            };
            readonly legend: { readonly display?: boolean };
            readonly title: {
                readonly display?: boolean;
                readonly text: string;
            };
            readonly tooltip: {
                readonly callbacks: {
                    readonly label: (context: {
                        readonly raw: GpsPoint;
                    }) => string[];
                };
            };
            readonly zoom: {
                readonly limits: {
                    readonly x: {
                        readonly max: "original";
                        readonly min: "original";
                    };
                    readonly y: {
                        readonly max: "original";
                        readonly min: "original";
                    };
                };
                readonly pan: {
                    readonly enabled: boolean;
                    readonly mode: "xy";
                };
                readonly zoom: {
                    readonly drag: { readonly enabled: boolean };
                    readonly mode: "xy";
                    readonly pinch: { readonly enabled: boolean };
                    readonly wheel: { readonly enabled: boolean };
                };
            };
        };
        readonly scales: {
            readonly x: AxisConfig;
            readonly y: AxisConfig;
        };
    };
    readonly plugins: unknown[];
    readonly type: "scatter";
};

type AxisConfig = {
    readonly display: boolean;
    readonly grid: { readonly display?: boolean };
    readonly ticks: { readonly callback: (value: number) => string };
    readonly title: { readonly display: boolean; readonly text: string };
    readonly type: "linear";
};

type ChartCall = readonly [HTMLCanvasElement, ChartConfig];

type ChartInstance = {
    readonly id: "chart-instance";
};

type ChartConstructor = (
    canvas: HTMLCanvasElement,
    config: ChartConfig
) => ChartInstance;

type Harness = {
    readonly chartCalls: ChartCall[];
    readonly chartInstance: ChartInstance;
    readonly consoleError: ReturnType<typeof vi.spyOn<typeof console, "error">>;
    readonly consoleLog: ReturnType<typeof vi.spyOn<typeof console, "log">>;
    readonly container: HTMLElement;
};

const defaultData = [
    { positionLat: 429_496_730, positionLong: -859_993_460 },
    { positionLat: 429_496_740, positionLong: -859_993_470 },
    { positionLat: 429_496_750, positionLong: -859_993_480 },
] as const satisfies readonly GpsDatum[];

const defaultOptions = {
    maxPoints: "all",
    showGrid: true,
    showLegend: true,
    showPoints: true,
    showTitle: true,
} as const;

describe(renderGPSTrackChart, () => {
    it("renders a configured scatter chart for valid GPS rows", () => {
        expect.assertions(14);

        withHarness(({ chartCalls, chartInstance, consoleLog, container }) => {
            renderGPSTrackChart(container, defaultData, defaultOptions);

            const [canvas, chartConfig] = getSingleChartCall(chartCalls);
            const dataset = chartConfig.data.datasets[0];

            expect(canvas.id).toBe("chart-gps-track-0");
            expect(canvas.getAttribute("role")).toBe("img");
            expect(container.children).toHaveLength(1);
            expect(container.firstElementChild).toBe(canvas);
            expect({
                borderColor: dataset.borderColor,
                borderWidth: dataset.borderWidth,
                fill: dataset.fill,
                label: dataset.label,
                pointHoverRadius: dataset.pointHoverRadius,
                pointRadius: dataset.pointRadius,
                showLine: dataset.showLine,
                tension: dataset.tension,
            }).toStrictEqual({
                borderColor: "#007bff",
                borderWidth: 2,
                fill: false,
                label: "GPS Track",
                pointHoverRadius: 4,
                pointRadius: 2,
                showLine: true,
                tension: 0.1,
            });
            expect(dataset.data).toHaveLength(3);
            expect(chartConfig.type).toBe("scatter");
            expect(chartConfig.options.plugins.legend.display).toBe(true);
            expect(chartConfig.options.plugins.title).toStrictEqual({
                color: "#ffffff",
                display: true,
                font: {
                    size: 16,
                    weight: "bold",
                },
                text: "GPS Track",
            });
            expect(chartConfig.options.scales.x.title.text).toBe(
                "Longitude (°)"
            );
            expect(chartConfig.options.scales.y.title.text).toBe(
                "Latitude (°)"
            );
            expect(getRegisteredChartInstances()).toStrictEqual([
                chartInstance,
            ]);
            expect(consoleLog).toHaveBeenCalledWith(
                "[ChartJS] GPS track chart created successfully"
            );
            expect(consoleLog).toHaveBeenCalledWith(
                "[ChartJS] Creating GPS track chart with 3 points"
            );
        });
    });

    it("filters invalid rows, preserves source indexes, and converts semicircles", () => {
        expect.assertions(7);

        withHarness(({ chartCalls, container }) => {
            renderGPSTrackChart(
                container,
                [
                    { positionLat: 429_496_730, positionLong: -859_993_460 },
                    { positionLat: null, positionLong: -859_993_470 },
                    { positionLat: "invalid", positionLong: -859_993_480 },
                    { positionLat: 429_496_760, positionLong: -859_993_490 },
                    { someOtherField: "ignored" },
                ],
                defaultOptions
            );

            const dataset = getSingleChartCall(chartCalls)[1].data.datasets[0],
                [firstPoint, secondPoint] = dataset.data;

            expect(dataset.data).toHaveLength(2);
            const requiredFirstPoint = getRequiredPoint(firstPoint, 0);
            const requiredSecondPoint = getRequiredPoint(secondPoint, 1);
            expect(requiredFirstPoint.pointIndex).toBe(0);
            expect(requiredSecondPoint.pointIndex).toBe(3);
            expect(requiredFirstPoint.y).toBeCloseTo(
                (429_496_730 * 180) / 2 ** 31,
                6
            );
            expect(requiredFirstPoint.x).toBeCloseTo(
                (-859_993_460 * 180) / 2 ** 31,
                6
            );
            expect(requiredSecondPoint.y).toBeGreaterThan(requiredFirstPoint.y);
            expect(requiredSecondPoint.x).toBeLessThan(requiredFirstPoint.x);
        });
    });

    it("limits large tracks with the same stride as production", () => {
        expect.assertions(3);

        withHarness(({ chartCalls, container }) => {
            const data = Array.from({ length: 50 }, (_value, index) => ({
                positionLat: 429_496_730 + index,
                positionLong: -859_993_460 + index,
            }));

            renderGPSTrackChart(container, data, {
                ...defaultOptions,
                maxPoints: 10,
            });

            const points =
                getSingleChartCall(chartCalls)[1].data.datasets[0].data;

            expect(points).toHaveLength(10);
            expect(getRequiredPoint(points.at(0), 0).pointIndex).toBe(0);
            expect(getRequiredPoint(points.at(-1), -1).pointIndex).toBe(45);
        });
    });

    it("uses safe defaults when theme lookup fails", () => {
        expect.assertions(6);

        withHarness(({ chartCalls, container }) => {
            themeMocks.getThemeConfig.mockImplementationOnce(() => {
                throw new Error("theme unavailable");
            });

            renderGPSTrackChart(container, defaultData, defaultOptions);

            const [canvas, chartConfig] = getSingleChartCall(chartCalls),
                dataset = chartConfig.data.datasets[0];

            expect(canvas.style.background).toBe("rgb(24, 28, 36)");
            expect(canvas.style.boxShadow).toBe("0 2px 8px rgba(0,0,0,0.1)");
            expect(dataset.borderColor).toBe("#007bff");
            expect(dataset.backgroundColor).toBe("rgba(0, 123, 255, 0.2)");
            expect(
                chartConfig.options.plugins.chartBackgroundColorPlugin
                    .backgroundColor
            ).toBe("#181c24");
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
        });
    });

    it("applies option-controlled point, title, legend, and grid settings", () => {
        expect.assertions(2);

        withHarness(({ chartCalls, container }) => {
            renderGPSTrackChart(container, defaultData, {
                maxPoints: "all",
                showGrid: false,
                showLegend: false,
                showPoints: false,
                showTitle: false,
            });

            const chartConfig = getSingleChartCall(chartCalls)[1];

            expect(chartConfig.data.datasets[0].pointRadius).toBe(1);
            expect([
                chartConfig.options.plugins.legend.display,
                chartConfig.options.plugins.title.display,
                chartConfig.options.scales.x.grid.display,
                chartConfig.options.scales.y.grid.display,
            ]).toStrictEqual([
                false,
                false,
                false,
                false,
            ]);
        });
    });

    it("formats tooltip and axis labels", () => {
        expect.assertions(3);

        withHarness(({ chartCalls, container }) => {
            renderGPSTrackChart(container, defaultData, defaultOptions);

            const chartConfig = getSingleChartCall(chartCalls)[1],
                tooltipLabel =
                    chartConfig.options.plugins.tooltip.callbacks.label({
                        raw: { pointIndex: 5, x: -40.123_456, y: 18.123_456 },
                    });

            expect(tooltipLabel).toStrictEqual([
                "Latitude: 18.123456°",
                "Longitude: -40.123456°",
                "Point: 5",
            ]);
            expect(
                chartConfig.options.scales.x.ticks.callback(12.345_678_9)
            ).toBe("12.3457°");
            expect(
                chartConfig.options.scales.y.ticks.callback(-45.678_901_2)
            ).toBe("-45.6789°");
        });
    });

    it("configures zoom and reset plugin integration", () => {
        expect.assertions(6);

        withHarness(({ chartCalls, container }) => {
            renderGPSTrackChart(container, defaultData, defaultOptions);

            const chartConfig = getSingleChartCall(chartCalls)[1],
                zoom = chartConfig.options.plugins.zoom;

            expect(zoom.pan).toStrictEqual({
                enabled: true,
                mode: "xy",
                modifierKey: null,
            });
            expect([
                zoom.zoom.wheel.enabled,
                zoom.zoom.pinch.enabled,
                zoom.zoom.drag.enabled,
            ]).toStrictEqual([
                true,
                true,
                true,
            ]);
            expect(zoom.zoom.mode).toBe("xy");
            expect(zoom.limits.x).toStrictEqual({
                max: "original",
                min: "original",
            });
            expect(zoom.limits.y).toStrictEqual({
                max: "original",
                min: "original",
            });
            expect(chartConfig.plugins).toContain("chartBackgroundColorPlugin");
        });
    });

    it("does not render for invalid input or hidden field", () => {
        expect.assertions(7);

        withHarness(({ chartCalls, consoleLog, container }) => {
            renderGPSTrackChart(null, defaultData, defaultOptions);
            renderGPSTrackChart(container, [], defaultOptions);
            renderGPSTrackChart(
                container,
                [
                    { positionLat: 429_496_730, positionLong: null },
                    { positionLat: null, positionLong: -859_993_460 },
                ],
                defaultOptions
            );

            const visibilitySpy = vi
                .spyOn(chartSettingsManager, "getFieldVisibility")
                .mockReturnValueOnce("hidden");

            renderGPSTrackChart(container, defaultData, defaultOptions);

            expect(chartCalls).toStrictEqual([]);
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(consoleLog).toHaveBeenCalledWith(
                "[ChartJS] No GPS position data available"
            );
            expect(consoleLog).toHaveBeenCalledWith(
                "[ChartJS] No valid GPS data points found"
            );
            expect(visibilitySpy).toHaveBeenCalledWith("gps_track");
            expect(consoleLog).not.toHaveBeenCalledWith(
                "[ChartJS] GPS track chart created successfully"
            );
            expect(chartCalls).not.toHaveLength(1);
        });
    });

    it("catches Chart constructor failures and leaves no registered instance", () => {
        expect.assertions(3);

        withHarness(({ consoleError, container }) => {
            const chartCreationError = new Error("Chart creation failed");
            chartJsMocks.Chart.mockImplementationOnce(function ThrowingChart() {
                throw chartCreationError;
            });

            renderGPSTrackChart(container, defaultData, defaultOptions);
            expect(consoleError).toHaveBeenCalledWith(
                "[ChartJS] Error rendering GPS track chart:",
                chartCreationError
            );
            expect(getRegisteredChartInstances()).toStrictEqual([]);
            expect(container.querySelector("canvas")).toBeInstanceOf(
                HTMLCanvasElement
            );
        });
    });
});

function withHarness(callback: (harness: Harness) => void): void {
    const chartCalls: ChartCall[] = [],
        chartInstance: ChartInstance = { id: "chart-instance" },
        container = document.createElement("div"),
        consoleError = vi.spyOn(console, "error").mockImplementation(() => {}),
        consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    document.body.append(container);
    themeMocks.getThemeConfig.mockClear();
    vi.spyOn(chartSettingsManager, "getFieldVisibility").mockReturnValue(
        "visible"
    );

    clearChartInstanceRegistryForTests();
    chartJsMocks.Chart.mockReset();
    chartJsMocks.Chart.mockImplementation(function ChartMock(
        canvas: HTMLCanvasElement,
        config: ChartConfig
    ): ChartInstance {
        chartCalls.push([canvas, config]);
        return chartInstance;
    });
    registerChartRuntime(chartJsMocks.Chart);

    try {
        callback({
            chartCalls,
            chartInstance,
            consoleError,
            consoleLog,
            container,
        });
    } finally {
        container.remove();

        vi.restoreAllMocks();
        clearChartInstanceRegistryForTests();
        clearChartRuntimeForTests();
        themeMocks.getThemeConfig.mockReset();
        themeMocks.getThemeConfig.mockReturnValue({
            colors: {
                bgPrimary: "#ffffff",
                chartBackground: "#f8f9fa",
                chartBorder: "#dee2e6",
                chartSurface: "#23263a",
                gridLines: "#e9ecef",
                primary: "#007bff",
                primaryAlpha: "rgba(0, 123, 255, 0.2)",
                shadow: "0 2px 4px rgba(0,0,0,0.1)",
                text: "#ffffff",
                textPrimary: "#333333",
            },
        });
    }
}

function getSingleChartCall(chartCalls: readonly ChartCall[]): ChartCall {
    if (chartCalls.length !== 1) {
        throw new Error(
            `Expected one chart call, received ${chartCalls.length}.`
        );
    }

    return chartCalls[0] as ChartCall;
}

function getRequiredPoint(
    point: GpsPoint | undefined,
    index: number
): GpsPoint {
    if (!point) {
        throw new Error(`Expected GPS point ${index}`);
    }

    return point;
}

function getRequiredElement(element: Element | null): Element {
    if (!element) {
        throw new Error("Expected rendered GPS chart element");
    }

    return element;
}

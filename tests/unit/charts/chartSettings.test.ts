import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEnhancedChart } from "../../../electron-app/utils/charts/components/createEnhancedChart.js";
import {
    clearChartRuntimeForTests,
    registerChartRuntime,
} from "../../../electron-app/utils/charts/core/chartRuntime.js";
import { detectCurrentTheme } from "../../../electron-app/utils/charts/theming/chartThemeUtils.js";
import { showNotification } from "../../../electron-app/utils/ui/notifications/showNotification.js";

type ChartPoint = {
    readonly x: number;
    readonly y: number;
};

type ChartType = "area" | "bar" | "line" | "scatter";

type ChartOptions = {
    readonly animationStyle?: "fast" | "none" | "normal";
    readonly chartData: readonly ChartPoint[];
    readonly chartType: ChartType;
    readonly customColors: Readonly<Record<string, string>>;
    readonly decimation?: {
        readonly algorithm?: "lttb";
        readonly enabled: boolean;
    };
    readonly distanceUnits?: "feet" | "kilometers" | "meters" | "miles";
    readonly field: string;
    readonly fieldLabels: Readonly<Record<string, string>>;
    readonly interpolation?: "linear" | "monotone" | "step";
    readonly showFill?: boolean;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showPoints?: boolean;
    readonly showTitle?: boolean;
    readonly smoothing?: number;
    readonly temperatureUnits?: "celsius" | "fahrenheit";
    readonly theme?: "auto" | "dark" | "light";
    readonly timeUnits?: "hours" | "minutes" | "seconds";
};

type ChartDatasetConfig = {
    readonly backgroundColor: string;
    readonly borderWidth: number;
    readonly cubicInterpolationMode: "default" | "monotone";
    readonly fill: boolean;
    readonly pointRadius: number;
    readonly stepped: boolean;
    readonly tension: number;
};

type ChartConfig = {
    readonly data: {
        readonly datasets: readonly ChartDatasetConfig[];
    };
    readonly options: {
        readonly animation: {
            readonly duration: number;
        };
        readonly plugins: {
            readonly chartBackgroundColorPlugin: {
                readonly backgroundColor: string;
            };
            readonly decimation: unknown;
            readonly legend: {
                readonly display: boolean;
            };
            readonly title: {
                readonly display: boolean;
                readonly text: string;
            };
        };
        readonly scales: {
            readonly x: {
                readonly grid: {
                    readonly color: string;
                    readonly display: boolean;
                };
                readonly title: {
                    readonly text: string;
                };
            };
            readonly y: {
                readonly grid: {
                    readonly display: boolean;
                };
            };
        };
    };
    readonly type: string;
};

type ChartInstance = {
    readonly data: Record<string, unknown>;
    readonly destroy: Mock<() => void>;
    readonly options: Record<string, unknown>;
};

type ChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: ChartConfig
) => ChartInstance;

type ChartConstructorFunction = (
    canvas: HTMLCanvasElement,
    config: ChartConfig
) => ChartInstance;

type ChartConstructorMock = Mock<ChartConstructorFunction>;

type ChartTestContext = {
    readonly chartMock: ChartConstructorMock;
    readonly render: (options?: Partial<ChartOptions>) => {
        readonly config: ChartConfig;
        readonly result: unknown;
    };
};

type ConvertTimeUnits = (value: number, unit: string) => number;
type FormatTime = (value: number) => string;
type FormatTooltipWithUnits = (value: number, field: string) => string;
type GetFieldColor = (field: string) => string;
type GetUnitSymbol = (field: string) => string;
type HexToRgba = (hex: string, alpha: number) => string;
type ShowNotification = typeof showNotification;
type UpdateChartAnimations = (chart: unknown, field: string) => void;

const chartJsAutoMock = vi.hoisted(() => ({
    Chart: undefined as
        | (new (
              canvas: HTMLCanvasElement,
              config: ChartConfig
          ) => ChartInstance)
        | undefined,
    ChartProxy: vi.fn(function ChartProxy(
        canvas: HTMLCanvasElement,
        config: ChartConfig
    ) {
        const ChartConstructor = chartJsAutoMock.Chart;
        if (typeof ChartConstructor !== "function") {
            throw new Error("Chart.js constructor is unavailable");
        }

        return new ChartConstructor(canvas, config);
    }),
}));

vi.mock(import("chart.js/auto"), () => ({
    default: chartJsAutoMock.ChartProxy,
}));

vi.mock(
    import("../../../electron-app/utils/data/lookups/getUnitSymbol.js"),
    () => ({
        getUnitSymbol: vi.fn<GetUnitSymbol>((field) => {
            switch (field) {
                case "altitude": {
                    return "m";
                }
                case "distance": {
                    return "km";
                }
                case "speed": {
                    return "km/h";
                }
                case "temperature": {
                    return "°C";
                }
                default: {
                    return "";
                }
            }
        }),
    })
);

vi.mock(
    import("../../../electron-app/utils/formatting/converters/convertTimeUnits.js"),
    () => ({
        convertTimeUnits: vi.fn<ConvertTimeUnits>((value, unit) => {
            if (unit === "hours") {
                return value / 3600;
            }

            if (unit === "minutes") {
                return value / 60;
            }

            return value;
        }),
    })
);

vi.mock(
    import("../../../electron-app/utils/formatting/display/formatTooltipWithUnits.js"),
    () => ({
        formatTooltipWithUnits: vi.fn<FormatTooltipWithUnits>(
            (value, _field) => `${value} units`
        ),
    })
);

vi.mock(
    import("../../../electron-app/utils/formatting/formatters/formatTime.js"),
    () => ({
        formatTime: vi.fn<FormatTime>((value) => `${value}s`),
    })
);

vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<ShowNotification>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        hexToRgba: vi.fn<HexToRgba>((_hex, alpha) => `rgba(0,0,0,${alpha})`),
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/core/updateChartAnimations.js"),
    () => ({
        updateChartAnimations: vi.fn<UpdateChartAnimations>(),
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
    () => ({
        chartBackgroundColorPlugin: { id: "chartBackgroundColorPlugin" },
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
    () => ({
        chartZoomResetPlugin: { id: "chartZoomResetPlugin" },
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: vi.fn<() => "light">(() => "light"),
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/theming/getFieldColor.js"),
    () => ({
        getFieldColor: vi.fn<GetFieldColor>(() => "#ff0000"),
    })
);

afterEach(() => {
    clearChartRuntimeForTests();
});

const defaultOptions = {
    chartData: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
    ],
    chartType: "line",
    customColors: {},
    field: "speed",
    fieldLabels: { speed: "Speed" },
} satisfies ChartOptions;

function getLatestChartConfig(chartMock: ChartConstructorMock): ChartConfig {
    const latestCall = chartMock.mock.calls.at(-1);
    if (!latestCall) {
        throw new Error("Expected Chart constructor to be called");
    }

    return latestCall[1];
}

function getFirstDataset(config: ChartConfig): ChartDatasetConfig {
    const dataset = config.data.datasets[0];
    if (!dataset) {
        throw new Error("Expected chart config to include a dataset");
    }

    return dataset;
}

function createChartTestContext(): ChartTestContext {
    vi.clearAllMocks();

    const canvas = document.createElement("canvas");
    const chartInstance: ChartInstance = {
        data: {},
        destroy: vi.fn<() => void>(),
        options: {},
    };
    const chartMock = vi.fn<ChartConstructorFunction>(
        (_canvas, _config) => chartInstance
    );
    chartJsAutoMock.Chart = chartMock as unknown as ChartConstructor;
    registerChartRuntime(chartJsAutoMock.ChartProxy);

    const render = (options: Partial<ChartOptions> = {}) => {
        const result = createEnhancedChart(canvas, {
            ...defaultOptions,
            ...options,
        });

        return {
            config: getLatestChartConfig(chartMock),
            result,
        };
    };

    return {
        chartMock,
        render,
    };
}

describe("createEnhancedChart Settings", () => {
    it("passes decimation configuration through to Chart.js", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();
        const { config } = render({
            decimation: { algorithm: "lttb", enabled: true },
        });

        expect(config.options.plugins.decimation).toStrictEqual({
            algorithm: "lttb",
            enabled: true,
        });
    });

    it("maps configured chart types to Chart.js chart types", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            (
                [
                    "line",
                    "bar",
                    "scatter",
                    "area",
                ] as const
            ).map((chartType) => render({ chartType }).config.type)
        ).toStrictEqual([
            "line",
            "bar",
            "scatter",
            "line",
        ]);
    });

    it("applies interpolation settings to the dataset", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            (
                [
                    "linear",
                    "monotone",
                    "step",
                ] as const
            ).map((interpolation) => {
                const dataset = getFirstDataset(
                    render({ interpolation }).config
                );

                return {
                    cubicInterpolationMode: dataset.cubicInterpolationMode,
                    stepped: dataset.stepped,
                    tension: dataset.tension,
                };
            })
        ).toStrictEqual([
            {
                cubicInterpolationMode: "default",
                stepped: false,
                tension: 0,
            },
            {
                cubicInterpolationMode: "monotone",
                stepped: false,
                tension: 0,
            },
            {
                cubicInterpolationMode: "default",
                stepped: true,
                tension: 0,
            },
        ]);
    });

    it("maps animation style to duration", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            (
                [
                    "normal",
                    "fast",
                    "none",
                ] as const
            ).map(
                (animationStyle) =>
                    render({ animationStyle }).config.options.animation.duration
            )
        ).toStrictEqual([
            1000,
            500,
            0,
        ]);
    });

    it("resolves auto, dark, and light export themes", () => {
        expect.assertions(2);

        const { render } = createChartTestContext();
        const detectCurrentThemeMock = vi.mocked(detectCurrentTheme);

        expect(
            (
                [
                    "auto",
                    "dark",
                    "light",
                ] as const
            ).map((theme) => {
                const config = render({ theme }).config;

                return {
                    background:
                        config.options.plugins.chartBackgroundColorPlugin
                            .backgroundColor,
                    xGridColor: config.options.scales.x.grid.color,
                };
            })
        ).toStrictEqual([
            { background: "#ffffff", xGridColor: "rgba(0,0,0,0.1)" },
            { background: "#181c24", xGridColor: "rgba(255,255,255,0.1)" },
            { background: "#ffffff", xGridColor: "rgba(0,0,0,0.1)" },
        ]);
        expect(detectCurrentThemeMock).toHaveBeenCalledOnce();
    });

    it("toggles grid display on both axes", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            [true, false].flatMap((showGrid) => {
                const config = render({ showGrid }).config;

                return [
                    config.options.scales.x.grid.display,
                    config.options.scales.y.grid.display,
                ];
            })
        ).toStrictEqual([
            true,
            true,
            false,
            false,
        ]);
    });

    it("toggles legend display", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            [true, false].map(
                (showLegend) =>
                    render({ showLegend }).config.options.plugins.legend.display
            )
        ).toStrictEqual([true, false]);
    });

    it("toggles title display", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            [true, false].map(
                (showTitle) =>
                    render({ showTitle }).config.options.plugins.title.display
            )
        ).toStrictEqual([true, false]);
    });

    it("toggles visible data points", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            [true, false].map(
                (showPoints) =>
                    getFirstDataset(render({ showPoints }).config).pointRadius
            )
        ).toStrictEqual([3, 0]);
    });

    it("toggles filled line area", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            [true, false].map(
                (showFill) => getFirstDataset(render({ showFill }).config).fill
            )
        ).toStrictEqual([true, false]);
    });

    it("converts smoothing slider values into line tension", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();
        const dataset = getFirstDataset(render({ smoothing: 50 }).config);

        expect(dataset.tension).toBe(0.5);
    });

    it("labels the x axis with configured time units", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            (
                [
                    "seconds",
                    "minutes",
                    "hours",
                ] as const
            ).map(
                (timeUnits) =>
                    render({ timeUnits }).config.options.scales.x.title.text
            )
        ).toStrictEqual([
            "Time (s)",
            "Time (min)",
            "Time (h)",
        ]);
    });

    it("labels distance-like fields with configured distance units", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            (
                [
                    "kilometers",
                    "miles",
                    "meters",
                    "feet",
                ] as const
            ).map(
                (distanceUnits) =>
                    render({
                        distanceUnits,
                        field: "distance",
                    }).config.options.plugins.title.text
            )
        ).toStrictEqual([
            "distance (km)",
            "distance (mi)",
            "distance (m)",
            "distance (ft)",
        ]);
    });

    it("labels temperature fields with configured temperature units", () => {
        expect.assertions(1);

        const { render } = createChartTestContext();

        expect(
            (["celsius", "fahrenheit"] as const).map(
                (temperatureUnits) =>
                    render({
                        field: "temperature",
                        temperatureUnits,
                    }).config.options.plugins.title.text
            )
        ).toStrictEqual(["temperature (°C)", "temperature (°F)"]);
    });

    it("returns null and reports an error when Chart.js is unavailable", () => {
        expect.assertions(3);

        vi.clearAllMocks();
        chartJsAutoMock.Chart = undefined;
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockReturnValue(undefined);

        const result = createEnhancedChart(document.createElement("canvas"), {
            ...defaultOptions,
        });

        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[ChartJS] Error creating chart for speed:",
            expect.any(Error)
        );
        expect(vi.mocked(showNotification)).toHaveBeenCalledWith(
            "Error creating chart for speed",
            "error",
            5000
        );

        consoleErrorSpy.mockRestore();
    });
});

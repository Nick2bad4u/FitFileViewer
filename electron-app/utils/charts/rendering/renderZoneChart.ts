import {
    getChartZoneColors,
    getZoneTypeFromField,
} from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";
import type { ZoneData } from "../../types/sharedChartTypes.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { registerChartInstance } from "../core/chartInstanceRegistry.js";
import {
    isChartDebugLoggingEnabled,
    isChartVerboseDebugLoggingEnabled,
} from "../core/chartDebugState.js";
import { getRenderChartDomHelpersRuntime } from "../core/renderChartDomHelpersRuntime.js";
import { resolveChartRuntime } from "../core/chartRuntime.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import {
    detectCurrentTheme,
    type ChartTheme,
} from "../theming/chartThemeUtils.js";

interface RenderZoneChartOptions {
    readonly chartType?: string;
    readonly showLegend?: boolean;
}

interface ZoneChartInstance {
    readonly getDatasetMeta?: (datasetIndex: number) => ZoneChartDatasetMeta;
    readonly update?: () => void;
}

interface ZoneChartDatasetMeta {
    readonly data: ZoneChartDatasetMetaPoint[];
}

interface ZoneChartDatasetMetaPoint {
    hidden?: boolean;
}

interface ZoneChartBaseDataset {
    backgroundColor: string[];
    borderColor: string;
    borderWidth: number;
    data: number[];
}

interface ZoneChartDataset extends ZoneChartBaseDataset {
    [key: string]: unknown;
}

interface ZoneChartData {
    datasets: ZoneChartDataset[];
    labels: string[];
}

interface ZoneChartConfig {
    data: ZoneChartData;
    options: Record<string, unknown>;
    plugins: readonly unknown[];
    type: "bar" | "doughnut";
}

type ZoneChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: ZoneChartConfig
) => ZoneChartInstance;

interface ZoneChartBarTooltipContext {
    readonly parsed: {
        readonly y: number;
    };
}

interface ZoneChartLabelColorContext {
    readonly dataIndex: number;
    readonly dataset: {
        readonly backgroundColor: string[];
        readonly borderColor: string;
    };
}

interface ZoneChartDoughnutTooltipContext {
    readonly dataIndex: number;
    readonly dataset: {
        readonly backgroundColor: string[];
        readonly borderColor: string;
        readonly data: number[];
    };
    readonly parsed: number;
}

interface ZoneChartLegendDataset {
    readonly backgroundColor: string[];
    readonly data: number[];
}

interface ZoneChartLegendChart {
    readonly data: {
        readonly datasets: ZoneChartLegendDataset[];
        readonly labels: string[];
    };
    readonly getDatasetMeta: (datasetIndex: number) => ZoneChartDatasetMeta;
    readonly update: () => void;
}

interface ZoneChartLegend {
    readonly chart: ZoneChartLegendChart;
}

interface ZoneChartLegendItem {
    readonly index?: number;
}

const DEFAULT_ZONE_COLOR = "#808080";

function isZoneChartConstructor(value: unknown): value is ZoneChartConstructor {
    return typeof value === "function";
}

/**
 * Render a zone chart (doughnut or bar).
 */
export function renderZoneChart(
    container: HTMLElement,
    title: string,
    zoneData: ZoneData[],
    chartId: string,
    options: RenderZoneChartOptions = {}
): void {
    const isDebugLoggingEnabled = isChartDebugLoggingEnabled(),
        isVerboseDebugLoggingEnabled = isChartVerboseDebugLoggingEnabled(),
        runtime = getRenderChartDomHelpersRuntime();

    if (!runtime.isHTMLElement(container)) {
        console.warn("renderZoneChart: invalid container", container);
        return;
    }

    if (!Array.isArray(zoneData)) {
        console.warn("renderZoneChart: zoneData not array", zoneData);
        return;
    }

    if (isVerboseDebugLoggingEnabled) {
        console.log(
            `[ChartJS] renderZoneChart called for ${title} with data:`,
            zoneData
        );
    }

    const canvas = createChartCanvas(chartId, 0),
        chartType = options.chartType ?? "doughnut",
        currentTheme = detectCurrentTheme(),
        themeConfig = getThemeConfig();

    canvas.style.borderRadius = "12px";
    const shadowLight = getStringThemeColor(themeConfig.colors, "shadowLight");
    if (shadowLight) {
        canvas.style.boxShadow = `0 2px 16px 0 ${shadowLight}`;
    }

    container.append(canvas);

    const colors = resolveZoneColors(zoneData, chartId, themeConfig.colors),
        config = createChartConfig(
            chartType,
            zoneData,
            colors,
            title,
            options,
            currentTheme
        );

    if (isVerboseDebugLoggingEnabled) {
        console.log(
            `[ChartJS] Creating ${chartType} zone chart with config:`,
            config
        );
    }

    const ChartCtor = resolveChartRuntime(isZoneChartConstructor);
    if (!ChartCtor) {
        console.error(`[ChartJS] Failed to create zone chart for ${title}`);
        return;
    }

    const chart = new ChartCtor(canvas, config);

    if (chart) {
        if (isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Zone chart created successfully for ${title}`
            );
        }
        registerChartInstance(chart);
        return;
    }

    console.error(`[ChartJS] Failed to create zone chart for ${title}`);
}

function createBarChartConfig(
    zoneData: readonly ZoneData[],
    colors: readonly string[],
    title: string,
    _options: Pick<RenderZoneChartOptions, "showLegend">,
    currentTheme: ChartTheme,
    baseDataset: ZoneChartBaseDataset
): ZoneChartConfig {
    return {
        data: {
            datasets: [
                {
                    ...baseDataset,
                    borderRadius: 4,
                    borderSkipped: false,
                    hoverBackgroundColor: colors
                        .slice(0, zoneData.length)
                        .map((color) => lightenHexColor(color, 20)),
                    hoverBorderColor: colors.slice(0, zoneData.length),
                    hoverBorderWidth: 2,
                    label: "Time in Zone",
                },
            ],
            labels: zoneData.map(
                (zone) => zone.label || `Zone ${zone.zone || 1}`
            ),
        },
        options: {
            animation: {
                duration: 1500,
                easing: "easeOutQuart",
            },
            interaction: {
                intersect: false,
                mode: "index",
            },
            maintainAspectRatio: true,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor:
                        currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
                legend: {
                    display: false,
                },
                title: {
                    color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    display: true,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    padding: 20,
                    text: title,
                },
                tooltip: {
                    backgroundColor:
                        currentTheme === "dark"
                            ? "rgba(30, 30, 30, 0.95)"
                            : "rgba(255, 255, 255, 0.95)",
                    bodyColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    borderColor:
                        currentTheme === "dark" ? "#555555" : "#cccccc",
                    borderWidth: 1,
                    callbacks: {
                        label(context: ZoneChartBarTooltipContext): string {
                            const value = context.parsed.y,
                                timeFormatted = formatTime(value, true);
                            return `Time: ${timeFormatted}`;
                        },
                        labelColor(context: ZoneChartLabelColorContext) {
                            return createLabelColor(context);
                        },
                    },
                    cornerRadius: 8,
                    displayColors: true,
                    enabled: true,
                    titleColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                },
            },
            responsive: true,
            scales: {
                x: {
                    grid: {
                        color:
                            currentTheme === "dark"
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.1)",
                        lineWidth: 1,
                    },
                    ticks: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 12,
                            weight: "600",
                        },
                    },
                    title: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        display: true,
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                        text: "Zone",
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color:
                            currentTheme === "dark"
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.1)",
                        lineWidth: 1,
                    },
                    ticks: {
                        callback(value: number): string {
                            return formatTime(value, true);
                        },
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        font: {
                            size: 12,
                        },
                    },
                    title: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        display: true,
                        font: {
                            size: 14,
                            weight: "bold",
                        },
                        text: "Time",
                    },
                },
            },
        },
        plugins: [chartBackgroundColorPlugin],
        type: "bar",
    };
}

function createChartConfig(
    chartType: string,
    zoneData: readonly ZoneData[],
    colors: readonly string[],
    title: string,
    options: Pick<RenderZoneChartOptions, "showLegend">,
    currentTheme: ChartTheme
): ZoneChartConfig {
    const baseDataset: ZoneChartBaseDataset = {
        backgroundColor: getColorSlice(colors, zoneData.length),
        borderColor: currentTheme === "dark" ? "#333" : "#fff",
        borderWidth: chartType === "doughnut" ? 3 : 1,
        data: zoneData.map((zone) => getZoneTime(zone)),
    };

    if (chartType === "bar") {
        return createBarChartConfig(
            zoneData,
            colors,
            title,
            options,
            currentTheme,
            baseDataset
        );
    }

    return createDoughnutChartConfig(
        zoneData,
        colors,
        title,
        options,
        currentTheme,
        baseDataset
    );
}

function createDoughnutChartConfig(
    zoneData: readonly ZoneData[],
    colors: readonly string[],
    title: string,
    options: Pick<RenderZoneChartOptions, "showLegend">,
    currentTheme: ChartTheme,
    baseDataset: ZoneChartBaseDataset
): ZoneChartConfig {
    return {
        data: {
            datasets: [
                {
                    ...baseDataset,
                    borderAlign: "center",
                    borderJoinStyle: "round",
                    borderRadius: 4,
                    circumference: 360,
                    hoverBackgroundColor: colors
                        .slice(0, zoneData.length)
                        .map((color) => lightenHexColor(color, 30)),
                    hoverBorderColor: "#ffffff",
                    hoverBorderWidth: 4,
                    hoverOffset: 8,
                    offset: 2,
                    rotation: -90,
                    spacing: 2,
                    weight: 1,
                },
            ],
            labels: zoneData.map(
                (zone) => zone.label || `Zone ${zone.zone || 1}`
            ),
        },
        options: {
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: "easeOutQuart",
            },
            elements: {
                arc: {
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                },
            },
            interaction: {
                intersect: false,
                mode: "point",
            },
            maintainAspectRatio: true,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor:
                        currentTheme === "dark" ? "#181c24" : "#ffffff",
                },
                legend: {
                    display: options.showLegend !== false,
                    labels: {
                        color: currentTheme === "dark" ? "#ffffff" : "#333333",
                        display: true,
                        font: {
                            size: 14,
                            weight: "600",
                        },
                        generateLabels(
                            chartInstance: ZoneChartLegendChart
                        ): object[] {
                            return generateLegendLabels(
                                chartInstance,
                                currentTheme
                            );
                        },
                        padding: 20,
                        pointStyle: "circle",
                        usePointStyle: true,
                    },
                    onClick(
                        _event: unknown,
                        legendItem: ZoneChartLegendItem,
                        legend: ZoneChartLegend
                    ): void {
                        const index = legendItem.index;
                        if (typeof index !== "number") {
                            return;
                        }

                        const { chart } = legend,
                            meta = chart.getDatasetMeta(0),
                            metaPoint = meta.data[index];

                        if (!metaPoint) {
                            return;
                        }

                        metaPoint.hidden = metaPoint.hidden !== true;
                        chart.update();
                    },
                    position: "right",
                },
                title: {
                    color: currentTheme === "dark" ? "#ffffff" : "#333333",
                    display: true,
                    font: {
                        size: 16,
                        weight: "bold",
                    },
                    padding: 20,
                    text: title,
                },
                tooltip: {
                    backgroundColor:
                        currentTheme === "dark"
                            ? "rgba(30, 30, 30, 0.95)"
                            : "rgba(255, 255, 255, 0.95)",
                    bodyColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                    borderColor:
                        currentTheme === "dark" ? "#555555" : "#cccccc",
                    borderWidth: 1,
                    callbacks: {
                        label(
                            context: ZoneChartDoughnutTooltipContext
                        ): string[] {
                            const total = sumNumbers(context.dataset.data),
                                value = context.parsed,
                                percentage = getPercentageText(value, total),
                                timeFormatted = formatTime(value, true);
                            return [
                                `Time: ${timeFormatted}`,
                                `Percentage: ${percentage}%`,
                            ];
                        },
                        labelColor(context: ZoneChartLabelColorContext) {
                            return createLabelColor(context);
                        },
                    },
                    cornerRadius: 8,
                    displayColors: true,
                    enabled: true,
                    titleColor: currentTheme === "dark" ? "#ffffff" : "#333333",
                },
            },
            radius: "90%",
            responsive: true,
        },
        plugins: [chartBackgroundColorPlugin],
        type: "doughnut",
    };
}

function createLabelColor(context: ZoneChartLabelColorContext): {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    borderWidth: number;
} {
    return {
        backgroundColor: getColorAt(
            context.dataset.backgroundColor,
            context.dataIndex
        ),
        borderColor: context.dataset.borderColor,
        borderRadius: 2,
        borderWidth: 2,
    };
}

function generateLegendLabels(
    chartInstance: ZoneChartLegendChart,
    currentTheme: ChartTheme
): object[] {
    const { data } = chartInstance,
        dataset = data.datasets[0];

    if (!dataset || data.labels.length === 0) {
        return [];
    }

    const total = sumNumbers(dataset.data),
        meta = chartInstance.getDatasetMeta(0);

    return data.labels.map((label, index) => {
        const hidden = meta.data[index]?.hidden === true,
            value = dataset.data[index] ?? 0,
            color = getColorAt(dataset.backgroundColor, index),
            percentage = getPercentageText(value, total);

        return {
            fillStyle: hidden ? "rgba(128, 128, 128, 0.5)" : color,
            fontColor: hidden
                ? "rgba(128, 128, 128, 0.7)"
                : currentTheme === "dark"
                  ? "#ffffff"
                  : "#333333",
            hidden,
            index,
            lineWidth: 1,
            pointStyle: "circle",
            strokeStyle: hidden ? "rgba(128, 128, 128, 0.5)" : color,
            text: `${label}: ${formatTime(value, true)} (${percentage}%)`,
        };
    });
}

function getColorSlice(colors: readonly string[], count: number): string[] {
    return Array.from({ length: count }, (_unused, index) =>
        getColorAt(colors, index)
    );
}

function getColorAt(colors: readonly string[], index: number): string {
    return colors[index] ?? DEFAULT_ZONE_COLOR;
}

function getPercentageText(value: number, total: number): string {
    if (total <= 0) {
        return "0.0";
    }

    return ((value / total) * 100).toFixed(1);
}

function sumNumbers(values: readonly number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

function getStringThemeColor(
    colors: ThemeColorMap,
    key: string
): string | undefined {
    const value = colors[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getThemeZoneColors(colors: ThemeColorMap): string[] {
    const zoneColors = colors["zoneColors"];
    return Array.isArray(zoneColors) ? [...zoneColors] : [];
}

function getZoneTime(zone: ZoneData): number {
    return typeof zone.time === "number" && Number.isFinite(zone.time)
        ? zone.time
        : 0;
}

function lightenHexColor(color: string, amount: number): string {
    const hexMatch = /^#([\da-f]{6})/iu.exec(color),
        hexValue = hexMatch?.[1];

    if (!hexValue) {
        return color;
    }

    const r = Number.parseInt(hexValue.slice(0, 2), 16),
        g = Number.parseInt(hexValue.slice(2, 4), 16),
        b = Number.parseInt(hexValue.slice(4, 6), 16);

    return `rgba(${Math.min(255, r + amount)}, ${Math.min(255, g + amount)}, ${Math.min(255, b + amount)}, 0.9)`;
}

function resolveZoneColors(
    zoneData: readonly ZoneData[],
    chartId: string,
    themeColors: ThemeColorMap
): string[] {
    const themedColors = getThemeZoneColors(themeColors);

    if (zoneData[0]?.color) {
        return zoneData.map(
            (zone, index) =>
                zone.color ?? themedColors[index] ?? DEFAULT_ZONE_COLOR
        );
    }

    const zoneType = getZoneTypeFromField(chartId);
    if (zoneType) {
        return getChartZoneColors(zoneType, zoneData.length);
    }

    return getColorSlice(themedColors, zoneData.length);
}

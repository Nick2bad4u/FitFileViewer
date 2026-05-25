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
import {
    createManagedChart,
    type ManagedChartConfig,
} from "../core/createManagedChart.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { isThemeColorMap } from "../theming/getThemeColors.js";
import { chartBackgroundColorPlugin } from "../plugins/chartBackgroundColorPlugin.js";
import {
    detectCurrentTheme,
    type ChartTheme,
} from "../theming/chartThemeUtils.js";

interface RenderZoneChartOptions {
    readonly chartType?: string;
    readonly showLegend?: boolean;
}

interface ZoneChartRuntimeGlobal {
    readonly __FFV_debugCharts?: unknown;
    readonly __FFV_debugChartsVerbose?: unknown;
}

interface ZoneChartBaseDataset {
    readonly backgroundColor: readonly string[];
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly data: readonly number[];
}

interface ZoneChartBarTooltipContext {
    readonly parsed?: {
        readonly y?: unknown;
    };
}

interface ZoneChartDoughnutTooltipContext {
    readonly dataIndex?: number;
    readonly dataset?: {
        readonly backgroundColor?: readonly string[];
        readonly borderColor?: string;
        readonly data?: readonly unknown[];
    };
    readonly parsed?: unknown;
}

interface ZoneChartLabelColorContext {
    readonly dataIndex?: number;
    readonly dataset?: {
        readonly backgroundColor?: readonly string[];
        readonly borderColor?: string;
    };
}

interface ZoneChartLegendChart {
    readonly data?: {
        readonly datasets?: readonly ZoneChartLegendDataset[];
        readonly labels?: readonly string[];
    };
    readonly getDatasetMeta?: (datasetIndex: number) => ZoneChartDatasetMeta;
}

interface ZoneChartDatasetMeta {
    readonly data?: readonly ZoneChartDatasetMetaPoint[];
}

interface ZoneChartDatasetMetaPoint {
    readonly hidden?: boolean;
}

interface ZoneChartLegendDataset {
    readonly backgroundColor?: readonly string[];
    readonly borderColor?: string;
    readonly data?: readonly unknown[];
}

const DEFAULT_ZONE_COLOR = "#888888";

/**
 * Render an individual zone chart.
 *
 * @param container - Target chart container.
 * @param title - Chart title.
 * @param zoneData - Zone records to visualize.
 * @param chartId - Canvas/chart identifier.
 * @param options - Optional chart display settings.
 */
export function renderZoneChart(
    container: HTMLElement,
    title: string,
    zoneData: readonly ZoneData[],
    chartId: string,
    options: RenderZoneChartOptions = {}
): void {
    try {
        const runtimeGlobal = globalThis as ZoneChartRuntimeGlobal;
        if (!(container instanceof HTMLElement)) {
            return;
        }
        if (!Array.isArray(zoneData) || zoneData.length === 0) {
            return;
        }

        const isDevEnvironment =
                typeof process !== "undefined" &&
                process.env?.["NODE_ENV"] === "development",
            isDebugLoggingEnabled =
                isDevEnvironment && Boolean(runtimeGlobal.__FFV_debugCharts),
            isVerboseDebugLoggingEnabled =
                isDebugLoggingEnabled &&
                Boolean(runtimeGlobal.__FFV_debugChartsVerbose);

        if (isVerboseDebugLoggingEnabled) {
            console.log(
                `[ChartJS] renderZoneChart called for ${title} with data:`,
                zoneData
            );
        }

        const canvas = createChartCanvas(chartId, 0),
            chartType = options.chartType || "doughnut",
            currentTheme = detectCurrentTheme(),
            themeColors = getThemeColors(getThemeConfig());

        applyCanvasTheme(canvas, themeColors);
        container.append(canvas);

        const colors = resolveZoneColors(zoneData, chartId, themeColors),
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

        const chart = createManagedChart(canvas, config);
        if (chart && isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Zone chart created successfully for ${title}`
            );
        }
    } catch (error) {
        console.error("[ChartJS] Failed to create zone chart", error);
    }
}

function applyCanvasTheme(
    canvas: HTMLCanvasElement,
    themeColors: ThemeColorMap | undefined
): void {
    if (!themeColors) {
        return;
    }

    canvas.style.borderRadius = "12px";
    const shadowLight = getStringThemeColor(themeColors, "shadowLight");
    canvas.style.boxShadow = shadowLight ? `0 2px 16px 0 ${shadowLight}` : "";
}

function createBarChartConfig(
    zoneData: readonly ZoneData[],
    colors: readonly string[],
    title: string,
    _options: Pick<RenderZoneChartOptions, "showLegend">,
    currentTheme: ChartTheme,
    baseDataset: ZoneChartBaseDataset
): ManagedChartConfig {
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
                (zone, index) => zone.label || `Zone ${zone.zone || index + 1}`
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
                            return `Time: ${formatTime(toFiniteNumber(context.parsed?.y), true)}`;
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
                        callback(value: number | string): string {
                            return formatTime(toFiniteNumber(value), true);
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
): ManagedChartConfig {
    const baseDataset: ZoneChartBaseDataset = {
        backgroundColor: colors.slice(0, zoneData.length),
        borderColor: currentTheme === "dark" ? "#333" : "#fff",
        borderWidth: chartType === "doughnut" ? 3 : 1,
        data: zoneData.map((zone) => toFiniteNumber(zone.time)),
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
): ManagedChartConfig {
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
                (zone, index) => zone.label || `Zone ${zone.zone || index + 1}`
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
                        generateLabels(chart: ZoneChartLegendChart): object[] {
                            return generateLegendLabels(chart);
                        },
                        padding: 20,
                        pointStyle: "circle",
                        usePointStyle: true,
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
                            const datasetData = Array.isArray(
                                    context.dataset?.data
                                )
                                    ? context.dataset.data
                                    : [],
                                total = sumNumbers(datasetData),
                                value = toFiniteNumber(context.parsed),
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
    backgroundColor: string | undefined;
    borderColor: string | undefined;
    borderRadius: number;
    borderWidth: number;
} {
    return {
        backgroundColor:
            context.dataset?.backgroundColor?.[context.dataIndex ?? 0] ||
            context.dataset?.borderColor,
        borderColor: context.dataset?.borderColor,
        borderRadius: 2,
        borderWidth: 2,
    };
}

function generateLegendLabels(chart: ZoneChartLegendChart): object[] {
    const data = chart.data ?? {
        datasets: [],
        labels: [],
    };

    if (
        !Array.isArray(data.labels) ||
        data.labels.length === 0 ||
        !Array.isArray(data.datasets) ||
        data.datasets.length === 0
    ) {
        return [];
    }

    const dataset = data.datasets[0];
    if (!dataset) {
        return [];
    }

    const datasetData = Array.isArray(dataset.data) ? dataset.data : [],
        total = sumNumbers(datasetData),
        meta = chart.getDatasetMeta?.(0) ?? { data: [] };

    return data.labels.map((label, index) => {
        const hidden = meta.data?.[index]?.hidden,
            value = toFiniteNumber(datasetData[index]),
            percentage = getPercentageText(value, total);

        return {
            fillStyle: hidden
                ? "rgba(128, 128, 128, 0.5)"
                : dataset.backgroundColor?.[index],
            hidden,
            index,
            lineWidth: 1,
            pointStyle: "circle",
            strokeStyle: hidden
                ? "rgba(128, 128, 128, 0.5)"
                : dataset.borderColor,
            text: `${label}: ${formatTime(value, true)} (${percentage}%)`,
        };
    });
}

function getPercentageText(value: number, total: number): string {
    if (total <= 0) {
        return "0.0";
    }

    return ((value / total) * 100).toFixed(1);
}

function getStringThemeColor(
    colors: ThemeColorMap,
    key: string
): string | undefined {
    const value = colors[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getThemeColors(themeConfig: unknown): ThemeColorMap | undefined {
    if (!isObjectRecord(themeConfig)) {
        return undefined;
    }

    const colors = themeConfig["colors"];
    return isThemeColorMap(colors) ? colors : undefined;
}

function getThemeZoneColors(
    themeColors: ThemeColorMap | undefined
): readonly string[] {
    const zoneColors = themeColors?.["zoneColors"];
    return Array.isArray(zoneColors) ? zoneColors : [];
}

function lightenHexColor(color: string, amount: number): string {
    const safe = /^#?[\dA-Fa-f]{6}$/.test(color)
            ? color.replace("#", "")
            : "999999",
        b = Number.parseInt(safe.slice(4, 6), 16),
        g = Number.parseInt(safe.slice(2, 4), 16),
        r = Number.parseInt(safe.slice(0, 2), 16);

    return `rgba(${Math.min(255, r + amount)}, ${Math.min(255, g + amount)}, ${Math.min(255, b + amount)}, 0.9)`;
}

function resolveZoneColors(
    zoneData: readonly ZoneData[],
    chartId: string,
    themeColors: ThemeColorMap | undefined
): readonly string[] {
    const themedColors = getThemeZoneColors(themeColors);

    if (typeof zoneData[0]?.color === "string") {
        return zoneData.map((zone) => zone.color || DEFAULT_ZONE_COLOR);
    }

    const zoneType = getZoneTypeFromField(chartId);
    if (zoneType) {
        const savedColors = getChartZoneColors(zoneType, zoneData.length);
        return savedColors.length > 0 ? savedColors : themedColors;
    }

    return themedColors;
}

function sumNumbers(values: readonly unknown[]): number {
    return values.reduce<number>(
        (total, value) => total + toFiniteNumber(value),
        0
    );
}

function toFiniteNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

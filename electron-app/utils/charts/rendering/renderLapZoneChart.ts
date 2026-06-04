import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";
import {
    createManagedChart,
    type ManagedChartConfig,
    type ManagedChartInstance,
} from "../core/createManagedChart.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { chartZoomResetPlugin } from "../plugins/chartZoomResetPlugin.js";

interface LapZoneChartOptions {
    readonly title?: string;
}

interface LapZoneDatum {
    readonly color?: string;
    readonly label: string;
    readonly value: number;
    readonly zoneIndex?: number;
}

interface LapZoneEntry {
    readonly lapLabel: string;
    readonly zones: readonly LapZoneDatum[];
}

interface LapZoneRuntimeGlobal {
    readonly Chart?: unknown;
    readonly showNotification?: (message: string, type: string) => void;
}

interface LapZoneThemeColors {
    readonly chartBackground: string;
    readonly chartBorder: string;
    readonly chartGrid: string;
    readonly chartSurface: string;
    readonly primary: string;
    readonly primaryAlpha: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
}

interface LapZoneThemeConfig {
    readonly colors: LapZoneThemeColors;
    readonly name?: unknown;
}

interface TooltipDataset {
    readonly data?: unknown;
}

interface TooltipFooterItem {
    readonly parsed?: {
        readonly y?: unknown;
    };
}

interface TooltipLabelContext {
    readonly chart?: {
        readonly data?: {
            readonly datasets?: readonly TooltipDataset[];
        };
    };
    readonly dataIndex: number;
    readonly dataset?: {
        readonly label?: unknown;
    };
    readonly parsed?: {
        readonly y?: unknown;
    };
}

type ZoneType = "hr" | "power";

const DEFAULT_CHART_BACKGROUND = "#fff",
    DEFAULT_CHART_BORDER = "#333",
    DEFAULT_CHART_GRID = "rgba(0,0,0,0.1)",
    DEFAULT_CHART_SURFACE = "rgba(0,0,0,0.8)",
    DEFAULT_PRIMARY = "rgba(59,130,246,0.8)",
    DEFAULT_PRIMARY_ALPHA = "rgba(59,130,246,0.2)",
    DEFAULT_TEXT_PRIMARY = "#000",
    DEFAULT_TEXT_SECONDARY = "#444";

/**
 * Render lap-by-lap stacked zone chart for heart-rate or power zones.
 *
 * @param canvas - Target canvas element.
 * @param lapZoneData - Per-lap zone totals in seconds.
 * @param options - Chart presentation options.
 *
 * @returns The managed chart instance, or null when rendering fails.
 *
 * @throws Internally when required chart inputs are missing; the exported
 *   function catches the error and returns null.
 */
export function renderLapZoneChart(
    canvas: HTMLCanvasElement,
    lapZoneData: readonly LapZoneEntry[],
    options: LapZoneChartOptions = {}
): ManagedChartInstance | null {
    try {
        const runtimeGlobal = getRuntimeGlobal();
        if (
            typeof runtimeGlobal.Chart !== "function" ||
            !canvas ||
            !Array.isArray(lapZoneData)
        ) {
            throw new Error("Chart.js, canvas, or lapZoneData missing");
        }

        canvas.classList.add("chart-canvas");

        const themeConfig = getLapZoneThemeConfig();
        if (themeConfig.name !== undefined) {
            console.log(
                "[renderLapZoneChart] Using theme config:",
                themeConfig.name
            );
        }

        const allZoneData = new Map<string, LapZoneDatum>(),
            allZoneLabels = new Set<string>();

        for (const lap of lapZoneData) {
            for (const zone of lap.zones) {
                allZoneLabels.add(zone.label);
                if (!allZoneData.has(zone.label)) {
                    allZoneData.set(zone.label, zone);
                }
            }
        }

        const colors = themeConfig.colors,
            datasets = [...allZoneLabels]
                .sort((a, b) => parseZoneNumber(a, 0) - parseZoneNumber(b, 0))
                .map((zoneLabel, zoneIndex) =>
                    createLapZoneDataset(
                        zoneLabel,
                        zoneIndex,
                        allZoneData.get(zoneLabel),
                        lapZoneData,
                        resolveZoneType(options.title),
                        colors
                    )
                ),
            lapLabels = lapZoneData.map((lap) => lap.lapLabel || "Lap"),
            config = createLapZoneChartConfig(
                datasets,
                lapLabels,
                options.title,
                colors
            );

        return createManagedChart(canvas, config);
    } catch (error) {
        getRuntimeGlobal().showNotification?.(
            "Failed to render lap zone chart",
            "error"
        );
        console.error("[renderLapZoneChart] Error:", error);
        return null;
    }
}

function createLapZoneChartConfig(
    datasets: readonly Record<string, unknown>[],
    lapLabels: readonly string[],
    title: string | undefined,
    colors: LapZoneThemeColors
): ManagedChartConfig {
    return {
        data: {
            datasets,
            labels: lapLabels,
        },
        options: {
            interaction: {
                intersect: false,
                mode: "index",
            },
            maintainAspectRatio: false,
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: colors.chartBackground,
                },
                legend: {
                    display: true,
                    labels: {
                        color: colors.textPrimary,
                        font: { size: 12 },
                    },
                    position: "top",
                },
                title: {
                    color: colors.textPrimary,
                    display: title !== undefined && title.length > 0,
                    font: { size: 16, weight: "bold" },
                    text: title || "Zone Distribution by Lap",
                },
                tooltip: {
                    backgroundColor: colors.chartSurface,
                    bodyColor: colors.textPrimary,
                    borderColor: colors.chartBorder,
                    borderWidth: 1,
                    callbacks: {
                        footer: createTooltipFooter,
                        label: createTooltipLabel,
                    },
                    intersect: false,
                    mode: "index",
                    titleColor: colors.textPrimary,
                },
                zoom: {
                    limits: {
                        x: {
                            max: "original",
                            min: "original",
                        },
                        y: {
                            max: "original",
                            min: "original",
                        },
                    },
                    pan: {
                        enabled: true,
                        mode: "xy",
                        modifierKey: null,
                    },
                    zoom: {
                        drag: {
                            backgroundColor: colors.primaryAlpha,
                            borderColor: colors.primary,
                            borderWidth: 2,
                            enabled: true,
                            modifierKey: "shift",
                        },
                        mode: "xy",
                        pinch: {
                            enabled: true,
                        },
                        wheel: {
                            enabled: true,
                            modifierKey: "ctrl",
                            speed: 0.1,
                        },
                    },
                },
            },
            responsive: true,
            scales: {
                x: {
                    grid: {
                        color: colors.chartGrid,
                    },
                    ticks: {
                        color: colors.textPrimary,
                    },
                    title: {
                        color: colors.textPrimary,
                        display: true,
                        text: "Lap",
                    },
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: colors.chartGrid,
                    },
                    stacked: true,
                    ticks: {
                        callback: formatTickValue,
                        color: colors.textPrimary,
                    },
                    title: {
                        color: colors.textPrimary,
                        display: true,
                        text: `Time (${getUnitSymbol("time", "time")})`,
                    },
                },
            },
        },
        plugins: [
            chartZoomResetPlugin,
            {
                backgroundColor: colors.chartBackground,
                id: "chartBackgroundColorPlugin",
            },
        ],
        type: "bar",
    };
}

function createLapZoneDataset(
    zoneLabel: string,
    zoneIndex: number,
    zoneInfo: LapZoneDatum | undefined,
    lapZoneData: readonly LapZoneEntry[],
    zoneType: ZoneType,
    colors: LapZoneThemeColors
): Record<string, unknown> {
    const data = lapZoneData.map((lap) =>
            toFiniteNumber(
                lap.zones.find((zone) => zone.label === zoneLabel)?.value
            )
        ),
        originalColor = zoneInfo?.color,
        zoneColor =
            getZoneColor(zoneType, zoneInfo?.zoneIndex ?? zoneIndex) ||
            originalColor ||
            `hsl(${zoneIndex * 45}, 70%, 60%)`;

    return {
        backgroundColor: zoneColor,
        borderColor: colors.textSecondary,
        borderWidth: 1,
        data,
        label: zoneLabel,
        stack: "zones",
    };
}

function createTooltipFooter(
    tooltipItems: readonly TooltipFooterItem[]
): string {
    const total = tooltipItems.reduce(
        (sum, item) => sum + toFiniteNumber(item.parsed?.y),
        0
    );
    return `Total: ${formatTime(total, true)}`;
}

function createTooltipLabel(context: TooltipLabelContext): string {
    const lapTotal = (context.chart?.data?.datasets ?? []).reduce(
            (total, dataset) =>
                total + getDatasetValue(dataset, context.dataIndex),
            0
        ),
        value = toFiniteNumber(context.parsed?.y),
        percentage =
            lapTotal > 0 ? ((value / lapTotal) * 100).toFixed(1) : "0.0",
        datasetLabel =
            typeof context.dataset?.label === "string"
                ? context.dataset.label
                : "Zone";

    return `${datasetLabel}: ${formatTime(value, true)} (${percentage}%)`;
}

function formatTickValue(value: number | string): string {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
        return formatTime(0, true);
    }

    return formatTime(Math.max(numericValue, 0), true);
}

function getDatasetValue(dataset: TooltipDataset, dataIndex: number): number {
    if (!Array.isArray(dataset.data)) {
        return 0;
    }
    return toFiniteNumber(dataset.data[dataIndex]);
}

function getLapZoneThemeConfig(): LapZoneThemeConfig {
    const themeConfig = getThemeConfig(),
        colors = themeConfig.colors;

    return {
        colors: {
            chartBackground: getThemeColor(
                colors,
                "chartBackground",
                DEFAULT_CHART_BACKGROUND
            ),
            chartBorder: getThemeColor(
                colors,
                "chartBorder",
                DEFAULT_CHART_BORDER
            ),
            chartGrid: getThemeColor(colors, "chartGrid", DEFAULT_CHART_GRID),
            chartSurface: getThemeColor(
                colors,
                "chartSurface",
                DEFAULT_CHART_SURFACE
            ),
            primary: getThemeColor(colors, "primary", DEFAULT_PRIMARY),
            primaryAlpha: getThemeColor(
                colors,
                "primaryAlpha",
                DEFAULT_PRIMARY_ALPHA
            ),
            textPrimary: getThemeColor(
                colors,
                "textPrimary",
                DEFAULT_TEXT_PRIMARY
            ),
            textSecondary: getThemeColor(
                colors,
                "textSecondary",
                DEFAULT_TEXT_SECONDARY
            ),
        },
        name: getThemeName(themeConfig),
    };
}

function getRuntimeGlobal(): LapZoneRuntimeGlobal {
    return globalThis as LapZoneRuntimeGlobal;
}

function getThemeColor(
    colors: ThemeColorMap,
    key: string,
    fallback: string
): string {
    const colorValue = colors[key];
    return typeof colorValue === "string" && colorValue.length > 0
        ? colorValue
        : fallback;
}

function getThemeName(themeConfig: unknown): unknown {
    if (isObjectRecord(themeConfig) && "name" in themeConfig) {
        return themeConfig["name"];
    }
    return undefined;
}

function parseZoneNumber(label: string, fallback: number): number {
    const match = /\d+/.exec(label);
    if (!match) {
        return fallback;
    }

    const zoneNumber = Number.parseInt(match[0], 10);
    return Number.isFinite(zoneNumber) ? zoneNumber : fallback;
}

function resolveZoneType(title: string | undefined): ZoneType {
    return title?.toLowerCase().includes("power") === true ? "power" : "hr";
}

function toFiniteNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

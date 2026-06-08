import { resolveChartRuntime } from "../../charts/core/chartRuntime.js";
import { chartBackgroundColorPlugin } from "../../charts/plugins/chartBackgroundColorPlugin.js";
import { chartZoomResetPlugin } from "../../charts/plugins/chartZoomResetPlugin.js";
import { detectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { getUnitSymbol } from "../lookups/getUnitSymbol.js";
import { getChartZoneColors } from "./chartZoneColorUtils.js";

interface TooltipContext {
    readonly dataset: {
        readonly label?: string;
    };
    readonly parsed: {
        readonly y: number;
    };
}

interface ZoneBarDataPoint {
    readonly color?: string | undefined;
    readonly label: string;
    readonly value: number;
}

interface SingleZoneBarOptions {
    readonly title?: string;
}

type ChartConstructor = new (canvas: HTMLCanvasElement, config: SingleZoneBarChartConfig) => unknown;

interface ZoneBarNotificationGlobal {
    readonly showNotification?: (message: string, type: "error") => void;
}

interface SingleZoneBarDataset {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    data: readonly [number];
    label: string;
}

interface SingleZoneBarOptionsConfig {
    readonly backgroundColor: string;
    readonly borderColor: string;
    readonly color: string;
    readonly display: boolean;
    readonly font: {
        readonly size: number;
        readonly weight?: "bold";
    };
    readonly labels?: {
        readonly color: string;
        readonly font: {
            readonly size: number;
        };
    };
    readonly modifierKey?: string;
    readonly samples?: number;
    readonly text: string;
    readonly title?: string;
}

interface SingleZoneChartTickConfig {
    readonly callback: (value: number | string) => string;
    readonly color: string;
}

interface SingleZoneChartOptions {
    readonly maintainAspectRatio: false;
    readonly plugins: {
        readonly chartBackgroundColorPlugin: SingleZoneBarOptionsConfig;
        readonly legend: SingleZoneBarOptionsConfig;
        readonly title: SingleZoneBarOptionsConfig;
        readonly tooltip: {
            readonly backgroundColor: string;
            readonly bodyColor: string;
            readonly borderColor: string;
            readonly borderWidth: number;
            readonly callbacks: {
                readonly label: (context: TooltipContext) => string;
            };
            readonly titleColor: string;
        };
        readonly zoom: {
            readonly limits: {
                readonly y: {
                    readonly max: "original";
                    readonly min: 0;
                };
            };
            readonly pan: {
                readonly enabled: true;
                readonly mode: "y";
                readonly modifierKey: null;
            };
            readonly zoom: {
                readonly drag: {
                    readonly backgroundColor: string;
                    readonly borderColor: string;
                    readonly borderWidth: 2;
                    readonly enabled: true;
                    readonly modifierKey: "shift";
                };
                readonly mode: "y";
                readonly pinch: {
                    readonly enabled: true;
                };
                readonly wheel: {
                    readonly enabled: true;
                    readonly modifierKey: "ctrl";
                    readonly speed: 0.1;
                };
            };
        };
    };
    readonly responsive: true;
    readonly scales: {
        readonly x: {
            readonly grid: {
                readonly color: string;
            };
            readonly ticks: {
                readonly color: string;
            };
            readonly title: {
                readonly color: string;
                readonly display: false;
                readonly text: string;
            };
        };
        readonly y: {
            readonly beginAtZero: true;
            readonly grid: {
                readonly color: string;
            };
            readonly ticks: SingleZoneChartTickConfig;
            readonly title: {
                readonly color: string;
                readonly display: true;
                readonly text: string;
            };
        };
    };
}

interface SingleZoneBarChartConfig {
    readonly data: {
        readonly datasets: readonly SingleZoneBarDataset[];
        readonly labels: readonly string[];
    };
    readonly options: SingleZoneChartOptions;
    readonly plugins: readonly unknown[];
    readonly type: "bar";
}

function toFiniteNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isChartConstructor(value: unknown): value is ChartConstructor {
    return typeof value === "function";
}

function normalizeZoneData(
    zoneData: readonly unknown[]
): readonly ZoneBarDataPoint[] {
    return zoneData
        .filter(
            (zone): zone is Record<string, unknown> =>
                zone !== null && typeof zone === "object"
        )
        .map((zone) => ({
            color:
                typeof zone["color"] === "string" ? zone["color"] : undefined,
            label:
                typeof zone["label"] === "string"
                    ? zone["label"]
                    : String(zone["label"]),
            value: toFiniteNumber(zone["value"]),
        }));
}

/**
 * Renders a single power zone bar (e.g., for a summary or lap).
 *
 * @throws When Chart.js, the target canvas, or zone data is unavailable.
 */
export function renderSinglePowerZoneBar(
    canvas: HTMLCanvasElement,
    zoneData: readonly ZoneBarDataPoint[] | readonly unknown[],
    options: SingleZoneBarOptions = {}
): unknown | null {
    const chartGlobal = globalThis as typeof globalThis &
        ZoneBarNotificationGlobal;
    const ChartConstructor = resolveChartRuntime(isChartConstructor);

    try {
        if (!ChartConstructor) {
            throw new Error("Chart.js constructor is unavailable");
        }
        if (!canvas || !Array.isArray(zoneData)) {
            throw new Error("Canvas or zoneData missing");
        }
        const normalizedZoneData = normalizeZoneData(zoneData);
        if (normalizedZoneData.length === 0) {
            return null;
        }

        if (!canvas.classList.contains("chart-canvas")) {
            canvas.classList.add("chart-canvas");
        }

        const theme = detectCurrentTheme();
        console.log("[renderSinglePowerZoneBar] Detected theme:", theme);
        const savedColors = getChartZoneColors(
            "power",
            normalizedZoneData.length
        );

        const datasets: SingleZoneBarDataset[] = normalizedZoneData.map(
            (zone, index) => ({
                backgroundColor:
                    zone.color ??
                    savedColors[index] ??
                    (theme === "dark" ? "#f59e42" : "#fbbf24"),
                borderColor: theme === "dark" ? "#333" : "#fff",
                borderWidth: 1,
                data: [zone.value],
                label: zone.label,
            })
        );

        const chartConfig: SingleZoneBarChartConfig = {
            data: {
                datasets,
                labels: ["Time in Zone"],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    chartBackgroundColorPlugin: {
                        backgroundColor:
                            theme === "dark" ? "#181c24" : "#ffffff",
                        borderColor: theme === "dark" ? "#fff" : "#000",
                        color: theme === "dark" ? "#fff" : "#000",
                        display: true,
                        font: {
                            size: 12,
                            weight: "bold",
                        },
                        text: "chart background plugin",
                    },
                    legend: {
                        backgroundColor:
                            theme === "dark" ? "#181c24" : "#ffffff",
                        borderColor: theme === "dark" ? "#fff" : "#000",
                        color: theme === "dark" ? "#fff" : "#000",
                        display: true,
                        font: {
                            size: 12,
                        },
                        labels: {
                            color: theme === "dark" ? "#fff" : "#000",
                            font: {
                                size: 12,
                            },
                        },
                        text: "zone legend",
                        title: "",
                    },
                    title: {
                        backgroundColor:
                            theme === "dark" ? "#181c24" : "#ffffff",
                        borderColor: theme === "dark" ? "#fff" : "#000",
                        color: theme === "dark" ? "#fff" : "#000",
                        display: Boolean(options.title),
                        font: {
                            size: 16,
                            weight: "bold",
                        },
                        text: options.title || "Power Zones",
                    },
                    tooltip: {
                        backgroundColor: theme === "dark" ? "#222" : "#fff",
                        bodyColor: theme === "dark" ? "#fff" : "#000",
                        borderColor: theme === "dark" ? "#555" : "#ddd",
                        borderWidth: 1,
                        callbacks: {
                            label(context: TooltipContext): string {
                                const timeFormatted = formatTime(
                                    toFiniteNumber(context.parsed.y),
                                    true
                                );
                                return `${context.dataset.label}: ${timeFormatted}`;
                            },
                        },
                        titleColor: theme === "dark" ? "#fff" : "#000",
                    },
                    zoom: {
                        limits: {
                            y: {
                                max: "original",
                                min: 0,
                            },
                        },
                        pan: {
                            enabled: true,
                            mode: "y",
                            modifierKey: null,
                        },
                        zoom: {
                            drag: {
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                borderColor: "rgba(59, 130, 246, 0.8)",
                                borderWidth: 2,
                                enabled: true,
                                modifierKey: "shift",
                            },
                            mode: "y",
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
                            color:
                                theme === "dark"
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.1)",
                        },
                        ticks: {
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        title: {
                            color: theme === "dark" ? "#fff" : "#000",
                            display: false,
                            text: "Zone",
                        },
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color:
                                theme === "dark"
                                    ? "rgba(255,255,255,0.1)"
                                    : "rgba(0,0,0,0.1)",
                        },
                        ticks: {
                            callback(value): string {
                                return formatTime(toFiniteNumber(value), true);
                            },
                            color: theme === "dark" ? "#fff" : "#000",
                        },
                        title: {
                            color: theme === "dark" ? "#fff" : "#000",
                            display: true,
                            text: `Time (${getUnitSymbol("time", "time")})`,
                        },
                    },
                },
            },
            plugins: [chartZoomResetPlugin, chartBackgroundColorPlugin],
            type: "bar",
        };

        return new ChartConstructor(canvas, chartConfig);
    } catch (error) {
        if (chartGlobal.showNotification) {
            chartGlobal.showNotification(
                "Failed to render power zone bar",
                "error"
            );
        }
        console.error("[renderSinglePowerZoneBar] Error:", error);
        return null;
    }
}

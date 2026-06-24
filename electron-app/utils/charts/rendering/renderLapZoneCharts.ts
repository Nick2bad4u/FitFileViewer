import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { renderSingleHRZoneBar } from "../../data/zones/renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "../../data/zones/renderSinglePowerZoneBar.js";
import {
    getHeartRateZones,
    getPowerZones,
} from "../../data/zones/zoneDataState.js";
import { isTestEnvironment } from "../../runtime/processEnvironment.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import {
    isChartDebugLoggingEnabled,
    isChartVerboseDebugLoggingEnabled,
} from "../core/chartDebugState.js";
import { registerChartInstance as registerRegisteredChartInstance } from "../core/chartInstanceRegistry.js";
import { getRenderChartDomHelpersRuntime } from "../core/renderChartDomHelpersRuntime.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { renderLapZoneChart } from "./renderLapZoneChart.js";

interface LapZoneChartsOptions {
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showTitle?: boolean;
    readonly visibilitySettings?: LapZoneVisibility;
    readonly zoomPluginConfig?: Record<string, unknown>;
}

interface LapZoneDatum {
    readonly color: string;
    readonly label: string;
    readonly value: number;
    readonly zoneIndex: number;
}

interface LapZoneEntry {
    readonly lapLabel: string;
    readonly zones: readonly LapZoneDatum[];
}

interface LapZoneVisibility {
    readonly hrIndividualVisible: boolean;
    readonly hrStackedVisible: boolean;
    readonly powerIndividualVisible: boolean;
    readonly powerStackedVisible: boolean;
}

interface TimeInZoneMessage {
    readonly referenceIndex?: unknown;
    readonly referenceMesg?: unknown;
    readonly timeInHrZone?: unknown;
    readonly timeInPowerZone?: unknown;
}

interface ZoneSummaryDatum {
    readonly color: string;
    readonly label: string;
    readonly time?: number;
    readonly value: number;
}

type ZoneKind = "hr" | "power";

const DEFAULT_VISIBILITY: LapZoneVisibility = {
    hrIndividualVisible: true,
    hrStackedVisible: true,
    powerIndividualVisible: true,
    powerStackedVisible: true,
};

/**
 * Render lap-specific stacked and individual zone charts when lap zone data is
 * available.
 *
 * @param container - Target chart container.
 * @param options - Optional visibility and chart settings.
 */
export function renderLapZoneCharts(
    container: HTMLElement | null | undefined,
    options: LapZoneChartsOptions | null = {}
): void {
    const debug = getDebugState(),
        runtime = getRenderChartDomHelpersRuntime();

    try {
        if (debug.isDebugLoggingEnabled) {
            console.log("[ChartJS] renderLapZoneCharts called");
        }

        if (!runtime.isHTMLElement(container)) {
            return;
        }

        const timeInZoneMesgs = getTimeInZoneMessages();
        if (!timeInZoneMesgs) {
            if (debug.isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] No timeInZoneMesgs available for lap zone charts"
                );
            }
            return;
        }

        const lapZoneMsgs = timeInZoneMesgs.filter(
            (msg): msg is TimeInZoneMessage =>
                isTimeInZoneMessage(msg) && msg.referenceMesg === "lap"
        );
        logThemeConfig(debug.isDebugLoggingEnabled);

        if (debug.isDebugLoggingEnabled) {
            console.log(
                "[ChartJS] Found timeInZoneMesgs:",
                timeInZoneMesgs.length
            );
        }

        if (lapZoneMsgs.length === 0) {
            if (debug.isDebugLoggingEnabled) {
                console.log("[ChartJS] No lap-specific zone data found");
            }
            return;
        }

        const visibility = options?.visibilitySettings ?? DEFAULT_VISIBILITY;

        if (debug.isVerboseDebugLoggingEnabled) {
            console.log("[ChartJS] Found lap zone data:", lapZoneMsgs);
        }

        const hrZoneData = buildLapZoneData(lapZoneMsgs, "hr"),
            pwrZoneData = buildLapZoneData(lapZoneMsgs, "power");

        logZoneData(
            "HR",
            hrZoneData.meaningfulZoneIndexes,
            hrZoneData.laps,
            debug
        );
        logZoneData(
            "Power",
            pwrZoneData.meaningfulZoneIndexes,
            pwrZoneData.laps,
            debug
        );

        renderStackedLapZoneCharts(
            container,
            visibility,
            hrZoneData.laps,
            pwrZoneData.laps
        );
        renderIndividualLapZoneCharts(
            container,
            visibility,
            hrZoneData.laps,
            pwrZoneData.laps,
            debug
        );

        if (debug.isDebugLoggingEnabled) {
            console.log("[ChartJS] Lap zone charts rendered successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering lap zone charts:", error);
        void showNotification("Failed to render lap zone charts", "error");
    }
}

function aggregateLapZones(
    lapZoneData: readonly LapZoneEntry[]
): ZoneSummaryDatum[] {
    const aggregatedZones = new Map<string, ZoneSummaryDatum>();

    for (const lap of lapZoneData) {
        for (const zone of lap.zones) {
            const existingZone = aggregatedZones.get(zone.label);
            if (existingZone) {
                aggregatedZones.set(zone.label, {
                    ...existingZone,
                    value: existingZone.value + zone.value,
                });
            } else {
                aggregatedZones.set(zone.label, {
                    color: zone.color,
                    label: zone.label,
                    value: zone.value,
                });
            }
        }
    }

    return [...aggregatedZones.values()];
}

function buildLapZoneData(
    lapZoneMsgs: readonly TimeInZoneMessage[],
    zoneKind: ZoneKind
): {
    readonly laps: readonly LapZoneEntry[];
    readonly meaningfulZoneIndexes: readonly number[];
} {
    const zoneField = zoneKind === "hr" ? "timeInHrZone" : "timeInPowerZone",
        rawLaps = lapZoneMsgs
            .filter((msg) => Boolean(msg[zoneField]))
            .map((msg, index) =>
                createLapZoneEntry(
                    msg,
                    index,
                    zoneKind,
                    safeParseArray(msg[zoneField])
                )
            )
            .filter((lap) => lap.zones.length > 0),
        meaningfulZoneIndexes = getMeaningfulZoneIndexes(rawLaps),
        laps = rawLaps
            .map((lap) => ({
                ...lap,
                zones: lap.zones.filter((zone) =>
                    meaningfulZoneIndexes.includes(zone.zoneIndex)
                ),
            }))
            .filter((lap) => lap.zones.length > 0);

    return {
        laps,
        meaningfulZoneIndexes,
    };
}

function createLapZoneEntry(
    message: TimeInZoneMessage,
    fallbackIndex: number,
    zoneKind: ZoneKind,
    zones: readonly number[]
): LapZoneEntry {
    const labelPrefix = zoneKind === "hr" ? "HR" : "Power";

    return {
        lapLabel: getLapLabel(message.referenceIndex, fallbackIndex),
        zones: zones.slice(1).map((value, zoneIndex) => ({
            color: getZoneColor(zoneKind, zoneIndex),
            label: `${labelPrefix} Zone ${zoneIndex + 1}`,
            value,
            zoneIndex,
        })),
    };
}

function getDebugState(): {
    readonly isDebugLoggingEnabled: boolean;
    readonly isVerboseDebugLoggingEnabled: boolean;
} {
    const isTestRuntime = isTestEnvironment(),
        isDebugLoggingEnabled = isTestRuntime || isChartDebugLoggingEnabled(),
        isVerboseDebugLoggingEnabled =
            isTestRuntime || isChartVerboseDebugLoggingEnabled();

    return {
        isDebugLoggingEnabled,
        isVerboseDebugLoggingEnabled,
    };
}

function getLapLabel(referenceIndex: unknown, fallbackIndex: number): string {
    return `Lap ${referenceIndex || fallbackIndex + 1}`;
}

function getMeaningfulZoneIndexes(
    lapZoneData: readonly LapZoneEntry[]
): readonly number[] {
    const zoneTotals = new Map<number, number>();

    for (const lap of lapZoneData) {
        for (const zone of lap.zones) {
            zoneTotals.set(
                zone.zoneIndex,
                (zoneTotals.get(zone.zoneIndex) ?? 0) + zone.value
            );
        }
    }

    return [...zoneTotals.entries()]
        .filter(([, total]) => total > 0)
        .map(([zoneIndex]) => zoneIndex);
}

function getTimeInZoneMessages(): readonly unknown[] | null {
    const activityData = getActiveFitActivityData();
    if (
        !activityData.rawData ||
        !Array.isArray(activityData.rawData.timeInZoneMesgs)
    ) {
        return null;
    }
    return activityData.timeInZoneMesgs;
}

function isTimeInZoneMessage(value: unknown): value is TimeInZoneMessage {
    return isObjectRecord(value);
}

function logThemeConfig(isDebugLoggingEnabled: boolean): void {
    const themeConfig = getThemeConfig(),
        themeName = getThemeName(themeConfig);

    if (themeName && isDebugLoggingEnabled) {
        console.log("[renderLapZoneCharts] Using theme config:", themeName);
    }
}

function getThemeName(themeConfig: unknown): unknown {
    if (isObjectRecord(themeConfig) && "name" in themeConfig) {
        return themeConfig["name"];
    }
    return undefined;
}

function logZoneData(
    zoneLabel: "HR" | "Power",
    meaningfulZoneIndexes: readonly number[],
    lapZoneData: readonly LapZoneEntry[],
    debug: ReturnType<typeof getDebugState>
): void {
    if (debug.isDebugLoggingEnabled) {
        console.log(
            `[ChartJS] ${zoneLabel} Zone filtering - meaningful${zoneLabel}Zones:`,
            meaningfulZoneIndexes
        );
    }

    if (debug.isVerboseDebugLoggingEnabled) {
        console.log(
            `[ChartJS] ${zoneLabel} Zone data after filtering:`,
            lapZoneData
        );
    }
}

function normalizeSessionZones(rawZones: unknown): ZoneSummaryDatum[] {
    if (!Array.isArray(rawZones)) {
        return [];
    }

    return rawZones.filter(isObjectRecord).map((zone) => {
        const value =
                typeof zone["value"] === "number"
                    ? zone["value"]
                    : typeof zone["time"] === "number"
                      ? zone["time"]
                      : 0,
            normalizedZone = {
                color: typeof zone["color"] === "string" ? zone["color"] : "",
                label: typeof zone["label"] === "string" ? zone["label"] : "",
                value,
            };

        return typeof zone["time"] === "number"
            ? { ...normalizedZone, time: zone["time"] }
            : normalizedZone;
    });
}

function registerChartInstance(chart: unknown): void {
    if (!chart) {
        return;
    }

    registerRegisteredChartInstance(chart);
}

function renderIndividualLapZoneCharts(
    container: HTMLElement,
    visibility: LapZoneVisibility,
    hrZoneData: readonly LapZoneEntry[],
    pwrZoneData: readonly LapZoneEntry[],
    debug: ReturnType<typeof getDebugState>
): void {
    if (visibility.hrIndividualVisible) {
        renderIndividualZoneChart(
            container,
            "hr",
            hrZoneData,
            getHeartRateZones(),
            debug
        );
    }

    if (visibility.powerIndividualVisible) {
        renderIndividualZoneChart(
            container,
            "power",
            pwrZoneData,
            getPowerZones(),
            debug
        );
    }
}

function renderIndividualZoneChart(
    container: HTMLElement,
    zoneKind: ZoneKind,
    lapZoneData: readonly LapZoneEntry[],
    rawSessionZones: unknown,
    debug: ReturnType<typeof getDebugState>
): void {
    const zoneLabel = zoneKind === "hr" ? "HR" : "Power",
        chartNumber = zoneKind === "hr" ? 3 : 4;

    if (debug.isDebugLoggingEnabled) {
        console.log(
            `[ChartJS] Chart ${chartNumber} - ${zoneLabel} zone data check:`,
            {
                [`${zoneKind === "hr" ? "hr" : "pwr"}ZoneDataLength`]:
                    lapZoneData.length,
                [zoneKind === "hr"
                    ? "storedHeartRateZones"
                    : "storedPowerZones"]: rawSessionZones,
            }
        );
    }

    let sessionZones = normalizeSessionZones(rawSessionZones);

    if (sessionZones.length > 0) {
        if (debug.isVerboseDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Using session ${zoneLabel} zone data:`,
                rawSessionZones
            );
            console.log(
                `[ChartJS] ${zoneLabel} zone data after value mapping:`,
                sessionZones
            );
        }
    } else if (lapZoneData.length > 0) {
        if (debug.isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Aggregating ${zoneLabel} zone data from laps`
            );
        }
        sessionZones = aggregateLapZones(lapZoneData);
        if (debug.isVerboseDebugLoggingEnabled) {
            console.log(
                `[ChartJS] Aggregated ${zoneLabel} zones:`,
                sessionZones
            );
        }
    }

    if (sessionZones.length === 0) {
        if (debug.isDebugLoggingEnabled) {
            console.log(
                `[ChartJS] No ${zoneLabel} zone data available for Chart ${chartNumber}`
            );
        }
        return;
    }

    if (debug.isDebugLoggingEnabled) {
        console.log(
            `[ChartJS] Rendering ${zoneLabel} zone bar with data:`,
            sessionZones
        );
    }

    const canvas = createChartCanvas(
        zoneKind === "hr" ? "single-lap-hr" : "single-lap-power",
        0
    );
    canvas.id =
        zoneKind === "hr"
            ? "chartjs-canvas-single-lap-hr"
            : "chartjs-canvas-single-lap-power";
    container.append(canvas);

    const chart =
        zoneKind === "hr"
            ? renderSingleHRZoneBar(canvas, sessionZones, {
                  title: "HR Zone by Lap (Individual)",
              })
            : renderSinglePowerZoneBar(canvas, sessionZones, {
                  title: "Power Zone by Lap (Individual)",
              });
    registerChartInstance(chart);
}

function renderStackedLapZoneCharts(
    container: HTMLElement,
    visibility: LapZoneVisibility,
    hrZoneData: readonly LapZoneEntry[],
    pwrZoneData: readonly LapZoneEntry[]
): void {
    if (visibility.hrStackedVisible && hrZoneData.length > 0) {
        const canvas = createChartCanvas("lap-hr-zones", 0);
        canvas.id = "chartjs-canvas-lap-hr-zones";
        container.append(canvas);

        registerChartInstance(
            renderLapZoneChart(canvas, hrZoneData, {
                title: "HR Zone by Lap (Stacked)",
            })
        );
    }

    if (visibility.powerStackedVisible && pwrZoneData.length > 0) {
        const canvas = createChartCanvas("lap-power-zones", 0);
        canvas.id = "chartjs-canvas-lap-power-zones";
        container.append(canvas);

        registerChartInstance(
            renderLapZoneChart(canvas, pwrZoneData, {
                title: "Power Zone by Lap (Stacked)",
            })
        );
    }
}

function safeParseArray(value: unknown): number[] {
    const parsedValue = Array.isArray(value)
        ? value
        : parseSerializedArray(value);

    return parsedValue.map((entry) => {
        const numericValue = Number(entry);
        return Number.isFinite(numericValue) ? numericValue : 0;
    });
}

function parseSerializedArray(value: unknown): unknown[] {
    if (!value || typeof value !== "string") {
        return [];
    }

    try {
        const clean = value.trim().replaceAll(/^"+|"+$/g, ""),
            parsedValue: unknown = JSON.parse(clean);
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
}

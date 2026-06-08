import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { FitFileSelectors } from "../../state/domain/fitFileState.js";
import { getChartFieldVisibility } from "../../state/domain/settingsStateManager.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";
import {
    type ChartDataRecord,
    getRecordMessages,
} from "./renderChartDataPreparation.js";

/**
 * Per-category chart count totals.
 */
export interface ChartCategoryCounts {
    available: number;
    total: number;
    visible: number;
}

/**
 * Aggregate chart availability and visibility counts.
 */
export interface ChartCounts {
    available: number;
    categories: {
        analysis: ChartCategoryCounts;
        gps: ChartCategoryCounts;
        metrics: ChartCategoryCounts;
        zones: ChartCategoryCounts;
    };
    total: number;
    visible: number;
}

type ChartDataRow = ChartDataRecord;

type RenderedChartInstance = {
    readonly canvas?: {
        readonly id?: string;
    };
};

type ChartCountsGlobal = typeof globalThis & {
    _chartjsInstances?: RenderedChartInstance[];
};

const ANALYSIS_CHART_TYPES = [
    "speed_vs_distance",
    "power_vs_hr",
    "altitude_profile",
] as const;
const DEVELOPER_FIELD_EXCLUSIONS = new Set([
    "distance",
    "fractional_cadence",
    "positionLat",
    "positionLong",
    "timestamp",
]);
const LAP_ZONE_CHART_VISIBILITY_KEYS = {
    hrIndividual: "hr_lap_zone_individual",
    hrStacked: "hr_lap_zone_stacked",
    powerIndividual: "power_lap_zone_individual",
    powerStacked: "power_lap_zone_stacked",
} as const;
const ZONE_CHART_TYPES = ["hr_zone_doughnut", "power_zone_doughnut"] as const;

/**
 * Computes chart counts grouped by category.
 */
export function getChartCounts(): ChartCounts {
    const counts = createEmptyChartCounts(),
        chartGlobal = globalThis as ChartCountsGlobal,
        eventRows = FitFileSelectors.getEventMessages(),
        recordRows = getRecordRows(),
        timeInZoneRows = getTimeInZoneRows();

    if (recordRows.length === 0) {
        return counts;
    }

    try {
        countMetricCharts(counts, recordRows);
        countGpsChart(counts, recordRows);
        countAnalysisCharts(counts, recordRows);
        countZoneCharts(counts, recordRows);
        countEventMessagesChart(counts, eventRows);
        countLapZoneCharts(counts, timeInZoneRows);
        countDeveloperFieldCharts(counts, recordRows);
    } catch (error) {
        console.error("[ChartStatus] Error counting charts:", error);
    }

    logChartCountDebug(counts, chartGlobal);

    return counts;
}

function addAvailableChart(
    counts: ChartCounts,
    category: keyof ChartCounts["categories"],
    visibilityKey: string,
    amount = 1
): void {
    counts.total += amount;
    counts.available += amount;
    counts.categories[category].total += amount;
    counts.categories[category].available += amount;

    if (getChartFieldVisibility(visibilityKey) !== "hidden") {
        counts.visible += amount;
        counts.categories[category].visible += amount;
    }
}

function addUnavailableChart(
    counts: ChartCounts,
    category: keyof ChartCounts["categories"],
    amount = 1
): void {
    counts.total += amount;
    counts.categories[category].total += amount;
}

function countAnalysisCharts(
    counts: ChartCounts,
    recordRows: readonly ChartDataRow[]
): void {
    for (const chartType of ANALYSIS_CHART_TYPES) {
        addUnavailableChart(counts, "analysis");

        if (hasAnalysisChartData(chartType, recordRows)) {
            counts.available += 1;
            counts.categories.analysis.available += 1;

            if (getChartFieldVisibility(chartType) !== "hidden") {
                counts.visible += 1;
                counts.categories.analysis.visible += 1;
            }
        }
    }
}

function countDeveloperFieldCharts(
    counts: ChartCounts,
    recordRows: readonly ChartDataRow[]
): void {
    const sampleRecord = recordRows[0];
    if (!sampleRecord) {
        return;
    }

    const developerFields = Object.keys(sampleRecord).filter(
        (key) =>
            !formatChartFields.includes(key) &&
            !DEVELOPER_FIELD_EXCLUSIONS.has(key) &&
            (key.startsWith("developer_") || key.includes("_"))
    );

    for (const field of developerFields) {
        if (hasNumericFieldData(recordRows, field)) {
            addAvailableChart(counts, "metrics", field);
        }
    }
}

function countEventMessagesChart(
    counts: ChartCounts,
    eventRows: readonly unknown[]
): void {
    if (eventRows.length > 0) {
        addAvailableChart(counts, "analysis", "event_messages");
    }
}

function countGpsChart(
    counts: ChartCounts,
    recordRows: readonly ChartDataRow[]
): void {
    if (
        recordRows.some(
            (row) =>
                isNumericLike(row["positionLat"]) ||
                isNumericLike(row["positionLong"])
        )
    ) {
        addAvailableChart(counts, "gps", "gps_track");
    }
}

function countLapZoneCharts(
    counts: ChartCounts,
    timeInZoneRows: readonly ChartDataRow[]
): void {
    const lapZoneMessages = timeInZoneRows.filter(
        (message) => message["referenceMesg"] === "lap"
    );

    if (lapZoneMessages.length === 0) {
        return;
    }

    if (lapZoneMessages.some((message) => message["timeInHrZone"])) {
        addAvailableChart(
            counts,
            "zones",
            LAP_ZONE_CHART_VISIBILITY_KEYS.hrStacked
        );
        addAvailableChart(
            counts,
            "zones",
            LAP_ZONE_CHART_VISIBILITY_KEYS.hrIndividual
        );
    }

    if (lapZoneMessages.some((message) => message["timeInPowerZone"])) {
        addAvailableChart(
            counts,
            "zones",
            LAP_ZONE_CHART_VISIBILITY_KEYS.powerStacked
        );
        addAvailableChart(
            counts,
            "zones",
            LAP_ZONE_CHART_VISIBILITY_KEYS.powerIndividual
        );
    }
}

function countMetricCharts(
    counts: ChartCounts,
    recordRows: readonly ChartDataRow[]
): void {
    for (const field of formatChartFields) {
        addUnavailableChart(counts, "metrics");

        if (hasNumericFieldData(recordRows, field)) {
            counts.available += 1;
            counts.categories.metrics.available += 1;

            if (getChartFieldVisibility(field) !== "hidden") {
                counts.visible += 1;
                counts.categories.metrics.visible += 1;
            }
        }
    }
}

function countZoneCharts(
    counts: ChartCounts,
    recordRows: readonly ChartDataRow[]
): void {
    for (const chartType of ZONE_CHART_TYPES) {
        addUnavailableChart(counts, "zones");

        const hasRequiredData = chartType.includes("hr_zone")
            ? hasNumericFieldData(recordRows, "heartRate")
            : hasNumericFieldData(recordRows, "power");

        if (hasRequiredData) {
            counts.available += 1;
            counts.categories.zones.available += 1;

            if (getChartFieldVisibility(chartType) !== "hidden") {
                counts.visible += 1;
                counts.categories.zones.visible += 1;
            }
        }
    }
}

function createCategoryCounts(): ChartCategoryCounts {
    return { available: 0, total: 0, visible: 0 };
}

function createEmptyChartCounts(): ChartCounts {
    return {
        available: 0,
        categories: {
            analysis: createCategoryCounts(),
            gps: createCategoryCounts(),
            metrics: createCategoryCounts(),
            zones: createCategoryCounts(),
        },
        total: 0,
        visible: 0,
    };
}

function getRecordRows(): ChartDataRow[] {
    return (
        getRecordMessages({
            recordMesgs: FitFileSelectors.getRecordMessages(),
        }) ?? []
    );
}

function getTimeInZoneRows(): ChartDataRow[] {
    return FitFileSelectors.getTimeInZoneMessages().filter(isObjectRecord);
}

function hasAnalysisChartData(
    chartType: (typeof ANALYSIS_CHART_TYPES)[number],
    recordRows: readonly ChartDataRow[]
): boolean {
    switch (chartType) {
        case "altitude_profile": {
            return recordRows.some((row) =>
                isNumericLike(row["altitude"] ?? row["enhancedAltitude"])
            );
        }
        case "power_vs_hr": {
            return (
                hasNumericFieldData(recordRows, "power") &&
                hasNumericFieldData(recordRows, "heartRate")
            );
        }
        case "speed_vs_distance": {
            return (
                recordRows.some((row) =>
                    isNumericLike(row["enhancedSpeed"] ?? row["speed"])
                ) && hasNumericFieldData(recordRows, "distance")
            );
        }
        default: {
            return false;
        }
    }
}

function hasNumericFieldData(
    recordRows: readonly ChartDataRow[],
    field: string
): boolean {
    return recordRows.some((row) => isNumericLike(row[field]));
}

function isNumericLike(value: unknown): boolean {
    if (typeof value === "number") {
        return Number.isFinite(value);
    }

    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        !Number.isNaN(Number.parseFloat(value))
    );
}

function logChartCountDebug(
    counts: ChartCounts,
    chartGlobal: ChartCountsGlobal
): void {
    console.log("[ChartStatus] Chart count breakdown:", {
        actualRendered: chartGlobal._chartjsInstances?.length ?? 0,
        available: counts.available,
        categories: counts.categories,
        total: counts.total,
        visible: counts.visible,
    });

    if (
        Array.isArray(chartGlobal._chartjsInstances) &&
        chartGlobal._chartjsInstances.length > 0
    ) {
        const renderedChartIds = chartGlobal._chartjsInstances.map(
            (chart) => chart.canvas?.id ?? ""
        );
        console.log(
            "[ChartStatus] Actually rendered charts:",
            renderedChartIds
        );
    }
}

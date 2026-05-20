import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { getChartFieldVisibility } from "../../state/domain/settingsStateManager.js";
const ANALYSIS_CHART_TYPES = [
    "speed_vs_distance",
    "power_vs_hr",
    "altitude_profile",
];
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
};
const ZONE_CHART_TYPES = ["hr_zone_doughnut", "power_zone_doughnut"];
/**
 * Computes chart counts grouped by category.
 */
export function getChartCounts() {
    const counts = createEmptyChartCounts(), chartGlobal = globalThis, globalData = chartGlobal.globalData, recordRows = getRecordRows(globalData);
    if (recordRows.length === 0) {
        return counts;
    }
    try {
        countMetricCharts(counts, recordRows);
        countGpsChart(counts, recordRows);
        countAnalysisCharts(counts, recordRows);
        countZoneCharts(counts, recordRows);
        countEventMessagesChart(counts, globalData);
        countLapZoneCharts(counts, globalData);
        countDeveloperFieldCharts(counts, recordRows);
    }
    catch (error) {
        console.error("[ChartStatus] Error counting charts:", error);
    }
    logChartCountDebug(counts, chartGlobal);
    return counts;
}
function addAvailableChart(counts, category, visibilityKey, amount = 1) {
    counts.total += amount;
    counts.available += amount;
    counts.categories[category].total += amount;
    counts.categories[category].available += amount;
    if (getChartFieldVisibility(visibilityKey) !== "hidden") {
        counts.visible += amount;
        counts.categories[category].visible += amount;
    }
}
function addUnavailableChart(counts, category, amount = 1) {
    counts.total += amount;
    counts.categories[category].total += amount;
}
function countAnalysisCharts(counts, recordRows) {
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
function countDeveloperFieldCharts(counts, recordRows) {
    const sampleRecord = recordRows[0];
    if (!sampleRecord) {
        return;
    }
    const developerFields = Object.keys(sampleRecord).filter((key) => !formatChartFields.includes(key) &&
        !DEVELOPER_FIELD_EXCLUSIONS.has(key) &&
        (key.startsWith("developer_") || key.includes("_")));
    for (const field of developerFields) {
        if (hasNumericFieldData(recordRows, field)) {
            addAvailableChart(counts, "metrics", field);
        }
    }
}
function countEventMessagesChart(counts, globalData) {
    if (Array.isArray(globalData?.eventMesgs) && globalData.eventMesgs.length) {
        addAvailableChart(counts, "analysis", "event_messages");
    }
}
function countGpsChart(counts, recordRows) {
    if (recordRows.some((row) => isNumericLike(row["positionLat"]) ||
        isNumericLike(row["positionLong"]))) {
        addAvailableChart(counts, "gps", "gps_track");
    }
}
function countLapZoneCharts(counts, globalData) {
    const lapZoneMessages = getTimeInZoneRows(globalData).filter((message) => message["referenceMesg"] === "lap");
    if (!lapZoneMessages.length) {
        return;
    }
    if (lapZoneMessages.some((message) => message["timeInHrZone"])) {
        addAvailableChart(counts, "zones", LAP_ZONE_CHART_VISIBILITY_KEYS.hrStacked);
        addAvailableChart(counts, "zones", LAP_ZONE_CHART_VISIBILITY_KEYS.hrIndividual);
    }
    if (lapZoneMessages.some((message) => message["timeInPowerZone"])) {
        addAvailableChart(counts, "zones", LAP_ZONE_CHART_VISIBILITY_KEYS.powerStacked);
        addAvailableChart(counts, "zones", LAP_ZONE_CHART_VISIBILITY_KEYS.powerIndividual);
    }
}
function countMetricCharts(counts, recordRows) {
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
function countZoneCharts(counts, recordRows) {
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
function createCategoryCounts() {
    return { available: 0, total: 0, visible: 0 };
}
function createEmptyChartCounts() {
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
function getRecordRows(globalData) {
    if (!Array.isArray(globalData?.recordMesgs)) {
        return [];
    }
    return globalData.recordMesgs.filter(isRecord);
}
function getTimeInZoneRows(globalData) {
    if (!Array.isArray(globalData?.timeInZoneMesgs)) {
        return [];
    }
    return globalData.timeInZoneMesgs.filter(isRecord);
}
function hasAnalysisChartData(chartType, recordRows) {
    switch (chartType) {
        case "altitude_profile":
            return recordRows.some((row) => isNumericLike(row["altitude"] ?? row["enhancedAltitude"]));
        case "power_vs_hr":
            return (hasNumericFieldData(recordRows, "power") &&
                hasNumericFieldData(recordRows, "heartRate"));
        case "speed_vs_distance":
            return (recordRows.some((row) => isNumericLike(row["enhancedSpeed"] ?? row["speed"])) && hasNumericFieldData(recordRows, "distance"));
    }
}
function hasNumericFieldData(recordRows, field) {
    return recordRows.some((row) => isNumericLike(row[field]));
}
function isNumericLike(value) {
    if (value === null || value === undefined) {
        return false;
    }
    return !Number.isNaN(Number.parseFloat(String(value)));
}
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function logChartCountDebug(counts, chartGlobal) {
    console.log("[ChartStatus] Chart count breakdown:", {
        actualRendered: chartGlobal._chartjsInstances?.length ?? 0,
        available: counts.available,
        categories: counts.categories,
        total: counts.total,
        visible: counts.visible,
    });
    if (Array.isArray(chartGlobal._chartjsInstances) &&
        chartGlobal._chartjsInstances.length > 0) {
        const renderedChartIds = chartGlobal._chartjsInstances.map((chart) => chart.canvas?.id ?? "");
        console.log("[ChartStatus] Actually rendered charts:", renderedChartIds);
    }
}

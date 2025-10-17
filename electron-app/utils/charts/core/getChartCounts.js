import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { getGlobalData } from "../../state/domain/globalDataState.js";

/**
 * @typedef {{ total:number, visible:number, available:number }} ChartCategoryCounts
 * @typedef {{
 *  total:number,
 *  visible:number,
 *  available:number,
 *  categories:{ metrics:ChartCategoryCounts, analysis:ChartCategoryCounts, zones:ChartCategoryCounts,
 *  gps:ChartCategoryCounts }
 * }} ChartCounts
 */
// Re-export typedef via empty export trick for JSDoc consumers
/** @typedef {import('./getChartCounts.js').ChartCounts} */

/**
 * Gets the count of available chart types based on current data
 * @returns {Object} Object containing total available and currently visible counts
 */

/**
 * Compute chart counts grouped by category.
 * @returns {ChartCounts}
 */
export function getChartCounts() {
    const globalData = getGlobalData();
    const recordMesgs = Array.isArray(globalData?.recordMesgs) ? globalData.recordMesgs : null;
    const counts /** @type {ChartCounts} */ = {
        available: 0,
        categories: {
            analysis: { available: 0, total: 0, visible: 0 },
            gps: { available: 0, total: 0, visible: 0 },
            metrics: { available: 0, total: 0, visible: 0 },
            zones: { available: 0, total: 0, visible: 0 },
        },
        total: 0,
        visible: 0,
    },
        hasData = Array.isArray(recordMesgs) && recordMesgs.length > 0;
    if (!hasData || !recordMesgs) {
        return counts;
    }

    const data = recordMesgs;
    const eventMesgs = Array.isArray(globalData?.eventMesgs) ? globalData.eventMesgs : null;
    const timeInZoneMesgs = Array.isArray(globalData?.timeInZoneMesgs) ? globalData.timeInZoneMesgs : null;

    try {
        // Ensure formatChartFields is an array of strings; handle legacy cases where it might be a single string
        /** @type {string[]} */
        const metricFields = Array.isArray(formatChartFields)
            ? /** @type {string[]} */ (formatChartFields)
            : typeof formatChartFields === "string"
                ? [formatChartFields]
                : [];

        // Basic metric fields
        for (const field of metricFields) {
            counts.total++;
            counts.categories.metrics.total++;

            // Check if this field has valid numeric data (same logic as renderChartJS)
            const numericData = data.map((/** @type {any} */ row) => {
                if (row[field] !== undefined && row[field] !== null) {
                    const value = Number.parseFloat(row[field]);
                    return isNaN(value) ? null : value;
                }
                return null;
            }),
                // Only count as available if there's at least one valid data point
                hasValidData = !numericData.every((/** @type {any} */ val) => val === null);
            if (hasValidData) {
                counts.available++;
                counts.categories.metrics.available++;

                // Check visibility
                const visibility = localStorage.getItem(`chartjs_field_${field}`);
                if (visibility !== "hidden") {
                    counts.visible++;
                    counts.categories.metrics.visible++;
                }
            }
        } // GPS track chart (counted separately from lat/long individual charts)
        const hasGPSData = data.some((/** @type {any} */ row) => {
            const lat = row.positionLat,
                long = row.positionLong;
            return (
                (lat !== undefined && lat !== null && !isNaN(Number.parseFloat(lat))) ||
                (long !== undefined && long !== null && !isNaN(Number.parseFloat(long)))
            );
        }); // Add GPS track chart in addition to individual lat/long charts

        // (Both are rendered in the current implementation)
        if (hasGPSData) {
            counts.total++;
            counts.available++;
            counts.categories.gps.total++;
            counts.categories.gps.available++;

            const gpsVisibility = localStorage.getItem("chartjs_field_gps_track");
            if (gpsVisibility !== "hidden") {
                counts.visible++;
                counts.categories.gps.visible++;
            }
        } // Performance analysis charts
        const analysisCharts = ["speed_vs_distance", "power_vs_hr", "altitude_profile"];
        for (const chartType of analysisCharts) {
            counts.total++;
            counts.categories.analysis.total++; // Check if required fields exist and have valid data for each analysis chart
            let hasRequiredData = false;
            switch (chartType) {
                case "altitude_profile": {
                    hasRequiredData = data.some((/** @type {any} */ row) => {
                        const altitude = row.altitude || row.enhancedAltitude;
                        return altitude !== undefined && altitude !== null && !isNaN(Number.parseFloat(altitude));
                    });
                    break;
                }
                case "power_vs_hr": {
                    const hasHeartRate = data.some((/** @type {any} */ row) => {
                        const hr = row.heartRate;
                        return hr !== undefined && hr !== null && !isNaN(Number.parseFloat(hr));
                    }),
                        hasPower = data.some((/** @type {any} */ row) => {
                            const { power } = row;
                            return power !== undefined && power !== null && !isNaN(Number.parseFloat(power));
                        });
                    hasRequiredData = hasPower && hasHeartRate;
                    break;
                }
                case "speed_vs_distance": {
                    const hasDistance = data.some((/** @type {any} */ row) => {
                        const { distance } = row;
                        return distance !== undefined && distance !== null && !isNaN(Number.parseFloat(distance));
                    }),
                        hasSpeed = data.some((/** @type {any} */ row) => {
                            const speed = row.enhancedSpeed || row.speed;
                            return speed !== undefined && speed !== null && !isNaN(Number.parseFloat(speed));
                        });
                    hasRequiredData = hasSpeed && hasDistance;
                    break;
                }
            }

            if (hasRequiredData) {
                counts.available++;
                counts.categories.analysis.available++;

                const visibility = localStorage.getItem(`chartjs_field_${chartType}`);
                if (visibility !== "hidden") {
                    counts.visible++;
                    counts.categories.analysis.visible++;
                }
            }
        } // Zone charts (these are field-based toggles for doughnut charts only)
        const zoneCharts = ["hr_zone_doughnut", "power_zone_doughnut"];
        for (const chartType of zoneCharts) {
            counts.total++;
            counts.categories.zones.total++;

            // Check if required data exists for zone charts with valid numeric values
            let hasRequiredData = false;
            if (chartType.includes("hr_zone")) {
                hasRequiredData = data.some((/** @type {any} */ row) => {
                    const hr = row.heartRate;
                    return hr !== undefined && hr !== null && !isNaN(Number.parseFloat(hr));
                });
            } else if (chartType.includes("power_zone")) {
                hasRequiredData = data.some((/** @type {any} */ row) => {
                    const { power } = row;
                    return power !== undefined && power !== null && !isNaN(Number.parseFloat(power));
                });
            }

            if (hasRequiredData) {
                counts.available++;
                counts.categories.zones.available++;

                const visibility = localStorage.getItem(`chartjs_field_${chartType}`);
                if (visibility !== "hidden") {
                    counts.visible++;
                    counts.categories.zones.visible++;
                }
            }
        } // Event messages chart
        if (eventMesgs && eventMesgs.length > 0) {
            counts.total++;
            counts.available++;
            counts.categories.analysis.total++;
            counts.categories.analysis.available++;

            // Event messages charts should respect visibility settings
            const visibility = localStorage.getItem("chartjs_field_event_messages");
            if (visibility !== "hidden") {
                counts.visible++;
                counts.categories.analysis.visible++;
            }
        } // Time in zone charts are handled by the field toggles above (hr_zone_doughnut, power_zone_doughnut)

        // No need to count separately as they use the same visibility toggles        // Lap zone charts (from renderLapZoneCharts - up to 4 charts possible)
        if (timeInZoneMesgs && timeInZoneMesgs.length > 0) {
            const lapZoneMsgs = timeInZoneMesgs.filter((/** @type {any} */ msg) => msg.referenceMesg === "lap");

            if (lapZoneMsgs.length > 0) {
                // Check for HR lap zone charts (2 charts: stacked bar and individual bars)
                const hrLapZones = lapZoneMsgs.filter((/** @type {any} */ msg) => msg.timeInHrZone);
                if (hrLapZones.length > 0) {
                    counts.total += 2; // Stacked bar + individual bars
                    counts.available += 2;
                    counts.categories.zones.total += 2;
                    counts.categories.zones.available += 2;

                    // Check visibility for HR lap zone charts
                    const hrIndividualVisibility = localStorage.getItem("chartjs_field_hr_lap_zone_individual"),
                        hrStackedVisibility = localStorage.getItem("chartjs_field_hr_lap_zone_stacked");

                    if (hrStackedVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                    if (hrIndividualVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                }

                // Check for Power lap zone charts (2 charts: stacked bar + individual bars)
                const powerLapZones = lapZoneMsgs.filter((/** @type {any} */ msg) => msg.timeInPowerZone);
                if (powerLapZones.length > 0) {
                    counts.total += 2; // Stacked bar + individual bars
                    counts.available += 2;
                    counts.categories.zones.total += 2;
                    counts.categories.zones.available += 2;

                    // Check visibility for Power lap zone charts
                    const powerIndividualVisibility = localStorage.getItem("chartjs_field_power_lap_zone_individual"),
                        powerStackedVisibility = localStorage.getItem("chartjs_field_power_lap_zone_stacked");

                    if (powerStackedVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                    if (powerIndividualVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                }
            }
        } // Developer fields (dynamic based on actual data)

        // Only count fields that are not already in formatChartFields and have meaningful data
        if (recordMesgs && recordMesgs.length > 0) {
            const [sampleRecord] = recordMesgs,
                excludedFields = new Set([
                    "distance",
                    "fractional_cadence",
                    "positionLat",
                    "positionLong",
                    "timestamp",
                ]),
                developerFields = Object.keys(sampleRecord).filter(
                    (key) =>
                        !metricFields.includes(key) &&
                        !excludedFields.has(key) &&
                        (key.startsWith("developer_") || key.includes("_"))
                );
            for (const field of developerFields) {
                // Check if this field has valid numeric data (same logic as renderChartJS)
                const numericData = data.map((/** @type {any} */ row) => {
                    if (row[field] !== undefined && row[field] !== null) {
                        const value = Number.parseFloat(row[field]);
                        return isNaN(value) ? null : value;
                    }
                    return null;
                }),
                    // Only count as available if there's at least one valid data point
                    hasValidData = !numericData.every((/** @type {any} */ val) => val === null);
                if (hasValidData) {
                    counts.total++;
                    counts.available++;
                    counts.categories.metrics.total++;
                    counts.categories.metrics.available++;

                    const visibility = localStorage.getItem(`chartjs_field_${field}`);
                    if (visibility !== "hidden") {
                        counts.visible++;
                        counts.categories.metrics.visible++;
                    }
                }
            }
        }
    } catch (error) {
        console.error("[ChartStatus] Error counting charts:", error);
        // Don't rethrow - just log and return current counts
        // This prevents the error from propagating to renderChartJS
    }

    // Debug logging to help identify discrepancies
    console.log("[ChartStatus] Chart count breakdown:", {
        actualRendered: globalThis._chartjsInstances ? globalThis._chartjsInstances.length : 0,
        available: counts.available,
        categories: counts.categories,
        total: counts.total,
        visible: counts.visible,
    });

    // Debug: Show what charts are actually rendered
    if (globalThis._chartjsInstances && globalThis._chartjsInstances.length > 0) {
        const renderedChartIds = globalThis._chartjsInstances.map((chart) => chart.canvas.id);
        console.log("[ChartStatus] Actually rendered charts:", renderedChartIds);
    }

    return counts;
}

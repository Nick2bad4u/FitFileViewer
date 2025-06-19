import { formatChartFields } from "./formatChartFields.js";

/**
 * Gets the count of available chart types based on current data
 * @returns {Object} Object containing total available and currently visible counts
 */

export function getChartCounts() {
    const counts = {
        total: 0,
        visible: 0,
        available: 0,
        categories: {
            metrics: { total: 0, visible: 0, available: 0 },
            analysis: { total: 0, visible: 0, available: 0 },
            zones: { total: 0, visible: 0, available: 0 },
            gps: { total: 0, visible: 0, available: 0 },
        },
    };

    // Check if we have data
    const hasData = window.globalData && window.globalData.recordMesgs && window.globalData.recordMesgs.length > 0;
    if (!hasData) {
        return counts;
    }

    const data = window.globalData.recordMesgs;

    try {
        // Basic metric fields
        formatChartFields.forEach((field) => {
            counts.total++;
            counts.categories.metrics.total++;

            // Check if this field has valid numeric data (same logic as renderChartJS)
            const numericData = data.map((row) => {
                if (row[field] !== undefined && row[field] !== null) {
                    const value = parseFloat(row[field]);
                    return isNaN(value) ? null : value;
                }
                return null;
            });

            // Only count as available if there's at least one valid data point
            const hasValidData = !numericData.every((val) => val === null);
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
        }); // GPS track chart (counted separately from lat/long individual charts)
        const hasGPSData = data.some((row) => {
            const lat = row.positionLat;
            const long = row.positionLong;
            return (
                (lat !== undefined && lat !== null && !isNaN(parseFloat(lat))) ||
                (long !== undefined && long !== null && !isNaN(parseFloat(long)))
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
        analysisCharts.forEach((chartType) => {
            counts.total++;
            counts.categories.analysis.total++; // Check if required fields exist and have valid data for each analysis chart
            let hasRequiredData = false;
            switch (chartType) {
                case "speed_vs_distance": {
                    const hasSpeed = data.some((row) => {
                        const speed = row.enhancedSpeed || row.speed;
                        return speed !== undefined && speed !== null && !isNaN(parseFloat(speed));
                    });
                    const hasDistance = data.some((row) => {
                        const distance = row.distance;
                        return distance !== undefined && distance !== null && !isNaN(parseFloat(distance));
                    });
                    hasRequiredData = hasSpeed && hasDistance;
                    break;
                }
                case "power_vs_hr": {
                    const hasPower = data.some((row) => {
                        const power = row.power;
                        return power !== undefined && power !== null && !isNaN(parseFloat(power));
                    });
                    const hasHeartRate = data.some((row) => {
                        const hr = row.heartRate;
                        return hr !== undefined && hr !== null && !isNaN(parseFloat(hr));
                    });
                    hasRequiredData = hasPower && hasHeartRate;
                    break;
                }
                case "altitude_profile": {
                    hasRequiredData = data.some((row) => {
                        const altitude = row.altitude || row.enhancedAltitude;
                        return altitude !== undefined && altitude !== null && !isNaN(parseFloat(altitude));
                    });
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
        }); // Zone charts (these are field-based toggles for doughnut charts only)
        const zoneCharts = ["hr_zone_doughnut", "power_zone_doughnut"];
        zoneCharts.forEach((chartType) => {
            counts.total++;
            counts.categories.zones.total++;

            // Check if required data exists for zone charts with valid numeric values
            let hasRequiredData = false;
            if (chartType.includes("hr_zone")) {
                hasRequiredData = data.some((row) => {
                    const hr = row.heartRate;
                    return hr !== undefined && hr !== null && !isNaN(parseFloat(hr));
                });
            } else if (chartType.includes("power_zone")) {
                hasRequiredData = data.some((row) => {
                    const power = row.power;
                    return power !== undefined && power !== null && !isNaN(parseFloat(power));
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
        }); // Event messages chart
        if (
            window.globalData?.eventMesgs &&
            Array.isArray(window.globalData.eventMesgs) &&
            window.globalData.eventMesgs.length > 0
        ) {
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
        if (window.globalData?.timeInZoneMesgs) {
            const timeInZoneMesgs = window.globalData.timeInZoneMesgs;
            const lapZoneMsgs = timeInZoneMesgs.filter((msg) => msg.referenceMesg === "lap");

            if (lapZoneMsgs.length > 0) {
                // Check for HR lap zone charts (2 charts: stacked bar and individual bars)
                const hrLapZones = lapZoneMsgs.filter((msg) => msg.timeInHrZone);
                if (hrLapZones.length > 0) {
                    counts.total += 2; // Stacked bar + individual bars
                    counts.available += 2;
                    counts.categories.zones.total += 2;
                    counts.categories.zones.available += 2;

                    // Check visibility for HR lap zone charts
                    const hrStackedVisibility = localStorage.getItem("chartjs_field_hr_lap_zone_stacked");
                    const hrIndividualVisibility = localStorage.getItem("chartjs_field_hr_lap_zone_individual");

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
                const powerLapZones = lapZoneMsgs.filter((msg) => msg.timeInPowerZone);
                if (powerLapZones.length > 0) {
                    counts.total += 2; // Stacked bar + individual bars
                    counts.available += 2;
                    counts.categories.zones.total += 2;
                    counts.categories.zones.available += 2;

                    // Check visibility for Power lap zone charts
                    const powerStackedVisibility = localStorage.getItem("chartjs_field_power_lap_zone_stacked");
                    const powerIndividualVisibility = localStorage.getItem("chartjs_field_power_lap_zone_individual");

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
        if (window.globalData?.recordMesgs && window.globalData.recordMesgs.length > 0) {
            const sampleRecord = window.globalData.recordMesgs[0];
            const excludedFields = ["timestamp", "distance", "fractional_cadence", "positionLat", "positionLong"];
            const developerFields = Object.keys(sampleRecord).filter(
                (key) =>
                    !formatChartFields.includes(key) &&
                    !excludedFields.includes(key) &&
                    (key.startsWith("developer_") || key.includes("_"))
            );
            developerFields.forEach((field) => {
                // Check if this field has valid numeric data (same logic as renderChartJS)
                const numericData = data.map((row) => {
                    if (row[field] !== undefined && row[field] !== null) {
                        const value = parseFloat(row[field]);
                        return isNaN(value) ? null : value;
                    }
                    return null;
                });

                // Only count as available if there's at least one valid data point
                const hasValidData = !numericData.every((val) => val === null);
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
            });
        }
    } catch (error) {
        console.error("[ChartStatus] Error counting charts:", error);
        // Don't rethrow - just log and return current counts
        // This prevents the error from propagating to renderChartJS
    }

    // Debug logging to help identify discrepancies
    console.log("[ChartStatus] Chart count breakdown:", {
        total: counts.total,
        available: counts.available,
        visible: counts.visible,
        categories: counts.categories,
        actualRendered: window._chartjsInstances ? window._chartjsInstances.length : 0,
    });

    // Debug: Show what charts are actually rendered
    if (window._chartjsInstances && window._chartjsInstances.length > 0) {
        const renderedChartIds = window._chartjsInstances.map((chart) => chart.canvas.id);
        console.log("[ChartStatus] Actually rendered charts:", renderedChartIds);
    }

    return counts;
}

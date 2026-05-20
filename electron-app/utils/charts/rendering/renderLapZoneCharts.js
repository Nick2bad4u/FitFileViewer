import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { renderSingleHRZoneBar } from "../../data/zones/renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "../../data/zones/renderSinglePowerZoneBar.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { renderLapZoneChart } from "./renderLapZoneChart.js";
/**
 * @typedef {Object} LapZoneDatum
 *
 * @property {string} label
 * @property {number} value
 * @property {string} color
 * @property {number} zoneIndex
 */
/**
 * @typedef {Object} ZoneSummaryDatum
 *
 * @property {string} color
 * @property {string} label
 * @property {number} value
 * @property {number} [time]
 */
/**
 * @typedef {Object} LapZoneEntry
 *
 * @property {string} lapLabel
 * @property {LapZoneDatum[]} zones
 */
/**
 * @typedef {Object} LapZoneVisibility
 *
 * @property {boolean} hrStackedVisible
 * @property {boolean} hrIndividualVisible
 * @property {boolean} powerStackedVisible
 * @property {boolean} powerIndividualVisible
 */
/**
 * @typedef {Object} LapZoneChartsOptions
 *
 * @property {boolean} [showGrid]
 * @property {boolean} [showLegend]
 * @property {boolean} [showTitle]
 * @property {LapZoneVisibility} [visibilitySettings]
 * @property {Record<string, unknown>} [zoomPluginConfig]
 */
/**
 * @typedef {Object} TimeInZoneMessage
 *
 * @property {unknown} [referenceIndex]
 * @property {unknown} [referenceMesg]
 * @property {unknown} [timeInHrZone]
 * @property {unknown} [timeInPowerZone]
 */
/**
 * @typedef {Object} LapZoneRuntimeGlobal
 *
 * @property {unknown} [__FFV_debugCharts]
 * @property {unknown} [__FFV_debugChartsVerbose]
 * @property {unknown} [_chartjsInstances]
 * @property {{ timeInZoneMesgs?: unknown } | undefined} [globalData]
 * @property {unknown} [heartRateZones]
 * @property {unknown} [powerZones]
 * @property {((message: string, type: string) => void) | undefined} [showNotification]
 */

const chartGlobal = /** @type {LapZoneRuntimeGlobal} */ (globalThis);

/**
 * @param {unknown} value
 *
 * @returns {value is TimeInZoneMessage}
 */
function isTimeInZoneMessage(value) {
    return value !== null && typeof value === "object";
}

/**
 * @param {unknown} chart
 */
function registerChartInstance(chart) {
    if (!chart) {
        return;
    }

    if (!Array.isArray(chartGlobal._chartjsInstances)) {
        chartGlobal._chartjsInstances = [];
    }
    chartGlobal._chartjsInstances.push(chart);
}

/**
 * @param {unknown} rawZones
 *
 * @returns {ZoneSummaryDatum[]}
 */
function normalizeSessionZones(rawZones) {
    if (!Array.isArray(rawZones)) {
        return [];
    }

    return rawZones
        .filter((zone) => zone !== null && typeof zone === "object")
        .map((zone) => {
            const record = /** @type {Record<string, unknown>} */ (zone);
            const value =
                typeof record.value === "number"
                    ? record.value
                    : typeof record.time === "number"
                      ? record.time
                      : 0;
            const normalizedZone = {
                color: typeof record.color === "string" ? record.color : "",
                label: typeof record.label === "string" ? record.label : "",
                value,
            };
            if (typeof record.time === "number") {
                return { ...normalizedZone, time: record.time };
            }
            return normalizedZone;
        });
}

// Lap zone charts renderer - renders 4 different lap zone visualizations
/**
 * @param {HTMLElement} container
 * @param {LapZoneChartsOptions} [options]
 */
export function renderLapZoneCharts(container, options = {}) {
    try {
        const isTestEnvironment =
            typeof process !== "undefined" && process.env?.NODE_ENV === "test";
        const isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.NODE_ENV === "development";
        const isDebugLoggingEnabled =
            isTestEnvironment ||
            (isDevEnvironment && Boolean(chartGlobal.__FFV_debugCharts));
        const isVerboseDebugLoggingEnabled =
            isTestEnvironment ||
            (isDebugLoggingEnabled &&
                Boolean(chartGlobal.__FFV_debugChartsVerbose));

        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderLapZoneCharts called");
        }

        const timeInZoneMesgs = Array.isArray(
            chartGlobal.globalData?.timeInZoneMesgs
        )
            ? chartGlobal.globalData.timeInZoneMesgs
            : null;

        if (!timeInZoneMesgs) {
            if (isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] No timeInZoneMesgs available for lap zone charts"
                );
            }
            return;
        }

        const lapZoneMsgs = timeInZoneMesgs.filter(
                (msg) =>
                    isTimeInZoneMessage(msg) && msg.referenceMesg === "lap"
            ),
            // Get theme configuration (used for logging and downstream hover styling)
            themeConfig = /** @type {{ name?: unknown }} */ (
                getThemeConfig() || {}
            );
        if (
            themeConfig &&
            typeof themeConfig === "object" &&
            themeConfig.name &&
            isDebugLoggingEnabled
        ) {
            console.log(
                "[renderLapZoneCharts] Using theme config:",
                themeConfig.name
            );
        }
        if (isDebugLoggingEnabled) {
            console.log(
                "[ChartJS] Found timeInZoneMesgs:",
                timeInZoneMesgs.length
            );
        }

        if (lapZoneMsgs.length === 0) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] No lap-specific zone data found");
            }
            return;
        }

        // Get visibility settings from options
        /** @type {LapZoneVisibility} */
        const visibility =
            options && options.visibilitySettings
                ? options.visibilitySettings
                : {
                      hrIndividualVisible: true,
                      hrStackedVisible: true,
                      powerIndividualVisible: true,
                      powerStackedVisible: true,
                  };

        if (isVerboseDebugLoggingEnabled) {
            console.log("[ChartJS] Found lap zone data:", lapZoneMsgs);
        }

        // Helper function to parse zone arrays safely
        /**
         * @param {unknown} val
         *
         * @returns {number[]}
         */
        function safeParseArray(val) {
            const parsedValue = Array.isArray(val)
                ? val
                : (() => {
                      if (!val || typeof val !== "string") {
                          return [];
                      }
                      try {
                          const clean = val.trim().replaceAll(/^"+|"+$/g, ""),
                              arr = JSON.parse(clean);
                          return Array.isArray(arr) ? arr : [];
                      } catch {
                          return [];
                      }
                  })();

            return parsedValue.map((value) => {
                const numericValue = Number(value);
                return Number.isFinite(numericValue) ? numericValue : 0;
            });
        }

        /**
         * @param {unknown} referenceIndex
         * @param {number} fallbackIndex
         *
         * @returns {string}
         */
        function getLapLabel(referenceIndex, fallbackIndex) {
            try {
                return `Lap ${referenceIndex || fallbackIndex + 1}`;
            } catch {
                return `Lap ${fallbackIndex + 1}`;
            }
        }

        // Process HR zone data for laps
        const hrZoneDataRaw = lapZoneMsgs
                .filter((msg) => msg.timeInHrZone)
                .map((msg, index) => {
                    const zones = safeParseArray(msg.timeInHrZone);
                    return {
                        lapLabel: getLapLabel(msg.referenceIndex, index),
                        zones: zones.slice(1).map((value, zoneIndex) => ({
                            color: getZoneColor("hr", zoneIndex),
                            label: `HR Zone ${zoneIndex + 1}`,
                            value: value || 0,
                            zoneIndex,
                        })),
                    };
                })
                .filter(
                    (/** @type {LapZoneEntry} */ lap) =>
                        Array.isArray(lap.zones) && lap.zones.length > 0
                ),
            // Find which HR zones have any meaningful data across all laps
            /** @type {Record<number, number>} */
            hrZoneTotals = {};
        for (const lap of hrZoneDataRaw) {
            for (const zone of lap.zones) {
                const idx = zone.zoneIndex;
                if (hrZoneTotals[idx] == null) {
                    hrZoneTotals[idx] = 0;
                }
                hrZoneTotals[idx] += zone.value || 0;
            }
        }
        const meaningfulHRZones = Object.keys(hrZoneTotals)
                .filter(
                    (zoneIndex) => (hrZoneTotals[Number(zoneIndex)] || 0) > 0
                )
                .map(Number),
            // Filter to only include meaningful zones
            hrZoneData = hrZoneDataRaw
                .map((/** @type {LapZoneEntry} */ lap) => ({
                    ...lap,
                    zones: lap.zones.filter((zone) =>
                        meaningfulHRZones.includes(zone.zoneIndex)
                    ),
                }))
                .filter(
                    (/** @type {LapZoneEntry} */ lap) => lap.zones.length > 0
                );

        if (isDebugLoggingEnabled) {
            console.log(
                "[ChartJS] HR Zone filtering - meaningfulHRZones:",
                meaningfulHRZones
            );
        }
        if (isVerboseDebugLoggingEnabled) {
            console.log("[ChartJS] HR Zone data after filtering:", hrZoneData);
        }

        // Process Power zone data for laps
        const pwrZoneDataRaw = lapZoneMsgs
                .filter((msg) => msg.timeInPowerZone)
                .map((msg, index) => {
                    const zones = safeParseArray(msg.timeInPowerZone);
                    return {
                        lapLabel: getLapLabel(msg.referenceIndex, index),
                        zones: zones.slice(1).map((value, zoneIndex) => ({
                            color: getZoneColor("power", zoneIndex),
                            label: `Power Zone ${zoneIndex + 1}`,
                            value: value || 0,
                            zoneIndex,
                        })),
                    };
                })
                .filter(
                    (/** @type {LapZoneEntry} */ lap) =>
                        Array.isArray(lap.zones) && lap.zones.length > 0
                ),
            // Find which Power zones have any meaningful data across all laps
            /** @type {Record<number, number>} */
            pwrZoneTotals = {};
        for (const lap of pwrZoneDataRaw) {
            for (const zone of lap.zones) {
                const idx = zone.zoneIndex;
                if (pwrZoneTotals[idx] == null) {
                    pwrZoneTotals[idx] = 0;
                }
                pwrZoneTotals[idx] += zone.value || 0;
            }
        }
        const meaningfulPowerZones = Object.keys(pwrZoneTotals)
                .filter(
                    (zoneIndex) => (pwrZoneTotals[Number(zoneIndex)] || 0) > 0
                )
                .map(Number),
            // Filter to only include meaningful zones
            pwrZoneData = pwrZoneDataRaw
                .map((/** @type {LapZoneEntry} */ lap) => ({
                    ...lap,
                    zones: lap.zones.filter((zone) =>
                        meaningfulPowerZones.includes(zone.zoneIndex)
                    ),
                }))
                .filter(
                    (/** @type {LapZoneEntry} */ lap) => lap.zones.length > 0
                );

        if (isDebugLoggingEnabled) {
            console.log(
                "[ChartJS] Power Zone filtering - meaningfulPowerZones:",
                meaningfulPowerZones
            );
        }
        if (isVerboseDebugLoggingEnabled) {
            console.log(
                "[ChartJS] Power Zone data after filtering:",
                pwrZoneData
            );
        }
        // Chart 1: Lap Heart Rate Zone Lap Bar Stacked
        if (visibility.hrStackedVisible && hrZoneData.length > 0) {
            const canvas1 = createChartCanvas("lap-hr-zones", 0);
            canvas1.id = "chartjs-canvas-lap-hr-zones";
            container.append(canvas1);

            const hrChart = renderLapZoneChart(canvas1, hrZoneData, {
                title: "HR Zone by Lap (Stacked)",
            });
            registerChartInstance(hrChart);
        }

        // Chart 2: Lap Power Zone Distribution (Stacked Bar)
        if (visibility.powerStackedVisible && pwrZoneData.length > 0) {
            const canvas2 = createChartCanvas("lap-power-zones", 0);
            canvas2.id = "chartjs-canvas-lap-power-zones";
            container.append(canvas2);
            const pwrChart = renderLapZoneChart(canvas2, pwrZoneData, {
                title: "Power Zone by Lap (Stacked)",
            });
            registerChartInstance(pwrChart);
        }

        // Chart 3: Single HR Zone Bar (entire ride data)
        if (visibility.hrIndividualVisible) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] Chart 3 - HR zone data check:", {
                    hrZoneDataLength: hrZoneData.length,
                    windowHeartRateZones: chartGlobal.heartRateZones,
                });
            }

            // Use session-level HR zone data if available, otherwise aggregate from laps
            const rawSessionHRZones = Array.isArray(chartGlobal.heartRateZones)
                ? chartGlobal.heartRateZones
                : [];
            let sessionHRZones = normalizeSessionZones(
                rawSessionHRZones
            );

            if (sessionHRZones.length > 0) {
                if (isVerboseDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Using session HR zone data:",
                        rawSessionHRZones
                    );
                }

                if (isVerboseDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] HR zone data after value mapping:",
                        sessionHRZones
                    );
                }
            } else if (hrZoneData.length > 0) {
                if (isDebugLoggingEnabled) {
                    console.log("[ChartJS] Aggregating HR zone data from laps");
                }
                // Aggregate zone data from all laps
                /** @type {Record<string, { label: string; value: number; color: string }>} */
                const aggregatedZones = {};
                for (const lap of hrZoneData) {
                    for (const zone of lap.zones) {
                        const zoneLabel = zone.label;
                        if (!aggregatedZones[zoneLabel]) {
                            aggregatedZones[zoneLabel] = {
                                color: zone.color,
                                label: zoneLabel,
                                value: 0,
                            };
                        }
                        aggregatedZones[zoneLabel].value += zone.value;
                    }
                }
                sessionHRZones = Object.values(aggregatedZones);
                if (isVerboseDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Aggregated HR zones:",
                        sessionHRZones
                    );
                }
            }

            if (sessionHRZones && sessionHRZones.length > 0) {
                if (isDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Rendering HR zone bar with data:",
                        sessionHRZones
                    );
                }
                const canvas3 = createChartCanvas("single-lap-hr", 0);
                canvas3.id = "chartjs-canvas-single-lap-hr";
                container.append(canvas3);

                const singleHRChart = renderSingleHRZoneBar(
                    canvas3,
                    sessionHRZones,
                    {
                        title: "HR Zone by Lap (Individual)",
                    }
                );
                registerChartInstance(singleHRChart);
            } else {
                if (isDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] No HR zone data available for Chart 3"
                    );
                }
            }
        }

        // Chart 4: Single Power Zone Bar (entire ride data)
        if (visibility.powerIndividualVisible) {
            if (isDebugLoggingEnabled) {
                console.log("[ChartJS] Chart 4 - Power zone data check:", {
                    pwrZoneDataLength: pwrZoneData.length,
                    windowPowerZones: chartGlobal.powerZones,
                });
            }

            // Use session-level Power zone data if available, otherwise aggregate from laps
            const rawSessionPowerZones = Array.isArray(chartGlobal.powerZones)
                ? chartGlobal.powerZones
                : [];
            let sessionPowerZones = normalizeSessionZones(
                rawSessionPowerZones
            );

            if (sessionPowerZones.length > 0) {
                if (isVerboseDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Using session Power zone data:",
                        rawSessionPowerZones
                    );
                }

                if (isVerboseDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Power zone data after value mapping:",
                        sessionPowerZones
                    );
                }
            } else if (pwrZoneData.length > 0) {
                if (isDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Aggregating Power zone data from laps"
                    );
                }
                // Aggregate zone data from all laps
                /** @type {Record<string, { label: string; value: number; color: string }>} */
                const aggregatedZones = {};
                for (const lap of pwrZoneData) {
                    for (const zone of lap.zones) {
                        const zoneLabel = zone.label;
                        if (!aggregatedZones[zoneLabel]) {
                            aggregatedZones[zoneLabel] = {
                                color: zone.color,
                                label: zoneLabel,
                                value: 0,
                            };
                        }
                        aggregatedZones[zoneLabel].value += zone.value;
                    }
                }
                sessionPowerZones = Object.values(aggregatedZones);
                if (isVerboseDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Aggregated Power zones:",
                        sessionPowerZones
                    );
                }
            }

            if (sessionPowerZones && sessionPowerZones.length > 0) {
                if (isDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] Rendering Power zone bar with data:",
                        sessionPowerZones
                    );
                }
                const canvas4 = createChartCanvas("single-lap-power", 0);
                canvas4.id = "chartjs-canvas-single-lap-power";
                container.append(canvas4);

                const singlePwrChart = renderSinglePowerZoneBar(
                    canvas4,
                    sessionPowerZones,
                    {
                        title: "Power Zone by Lap (Individual)",
                    }
                );
                registerChartInstance(singlePwrChart);
            } else {
                if (isDebugLoggingEnabled) {
                    console.log(
                        "[ChartJS] No Power zone data available for Chart 4"
                    );
                }
            }
        }

        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] Lap zone charts rendered successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering lap zone charts:", error);
        if (chartGlobal.showNotification) {
            chartGlobal.showNotification(
                "Failed to render lap zone charts",
                "error"
            );
        }
    }
}

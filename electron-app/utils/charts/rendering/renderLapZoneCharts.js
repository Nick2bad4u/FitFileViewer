import { getThemeConfig } from "../../theming/core/theme.js";
import { renderLapZoneChart } from "./renderLapZoneChart.js";
import { renderSingleHRZoneBar } from "../../data/zones/renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "../../data/zones/renderSinglePowerZoneBar.js";
import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
/**
 * @typedef {Object} LapZoneDatum
 * @property {string} label
 * @property {number} value
 * @property {string} color
 * @property {number} zoneIndex
 */
/**
 * @typedef {Object} LapZoneEntry
 * @property {string} lapLabel
 * @property {LapZoneDatum[]} zones
 */
/**
 * @typedef {Object} LapZoneVisibility
 * @property {boolean} hrStackedVisible
 * @property {boolean} hrIndividualVisible
 * @property {boolean} powerStackedVisible
 * @property {boolean} powerIndividualVisible
 */
/**
 * @typedef {Object} LapZoneChartsOptions
 * @property {LapZoneVisibility} [visibilitySettings]
 */

// Lap zone charts renderer - renders 4 different lap zone visualizations
/**
 * @param {HTMLElement} container
 * @param {LapZoneChartsOptions} [options]
 */
export function renderLapZoneCharts(container, options = {}) {
    try {
        console.log("[ChartJS] renderLapZoneCharts called");

        if (!window.globalData || !window.globalData.timeInZoneMesgs) {
            console.log("[ChartJS] No timeInZoneMesgs available for lap zone charts");
            return;
        }

        const {timeInZoneMesgs} = window.globalData,
         lapZoneMsgs = timeInZoneMesgs.filter((/** @type {any} */ msg) => msg.referenceMesg === "lap"),

        // Get theme configuration
         themeConfig = /** @type {any} */ (getThemeConfig() || {});
        if (themeConfig && typeof themeConfig === "object" && themeConfig.name) {
            console.log("[renderLapZoneCharts] Using theme config:", themeConfig.name);
        }
        console.log("[ChartJS] Found timeInZoneMesgs:", timeInZoneMesgs.length);

        if (lapZoneMsgs.length === 0) {
            console.log("[ChartJS] No lap-specific zone data found");
            return;
        }

        // Get visibility settings from options
        /** @type {LapZoneVisibility} */
        const visibility =
            options && options.visibilitySettings
                ? options.visibilitySettings
                : {
                      hrStackedVisible: true,
                      hrIndividualVisible: true,
                      powerStackedVisible: true,
                      powerIndividualVisible: true,
                  };

        console.log("[ChartJS] Found lap zone data:", lapZoneMsgs);

        // Helper function to parse zone arrays safely
        /**
         * @param {unknown} val
         * @returns {any[]}
         */
        function safeParseArray(val) {
            if (Array.isArray(val)) {return val;}
            if (!val || typeof val !== "string") {return [];}
            try {
                const clean = val.trim().replace(/^"+|"+$/g, ""),
                 arr = JSON.parse(clean);
                if (!Array.isArray(arr)) {throw new Error("Not an array");}
                return arr;
            } catch {
                return [];
            }
        }

        // Process HR zone data for laps
        const hrZoneDataRaw = lapZoneMsgs
            .filter((/** @type {any} */ msg) => msg.timeInHrZone)
            .map((/** @type {any} */ msg, /** @type {number} */ index) => {
                const zones = safeParseArray(msg.timeInHrZone);
                return {
                    lapLabel: `Lap ${msg.referenceIndex || index + 1}`,
                    zones: zones.slice(1).map((value, zoneIndex) => ({
                        label: `HR Zone ${zoneIndex + 1}`,
                        value: value || 0,
                        color: getZoneColor("hr", zoneIndex),
                        zoneIndex,
                    })),
                };
            })
            .filter((/** @type {LapZoneEntry} */ lap) => Array.isArray(lap.zones) && lap.zones.length > 0),

        // Find which HR zones have any meaningful data across all laps
        /** @type {Record<number, number>} */
         hrZoneTotals = {};
        hrZoneDataRaw.forEach((/** @type {LapZoneEntry} */ lap) => {
            lap.zones.forEach((/** @type {LapZoneDatum} */ zone) => {
                const idx = zone.zoneIndex;
                if (hrZoneTotals[idx] == null) {
                    hrZoneTotals[idx] = 0;
                }
                hrZoneTotals[idx] += zone.value || 0;
            });
        });
        const meaningfulHRZones = Object.keys(hrZoneTotals)
            .filter((zoneIndex) => (hrZoneTotals[Number(zoneIndex)] || 0) > 0)
            .map(Number),

        // Filter to only include meaningful zones
         hrZoneData = hrZoneDataRaw
            .map((/** @type {LapZoneEntry} */ lap) => ({
                ...lap,
                zones: lap.zones.filter((zone) => meaningfulHRZones.includes(zone.zoneIndex)),
            }))
            .filter((/** @type {LapZoneEntry} */ lap) => lap.zones.length > 0);

        console.log("[ChartJS] HR Zone filtering - meaningfulHRZones:", meaningfulHRZones);
        console.log("[ChartJS] HR Zone data after filtering:", hrZoneData);

        // Process Power zone data for laps
        const pwrZoneDataRaw = lapZoneMsgs
            .filter((/** @type {any} */ msg) => msg.timeInPowerZone)
            .map((/** @type {any} */ msg, /** @type {number} */ index) => {
                const zones = safeParseArray(msg.timeInPowerZone);
                return {
                    lapLabel: `Lap ${msg.referenceIndex || index + 1}`,
                    zones: zones.slice(1).map((value, zoneIndex) => ({
                        label: `Power Zone ${zoneIndex + 1}`,
                        value: value || 0,
                        color: getZoneColor("power", zoneIndex),
                        zoneIndex,
                    })),
                };
            })
            .filter((/** @type {LapZoneEntry} */ lap) => Array.isArray(lap.zones) && lap.zones.length > 0),

        // Find which Power zones have any meaningful data across all laps
        /** @type {Record<number, number>} */
         pwrZoneTotals = {};
        pwrZoneDataRaw.forEach((/** @type {LapZoneEntry} */ lap) => {
            lap.zones.forEach((/** @type {LapZoneDatum} */ zone) => {
                const idx = zone.zoneIndex;
                if (pwrZoneTotals[idx] == null) {
                    pwrZoneTotals[idx] = 0;
                }
                pwrZoneTotals[idx] += zone.value || 0;
            });
        });
        const meaningfulPowerZones = Object.keys(pwrZoneTotals)
            .filter((zoneIndex) => (pwrZoneTotals[Number(zoneIndex)] || 0) > 0)
            .map(Number),

        // Filter to only include meaningful zones
         pwrZoneData = pwrZoneDataRaw
            .map((/** @type {LapZoneEntry} */ lap) => ({
                ...lap,
                zones: lap.zones.filter((zone) => meaningfulPowerZones.includes(zone.zoneIndex)),
            }))
            .filter((/** @type {LapZoneEntry} */ lap) => lap.zones.length > 0);

        console.log("[ChartJS] Power Zone filtering - meaningfulPowerZones:", meaningfulPowerZones);
        console.log("[ChartJS] Power Zone data after filtering:", pwrZoneData); // Chart 1: Lap Heart Rate Zone Lap Bar Stacked
        if (visibility.hrStackedVisible && hrZoneData.length > 0) {
            const canvas1 = document.createElement("canvas");
            canvas1.id = "chartjs-canvas-lap-hr-zones";
            canvas1.style.marginBottom = "32px";
            canvas1.style.maxHeight = "400px";
            canvas1.style.background = themeConfig.colors.bgPrimary;
            canvas1.style.borderRadius = "12px";
            canvas1.style.boxShadow = themeConfig.colors.shadow;
            container.appendChild(canvas1);

            const hrChart = renderLapZoneChart(canvas1, hrZoneData, {
                title: "HR Zone by Lap (Stacked)",
            });
            if (hrChart) {
                if (!Array.isArray(window._chartjsInstances)) {window._chartjsInstances = [];}
                window._chartjsInstances.push(hrChart);
            }
        }

        // Chart 2: Lap Power Zone Distribution (Stacked Bar)
        if (visibility.powerStackedVisible && pwrZoneData.length > 0) {
            const canvas2 = document.createElement("canvas");
            canvas2.id = "chartjs-canvas-lap-power-zones";
            canvas2.style.marginBottom = "32px";
            canvas2.style.maxHeight = "400px";
            canvas2.style.background = themeConfig.colors.bgPrimary;
            canvas2.style.borderRadius = "12px";
            canvas2.style.boxShadow = themeConfig.colors.shadow;
            container.appendChild(canvas2);
            const pwrChart = renderLapZoneChart(canvas2, pwrZoneData, {
                title: "Power Zone by Lap (Stacked)",
            });
            if (pwrChart) {
                if (!Array.isArray(window._chartjsInstances)) {window._chartjsInstances = [];}
                window._chartjsInstances.push(pwrChart);
            }
        }

        // Chart 3: Single HR Zone Bar (entire ride data)
        if (visibility.hrIndividualVisible) {
            console.log("[ChartJS] Chart 3 - HR zone data check:", {
                windowHeartRateZones: window.heartRateZones,
                hrZoneDataLength: hrZoneData.length,
            });

            // Use session-level HR zone data if available, otherwise aggregate from laps
            let sessionHRZones = null;

            if (window.heartRateZones && window.heartRateZones.length > 0) {
                sessionHRZones = window.heartRateZones;
                console.log("[ChartJS] Using session HR zone data:", sessionHRZones);

                // Check if data has 'time' property and convert to 'value' if needed
                sessionHRZones = sessionHRZones.map((zone) => ({
                    ...zone,
                    value: zone.value || zone.time || 0,
                }));
                console.log("[ChartJS] HR zone data after value mapping:", sessionHRZones);
            } else if (hrZoneData.length > 0) {
                console.log("[ChartJS] Aggregating HR zone data from laps");
                // Aggregate zone data from all laps
                /** @type {Record<string, {label:string,value:number,color:string}>} */
                const aggregatedZones = {};
                hrZoneData.forEach((/** @type {LapZoneEntry} */ lap) => {
                    lap.zones.forEach((/** @type {LapZoneDatum} */ zone) => {
                        const zoneLabel = zone.label;
                        if (!aggregatedZones[zoneLabel]) {
                            aggregatedZones[zoneLabel] = {
                                label: zoneLabel,
                                value: 0,
                                color: zone.color,
                            };
                        }
                        aggregatedZones[zoneLabel].value += zone.value;
                    });
                });
                sessionHRZones = Object.values(aggregatedZones);
                console.log("[ChartJS] Aggregated HR zones:", sessionHRZones);
            }

            if (sessionHRZones && sessionHRZones.length > 0) {
                console.log("[ChartJS] Rendering HR zone bar with data:", sessionHRZones);
                const canvas3 = document.createElement("canvas");
                canvas3.id = "chartjs-canvas-single-lap-hr";
                canvas3.style.marginBottom = "32px";
                canvas3.style.maxHeight = "350px";
                canvas3.style.background = themeConfig.colors.bgPrimary;
                canvas3.style.borderRadius = "12px";
                canvas3.style.boxShadow = themeConfig.colors.shadow;
                container.appendChild(canvas3);

                const singleHRChart = renderSingleHRZoneBar(canvas3, sessionHRZones, {
                    title: "HR Zone by Lap (Individual)",
                });
                if (singleHRChart) {
                    if (!Array.isArray(window._chartjsInstances)) {window._chartjsInstances = [];}
                    window._chartjsInstances.push(singleHRChart);
                }
            } else {
                console.log("[ChartJS] No HR zone data available for Chart 3");
            }
        }

        // Chart 4: Single Power Zone Bar (entire ride data)
        if (visibility.powerIndividualVisible) {
            console.log("[ChartJS] Chart 4 - Power zone data check:", {
                windowPowerZones: window.powerZones,
                pwrZoneDataLength: pwrZoneData.length,
            });

            // Use session-level Power zone data if available, otherwise aggregate from laps
            let sessionPowerZones = null;

            if (window.powerZones && window.powerZones.length > 0) {
                sessionPowerZones = window.powerZones;
                console.log("[ChartJS] Using session Power zone data:", sessionPowerZones);

                // Check if data has 'time' property and convert to 'value' if needed
                sessionPowerZones = sessionPowerZones.map((zone) => ({
                    ...zone,
                    value: zone.value || zone.time || 0,
                }));
                console.log("[ChartJS] Power zone data after value mapping:", sessionPowerZones);
            } else if (pwrZoneData.length > 0) {
                console.log("[ChartJS] Aggregating Power zone data from laps");
                // Aggregate zone data from all laps
                /** @type {Record<string, {label:string,value:number,color:string}>} */
                const aggregatedZones = {};
                pwrZoneData.forEach((/** @type {LapZoneEntry} */ lap) => {
                    lap.zones.forEach((/** @type {LapZoneDatum} */ zone) => {
                        const zoneLabel = zone.label;
                        if (!aggregatedZones[zoneLabel]) {
                            aggregatedZones[zoneLabel] = {
                                label: zoneLabel,
                                value: 0,
                                color: zone.color,
                            };
                        }
                        aggregatedZones[zoneLabel].value += zone.value;
                    });
                });
                sessionPowerZones = Object.values(aggregatedZones);
                console.log("[ChartJS] Aggregated Power zones:", sessionPowerZones);
            }

            if (sessionPowerZones && sessionPowerZones.length > 0) {
                console.log("[ChartJS] Rendering Power zone bar with data:", sessionPowerZones);
                const canvas4 = document.createElement("canvas");
                canvas4.id = "chartjs-canvas-single-lap-power";
                canvas4.style.marginBottom = "32px";
                canvas4.style.maxHeight = "350px";
                canvas4.style.background = themeConfig.colors.bgPrimary;
                canvas4.style.borderRadius = "12px";
                canvas4.style.boxShadow = themeConfig.colors.shadow;
                container.appendChild(canvas4);

                const singlePwrChart = renderSinglePowerZoneBar(
                    canvas4,
                    /** @type {{label:string,value:number,color:string}[]} */ (sessionPowerZones),
                    {
                        title: "Power Zone by Lap (Individual)",
                    }
                );
                if (singlePwrChart) {
                    if (!Array.isArray(window._chartjsInstances)) {window._chartjsInstances = [];}
                    window._chartjsInstances.push(singlePwrChart);
                }
            } else {
                console.log("[ChartJS] No Power zone data available for Chart 4");
            }
        }

        console.log("[ChartJS] Lap zone charts rendered successfully");
    } catch (error) {
        console.error("[ChartJS] Error rendering lap zone charts:", error);
        if (window.showNotification) {
            window.showNotification("Failed to render lap zone charts", "error");
        }
    }
}

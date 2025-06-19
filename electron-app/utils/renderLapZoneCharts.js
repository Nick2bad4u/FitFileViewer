import { getThemeConfig } from "./theme.js";
import { renderLapZoneChart } from "./renderLapZoneChart.js";
import { renderSingleHRZoneBar } from "./renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "./renderSinglePowerZoneBar.js";
import { getZoneColor } from "./chartZoneColorUtils.js";

// Lap zone charts renderer - renders 4 different lap zone visualizations
export function renderLapZoneCharts(container, options = {}) {
    try {
        console.log("[ChartJS] renderLapZoneCharts called");

        if (!window.globalData || !window.globalData.timeInZoneMesgs) {
            console.log("[ChartJS] No timeInZoneMesgs available for lap zone charts");
            return;
        }

        const timeInZoneMesgs = window.globalData.timeInZoneMesgs;
        const lapZoneMsgs = timeInZoneMesgs.filter((msg) => msg.referenceMesg === "lap");

        // Get theme configuration
        const themeConfig = getThemeConfig();
        console.log("[renderLapZoneCharts] Using theme config:", themeConfig.name);
        console.log("[ChartJS] Found timeInZoneMesgs:", timeInZoneMesgs.length);

        if (lapZoneMsgs.length === 0) {
            console.log("[ChartJS] No lap-specific zone data found");
            return;
        }

        // Get visibility settings from options
        const visibility = options.visibilitySettings || {
            hrStackedVisible: true,
            hrIndividualVisible: true,
            powerStackedVisible: true,
            powerIndividualVisible: true,
        };

        console.log("[ChartJS] Found lap zone data:", lapZoneMsgs);

        console.log("[ChartJS] Found lap zone data:", lapZoneMsgs);

        // Helper function to parse zone arrays safely
        function safeParseArray(val) {
            if (Array.isArray(val)) return val;
            if (!val || typeof val !== "string") return [];
            try {
                const clean = val.trim().replace(/^"+|"+$/g, "");
                const arr = JSON.parse(clean);
                if (!Array.isArray(arr)) throw new Error("Not an array");
                return arr;
            } catch {
                return [];
            }
        }

        // Process HR zone data for laps
        const hrZoneDataRaw = lapZoneMsgs
            .filter((msg) => msg.timeInHrZone)
            .map((msg, index) => {
                const zones = safeParseArray(msg.timeInHrZone);
                return {
                    lapLabel: `Lap ${msg.referenceIndex || index + 1}`,
                    zones: zones.slice(1).map((value, zoneIndex) => ({
                        label: `HR Zone ${zoneIndex + 1}`,
                        value: value || 0,
                        color: getZoneColor("hr", zoneIndex),
                        zoneIndex: zoneIndex,
                    })),
                };
            })
            .filter((lap) => lap.zones.length > 0);

        // Find which HR zones have any meaningful data across all laps
        const hrZoneTotals = {};
        hrZoneDataRaw.forEach((lap) => {
            lap.zones.forEach((zone) => {
                if (!hrZoneTotals[zone.zoneIndex]) {
                    hrZoneTotals[zone.zoneIndex] = 0;
                }
                hrZoneTotals[zone.zoneIndex] += zone.value;
            });
        });
        const meaningfulHRZones = Object.keys(hrZoneTotals)
            .filter((zoneIndex) => hrZoneTotals[zoneIndex] > 0)
            .map(Number);

        // Filter to only include meaningful zones
        const hrZoneData = hrZoneDataRaw
            .map((lap) => ({
                ...lap,
                zones: lap.zones.filter((zone) => meaningfulHRZones.includes(zone.zoneIndex)),
            }))
            .filter((lap) => lap.zones.length > 0);

        console.log("[ChartJS] HR Zone filtering - meaningfulHRZones:", meaningfulHRZones);
        console.log("[ChartJS] HR Zone data after filtering:", hrZoneData);

        // Process Power zone data for laps
        const pwrZoneDataRaw = lapZoneMsgs
            .filter((msg) => msg.timeInPowerZone)
            .map((msg, index) => {
                const zones = safeParseArray(msg.timeInPowerZone);
                return {
                    lapLabel: `Lap ${msg.referenceIndex || index + 1}`,
                    zones: zones.slice(1).map((value, zoneIndex) => ({
                        label: `Power Zone ${zoneIndex + 1}`,
                        value: value || 0,
                        color: getZoneColor("power", zoneIndex),
                        zoneIndex: zoneIndex,
                    })),
                };
            })
            .filter((lap) => lap.zones.length > 0);

        // Find which Power zones have any meaningful data across all laps
        const pwrZoneTotals = {};
        pwrZoneDataRaw.forEach((lap) => {
            lap.zones.forEach((zone) => {
                if (!pwrZoneTotals[zone.zoneIndex]) {
                    pwrZoneTotals[zone.zoneIndex] = 0;
                }
                pwrZoneTotals[zone.zoneIndex] += zone.value;
            });
        });
        const meaningfulPowerZones = Object.keys(pwrZoneTotals)
            .filter((zoneIndex) => pwrZoneTotals[zoneIndex] > 0)
            .map(Number);

        // Filter to only include meaningful zones
        const pwrZoneData = pwrZoneDataRaw
            .map((lap) => ({
                ...lap,
                zones: lap.zones.filter((zone) => meaningfulPowerZones.includes(zone.zoneIndex)),
            }))
            .filter((lap) => lap.zones.length > 0);

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
                theme: themeConfig.name,
            });
            if (hrChart) window._chartjsInstances.push(hrChart);
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
                theme: themeConfig.name,
            });
            if (pwrChart) window._chartjsInstances.push(pwrChart);
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
                const aggregatedZones = {};
                hrZoneData.forEach((lap) => {
                    lap.zones.forEach((zone) => {
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
                    theme: themeConfig.name,
                });
                if (singleHRChart) window._chartjsInstances.push(singleHRChart);
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
                const aggregatedZones = {};
                pwrZoneData.forEach((lap) => {
                    lap.zones.forEach((zone) => {
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

                const singlePwrChart = renderSinglePowerZoneBar(canvas4, sessionPowerZones, {
                    title: "Power Zone by Lap (Individual)",
                    theme: themeConfig.name,
                });
                if (singlePwrChart) window._chartjsInstances.push(singlePwrChart);
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

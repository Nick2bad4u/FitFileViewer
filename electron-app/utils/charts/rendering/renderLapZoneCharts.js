import { getZoneColor } from "../../data/zones/chartZoneColorUtils.js";
import { renderSingleHRZoneBar } from "../../data/zones/renderSingleHRZoneBar.js";
import { renderSinglePowerZoneBar } from "../../data/zones/renderSinglePowerZoneBar.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { renderLapZoneChart } from "./renderLapZoneChart.js";
const DEFAULT_VISIBILITY = {
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
export function renderLapZoneCharts(container, options = {}) {
    const runtimeGlobal = getRuntimeGlobal(),
        debug = getDebugState(runtimeGlobal);
    try {
        if (debug.isDebugLoggingEnabled) {
            console.log("[ChartJS] renderLapZoneCharts called");
        }
        const timeInZoneMesgs = getTimeInZoneMessages(runtimeGlobal);
        if (!timeInZoneMesgs) {
            if (debug.isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] No timeInZoneMesgs available for lap zone charts"
                );
            }
            return;
        }
        const lapZoneMsgs = timeInZoneMesgs.filter(
            (msg) => isTimeInZoneMessage(msg) && msg.referenceMesg === "lap"
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
            runtimeGlobal,
            debug
        );
        if (debug.isDebugLoggingEnabled) {
            console.log("[ChartJS] Lap zone charts rendered successfully");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering lap zone charts:", error);
        runtimeGlobal.showNotification?.(
            "Failed to render lap zone charts",
            "error"
        );
    }
}
function aggregateLapZones(lapZoneData) {
    const aggregatedZones = new Map();
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
function buildLapZoneData(lapZoneMsgs, zoneKind) {
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
function createLapZoneEntry(message, fallbackIndex, zoneKind, zones) {
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
function getDebugState(runtimeGlobal) {
    const isTestEnvironment =
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "test",
        isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "development",
        isDebugLoggingEnabled =
            isTestEnvironment ||
            (isDevEnvironment && Boolean(runtimeGlobal.__FFV_debugCharts)),
        isVerboseDebugLoggingEnabled =
            isTestEnvironment ||
            (isDebugLoggingEnabled &&
                Boolean(runtimeGlobal.__FFV_debugChartsVerbose));
    return {
        isDebugLoggingEnabled,
        isVerboseDebugLoggingEnabled,
    };
}
function getLapLabel(referenceIndex, fallbackIndex) {
    return `Lap ${referenceIndex || fallbackIndex + 1}`;
}
function getMeaningfulZoneIndexes(lapZoneData) {
    const zoneTotals = new Map();
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
function getRuntimeGlobal() {
    return globalThis;
}
function getTimeInZoneMessages(runtimeGlobal) {
    const timeInZoneMesgs = runtimeGlobal.globalData?.timeInZoneMesgs;
    return Array.isArray(timeInZoneMesgs) ? timeInZoneMesgs : null;
}
function isTimeInZoneMessage(value) {
    return isObjectRecord(value);
}
function logThemeConfig(isDebugLoggingEnabled) {
    const themeConfig = getThemeConfig(),
        themeName = getThemeName(themeConfig);
    if (themeName && isDebugLoggingEnabled) {
        console.log("[renderLapZoneCharts] Using theme config:", themeName);
    }
}
function getThemeName(themeConfig) {
    if (isObjectRecord(themeConfig) && "name" in themeConfig) {
        return themeConfig["name"];
    }
    return undefined;
}
function logZoneData(zoneLabel, meaningfulZoneIndexes, lapZoneData, debug) {
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
function normalizeSessionZones(rawZones) {
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
function registerChartInstance(chart) {
    if (!chart) {
        return;
    }
    const runtimeGlobal = getRuntimeGlobal();
    if (!Array.isArray(runtimeGlobal._chartjsInstances)) {
        runtimeGlobal._chartjsInstances = [];
    }
    runtimeGlobal._chartjsInstances.push(chart);
}
function renderIndividualLapZoneCharts(
    container,
    visibility,
    hrZoneData,
    pwrZoneData,
    runtimeGlobal,
    debug
) {
    if (visibility.hrIndividualVisible) {
        renderIndividualZoneChart(
            container,
            "hr",
            hrZoneData,
            runtimeGlobal.heartRateZones,
            debug
        );
    }
    if (visibility.powerIndividualVisible) {
        renderIndividualZoneChart(
            container,
            "power",
            pwrZoneData,
            runtimeGlobal.powerZones,
            debug
        );
    }
}
function renderIndividualZoneChart(
    container,
    zoneKind,
    lapZoneData,
    rawSessionZones,
    debug
) {
    const zoneLabel = zoneKind === "hr" ? "HR" : "Power",
        chartNumber = zoneKind === "hr" ? 3 : 4;
    if (debug.isDebugLoggingEnabled) {
        console.log(
            `[ChartJS] Chart ${chartNumber} - ${zoneLabel} zone data check:`,
            {
                [`${zoneKind === "hr" ? "hr" : "pwr"}ZoneDataLength`]:
                    lapZoneData.length,
                [zoneKind === "hr"
                    ? "windowHeartRateZones"
                    : "windowPowerZones"]: rawSessionZones,
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
    container,
    visibility,
    hrZoneData,
    pwrZoneData
) {
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
function safeParseArray(value) {
    const parsedValue = Array.isArray(value)
        ? value
        : parseSerializedArray(value);
    return parsedValue.map((entry) => {
        const numericValue = Number(entry);
        return Number.isFinite(numericValue) ? numericValue : 0;
    });
}
function parseSerializedArray(value) {
    if (!value || typeof value !== "string") {
        return [];
    }
    try {
        const clean = value.trim().replace(/^"+|"+$/g, ""),
            parsedValue = JSON.parse(clean);
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
}

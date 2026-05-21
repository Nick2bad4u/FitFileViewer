import { updateHRZoneControlsVisibility } from "../../ui/controls/createHRZoneControls.js";
import { updatePowerZoneControlsVisibility } from "../../ui/controls/createPowerZoneControls.js";
import {
    applyZoneColors,
    type ZoneData,
} from "../zones/chartZoneColorUtils.js";

interface ZoneEntry extends ZoneData {
    color?: string;
    label: string;
    time: number;
    zone: number;
}

interface TimeInZoneMesg {
    readonly referenceMesg?: string;
    readonly timeInHrZone?: readonly NullishNumber[];
    readonly timeInPowerZone?: readonly NullishNumber[];
}

interface SessionMesg {
    readonly time_in_hr_zone?: readonly NullishNumber[];
    readonly time_in_power_zone?: readonly NullishNumber[];
}

interface LapMesg {
    readonly time_in_hr_zone?: readonly NullishNumber[];
    readonly time_in_power_zone?: readonly NullishNumber[];
}

interface GlobalData {
    readonly lapMesgs?: readonly LapMesg[];
    readonly sessionMesgs?: readonly SessionMesg[];
    readonly timeInZoneMesgs?: readonly TimeInZoneMesg[];
}

interface ZoneGlobals {
    readonly __FFV_debugCharts?: unknown;
    readonly __FFV_debugChartsVerbose?: unknown;
    heartRateZones?: ZoneEntry[];
    powerZones?: ZoneEntry[];
}

interface SetupZoneDataResult {
    readonly hasHRZoneData: boolean;
    readonly hasPowerZoneData: boolean;
    readonly heartRateZones: ZoneEntry[];
    readonly powerZones: ZoneEntry[];
}

type NullishNumber = null | number | undefined;
type ZoneType = "hr" | "power";

const zoneGlobal = globalThis as typeof globalThis & ZoneGlobals;

function isDebugLoggingEnabled(): boolean {
    return (
        typeof process !== "undefined" &&
        process.env?.["NODE_ENV"] === "development" &&
        Boolean(zoneGlobal.__FFV_debugCharts)
    );
}

function shouldLogVerboseZoneData(): boolean {
    return (
        isDebugLoggingEnabled() && Boolean(zoneGlobal.__FFV_debugChartsVerbose)
    );
}

function buildZones(zoneTimes: readonly NullishNumber[]): ZoneEntry[] {
    return zoneTimes
        .slice(1)
        .map((time, index) => ({
            label: `Zone ${index + 1}`,
            time: Number(time) || 0,
            zone: index + 1,
        }))
        .filter((zone) => zone.time > 0);
}

function colorizeZones(zones: ZoneEntry[], zoneType: ZoneType): ZoneEntry[] {
    return applyZoneColors(zones, zoneType).map((zone, index) => ({
        label: zone.label ?? `Zone ${index + 1}`,
        time: zone.time ?? 0,
        zone: zone.zone ?? index + 1,
        ...(zone.color ? { color: zone.color } : {}),
    }));
}

function sumLapZoneTimes(
    laps: readonly LapMesg[],
    fieldName: "time_in_hr_zone" | "time_in_power_zone"
): number[] {
    const zoneTimes: number[] = [];

    for (const lap of laps) {
        const lapZoneTimes = lap[fieldName];
        if (!Array.isArray(lapZoneTimes)) {
            continue;
        }

        for (const [index, time] of lapZoneTimes.entries()) {
            zoneTimes[index] = (zoneTimes[index] ?? 0) + (time ?? 0);
        }
    }

    return zoneTimes;
}

function hasPositiveZoneTimes(zoneTimes: readonly number[]): boolean {
    return zoneTimes.length > 1 && zoneTimes.slice(1).some((time) => time > 0);
}

function getExistingZones(zoneType: ZoneType): ZoneEntry[] {
    const zones =
        zoneType === "hr" ? zoneGlobal.heartRateZones : zoneGlobal.powerZones;
    return Array.isArray(zones) ? zones : [];
}

function setGlobalZones(zoneType: ZoneType, zones: ZoneEntry[]): void {
    if (zoneType === "hr") {
        zoneGlobal.heartRateZones = zones;
        return;
    }

    zoneGlobal.powerZones = zones;
}

function logZoneData(message: string, data?: unknown): void {
    if (isDebugLoggingEnabled()) {
        console.log(message, data);
    }
}

/**
 * Extracts zone data from FIT globals and updates window.heartRateZones /
 * window.powerZones for existing chart modules.
 */
export function setupZoneData(globalData: unknown): SetupZoneDataResult {
    const zoneData =
        globalData !== null && typeof globalData === "object"
            ? (globalData as GlobalData)
            : null;
    let heartRateZones = getExistingZones("hr");
    let powerZones = getExistingZones("power");
    let hasHRZoneData = heartRateZones.length > 0;
    let hasPowerZoneData = powerZones.length > 0;

    try {
        if (!zoneData) {
            return {
                hasHRZoneData,
                hasPowerZoneData,
                heartRateZones,
                powerZones,
            };
        }

        logZoneData(
            "[ChartJS] Setting up zone data from globalData:",
            zoneData
        );

        if (Array.isArray(zoneData.timeInZoneMesgs)) {
            logZoneData(
                "[ChartJS] Found timeInZoneMesgs:",
                zoneData.timeInZoneMesgs.length
            );

            if (isDebugLoggingEnabled()) {
                for (const [
                    index,
                    zoneMessage,
                ] of zoneData.timeInZoneMesgs.entries()) {
                    console.log(
                        `[ChartJS] TimeInZone ${index} fields:`,
                        Object.keys(zoneMessage || {})
                    );

                    if (shouldLogVerboseZoneData()) {
                        console.log(
                            `[ChartJS] TimeInZone ${index} data:`,
                            zoneMessage
                        );
                    }
                }
            }

            const sessionZoneData = zoneData.timeInZoneMesgs.find(
                (zoneMessage) => zoneMessage.referenceMesg === "session"
            );

            if (sessionZoneData?.timeInHrZone) {
                const hrZones = buildZones(sessionZoneData.timeInHrZone);
                if (hrZones.length > 0) {
                    heartRateZones = colorizeZones(hrZones, "hr");
                    setGlobalZones("hr", heartRateZones);
                    hasHRZoneData = true;
                    logZoneData(
                        "[ChartJS] Heart rate zones data set:",
                        heartRateZones
                    );
                }
            }

            if (sessionZoneData?.timeInPowerZone) {
                const coloredPowerZones = colorizeZones(
                    buildZones(sessionZoneData.timeInPowerZone),
                    "power"
                );
                if (coloredPowerZones.length > 0) {
                    powerZones = coloredPowerZones;
                    setGlobalZones("power", powerZones);
                    hasPowerZoneData = true;
                    logZoneData("[ChartJS] Power zones data set:", powerZones);
                }
            }
        }

        if (
            heartRateZones.length === 0 &&
            Array.isArray(zoneData.sessionMesgs)
        ) {
            const sessionWithHrZones = zoneData.sessionMesgs.find((session) =>
                Array.isArray(session.time_in_hr_zone)
            );
            if (sessionWithHrZones?.time_in_hr_zone) {
                const coloredHrZones = colorizeZones(
                    buildZones(sessionWithHrZones.time_in_hr_zone),
                    "hr"
                );
                if (coloredHrZones.length > 0) {
                    heartRateZones = coloredHrZones;
                    setGlobalZones("hr", heartRateZones);
                    hasHRZoneData = true;
                    logZoneData(
                        "[ChartJS] HR zones from sessionMesgs:",
                        heartRateZones
                    );
                }
            }
        }

        if (powerZones.length === 0 && Array.isArray(zoneData.sessionMesgs)) {
            const sessionWithPowerZones = zoneData.sessionMesgs.find(
                (session) => Array.isArray(session.time_in_power_zone)
            );
            if (sessionWithPowerZones?.time_in_power_zone) {
                const coloredPowerZones = colorizeZones(
                    buildZones(sessionWithPowerZones.time_in_power_zone),
                    "power"
                );
                if (coloredPowerZones.length > 0) {
                    powerZones = coloredPowerZones;
                    setGlobalZones("power", powerZones);
                    hasPowerZoneData = true;
                    logZoneData(
                        "[ChartJS] Power zones from sessionMesgs:",
                        powerZones
                    );
                }
            }
        }

        if (
            heartRateZones.length === 0 &&
            powerZones.length === 0 &&
            Array.isArray(zoneData.lapMesgs) &&
            zoneData.lapMesgs.length > 0
        ) {
            logZoneData("[ChartJS] Aggregating zone data from lapMesgs");

            const hrZoneTimes = sumLapZoneTimes(
                zoneData.lapMesgs,
                "time_in_hr_zone"
            );
            if (hasPositiveZoneTimes(hrZoneTimes)) {
                const coloredHrZones = colorizeZones(
                    buildZones(hrZoneTimes),
                    "hr"
                );
                if (coloredHrZones.length > 0) {
                    heartRateZones = coloredHrZones;
                    setGlobalZones("hr", heartRateZones);
                    hasHRZoneData = true;
                    logZoneData(
                        "[ChartJS] HR zones from laps:",
                        heartRateZones
                    );
                }
            }

            const powerZoneTimes = sumLapZoneTimes(
                zoneData.lapMesgs,
                "time_in_power_zone"
            );
            if (hasPositiveZoneTimes(powerZoneTimes)) {
                const coloredPowerZones = colorizeZones(
                    buildZones(powerZoneTimes),
                    "power"
                );
                if (coloredPowerZones.length > 0) {
                    powerZones = coloredPowerZones;
                    setGlobalZones("power", powerZones);
                    hasPowerZoneData = true;
                    logZoneData("[ChartJS] Power zones from laps:", powerZones);
                }
            }
        }

        updatePowerZoneControlsVisibility(hasPowerZoneData);
        updateHRZoneControlsVisibility(hasHRZoneData);
    } catch (error) {
        console.error(
            "[ChartJS] Error setting up zone data:",
            error instanceof Error ? error.message : error
        );
    }

    return {
        hasHRZoneData,
        hasPowerZoneData,
        heartRateZones,
        powerZones,
    };
}

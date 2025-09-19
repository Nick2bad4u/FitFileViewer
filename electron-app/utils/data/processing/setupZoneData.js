import { updateHRZoneControlsVisibility } from "../../ui/controls/createHRZoneControls.js";
import { updatePowerZoneControlsVisibility } from "../../ui/controls/createPowerZoneControls.js";
import { applyZoneColors } from "../zones/chartZoneColorUtils.js";

/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 * @typedef {{zone?:number; time?:number; label?:string; color?:string}} ZoneEntry
 * @typedef {{referenceMesg?:string; timeInHrZone?: (number|null)[]; timeInPowerZone?: (number|null)[]}} TimeInZoneMesg
 * @typedef {{time_in_hr_zone?: (number|null)[]; time_in_power_zone?: (number|null)[]}} SessionMesg
 * @typedef {{time_in_hr_zone?: (number|null)[]; time_in_power_zone?: (number|null)[]}} LapMesg
 * @typedef {Object} GlobalData
 * @property {TimeInZoneMesg[]=} timeInZoneMesgs
 * @property {SessionMesg[]=} sessionMesgs
 * @property {LapMesg[]=} lapMesgs
 */

/**
 * Extracts and sets up heart rate and power zone data from FIT file
 * (Populates window.heartRateZones / window.powerZones side-effectfully)
 * @param {GlobalData | null | undefined} globalData
 * @returns {{ heartRateZones: ZoneEntry[]; powerZones: ZoneEntry[]; hasHRZoneData: boolean; hasPowerZoneData: boolean }}
 */
export function setupZoneData(globalData) {
    /** @type {ZoneEntry[]} */ let heartRateZones = Array.isArray(globalThis.heartRateZones)
            ? /** @type {ZoneEntry[]} */ (globalThis.heartRateZones)
            : [],
        /** @type {ZoneEntry[]} */ hasHRZoneData = heartRateZones.length > 0,
        powerZones = Array.isArray(globalThis.powerZones) ? /** @type {ZoneEntry[]} */ (globalThis.powerZones) : [],
        hasPowerZoneData = powerZones.length > 0;

    try {
        if (!globalData) {
            return { hasHRZoneData, hasPowerZoneData, heartRateZones, powerZones };
        }

        console.log("[ChartJS] Setting up zone data from globalData:", globalData);

        /** Helper to build zone entries from a numeric array (skipping index 0) */
        /**
         * @param {(number|null|undefined)[]} arr
         * @returns {ZoneEntry[]}
         */
        const buildZones = (arr) =>
            arr
                .slice(1)
                .map((time, index) => ({ label: `Zone ${index + 1}`, time: Number(time) || 0, zone: index + 1 }))
                .filter((z) => (z.time || 0) > 0);

        // Primary source: timeInZoneMesgs (session-level aggregate)
        if (Array.isArray(globalData.timeInZoneMesgs)) {
            console.log("[ChartJS] Found timeInZoneMesgs:", globalData.timeInZoneMesgs.length);
            for (const [index, zoneMsg] of globalData.timeInZoneMesgs.entries()) {
                console.log(`[ChartJS] TimeInZone ${index} fields:`, Object.keys(zoneMsg || {}));
                console.log(`[ChartJS] TimeInZone ${index} data:`, zoneMsg);
            }
            const sessionZoneData = globalData.timeInZoneMesgs.find((z) => z && z.referenceMesg === "session");
            if (sessionZoneData) {
                if (Array.isArray(sessionZoneData.timeInHrZone)) {
                    const hrZones = buildZones(sessionZoneData.timeInHrZone);
                    if (hrZones.length > 0) {
                        heartRateZones = /** @type {ZoneEntry[]} */ (applyZoneColors(hrZones, "hr"));
                        globalThis.heartRateZones = heartRateZones;
                        hasHRZoneData = true;
                        console.log("[ChartJS] Heart rate zones data set:", heartRateZones);
                    }
                }
                if (Array.isArray(sessionZoneData.timeInPowerZone)) {
                    const powZones = buildZones(sessionZoneData.timeInPowerZone);
                    if (powZones.length > 0) {
                        powerZones = /** @type {ZoneEntry[]} */ (applyZoneColors(powZones, "power"));
                        globalThis.powerZones = powerZones;
                        hasPowerZoneData = true;
                        console.log("[ChartJS] Power zones data set:", powerZones);
                    }
                }
            }
        }

        // Fallback: legacy sessionMesgs (snake_case arrays)
        if (heartRateZones.length === 0 && Array.isArray(globalData.sessionMesgs)) {
            const sessionWithHrZones = globalData.sessionMesgs.find((s) => Array.isArray(s?.time_in_hr_zone));
            if (sessionWithHrZones?.time_in_hr_zone) {
                const hrZones = buildZones(sessionWithHrZones.time_in_hr_zone);
                if (hrZones.length > 0) {
                    heartRateZones = /** @type {ZoneEntry[]} */ (applyZoneColors(hrZones, "hr"));
                    globalThis.heartRateZones = heartRateZones;
                    hasHRZoneData = true;
                    console.log("[ChartJS] HR zones from sessionMesgs:", heartRateZones);
                }
            }
        }
        if (powerZones.length === 0 && Array.isArray(globalData.sessionMesgs)) {
            const sessionWithPowerZones = globalData.sessionMesgs.find((s) => Array.isArray(s?.time_in_power_zone));
            if (sessionWithPowerZones?.time_in_power_zone) {
                const powZones = buildZones(sessionWithPowerZones.time_in_power_zone);
                if (powZones.length > 0) {
                    powerZones = /** @type {ZoneEntry[]} */ (applyZoneColors(powZones, "power"));
                    globalThis.powerZones = powerZones;
                    hasPowerZoneData = true;
                    console.log("[ChartJS] Power zones from sessionMesgs:", powerZones);
                }
            }
        }

        // Fallback: aggregate lapMesgs if neither set
        if (
            heartRateZones.length === 0 &&
            powerZones.length === 0 &&
            Array.isArray(globalData.lapMesgs) &&
            globalData.lapMesgs.length > 0
        ) {
            console.log("[ChartJS] Aggregating zone data from lapMesgs");
            /** @type {number[]} */ const hrZoneTimes = [],
                /** @type {number[]} */ powerZoneTimes = [];
            for (const lap of globalData.lapMesgs) {
                if (Array.isArray(lap?.time_in_hr_zone)) {
                    for (const [i, t] of lap.time_in_hr_zone.entries()) {
                        hrZoneTimes[i] = (hrZoneTimes[i] || 0) + (t || 0);
                    }
                }
                if (Array.isArray(lap?.time_in_power_zone)) {
                    for (const [i, t] of lap.time_in_power_zone.entries()) {
                        powerZoneTimes[i] = (powerZoneTimes[i] || 0) + (t || 0);
                    }
                }
            }
            if (hrZoneTimes.length > 1 && hrZoneTimes.slice(1).some((t) => t > 0)) {
                const hrZones = buildZones(hrZoneTimes);
                if (hrZones.length > 0) {
                    heartRateZones = /** @type {ZoneEntry[]} */ (applyZoneColors(hrZones, "hr"));
                    globalThis.heartRateZones = heartRateZones;
                    hasHRZoneData = true;
                    console.log("[ChartJS] HR zones from laps:", heartRateZones);
                }
            }
            if (powerZoneTimes.length > 1 && powerZoneTimes.slice(1).some((t) => t > 0)) {
                const powZones = buildZones(powerZoneTimes);
                if (powZones.length > 0) {
                    powerZones = /** @type {ZoneEntry[]} */ (applyZoneColors(powZones, "power"));
                    globalThis.powerZones = powerZones;
                    hasPowerZoneData = true;
                    console.log("[ChartJS] Power zones from laps:", powerZones);
                }
            }
        }

        // Update visibility of zone controls
        updatePowerZoneControlsVisibility(hasPowerZoneData);
        updateHRZoneControlsVisibility(hasHRZoneData);
    } catch (/** @type {any} */ error) {
        console.error("[ChartJS] Error setting up zone data:", error?.message || error);
    }

    return { hasHRZoneData, hasPowerZoneData, heartRateZones: heartRateZones || [], powerZones: powerZones || [] };
}

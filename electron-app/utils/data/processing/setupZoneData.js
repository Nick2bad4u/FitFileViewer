import { applyZoneColors } from "../zones/chartZoneColorUtils.js";
import { updatePowerZoneControlsVisibility } from "../../ui/controls/createPowerZoneControls.js";
import { updateHRZoneControlsVisibility } from "../../ui/controls/createHRZoneControls.js";

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
    /** @type {ZoneEntry[]} */ let heartRateZones = Array.isArray(window.heartRateZones)
        ? /** @type {ZoneEntry[]} */ (window.heartRateZones)
        : [],
    /** @type {ZoneEntry[]} */  powerZones = Array.isArray(window.powerZones)
        ? /** @type {ZoneEntry[]} */ (window.powerZones)
        : [],
     hasPowerZoneData = powerZones.length > 0,
     hasHRZoneData = heartRateZones.length > 0;

    try {
        if (!globalData) {
            return { heartRateZones, powerZones, hasHRZoneData, hasPowerZoneData };
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
                .map((time, index) => ({ zone: index + 1, time: Number(time) || 0, label: `Zone ${index + 1}` }))
                .filter((z) => (z.time || 0) > 0);

        // Primary source: timeInZoneMesgs (session-level aggregate)
        if (Array.isArray(globalData.timeInZoneMesgs)) {
            console.log("[ChartJS] Found timeInZoneMesgs:", globalData.timeInZoneMesgs.length);
            globalData.timeInZoneMesgs.forEach((zoneMsg, index) => {
                console.log(`[ChartJS] TimeInZone ${index} fields:`, Object.keys(zoneMsg || {}));
                console.log(`[ChartJS] TimeInZone ${index} data:`, zoneMsg);
            });
            const sessionZoneData = globalData.timeInZoneMesgs.find((z) => z && z.referenceMesg === "session");
            if (sessionZoneData) {
                if (Array.isArray(sessionZoneData.timeInHrZone)) {
                    const hrZones = buildZones(sessionZoneData.timeInHrZone);
                    if (hrZones.length) {
                        heartRateZones = /** @type {ZoneEntry[]} */ (applyZoneColors(hrZones, "hr"));
                        window.heartRateZones = heartRateZones;
                        hasHRZoneData = true;
                        console.log("[ChartJS] Heart rate zones data set:", heartRateZones);
                    }
                }
                if (Array.isArray(sessionZoneData.timeInPowerZone)) {
                    const powZones = buildZones(sessionZoneData.timeInPowerZone);
                    if (powZones.length) {
                        powerZones = /** @type {ZoneEntry[]} */ (applyZoneColors(powZones, "power"));
                        window.powerZones = powerZones;
                        hasPowerZoneData = true;
                        console.log("[ChartJS] Power zones data set:", powerZones);
                    }
                }
            }
        }

        // Fallback: legacy sessionMesgs (snake_case arrays)
        if (!heartRateZones.length && Array.isArray(globalData.sessionMesgs)) {
            const sessionWithHrZones = globalData.sessionMesgs.find((s) => Array.isArray(s?.time_in_hr_zone));
            if (sessionWithHrZones?.time_in_hr_zone) {
                const hrZones = buildZones(sessionWithHrZones.time_in_hr_zone);
                if (hrZones.length) {
                    heartRateZones = /** @type {ZoneEntry[]} */ (applyZoneColors(hrZones, "hr"));
                    window.heartRateZones = heartRateZones;
                    hasHRZoneData = true;
                    console.log("[ChartJS] HR zones from sessionMesgs:", heartRateZones);
                }
            }
        }
        if (!powerZones.length && Array.isArray(globalData.sessionMesgs)) {
            const sessionWithPowerZones = globalData.sessionMesgs.find((s) => Array.isArray(s?.time_in_power_zone));
            if (sessionWithPowerZones?.time_in_power_zone) {
                const powZones = buildZones(sessionWithPowerZones.time_in_power_zone);
                if (powZones.length) {
                    powerZones = /** @type {ZoneEntry[]} */ (applyZoneColors(powZones, "power"));
                    window.powerZones = powerZones;
                    hasPowerZoneData = true;
                    console.log("[ChartJS] Power zones from sessionMesgs:", powerZones);
                }
            }
        }

        // Fallback: aggregate lapMesgs if neither set
        if (
            !heartRateZones.length &&
            !powerZones.length &&
            Array.isArray(globalData.lapMesgs) &&
            globalData.lapMesgs.length
        ) {
            console.log("[ChartJS] Aggregating zone data from lapMesgs");
            /** @type {number[]} */ const hrZoneTimes = [],
            /** @type {number[]} */  powerZoneTimes = [];
            globalData.lapMesgs.forEach((lap) => {
                if (Array.isArray(lap?.time_in_hr_zone)) {
                    lap.time_in_hr_zone.forEach((t, i) => {
                        hrZoneTimes[i] = (hrZoneTimes[i] || 0) + (t || 0);
                    });
                }
                if (Array.isArray(lap?.time_in_power_zone)) {
                    lap.time_in_power_zone.forEach((t, i) => {
                        powerZoneTimes[i] = (powerZoneTimes[i] || 0) + (t || 0);
                    });
                }
            });
            if (hrZoneTimes.length > 1 && hrZoneTimes.slice(1).some((t) => t > 0)) {
                const hrZones = buildZones(hrZoneTimes);
                if (hrZones.length) {
                    heartRateZones = /** @type {ZoneEntry[]} */ (applyZoneColors(hrZones, "hr"));
                    window.heartRateZones = heartRateZones;
                    hasHRZoneData = true;
                    console.log("[ChartJS] HR zones from laps:", heartRateZones);
                }
            }
            if (powerZoneTimes.length > 1 && powerZoneTimes.slice(1).some((t) => t > 0)) {
                const powZones = buildZones(powerZoneTimes);
                if (powZones.length) {
                    powerZones = /** @type {ZoneEntry[]} */ (applyZoneColors(powZones, "power"));
                    window.powerZones = powerZones;
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

    return { heartRateZones: heartRateZones || [], powerZones: powerZones || [], hasHRZoneData, hasPowerZoneData };
}

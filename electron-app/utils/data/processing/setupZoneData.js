import { applyZoneColors } from "../zones/chartZoneColorUtils.js";
import { updatePowerZoneControlsVisibility } from "../../ui/controls/createPowerZoneControls.js";
import { updateHRZoneControlsVisibility } from "../../ui/controls/createHRZoneControls.js";

/**
 * Extracts and sets up heart rate and power zone data from FIT file
 * @param {Object} globalData - FIT file data object
 */

export function setupZoneData(globalData) {
    try {
        if (!globalData) return;

        console.log("[ChartJS] Setting up zone data from globalData:", globalData);

        let hasPowerZoneData = false;
        let hasHRZoneData = false;

        // Extract heart rate and power zones from timeInZoneMesgs
        if (globalData.timeInZoneMesgs && Array.isArray(globalData.timeInZoneMesgs)) {
            console.log("[ChartJS] Found timeInZoneMesgs:", globalData.timeInZoneMesgs.length);

            // Debug: Log all timeInZoneMesgs to see what's available
            globalData.timeInZoneMesgs.forEach((zoneMsg, index) => {
                console.log(`[ChartJS] TimeInZone ${index} fields:`, Object.keys(zoneMsg));
                console.log(`[ChartJS] TimeInZone ${index} data:`, zoneMsg);
            });

            // Look for session-level zone data (referenceMesg === 'session')
            const sessionZoneData = globalData.timeInZoneMesgs.find((zoneMsg) => zoneMsg.referenceMesg === "session");

            if (sessionZoneData) {
                // Process heart rate zones
                if (sessionZoneData.timeInHrZone && Array.isArray(sessionZoneData.timeInHrZone)) {
                    console.log("[ChartJS] Found HR zone data in timeInZoneMesgs:", sessionZoneData.timeInHrZone);
                    const hrZoneData = sessionZoneData.timeInHrZone
                        .slice(1) // Skip Zone 0
                        .map((time, index) => ({
                            zone: index + 1,
                            time: time || 0,
                            label: `Zone ${index + 1}`,
                        }))
                        .filter((zone) => zone.time > 0);

                    if (hrZoneData.length > 0) {
                        window.heartRateZones = applyZoneColors(hrZoneData, "hr");
                        console.log("[ChartJS] Heart rate zones data set:", window.heartRateZones);
                        hasHRZoneData = true;
                    }
                } else {
                    console.log("[ChartJS] No HR zone data found in session timeInZoneMesgs");
                }

                // Process power zones
                if (sessionZoneData.timeInPowerZone && Array.isArray(sessionZoneData.timeInPowerZone)) {
                    console.log("[ChartJS] Found power zone data in timeInZoneMesgs:", sessionZoneData.timeInPowerZone);
                    const powerZoneData = sessionZoneData.timeInPowerZone
                        .slice(1) // Skip Zone 0
                        .map((time, index) => ({
                            zone: index + 1,
                            time: time || 0,
                            label: `Zone ${index + 1}`,
                        }))
                        .filter((zone) => zone.time > 0);

                    if (powerZoneData.length > 0) {
                        window.powerZones = applyZoneColors(powerZoneData, "power");
                        console.log("[ChartJS] Power zones data set:", window.powerZones);
                        hasPowerZoneData = true;
                    }
                } else {
                    console.log("[ChartJS] No power zone data found in session timeInZoneMesgs");
                }
            } else {
                console.log("[ChartJS] No session-level timeInZoneMesgs found");
            }
        } else {
            console.log("[ChartJS] No timeInZoneMesgs found in globalData");
        }

        // Fallback: Extract heart rate zones from session messages (legacy approach)
        if (!window.heartRateZones && globalData.sessionMesgs && Array.isArray(globalData.sessionMesgs)) {
            console.log("[ChartJS] Trying legacy session messages for HR zones");
            const sessionWithHrZones = globalData.sessionMesgs.find(
                (session) => session.time_in_hr_zone && Array.isArray(session.time_in_hr_zone)
            );

            if (sessionWithHrZones && sessionWithHrZones.time_in_hr_zone) {
                console.log("[ChartJS] Found HR zone data in session:", sessionWithHrZones.time_in_hr_zone);
                const hrZoneData = sessionWithHrZones.time_in_hr_zone
                    .slice(1) // Skip Zone 0
                    .map((time, index) => ({
                        zone: index + 1,
                        time: time || 0,
                        label: `Zone ${index + 1}`,
                    }))
                    .filter((zone) => zone.time > 0);

                if (hrZoneData.length > 0) {
                    window.heartRateZones = applyZoneColors(hrZoneData, "hr");
                    console.log("[ChartJS] Heart rate zones data set from session:", window.heartRateZones);
                    hasHRZoneData = true;
                }
            }
        }

        // Fallback: Extract power zones from session messages (legacy approach)
        if (!window.powerZones && globalData.sessionMesgs && Array.isArray(globalData.sessionMesgs)) {
            console.log("[ChartJS] Trying legacy session messages for power zones");
            const sessionWithPowerZones = globalData.sessionMesgs.find(
                (session) => session.time_in_power_zone && Array.isArray(session.time_in_power_zone)
            );

            if (sessionWithPowerZones && sessionWithPowerZones.time_in_power_zone) {
                console.log("[ChartJS] Found power zone data in session:", sessionWithPowerZones.time_in_power_zone);
                const powerZoneData = sessionWithPowerZones.time_in_power_zone
                    .slice(1) // Skip Zone 0
                    .map((time, index) => ({
                        zone: index + 1,
                        time: time || 0,
                        label: `Zone ${index + 1}`,
                    }))
                    .filter((zone) => zone.time > 0);

                if (powerZoneData.length > 0) {
                    window.powerZones = applyZoneColors(powerZoneData, "power");
                    console.log("[ChartJS] Power zones data set from session:", window.powerZones);
                    hasPowerZoneData = true;
                }
            }
        }

        // Also check lap messages for zone data if session data is not available
        if (!window.heartRateZones && !window.powerZones) {
            const lapMesgs = globalData.lapMesgs;
            if (lapMesgs && Array.isArray(lapMesgs) && lapMesgs.length > 0) {
                console.log("[ChartJS] Trying to aggregate zone data from lap messages");
                // Aggregate zone times from all laps
                const hrZoneTimes = [];
                const powerZoneTimes = [];

                lapMesgs.forEach((lap) => {
                    if (lap.time_in_hr_zone && Array.isArray(lap.time_in_hr_zone)) {
                        lap.time_in_hr_zone.forEach((time, index) => {
                            hrZoneTimes[index] = (hrZoneTimes[index] || 0) + (time || 0);
                        });
                    }

                    if (lap.time_in_power_zone && Array.isArray(lap.time_in_power_zone)) {
                        lap.time_in_power_zone.forEach((time, index) => {
                            powerZoneTimes[index] = (powerZoneTimes[index] || 0) + (time || 0);
                        });
                    }
                });

                // Set up HR zones from lap data
                if (hrZoneTimes.length > 1 && hrZoneTimes.slice(1).some((time) => time > 0)) {
                    window.heartRateZones = hrZoneTimes
                        .slice(1) // Skip Zone 0
                        .map((time, index) => ({
                            zone: index + 1,
                            time: time || 0,
                            label: `Zone ${index + 1}`,
                        }))
                        .filter((zone) => zone.time > 0);

                    // Apply saved colors
                    window.heartRateZones = applyZoneColors(window.heartRateZones, "hr");
                    console.log("[ChartJS] Heart rate zones processed from laps:", window.heartRateZones);
                }

                // Set up power zones from lap data
                if (powerZoneTimes.length > 1 && powerZoneTimes.slice(1).some((time) => time > 0)) {
                    window.powerZones = powerZoneTimes
                        .slice(1) // Skip Zone 0
                        .map((time, index) => ({
                            zone: index + 1,
                            time: time || 0,
                            label: `Zone ${index + 1}`,
                        }))
                        .filter((zone) => zone.time > 0);

                    // Apply saved colors
                    window.powerZones = applyZoneColors(window.powerZones, "power");
                    console.log("[ChartJS] Power zones processed from laps:", window.powerZones);
                }
            }
        }

        // Update visibility of zone controls based on available data
        updatePowerZoneControlsVisibility(hasPowerZoneData);
        updateHRZoneControlsVisibility(hasHRZoneData);

        // Optionally, return some status or processed data if needed
        return {
            heartRateZones: window.heartRateZones || [],
            powerZones: window.powerZones || [],
            hasHRZoneData,
            hasPowerZoneData,
        };
    } catch (error) {
        console.error("[ChartJS] Error setting up zone data:", error);
    }
}

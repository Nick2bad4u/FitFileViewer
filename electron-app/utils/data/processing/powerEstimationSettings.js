/**
 * @fileoverview Persistence + defaults for estimated cycling power settings.
 */

import { getPowerEstimationSetting, setPowerEstimationSetting } from "../../state/domain/settingsStateManager.js";

/**
 * @typedef {object} PowerEstimationSettings
 * @property {boolean} enabled
 * @property {number} riderWeightKg
 * @property {number} bikeWeightKg
 * @property {number} crr
 * @property {number} cda
 * @property {number} drivetrainEfficiency
 * @property {number} windSpeedMps
 * @property {number} gradeWindowMeters
 * @property {number} maxPowerW
 */

/**
 * @returns {PowerEstimationSettings}
 */
export function getPowerEstimationSettings() {
    const enabledRaw = getPowerEstimationSetting("enabled");

    /**
     * @param {string} key
     * @param {number} fallback
     */
    const getNum = (key, fallback) => {
        const v = getPowerEstimationSetting(key);
        return typeof v === "number" && Number.isFinite(v) ? v : fallback;
    };

    return {
        enabled: enabledRaw !== false,
        riderWeightKg: getNum("riderWeightKg", 75),
        bikeWeightKg: getNum("bikeWeightKg", 10),
        crr: getNum("crr", 0.004),
        cda: getNum("cda", 0.32),
        drivetrainEfficiency: getNum("drivetrainEfficiency", 0.97),
        windSpeedMps: getNum("windSpeedMps", 0),
        gradeWindowMeters: getNum("gradeWindowMeters", 35),
        maxPowerW: getNum("maxPowerW", 2000),
    };
}

/**
 * @param {PowerEstimationSettings} s
 */
export function setPowerEstimationSettings(s) {
    setPowerEstimationSetting("enabled", s.enabled);
    setPowerEstimationSetting("riderWeightKg", s.riderWeightKg);
    setPowerEstimationSetting("bikeWeightKg", s.bikeWeightKg);
    setPowerEstimationSetting("crr", s.crr);
    setPowerEstimationSetting("cda", s.cda);
    setPowerEstimationSetting("drivetrainEfficiency", s.drivetrainEfficiency);
    setPowerEstimationSetting("windSpeedMps", s.windSpeedMps);
    setPowerEstimationSetting("gradeWindowMeters", s.gradeWindowMeters);
    setPowerEstimationSetting("maxPowerW", s.maxPowerW);
}

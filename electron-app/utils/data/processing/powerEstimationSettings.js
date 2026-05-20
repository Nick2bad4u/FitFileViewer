/**
 * Persistence and defaults for estimated cycling power settings.
 */
import { getPowerEstimationSetting, setPowerEstimationSetting, } from "../../state/domain/settingsStateManager.js";
const DEFAULT_POWER_ESTIMATION_SETTINGS = {
    bikeWeightKg: 10,
    cda: 0.32,
    crr: 0.004,
    drivetrainEfficiency: 0.97,
    enabled: true,
    gradeWindowMeters: 35,
    maxPowerW: 2000,
    riderWeightKg: 75,
    windSpeedMps: 0,
};
const NUMERIC_SETTING_KEYS = [
    "bikeWeightKg",
    "cda",
    "crr",
    "drivetrainEfficiency",
    "gradeWindowMeters",
    "maxPowerW",
    "riderWeightKg",
    "windSpeedMps",
];
/**
 * Reads the current estimated power settings with defaults for invalid values.
 *
 * @returns The normalized estimated power settings.
 */
export function getPowerEstimationSettings() {
    const enabledRaw = getPowerEstimationSetting("enabled");
    const settings = {
        ...DEFAULT_POWER_ESTIMATION_SETTINGS,
        enabled: enabledRaw !== false,
    };
    for (const key of NUMERIC_SETTING_KEYS) {
        settings[key] = getFiniteNumberSetting(key, DEFAULT_POWER_ESTIMATION_SETTINGS[key]);
    }
    return settings;
}
/**
 * Persists all estimated power settings.
 *
 * @param settings - Settings to store for later calculations.
 */
export function setPowerEstimationSettings(settings) {
    setPowerEstimationSetting("enabled", settings.enabled);
    setPowerEstimationSetting("riderWeightKg", settings.riderWeightKg);
    setPowerEstimationSetting("bikeWeightKg", settings.bikeWeightKg);
    setPowerEstimationSetting("crr", settings.crr);
    setPowerEstimationSetting("cda", settings.cda);
    setPowerEstimationSetting("drivetrainEfficiency", settings.drivetrainEfficiency);
    setPowerEstimationSetting("windSpeedMps", settings.windSpeedMps);
    setPowerEstimationSetting("gradeWindowMeters", settings.gradeWindowMeters);
    setPowerEstimationSetting("maxPowerW", settings.maxPowerW);
}
function getFiniteNumberSetting(key, fallback) {
    const value = getPowerEstimationSetting(key);
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
}

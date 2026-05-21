/** Settings whose changes require chart data caches to be invalidated. */
export const DATA_SIGNATURE_SOURCES = [
    { settingKey: "distanceUnits", storageKey: "chartjs_distanceUnits" },
    { settingKey: "temperatureUnits", storageKey: "chartjs_temperatureUnits" },
];
/** Creates a stable JSON signature for data-affecting chart settings. */
export function createDataSettingsSignature(settings = {}) {
    const signature = {};
    for (const { settingKey, storageKey } of DATA_SIGNATURE_SOURCES) {
        const value = readSettingOrStorageValue(settingKey, storageKey, settings);
        if (value != null) {
            signature[settingKey] = value;
        }
    }
    return JSON.stringify(signature);
}
function readSettingOrStorageValue(settingKey, _storageKey, settings) {
    if (Object.hasOwn(settings, settingKey) && settings[settingKey] != null) {
        return settings[settingKey];
    }
    return null;
}

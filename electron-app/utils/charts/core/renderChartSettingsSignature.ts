/** Chart setting source included in data-dependent cache signatures. */
export type DataSignatureSource = {
    readonly settingKey: string;
    readonly storageKey: string;
};

/** Settings whose changes require chart data caches to be invalidated. */
export const DATA_SIGNATURE_SOURCES: readonly DataSignatureSource[] = [
    { settingKey: "distanceUnits", storageKey: "chartjs_distanceUnits" },
    { settingKey: "temperatureUnits", storageKey: "chartjs_temperatureUnits" },
];

type DataSettings = Record<string, unknown>;

/** Creates a stable JSON signature for data-affecting chart settings. */
export function createDataSettingsSignature(
    settings: DataSettings = {}
): string {
    const signature: DataSettings = {};

    for (const { settingKey, storageKey } of DATA_SIGNATURE_SOURCES) {
        const value = readSettingOrStorageValue(
            settingKey,
            storageKey,
            settings
        );
        if (value !== null) {
            signature[settingKey] = value;
        }
    }

    return JSON.stringify(signature);
}

function readSettingOrStorageValue(
    settingKey: string,
    _storageKey: string,
    settings: DataSettings
): unknown {
    if (
        Object.hasOwn(settings, settingKey) &&
        settings[settingKey] !== null &&
        settings[settingKey] !== undefined
    ) {
        return settings[settingKey];
    }

    return null;
}

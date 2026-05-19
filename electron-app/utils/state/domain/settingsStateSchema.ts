/**
 * Settings categories managed by the settings state boundary.
 */
export type SettingCategory =
    | "chart"
    | "export"
    | "mapTheme"
    | "powerEstimation"
    | "theme"
    | "ui"
    | "units";

/**
 * Storage representation used for a settings category.
 */
export type SettingSchemaType = "boolean" | "number" | "object" | "string";

/**
 * Settings schema entry with default value and runtime validation.
 */
export type SettingSchema<TDefault = unknown> = {
    readonly default: TDefault;
    readonly key: string;
    readonly type: SettingSchemaType;
    readonly validate: (value: unknown) => boolean;
};

const isSettingsObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Settings categories and their persistence configuration.
 */
export const SETTINGS_SCHEMA = {
    chart: {
        default: {},
        key: "chartjs_",
        type: "object",
        // Chart settings are stored as individual primitive values under object keys
        // such as chartjs_field_speed = "hidden".
        validate: () => true,
    },
    export: {
        default: {
            format: "png",
            includeWatermark: false,
            quality: 0.9,
            theme: "auto",
        },
        key: "export_",
        type: "object",
        validate: isSettingsObject,
    },
    mapTheme: {
        default: true,
        key: "ffv-map-theme-inverted",
        type: "boolean",
        validate: (value: unknown) => typeof value === "boolean",
    },
    powerEstimation: {
        default: {},
        key: "powerEst_",
        type: "object",
        // Power estimation settings are stored as individual primitive values
        // under object keys such as powerEst_riderWeightKg = 75.
        validate: () => true,
    },
    theme: {
        default: "dark",
        key: "ffv-theme",
        type: "string",
        validate: (value: unknown) =>
            [
                "auto",
                "dark",
                "light",
            ].includes(value as string),
    },
    ui: {
        default: {
            animationsEnabled: true,
            compactMode: false,
            showAdvancedControls: false,
        },
        key: "ui_",
        type: "object",
        validate: isSettingsObject,
    },
    units: {
        default: {
            distance: "metric",
            temperature: "celsius",
            time: "24h",
        },
        key: "units_",
        type: "object",
        validate: isSettingsObject,
    },
} as const satisfies Record<SettingCategory, SettingSchema>;

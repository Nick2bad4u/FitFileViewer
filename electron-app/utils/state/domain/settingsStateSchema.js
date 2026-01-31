/**
 * Settings schema definitions and defaults.
 */

/**
 * @typedef {"theme" | "mapTheme" | "chart" | "ui" | "export" | "units" | "powerEstimation"} SettingCategory
 *
 * @typedef {Object} SettingSchema
 *
 * @property {string} key
 * @property {any} default
 * @property {(value: any) => boolean} validate
 * @property {"string" | "boolean" | "object" | "number"} type
 */

/**
 * Settings categories and their configurations.
 */
/** @type {Record<SettingCategory, SettingSchema>} */
const SETTINGS_SCHEMA = {
    chart: {
        default: {},
        key: "chartjs_",
        type: "object",
        // Chart settings are stored as individual primitive values under object-keys
        // (e.g. chartjs_field_speed = "hidden", chartjs_color_speed = "#ff00ff").
        // Validation of the *whole object* is not meaningful in that model.
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
        validate: (value) => typeof value === "object",
    },
    mapTheme: {
        default: true,
        key: "ffv-map-theme-inverted",
        type: "boolean",
        validate: (value) => typeof value === "boolean",
    },
    theme: {
        default: "dark",
        key: "ffv-theme",
        type: "string",
        validate: (value) =>
            [
                "auto",
                "dark",
                "light",
            ].includes(value),
    },
    ui: {
        default: {
            animationsEnabled: true,
            compactMode: false,
            showAdvancedControls: false,
        },
        key: "ui_",
        type: "object",
        validate: (value) => typeof value === "object",
    },
    units: {
        default: {
            distance: "metric",
            temperature: "celsius",
            time: "24h",
        },
        key: "units_",
        type: "object",
        validate: (value) => typeof value === "object",
    },
    powerEstimation: {
        default: {},
        key: "powerEst_",
        type: "object",
        // Power estimation settings are stored as individual primitive values (numbers/booleans)
        // under object-keys (e.g. powerEst_riderWeightKg = 75).
        validate: () => true,
    },
};

export { SETTINGS_SCHEMA };

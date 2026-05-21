/**
 * Universal conversion factors used throughout the application.
 */
export const CONVERSION_FACTORS = {
    CELSIUS_TO_FAHRENHEIT_MULTIPLIER: 9 / 5,
    CELSIUS_TO_FAHRENHEIT_OFFSET: 32,
    DECIMAL_PLACES: 2,
    DECIMAL_PLACES_PRECISE: 4,
    INCHES_PER_FOOT: 12,
    KG_TO_POUNDS: 2.204_62,
    METERS_PER_KILOMETER: 1000,
    METERS_PER_MILE: 1609.344,
    METERS_TO_FEET: 3.280_84,
    METERS_TO_INCHES: 39.3701,
    MILLISECONDS_PER_SECOND: 1000,
    MPS_TO_KMH: 3.6,
    MPS_TO_MPH: 2.237,
    SECONDS_PER_HOUR: 3600,
    SECONDS_PER_MINUTE: 60,
};
/**
 * Distance unit definitions with consistent naming.
 */
export const DISTANCE_UNITS = {
    FEET: "feet",
    KILOMETERS: "kilometers",
    METERS: "meters",
    MILES: "miles",
};
/**
 * Time unit definitions.
 */
export const TIME_UNITS = {
    HOURS: "hours",
    MILLISECONDS: "milliseconds",
    MINUTES: "minutes",
    SECONDS: "seconds",
};
/**
 * Temperature unit definitions.
 */
export const TEMPERATURE_UNITS = {
    CELSIUS: "celsius",
    FAHRENHEIT: "fahrenheit",
    KELVIN: "kelvin",
};
/**
 * UI-related constants and configurations.
 */
export const UI_CONSTANTS = {
    ANIMATION_DURATION: 300,
    CSS_CLASSES: {
        ACTIVE: "active",
        HIDDEN: "hidden",
        LOADING: "loading",
        SHOW: "show",
        THEMED_BTN: "themed-btn",
    },
    DEBOUNCE_DELAY: 250,
    DEFAULT_THEME: "dark",
    DOM_IDS: {
        ACTIVE_FILE_NAME: "active_file_name",
        ACTIVE_FILE_NAME_CONTAINER: "active_file_name_container",
        ALT_FIT_IFRAME: "altfit_iframe",
        CONTENT_CHART: "content_chart",
        CONTENT_DATA: "content_data",
        CONTENT_MAP: "content_map",
        CONTENT_SUMMARY: "content_summary",
        DROP_OVERLAY: "drop_overlay",
        NOTIFICATION: "notification",
        TAB_CHART: "tab_chart",
        TAB_SUMMARY: "tab_summary",
        UNLOAD_FILE_BTN: "unload_file_btn",
        ZWIFT_IFRAME: "zwift_iframe",
    },
    HEADER_HEIGHT: 60,
    NOTIFICATION_TYPES: {
        ERROR: {
            ariaLabel: "Error",
            duration: 6000,
            icon: "❌",
            type: "error",
        },
        INFO: {
            ariaLabel: "Information",
            duration: 4000,
            icon: "ℹ️",
            type: "info",
        },
        SUCCESS: {
            ariaLabel: "Success",
            duration: 3000,
            icon: "✅",
            type: "success",
        },
        WARNING: {
            ariaLabel: "Warning",
            duration: 5000,
            icon: "⚠️",
            type: "warning",
        },
    },
    SIDEBAR_WIDTH: 250,
    SUMMARY_COLUMN_SELECTOR_DELAY: 100,
    THEMES: {
        DARK: "dark",
        LIGHT: "light",
        SYSTEM: "system",
    },
};
/**
 * File handling constants.
 */
export const FILE_CONSTANTS = {
    DEFAULT_EXPORT_FORMAT: "gpx",
    EXPORT_FORMATS: {
        CSV: "csv",
        GPX: "gpx",
        JSON: "json",
    },
    IFRAME_PATHS: {
        ALT_FIT: "ffv/index.html",
    },
    MAX_FILE_SIZE: 50 * 1024 * 1024,
    SUPPORTED_EXTENSIONS: [".fit"],
    SUPPORTED_MIME_TYPES: ["application/octet-stream"],
};
/**
 * Chart-related constants.
 */
export const CHART_CONSTANTS = {
    CHART_TYPES: {
        ALTITUDE: "altitude",
        ELEVATION: "elevation",
        GPS_TRACK: "gps-track",
        HEART_RATE: "heart-rate",
        LAP_ZONE: "lap-zone",
        POWER: "power",
        SPEED: "speed",
    },
    DEFAULT_CHART: "elevation",
    DEFAULT_COLORS: {
        PRIMARY: "#667eea",
        SECONDARY: "#764ba2",
    },
    DEFAULT_ZOOM_LEVEL: 1,
    MAX_ZOOM_LEVEL: 10,
    MIN_ZOOM_LEVEL: 0.1,
};
/**
 * Map-related constants.
 */
export const MAP_CONSTANTS = {
    DEFAULT_CENTER: [0, 0],
    DEFAULT_PROVIDER: "openstreetmap",
    DEFAULT_ZOOM: 13,
    PROVIDERS: {
        OPENSTREETMAP: "openstreetmap",
        SATELLITE: "satellite",
    },
};
/**
 * Performance monitoring constants.
 */
export const PERFORMANCE_CONSTANTS = {
    CATEGORIES: {
        CHARTS: "charts",
        DATA_PROCESSING: "data-processing",
        FILE_OPERATIONS: "file-operations",
        STATE_MANAGEMENT: "state-management",
        UI_RENDERING: "ui-rendering",
    },
    ENABLE_MONITORING: false,
    MAX_HISTORY_SIZE: 100,
    MEMORY_CHECK_INTERVAL: 30_000,
    SLOW_OPERATION_THRESHOLD: 10,
};
/**
 * Validation constants and rules.
 */
export const VALIDATION_CONSTANTS = {
    MAX_DISTANCE: 1_000_000,
    MAX_DURATION: 86_400,
    MAX_SPEED: 200,
    MAX_STRING_LENGTH: 1000,
    MIN_DISTANCE: 0,
    MIN_DURATION: 0,
    MIN_SPEED: 0,
    MIN_STRING_LENGTH: 1,
};
/**
 * Error handling constants.
 */
export const ERROR_CONSTANTS = {
    CODES: {
        FILE_NOT_FOUND: "FILE_NOT_FOUND",
        INVALID_INPUT: "INVALID_INPUT",
        NETWORK_ERROR: "NETWORK_ERROR",
        PARSE_ERROR: "PARSE_ERROR",
        PERMISSION_DENIED: "PERMISSION_DENIED",
        STATE_ERROR: "STATE_ERROR",
        UNKNOWN_ERROR: "UNKNOWN_ERROR",
        VALIDATION_ERROR: "VALIDATION_ERROR",
    },
    MESSAGES: {
        FILE_NOT_FOUND: "File not found",
        INVALID_INPUT: "Invalid input provided",
        NETWORK_ERROR: "Network connection error",
        PARSE_ERROR: "Failed to parse file",
        PERMISSION_DENIED: "Permission denied",
        STATE_ERROR: "Application state error",
        UNKNOWN_ERROR: "An unknown error occurred",
        VALIDATION_ERROR: "Input validation failed",
    },
};
/**
 * Development and debugging constants.
 */
export const DEBUG_CONSTANTS = {
    CATEGORIES: {
        CHARTS: "charts",
        DATA: "data",
        FILES: "files",
        STATE: "state",
        UI: "ui",
    },
    ENABLED: false,
    LOG_LEVELS: {
        DEBUG: "debug",
        ERROR: "error",
        INFO: "info",
        WARN: "warn",
    },
};
/**
 * Application metadata constants.
 */
export const APP_CONSTANTS = {
    AUTHOR: "FitFileViewer Development Team",
    EVENTS: {
        INSTALL_UPDATE: "install-update",
        MENU_OPEN_FILE: "menu-open-file",
        MENU_OPEN_OVERLAY: "menu-open-overlay",
        SET_FULLSCREEN: "set-fullscreen",
        SET_THEME: "set-theme",
        THEME_CHANGED: "theme-changed",
    },
    IPC_CHANNELS: {
        APP_VERSION: "getAppVersion",
        CHROME_VERSION: "getChromeVersion",
        DIALOG_OPEN_FILE: "dialog:openFile",
        ELECTRON_VERSION: "getElectronVersion",
        FILE_READ: "file:read",
        FIT_DECODE: "fit:decode",
        FIT_PARSE: "fit:parse",
        NODE_VERSION: "getNodeVersion",
        PLATFORM_INFO: "getPlatformInfo",
        SHELL_OPEN_EXTERNAL: "shell:openExternal",
        THEME_GET: "theme:get",
    },
    NAME: "FitFileViewer",
    VERSION: "26.8.0",
};
const MODULE_EXPORTS = {
    APP_CONSTANTS,
    CHART_CONSTANTS,
    CONVERSION_FACTORS,
    DEBUG_CONSTANTS,
    DISTANCE_UNITS,
    ERROR_CONSTANTS,
    FILE_CONSTANTS,
    MAP_CONSTANTS,
    PERFORMANCE_CONSTANTS,
    TEMPERATURE_UNITS,
    TIME_UNITS,
    UI_CONSTANTS,
    VALIDATION_CONSTANTS,
};
/**
 * Get a configuration value by dot-notation path.
 *
 * @example GetConfig("UI_CONSTANTS.DEFAULT_THEME"); // "dark"
 * getConfig("CONVERSION_FACTORS.METERS_PER_MILE"); // 1609.344
 *
 * @param path - Dot-notation path to a configuration value.
 * @param defaultValue - Value returned when the path does not exist.
 *
 * @returns Configuration value, or the provided default value.
 */
export function getConfig(path, defaultValue) {
    let current = MODULE_EXPORTS;
    try {
        for (const part of path.split(".")) {
            if (isRecord(current) && part in current) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }
        return current;
    } catch {
        return defaultValue;
    }
}
/**
 * Initialize the configuration system and fail fast on invalid constants.
 *
 * @throws Error when required configuration values are missing or invalid.
 */
export function initializeConfig() {
    const validation = validateConfig();
    if (!validation.isValid) {
        console.error(
            "[Config] Configuration validation failed:",
            validation.errors
        );
        throw new Error(
            `Configuration validation failed: ${validation.errors.join(", ")}`
        );
    }
    if (validation.warnings.length > 0) {
        console.warn("[Config] Configuration warnings:", validation.warnings);
    }
    console.log("[Config] Configuration system initialized successfully");
}
/**
 * Validate configuration integrity.
 *
 * @returns Current configuration validation result.
 */
export function validateConfig() {
    const errors = [],
        warnings = [];
    for (const path of [
        "CONVERSION_FACTORS.METERS_PER_KILOMETER",
        "UI_CONSTANTS.DEFAULT_THEME",
        "FILE_CONSTANTS.SUPPORTED_EXTENSIONS",
    ]) {
        if (getConfig(path) === undefined) {
            errors.push(`Missing required configuration: ${path}`);
        }
    }
    if (CONVERSION_FACTORS.METERS_PER_KILOMETER !== 1000) {
        errors.push("METERS_PER_KILOMETER should be 1000");
    }
    if (!themeExists(UI_CONSTANTS.DEFAULT_THEME)) {
        warnings.push(
            `Default theme '${UI_CONSTANTS.DEFAULT_THEME}' not found in THEMES`
        );
    }
    return {
        errors,
        isValid: errors.length === 0,
        warnings,
    };
}
/**
 * Namespaced constant groups for consumers that prefer grouped access.
 */
export const CONFIG = {
    APP: APP_CONSTANTS,
    CHART: CHART_CONSTANTS,
    CONVERSION: CONVERSION_FACTORS,
    DEBUG: DEBUG_CONSTANTS,
    DISTANCE_UNITS,
    ERROR: ERROR_CONSTANTS,
    FILE: FILE_CONSTANTS,
    MAP: MAP_CONSTANTS,
    PERFORMANCE: PERFORMANCE_CONSTANTS,
    TEMPERATURE_UNITS,
    TIME_UNITS,
    UI: UI_CONSTANTS,
    VALIDATION: VALIDATION_CONSTANTS,
};
function isRecord(value) {
    return value !== null && typeof value === "object";
}
function themeExists(theme) {
    return Object.values(UI_CONSTANTS.THEMES).includes(theme);
}

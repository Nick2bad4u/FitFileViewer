/**
 * @fileoverview Central Configuration System for FitFileViewer
 * @description Provides centralized constants and configuration management across the application
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} ConversionFactors
 * @property {number} DECIMAL_PLACES - Default decimal places for formatting
 * @property {number} METERS_PER_KILOMETER - Conversion factor
 * @property {number} METERS_PER_MILE - Conversion factor
 * @property {number} METERS_TO_FEET - Conversion factor
 * @property {number} SECONDS_PER_HOUR - Time conversion
 * @property {number} SECONDS_PER_MINUTE - Time conversion
 */

/**
 * @typedef {Object} UIConstants
 * @property {string} DEFAULT_THEME - Default application theme
 * @property {Object} NOTIFICATION_TYPES - Notification type configurations
 * @property {Object} DOM_IDS - Common DOM element IDs
 * @property {Object} CSS_CLASSES - Common CSS class names
 * @property {number} ANIMATION_DURATION - Default animation duration in ms
 */

/**
 * @typedef {Object} FileConstants
 * @property {string[]} SUPPORTED_EXTENSIONS - Supported file extensions
 * @property {number} MAX_FILE_SIZE - Maximum file size in bytes
 * @property {string} DEFAULT_EXPORT_FORMAT - Default export format
 */

/**
 * Universal conversion factors used throughout the application
 */
export const CONVERSION_FACTORS = {
    // Decimal precision
    DECIMAL_PLACES: 2,
    DECIMAL_PLACES_PRECISE: 4,

    // Distance conversions
    METERS_PER_KILOMETER: 1000,
    METERS_PER_MILE: 1609.344,
    METERS_TO_FEET: 3.280_84,

    // Time conversions
    SECONDS_PER_HOUR: 3600,
    SECONDS_PER_MINUTE: 60,
    MILLISECONDS_PER_SECOND: 1000,

    // Temperature conversions
    CELSIUS_TO_FAHRENHEIT_MULTIPLIER: 9 / 5,
    CELSIUS_TO_FAHRENHEIT_OFFSET: 32,

    // Speed conversions
    MPS_TO_KMH: 3.6,
    MPS_TO_MPH: 2.237,

    // Weight conversions
    KG_TO_POUNDS: 2.204_62,

    // Height conversions
    METERS_TO_INCHES: 39.3701,
    INCHES_PER_FOOT: 12,
};

/**
 * Distance unit definitions with consistent naming
 */
export const DISTANCE_UNITS = {
    FEET: "feet",
    KILOMETERS: "kilometers",
    METERS: "meters",
    MILES: "miles",
};

/**
 * Time unit definitions
 */
export const TIME_UNITS = {
    HOURS: "hours",
    MILLISECONDS: "milliseconds",
    MINUTES: "minutes",
    SECONDS: "seconds",
};

/**
 * Temperature unit definitions
 */
export const TEMPERATURE_UNITS = {
    CELSIUS: "celsius",
    FAHRENHEIT: "fahrenheit",
    KELVIN: "kelvin",
};

/**
 * UI-related constants and configurations
 */
export const UI_CONSTANTS = {
    // Theme configuration
    DEFAULT_THEME: "dark",
    THEMES: {
        AUTO: "auto",
        DARK: "dark",
        LIGHT: "light",
    },

    // Notification configurations
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

    // Common DOM element IDs
    DOM_IDS: {
        ACTIVE_FILE_NAME: "activeFileName",
        ACTIVE_FILE_NAME_CONTAINER: "activeFileNameContainer",
        ALT_FIT_IFRAME: "altfit-iframe",
        CONTENT_CHART: "content-chart",
        CONTENT_DATA: "content-data",
        CONTENT_MAP: "content-map",
        CONTENT_SUMMARY: "content-summary",
        DROP_OVERLAY: "drop-overlay",
        NOTIFICATION: "notification",
        TAB_CHART: "tab-chart",
        TAB_SUMMARY: "tab-summary",
        UNLOAD_FILE_BTN: "unloadFileBtn",
        ZWIFT_IFRAME: "zwift-iframe",
    },

    // Common CSS classes
    CSS_CLASSES: {
        ACTIVE: "active",
        HIDDEN: "hidden",
        LOADING: "loading",
        SHOW: "show",
        THEMED_BTN: "themed-btn",
    },

    // Animation and timing
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 250,
    SUMMARY_COLUMN_SELECTOR_DELAY: 100,

    // Layout constants
    SIDEBAR_WIDTH: 250,
    HEADER_HEIGHT: 60,
};

/**
 * File handling constants
 */
export const FILE_CONSTANTS = {
    // Supported file types
    SUPPORTED_EXTENSIONS: [".fit"],
    SUPPORTED_MIME_TYPES: ["application/octet-stream"],

    // File size limits (in bytes)
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB

    // Export formats
    EXPORT_FORMATS: {
        CSV: "csv",
        GPX: "gpx",
        JSON: "json",
    },
    DEFAULT_EXPORT_FORMAT: "gpx",

    // File paths
    IFRAME_PATHS: {
        ALT_FIT: "ffv/index.html",
    },
};

/**
 * Chart-related constants
 */
export const CHART_CONSTANTS = {
    // Default chart options
    DEFAULT_ZOOM_LEVEL: 1,
    MAX_ZOOM_LEVEL: 10,
    MIN_ZOOM_LEVEL: 0.1,

    // Chart types
    CHART_TYPES: {
        ALTITUDE: "altitude",
        ELEVATION: "elevation",
        GPS_TRACK: "gps-track",
        HEART_RATE: "heart-rate",
        LAP_ZONE: "lap-zone",
        POWER: "power",
        SPEED: "speed",
    },

    // Default selected chart
    DEFAULT_CHART: "elevation",

    // Chart colors (will be overridden by theme)
    DEFAULT_COLORS: {
        PRIMARY: "#667eea",
        SECONDARY: "#764ba2",
    },
};

/**
 * Map-related constants
 */
export const MAP_CONSTANTS = {
    // Default map settings
    DEFAULT_ZOOM: 13,
    DEFAULT_CENTER: [0, 0],

    // Map providers
    PROVIDERS: {
        OPENSTREETMAP: "openstreetmap",
        SATELLITE: "satellite",
    },

    // Default provider
    DEFAULT_PROVIDER: "openstreetmap",
};

/**
 * Performance monitoring constants
 */
export const PERFORMANCE_CONSTANTS = {
    // Monitoring configuration
    ENABLE_MONITORING: false,
    MAX_HISTORY_SIZE: 100,
    MEMORY_CHECK_INTERVAL: 30_000, // 30 seconds
    SLOW_OPERATION_THRESHOLD: 10, // milliseconds

    // Metric categories
    CATEGORIES: {
        CHARTS: "charts",
        DATA_PROCESSING: "data-processing",
        FILE_OPERATIONS: "file-operations",
        STATE_MANAGEMENT: "state-management",
        UI_RENDERING: "ui-rendering",
    },
};

/**
 * Validation constants and rules
 */
export const VALIDATION_CONSTANTS = {
    // Input validation rules
    MIN_DISTANCE: 0,
    MAX_DISTANCE: 1_000_000, // 1000 km in meters

    MIN_DURATION: 0,
    MAX_DURATION: 86_400, // 24 hours in seconds

    MIN_SPEED: 0,
    MAX_SPEED: 200, // 200 m/s (unrealistic but safe upper bound)

    // String validation
    MAX_STRING_LENGTH: 1000,
    MIN_STRING_LENGTH: 1,
};

/**
 * Error handling constants
 */
export const ERROR_CONSTANTS = {
    // Error codes
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

    // Default error messages
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
 * Development and debugging constants
 */
export const DEBUG_CONSTANTS = {
    // Debug modes
    ENABLED: false,
    LOG_LEVELS: {
        DEBUG: "debug",
        ERROR: "error",
        INFO: "info",
        WARN: "warn",
    },

    // Debug categories
    CATEGORIES: {
        CHARTS: "charts",
        DATA: "data",
        FILES: "files",
        STATE: "state",
        UI: "ui",
    },
};

/**
 * Application metadata constants
 */
export const APP_CONSTANTS = {
    NAME: "FitFileViewer",
    VERSION: "26.8.0", // Should match package.json
    AUTHOR: "FitFileViewer Development Team",

    // IPC channel names
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

    // Event names
    EVENTS: {
        INSTALL_UPDATE: "install-update",
        MENU_OPEN_FILE: "menu-open-file",
        MENU_OPEN_OVERLAY: "menu-open-overlay",
        SET_FULLSCREEN: "set-fullscreen",
        SET_THEME: "set-theme",
        THEME_CHANGED: "theme-changed",
    },
};

/**
 * Get a configuration value by path
 * @param {string} path - Dot-notation path to configuration value
 * @param {*} [defaultValue] - Default value if not found
 * @returns {*} Configuration value
 *
 * @example
 * getConfig('UI_CONSTANTS.DEFAULT_THEME') // returns 'dark'
 * getConfig('CONVERSION_FACTORS.METERS_PER_MILE') // returns 1609.344
 */
export function getConfig(path, defaultValue) {
    const parts = path.split(".");
    let current = globalThis;

    // Try to access the configuration from this module's exports
    const moduleExports = {
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

    current = moduleExports;

    try {
        for (const part of parts) {
            if (current && typeof current === "object" && part in current) {
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
 * Initialize configuration system
 */
export function initializeConfig() {
    const validation = validateConfig();

    if (!validation.isValid) {
        console.error("[Config] Configuration validation failed:", validation.errors);
        throw new Error(`Configuration validation failed: ${validation.errors.join(", ")}`);
    }

    if (validation.warnings.length > 0) {
        console.warn("[Config] Configuration warnings:", validation.warnings);
    }

    console.log("[Config] Configuration system initialized successfully");
}

/**
 * Validate configuration integrity
 * @returns {Object} Validation results
 */
export function validateConfig() {
    const errors = [];
    const warnings = [];

    // Check for required constants
    const requiredConstants = [
        "CONVERSION_FACTORS.METERS_PER_KILOMETER",
        "UI_CONSTANTS.DEFAULT_THEME",
        "FILE_CONSTANTS.SUPPORTED_EXTENSIONS",
    ];

    for (const path of requiredConstants) {
        const value = getConfig(path);
        if (value === undefined) {
            errors.push(`Missing required configuration: ${path}`);
        }
    }

    // Check for reasonable values
    if (CONVERSION_FACTORS.METERS_PER_KILOMETER !== 1000) {
        errors.push("METERS_PER_KILOMETER should be 1000");
    }

    if (!UI_CONSTANTS.THEMES[UI_CONSTANTS.DEFAULT_THEME.toUpperCase()]) {
        warnings.push(`Default theme '${UI_CONSTANTS.DEFAULT_THEME}' not found in THEMES`);
    }

    return {
        errors,
        isValid: errors.length === 0,
        warnings,
    };
}

// Export all constants as a single object for convenience
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

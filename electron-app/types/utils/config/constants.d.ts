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
export function getConfig(path: string, defaultValue?: any): any;
/**
 * Initialize configuration system
 */
export function initializeConfig(): void;
/**
 * Validate configuration integrity
 * @returns {Object} Validation results
 */
export function validateConfig(): Object;
export namespace CONVERSION_FACTORS {
    let DECIMAL_PLACES: number;
    let DECIMAL_PLACES_PRECISE: number;
    let METERS_PER_KILOMETER: number;
    let METERS_PER_MILE: number;
    let METERS_TO_FEET: number;
    let SECONDS_PER_HOUR: number;
    let SECONDS_PER_MINUTE: number;
    let MILLISECONDS_PER_SECOND: number;
    let CELSIUS_TO_FAHRENHEIT_MULTIPLIER: number;
    let CELSIUS_TO_FAHRENHEIT_OFFSET: number;
    let MPS_TO_KMH: number;
    let MPS_TO_MPH: number;
    let KG_TO_POUNDS: number;
    let METERS_TO_INCHES: number;
    let INCHES_PER_FOOT: number;
}
export namespace DISTANCE_UNITS {
    let FEET: string;
    let KILOMETERS: string;
    let METERS: string;
    let MILES: string;
}
export namespace TIME_UNITS {
    let HOURS: string;
    let MILLISECONDS: string;
    let MINUTES: string;
    let SECONDS: string;
}
export namespace TEMPERATURE_UNITS {
    let CELSIUS: string;
    let FAHRENHEIT: string;
    let KELVIN: string;
}
export namespace UI_CONSTANTS {
    let DEFAULT_THEME: string;
    namespace THEMES {
        let DARK: string;
        let LIGHT: string;
        let SYSTEM: string;
    }
    namespace NOTIFICATION_TYPES {
        namespace ERROR {
            let ariaLabel: string;
            let duration: number;
            let icon: string;
            let type: string;
        }
        namespace INFO {
            let ariaLabel_1: string;
            export { ariaLabel_1 as ariaLabel };
            let duration_1: number;
            export { duration_1 as duration };
            let icon_1: string;
            export { icon_1 as icon };
            let type_1: string;
            export { type_1 as type };
        }
        namespace SUCCESS {
            let ariaLabel_2: string;
            export { ariaLabel_2 as ariaLabel };
            let duration_2: number;
            export { duration_2 as duration };
            let icon_2: string;
            export { icon_2 as icon };
            let type_2: string;
            export { type_2 as type };
        }
        namespace WARNING {
            let ariaLabel_3: string;
            export { ariaLabel_3 as ariaLabel };
            let duration_3: number;
            export { duration_3 as duration };
            let icon_3: string;
            export { icon_3 as icon };
            let type_3: string;
            export { type_3 as type };
        }
    }
    namespace DOM_IDS {
        let ACTIVE_FILE_NAME: string;
        let ACTIVE_FILE_NAME_CONTAINER: string;
        let ALT_FIT_IFRAME: string;
        let CONTENT_CHART: string;
        let CONTENT_DATA: string;
        let CONTENT_MAP: string;
        let CONTENT_SUMMARY: string;
        let DROP_OVERLAY: string;
        let NOTIFICATION: string;
        let TAB_CHART: string;
        let TAB_SUMMARY: string;
        let UNLOAD_FILE_BTN: string;
        let ZWIFT_IFRAME: string;
    }
    namespace CSS_CLASSES {
        let ACTIVE: string;
        let HIDDEN: string;
        let LOADING: string;
        let SHOW: string;
        let THEMED_BTN: string;
    }
    let ANIMATION_DURATION: number;
    let DEBOUNCE_DELAY: number;
    let SUMMARY_COLUMN_SELECTOR_DELAY: number;
    let SIDEBAR_WIDTH: number;
    let HEADER_HEIGHT: number;
}
export namespace FILE_CONSTANTS {
    let SUPPORTED_EXTENSIONS: string[];
    let SUPPORTED_MIME_TYPES: string[];
    let MAX_FILE_SIZE: number;
    namespace EXPORT_FORMATS {
        let CSV: string;
        let GPX: string;
        let JSON: string;
    }
    let DEFAULT_EXPORT_FORMAT: string;
    namespace IFRAME_PATHS {
        let ALT_FIT: string;
    }
}
export namespace CHART_CONSTANTS {
    let DEFAULT_ZOOM_LEVEL: number;
    let MAX_ZOOM_LEVEL: number;
    let MIN_ZOOM_LEVEL: number;
    namespace CHART_TYPES {
        let ALTITUDE: string;
        let ELEVATION: string;
        let GPS_TRACK: string;
        let HEART_RATE: string;
        let LAP_ZONE: string;
        let POWER: string;
        let SPEED: string;
    }
    let DEFAULT_CHART: string;
    namespace DEFAULT_COLORS {
        let PRIMARY: string;
        let SECONDARY: string;
    }
}
export namespace MAP_CONSTANTS {
    let DEFAULT_ZOOM: number;
    let DEFAULT_CENTER: number[];
    namespace PROVIDERS {
        let OPENSTREETMAP: string;
        let SATELLITE: string;
    }
    let DEFAULT_PROVIDER: string;
}
export namespace PERFORMANCE_CONSTANTS {
    let ENABLE_MONITORING: boolean;
    let MAX_HISTORY_SIZE: number;
    let MEMORY_CHECK_INTERVAL: number;
    let SLOW_OPERATION_THRESHOLD: number;
    namespace CATEGORIES {
        let CHARTS: string;
        let DATA_PROCESSING: string;
        let FILE_OPERATIONS: string;
        let STATE_MANAGEMENT: string;
        let UI_RENDERING: string;
    }
}
export namespace VALIDATION_CONSTANTS {
    let MIN_DISTANCE: number;
    let MAX_DISTANCE: number;
    let MIN_DURATION: number;
    let MAX_DURATION: number;
    let MIN_SPEED: number;
    let MAX_SPEED: number;
    let MAX_STRING_LENGTH: number;
    let MIN_STRING_LENGTH: number;
}
export namespace ERROR_CONSTANTS {
    namespace CODES {
        let FILE_NOT_FOUND: string;
        let INVALID_INPUT: string;
        let NETWORK_ERROR: string;
        let PARSE_ERROR: string;
        let PERMISSION_DENIED: string;
        let STATE_ERROR: string;
        let UNKNOWN_ERROR: string;
        let VALIDATION_ERROR: string;
    }
    namespace MESSAGES {
        let FILE_NOT_FOUND_1: string;
        export { FILE_NOT_FOUND_1 as FILE_NOT_FOUND };
        let INVALID_INPUT_1: string;
        export { INVALID_INPUT_1 as INVALID_INPUT };
        let NETWORK_ERROR_1: string;
        export { NETWORK_ERROR_1 as NETWORK_ERROR };
        let PARSE_ERROR_1: string;
        export { PARSE_ERROR_1 as PARSE_ERROR };
        let PERMISSION_DENIED_1: string;
        export { PERMISSION_DENIED_1 as PERMISSION_DENIED };
        let STATE_ERROR_1: string;
        export { STATE_ERROR_1 as STATE_ERROR };
        let UNKNOWN_ERROR_1: string;
        export { UNKNOWN_ERROR_1 as UNKNOWN_ERROR };
        let VALIDATION_ERROR_1: string;
        export { VALIDATION_ERROR_1 as VALIDATION_ERROR };
    }
}
export namespace DEBUG_CONSTANTS {
    export let ENABLED: boolean;
    export namespace LOG_LEVELS {
        export let DEBUG: string;
        let ERROR_1: string;
        export { ERROR_1 as ERROR };
        let INFO_1: string;
        export { INFO_1 as INFO };
        export let WARN: string;
    }
    export namespace CATEGORIES_1 {
        let CHARTS_1: string;
        export { CHARTS_1 as CHARTS };
        export let DATA: string;
        export let FILES: string;
        export let STATE: string;
        export let UI: string;
    }
    export { CATEGORIES_1 as CATEGORIES };
}
export namespace APP_CONSTANTS {
    let NAME: string;
    let VERSION: string;
    let AUTHOR: string;
    namespace IPC_CHANNELS {
        let APP_VERSION: string;
        let CHROME_VERSION: string;
        let DIALOG_OPEN_FILE: string;
        let ELECTRON_VERSION: string;
        let FILE_READ: string;
        let FIT_DECODE: string;
        let FIT_PARSE: string;
        let NODE_VERSION: string;
        let PLATFORM_INFO: string;
        let SHELL_OPEN_EXTERNAL: string;
        let THEME_GET: string;
    }
    namespace EVENTS {
        let INSTALL_UPDATE: string;
        let MENU_OPEN_FILE: string;
        let MENU_OPEN_OVERLAY: string;
        let SET_FULLSCREEN: string;
        let SET_THEME: string;
        let THEME_CHANGED: string;
    }
}
export namespace CONFIG {
    export { APP_CONSTANTS as APP };
    export { CHART_CONSTANTS as CHART };
    export { CONVERSION_FACTORS as CONVERSION };
    export { DEBUG_CONSTANTS as DEBUG };
    export { DISTANCE_UNITS };
    export { ERROR_CONSTANTS as ERROR };
    export { FILE_CONSTANTS as FILE };
    export { MAP_CONSTANTS as MAP };
    export { PERFORMANCE_CONSTANTS as PERFORMANCE };
    export { TEMPERATURE_UNITS };
    export { TIME_UNITS };
    export { UI_CONSTANTS as UI };
    export { VALIDATION_CONSTANTS as VALIDATION };
}
export type ConversionFactors = {
    /**
     * - Default decimal places for formatting
     */
    DECIMAL_PLACES: number;
    /**
     * - Conversion factor
     */
    METERS_PER_KILOMETER: number;
    /**
     * - Conversion factor
     */
    METERS_PER_MILE: number;
    /**
     * - Conversion factor
     */
    METERS_TO_FEET: number;
    /**
     * - Time conversion
     */
    SECONDS_PER_HOUR: number;
    /**
     * - Time conversion
     */
    SECONDS_PER_MINUTE: number;
};
export type UIConstants = {
    /**
     * - Default application theme
     */
    DEFAULT_THEME: string;
    /**
     * - Notification type configurations
     */
    NOTIFICATION_TYPES: Object;
    /**
     * - Common DOM element IDs
     */
    DOM_IDS: Object;
    /**
     * - Common CSS class names
     */
    CSS_CLASSES: Object;
    /**
     * - Default animation duration in ms
     */
    ANIMATION_DURATION: number;
};
export type FileConstants = {
    /**
     * - Supported file extensions
     */
    SUPPORTED_EXTENSIONS: string[];
    /**
     * - Maximum file size in bytes
     */
    MAX_FILE_SIZE: number;
    /**
     * - Default export format
     */
    DEFAULT_EXPORT_FORMAT: string;
};
//# sourceMappingURL=constants.d.ts.map
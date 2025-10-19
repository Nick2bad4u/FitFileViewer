/**
 * Shared constants for the Electron main process. Extracted from the legacy monolithic main.js
 * to help other modules consume configuration without re-defining values.
 */
const CONSTANTS = Object.freeze({
    DEFAULT_THEME: "dark",
    DIALOG_FILTERS: Object.freeze({
        ALL_FILES: Object.freeze([
            Object.freeze({ extensions: ["fit"], name: "FIT Files" }),
            Object.freeze({ extensions: ["*"], name: "All Files" }),
        ]),
        EXPORT_FILES: Object.freeze([
            Object.freeze({ extensions: ["csv"], name: "CSV (Summary Table)" }),
            Object.freeze({ extensions: ["gpx"], name: "GPX (Track)" }),
            Object.freeze({ extensions: ["*"], name: "All Files" }),
        ]),
        FIT_FILES: Object.freeze([Object.freeze({ extensions: ["fit"], name: "FIT Files" })]),
    }),
    LOG_LEVELS: Object.freeze({
        ERROR: "error",
        INFO: "info",
        WARN: "warn",
    }),
    PLATFORMS: Object.freeze({
        DARWIN: "darwin",
        LINUX: "linux",
        WIN32: "win32",
    }),
    SETTINGS_CONFIG_NAME: "settings",
    THEME_STORAGE_KEY: "ffv-theme",
    UPDATE_EVENTS: Object.freeze({
        AVAILABLE: "update-available",
        CHECKING: "update-checking",
        DOWNLOAD_PROGRESS: "update-download-progress",
        DOWNLOADED: "update-downloaded",
        ERROR: "update-error",
        NOT_AVAILABLE: "update-not-available",
    }),
});

module.exports = { CONSTANTS };

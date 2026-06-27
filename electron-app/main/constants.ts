/**
 * Shared constants for the Electron main process. Extracted from the legacy
 * monolithic main.js to help other modules consume configuration without
 * re-defining values.
 */
type DialogFilter = Readonly<{
    extensions: readonly string[];
    name: string;
}>;

type MainProcessConstants = Readonly<{
    DEFAULT_THEME: "dark";
    DIALOG_FILTERS: Readonly<{
        ALL_FILES: readonly DialogFilter[];
        EXPORT_FILES: readonly DialogFilter[];
        FIT_FILES: readonly DialogFilter[];
    }>;
    LOG_LEVELS: Readonly<{
        ERROR: "error";
        INFO: "info";
        WARN: "warn";
    }>;
    PLATFORMS: Readonly<{
        DARWIN: "darwin";
        LINUX: "linux";
        WIN32: "win32";
    }>;
    SETTINGS_CONFIG_NAME: "settings";
    THEME_STORAGE_KEY: "ffv-theme";
    UPDATE_EVENTS: Readonly<{
        AVAILABLE: "update-available";
        CHECKING: "update-checking";
        DOWNLOAD_PROGRESS: "update-download-progress";
        DOWNLOADED: "update-downloaded";
        ERROR: "update-error";
        NOT_AVAILABLE: "update-not-available";
    }>;
}>;

const freezeDialogFilter = (filter: DialogFilter): DialogFilter =>
    Object.freeze({
        extensions: Object.freeze([...filter.extensions]),
        name: filter.name,
    });

export const CONSTANTS: MainProcessConstants = Object.freeze({
    DEFAULT_THEME: "dark",
    DIALOG_FILTERS: Object.freeze({
        ALL_FILES: Object.freeze([
            freezeDialogFilter({ extensions: ["fit"], name: "FIT Files" }),
            freezeDialogFilter({ extensions: ["*"], name: "All Files" }),
        ]),
        EXPORT_FILES: Object.freeze([
            freezeDialogFilter({
                extensions: ["csv"],
                name: "CSV (Summary Table)",
            }),
            freezeDialogFilter({
                extensions: ["gpx"],
                name: "GPX (Track)",
            }),
            freezeDialogFilter({ extensions: ["*"], name: "All Files" }),
        ]),
        FIT_FILES: Object.freeze([
            freezeDialogFilter({ extensions: ["fit"], name: "FIT Files" }),
        ]),
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

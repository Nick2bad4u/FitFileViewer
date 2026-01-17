/**
 * Shared constants for the Electron main process. Extracted from the legacy monolithic main.js
 * to help other modules consume configuration without re-defining values.
 */
export const CONSTANTS: Readonly<{
    DEFAULT_THEME: "dark";
    DIALOG_FILTERS: Readonly<{
        ALL_FILES: readonly (
            | Readonly<{
                  extensions: string[];
                  name: "FIT Files";
              }>
            | Readonly<{
                  extensions: string[];
                  name: "All Files";
              }>
        )[];
        EXPORT_FILES: readonly (
            | Readonly<{
                  extensions: string[];
                  name: "CSV (Summary Table)";
              }>
            | Readonly<{
                  extensions: string[];
                  name: "GPX (Track)";
              }>
            | Readonly<{
                  extensions: string[];
                  name: "All Files";
              }>
        )[];
        FIT_FILES: readonly Readonly<{
            extensions: string[];
            name: "FIT Files";
        }>[];
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

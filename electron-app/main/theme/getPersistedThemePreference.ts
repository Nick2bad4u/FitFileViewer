import { CONSTANTS } from "../constants.js";
import { createElectronConf } from "../runtime/electronConfAccess.js";

interface ThemePreferenceStore {
    get: (key: string, fallback: unknown) => unknown;
}

function normalizeThemePreference(theme: unknown): string {
    const raw = typeof theme === "string" ? theme.trim().toLowerCase() : "";
    const normalized = raw === "system" ? "auto" : raw;
    return normalized === "dark" ||
        normalized === "light" ||
        normalized === "auto"
        ? normalized
        : CONSTANTS.DEFAULT_THEME;
}

/**
 * Fetches the persisted theme from the main-process settings store.
 */
export async function getPersistedThemePreference(): Promise<string> {
    try {
        const conf = createElectronConf<ThemePreferenceStore>({
            name: CONSTANTS.SETTINGS_CONFIG_NAME,
        });
        if (!conf) {
            throw new TypeError("electron-conf unavailable");
        }

        return normalizeThemePreference(
            conf.get("theme", CONSTANTS.DEFAULT_THEME)
        );
    } catch (error) {
        console.error("[main.js] Failed to get persisted theme:", error);
        return CONSTANTS.DEFAULT_THEME;
    }
}

export default { getPersistedThemePreference };

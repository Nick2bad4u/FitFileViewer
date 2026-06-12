import { CONSTANTS } from "../constants.js";
import { validateWindow } from "../window/windowValidation.js";

interface ThemeWindowCandidate {
    isDestroyed?: () => boolean;
    webContents?: {
        executeJavaScript: (script: string) => Promise<unknown>;
        isDestroyed?: () => boolean;
    };
}

type UsableThemeWindow = ThemeWindowCandidate & {
    webContents: {
        executeJavaScript: (script: string) => Promise<unknown>;
    };
};

const validateThemeWindow = validateWindow as (
    win?: null | ThemeWindowCandidate,
    context?: string
) => win is UsableThemeWindow;

/**
 * Fetches the persisted theme from the renderer by reading localStorage. The
 * helper is resilient to missing BrowserWindow instances so Jasmine/Vitest
 * environments without a DOM do not crash.
 */
export async function getThemeFromRenderer(
    win?: null | ThemeWindowCandidate
): Promise<string> {
    if (!validateThemeWindow(win, "theme retrieval")) {
        return CONSTANTS.DEFAULT_THEME;
    }

    try {
        const theme = await win.webContents.executeJavaScript(
            `localStorage.getItem("${CONSTANTS.THEME_STORAGE_KEY}")`
        );
        return typeof theme === "string" && theme
            ? theme
            : CONSTANTS.DEFAULT_THEME;
    } catch (error) {
        console.error("[main.js] Failed to get theme from renderer:", error);
        return CONSTANTS.DEFAULT_THEME;
    }
}

export default { getThemeFromRenderer };

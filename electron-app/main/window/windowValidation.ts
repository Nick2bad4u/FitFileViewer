import { logWithContext } from "../logging/logWithContext.js";
import { isAppQuitting } from "../state/appState.js";

interface WindowUsabilityCandidate {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
    };
}

/**
 * Determines whether the provided BrowserWindow is still usable.
 *
 * @returns True when the window and its webContents remain alive.
 */
export function isWindowUsable(
    win?: null | WindowUsabilityCandidate
): win is WindowUsabilityCandidate & {
    isDestroyed: () => boolean;
    webContents: { isDestroyed: () => boolean };
} {
    if (!win) {
        return false;
    }

    try {
        if (!win.webContents) {
            return false;
        }

        const webContentsDestroyed =
            typeof win.webContents.isDestroyed === "function"
                ? win.webContents.isDestroyed()
                : true;
        const windowDestroyed =
            typeof win.isDestroyed === "function" ? win.isDestroyed() : true;

        return !windowDestroyed && !webContentsDestroyed;
    } catch {
        return false;
    }
}

/**
 * Validates that a BrowserWindow is usable and logs a structured warning when
 * it is not.
 *
 * @param context - Description of the operation requiring the window.
 *
 * @returns True when the window can be used.
 */
export function validateWindow(
    win?: null | WindowUsabilityCandidate,
    context = "unknown operation"
): boolean {
    if (isWindowUsable(win)) {
        return true;
    }

    if (!isAppQuitting()) {
        logWithContext("warn", `Window validation failed during ${context}`, {
            hasWebContents: Boolean(win?.webContents),
            hasWindow: Boolean(win),
            isDestroyed: win?.isDestroyed?.(),
            webContentsDestroyed: win?.webContents?.isDestroyed?.(),
        });
    }

    return false;
}

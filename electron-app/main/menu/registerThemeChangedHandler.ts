import { CONSTANTS as DEFAULT_CONSTANTS } from "../constants.js";
import { createElectronConf } from "../runtime/electronConfAccess.js";
import { getLoadedFitFilePath as getDefaultLoadedFitFilePath } from "../state/appState.js";

type BrowserWindow = import("electron").BrowserWindow;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
}

interface ConfStore {
    set: (key: string, value: unknown) => void;
}

interface ThemeChangedConstants {
    DEFAULT_THEME: string;
    SETTINGS_CONFIG_NAME: string;
}

interface IpcEventLike {
    sender: unknown;
}

type RegisterThemeChangedIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: (event: unknown, ...args: unknown[]) => unknown
) => void;

interface RegisterThemeChangedHandlerOptions {
    browserWindowRef: () => BrowserWindowRefLike | null | undefined;
    constants?: ThemeChangedConstants;
    createConf?: (options: { name: string }) => ConfStore | null | undefined;
    getLoadedFitFilePath?: () => string | null | undefined;
    registerIpcListener: RegisterThemeChangedIpcListener;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
    validateWindow: (win: BrowserWindow, context: string) => boolean;
}

function getThemeFromPayload(
    theme: unknown,
    constants: ThemeChangedConstants
): string {
    return typeof theme === "string" && theme ? theme : constants.DEFAULT_THEME;
}

function normalizePersistedTheme(theme: unknown): string | null {
    const raw = typeof theme === "string" ? theme.trim().toLowerCase() : "";
    const normalized = raw === "system" ? "auto" : raw;
    return normalized === "dark" ||
        normalized === "light" ||
        normalized === "auto"
        ? normalized
        : null;
}

function persistThemeForMenu(
    theme: unknown,
    constants: ThemeChangedConstants,
    createConf: (options: { name: string }) => ConfStore | null | undefined
): void {
    const normalized = normalizePersistedTheme(theme);
    if (!normalized) {
        return;
    }

    const conf = createConf({
        name: constants.SETTINGS_CONFIG_NAME,
    });
    if (!conf) {
        return;
    }
    conf.set("theme", normalized);
}

/**
 * Registers the main-process handler for renderer theme-change notifications.
 */
export function registerThemeChangedHandler({
    browserWindowRef,
    constants = DEFAULT_CONSTANTS,
    createConf = createElectronConf,
    getLoadedFitFilePath = getDefaultLoadedFitFilePath,
    registerIpcListener,
    safeCreateAppMenu,
    validateWindow,
}: RegisterThemeChangedHandlerOptions): void {
    if (typeof registerIpcListener !== "function") {
        return;
    }

    registerIpcListener("theme-changed", (event, theme) => {
        const win =
            browserWindowRef()?.fromWebContents(
                (event as IpcEventLike).sender
            ) ?? null;
        if (!win || !validateWindow(win, "theme-changed event")) {
            return;
        }

        // Persist the theme in main-process settings so `theme:get` stays in
        // sync with renderer localStorage.
        try {
            persistThemeForMenu(theme, constants, createConf);
        } catch {
            // Best-effort persistence; menu creation should still proceed.
        }

        safeCreateAppMenu(
            win,
            getThemeFromPayload(theme, constants),
            getLoadedFitFilePath()
        );
    });
}

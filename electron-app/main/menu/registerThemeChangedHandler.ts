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

type MainProcessIpcListener = (event: unknown, ...args: unknown[]) => unknown;
type ThemeChangedIpcCallback = (event: IpcEventLike, theme: unknown) => void;
type RegisterThemeChangedIpcListener = (
    channel: MainProcessIpcEventChannel,
    listener: MainProcessIpcListener
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

function toIpcEventLike(event: unknown): IpcEventLike | null {
    return event && typeof event === "object" && "sender" in event
        ? { sender: event.sender }
        : null;
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

    const handleThemeChanged: ThemeChangedIpcCallback = (event, theme) => {
        const win =
            browserWindowRef()?.fromWebContents(event.sender) ?? null;
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
    };

    registerIpcListener("theme-changed", (event, theme) => {
        const eventLike = toIpcEventLike(event);
        if (eventLike) {
            handleThemeChanged(eventLike, theme);
        }
    });
}

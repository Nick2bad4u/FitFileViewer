import { validateDevtoolsInjectMenuPayload as validateDefaultDevtoolsInjectMenuPayload } from "../../shared/devtoolsMenuPolicy.js";
import { CONSTANTS as DEFAULT_CONSTANTS } from "../constants.js";
import { logWithContext as defaultLogWithContext } from "../logging/logWithContext.js";
import {
    isDevelopmentEnvironment,
    isTestEnvironment,
} from "../../utils/runtime/processEnvironment.js";

type BrowserWindow = import("electron").BrowserWindow;
type DevtoolsInjectMenuFitFilePath =
    import("../../shared/ipc").DevtoolsInjectMenuFitFilePath;
type DevtoolsInjectMenuResponse =
    import("../../shared/ipc").DevtoolsInjectMenuResponse;
type DevtoolsInjectMenuTheme =
    import("../../shared/ipc").DevtoolsInjectMenuTheme;
type GenericInvokeChannel = import("../../shared/ipc").GenericInvokeChannel;

interface BrowserWindowRefLike {
    fromWebContents: (webContents: unknown) => BrowserWindow | null;
}

interface DevtoolsInjectMenuConstants {
    DEFAULT_THEME: string;
}

interface IpcEventLike {
    sender: unknown;
}

interface ValidatedDevtoolsInjectMenuPayload {
    fitFilePath: DevtoolsInjectMenuFitFilePath;
    theme: DevtoolsInjectMenuTheme;
}

type RegisterDevtoolsInjectMenuIpcHandle = (
    channel: GenericInvokeChannel,
    handler: (event: unknown, ...args: unknown[]) => unknown
) => void;

interface RegisterDevtoolsInjectMenuHandlerOptions {
    browserWindowRef: () => BrowserWindowRefLike | null | undefined;
    constants?: DevtoolsInjectMenuConstants;
    isDevtoolsMenuInjectionAllowed?: () => boolean;
    logWithContext?: (
        level: string,
        message: string,
        context?: Record<string, unknown>
    ) => void;
    registerIpcHandle: RegisterDevtoolsInjectMenuIpcHandle;
    safeCreateAppMenu: (
        win: BrowserWindow,
        theme: string,
        loadedFitFilePath?: string | null
    ) => void;
    validateDevtoolsInjectMenuPayload?: (
        theme: unknown,
        fitFilePath: unknown
    ) => ValidatedDevtoolsInjectMenuPayload;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function defaultIsDevtoolsMenuInjectionAllowed(): boolean {
    return isDevelopmentEnvironment() || isTestEnvironment();
}

/**
 * Registers the development-only handler for manually injecting an app menu.
 */
export function registerDevtoolsInjectMenuHandler({
    browserWindowRef,
    constants = DEFAULT_CONSTANTS,
    isDevtoolsMenuInjectionAllowed = defaultIsDevtoolsMenuInjectionAllowed,
    logWithContext = defaultLogWithContext,
    registerIpcHandle,
    safeCreateAppMenu,
    validateDevtoolsInjectMenuPayload = validateDefaultDevtoolsInjectMenuPayload,
}: RegisterDevtoolsInjectMenuHandlerOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle(
        "devtools-inject-menu",
        (event, theme, fitFilePath): DevtoolsInjectMenuResponse => {
            if (!isDevtoolsMenuInjectionAllowed()) {
                logWithContext(
                    "warn",
                    "Blocked devtools menu injection outside development"
                );
                return false;
            }

            let payload: ValidatedDevtoolsInjectMenuPayload;
            try {
                payload = validateDevtoolsInjectMenuPayload(theme, fitFilePath);
            } catch (error) {
                logWithContext(
                    "warn",
                    "Blocked devtools menu injection with invalid payload",
                    { error: getErrorMessage(error) }
                );
                return false;
            }

            const filePath = payload.fitFilePath;
            const resolvedTheme = payload.theme ?? constants.DEFAULT_THEME;
            const win =
                browserWindowRef()?.fromWebContents(
                    (event as IpcEventLike).sender
                ) ?? null;

            logWithContext("info", "Manual menu injection requested", {
                fitFilePath: filePath,
                theme: resolvedTheme,
            });
            if (win) {
                safeCreateAppMenu(win, resolvedTheme, filePath);
            }

            return true;
        }
    );
}

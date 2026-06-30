import { validateDevtoolsInjectMenuPayload as validateDefaultDevtoolsInjectMenuPayload } from "../../shared/devtoolsMenuPolicy.js";
import { CONSTANTS as DEFAULT_CONSTANTS } from "../constants.js";
import { logWithContext as defaultLogWithContext } from "../logging/logWithContext.js";
import {
    getRegisterDevtoolsInjectMenuHandlerRuntime,
    type RegisterDevtoolsInjectMenuHandlerRuntime,
} from "./registerDevtoolsInjectMenuHandlerRuntime.js";

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

type MainProcessIpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type DevtoolsInjectMenuIpcHandler = (
    event: IpcEventLike,
    theme: unknown,
    fitFilePath: unknown
) => DevtoolsInjectMenuResponse;
type RegisterDevtoolsInjectMenuIpcHandle = (
    channel: GenericInvokeChannel,
    handler: MainProcessIpcHandler
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

function registerDevtoolsInjectMenuHandlerRuntime(): RegisterDevtoolsInjectMenuHandlerRuntime {
    return getRegisterDevtoolsInjectMenuHandlerRuntime();
}

function defaultIsDevtoolsMenuInjectionAllowed(): boolean {
    const runtime = registerDevtoolsInjectMenuHandlerRuntime();
    return runtime.isDevelopmentEnvironment() || runtime.isTestEnvironment();
}

function toIpcEventLike(event: unknown): IpcEventLike | null {
    return event && typeof event === "object" && "sender" in event
        ? { sender: event.sender }
        : null;
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

    const handleDevtoolsInjectMenu: DevtoolsInjectMenuIpcHandler = (
        event,
        theme,
        fitFilePath
    ) => {
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
        const win = browserWindowRef()?.fromWebContents(event.sender) ?? null;

        logWithContext("info", "Manual menu injection requested", {
            fitFilePath: filePath,
            theme: resolvedTheme,
        });
        if (win) {
            safeCreateAppMenu(win, resolvedTheme, filePath);
        }

        return true;
    };

    registerIpcHandle("devtools-inject-menu", (event, theme, fitFilePath) => {
        const eventLike = toIpcEventLike(event);
        return eventLike
            ? handleDevtoolsInjectMenu(eventLike, theme, fitFilePath)
            : false;
    });
}

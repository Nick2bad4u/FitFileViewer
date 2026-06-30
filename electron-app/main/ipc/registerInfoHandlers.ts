import {
    getRegisterInfoHandlersRuntime,
    type RegisterInfoHandlersProcessStringName,
    type RegisterInfoHandlersRuntime,
} from "./registerInfoHandlersRuntime.js";
import { createElectronConf } from "../runtime/electronConfAccess.js";

type InfoInvokeChannel = import("../../shared/ipc").InfoInvokeChannel;
type InfoPlatformResponse = import("../../shared/ipc").InfoPlatformResponse;
type InfoStringResponse = import("../../shared/ipc").InfoStringResponse;
type InvokeRequestArgs<Channel extends InfoInvokeChannel> =
    import("../../shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends InfoInvokeChannel> =
    import("../../shared/ipc").InvokeResponsePayloadForChannel<Channel>;
type MapTabSelectionResponse =
    import("../../shared/ipc").MapTabSelectionResponse;
type ThemePreferenceResponse =
    import("../../shared/ipc").ThemePreferenceResponse;

interface AppInfoProvider {
    getAppPath?: () => string;
    getVersion?: () => string;
}

interface FileReader {
    promises?: {
        readFile?: (path: string, encoding: BufferEncoding) => Promise<string>;
    };
    readFileSync?: (path: string) => Buffer | string;
}

interface PathJoiner {
    join: (...paths: string[]) => string;
}

interface InfoConstants {
    DEFAULT_THEME: string;
    SETTINGS_CONFIG_NAME: string;
}

interface ConfStore {
    get: (key: string, fallback: unknown) => unknown;
}

type ConfConstructor = new (options: { name: string }) => ConfStore;

interface ElectronConfModule {
    Conf: ConfConstructor;
}

type InfoChannelHandler<Channel extends InfoInvokeChannel> = (
    ...args: InvokeRequestArgs<Channel>
) =>
    | InvokeResponsePayloadForChannel<Channel>
    | Promise<InvokeResponsePayloadForChannel<Channel>>;

type InfoIpcHandler<Channel extends InfoInvokeChannel> = (
    event: unknown,
    ...args: InvokeRequestArgs<Channel>
) =>
    | InvokeResponsePayloadForChannel<Channel>
    | Promise<InvokeResponsePayloadForChannel<Channel>>;

type InfoIpcCallback = (
    event: unknown,
    ...args: unknown[]
) => unknown;

type RegisterInfoIpcHandle = (
    channel: InfoInvokeChannel,
    handler: InfoIpcCallback
) => void;

type InfoHandlerMap = {
    [Channel in InfoInvokeChannel]: InfoChannelHandler<Channel>;
};

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

function registerInfoHandlersRuntime(): RegisterInfoHandlersRuntime {
    return getRegisterInfoHandlersRuntime();
}

const INFO_INVOKE_CHANNELS = [
    "getAppVersion",
    "getChromeVersion",
    "getElectronVersion",
    "getLicenseInfo",
    "getNodeVersion",
    "getPlatformInfo",
    "map-tab:get",
    "theme:get",
] as const satisfies readonly InfoInvokeChannel[];

interface RegisterInfoHandlersOptions {
    appRef: () => AppInfoProvider | null | undefined;
    confModule?: ElectronConfModule;
    CONSTANTS: InfoConstants;
    fs: FileReader | null;
    logWithContext?: LogWithContext;
    path: PathJoiner;
    registerIpcHandle: RegisterInfoIpcHandle;
}

interface PackageMetadata {
    license?: unknown;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

function normalizeMapTab(value: unknown): MapTabSelectionResponse {
    const tab = typeof value === "string" ? value.trim() : "";
    // Conservative: only allow simple identifier-like tab names.
    if (/^[\w-]{1,32}$/u.test(tab)) {
        return tab;
    }
    return "map";
}

/**
 * Registers IPC handlers that expose platform and application metadata.
 */
export function registerInfoHandlers({
    registerIpcHandle,
    appRef,
    fs,
    path,
    CONSTANTS,
    logWithContext,
    confModule,
}: RegisterInfoHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    const safeConfGet = <T>(
        key: string,
        fallback: T,
        normalize: (value: unknown) => T
    ): T => {
        try {
            const conf = confModule
                ? new confModule.Conf({
                      name: CONSTANTS.SETTINGS_CONFIG_NAME,
                  })
                : createElectronConf<ConfStore>({
                      name: CONSTANTS.SETTINGS_CONFIG_NAME,
                  });
            if (!conf) {
                throw new TypeError("electron-conf unavailable");
            }
            const value = conf.get(key, fallback);
            return normalize(value);
        } catch (error) {
            logWithContext?.(
                "warn",
                `Failed to read persisted setting: ${key}`,
                {
                    error: getErrorMessage(error),
                }
            );
            return normalize(fallback);
        }
    };

    const normalizeTheme = (value: unknown): ThemePreferenceResponse => {
        const theme =
            typeof value === "string" ? value.trim().toLowerCase() : "";
        return theme === "dark" || theme === "light" || theme === "auto"
            ? theme
            : CONSTANTS.DEFAULT_THEME;
    };

    const handlers: InfoHandlerMap = {
        getAppVersion: (): InfoStringResponse => {
            const app = appRef();
            return app && typeof app.getVersion === "function"
                ? app.getVersion()
                : "";
        },
        getChromeVersion: (): InfoStringResponse =>
            getProcessVersionValue("chrome") ?? "",
        getElectronVersion: (): InfoStringResponse =>
            getProcessVersionValue("electron") ?? "",
        getLicenseInfo: async (): Promise<InfoStringResponse> => {
            try {
                const app = appRef();
                const basePath =
                    app && typeof app.getAppPath === "function"
                        ? app.getAppPath()
                        : (getProcessCurrentWorkingDirectory() ?? ".");
                const readFile = fs?.promises?.readFile;
                if (typeof readFile !== "function") {
                    throw new TypeError("Filesystem module unavailable");
                }
                const pkgPath = path.join(basePath, "package.json");
                const packageJsonText = await readFile(pkgPath, "utf8");
                const packageJson: unknown = JSON.parse(packageJsonText);
                return isPackageMetadata(packageJson) &&
                    typeof packageJson.license === "string"
                    ? packageJson.license
                    : "Unknown";
            } catch (error) {
                logWithContext?.(
                    "error",
                    "Failed to read license from package.json:",
                    {
                        error: getErrorMessage(error),
                    }
                );
                return "Unknown";
            }
        },
        getNodeVersion: (): InfoStringResponse =>
            getProcessVersionValue("node") ?? "",
        getPlatformInfo: (): InfoPlatformResponse => ({
            arch: getProcessStringValue("arch") ?? "",
            platform: getProcessStringValue("platform") ?? "",
        }),
        "map-tab:get": () =>
            safeConfGet("selectedMapTab", "map", normalizeMapTab),
        "theme:get": () =>
            safeConfGet("theme", CONSTANTS.DEFAULT_THEME, normalizeTheme),
    };

    const registerInfoIpcHandle = <Channel extends InfoInvokeChannel>(
        channel: Channel,
        handler: InfoIpcHandler<Channel>
    ): void => {
        registerIpcHandle(channel, handler as InfoIpcCallback);
    };

    for (const channel of INFO_INVOKE_CHANNELS) {
        const handler = handlers[channel];
        registerInfoIpcHandle(channel, async (_event, ...args) => {
            try {
                return await handler(...args);
            } catch (error) {
                logWithContext?.("error", `Error in ${channel}:`, {
                    error: getErrorMessage(error),
                });
                throw error;
            }
        });
    }
}

function isPackageMetadata(value: unknown): value is PackageMetadata {
    return value !== null && typeof value === "object";
}

function getProcessCurrentWorkingDirectory(): string | undefined {
    return registerInfoHandlersRuntime().getProcessCurrentWorkingDirectory();
}

function getProcessStringValue(
    name: RegisterInfoHandlersProcessStringName
): string | undefined {
    return registerInfoHandlersRuntime().getProcessStringValue(name);
}

function getProcessVersionValue(name: string): string | undefined {
    return registerInfoHandlersRuntime().getProcessVersionValue(name);
}

type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
type InfoInvokeChannel = import("../shared/ipc").InfoInvokeChannel;

interface ThemeApiChannels {
    THEME_GET: Extract<InfoInvokeChannel, "theme:get">;
}

interface ThemeApiOptions {
    channels: ThemeApiChannels;
    createSafeInvokeHandler: (
        channel: GenericInvokeChannel,
        methodName: string
    ) => (...args: unknown[]) => Promise<unknown>;
}

type ThemePreloadApi = Pick<ElectronAPI, "getTheme">;

export function createThemeApi({
    channels,
    createSafeInvokeHandler,
}: ThemeApiOptions): ThemePreloadApi {
    return {
        getTheme: createSafeInvokeHandler(
            channels.THEME_GET,
            "getTheme"
        ) as ElectronAPI["getTheme"],
    };
}

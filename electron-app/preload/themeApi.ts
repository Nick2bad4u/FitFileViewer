type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type CreateThemeApiOptions =
    import("./preloadModuleTypes").CreateThemeApiOptions;

type ThemePreloadApi = Pick<ElectronAPI, "getTheme">;

export function createThemeApi({
    channels,
    createSafeInvokeHandler,
}: CreateThemeApiOptions): ThemePreloadApi {
    return {
        getTheme: createSafeInvokeHandler(channels.THEME_GET, "getTheme"),
    };
}

type ElectronThemeApi = import("../shared/preloadApi").ElectronThemeApi;
type CreateThemeApiOptions =
    import("./preloadModuleTypes").CreateThemeApiOptions;

export function createThemeApi({
    channels,
    createSafeInvokeHandler,
}: CreateThemeApiOptions): ElectronThemeApi {
    return {
        getTheme: createSafeInvokeHandler(channels.THEME_GET, "getTheme"),
    };
}

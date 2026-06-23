type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type CreateAppInfoApiOptions =
    import("./preloadModuleTypes").CreateAppInfoApiOptions;

type AppInfoPreloadApi = Pick<
    ElectronAPI,
    | "getAppVersion"
    | "getChromeVersion"
    | "getElectronVersion"
    | "getLicenseInfo"
    | "getNodeVersion"
    | "getPlatformInfo"
>;

export function createAppInfoApi({
    channels,
    createSafeInvokeHandler,
}: CreateAppInfoApiOptions): AppInfoPreloadApi {
    return {
        getAppVersion: createSafeInvokeHandler(
            channels.APP_VERSION,
            "getAppVersion"
        ),
        getChromeVersion: createSafeInvokeHandler(
            channels.CHROME_VERSION,
            "getChromeVersion"
        ),
        getElectronVersion: createSafeInvokeHandler(
            channels.ELECTRON_VERSION,
            "getElectronVersion"
        ),
        getLicenseInfo: createSafeInvokeHandler(
            channels.LICENSE_INFO,
            "getLicenseInfo"
        ),
        getNodeVersion: createSafeInvokeHandler(
            channels.NODE_VERSION,
            "getNodeVersion"
        ),
        getPlatformInfo: createSafeInvokeHandler(
            channels.PLATFORM_INFO,
            "getPlatformInfo"
        ),
    };
}

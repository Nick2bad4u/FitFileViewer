type ElectronAppInfoApi = import("../shared/preloadApi").ElectronAppInfoApi;
type CreateAppInfoApiOptions =
    import("./preloadModuleTypes").CreateAppInfoApiOptions;

export function createAppInfoApi({
    channels,
    createSafeInvokeHandler,
}: CreateAppInfoApiOptions): ElectronAppInfoApi {
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

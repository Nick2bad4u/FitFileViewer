type ElectronAppInfoApi = import("../shared/preloadApi").ElectronAppInfoApi;
type ElectronThemeApi = import("../shared/preloadApi").ElectronThemeApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiAppInfoDomain({
    appInfoApi,
    themeApi,
}: Pick<
    ElectronApiFactoryOptions,
    "appInfoApi" | "themeApi"
>): ElectronAppInfoApi & ElectronThemeApi {
    return {
        getAppVersion: appInfoApi.getAppVersion,
        getChromeVersion: appInfoApi.getChromeVersion,
        getElectronVersion: appInfoApi.getElectronVersion,
        getLicenseInfo: appInfoApi.getLicenseInfo,
        getNodeVersion: appInfoApi.getNodeVersion,
        getPlatformInfo: appInfoApi.getPlatformInfo,
        getTheme: themeApi.getTheme,
    };
}

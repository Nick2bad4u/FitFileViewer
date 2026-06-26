type ElectronAppInfoApi = import("../shared/preloadApi").ElectronAppInfoApi;
type ElectronThemeApi = import("../shared/preloadApi").ElectronThemeApi;

export interface ElectronApiAppInfoDomainOptions {
    appInfoApi: ElectronAppInfoApi;
    themeApi: ElectronThemeApi;
}

export function createElectronApiAppInfoDomain({
    appInfoApi,
    themeApi,
}: ElectronApiAppInfoDomainOptions): ElectronAppInfoApi & ElectronThemeApi {
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

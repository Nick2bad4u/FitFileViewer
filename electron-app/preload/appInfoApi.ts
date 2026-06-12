type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
type InfoInvokeChannel = import("../shared/ipc").InfoInvokeChannel;

interface AppInfoApiChannels {
    APP_VERSION: Extract<InfoInvokeChannel, "getAppVersion">;
    CHROME_VERSION: Extract<InfoInvokeChannel, "getChromeVersion">;
    ELECTRON_VERSION: Extract<InfoInvokeChannel, "getElectronVersion">;
    LICENSE_INFO: Extract<InfoInvokeChannel, "getLicenseInfo">;
    NODE_VERSION: Extract<InfoInvokeChannel, "getNodeVersion">;
    PLATFORM_INFO: Extract<InfoInvokeChannel, "getPlatformInfo">;
}

interface AppInfoApiOptions {
    channels: AppInfoApiChannels;
    createSafeInvokeHandler: (
        channel: GenericInvokeChannel,
        methodName: string
    ) => (...args: unknown[]) => Promise<unknown>;
}

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
}: AppInfoApiOptions): AppInfoPreloadApi {
    return {
        getAppVersion: createSafeInvokeHandler(
            channels.APP_VERSION,
            "getAppVersion"
        ) as ElectronAPI["getAppVersion"],
        getChromeVersion: createSafeInvokeHandler(
            channels.CHROME_VERSION,
            "getChromeVersion"
        ) as ElectronAPI["getChromeVersion"],
        getElectronVersion: createSafeInvokeHandler(
            channels.ELECTRON_VERSION,
            "getElectronVersion"
        ) as ElectronAPI["getElectronVersion"],
        getLicenseInfo: createSafeInvokeHandler(
            channels.LICENSE_INFO,
            "getLicenseInfo"
        ) as ElectronAPI["getLicenseInfo"],
        getNodeVersion: createSafeInvokeHandler(
            channels.NODE_VERSION,
            "getNodeVersion"
        ) as ElectronAPI["getNodeVersion"],
        getPlatformInfo: createSafeInvokeHandler(
            channels.PLATFORM_INFO,
            "getPlatformInfo"
        ) as ElectronAPI["getPlatformInfo"],
    };
}

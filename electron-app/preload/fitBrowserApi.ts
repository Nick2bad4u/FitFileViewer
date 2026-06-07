{
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type FitBrowserInvokeChannel =
        import("../shared/ipc").FitBrowserInvokeChannel;
    type FitBrowserListFolderRequest =
        import("../shared/ipc").FitBrowserListFolderRequest;
    type FitBrowserListFolderResponse =
        import("../shared/ipc").FitBrowserListFolderResponse;
    type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;

    type UnknownCallback = (...args: unknown[]) => unknown;

    interface FitBrowserApiChannels {
        FIT_BROWSER_ENABLED_CHANGED: string;
        FIT_BROWSER_GET_FOLDER: Extract<
            FitBrowserInvokeChannel,
            "browser:getFolder"
        >;
        FIT_BROWSER_IS_ENABLED: Extract<
            FitBrowserInvokeChannel,
            "browser:isEnabled"
        >;
        FIT_BROWSER_LIST_FOLDER: Extract<
            FitBrowserInvokeChannel,
            "browser:listFolder"
        >;
        FIT_BROWSER_SET_ENABLED: Extract<
            FitBrowserInvokeChannel,
            "browser:setEnabled"
        >;
        FIT_BROWSER_SET_FOLDER: Extract<
            FitBrowserInvokeChannel,
            "browser:setFolder"
        >;
    }

    interface FitBrowserApiOptions {
        channels: FitBrowserApiChannels;
        createSafeEventHandler: (
            channel: string,
            methodName: string,
            transform?: (...args: IpcResponsePayload[]) => boolean
        ) => (callback: UnknownCallback) => () => void;
        createSafeInvokeHandler: (
            channel: FitBrowserInvokeChannel,
            methodName: string
        ) => (...args: unknown[]) => Promise<unknown>;
    }

    type FitBrowserPreloadApi = Pick<
        ElectronAPI,
        | "getFitBrowserFolder"
        | "isFitBrowserEnabled"
        | "listFitBrowserFolder"
        | "onFitBrowserEnabledChanged"
        | "setFitBrowserEnabled"
        | "setFitBrowserFolder"
    >;

    function createFitBrowserApi({
        channels,
        createSafeEventHandler,
        createSafeInvokeHandler,
    }: FitBrowserApiOptions): FitBrowserPreloadApi {
        const listFitBrowserFolder = createSafeInvokeHandler(
            channels.FIT_BROWSER_LIST_FOLDER,
            "listFitBrowserFolder"
        );

        return {
            getFitBrowserFolder: createSafeInvokeHandler(
                channels.FIT_BROWSER_GET_FOLDER,
                "getFitBrowserFolder"
            ) as ElectronAPI["getFitBrowserFolder"],
            isFitBrowserEnabled: createSafeInvokeHandler(
                channels.FIT_BROWSER_IS_ENABLED,
                "isFitBrowserEnabled"
            ) as ElectronAPI["isFitBrowserEnabled"],
            listFitBrowserFolder: ((relPath?: FitBrowserListFolderRequest) =>
                listFitBrowserFolder(relPath ?? "")) as (
                relPath?: FitBrowserListFolderRequest
            ) => Promise<FitBrowserListFolderResponse>,
            onFitBrowserEnabledChanged: createSafeEventHandler(
                channels.FIT_BROWSER_ENABLED_CHANGED,
                "onFitBrowserEnabledChanged",
                (enabled: IpcResponsePayload) => enabled === true
            ) as ElectronAPI["onFitBrowserEnabledChanged"],
            setFitBrowserEnabled: createSafeInvokeHandler(
                channels.FIT_BROWSER_SET_ENABLED,
                "setFitBrowserEnabled"
            ) as ElectronAPI["setFitBrowserEnabled"],
            setFitBrowserFolder: createSafeInvokeHandler(
                channels.FIT_BROWSER_SET_FOLDER,
                "setFitBrowserFolder"
            ) as ElectronAPI["setFitBrowserFolder"],
        };
    }

    module.exports = {
        createFitBrowserApi,
    };
}

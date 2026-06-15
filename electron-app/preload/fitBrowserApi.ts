type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type FitBrowserInvokeChannel = import("../shared/ipc").FitBrowserInvokeChannel;
type FitBrowserListFolderRequest =
    import("../shared/ipc").FitBrowserListFolderRequest;
type FitBrowserListFolderResponse =
    import("../shared/ipc").FitBrowserListFolderResponse;
type FitBrowserSetEnabledRequest =
    import("../shared/ipc").FitBrowserSetEnabledRequest;
type FitBrowserSetEnabledResponse =
    import("../shared/ipc").FitBrowserEnabledResponse;
type FitBrowserSetFolderRequest =
    import("../shared/ipc").FitBrowserSetFolderRequest;
type FitBrowserSetFolderResponse =
    import("../shared/ipc").FitBrowserSetFolderResponse;
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

function rejectInvalidArgument(
    methodName: string,
    message: string
): Promise<never> {
    return Promise.reject(new TypeError(`${methodName}: ${message}`));
}

export function createFitBrowserApi({
    channels,
    createSafeEventHandler,
    createSafeInvokeHandler,
}: FitBrowserApiOptions): FitBrowserPreloadApi {
    const listFitBrowserFolder = createSafeInvokeHandler(
        channels.FIT_BROWSER_LIST_FOLDER,
        "listFitBrowserFolder"
    );
    const getFitBrowserFolder = createSafeInvokeHandler(
        channels.FIT_BROWSER_GET_FOLDER,
        "getFitBrowserFolder"
    );
    const isFitBrowserEnabled = createSafeInvokeHandler(
        channels.FIT_BROWSER_IS_ENABLED,
        "isFitBrowserEnabled"
    );
    const setFitBrowserEnabled = createSafeInvokeHandler(
        channels.FIT_BROWSER_SET_ENABLED,
        "setFitBrowserEnabled"
    );
    const setFitBrowserFolder = createSafeInvokeHandler(
        channels.FIT_BROWSER_SET_FOLDER,
        "setFitBrowserFolder"
    );

    return {
        getFitBrowserFolder:
            getFitBrowserFolder as ElectronAPI["getFitBrowserFolder"],
        isFitBrowserEnabled:
            isFitBrowserEnabled as ElectronAPI["isFitBrowserEnabled"],
        listFitBrowserFolder: ((relPath?: FitBrowserListFolderRequest) => {
            if (relPath === undefined) {
                return listFitBrowserFolder("");
            }
            if (typeof relPath !== "string") {
                return rejectInvalidArgument(
                    "listFitBrowserFolder",
                    "relPath must be a string"
                );
            }
            return listFitBrowserFolder(relPath);
        }) as (
            relPath?: FitBrowserListFolderRequest
        ) => Promise<FitBrowserListFolderResponse>,
        onFitBrowserEnabledChanged: createSafeEventHandler(
            channels.FIT_BROWSER_ENABLED_CHANGED,
            "onFitBrowserEnabledChanged",
            (enabled: IpcResponsePayload) => enabled === true
        ) as ElectronAPI["onFitBrowserEnabledChanged"],
        setFitBrowserEnabled: ((enabled: FitBrowserSetEnabledRequest) => {
            if (typeof enabled !== "boolean") {
                return rejectInvalidArgument(
                    "setFitBrowserEnabled",
                    "enabled must be a boolean"
                );
            }
            return setFitBrowserEnabled(enabled);
        }) as (
            enabled: FitBrowserSetEnabledRequest
        ) => Promise<FitBrowserSetEnabledResponse>,
        setFitBrowserFolder: ((folder: FitBrowserSetFolderRequest) => {
            if (typeof folder !== "string" || folder.trim().length === 0) {
                return rejectInvalidArgument(
                    "setFitBrowserFolder",
                    "folder must be a non-empty string"
                );
            }
            return setFitBrowserFolder(folder);
        }) as (
            folder: FitBrowserSetFolderRequest
        ) => Promise<FitBrowserSetFolderResponse>,
    };
}

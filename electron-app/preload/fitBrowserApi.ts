type FitBrowserListFolderRequest =
    import("../shared/ipc").FitBrowserListFolderRequest;
type FitBrowserSetEnabledRequest =
    import("../shared/ipc").FitBrowserSetEnabledRequest;
type FitBrowserSetFolderRequest =
    import("../shared/ipc").FitBrowserSetFolderRequest;
type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
type CreateFitBrowserApiOptions =
    import("./preloadModuleTypes").CreateFitBrowserApiOptions;
type FitBrowserPreloadApi =
    import("../shared/preloadApi").ElectronFitBrowserApi;

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
}: CreateFitBrowserApiOptions): FitBrowserPreloadApi {
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
        getFitBrowserFolder,
        isFitBrowserEnabled,
        listFitBrowserFolder: (relPath?: FitBrowserListFolderRequest) => {
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
        },
        onFitBrowserEnabledChanged: createSafeEventHandler(
            channels.FIT_BROWSER_ENABLED_CHANGED,
            "onFitBrowserEnabledChanged",
            (enabled: IpcResponsePayload) => enabled === true
        ),
        setFitBrowserEnabled: (enabled: FitBrowserSetEnabledRequest) => {
            if (typeof enabled !== "boolean") {
                return rejectInvalidArgument(
                    "setFitBrowserEnabled",
                    "enabled must be a boolean"
                );
            }
            return setFitBrowserEnabled(enabled);
        },
        setFitBrowserFolder: (folder: FitBrowserSetFolderRequest) => {
            if (typeof folder !== "string" || folder.trim().length === 0) {
                return rejectInvalidArgument(
                    "setFitBrowserFolder",
                    "folder must be a non-empty string"
                );
            }
            return setFitBrowserFolder(folder);
        },
    };
}

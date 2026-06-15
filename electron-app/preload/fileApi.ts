type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;

interface FileApiChannels {
    DIALOG_OPEN_FILE: Extract<GenericInvokeChannel, "dialog:openFile">;
    DIALOG_OPEN_OVERLAY_FILES: Extract<
        GenericInvokeChannel,
        "dialog:openOverlayFiles"
    >;
    FILE_READ: Extract<GenericInvokeChannel, "file:read">;
    FIT_DECODE: Extract<GenericInvokeChannel, "fit:decode">;
    FIT_PARSE: Extract<GenericInvokeChannel, "fit:parse">;
    RECENT_FILES_ADD: Extract<GenericInvokeChannel, "recentFiles:add">;
    RECENT_FILES_APPROVE: Extract<GenericInvokeChannel, "recentFiles:approve">;
    RECENT_FILES_GET: Extract<GenericInvokeChannel, "recentFiles:get">;
}

interface FileApiOptions {
    channels: FileApiChannels;
    createSafeInvokeHandler: (
        channel: GenericInvokeChannel,
        methodName: string
    ) => (...args: unknown[]) => Promise<unknown>;
}

type FilePreloadApi = Pick<
    ElectronAPI,
    | "addRecentFile"
    | "approveRecentFile"
    | "decodeFitFile"
    | "openFile"
    | "openFileDialog"
    | "openOverlayDialog"
    | "parseFitFile"
    | "readFile"
    | "recentFiles"
>;

export function createFileApi({
    channels,
    createSafeInvokeHandler,
}: FileApiOptions): FilePreloadApi {
    const openFile = createSafeInvokeHandler(
        channels.DIALOG_OPEN_FILE,
        "openFile"
    ) as ElectronAPI["openFile"];

    return {
        addRecentFile: createSafeInvokeHandler(
            channels.RECENT_FILES_ADD,
            "addRecentFile"
        ) as ElectronAPI["addRecentFile"],
        approveRecentFile: createSafeInvokeHandler(
            channels.RECENT_FILES_APPROVE,
            "approveRecentFile"
        ) as ElectronAPI["approveRecentFile"],
        decodeFitFile: createSafeInvokeHandler(
            channels.FIT_DECODE,
            "decodeFitFile"
        ) as ElectronAPI["decodeFitFile"],
        openFile,
        openFileDialog: openFile,
        openOverlayDialog: createSafeInvokeHandler(
            channels.DIALOG_OPEN_OVERLAY_FILES,
            "openOverlayDialog"
        ) as ElectronAPI["openOverlayDialog"],
        parseFitFile: createSafeInvokeHandler(
            channels.FIT_PARSE,
            "parseFitFile"
        ) as ElectronAPI["parseFitFile"],
        readFile: createSafeInvokeHandler(
            channels.FILE_READ,
            "readFile"
        ) as ElectronAPI["readFile"],
        recentFiles: createSafeInvokeHandler(
            channels.RECENT_FILES_GET,
            "recentFiles"
        ) as ElectronAPI["recentFiles"],
    };
}

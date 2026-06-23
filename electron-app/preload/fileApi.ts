type CreateFileApiOptions = import("./preloadModuleTypes").CreateFileApiOptions;
type FilePreloadApi = import("../shared/preloadApi").ElectronFileApi;

export function createFileApi({
    channels,
    createSafeInvokeHandler,
}: CreateFileApiOptions): FilePreloadApi {
    return {
        addRecentFile: createSafeInvokeHandler(
            channels.RECENT_FILES_ADD,
            "addRecentFile"
        ),
        approveRecentFile: createSafeInvokeHandler(
            channels.RECENT_FILES_APPROVE,
            "approveRecentFile"
        ),
        decodeFitFile: createSafeInvokeHandler(
            channels.FIT_DECODE,
            "decodeFitFile"
        ),
        parseFitFile: createSafeInvokeHandler(
            channels.FIT_PARSE,
            "parseFitFile"
        ),
        readFile: createSafeInvokeHandler(channels.FILE_READ, "readFile"),
        recentFiles: createSafeInvokeHandler(
            channels.RECENT_FILES_GET,
            "recentFiles"
        ),
    };
}

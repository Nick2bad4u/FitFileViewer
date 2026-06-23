type ApiDiagnostics = import("../shared/preloadApi").ElectronApiDiagnosticsApi;
type ChannelInfo = import("../shared/ipc").ChannelInfo;
type CreateApiDiagnosticsOptions =
    import("./preloadModuleTypes").CreateApiDiagnosticsOptions;

export function createApiDiagnostics({
    channels,
    contextBridge,
    events,
    ipcRenderer,
    isDevelopmentMode,
    preloadLog,
}: CreateApiDiagnosticsOptions): ApiDiagnostics {
    function getChannelInfo(): ChannelInfo {
        return {
            channels,
            events,
            totalChannels: Object.keys(channels).length,
            totalEvents: Object.keys(events).length,
        };
    }

    function validateAPI(): boolean {
        try {
            const hasContextBridge =
                contextBridge !== null &&
                contextBridge !== undefined &&
                typeof contextBridge.exposeInMainWorld === "function";
            const hasIpcRenderer =
                ipcRenderer !== null &&
                ipcRenderer !== undefined &&
                typeof ipcRenderer.invoke === "function" &&
                typeof ipcRenderer.send === "function" &&
                typeof ipcRenderer.on === "function";

            if (isDevelopmentMode()) {
                preloadLog("info", "[preload.js] API Validation:", {
                    channelCount: Object.keys(channels).length,
                    eventCount: Object.keys(events).length,
                    hasContextBridge,
                    hasIpcRenderer,
                });
            }

            return hasIpcRenderer && hasContextBridge;
        } catch (error) {
            preloadLog("error", "[preload.js] API validation failed:", error);
            return false;
        }
    }

    return {
        getChannelInfo,
        validateAPI,
    };
}

import { loggingTimestampRuntime } from "../utils/logging/loggingTimestampRuntime.js";

type ExposeDevelopmentToolsGlobalOptions =
    import("./preloadModuleTypes").ExposeDevelopmentToolsGlobalOptions;

export const DEVELOPMENT_TOOLS_GLOBAL_NAME = ["dev", "Tools"].join("");

export function exposeDevelopmentToolsGlobal({
    api,
    constants,
    contextBridge,
    isDevelopmentMode,
    preloadLog,
}: ExposeDevelopmentToolsGlobalOptions): boolean {
    if (!isDevelopmentMode()) {
        return false;
    }

    try {
        const exposeInMainWorld = contextBridge?.exposeInMainWorld;
        if (typeof exposeInMainWorld !== "function") {
            throw new TypeError("contextBridge unavailable");
        }

        exposeInMainWorld(DEVELOPMENT_TOOLS_GLOBAL_NAME, {
            getPreloadInfo: () => ({
                apiMethods: Object.keys(api),
                constants,
                timestamp: loggingTimestampRuntime().isoNow(),
                version: "1.0.0",
            }),
            logAPIState: () => {
                preloadLog("info", "[preload.js] Current API State:", {
                    constants,
                    electronAPI: typeof api,
                    methodCount: Object.keys(api).length,
                    timestamp: loggingTimestampRuntime().isoNow(),
                });
            },
            testIPC: async () => {
                try {
                    const version = await api.getAppVersion();
                    preloadLog(
                        "info",
                        "[preload.js] IPC test successful, app version:",
                        version
                    );
                    return true;
                } catch (error) {
                    preloadLog("error", "[preload.js] IPC test failed:", error);
                    return false;
                }
            },
        });

        preloadLog("info", "[preload.js] Development tools exposed");
        return true;
    } catch (error) {
        preloadLog(
            "error",
            "[preload.js] Failed to expose development tools:",
            error
        );
        return false;
    }
}

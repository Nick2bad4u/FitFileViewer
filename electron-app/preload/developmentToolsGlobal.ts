type ElectronAPI = import("../shared/preloadApi").ElectronAPI;

type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;

interface ContextBridgeLike {
    exposeInMainWorld?: (key: string, api: unknown) => void;
}

interface DevelopmentToolsGlobalOptions {
    api: ElectronAPI;
    constants: unknown;
    contextBridge: ContextBridgeLike | null | undefined;
    isDevelopmentMode: () => boolean;
    preloadLog: PreloadLog;
}

export const DEVELOPMENT_TOOLS_GLOBAL_NAME = ["dev", "Tools"].join("");

export function exposeDevelopmentToolsGlobal({
    api,
    constants,
    contextBridge,
    isDevelopmentMode,
    preloadLog,
}: DevelopmentToolsGlobalOptions): boolean {
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
                timestamp: new Date().toISOString(),
                version: "1.0.0",
            }),
            logAPIState: () => {
                preloadLog("info", "[preload.js] Current API State:", {
                    constants,
                    electronAPI: typeof api,
                    methodCount: Object.keys(api).length,
                    timestamp: new Date().toISOString(),
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

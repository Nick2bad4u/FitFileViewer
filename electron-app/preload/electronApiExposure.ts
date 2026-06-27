type ExposeElectronApiOptions =
    import("./preloadModuleTypes").ExposeElectronApiOptions;
type PreloadExposedElectronApi =
    import("./preloadModuleTypes").PreloadExposedElectronApi;

export function getApiStructure(api: PreloadExposedElectronApi): {
    methods: string[];
    properties: string[];
    total: number;
} {
    const apiEntries = Object.entries(api),
        methods = apiEntries
            .filter(([, value]) => typeof value === "function")
            .map(([key]) => key),
        properties = apiEntries
            .filter(([, value]) => typeof value !== "function")
            .map(([key]) => key);

    return {
        methods,
        properties,
        total: apiEntries.length,
    };
}

export function exposeElectronApi({
    api,
    contextBridge,
    isDevelopmentMode,
    preloadLog,
}: ExposeElectronApiOptions): boolean {
    try {
        if (!api.validateAPI()) {
            preloadLog(
                "error",
                "[preload.js] API validation failed - not exposing to main world"
            );
            return false;
        }

        const exposeInMainWorld = contextBridge?.exposeInMainWorld;
        if (typeof exposeInMainWorld !== "function") {
            throw new TypeError("contextBridge unavailable");
        }

        exposeInMainWorld("electronAPI", api);

        if (isDevelopmentMode()) {
            preloadLog(
                "info",
                "[preload.js] Successfully exposed electronAPI to main world"
            );
            preloadLog(
                "info",
                "[preload.js] API Structure:",
                getApiStructure(api)
            );
        }

        return true;
    } catch (error) {
        preloadLog(
            "error",
            "[preload.js] Failed to expose electronAPI:",
            error
        );
        return false;
    }
}

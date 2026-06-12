type AssemblePreloadApi = import("./preloadModuleTypes").AssemblePreloadApi;
type CreateElectronApi = import("./preloadModuleTypes").CreateElectronApi;
type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

interface CreatePreloadRuntimeOptions {
    requireModule: PreloadModuleRequire;
}

export function createPreloadRuntime({
    requireModule,
}: CreatePreloadRuntimeOptions): PreloadRuntime {
    const { loadPreloadModules } = requireModule(
        "./preload/preloadModuleLoader.js"
    ) as {
        loadPreloadModules: () => PreloadModuleRegistry;
    };
    const { createElectronApi } = requireModule(
        "./preload/electronApiFactory.js"
    ) as {
        createElectronApi: CreateElectronApi;
    };
    const { assemblePreloadApi, createPreloadConstants } = requireModule(
        "./preload/apiAssembly.js"
    ) as {
        assemblePreloadApi: AssemblePreloadApi;
        createPreloadConstants: (
            ipcBridgeCatalog: PreloadModuleRegistry["ipcBridgeCatalog"]
        ) => PreloadConstants;
    };
    const modules = loadPreloadModules();

    return {
        assemblePreloadApi,
        constants: createPreloadConstants(modules.ipcBridgeCatalog),
        createElectronApi,
        modules,
        requireModule,
    };
}

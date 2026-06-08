{
    type AssemblePreloadApi = import("./preloadModuleTypes").AssemblePreloadApi;
    type CreateElectronApi = import("./preloadModuleTypes").CreateElectronApi;
    type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
    type PreloadModuleRegistry =
        import("./preloadModuleTypes").PreloadModuleRegistry;
    type PreloadModuleRequire =
        import("./preloadModuleTypes").PreloadModuleRequire;
    type PreloadRuntime = import("./preloadModuleTypes").PreloadRuntime;

    interface CreatePreloadRuntimeOptions {
        requireModule: PreloadModuleRequire;
    }

    function createPreloadRuntime({
        requireModule,
    }: CreatePreloadRuntimeOptions): PreloadRuntime {
        const { loadPreloadModules } = requireModule(
            "./preload/preloadModuleLoader.js"
        ) as {
            loadPreloadModules: (options: {
                requireModule: PreloadModuleRequire;
            }) => PreloadModuleRegistry;
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
        const modules = loadPreloadModules({ requireModule });

        return {
            assemblePreloadApi,
            constants: createPreloadConstants(modules.ipcBridgeCatalog),
            createElectronApi,
            modules,
            requireModule,
        };
    }

    module.exports = {
        createPreloadRuntime,
    };
}

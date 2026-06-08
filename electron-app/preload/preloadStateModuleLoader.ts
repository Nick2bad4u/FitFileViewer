{
    type PreloadModuleRegistry =
        import("./preloadModuleTypes").PreloadModuleRegistry;
    type PreloadModuleRequire =
        import("./preloadModuleTypes").PreloadModuleRequire;
    type PreloadStateModules = Pick<
        PreloadModuleRegistry,
        "createMainStateApi" | "createMainStateBridge"
    >;

    interface LoadPreloadStateModulesOptions {
        requireModule: PreloadModuleRequire;
    }

    function loadPreloadStateModules({
        requireModule,
    }: LoadPreloadStateModulesOptions): PreloadStateModules {
        const { createMainStateBridge } = requireModule(
            "./preload/mainStateBridge.js"
        ) as {
            createMainStateBridge: PreloadModuleRegistry["createMainStateBridge"];
        };
        const { createMainStateApi } = requireModule(
            "./preload/mainStateApi.js"
        ) as {
            createMainStateApi: PreloadModuleRegistry["createMainStateApi"];
        };

        return {
            createMainStateApi,
            createMainStateBridge,
        };
    }

    module.exports = {
        loadPreloadStateModules,
    };
}

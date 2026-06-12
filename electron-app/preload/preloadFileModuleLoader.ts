type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadFileModules = Pick<
    PreloadModuleRegistry,
    "createFileApi" | "createFitBrowserApi"
>;

interface LoadPreloadFileModulesOptions {
    requireModule: PreloadModuleRequire;
}

export function loadPreloadFileModules({
    requireModule,
}: LoadPreloadFileModulesOptions): PreloadFileModules {
    const { createFitBrowserApi } = requireModule(
        "./preload/fitBrowserApi.js"
    ) as {
        createFitBrowserApi: PreloadModuleRegistry["createFitBrowserApi"];
    };
    const { createFileApi } = requireModule("./preload/fileApi.js") as {
        createFileApi: PreloadModuleRegistry["createFileApi"];
    };

    return {
        createFileApi,
        createFitBrowserApi,
    };
}

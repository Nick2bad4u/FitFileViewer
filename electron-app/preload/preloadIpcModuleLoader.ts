type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadIpcModules = Pick<
    PreloadModuleRegistry,
    | "createMenuEventApi"
    | "createPreloadEventApi"
    | "createPreloadIpcHelpers"
    | "createPreloadLogger"
    | "createPreloadValidators"
    | "exposeElectronApi"
    | "ipcBridgeCatalog"
    | "resolvePreloadElectronBridge"
    | "shouldEnforceGenericIpcAllowlist"
>;

interface LoadPreloadIpcModulesOptions {
    requireModule: PreloadModuleRequire;
}

export function loadPreloadIpcModules({
    requireModule,
}: LoadPreloadIpcModulesOptions): PreloadIpcModules {
    const { createPreloadValidators } = requireModule(
        "./preload/validators.js"
    ) as {
        createPreloadValidators: PreloadModuleRegistry["createPreloadValidators"];
    };
    const { shouldEnforceGenericIpcAllowlist } = requireModule(
        "./preload/environment.js"
    ) as {
        shouldEnforceGenericIpcAllowlist: PreloadModuleRegistry["shouldEnforceGenericIpcAllowlist"];
    };
    const { createPreloadEventApi } = requireModule(
        "./preload/preloadEventApi.js"
    ) as {
        createPreloadEventApi: PreloadModuleRegistry["createPreloadEventApi"];
    };
    const { resolvePreloadElectronBridge } = requireModule(
        "./preload/electronBridge.js"
    ) as {
        resolvePreloadElectronBridge: PreloadModuleRegistry["resolvePreloadElectronBridge"];
    };
    const { exposeElectronApi } = requireModule(
        "./preload/electronApiExposure.js"
    ) as {
        exposeElectronApi: PreloadModuleRegistry["exposeElectronApi"];
    };
    const { createPreloadIpcHelpers } = requireModule(
        "./preload/ipcHelpers.js"
    ) as {
        createPreloadIpcHelpers: PreloadModuleRegistry["createPreloadIpcHelpers"];
    };
    const { createPreloadLogger } = requireModule("./preload/logger.js") as {
        createPreloadLogger: PreloadModuleRegistry["createPreloadLogger"];
    };
    const { createMenuEventApi } = requireModule(
        "./preload/menuEventApi.js"
    ) as {
        createMenuEventApi: PreloadModuleRegistry["createMenuEventApi"];
    };
    const ipcBridgeCatalog = requireModule(
        "./preload/ipcBridgeCatalog.js"
    ) as PreloadModuleRegistry["ipcBridgeCatalog"];

    return {
        createMenuEventApi,
        createPreloadEventApi,
        createPreloadIpcHelpers,
        createPreloadLogger,
        createPreloadValidators,
        exposeElectronApi,
        ipcBridgeCatalog,
        resolvePreloadElectronBridge,
        shouldEnforceGenericIpcAllowlist,
    };
}

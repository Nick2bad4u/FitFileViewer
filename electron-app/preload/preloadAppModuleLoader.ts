type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadAppModules = Pick<
    PreloadModuleRegistry,
    | "createApiDiagnostics"
    | "createAppInfoApi"
    | "createClipboardBridge"
    | "createDevtoolsMenuApi"
    | "createGyazoExternalApi"
    | "createShellExternalApi"
    | "createThemeApi"
    | "exposeDevelopmentToolsGlobal"
    | "isPreloadDevelopmentMode"
    | "registerPreloadBeforeExitHandler"
>;

interface LoadPreloadAppModulesOptions {
    requireModule: PreloadModuleRequire;
}

export function loadPreloadAppModules({
    requireModule,
}: LoadPreloadAppModulesOptions): PreloadAppModules {
    const { createApiDiagnostics } = requireModule(
        "./preload/apiDiagnostics.js"
    ) as {
        createApiDiagnostics: PreloadModuleRegistry["createApiDiagnostics"];
    };
    const { createAppInfoApi } = requireModule("./preload/appInfoApi.js") as {
        createAppInfoApi: PreloadModuleRegistry["createAppInfoApi"];
    };
    const { registerPreloadBeforeExitHandler } = requireModule(
        "./preload/beforeExitHandler.js"
    ) as {
        registerPreloadBeforeExitHandler: PreloadModuleRegistry["registerPreloadBeforeExitHandler"];
    };
    const { createClipboardBridge } = requireModule(
        "./preload/clipboardBridge.js"
    ) as {
        createClipboardBridge: PreloadModuleRegistry["createClipboardBridge"];
    };
    const { createDevtoolsMenuApi } = requireModule(
        "./preload/devtoolsMenuApi.js"
    ) as {
        createDevtoolsMenuApi: PreloadModuleRegistry["createDevtoolsMenuApi"];
    };
    const { exposeDevelopmentToolsGlobal } = requireModule(
        "./preload/developmentToolsGlobal.js"
    ) as {
        exposeDevelopmentToolsGlobal: PreloadModuleRegistry["exposeDevelopmentToolsGlobal"];
    };
    const { createGyazoExternalApi } = requireModule(
        "./preload/gyazoExternalApi.js"
    ) as {
        createGyazoExternalApi: PreloadModuleRegistry["createGyazoExternalApi"];
    };
    const { createShellExternalApi } = requireModule(
        "./preload/shellExternalApi.js"
    ) as {
        createShellExternalApi: PreloadModuleRegistry["createShellExternalApi"];
    };
    const { createThemeApi } = requireModule("./preload/themeApi.js") as {
        createThemeApi: PreloadModuleRegistry["createThemeApi"];
    };
    const { isPreloadDevelopmentMode } = requireModule(
        "./preload/environment.js"
    ) as {
        isPreloadDevelopmentMode: PreloadModuleRegistry["isPreloadDevelopmentMode"];
    };

    return {
        createApiDiagnostics,
        createAppInfoApi,
        createClipboardBridge,
        createDevtoolsMenuApi,
        createGyazoExternalApi,
        createShellExternalApi,
        createThemeApi,
        exposeDevelopmentToolsGlobal,
        isPreloadDevelopmentMode,
        registerPreloadBeforeExitHandler,
    };
}

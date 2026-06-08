{
    type PreloadModuleRegistry =
        import("./preloadModuleTypes").PreloadModuleRegistry;
    type PreloadModuleRequire =
        import("./preloadModuleTypes").PreloadModuleRequire;

    interface LoadPreloadModulesOptions {
        requireModule: PreloadModuleRequire;
    }

    function loadPreloadModules({
        requireModule,
    }: LoadPreloadModulesOptions): PreloadModuleRegistry {
        const { loadPreloadAppModules } = requireModule(
            "./preload/preloadAppModuleLoader.js"
        ) as {
            loadPreloadAppModules: (
                options: LoadPreloadModulesOptions
            ) => Pick<
                PreloadModuleRegistry,
                | "createApiDiagnostics"
                | "createAppInfoApi"
                | "createClipboardBridge"
                | "createDevtoolsMenuApi"
                | "createExternalApi"
                | "createThemeApi"
                | "exposeDevelopmentToolsGlobal"
                | "isPreloadDevelopmentMode"
                | "registerPreloadBeforeExitHandler"
            >;
        };
        const { loadPreloadFileModules } = requireModule(
            "./preload/preloadFileModuleLoader.js"
        ) as {
            loadPreloadFileModules: (
                options: LoadPreloadModulesOptions
            ) => Pick<
                PreloadModuleRegistry,
                "createFileApi" | "createFitBrowserApi"
            >;
        };
        const { loadPreloadIpcModules } = requireModule(
            "./preload/preloadIpcModuleLoader.js"
        ) as {
            loadPreloadIpcModules: (
                options: LoadPreloadModulesOptions
            ) => Pick<
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
        };
        const { loadPreloadStateModules } = requireModule(
            "./preload/preloadStateModuleLoader.js"
        ) as {
            loadPreloadStateModules: (
                options: LoadPreloadModulesOptions
            ) => Pick<
                PreloadModuleRegistry,
                "createMainStateApi" | "createMainStateBridge"
            >;
        };

        return {
            ...loadPreloadAppModules({ requireModule }),
            ...loadPreloadFileModules({ requireModule }),
            ...loadPreloadIpcModules({ requireModule }),
            ...loadPreloadStateModules({ requireModule }),
        };
    }

    module.exports = {
        loadPreloadModules,
    };
}

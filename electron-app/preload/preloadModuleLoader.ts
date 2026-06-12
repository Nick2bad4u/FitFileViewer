type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;

interface LoadPreloadModulesOptions {
    requireModule: PreloadModuleRequire;
}

export function loadPreloadModules({
    requireModule,
}: LoadPreloadModulesOptions): PreloadModuleRegistry {
    const { loadPreloadApiAssemblyModules } = requireModule(
        "./preload/preloadApiAssemblyModuleLoader.js"
    ) as {
        loadPreloadApiAssemblyModules: (
            options: LoadPreloadModulesOptions
        ) => Pick<
            PreloadModuleRegistry,
            | "createPreloadApiAssemblyContext"
            | "createPreloadClipboardApiDomain"
            | "createPreloadDeveloperApiDomain"
            | "createPreloadDiagnosticsApiDomain"
            | "createPreloadExternalApiDomain"
            | "createPreloadFileApiDomain"
            | "createPreloadIpcEventApiDomain"
            | "createPreloadStateApiDomain"
            | "createPreloadSystemApiDomain"
        >;
    };
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
            | "createGyazoExternalApi"
            | "createShellExternalApi"
            | "createThemeApi"
            | "exposeDevelopmentToolsGlobal"
            | "isPreloadDevelopmentMode"
            | "registerPreloadBeforeExitHandler"
        >;
    };
    const { loadPreloadPolicyModules } = requireModule(
        "./preload/preloadPolicyModuleLoader.js"
    ) as {
        loadPreloadPolicyModules: () => Pick<
            PreloadModuleRegistry,
            | "validateDevtoolsInjectMenuPayload"
            | "validateExternalUrl"
            | "validateFitBrowserRelativePath"
            | "validateFitBrowserRootFolderPath"
            | "validateFitFilePathInput"
            | "validateMainStateOperationIdInput"
            | "validateMainStatePathInput"
        >;
    };
    const { loadPreloadFileModules } = requireModule(
        "./preload/preloadFileModuleLoader.js"
    ) as {
        loadPreloadFileModules: () => Pick<
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
        loadPreloadStateModules: () => Pick<
            PreloadModuleRegistry,
            "createMainStateApi" | "createMainStateBridge"
        >;
    };

    return {
        ...loadPreloadApiAssemblyModules({ requireModule }),
        ...loadPreloadAppModules({ requireModule }),
        ...loadPreloadPolicyModules(),
        ...loadPreloadFileModules(),
        ...loadPreloadIpcModules({ requireModule }),
        ...loadPreloadStateModules(),
    };
}

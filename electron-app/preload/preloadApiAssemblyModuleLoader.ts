type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;
type PreloadModuleRequire = import("./preloadModuleTypes").PreloadModuleRequire;
type PreloadApiAssemblyModules = Pick<
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

interface LoadPreloadApiAssemblyModulesOptions {
    requireModule: PreloadModuleRequire;
}

export function loadPreloadApiAssemblyModules({
    requireModule,
}: LoadPreloadApiAssemblyModulesOptions): PreloadApiAssemblyModules {
    const { createPreloadApiAssemblyContext } = requireModule(
        "./preload/apiAssemblyContext.js"
    ) as {
        createPreloadApiAssemblyContext: PreloadModuleRegistry["createPreloadApiAssemblyContext"];
    };
    const { createPreloadClipboardApiDomain } = requireModule(
        "./preload/clipboardApiDomain.js"
    ) as {
        createPreloadClipboardApiDomain: PreloadModuleRegistry["createPreloadClipboardApiDomain"];
    };
    const { createPreloadDeveloperApiDomain } = requireModule(
        "./preload/developerApiDomain.js"
    ) as {
        createPreloadDeveloperApiDomain: PreloadModuleRegistry["createPreloadDeveloperApiDomain"];
    };
    const { createPreloadDiagnosticsApiDomain } = requireModule(
        "./preload/diagnosticsApiDomain.js"
    ) as {
        createPreloadDiagnosticsApiDomain: PreloadModuleRegistry["createPreloadDiagnosticsApiDomain"];
    };
    const { createPreloadExternalApiDomain } = requireModule(
        "./preload/externalApiDomain.js"
    ) as {
        createPreloadExternalApiDomain: PreloadModuleRegistry["createPreloadExternalApiDomain"];
    };
    const { createPreloadFileApiDomain } = requireModule(
        "./preload/fileApiDomain.js"
    ) as {
        createPreloadFileApiDomain: PreloadModuleRegistry["createPreloadFileApiDomain"];
    };
    const { createPreloadIpcEventApiDomain } = requireModule(
        "./preload/ipcEventApiDomain.js"
    ) as {
        createPreloadIpcEventApiDomain: PreloadModuleRegistry["createPreloadIpcEventApiDomain"];
    };
    const { createPreloadStateApiDomain } = requireModule(
        "./preload/stateApiDomain.js"
    ) as {
        createPreloadStateApiDomain: PreloadModuleRegistry["createPreloadStateApiDomain"];
    };
    const { createPreloadSystemApiDomain } = requireModule(
        "./preload/systemApiDomain.js"
    ) as {
        createPreloadSystemApiDomain: PreloadModuleRegistry["createPreloadSystemApiDomain"];
    };

    return {
        createPreloadApiAssemblyContext,
        createPreloadClipboardApiDomain,
        createPreloadDeveloperApiDomain,
        createPreloadDiagnosticsApiDomain,
        createPreloadExternalApiDomain,
        createPreloadFileApiDomain,
        createPreloadIpcEventApiDomain,
        createPreloadStateApiDomain,
        createPreloadSystemApiDomain,
    };
}

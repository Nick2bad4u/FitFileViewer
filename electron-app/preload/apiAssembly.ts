{
    type AssemblePreloadApi = import("./preloadModuleTypes").AssemblePreloadApi;
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type PreloadClipboardApiDomain =
        import("./preloadModuleTypes").PreloadClipboardApiDomain;
    type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
    type PreloadDeveloperApiDomain =
        import("./preloadModuleTypes").PreloadDeveloperApiDomain;
    type PreloadDiagnosticsApiDomain =
        import("./preloadModuleTypes").PreloadDiagnosticsApiDomain;
    type PreloadExternalApiDomain =
        import("./preloadModuleTypes").PreloadExternalApiDomain;
    type PreloadFileApiDomain =
        import("./preloadModuleTypes").PreloadFileApiDomain;
    type PreloadIpcEventApiDomain =
        import("./preloadModuleTypes").PreloadIpcEventApiDomain;
    type PreloadModuleRegistry =
        import("./preloadModuleTypes").PreloadModuleRegistry;
    type PreloadStateApiDomain =
        import("./preloadModuleTypes").PreloadStateApiDomain;
    type PreloadSystemApiDomain =
        import("./preloadModuleTypes").PreloadSystemApiDomain;
    type PreloadApiAssemblyContext =
        import("./preloadModuleTypes").PreloadApiAssemblyContext;

    type CreatePreloadApiAssemblyContext = (options: {
        constants: PreloadConstants;
        contextBridge: Parameters<AssemblePreloadApi>[0]["contextBridge"];
        ipcRenderer: Parameters<AssemblePreloadApi>[0]["ipcRenderer"];
        modules: PreloadModuleRegistry;
        preloadLog: Parameters<AssemblePreloadApi>[0]["preloadLog"];
        processRef?: NodeJS.Process;
    }) => PreloadApiAssemblyContext;
    type CreatePreloadClipboardApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadClipboardApiDomain;
    type CreatePreloadDeveloperApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadDeveloperApiDomain;
    type CreatePreloadDiagnosticsApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadDiagnosticsApiDomain;
    type CreatePreloadExternalApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadExternalApiDomain;
    type CreatePreloadFileApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadFileApiDomain;
    type CreatePreloadIpcEventApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadIpcEventApiDomain;
    type CreatePreloadStateApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadStateApiDomain;
    type CreatePreloadSystemApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadSystemApiDomain;

    const { createPreloadApiAssemblyContext } =
        require("./apiAssemblyContext.js") as {
            createPreloadApiAssemblyContext: CreatePreloadApiAssemblyContext;
        };
    const { createPreloadClipboardApiDomain } =
        require("./clipboardApiDomain.js") as {
            createPreloadClipboardApiDomain: CreatePreloadClipboardApiDomain;
        };
    const { createPreloadDeveloperApiDomain } =
        require("./developerApiDomain.js") as {
            createPreloadDeveloperApiDomain: CreatePreloadDeveloperApiDomain;
        };
    const { createPreloadDiagnosticsApiDomain } =
        require("./diagnosticsApiDomain.js") as {
            createPreloadDiagnosticsApiDomain: CreatePreloadDiagnosticsApiDomain;
        };
    const { createPreloadExternalApiDomain } =
        require("./externalApiDomain.js") as {
            createPreloadExternalApiDomain: CreatePreloadExternalApiDomain;
        };
    const { createPreloadFileApiDomain } = require("./fileApiDomain.js") as {
        createPreloadFileApiDomain: CreatePreloadFileApiDomain;
    };
    const { createPreloadIpcEventApiDomain } =
        require("./ipcEventApiDomain.js") as {
            createPreloadIpcEventApiDomain: CreatePreloadIpcEventApiDomain;
        };
    const { createPreloadStateApiDomain } = require("./stateApiDomain.js") as {
        createPreloadStateApiDomain: CreatePreloadStateApiDomain;
    };
    const { createPreloadSystemApiDomain } =
        require("./systemApiDomain.js") as {
            createPreloadSystemApiDomain: CreatePreloadSystemApiDomain;
        };

    function createPreloadConstants(
        ipcBridgeCatalog: PreloadModuleRegistry["ipcBridgeCatalog"]
    ): PreloadConstants {
        return {
            CHANNELS: ipcBridgeCatalog.PRELOAD_CHANNELS,
            DEFAULT_VALUES: {
                FIT_FILE_PATH: null,
                THEME: null,
            },
            EVENTS: ipcBridgeCatalog.PRELOAD_EVENTS,
        };
    }

    const assemblePreloadApi: AssemblePreloadApi = ({
        constants,
        contextBridge,
        createElectronApi,
        ipcRenderer,
        modules,
        preloadLog,
        processRef,
    }): ElectronAPI => {
        const assemblyContext = createPreloadApiAssemblyContext({
            constants,
            contextBridge,
            ipcRenderer,
            modules,
            preloadLog,
            ...(processRef === undefined ? {} : { processRef }),
        });

        return createElectronApi({
            ...createPreloadClipboardApiDomain(assemblyContext),
            ...createPreloadDeveloperApiDomain(assemblyContext),
            ...createPreloadDiagnosticsApiDomain(assemblyContext),
            ...createPreloadExternalApiDomain(assemblyContext),
            ...createPreloadFileApiDomain(assemblyContext),
            ...createPreloadIpcEventApiDomain(assemblyContext),
            ...createPreloadStateApiDomain(assemblyContext),
            ...createPreloadSystemApiDomain(assemblyContext),
        });
    };

    module.exports = {
        assemblePreloadApi,
        createPreloadConstants,
    };
}

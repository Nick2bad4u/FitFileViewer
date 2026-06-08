{
    type AssemblePreloadApi = import("./preloadModuleTypes").AssemblePreloadApi;
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type PreloadAppApiDomain =
        import("./preloadModuleTypes").PreloadAppApiDomain;
    type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
    type PreloadFileApiDomain =
        import("./preloadModuleTypes").PreloadFileApiDomain;
    type PreloadIpcEventApiDomain =
        import("./preloadModuleTypes").PreloadIpcEventApiDomain;
    type PreloadModuleRegistry =
        import("./preloadModuleTypes").PreloadModuleRegistry;
    type PreloadStateApiDomain =
        import("./preloadModuleTypes").PreloadStateApiDomain;
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
    type CreatePreloadAppApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadAppApiDomain;
    type CreatePreloadFileApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadFileApiDomain;
    type CreatePreloadIpcEventApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadIpcEventApiDomain;
    type CreatePreloadStateApiDomain = (
        context: PreloadApiAssemblyContext
    ) => PreloadStateApiDomain;

    const { createPreloadApiAssemblyContext } =
        require("./apiAssemblyContext.js") as {
            createPreloadApiAssemblyContext: CreatePreloadApiAssemblyContext;
        };
    const { createPreloadAppApiDomain } = require("./appApiDomain.js") as {
        createPreloadAppApiDomain: CreatePreloadAppApiDomain;
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
            ...createPreloadAppApiDomain(assemblyContext),
            ...createPreloadFileApiDomain(assemblyContext),
            ...createPreloadIpcEventApiDomain(assemblyContext),
            ...createPreloadStateApiDomain(assemblyContext),
        });
    };

    module.exports = {
        assemblePreloadApi,
        createPreloadConstants,
    };
}

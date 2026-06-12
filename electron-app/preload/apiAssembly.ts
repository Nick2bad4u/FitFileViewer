type AssemblePreloadApi = import("./preloadModuleTypes").AssemblePreloadApi;
type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;
type PreloadModuleRegistry =
    import("./preloadModuleTypes").PreloadModuleRegistry;

export function createPreloadConstants(
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

export const assemblePreloadApi: AssemblePreloadApi = ({
    constants,
    contextBridge,
    createElectronApi,
    ipcRenderer,
    modules,
    preloadLog,
    processRef,
}): ElectronAPI => {
    const {
        createPreloadApiAssemblyContext,
        createPreloadClipboardApiDomain,
        createPreloadDeveloperApiDomain,
        createPreloadDiagnosticsApiDomain,
        createPreloadExternalApiDomain,
        createPreloadFileApiDomain,
        createPreloadIpcEventApiDomain,
        createPreloadStateApiDomain,
        createPreloadSystemApiDomain,
    } = modules;
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

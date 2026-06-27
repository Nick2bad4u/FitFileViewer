type AssemblePreloadApi = import("./preloadAssemblyTypes").AssemblePreloadApi;
type IpcBridgeCatalog = import("./preloadModuleTypes").IpcBridgeCatalog;
type PreloadConstants = import("./preloadModuleTypes").PreloadConstants;

export function createPreloadConstants(
    ipcBridgeCatalog: IpcBridgeCatalog
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
}) => {
    const {
        createPreloadApiAssemblyContext,
        createPreloadClipboardApiDomain,
        createPreloadDeveloperApiDomain,
        createPreloadDiagnosticsApiDomain,
        createPreloadDialogApiDomain,
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
        ...createPreloadDialogApiDomain(assemblyContext),
        ...createPreloadExternalApiDomain(assemblyContext),
        ...createPreloadFileApiDomain(assemblyContext),
        ...createPreloadIpcEventApiDomain(assemblyContext),
        ...createPreloadStateApiDomain(assemblyContext),
        ...createPreloadSystemApiDomain(assemblyContext),
    });
};

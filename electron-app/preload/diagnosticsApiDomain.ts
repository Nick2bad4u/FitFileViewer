type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadDiagnosticsApiDomain =
    import("./preloadAssemblyTypes").PreloadDiagnosticsApiDomain;

export function createPreloadDiagnosticsApiDomain({
    constants,
    contextBridge,
    ipcRenderer,
    modules,
    preloadLog,
    processRef,
}: PreloadApiAssemblyContext): PreloadDiagnosticsApiDomain {
    const { createApiDiagnostics, isPreloadDevelopmentMode } = modules;

    return {
        apiDiagnostics: createApiDiagnostics({
            channels: constants.CHANNELS,
            contextBridge,
            events: constants.EVENTS,
            ipcRenderer,
            isDevelopmentMode: () => isPreloadDevelopmentMode(processRef),
            preloadLog,
        }),
    };
}

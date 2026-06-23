type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadStateApiDomain =
    import("./preloadModuleTypes").PreloadStateApiDomain;

export function createPreloadStateApiDomain({
    createSafeInvokeHandler,
    ipcRenderer,
    modules,
    preloadLog,
    removeIpcListener,
    validateCallback,
    validateRequiredNonEmptyString,
}: PreloadApiAssemblyContext): PreloadStateApiDomain {
    const { createMainStateApi, createMainStateBridge } = modules;
    const mainStateBridge = createMainStateBridge({
        ipcRenderer,
        preloadLog,
        removeIpcListener,
    });

    return {
        mainStateApi: createMainStateApi({
            createSafeInvokeHandler,
            mainStateBridge,
            preloadLog,
            validateCallback,
            validateRequiredNonEmptyString,
        }),
    };
}

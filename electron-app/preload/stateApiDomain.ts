type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadStateApiDomain =
    import("./preloadAssemblyTypes").PreloadStateApiDomain;

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

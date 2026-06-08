{
    type PreloadApiAssemblyContext =
        import("./preloadModuleTypes").PreloadApiAssemblyContext;
    type PreloadStateApiDomain =
        import("./preloadModuleTypes").PreloadStateApiDomain;

    function createPreloadStateApiDomain({
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
                ipcRenderer,
                mainStateBridge,
                preloadLog,
                validateCallback,
                validateRequiredNonEmptyString,
            }),
        };
    }

    module.exports = {
        createPreloadStateApiDomain,
    };
}

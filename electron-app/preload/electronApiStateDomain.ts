type ElectronMainStateApi = import("../shared/preloadApi").ElectronMainStateApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiStateDomain({
    mainStateApi,
}: Pick<ElectronApiFactoryOptions, "mainStateApi">): ElectronMainStateApi {
    return {
        getErrors: mainStateApi.getErrors,
        getMainState: mainStateApi.getMainState,
        getMetrics: mainStateApi.getMetrics,
        getOperation: mainStateApi.getOperation,
        getOperations: mainStateApi.getOperations,
        listenToMainState: mainStateApi.listenToMainState,
        setMainState: mainStateApi.setMainState,
        subscribeToMainState: mainStateApi.subscribeToMainState,
        unlistenFromMainState: mainStateApi.unlistenFromMainState,
    };
}

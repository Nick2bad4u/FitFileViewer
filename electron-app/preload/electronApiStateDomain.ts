type ElectronMainStateApi = import("../shared/preloadApi").ElectronMainStateApi;

export interface ElectronApiStateDomainOptions {
    mainStateApi: ElectronMainStateApi;
}

export function createElectronApiStateDomain({
    mainStateApi,
}: ElectronApiStateDomainOptions): ElectronMainStateApi {
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

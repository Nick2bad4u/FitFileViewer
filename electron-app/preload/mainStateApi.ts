type MainStateErrorsRequest = import("../shared/ipc").MainStateErrorsRequest;
type MainStateErrorsResponse = import("../shared/ipc").MainStateErrorsResponse;
type MainStateGetRequest = import("../shared/ipc").MainStateGetRequest;
type MainStateGetResponse = import("../shared/ipc").MainStateGetResponse;
type MainStateListener = import("../shared/ipc").MainStateListener;
type MainStateListenRequest = import("../shared/ipc").MainStateListenRequest;
type MainStateListenResponse = import("../shared/ipc").MainStateListenResponse;
type MainStateMetricsResponse =
    import("../shared/ipc").MainStateMetricsResponse;
type MainStateOperationRequest =
    import("../shared/ipc").MainStateOperationRequest;
type MainStateOperationResponse =
    import("../shared/ipc").MainStateOperationResponse;
type MainStateOperationsResponse =
    import("../shared/ipc").MainStateOperationsResponse;
type MainStatePath = import("../shared/ipc").MainStatePath;
type MainStateSetOptions = import("../shared/ipc").MainStateSetOptions;
type MainStateSetResponse = import("../shared/ipc").MainStateSetResponse;
type MainStateSetValue = import("../shared/ipc").MainStateSetValue;
type MainStateUnlistenRequest =
    import("../shared/ipc").MainStateUnlistenRequest;
type MainStateUnlistenResponse =
    import("../shared/ipc").MainStateUnlistenResponse;
type CreateMainStateApiOptions =
    import("./preloadModuleTypes").CreateMainStateApiOptions;

interface MainStateApi {
    getErrors: (
        limit?: MainStateErrorsRequest
    ) => Promise<MainStateErrorsResponse>;
    getMainState: (path?: MainStateGetRequest) => Promise<MainStateGetResponse>;
    getMetrics: () => Promise<MainStateMetricsResponse>;
    getOperation: (
        operationId: MainStateOperationRequest
    ) => Promise<MainStateOperationResponse | null>;
    getOperations: () => Promise<MainStateOperationsResponse>;
    listenToMainState: (
        path: MainStateListenRequest,
        callback: MainStateListener
    ) => Promise<MainStateListenResponse>;
    setMainState: (
        path: MainStatePath,
        value: MainStateSetValue,
        options?: MainStateSetOptions
    ) => Promise<MainStateSetResponse>;
    subscribeToMainState: (
        path: MainStatePath,
        callback: MainStateListener
    ) => Promise<() => Promise<boolean>>;
    unlistenFromMainState: (
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ) => Promise<MainStateUnlistenResponse>;
}

export function createMainStateApi({
    createSafeInvokeHandler,
    mainStateBridge,
    preloadLog,
    validateCallback,
    validateRequiredNonEmptyString,
}: CreateMainStateApiOptions): MainStateApi {
    const getErrorsFromMain = createSafeInvokeHandler(
        "main-state:errors",
        "getErrors"
    );
    const getMainStateFromMain = createSafeInvokeHandler(
        "main-state:get",
        "getMainState"
    );
    const getMetricsFromMain = createSafeInvokeHandler(
        "main-state:metrics",
        "getMetrics"
    );
    const getOperationFromMain = createSafeInvokeHandler(
        "main-state:operation",
        "getOperation"
    );
    const getOperationsFromMain = createSafeInvokeHandler(
        "main-state:operations",
        "getOperations"
    );
    const setMainStateInMain = createSafeInvokeHandler(
        "main-state:set",
        "setMainState"
    );

    async function getErrors(
        limit: MainStateErrorsRequest = 50
    ): Promise<MainStateErrorsResponse> {
        try {
            return await getErrorsFromMain(limit);
        } catch (error) {
            preloadLog("error", "[preload.js] Error in getErrors:", error);
            throw error;
        }
    }

    async function getMainState(
        path?: MainStateGetRequest
    ): Promise<MainStateGetResponse> {
        try {
            return await getMainStateFromMain(path);
        } catch (error) {
            preloadLog(
                "error",
                `[preload.js] Error in getMainState(${path ?? "all"}):`,
                error
            );
            throw error;
        }
    }

    async function getMetrics(): Promise<MainStateMetricsResponse> {
        try {
            return await getMetricsFromMain();
        } catch (error) {
            preloadLog("error", "[preload.js] Error in getMetrics:", error);
            throw error;
        }
    }

    async function getOperation(
        operationId: MainStateOperationRequest
    ): Promise<MainStateOperationResponse | null> {
        if (
            !validateRequiredNonEmptyString(
                operationId,
                "operationId",
                "getOperation"
            )
        ) {
            return null;
        }

        try {
            return await getOperationFromMain(operationId);
        } catch (error) {
            preloadLog(
                "error",
                `[preload.js] Error in getOperation(${operationId}):`,
                error
            );
            throw error;
        }
    }

    async function getOperations(): Promise<MainStateOperationsResponse> {
        try {
            return await getOperationsFromMain();
        } catch (error) {
            preloadLog("error", "[preload.js] Error in getOperations:", error);
            throw error;
        }
    }

    async function listenToMainState(
        path: MainStateListenRequest,
        callback: MainStateListener
    ): Promise<MainStateListenResponse> {
        if (
            !validateRequiredNonEmptyString(path, "path", "listenToMainState")
        ) {
            return false;
        }
        if (!validateCallback(callback, "listenToMainState")) {
            return false;
        }

        try {
            return await mainStateBridge.listenToMainState(path, callback);
        } catch (error) {
            preloadLog(
                "error",
                `[preload.js] Error in listenToMainState(${path}):`,
                error
            );
            throw error;
        }
    }

    async function setMainState(
        path: MainStatePath,
        value: MainStateSetValue,
        options: MainStateSetOptions = {}
    ): Promise<MainStateSetResponse> {
        if (!validateRequiredNonEmptyString(path, "path", "setMainState")) {
            return false;
        }

        try {
            return await setMainStateInMain(path, value, options);
        } catch (error) {
            preloadLog(
                "error",
                `[preload.js] Error in setMainState(${path}):`,
                error
            );
            throw error;
        }
    }

    async function subscribeToMainState(
        path: MainStatePath,
        callback: MainStateListener
    ): Promise<() => Promise<boolean>> {
        const ok = await listenToMainState(path, callback);
        if (!ok) {
            return () => Promise.resolve(false);
        }
        return () => unlistenFromMainState(path, callback);
    }

    async function unlistenFromMainState(
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ): Promise<MainStateUnlistenResponse> {
        if (
            !validateRequiredNonEmptyString(
                path,
                "path",
                "unlistenFromMainState"
            )
        ) {
            return false;
        }
        if (!validateCallback(callback, "unlistenFromMainState")) {
            return false;
        }

        try {
            return await mainStateBridge.unlistenFromMainState(path, callback);
        } catch (error) {
            preloadLog(
                "error",
                `[preload.js] Error in unlistenFromMainState(${path}):`,
                error
            );
            throw error;
        }
    }

    return {
        getErrors,
        getMainState,
        getMetrics,
        getOperation,
        getOperations,
        listenToMainState,
        setMainState,
        subscribeToMainState,
        unlistenFromMainState,
    };
}

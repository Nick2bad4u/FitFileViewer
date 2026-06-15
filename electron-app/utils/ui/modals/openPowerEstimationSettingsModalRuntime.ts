export interface OpenPowerEstimationSettingsModalRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface OpenPowerEstimationSettingsModalRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "openPowerEstimationSettingsModal requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

const defaultOpenPowerEstimationSettingsModalRuntimeScope: OpenPowerEstimationSettingsModalRuntimeScope =
    globalThis;

export function getOpenPowerEstimationSettingsModalRuntime(
    scope: OpenPowerEstimationSettingsModalRuntimeScope = defaultOpenPowerEstimationSettingsModalRuntimeScope
): OpenPowerEstimationSettingsModalRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

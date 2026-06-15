export interface SettingsStateCoreRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface SettingsStateCoreRuntime {
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: SettingsStateCoreRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "settingsStateCore requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getSettingsStateCoreRuntime(
    scope: SettingsStateCoreRuntimeScope = globalThis
): SettingsStateCoreRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

export interface SettingsStateCoreRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getLocalStorage?: (() => Storage | undefined) | undefined;
}

export interface SettingsStateCoreRuntime {
    addStorageEventListener: (
        listener: (event: StorageEvent) => void,
        signal: AbortSignal
    ) => boolean;
    createAbortController: () => AbortController;
    getLocalStorage: () => Storage | undefined;
}

function getAbortControllerConstructor(
    scope: SettingsStateCoreRuntimeScope
): typeof globalThis.AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "settingsStateCore requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

const defaultSettingsStateCoreRuntimeScope: SettingsStateCoreRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getAddEventListener: () => globalThis.addEventListener,
    getLocalStorage: () => globalThis.localStorage,
};

export function getSettingsStateCoreRuntime(
    scope: SettingsStateCoreRuntimeScope = defaultSettingsStateCoreRuntimeScope
): SettingsStateCoreRuntime {
    return {
        addStorageEventListener(
            listener: (event: StorageEvent) => void,
            signal: AbortSignal
        ): boolean {
            const addEventListener = scope.getAddEventListener?.();
            if (typeof addEventListener !== "function") {
                return false;
            }

            addEventListener("storage", listener, { signal });
            return true;
        },

        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },

        getLocalStorage(): Storage | undefined {
            return scope.getLocalStorage?.();
        },
    };
}

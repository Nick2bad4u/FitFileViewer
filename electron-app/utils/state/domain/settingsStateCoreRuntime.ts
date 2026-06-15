export interface SettingsStateCoreRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly addEventListener?: typeof globalThis.addEventListener | undefined;
    readonly localStorage?: Storage | undefined;
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
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "settingsStateCore requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

const defaultSettingsStateCoreRuntimeScope: SettingsStateCoreRuntimeScope =
    globalThis;

export function getSettingsStateCoreRuntime(
    scope: SettingsStateCoreRuntimeScope = defaultSettingsStateCoreRuntimeScope
): SettingsStateCoreRuntime {
    return {
        addStorageEventListener(
            listener: (event: StorageEvent) => void,
            signal: AbortSignal
        ): boolean {
            const addEventListener = scope.addEventListener;
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
            return scope.localStorage;
        },
    };
}

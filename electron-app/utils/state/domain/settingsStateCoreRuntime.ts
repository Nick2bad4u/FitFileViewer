import {
    type BrowserAbortControllerConstructor,
    type BrowserAddEventListener,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserDateNow,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

export interface SettingsStateCoreRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => BrowserAddEventListener | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getLocalStorage?: (() => Storage | undefined) | undefined;
}

export interface SettingsStateCoreRuntime {
    addStorageEventListener: (
        listener: (event: StorageEvent) => void,
        signal: AbortSignal
    ) => boolean;
    createAbortController: () => AbortController;
    dateNow: () => number;
    getLocalStorage: () => Storage | undefined;
}

function getAbortControllerConstructor(
    scope: SettingsStateCoreRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "settingsStateCore requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

const defaultSettingsStateCoreRuntimeScope: SettingsStateCoreRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getAddEventListener: getBrowserAddEventListener,
    getDateNow: getBrowserDateNow,
    getLocalStorage: getBrowserLocalStorage,
};

function getDateNow(scope: SettingsStateCoreRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("settingsStateCore requires dateNow");
    }

    return dateNow;
}

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

        dateNow(): number {
            return getDateNow(scope)();
        },

        getLocalStorage(): Storage | undefined {
            return scope.getLocalStorage?.();
        },
    };
}

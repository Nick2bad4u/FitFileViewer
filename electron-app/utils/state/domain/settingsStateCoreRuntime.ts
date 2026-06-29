import {
    type BrowserAbortControllerConstructor,
    type BrowserAddEventListener,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserDateNow,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

export interface SettingsStateCoreRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getAddEventListener:
        | (() => BrowserAddEventListener | undefined)
        | undefined;
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
    readonly getLocalStorage: (() => Storage | undefined) | undefined;
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
    if (typeof scope.getAbortController !== "function") {
        throw new TypeError(
            "settingsStateCore requires an AbortController provider"
        );
    }

    const AbortControllerConstructor = scope.getAbortController();
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
    if (typeof scope.getDateNow !== "function") {
        throw new TypeError("settingsStateCore requires a dateNow provider");
    }

    const dateNow = scope.getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("settingsStateCore requires dateNow");
    }

    return dateNow;
}

function getScopedAddEventListener(
    scope: SettingsStateCoreRuntimeScope
): BrowserAddEventListener | undefined {
    if (typeof scope.getAddEventListener !== "function") {
        throw new TypeError(
            "settingsStateCore requires an addEventListener provider"
        );
    }

    return scope.getAddEventListener();
}

function getScopedLocalStorage(
    scope: SettingsStateCoreRuntimeScope
): Storage | undefined {
    if (typeof scope.getLocalStorage !== "function") {
        throw new TypeError(
            "settingsStateCore requires a localStorage provider"
        );
    }

    return scope.getLocalStorage();
}

export function getSettingsStateCoreRuntime(
    scope: SettingsStateCoreRuntimeScope = defaultSettingsStateCoreRuntimeScope
): SettingsStateCoreRuntime {
    return {
        addStorageEventListener(
            listener: (event: StorageEvent) => void,
            signal: AbortSignal
        ): boolean {
            const addEventListener = getScopedAddEventListener(scope);
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
            return getScopedLocalStorage(scope);
        },
    };
}

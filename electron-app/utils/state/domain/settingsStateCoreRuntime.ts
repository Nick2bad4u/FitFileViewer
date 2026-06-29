import {
    type BrowserAbortControllerConstructor,
    type BrowserAddEventListener,
    getBrowserAbortController,
    getBrowserAddEventListener,
    getBrowserDateNow,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

export interface SettingsStateCoreRuntimeScope {
    readonly getAbortController: SettingsStateCoreRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getAddEventListener: SettingsStateCoreRuntimeProvider<BrowserAddEventListener>;
    readonly getDateNow: SettingsStateCoreRuntimeProvider<() => number>;
    readonly getLocalStorage: SettingsStateCoreRuntimeProvider<Storage>;
}

type SettingsStateCoreRuntimeProvider<T> = (() => T | undefined) | undefined;

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
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
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
    const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
    if (typeof dateNow !== "function") {
        throw new TypeError("settingsStateCore requires dateNow");
    }

    return dateNow;
}

function getScopedAddEventListener(
    scope: SettingsStateCoreRuntimeScope
): BrowserAddEventListener | undefined {
    return getRequiredProvider(scope.getAddEventListener, "addEventListener")();
}

function getScopedLocalStorage(
    scope: SettingsStateCoreRuntimeScope
): Storage | undefined {
    return getRequiredProvider(scope.getLocalStorage, "localStorage")();
}

function getRequiredProvider<T>(
    provider: SettingsStateCoreRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `settingsStateCore requires ${article} ${providerName} provider`
        );
    }

    return provider;
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

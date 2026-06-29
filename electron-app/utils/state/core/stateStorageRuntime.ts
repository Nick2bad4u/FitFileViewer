import { getBrowserLocalStorage } from "../../runtime/browserRuntime.js";

export interface StateStorageRuntimeScope {
    readonly getLocalStorage: StateStorageRuntimeProvider<Storage>;
}

export interface StateStorageRuntime {
    getItem: (key: string) => null | string;
    getLocalStorage: () => Storage | undefined;
    removeItem: (key: string) => boolean;
    setItem: (key: string, value: string) => boolean;
}

type StateStorageRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultStateStorageRuntimeScope: StateStorageRuntimeScope = {
    getLocalStorage: getBrowserLocalStorage,
};

function getScopeLocalStorage(
    getLocalStorage: () => Storage | undefined
): Storage | undefined {
    return getLocalStorage();
}

export function getStateStorageRuntime(
    scope: StateStorageRuntimeScope = defaultStateStorageRuntimeScope
): StateStorageRuntime {
    const getLocalStorage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    );

    return {
        getItem(key): null | string {
            return getScopeLocalStorage(getLocalStorage)?.getItem(key) ?? null;
        },

        getLocalStorage(): Storage | undefined {
            return getScopeLocalStorage(getLocalStorage);
        },

        removeItem(key): boolean {
            const storage = getScopeLocalStorage(getLocalStorage);
            if (storage === undefined) {
                return false;
            }

            storage.removeItem(key);
            return true;
        },

        setItem(key, value): boolean {
            const storage = getScopeLocalStorage(getLocalStorage);
            if (storage === undefined) {
                return false;
            }

            storage.setItem(key, value);
            return true;
        },
    };
}

function getRequiredProvider<T>(
    provider: StateStorageRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `stateStorageRuntime requires a ${providerName} provider`
        );
    }

    return provider;
}

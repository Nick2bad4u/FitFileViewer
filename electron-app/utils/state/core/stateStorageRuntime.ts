import { getBrowserLocalStorage } from "../../runtime/browserRuntime.js";

export interface StateStorageRuntimeScope {
    readonly getLocalStorage?: (() => Storage | undefined) | undefined;
}

export interface StateStorageRuntime {
    getItem: (key: string) => null | string;
    getLocalStorage: () => Storage | undefined;
    removeItem: (key: string) => boolean;
    setItem: (key: string, value: string) => boolean;
}

const defaultStateStorageRuntimeScope: StateStorageRuntimeScope = {
    getLocalStorage: getBrowserLocalStorage,
};

function getScopeLocalStorage(
    scope: StateStorageRuntimeScope
): Storage | undefined {
    return scope.getLocalStorage?.();
}

export function getStateStorageRuntime(
    scope: StateStorageRuntimeScope = defaultStateStorageRuntimeScope
): StateStorageRuntime {
    return {
        getItem(key): null | string {
            return getScopeLocalStorage(scope)?.getItem(key) ?? null;
        },

        getLocalStorage(): Storage | undefined {
            return getScopeLocalStorage(scope);
        },

        removeItem(key): boolean {
            const storage = getScopeLocalStorage(scope);
            if (storage === undefined) {
                return false;
            }

            storage.removeItem(key);
            return true;
        },

        setItem(key, value): boolean {
            const storage = getScopeLocalStorage(scope);
            if (storage === undefined) {
                return false;
            }

            storage.setItem(key, value);
            return true;
        },
    };
}

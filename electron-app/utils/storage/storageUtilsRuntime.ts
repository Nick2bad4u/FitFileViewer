/**
 * Minimal storage API used by renderer helpers.
 */
import { getBrowserLocalStorage } from "../runtime/browserRuntime.js";

export type StorageLike = {
    getItem?: (key: string) => null | string;
    removeItem?: (key: string) => void;
    setItem?: (key: string, value: string) => void;
};

/**
 * Storage-provider callback for tests or alternate storage scopes.
 */
export type StorageProvider = () => null | StorageLike;

export interface StorageUtilsRuntimeScope {
    readonly getLocalStorage: () => null | StorageLike;
}

export interface StorageUtilsRuntime {
    getDefaultStorage: () => null | StorageLike;
}

const defaultStorageUtilsRuntimeScope: StorageUtilsRuntimeScope = {
    getLocalStorage: () => getBrowserLocalStorage() ?? null,
};

function getScopeLocalStorage(
    scope: StorageUtilsRuntimeScope
): null | StorageLike {
    if (typeof scope.getLocalStorage !== "function") {
        throw new TypeError("storageUtils requires a localStorage provider");
    }

    return scope.getLocalStorage();
}

export function getStorageUtilsRuntime(
    scope: StorageUtilsRuntimeScope = defaultStorageUtilsRuntimeScope
): StorageUtilsRuntime {
    return {
        getDefaultStorage(): null | StorageLike {
            return getScopeLocalStorage(scope);
        },
    };
}

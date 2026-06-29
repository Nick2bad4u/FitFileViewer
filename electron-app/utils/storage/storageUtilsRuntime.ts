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
    readonly getLocalStorage: StorageUtilsRuntimeProvider<StorageLike>;
}

export interface StorageUtilsRuntime {
    getDefaultStorage: () => null | StorageLike;
}

type StorageUtilsRuntimeProvider<T> = (() => T | null) | undefined;

const defaultStorageUtilsRuntimeScope: StorageUtilsRuntimeScope = {
    getLocalStorage: () => getBrowserLocalStorage() ?? null,
};

function getScopeLocalStorage(
    getLocalStorage: StorageProvider
): null | StorageLike {
    return getLocalStorage();
}

export function getStorageUtilsRuntime(
    scope: StorageUtilsRuntimeScope = defaultStorageUtilsRuntimeScope
): StorageUtilsRuntime {
    const getLocalStorage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    );

    return {
        getDefaultStorage(): null | StorageLike {
            return getScopeLocalStorage(getLocalStorage);
        },
    };
}

function getRequiredProvider<T>(
    provider: StorageUtilsRuntimeProvider<T>,
    providerName: string
): () => T | null {
    if (typeof provider !== "function") {
        throw new TypeError(`storageUtils requires a ${providerName} provider`);
    }

    return provider;
}

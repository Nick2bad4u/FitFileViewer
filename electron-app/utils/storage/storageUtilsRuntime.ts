/**
 * Minimal storage API used by renderer helpers.
 */
export type StorageLike = {
    getItem?: (key: string) => null | string;
    removeItem?: (key: string) => void;
    setItem?: (key: string, value: string) => void;
};

/**
 * Optional storage-provider callback for tests or alternate storage scopes.
 */
export type StorageProvider = () => null | StorageLike;

export interface StorageUtilsRuntimeScope {
    readonly getLocalStorage?: (() => null | StorageLike) | undefined;
}

export interface StorageUtilsRuntime {
    getDefaultStorage: () => null | StorageLike;
}

const defaultStorageUtilsRuntimeScope: StorageUtilsRuntimeScope = {
    getLocalStorage: () => globalThis.localStorage ?? null,
};

function getScopeLocalStorage(
    scope: StorageUtilsRuntimeScope
): null | StorageLike {
    return scope.getLocalStorage?.() ?? null;
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

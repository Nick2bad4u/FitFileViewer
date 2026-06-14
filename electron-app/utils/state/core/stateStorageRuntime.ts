export interface StateStorageRuntimeScope {
    readonly localStorage?: Storage | undefined;
}

export interface StateStorageRuntime {
    getItem: (key: string) => null | string;
    getLocalStorage: () => Storage | undefined;
    setItem: (key: string, value: string) => boolean;
}

export function getStateStorageRuntime(
    scope: StateStorageRuntimeScope = globalThis
): StateStorageRuntime {
    return {
        getItem(key): null | string {
            return scope.localStorage?.getItem(key) ?? null;
        },

        getLocalStorage(): Storage | undefined {
            return scope.localStorage;
        },

        setItem(key, value): boolean {
            const storage = scope.localStorage;
            if (storage === undefined) {
                return false;
            }

            storage.setItem(key, value);
            return true;
        },
    };
}

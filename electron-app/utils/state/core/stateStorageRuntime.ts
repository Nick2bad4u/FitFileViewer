export interface StateStorageRuntimeScope {
    readonly localStorage?: Storage | undefined;
}

export interface StateStorageRuntime {
    getItem: (key: string) => null | string;
    getLocalStorage: () => Storage | undefined;
    removeItem: (key: string) => boolean;
    setItem: (key: string, value: string) => boolean;
}

const defaultStateStorageRuntimeScope: StateStorageRuntimeScope = {
    get localStorage() {
        return globalThis.localStorage;
    },
};

export function getStateStorageRuntime(
    scope: StateStorageRuntimeScope = defaultStateStorageRuntimeScope
): StateStorageRuntime {
    return {
        getItem(key): null | string {
            return scope.localStorage?.getItem(key) ?? null;
        },

        getLocalStorage(): Storage | undefined {
            return scope.localStorage;
        },

        removeItem(key): boolean {
            const storage = scope.localStorage;
            if (storage === undefined) {
                return false;
            }

            storage.removeItem(key);
            return true;
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

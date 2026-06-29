import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserLocalStorage,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type SetupThemeTimer = BrowserTimerHandle;
type SetupThemeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;
type SetupThemeRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface SetupThemeRuntimeScope {
    readonly getClearTimeout: SetupThemeRuntimeProvider<BrowserClearTimeout>;
    readonly getLocalStorage: SetupThemeRuntimeProvider<SetupThemeStorage>;
    readonly getSetTimeout: SetupThemeRuntimeProvider<BrowserSetTimeout>;
}

export interface SetupThemeRuntime {
    clearTimeout: (timer: SetupThemeTimer) => void;
    getStorageItem: (key: string) => string | null;
    removeStorageItem: (key: string) => void;
    setTimeout: (callback: () => void, delayMs: number) => SetupThemeTimer;
    setStorageItem: (key: string, value: string) => void;
}

const defaultSetupThemeRuntimeScope: SetupThemeRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getLocalStorage: getBrowserLocalStorage,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredProvider<T>(
    provider: SetupThemeRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `setupThemeRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

function getScopeClearTimeout(
    scope: SetupThemeRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getRequiredLocalStorage(
    scope: SetupThemeRuntimeScope
): SetupThemeStorage {
    const storage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    )();
    if (!storage) {
        throw new TypeError("setupThemeRuntime requires localStorage");
    }

    return storage;
}

function getScopeSetTimeout(
    scope: SetupThemeRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

export function getSetupThemeRuntime(
    scope: SetupThemeRuntimeScope = defaultSetupThemeRuntimeScope
): SetupThemeRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("setupThemeRuntime requires clearTimeout");
            }

            clearTimeoutRef(timer);
        },
        getStorageItem(key): string | null {
            return getRequiredLocalStorage(scope).getItem(key);
        },
        removeStorageItem(key): void {
            getRequiredLocalStorage(scope).removeItem(key);
        },
        setTimeout(callback, delayMs): SetupThemeTimer {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("setupThemeRuntime requires setTimeout");
            }

            return setTimeoutRef(callback, delayMs);
        },
        setStorageItem(key, value): void {
            getRequiredLocalStorage(scope).setItem(key, value);
        },
    };
}

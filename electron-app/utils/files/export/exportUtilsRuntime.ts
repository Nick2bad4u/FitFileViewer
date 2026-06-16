type ConfirmDangerousActionFunction = (message?: string) => boolean;

type OpenPrintWindowFunction = (
    url?: string | URL,
    target?: string,
    features?: string
) => Window | null;

export type ExportStorageLike = {
    getItem?: (key: string) => null | string;
    removeItem?: (key: string) => void;
    setItem?: (key: string, value: string) => void;
};

export type ExportStorageProvider = () => ExportStorageLike | null;

export type SecureRandomScope = {
    crypto?: Pick<Crypto, "getRandomValues">;
};

export interface ExportUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly confirmDangerousAction?:
        | ConfirmDangerousActionFunction
        | undefined;
    readonly crypto?: Pick<Crypto, "getRandomValues"> | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getConfirmDangerousAction?:
        | (() => ConfirmDangerousActionFunction | undefined)
        | undefined;
    readonly getOpenPrintWindow?:
        | (() => OpenPrintWindowFunction | undefined)
        | undefined;
    readonly getSecureRandomCrypto?:
        | (() => Pick<Crypto, "getRandomValues"> | undefined)
        | undefined;
    readonly getStorage?: ExportStorageProvider | undefined;
    readonly localStorage?: ExportStorageLike | null | undefined;
    readonly openPrintWindow?: OpenPrintWindowFunction | undefined;
}

export interface ExportUtilsRuntime {
    confirmDangerousAction: (message: string) => boolean;
    createAbortController: () => AbortController;
    getSecureRandomScope: () => SecureRandomScope;
    getStorage: () => ExportStorageLike | null;
    openPrintWindow: (
        url?: string | URL,
        target?: string,
        features?: string
    ) => Window | null;
}

const browserGlobal = globalThis as typeof globalThis & {
    confirm?: ConfirmDangerousActionFunction | undefined;
    crypto?: Pick<Crypto, "getRandomValues"> | undefined;
    localStorage?: ExportStorageLike | null | undefined;
    open?: OpenPrintWindowFunction | undefined;
};

const defaultExportUtilsRuntimeScope: ExportUtilsRuntimeScope = {
    getConfirmDangerousAction: () => (message) =>
        browserGlobal.confirm?.(message) ?? false,
    getAbortController: () => globalThis.AbortController,
    getOpenPrintWindow: () => (url, target, features) =>
        browserGlobal.open?.(url, target, features) ?? null,
    getSecureRandomCrypto: () => browserGlobal.crypto,
    getStorage: () => browserGlobal.localStorage ?? null,
};

function getScopeAbortController(
    scope: ExportUtilsRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeConfirmDangerousAction(
    scope: ExportUtilsRuntimeScope
): ConfirmDangerousActionFunction | undefined {
    return scope.getConfirmDangerousAction?.() ?? scope.confirmDangerousAction;
}

function getScopeOpenPrintWindow(
    scope: ExportUtilsRuntimeScope
): OpenPrintWindowFunction | undefined {
    return scope.getOpenPrintWindow?.() ?? scope.openPrintWindow;
}

function getScopeSecureRandomCrypto(
    scope: ExportUtilsRuntimeScope
): Pick<Crypto, "getRandomValues"> | undefined {
    const cryptoObject = scope.getSecureRandomCrypto?.() ?? scope.crypto;
    return cryptoObject &&
        typeof cryptoObject === "object" &&
        typeof Reflect.get(cryptoObject, "getRandomValues") === "function"
        ? cryptoObject
        : undefined;
}

function getScopeStorage(
    scope: ExportUtilsRuntimeScope
): ExportStorageLike | null {
    const storage = scope.getStorage?.() ?? scope.localStorage;

    return storage &&
        typeof storage === "object" &&
        (typeof Reflect.get(storage, "getItem") === "function" ||
            typeof Reflect.get(storage, "setItem") === "function" ||
            typeof Reflect.get(storage, "removeItem") === "function")
        ? storage
        : null;
}

export function getExportUtilsRuntime(
    scope: ExportUtilsRuntimeScope = defaultExportUtilsRuntimeScope
): ExportUtilsRuntime {
    return {
        confirmDangerousAction(message: string): boolean {
            const confirmDangerousAction =
                getScopeConfirmDangerousAction(scope);
            return confirmDangerousAction?.(message) ?? false;
        },

        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "exportUtils requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },

        getSecureRandomScope(): SecureRandomScope {
            const cryptoObject = getScopeSecureRandomCrypto(scope);
            return cryptoObject ? { crypto: cryptoObject } : {};
        },

        getStorage(): ExportStorageLike | null {
            return getScopeStorage(scope);
        },

        openPrintWindow(url, target, features): Window | null {
            const openPrintWindow = getScopeOpenPrintWindow(scope);
            return openPrintWindow?.(url, target, features) ?? null;
        },
    };
}

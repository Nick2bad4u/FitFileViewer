type ConfirmDangerousActionFunction = (message?: string) => boolean;

type OpenPrintWindowFunction = (
    url?: Readonly<URL> | string,
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
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getConfirmDangerousAction?:
        | (() => ConfirmDangerousActionFunction | undefined)
        | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getOpenPrintWindow?:
        | (() => OpenPrintWindowFunction | undefined)
        | undefined;
    readonly getSecureRandomCrypto?:
        | (() => Pick<Crypto, "getRandomValues"> | undefined)
        | undefined;
    readonly getStorage?: ExportStorageProvider | undefined;
}

export interface ExportUtilsRuntime {
    readonly addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly confirmDangerousAction: (message: string) => boolean;
    readonly createAbortController: () => AbortController;
    readonly getSecureRandomScope: () => SecureRandomScope;
    readonly getStorage: () => ExportStorageLike | null;
    readonly openPrintWindow: (
        url?: Readonly<URL> | string,
        target?: string,
        features?: string
    ) => Window | null;
}

const defaultExportUtilsRuntimeScope: ExportUtilsRuntimeScope = {
    getConfirmDangerousAction: () => {
        const confirmDangerousAction = globalThis.confirm;
        return typeof confirmDangerousAction === "function"
            ? (message) => confirmDangerousAction.call(globalThis, message)
            : undefined;
    },
    getAbortController: () => globalThis.AbortController,
    getDocumentEventTarget: () => getGlobalDocument(),
    getOpenPrintWindow: () => {
        const openPrintWindow = globalThis.open;
        return typeof openPrintWindow === "function"
            ? (url, target, features) =>
                  openPrintWindow.call(globalThis, url, target, features)
            : undefined;
    },
    getSecureRandomCrypto: () => globalThis.crypto,
    getStorage: () => globalThis.localStorage ?? null,
};

function getGlobalDocument(): Document {
    return globalThis.document;
}

function getScopeAbortController(
    scope: ExportUtilsRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeConfirmDangerousAction(
    scope: ExportUtilsRuntimeScope
): ConfirmDangerousActionFunction | undefined {
    return scope.getConfirmDangerousAction?.();
}

function getScopeDocumentEventTarget(
    scope: ExportUtilsRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.();
}

function getScopeOpenPrintWindow(
    scope: ExportUtilsRuntimeScope
): OpenPrintWindowFunction | undefined {
    return scope.getOpenPrintWindow?.();
}

function getScopeSecureRandomCrypto(
    scope: ExportUtilsRuntimeScope
): Pick<Crypto, "getRandomValues"> | undefined {
    const cryptoObject = scope.getSecureRandomCrypto?.();
    return cryptoObject &&
        typeof cryptoObject === "object" &&
        typeof Reflect.get(cryptoObject, "getRandomValues") === "function"
        ? cryptoObject
        : undefined;
}

function getScopeStorage(
    scope: ExportUtilsRuntimeScope
): ExportStorageLike | null {
    const storage = scope.getStorage?.();

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
        addDocumentKeydownListener(listener, options): void {
            const documentEventTarget = getScopeDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "exportUtils requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("keydown", listener, options);
        },

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

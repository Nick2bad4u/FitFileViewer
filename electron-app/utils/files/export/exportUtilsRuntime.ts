import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserConfirm,
    getBrowserCrypto,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
    getBrowserOpen,
} from "../../runtime/browserRuntime.js";

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
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getConfirmDangerousAction?:
        | (() => ConfirmDangerousActionFunction | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
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
    readonly appendToBody: (element: HTMLElement) => void;
    readonly confirmDangerousAction: (message: string) => boolean;
    readonly createAbortController: () => AbortController;
    readonly getActiveElement: () => HTMLElement | null;
    readonly getSecureRandomScope: () => SecureRandomScope;
    readonly getStorage: () => ExportStorageLike | null;
    readonly openPrintWindow: (
        url?: Readonly<URL> | string,
        target?: string,
        features?: string
    ) => Window | null;
}

const defaultExportUtilsRuntimeScope: ExportUtilsRuntimeScope = {
    getConfirmDangerousAction: getBrowserConfirm,
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getOpenPrintWindow: getBrowserOpen,
    getSecureRandomCrypto: getBrowserCrypto,
    getStorage: () => getBrowserLocalStorage() ?? null,
};

function getScopeAbortController(
    scope: ExportUtilsRuntimeScope
): BrowserAbortControllerConstructor | undefined {
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
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
}

function getScopeDocument(
    scope: ExportUtilsRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getScopeHTMLElement(
    scope: ExportUtilsRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return scope.getHTMLElement?.();
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
        typeof cryptoObject.getRandomValues === "function"
        ? cryptoObject
        : undefined;
}

function getScopeStorage(
    scope: ExportUtilsRuntimeScope
): ExportStorageLike | null {
    const storage = scope.getStorage?.();

    return storage &&
        typeof storage === "object" &&
        (typeof storage.getItem === "function" ||
            typeof storage.setItem === "function" ||
            typeof storage.removeItem === "function")
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

        appendToBody(element): void {
            const documentRef = getScopeDocument(scope);
            if (!documentRef) {
                throw new TypeError("exportUtils requires a document runtime");
            }

            documentRef.body.append(element);
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

        getActiveElement(): HTMLElement | null {
            const documentRef = getScopeDocument(scope);
            if (!documentRef) {
                throw new TypeError("exportUtils requires a document runtime");
            }

            const HTMLElementConstructor = getScopeHTMLElement(scope);
            if (typeof HTMLElementConstructor !== "function") {
                throw new TypeError(
                    "exportUtils requires an HTMLElement runtime"
                );
            }

            return documentRef.activeElement instanceof HTMLElementConstructor
                ? documentRef.activeElement
                : null;
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

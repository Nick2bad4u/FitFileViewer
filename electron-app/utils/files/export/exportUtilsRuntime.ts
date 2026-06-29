import {
    type BrowserAbortControllerConstructor,
    type BrowserClipboardItemConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserClipboard,
    getBrowserClipboardItem,
    getBrowserConfirm,
    getBrowserCrypto,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
    getBrowserOpen,
} from "../../runtime/browserRuntime.js";
import { getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue } from "../../runtime/processEnvironment.js";

type ConfirmDangerousActionFunction = (message?: string) => boolean;

type OpenPrintWindowFunction = (
    url?: Readonly<URL> | string,
    target?: string,
    features?: string
) => Window | null;
type ExportUtilsRuntimeProvider<T> = (() => T) | undefined;

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
    readonly getAbortController: ExportUtilsRuntimeProvider<
        BrowserAbortControllerConstructor | undefined
    >;
    readonly getClipboard: ExportUtilsRuntimeProvider<Clipboard | undefined>;
    readonly getClipboardItem: ExportUtilsRuntimeProvider<
        BrowserClipboardItemConstructor | undefined
    >;
    readonly getConfirmDangerousAction: ExportUtilsRuntimeProvider<
        ConfirmDangerousActionFunction | undefined
    >;
    readonly getDocument: ExportUtilsRuntimeProvider<Document | undefined>;
    readonly getDocumentEventTarget: ExportUtilsRuntimeProvider<
        Document | undefined
    >;
    readonly getHTMLElement: ExportUtilsRuntimeProvider<
        BrowserHTMLElementConstructor | undefined
    >;
    readonly getOpenPrintWindow: ExportUtilsRuntimeProvider<
        OpenPrintWindowFunction | undefined
    >;
    readonly getProcessEnvironmentValue:
        | ((name: string) => string | undefined)
        | undefined;
    readonly getSecureRandomCrypto: ExportUtilsRuntimeProvider<
        Pick<Crypto, "getRandomValues"> | undefined
    >;
    readonly getStorage: ExportUtilsRuntimeProvider<ExportStorageLike | null>;
}

export interface ExportUtilsRuntime {
    readonly addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly appendToBody: (element: HTMLElement) => void;
    readonly confirmDangerousAction: (message: string) => boolean;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly getActiveElement: () => HTMLElement | null;
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
    readonly getSecureRandomScope: () => SecureRandomScope;
    readonly getStorage: () => ExportStorageLike | null;
    readonly openPrintWindow: (
        url?: Readonly<URL> | string,
        target?: string,
        features?: string
    ) => Window | null;
    readonly querySelector: <E extends Element = Element>(
        selectors: string
    ) => E | null;
    readonly writeClipboardPngBlob: (blob: Blob) => Promise<boolean>;
    readonly writeClipboardText: (text: string) => Promise<boolean>;
}

const defaultExportUtilsRuntimeScope: ExportUtilsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClipboard: getBrowserClipboard,
    getClipboardItem: getBrowserClipboardItem,
    getConfirmDangerousAction: getBrowserConfirm,
    getDocument: getBrowserDocument,
    getDocumentEventTarget: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getOpenPrintWindow: getBrowserOpen,
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
    getSecureRandomCrypto: getBrowserCrypto,
    getStorage: () => getBrowserLocalStorage() ?? null,
};

function getRequiredProvider<T>(
    provider: ExportUtilsRuntimeProvider<T>,
    providerName: string
): () => T {
    if (typeof provider !== "function") {
        throw new TypeError(`exportUtils requires ${providerName} provider`);
    }

    return provider;
}

function getScopeAbortController(
    getAbortController: () => BrowserAbortControllerConstructor | undefined
): BrowserAbortControllerConstructor | undefined {
    return getAbortController();
}

function getScopeConfirmDangerousAction(
    getConfirmDangerousAction: () => ConfirmDangerousActionFunction | undefined
): ConfirmDangerousActionFunction | undefined {
    return getConfirmDangerousAction();
}

function getScopeClipboard(
    getClipboard: () => Clipboard | undefined
): Clipboard | undefined {
    const clipboard = getClipboard();
    return clipboard && typeof clipboard === "object" ? clipboard : undefined;
}

function getScopeClipboardItem(
    getClipboardItem: () => BrowserClipboardItemConstructor | undefined
): BrowserClipboardItemConstructor | undefined {
    const ClipboardItemConstructor = getClipboardItem();
    return typeof ClipboardItemConstructor === "function"
        ? ClipboardItemConstructor
        : undefined;
}

function getScopeDocumentEventTarget(
    getDocumentEventTarget: () => Document | undefined,
    getDocument: () => Document | undefined
): Document | undefined {
    return getDocumentEventTarget() ?? getDocument();
}

function getScopeDocument(
    getDocument: () => Document | undefined
): Document | undefined {
    return getDocument();
}

function getScopeHTMLElement(
    getHTMLElement: () => BrowserHTMLElementConstructor | undefined
): BrowserHTMLElementConstructor | undefined {
    return getHTMLElement();
}

function getScopeOpenPrintWindow(
    getOpenPrintWindow: () => OpenPrintWindowFunction | undefined
): OpenPrintWindowFunction | undefined {
    return getOpenPrintWindow();
}

function getRequiredProcessEnvironmentProvider(
    provider: ExportUtilsRuntimeScope["getProcessEnvironmentValue"]
): (name: string) => string | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            "exportUtils requires processEnvironmentValue provider"
        );
    }

    return provider;
}

function getScopeSecureRandomCrypto(
    getSecureRandomCrypto: () => Pick<Crypto, "getRandomValues"> | undefined
): Pick<Crypto, "getRandomValues"> | undefined {
    const cryptoObject = getSecureRandomCrypto();
    return cryptoObject &&
        typeof cryptoObject === "object" &&
        typeof cryptoObject.getRandomValues === "function"
        ? cryptoObject
        : undefined;
}

function getScopeStorage(
    getStorage: () => ExportStorageLike | null
): ExportStorageLike | null {
    const storage = getStorage();

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
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getClipboard = getRequiredProvider(scope.getClipboard, "clipboard");
    const getClipboardItem = getRequiredProvider(
        scope.getClipboardItem,
        "ClipboardItem"
    );
    const getConfirmDangerousAction = getRequiredProvider(
        scope.getConfirmDangerousAction,
        "confirmDangerousAction"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getDocumentEventTarget = getRequiredProvider(
        scope.getDocumentEventTarget,
        "documentEventTarget"
    );
    const getHTMLElement = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    );
    const getOpenPrintWindow = getRequiredProvider(
        scope.getOpenPrintWindow,
        "openPrintWindow"
    );
    const getProcessEnvironmentValue = getRequiredProcessEnvironmentProvider(
        scope.getProcessEnvironmentValue
    );
    const getSecureRandomCrypto = getRequiredProvider(
        scope.getSecureRandomCrypto,
        "secureRandomCrypto"
    );
    const getStorage = getRequiredProvider(scope.getStorage, "storage");

    return {
        addDocumentKeydownListener(listener, options): void {
            const documentEventTarget = getScopeDocumentEventTarget(
                getDocumentEventTarget,
                getDocument
            );
            if (!documentEventTarget) {
                throw new TypeError(
                    "exportUtils requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("keydown", listener, options);
        },

        appendToBody(element): void {
            const documentRef = getScopeDocument(getDocument);
            if (!documentRef) {
                throw new TypeError("exportUtils requires a document runtime");
            }

            documentRef.body.append(element);
        },

        confirmDangerousAction(message: string): boolean {
            const confirmDangerousAction = getScopeConfirmDangerousAction(
                getConfirmDangerousAction
            );
            return confirmDangerousAction?.(message) ?? false;
        },

        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getScopeAbortController(getAbortController);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "exportUtils requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },

        createElement(tagName) {
            const documentRef = getScopeDocument(getDocument);
            if (!documentRef) {
                throw new TypeError("exportUtils requires a document runtime");
            }

            return documentRef.createElement(tagName);
        },

        getActiveElement(): HTMLElement | null {
            const documentRef = getScopeDocument(getDocument);
            if (!documentRef) {
                throw new TypeError("exportUtils requires a document runtime");
            }

            const HTMLElementConstructor = getScopeHTMLElement(getHTMLElement);
            if (typeof HTMLElementConstructor !== "function") {
                throw new TypeError(
                    "exportUtils requires an HTMLElement runtime"
                );
            }

            return documentRef.activeElement instanceof HTMLElementConstructor
                ? documentRef.activeElement
                : null;
        },

        getProcessEnvironmentValue(name): string | undefined {
            return getProcessEnvironmentValue(name);
        },

        getSecureRandomScope(): SecureRandomScope {
            const cryptoObject = getScopeSecureRandomCrypto(
                getSecureRandomCrypto
            );
            return cryptoObject ? { crypto: cryptoObject } : {};
        },

        getStorage(): ExportStorageLike | null {
            return getScopeStorage(getStorage);
        },

        openPrintWindow(url, target, features): Window | null {
            const openPrintWindow = getScopeOpenPrintWindow(getOpenPrintWindow);
            return openPrintWindow?.(url, target, features) ?? null;
        },

        querySelector(selectors) {
            const documentRef = getScopeDocument(getDocument);
            if (!documentRef) {
                throw new TypeError("exportUtils requires a document runtime");
            }

            return documentRef.querySelector(selectors);
        },

        async writeClipboardPngBlob(blob): Promise<boolean> {
            const clipboard = getScopeClipboard(getClipboard);
            const ClipboardItemConstructor =
                getScopeClipboardItem(getClipboardItem);
            if (
                typeof clipboard?.write !== "function" ||
                typeof ClipboardItemConstructor !== "function"
            ) {
                return false;
            }

            await clipboard.write([
                new ClipboardItemConstructor({ "image/png": blob }),
            ]);
            return true;
        },

        async writeClipboardText(text): Promise<boolean> {
            const clipboard = getScopeClipboard(getClipboard);
            if (typeof clipboard?.writeText !== "function") {
                return false;
            }

            await clipboard.writeText(text);
            return true;
        },
    };
}

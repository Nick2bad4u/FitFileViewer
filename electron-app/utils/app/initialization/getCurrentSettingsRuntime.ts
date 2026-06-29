import {
    type BrowserClearTimeout,
    type BrowserHTMLInputElementConstructor,
    type BrowserHTMLSelectElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserHTMLInputElement,
    getBrowserHTMLSelectElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type GetCurrentSettingsTimer = BrowserTimerHandle;

export interface GetCurrentSettingsRuntimeScope {
    readonly getClearTimeout: GetCurrentSettingsRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: GetCurrentSettingsRuntimeProvider<Document>;
    readonly getHTMLInputElement: GetCurrentSettingsRuntimeProvider<BrowserHTMLInputElementConstructor>;
    readonly getHTMLSelectElement: GetCurrentSettingsRuntimeProvider<BrowserHTMLSelectElementConstructor>;
    readonly getSetTimeout: GetCurrentSettingsRuntimeProvider<BrowserSetTimeout>;
}

export interface GetCurrentSettingsRuntime {
    readonly clearTimeout: (timer: GetCurrentSettingsTimer) => void;
    readonly documentRef: Document;
    readonly isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    readonly isHTMLSelectElement: (
        value: unknown
    ) => value is HTMLSelectElement;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => GetCurrentSettingsTimer;
}

const defaultGetCurrentSettingsRuntimeScope: GetCurrentSettingsRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getHTMLInputElement: getBrowserHTMLInputElement,
    getHTMLSelectElement: getBrowserHTMLSelectElement,
    getSetTimeout: getBrowserSetTimeout,
};

type GetCurrentSettingsRuntimeProvider<T> = (() => T | undefined) | undefined;

function getRequiredProvider<T>(
    provider: GetCurrentSettingsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `getCurrentSettingsRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

export function getGetCurrentSettingsRuntime(
    scope: GetCurrentSettingsRuntimeScope = defaultGetCurrentSettingsRuntimeScope
): GetCurrentSettingsRuntime {
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getHTMLInputElement = getRequiredProvider(
        scope.getHTMLInputElement,
        "HTMLInputElement"
    );
    const getHTMLSelectElement = getRequiredProvider(
        scope.getHTMLSelectElement,
        "HTMLSelectElement"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        get documentRef(): Document {
            const documentRef = getDocument();
            if (!documentRef) {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires document"
                );
            }

            return documentRef;
        },
        isHTMLInputElement(value): value is HTMLInputElement {
            return (
                value instanceof
                getHTMLInputElementConstructor(getHTMLInputElement)
            );
        },
        isHTMLSelectElement(value): value is HTMLSelectElement {
            return (
                value instanceof
                getHTMLSelectElementConstructor(getHTMLSelectElement)
            );
        },
        setTimeout(callback, delayMs): GetCurrentSettingsTimer {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

function getHTMLInputElementConstructor(
    getHTMLInputElement: () => BrowserHTMLInputElementConstructor | undefined
): BrowserHTMLInputElementConstructor {
    const HTMLInputElementConstructor = getHTMLInputElement();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "getCurrentSettingsRuntime requires HTMLInputElement"
        );
    }

    return HTMLInputElementConstructor;
}

function getHTMLSelectElementConstructor(
    getHTMLSelectElement: () => BrowserHTMLSelectElementConstructor | undefined
): BrowserHTMLSelectElementConstructor {
    const HTMLSelectElementConstructor = getHTMLSelectElement();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "getCurrentSettingsRuntime requires HTMLSelectElement"
        );
    }

    return HTMLSelectElementConstructor;
}

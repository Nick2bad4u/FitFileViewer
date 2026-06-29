import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type EnsureChartSettingsDropdownsTimerHandle = BrowserTimerHandle;

type DeferredCallback = () => void;
type EnsureChartSettingsDropdownsTimeoutScheduler = (
    callback: DeferredCallback,
    delay: number
) => EnsureChartSettingsDropdownsTimerHandle;
type EnsureChartSettingsDropdownsRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface EnsureChartSettingsDropdownsRuntimeScope {
    readonly getAbortController: EnsureChartSettingsDropdownsRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: EnsureChartSettingsDropdownsRuntimeProvider<Document>;
    readonly getHTMLElement: EnsureChartSettingsDropdownsRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getSetTimeout: EnsureChartSettingsDropdownsRuntimeProvider<BrowserSetTimeout>;
}

export interface EnsureChartSettingsDropdownsRuntime {
    readonly document: Document;
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getBody: () => HTMLElement;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    setTimeout: (
        callback: DeferredCallback,
        delay: number
    ) => EnsureChartSettingsDropdownsTimerHandle;
}

function getRequiredProvider<T>(
    provider: EnsureChartSettingsDropdownsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `ensureChartSettingsDropdowns requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getTimeoutScheduler(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): EnsureChartSettingsDropdownsTimeoutScheduler {
    const timeoutScheduler = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    )();
    if (typeof timeoutScheduler !== "function") {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires a setTimeout runtime"
        );
    }

    return timeoutScheduler;
}

const defaultEnsureChartSettingsDropdownsRuntimeScope: EnsureChartSettingsDropdownsRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getSetTimeout: getBrowserSetTimeout,
    };

export function getEnsureChartSettingsDropdownsRuntime(
    scope: EnsureChartSettingsDropdownsRuntimeScope = defaultEnsureChartSettingsDropdownsRuntimeScope
): EnsureChartSettingsDropdownsRuntime {
    const runtimeDocument = getDocument(scope);

    return {
        document: runtimeDocument,
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return runtimeDocument.createElement(tagName);
        },
        getBody(): HTMLElement {
            return runtimeDocument.body;
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
        setTimeout(
            callback: DeferredCallback,
            delay: number
        ): EnsureChartSettingsDropdownsTimerHandle {
            return getTimeoutScheduler(scope)(callback, delay);
        },
    };
}

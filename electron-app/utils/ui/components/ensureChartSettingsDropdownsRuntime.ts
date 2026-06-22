export type EnsureChartSettingsDropdownsTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

type DeferredCallback = () => void;
type EnsureChartSettingsDropdownsTimeoutScheduler = (
    callback: DeferredCallback,
    delay: number
) => EnsureChartSettingsDropdownsTimerHandle;

export interface EnsureChartSettingsDropdownsRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => EnsureChartSettingsDropdownsTimeoutScheduler | undefined)
        | undefined;
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

function getAbortControllerConstructor(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): typeof globalThis.AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
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
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
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
    const timeoutScheduler = scope.getSetTimeout?.();
    if (typeof timeoutScheduler !== "function") {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires a setTimeout runtime"
        );
    }

    return timeoutScheduler;
}

const defaultEnsureChartSettingsDropdownsRuntimeScope: EnsureChartSettingsDropdownsRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
        getHTMLElement: () => globalThis.HTMLElement,
        getSetTimeout: () => globalThis.setTimeout,
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

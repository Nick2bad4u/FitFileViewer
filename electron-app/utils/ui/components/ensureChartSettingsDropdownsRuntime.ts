export type EnsureChartSettingsDropdownsTimerHandle = ReturnType<
    typeof setTimeout
>;

type DeferredCallback = () => void;

export interface EnsureChartSettingsDropdownsRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly setTimeout?:
        | ((
              callback: DeferredCallback,
              delay: number
          ) => EnsureChartSettingsDropdownsTimerHandle)
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
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
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
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): typeof HTMLElement {
    const HTMLElementConstructor =
        scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getTimeoutScheduler(
    scope: EnsureChartSettingsDropdownsRuntimeScope
): (
    callback: DeferredCallback,
    delay: number
) => EnsureChartSettingsDropdownsTimerHandle {
    const timeoutScheduler = scope.setTimeout;
    if (typeof timeoutScheduler !== "function") {
        throw new TypeError(
            "ensureChartSettingsDropdowns requires a setTimeout runtime"
        );
    }

    return timeoutScheduler;
}

export function getEnsureChartSettingsDropdownsRuntime(
    scope: EnsureChartSettingsDropdownsRuntimeScope = globalThis
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

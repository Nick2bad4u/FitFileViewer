export type QuickColorSwitcherTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type QuickColorSwitcherSetTimeout = (
    callback: () => void,
    timeout: number
) => QuickColorSwitcherTimerHandle;

export interface QuickColorSwitcherRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => QuickColorSwitcherSetTimeout | undefined)
        | undefined;
    readonly setTimeout?: QuickColorSwitcherSetTimeout | undefined;
}

export interface QuickColorSwitcherRuntime {
    addDocumentClickListener(
        listener: EventListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    clearTimeout(handle: QuickColorSwitcherTimerHandle): void;
    createAbortController(): AbortController;
    setTimeout(
        callback: () => void,
        timeout: number
    ): QuickColorSwitcherTimerHandle;
}

const defaultQuickColorSwitcherRuntimeScope: QuickColorSwitcherRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getSetTimeout: () => globalThis.setTimeout,
};

function getAbortControllerConstructor(
    scope: QuickColorSwitcherRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getClearTimeout(
    scope: QuickColorSwitcherRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getDocument(
    scope: QuickColorSwitcherRuntimeScope
): Document | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getSetTimeout(
    scope: QuickColorSwitcherRuntimeScope
): QuickColorSwitcherSetTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

export function getQuickColorSwitcherRuntime(
    scope: QuickColorSwitcherRuntimeScope = defaultQuickColorSwitcherRuntimeScope
): QuickColorSwitcherRuntime {
    return {
        addDocumentClickListener(
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            const runtimeDocument = getDocument(scope);
            if (!runtimeDocument) {
                throw new TypeError(
                    "quickColorSwitcher requires a document runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            runtimeDocument.addEventListener("click", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = getClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, timeout): QuickColorSwitcherTimerHandle {
            const setTimeoutRef = getSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "quickColorSwitcher requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}

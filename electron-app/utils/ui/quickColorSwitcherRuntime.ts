export type QuickColorSwitcherTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type QuickColorSwitcherSetTimeout = (
    callback: () => void,
    timeout: number
) => QuickColorSwitcherTimerHandle;

type QuickColorSwitcherClickListener = (event: Readonly<MouseEvent>) => void;

type QuickColorSwitcherListenerOptions = Readonly<
    AddEventListenerOptions & { readonly signal: AbortSignal }
>;

export interface QuickColorSwitcherRuntimeScope {
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
}

export interface QuickColorSwitcherRuntime {
    addDocumentClickListener: (
        listener: QuickColorSwitcherClickListener,
        options: QuickColorSwitcherListenerOptions
    ) => void;
    clearTimeout: (handle: QuickColorSwitcherTimerHandle) => void;
    createAbortController: () => AbortController;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => QuickColorSwitcherTimerHandle;
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
    return scope.getAbortController?.();
}

function getClearTimeout(
    scope: QuickColorSwitcherRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getDocument(
    scope: QuickColorSwitcherRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getSetTimeout(
    scope: QuickColorSwitcherRuntimeScope
): QuickColorSwitcherSetTimeout | undefined {
    return scope.getSetTimeout?.();
}

export function getQuickColorSwitcherRuntime(
    scope: QuickColorSwitcherRuntimeScope = defaultQuickColorSwitcherRuntimeScope
): QuickColorSwitcherRuntime {
    return {
        addDocumentClickListener(
            listener: QuickColorSwitcherClickListener,
            options: QuickColorSwitcherListenerOptions
        ): void {
            const runtimeDocument = getDocument(scope);
            if (!runtimeDocument) {
                throw new TypeError(
                    "quickColorSwitcher requires a document runtime"
                );
            }

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

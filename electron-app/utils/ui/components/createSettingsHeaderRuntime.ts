export type CreateSettingsHeaderTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface CreateSettingsHeaderRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly documentEventTarget?: Document | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface CreateSettingsHeaderRuntime {
    readonly addDocumentKeydownListener: (
        listener: (event: KeyboardEvent) => void,
        options: AddEventListenerOptions
    ) => void;
    readonly clearTimeout: (
        timer: CreateSettingsHeaderTimer | undefined
    ) => void;
    readonly createAbortController: () => AbortController;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => CreateSettingsHeaderTimer;
}

function getAbortControllerConstructor(
    scope: CreateSettingsHeaderRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getClearTimeout(
    scope: CreateSettingsHeaderRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getDocumentEventTarget(
    scope: CreateSettingsHeaderRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.() ?? scope.documentEventTarget;
}

function getSetTimeout(
    scope: CreateSettingsHeaderRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

const defaultCreateSettingsHeaderRuntimeScope: CreateSettingsHeaderRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getDocumentEventTarget: () => globalThis.document,
        getSetTimeout: () => globalThis.setTimeout,
    };

export function getCreateSettingsHeaderRuntime(
    scope: CreateSettingsHeaderRuntimeScope = defaultCreateSettingsHeaderRuntimeScope
): CreateSettingsHeaderRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "createSettingsHeader requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("keydown", listener, options);
        },
        clearTimeout(timer): void {
            if (timer === undefined) {
                return;
            }
            const clearTimeoutRef = getClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "createSettingsHeader requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createSettingsHeader requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, delayMs): CreateSettingsHeaderTimer {
            const setTimeoutRef = getSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "createSettingsHeader requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

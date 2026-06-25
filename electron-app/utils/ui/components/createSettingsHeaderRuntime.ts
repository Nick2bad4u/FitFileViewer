import {
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type CreateSettingsHeaderTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface CreateSettingsHeaderRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getEvent?: (() => typeof globalThis.Event | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface CreateSettingsHeaderRuntime {
    readonly addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly appendToBody: (node: Node) => void;
    readonly appendToHead: (node: Node) => void;
    readonly clearTimeout: (
        timer: CreateSettingsHeaderTimer | undefined
    ) => void;
    readonly createAbortController: () => AbortController;
    readonly createChangeEvent: () => Event;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => CreateSettingsHeaderTimer;
}

function getAbortControllerConstructor(
    scope: CreateSettingsHeaderRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getClearTimeout(
    scope: CreateSettingsHeaderRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getDocument(scope: CreateSettingsHeaderRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("createSettingsHeader requires a document runtime");
    }

    return runtimeDocument;
}

function getDocumentEventTarget(
    scope: CreateSettingsHeaderRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
}

function getEventConstructor(
    scope: CreateSettingsHeaderRuntimeScope
): typeof globalThis.Event {
    const EventConstructor = scope.getEvent?.();
    if (typeof EventConstructor !== "function") {
        throw new TypeError("createSettingsHeader requires an Event runtime");
    }

    return EventConstructor;
}

function getSetTimeout(
    scope: CreateSettingsHeaderRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
}

const defaultCreateSettingsHeaderRuntimeScope: CreateSettingsHeaderRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: () => globalThis.document,
        getEvent: () => globalThis.Event,
        getSetTimeout: getBrowserSetTimeout,
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
        appendToBody(node): void {
            getDocument(scope).body.append(node);
        },
        appendToHead(node): void {
            getDocument(scope).head.append(node);
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
        createChangeEvent(): Event {
            return new (getEventConstructor(scope))("change");
        },
        createElement(tagName) {
            return getDocument(scope).createElement(tagName);
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

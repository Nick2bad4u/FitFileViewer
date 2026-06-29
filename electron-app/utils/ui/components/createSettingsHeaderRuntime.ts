import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserEventConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    type BrowserURLConstructor,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserEvent,
    getBrowserSetTimeout,
    getBrowserURL,
} from "../../runtime/browserRuntime.js";

export type CreateSettingsHeaderTimer = BrowserTimerHandle;
type CreateSettingsHeaderURLRuntime = Pick<
    BrowserURLConstructor,
    "createObjectURL"
>;
type CreateSettingsHeaderRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface CreateSettingsHeaderRuntimeScope {
    readonly getAbortController: CreateSettingsHeaderRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: CreateSettingsHeaderRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: CreateSettingsHeaderRuntimeProvider<Document>;
    readonly getDocumentEventTarget: CreateSettingsHeaderRuntimeProvider<Document>;
    readonly getEvent: CreateSettingsHeaderRuntimeProvider<BrowserEventConstructor>;
    readonly getSetTimeout: CreateSettingsHeaderRuntimeProvider<BrowserSetTimeout>;
    readonly getURL: CreateSettingsHeaderRuntimeProvider<CreateSettingsHeaderURLRuntime>;
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
    readonly createObjectURL: (blob: Blob) => string;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => CreateSettingsHeaderTimer;
}

function getRequiredProvider<T>(
    provider: CreateSettingsHeaderRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article =
            providerName === "URL" || !/^[AEIOUHaeiou]/u.test(providerName)
                ? "a"
                : "an";

        throw new TypeError(
            `createSettingsHeader requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: CreateSettingsHeaderRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getClearTimeout(
    scope: CreateSettingsHeaderRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getDocument(scope: CreateSettingsHeaderRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("createSettingsHeader requires a document runtime");
    }

    return runtimeDocument;
}

function getDocumentEventTarget(
    scope: CreateSettingsHeaderRuntimeScope
): Document | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getEventConstructor(
    scope: CreateSettingsHeaderRuntimeScope
): BrowserEventConstructor {
    const EventConstructor = getRequiredProvider(scope.getEvent, "Event")();
    if (typeof EventConstructor !== "function") {
        throw new TypeError("createSettingsHeader requires an Event runtime");
    }

    return EventConstructor;
}

function getSetTimeout(
    scope: CreateSettingsHeaderRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

function getURLRuntime(
    scope: CreateSettingsHeaderRuntimeScope
): CreateSettingsHeaderURLRuntime {
    const urlRuntime = getRequiredProvider(scope.getURL, "URL")();
    if (typeof urlRuntime?.createObjectURL !== "function") {
        throw new TypeError("createSettingsHeader requires a URL runtime");
    }

    return urlRuntime;
}

const defaultCreateSettingsHeaderRuntimeScope: CreateSettingsHeaderRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getDocumentEventTarget: getBrowserDocument,
        getEvent: getBrowserEvent,
        getSetTimeout: getBrowserSetTimeout,
        getURL: getBrowserURL,
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
        createObjectURL(blob): string {
            return getURLRuntime(scope).createObjectURL(blob);
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

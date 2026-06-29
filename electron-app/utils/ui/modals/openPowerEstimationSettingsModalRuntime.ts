import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

type PowerEstimationSettingsModalKeydownListener = (
    event: Readonly<KeyboardEvent>
) => void;

type OpenPowerEstimationSettingsModalRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface OpenPowerEstimationSettingsModalRuntimeScope {
    readonly getAbortController: OpenPowerEstimationSettingsModalRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: OpenPowerEstimationSettingsModalRuntimeProvider<Document>;
    readonly getDocumentEventTarget: OpenPowerEstimationSettingsModalRuntimeProvider<Document>;
}

export interface OpenPowerEstimationSettingsModalRuntime {
    readonly addDocumentKeydownListener: (
        listener: PowerEstimationSettingsModalKeydownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly appendToBody: (element: Element) => void;
    readonly bodyContains: (element: Element) => boolean;
    readonly createAbortController: () => AbortController;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
}

function getRequiredProvider<T>(
    provider: OpenPowerEstimationSettingsModalRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `openPowerEstimationSettingsModal requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getDocumentEventTarget(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): Document | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getRuntimeDocument(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): Document {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError(
            "openPowerEstimationSettingsModal requires a document runtime"
        );
    }

    return documentRef;
}

const defaultOpenPowerEstimationSettingsModalRuntimeScope: OpenPowerEstimationSettingsModalRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getDocumentEventTarget: getBrowserDocument,
    };

export function getOpenPowerEstimationSettingsModalRuntime(
    scope: OpenPowerEstimationSettingsModalRuntimeScope = defaultOpenPowerEstimationSettingsModalRuntimeScope
): OpenPowerEstimationSettingsModalRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "openPowerEstimationSettingsModal requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("keydown", listener, options);
        },
        appendToBody(element): void {
            getRuntimeDocument(scope).body.append(element);
        },
        bodyContains(element): boolean {
            return getRuntimeDocument(scope).body.contains(element);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor =
                getAbortControllerConstructor(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "openPowerEstimationSettingsModal requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getRuntimeDocument(scope).createElement(tagName);
        },
    };
}

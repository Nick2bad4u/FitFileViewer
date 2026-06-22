type PowerEstimationSettingsModalKeydownListener = (
    event: Readonly<KeyboardEvent>
) => void;

export interface OpenPowerEstimationSettingsModalRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
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

function getAbortControllerConstructor(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getDocumentEventTarget(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.();
}

function getRuntimeDocument(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): Document {
    const documentRef = getDocumentEventTarget(scope);
    if (!documentRef) {
        throw new TypeError(
            "openPowerEstimationSettingsModal requires a document event-target runtime"
        );
    }

    return documentRef;
}

const defaultOpenPowerEstimationSettingsModalRuntimeScope: OpenPowerEstimationSettingsModalRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getDocumentEventTarget: () => globalThis.document,
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

export interface OpenPowerEstimationSettingsModalRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly documentEventTarget?: Document | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
}

export interface OpenPowerEstimationSettingsModalRuntime {
    readonly addDocumentKeydownListener: (
        listener: (event: KeyboardEvent) => void,
        options: AddEventListenerOptions
    ) => void;
    readonly createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getDocumentEventTarget(
    scope: OpenPowerEstimationSettingsModalRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.() ?? scope.documentEventTarget;
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
    };
}

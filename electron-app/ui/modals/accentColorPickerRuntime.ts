export interface AccentColorPickerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
}

export interface AccentColorPickerRuntime {
    addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    createAbortController: () => AbortController;
}

function getAbortControllerConstructor(
    scope: AccentColorPickerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "accentColorPicker requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocumentEventTarget(
    scope: AccentColorPickerRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.();
}

const defaultAccentColorPickerRuntimeScope: AccentColorPickerRuntimeScope =
    Object.freeze({
        getAbortController: () => globalThis.AbortController,
        getDocumentEventTarget: () => globalThis.document,
    });

export function getAccentColorPickerRuntime(
    scope: AccentColorPickerRuntimeScope = defaultAccentColorPickerRuntimeScope
): AccentColorPickerRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "accentColorPicker requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("keydown", listener, options);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

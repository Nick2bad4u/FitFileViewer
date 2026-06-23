export interface AccentColorPickerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
}

export interface AccentColorPickerRuntime {
    addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    appendModal: (modal: HTMLElement) => void;
    appendStyle: (style: HTMLStyleElement) => void;
    createAbortController: () => AbortController;
    createStyleElement: () => HTMLStyleElement;
    getModalElement: () => HTMLElement | null;
    hasStyleElement: () => boolean;
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

function getRequiredDocument(scope: AccentColorPickerRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("accentColorPicker requires a document runtime");
    }

    return documentRef;
}

const defaultAccentColorPickerRuntimeScope: AccentColorPickerRuntimeScope =
    Object.freeze({
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
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
        appendModal(modal): void {
            getRequiredDocument(scope).body.append(modal);
        },
        appendStyle(style): void {
            getRequiredDocument(scope).head.append(style);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createStyleElement(): HTMLStyleElement {
            return getRequiredDocument(scope).createElement("style");
        },
        getModalElement(): HTMLElement | null {
            return getRequiredDocument(scope).querySelector<HTMLElement>(
                "#accent-color-modal"
            );
        },
        hasStyleElement(): boolean {
            return Boolean(
                getRequiredDocument(scope).querySelector(
                    "#accent-picker-styles"
                )
            );
        },
    };
}

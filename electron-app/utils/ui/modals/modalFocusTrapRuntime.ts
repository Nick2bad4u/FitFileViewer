export interface ModalFocusTrapRuntimeScope {
    readonly getDocument?:
        | (() => ModalFocusTrapDocument | undefined)
        | undefined;
    readonly getKeyboardEvent?:
        | (() => typeof KeyboardEvent | undefined)
        | undefined;
}

export interface ModalFocusTrapRuntime {
    getActiveElement: () => Element | null;
    getDocumentEventTarget: () => EventTarget | undefined;
    isKeyboardEvent: (event: Event) => event is KeyboardEvent;
}

type ModalFocusTrapDocument = Pick<Document, "activeElement"> & EventTarget;

const defaultModalFocusTrapRuntimeScope: ModalFocusTrapRuntimeScope = {
    getDocument: () => globalThis.document,
    getKeyboardEvent: () => globalThis.KeyboardEvent,
};

function getDocument(
    scope: ModalFocusTrapRuntimeScope
): ModalFocusTrapDocument | undefined {
    return scope.getDocument?.();
}

function getKeyboardEvent(
    scope: ModalFocusTrapRuntimeScope
): typeof KeyboardEvent | undefined {
    return scope.getKeyboardEvent?.();
}

export function getModalFocusTrapRuntime(
    scope: ModalFocusTrapRuntimeScope = defaultModalFocusTrapRuntimeScope
): ModalFocusTrapRuntime {
    return {
        getActiveElement(): Element | null {
            return getDocument(scope)?.activeElement ?? null;
        },
        getDocumentEventTarget(): EventTarget | undefined {
            return getDocument(scope);
        },
        isKeyboardEvent(event): event is KeyboardEvent {
            const KeyboardEventConstructor = getKeyboardEvent(scope);
            return (
                typeof KeyboardEventConstructor === "function" &&
                event instanceof KeyboardEventConstructor
            );
        },
    };
}

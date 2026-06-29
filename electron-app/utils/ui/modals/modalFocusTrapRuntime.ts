import {
    type BrowserKeyboardEventConstructor,
    getBrowserDocument,
    getBrowserKeyboardEvent,
} from "../../runtime/browserRuntime.js";

export interface ModalFocusTrapRuntimeScope {
    readonly getDocument:
        | (() => ModalFocusTrapDocument | undefined)
        | undefined;
    readonly getKeyboardEvent:
        | (() => BrowserKeyboardEventConstructor | undefined)
        | undefined;
}

export interface ModalFocusTrapRuntime {
    getActiveElement: () => Element | null;
    getDocumentEventTarget: () => EventTarget | undefined;
    isKeyboardEvent: (event: Event) => event is KeyboardEvent;
}

type ModalFocusTrapDocument = Pick<Document, "activeElement"> & EventTarget;

const defaultModalFocusTrapRuntimeScope: ModalFocusTrapRuntimeScope = {
    getDocument: getBrowserDocument,
    getKeyboardEvent: getBrowserKeyboardEvent,
};

function getDocument(
    scope: ModalFocusTrapRuntimeScope
): ModalFocusTrapDocument | undefined {
    const getRuntimeDocument = scope.getDocument;
    if (typeof getRuntimeDocument !== "function") {
        throw new TypeError("modalFocusTrap requires a document provider");
    }

    return getRuntimeDocument();
}

function getKeyboardEvent(
    scope: ModalFocusTrapRuntimeScope
): BrowserKeyboardEventConstructor | undefined {
    const getRuntimeKeyboardEvent = scope.getKeyboardEvent;
    if (typeof getRuntimeKeyboardEvent !== "function") {
        throw new TypeError("modalFocusTrap requires a KeyboardEvent provider");
    }

    return getRuntimeKeyboardEvent();
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

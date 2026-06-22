import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import {
    getModalFocusTrapRuntime,
    type ModalFocusTrapRuntime,
} from "./modalFocusTrapRuntime.js";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

export function createModalFocusTrap(
    modal: HTMLElement,
    initialFocusElement?: HTMLElement | null,
    runtime: ModalFocusTrapRuntime = getModalFocusTrapRuntime()
): () => void {
    focusModalElement(
        initialFocusElement ?? getFocusableElements(modal)[0] ?? modal
    );

    return addEventListenerWithCleanup(
        runtime.getDocumentEventTarget(),
        "keydown",
        (event: Event) => {
            if (!runtime.isKeyboardEvent(event) || event.key !== "Tab") {
                return;
            }

            const focusableElements = getFocusableElements(modal);
            if (focusableElements.length === 0) {
                event.preventDefault();
                focusModalElement(modal);
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);
            if (!firstElement || !lastElement) {
                return;
            }

            const activeElement = runtime.getActiveElement();
            if (event.shiftKey) {
                if (
                    activeElement === firstElement ||
                    !activeElement ||
                    !modal.contains(activeElement)
                ) {
                    event.preventDefault();
                    focusModalElement(lastElement);
                }
                return;
            }

            if (
                activeElement === lastElement ||
                !activeElement ||
                !modal.contains(activeElement)
            ) {
                event.preventDefault();
                focusModalElement(firstElement);
            }
        },
        true
    );
}

function focusModalElement(element: HTMLElement): void {
    try {
        element.focus();
    } catch {
        /* Ignore focus failures in lightweight test DOMs. */
    }
}

function getFocusableElements(modal: HTMLElement): HTMLElement[] {
    return [...modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
        (element) =>
            !element.hasAttribute("disabled") &&
            element.getAttribute("aria-hidden") !== "true"
    );
}

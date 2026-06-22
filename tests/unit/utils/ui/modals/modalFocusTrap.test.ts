import { afterEach, describe, expect, it, vi } from "vitest";

import { createModalFocusTrap } from "../../../../../electron-app/utils/ui/modals/modalFocusTrap.js";
import { getModalFocusTrapRuntime } from "../../../../../electron-app/utils/ui/modals/modalFocusTrapRuntime.js";

describe("createModalFocusTrap", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("traps forward Tab navigation through runtime document access", () => {
        expect.assertions(3);

        const { cleanup, first, last } = setupFocusTrap();
        last.focus();
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Tab",
        });

        document.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(first);
        cleanup();
        expect(document.activeElement).toBe(first);
    });

    it("traps reverse Tab navigation through runtime active-element access", () => {
        expect.assertions(2);

        const { cleanup, first, last } = setupFocusTrap();
        first.focus();
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Tab",
            shiftKey: true,
        });

        document.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(last);
        cleanup();
    });

    it("returns a cleanup when no document event target is available", () => {
        expect.assertions(2);

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const modal = document.createElement("div");
        const cleanup = createModalFocusTrap(
            modal,
            null,
            getModalFocusTrapRuntime({})
        );

        expect(cleanup).toBeTypeOf("function");
        cleanup();
        expect(warn).toHaveBeenCalledWith(
            "[EventListenerManager] Invalid element provided to addEventListenerWithCleanup"
        );
    });
});

function setupFocusTrap(): {
    cleanup: () => void;
    first: HTMLButtonElement;
    last: HTMLButtonElement;
} {
    const modal = document.createElement("div");
    const first = document.createElement("button");
    const last = document.createElement("button");
    first.textContent = "First";
    last.textContent = "Last";
    modal.append(first, last);
    document.body.append(modal);

    return {
        cleanup: createModalFocusTrap(
            modal,
            first,
            getModalFocusTrapRuntime({
                getDocument: () => document,
                getKeyboardEvent: () => KeyboardEvent,
            })
        ),
        first,
        last,
    };
}

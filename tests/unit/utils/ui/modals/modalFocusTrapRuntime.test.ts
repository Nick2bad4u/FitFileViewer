import { describe, expect, it } from "vitest";

import {
    getModalFocusTrapRuntime,
    type ModalFocusTrapRuntimeScope,
} from "../../../../../electron-app/utils/ui/modals/modalFocusTrapRuntime.js";

describe("getModalFocusTrapRuntime", () => {
    it("resolves document target, active element, and keyboard events through providers", () => {
        expect.assertions(4);

        const button = document.createElement("button");
        document.body.append(button);
        button.focus();
        const runtime = getModalFocusTrapRuntime({
            getDocument: () => document,
            getKeyboardEvent: () => KeyboardEvent,
        });
        const keyboardEvent = new KeyboardEvent("keydown", { key: "Tab" });

        expect(runtime.getDocumentEventTarget()).toBe(document);
        expect(runtime.getActiveElement()).toBe(button);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("returns empty browser state when providers are unavailable", () => {
        expect.assertions(3);

        const runtime = getModalFocusTrapRuntime({});

        expect(runtime.getDocumentEventTarget()).toBeUndefined();
        expect(runtime.getActiveElement()).toBeNull();
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const runtime = getModalFocusTrapRuntime({
            document,
            KeyboardEvent,
        } as unknown as ModalFocusTrapRuntimeScope);

        expect(runtime.getDocumentEventTarget()).toBeUndefined();
        expect(runtime.getActiveElement()).toBeNull();
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            false
        );
    });
});

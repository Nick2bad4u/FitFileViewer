import { afterEach, describe, expect, it } from "vitest";

import {
    getModalFocusTrapRuntime,
    type ModalFocusTrapRuntimeScope,
} from "../../../../../electron-app/utils/ui/modals/modalFocusTrapRuntime.js";

describe("getModalFocusTrapRuntime", () => {
    const unavailableModalFocusTrapRuntimeScope = {
        getDocument: () => undefined,
        getKeyboardEvent: () => undefined,
    } satisfies Parameters<typeof getModalFocusTrapRuntime>[0];

    afterEach(() => {
        document.body.replaceChildren();
    });

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

    it("uses browser runtime providers for production document and keyboard-event defaults", () => {
        expect.assertions(4);

        const button = document.createElement("button");
        document.body.append(button);
        button.focus();
        const runtime = getModalFocusTrapRuntime();
        const keyboardEvent = new KeyboardEvent("keydown", { key: "Tab" });

        expect(runtime.getDocumentEventTarget()).toBe(document);
        expect(runtime.getActiveElement()).toBe(button);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("returns empty browser state when providers are unavailable", () => {
        expect.assertions(3);

        const runtime = getModalFocusTrapRuntime(
            unavailableModalFocusTrapRuntimeScope
        );

        expect(runtime.getDocumentEventTarget()).toBeUndefined();
        expect(runtime.getActiveElement()).toBeNull();
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(3);

        const runtime = getModalFocusTrapRuntime(
            {} as unknown as Parameters<typeof getModalFocusTrapRuntime>[0]
        );

        expect(() => runtime.getDocumentEventTarget()).toThrow(
            "modalFocusTrap requires a document provider"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "modalFocusTrap requires a document provider"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "modalFocusTrap requires a KeyboardEvent provider"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const runtime = getModalFocusTrapRuntime({
            ...unavailableModalFocusTrapRuntimeScope,
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

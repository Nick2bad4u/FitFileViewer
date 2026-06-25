import { describe, expect, it, vi } from "vitest";

import type { OpenZoneColorPickerRuntimeScope } from "../../../../../electron-app/utils/ui/modals/openZoneColorPickerRuntime.js";
import { getOpenZoneColorPickerRuntime } from "../../../../../electron-app/utils/ui/modals/openZoneColorPickerRuntime.js";

describe("openZoneColorPickerRuntime", () => {
    it("creates and dispatches custom events through the provided scope", () => {
        expect.assertions(4);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getOpenZoneColorPickerRuntime({
            getCustomEvent: () => CustomEvent,
            getDispatchEvent: () => dispatchEvent,
        });

        const event = runtime.createCustomEvent("ffv:request-render-charts", {
            detail: { reason: "zone-colors-applied" },
        });

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.detail).toStrictEqual({ reason: "zone-colors-applied" });
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
    });

    it("routes document primitives through the provided scope", () => {
        expect.assertions(8);

        const documentRef =
            document.implementation.createHTMLDocument("zone color picker");
        const runtime = getOpenZoneColorPickerRuntime({
            getDocument: () => documentRef,
        });
        const listener = vi.fn<(event: Event) => void>();
        const cleanup = runtime.addDocumentKeydownListener(listener);
        const button = runtime.createElement("button");

        button.textContent = "Open picker";
        runtime.appendToBody(button);
        Object.defineProperty(documentRef, "activeElement", {
            configurable: true,
            get: () => button,
        });
        documentRef.dispatchEvent(new KeyboardEvent("keydown"));
        cleanup();
        documentRef.dispatchEvent(new KeyboardEvent("keydown"));

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.bodyContains(button)).toBe(true);
        expect(runtime.getBody()).toBe(documentRef.body);
        expect(runtime.getDocument()).toBe(documentRef);
        expect(runtime.getActiveElement()).toBe(button);
        expect(listener).toHaveBeenCalledOnce();
        expect(documentRef.body.firstElementChild).toBe(button);
        expect(documentRef.body.childElementCount).toBe(1);
    });

    it("routes element and keyboard event checks through the provided scope", () => {
        expect.assertions(6);

        const documentRef =
            document.implementation.createHTMLDocument("zone color picker");
        const button = documentRef.createElement("button");
        const input = documentRef.createElement("input");
        const keyboardEvent = new KeyboardEvent("keydown", { key: "Escape" });
        const runtime = getOpenZoneColorPickerRuntime({
            getHTMLElement: () => HTMLElement,
            getHTMLInputElement: () => HTMLInputElement,
            getKeyboardEvent: () => KeyboardEvent,
        });

        expect(runtime.isHTMLElement(button)).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(button)).toBe(false);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(10);

        const dispatchEvent = vi.spyOn(window, "dispatchEvent");
        const runtime = getOpenZoneColorPickerRuntime();

        const event = runtime.createCustomEvent("ffv:request-render-charts");
        const button = runtime.createElement("button");
        const input = runtime.createElement("input");
        const keydown = new KeyboardEvent("keydown", { key: "Escape" });
        const cleanup = runtime.addDocumentKeydownListener(vi.fn());

        expect(event).toBeInstanceOf(CustomEvent);
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(input).toBeInstanceOf(HTMLInputElement);
        expect(runtime.getDocument()).toBe(document);
        expect(runtime.getBody()).toBe(document.body);
        expect(runtime.isHTMLElement(button)).toBe(true);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isKeyboardEvent(keydown)).toBe(true);

        cleanup();
        dispatchEvent.mockRestore();
    });

    it("fails clearly when event primitives are unavailable", () => {
        expect.assertions(11);

        expect(() =>
            getOpenZoneColorPickerRuntime({
                getDispatchEvent: () => () => true,
            }).createCustomEvent("ffv:request-render-charts")
        ).toThrow("openZoneColorPicker requires a CustomEvent runtime");
        expect(() =>
            getOpenZoneColorPickerRuntime({
                getCustomEvent: () => CustomEvent,
            }).dispatchEvent(new Event("ffv:request-render-charts"))
        ).toThrow("openZoneColorPicker requires a dispatchEvent runtime");
        const runtime = getOpenZoneColorPickerRuntime({});
        const element = document.createElement("div");
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined)
        ).toThrow("openZoneColorPicker requires a document runtime");
        expect(() => runtime.appendToBody(element)).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.bodyContains(element)).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.getBody()).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(element)).toThrow(
            "openZoneColorPicker requires an HTMLElement runtime"
        );
        expect(() => runtime.isHTMLInputElement(element)).toThrow(
            "openZoneColorPicker requires an HTMLInputElement runtime"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "openZoneColorPicker requires a KeyboardEvent runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(18);

        const documentRef =
            document.implementation.createHTMLDocument("legacy scope");
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const createElement = vi.spyOn(documentRef, "createElement");
        const legacyScope = {
            CustomEvent,
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            document: documentRef,
            HTMLElement,
            HTMLInputElement,
            KeyboardEvent,
        } as unknown as OpenZoneColorPickerRuntimeScope;
        const runtime = getOpenZoneColorPickerRuntime(legacyScope);
        const element = document.createElement("div");

        expect(() =>
            runtime.createCustomEvent("ffv:request-render-charts")
        ).toThrow("openZoneColorPicker requires a CustomEvent runtime");
        expect(() =>
            runtime.dispatchEvent(new Event("ffv:request-render-charts"))
        ).toThrow("openZoneColorPicker requires a dispatchEvent runtime");
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined)
        ).toThrow("openZoneColorPicker requires a document runtime");
        expect(() => runtime.appendToBody(element)).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.bodyContains(element)).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.getBody()).toThrow(
            "openZoneColorPicker requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(element)).toThrow(
            "openZoneColorPicker requires an HTMLElement runtime"
        );
        expect(() => runtime.isHTMLInputElement(element)).toThrow(
            "openZoneColorPicker requires an HTMLInputElement runtime"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "openZoneColorPicker requires a KeyboardEvent runtime"
        );
        expect(addEventListener).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
        expect(legacyScope.dispatchEvent).not.toHaveBeenCalled();
        expect(documentRef.body.childElementCount).toBe(0);
        expect((legacyScope as { HTMLElement?: unknown }).HTMLElement).toBe(
            HTMLElement
        );
        expect(
            (legacyScope as { HTMLInputElement?: unknown }).HTMLInputElement
        ).toBe(HTMLInputElement);
        expect((legacyScope as { KeyboardEvent?: unknown }).KeyboardEvent).toBe(
            KeyboardEvent
        );
    });
});

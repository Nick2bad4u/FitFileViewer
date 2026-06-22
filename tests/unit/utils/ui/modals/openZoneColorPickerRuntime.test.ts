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

    it("creates and dispatches custom events through the default production scope", () => {
        expect.assertions(3);

        const dispatchEvent = vi.spyOn(window, "dispatchEvent");
        const runtime = getOpenZoneColorPickerRuntime();

        const event = runtime.createCustomEvent("ffv:request-render-charts");

        expect(event).toBeInstanceOf(CustomEvent);
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);

        dispatchEvent.mockRestore();
    });

    it("fails clearly when event primitives are unavailable", () => {
        expect.assertions(8);

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
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(12);

        const documentRef =
            document.implementation.createHTMLDocument("legacy scope");
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const createElement = vi.spyOn(documentRef, "createElement");
        const legacyScope = {
            CustomEvent,
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            document: documentRef,
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
        expect(addEventListener).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
        expect(legacyScope.dispatchEvent).not.toHaveBeenCalled();
        expect(documentRef.body.childElementCount).toBe(0);
    });
});

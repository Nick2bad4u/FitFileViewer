// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { getAccentColorPickerRuntime } from "../../../../electron-app/ui/modals/accentColorPickerRuntime.js";

describe("getAccentColorPickerRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAccentColorPickerRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(5);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        let keydownCount = 0;
        const runtime = getAccentColorPickerRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
            getDocumentEventTarget: () => documentEventTarget,
        });

        runtime.addDocumentKeydownListener(
            () => {
                keydownCount += 1;
            },
            { signal: controller.signal }
        );
        documentEventTarget.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
        expect(documentEventTarget.head.childElementCount).toBe(0);
    });

    it("routes modal and style DOM access through the injected document", () => {
        expect.assertions(15);

        const documentRef = document.implementation.createHTMLDocument();
        const runtime = getAccentColorPickerRuntime({
            getDocument: () => documentRef,
            getHTMLButtonElement: () => HTMLButtonElement,
            getHTMLElement: () => HTMLElement,
            getHTMLInputElement: () => HTMLInputElement,
        });
        const modal = documentRef.createElement("div");
        modal.id = "accent-color-modal";
        const input = documentRef.createElement("input");
        input.id = "accent-input";
        input.tabIndex = 0;
        const button = documentRef.createElement("button");
        button.className = "preset-color";
        const style = runtime.createStyleElement();
        style.id = "accent-picker-styles";

        expect(runtime.getModalElement()).toBeNull();
        expect(runtime.hasStyleElement()).toBe(false);
        expect(style.tagName).toBe("STYLE");
        expect(runtime.getElement("#accent-input")).toBeNull();

        modal.append(input, button);
        runtime.appendModal(modal);
        runtime.appendStyle(style);
        input.focus();

        expect(runtime.getModalElement()).toBe(modal);
        expect(runtime.hasStyleElement()).toBe(true);
        expect(runtime.getElement("#accent-input")).toBe(input);
        expect(runtime.getElements(".preset-color")).toStrictEqual([button]);
        expect(runtime.getActiveElement()).toBe(documentRef.body);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLButtonElement(button)).toBe(true);
        expect(runtime.isHTMLElement(style)).toBe(true);
        expect(documentRef.body.firstElementChild).toBe(modal);
        expect(documentRef.head.firstElementChild).toBe(style);
        expect(document.body.querySelector("#accent-color-modal")).toBeNull();
    });

    it("fails clearly when explicit runtime dependencies are unavailable", () => {
        expect.assertions(8);

        const runtime = getAccentColorPickerRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "accentColorPicker requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow("accentColorPicker requires a document event-target runtime");
        expect(() => runtime.getModalElement()).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() => runtime.hasStyleElement()).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() => runtime.createStyleElement()).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "accentColorPicker requires an HTMLElement runtime"
        );
        expect(() => runtime.isHTMLInputElement(document.body)).toThrow(
            "accentColorPicker requires an HTMLInputElement runtime"
        );
    });

    it("registers document keydown listeners through the injected event target", () => {
        expect.assertions(3);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        let keydownCount = 0;
        const listener = () => {
            keydownCount += 1;
        };
        const runtime = getAccentColorPickerRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(8);

        class LegacyAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-accent-color-picker-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const runtime = getAccentColorPickerRuntime({
            AbortController: LegacyAbortController,
            document: documentEventTarget,
            documentEventTarget,
        } as unknown as Parameters<typeof getAccentColorPickerRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "accentColorPicker requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow("accentColorPicker requires a document event-target runtime");
        expect(() => runtime.getModalElement()).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() =>
            runtime.appendModal(document.createElement("div"))
        ).toThrow("accentColorPicker requires a document runtime");
        expect(() => runtime.createStyleElement()).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() => runtime.getElement("#accent-color-modal")).toThrow(
            "accentColorPicker requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "accentColorPicker requires an HTMLElement runtime"
        );
        expect(() => runtime.isHTMLButtonElement(document.body)).toThrow(
            "accentColorPicker requires an HTMLButtonElement runtime"
        );
    });
});

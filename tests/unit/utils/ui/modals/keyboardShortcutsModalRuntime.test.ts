import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserCancelAnimationFrame,
    BrowserClearTimeout,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getKeyboardShortcutsModalRuntime,
    KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE,
    type KeyboardShortcutsModalRuntimeScope,
} from "../../../../../electron-app/utils/ui/modals/keyboardShortcutsModalRuntime.js";

describe("getKeyboardShortcutsModalRuntime", () => {
    const createUnavailableKeyboardShortcutsModalRuntimeScope = (
        overrides: Partial<KeyboardShortcutsModalRuntimeScope> = {}
    ) =>
        ({
            getCancelAnimationFrame: () => undefined,
            getClearTimeout: () => undefined,
            getDocument: () => undefined,
            getHTMLElement: () => undefined,
            getKeyboardEvent: () => undefined,
            getRequestAnimationFrame: () => undefined,
            getSetTimeout: () => undefined,
            ...overrides,
        }) satisfies KeyboardShortcutsModalRuntimeScope;

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.replaceChildren();
        document.head.replaceChildren();
        document.body.style.overflow = "";
    });

    it("schedules and clears timers through the injected runtime providers", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 31);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const scope = createUnavailableKeyboardShortcutsModalRuntimeScope({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });
        const {
            clearTimeout: clearModalTimer,
            setTimeout: scheduleModalTimer,
        } = getKeyboardShortcutsModalRuntime(scope);

        expect(scheduleModalTimer(callback, delayMs)).toBe(31);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearModalTimer(31);

        expect(clearTimeout).toHaveBeenCalledWith(31);
        expect(clearTimeout.mock.contexts[0]).toBe(scope);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getKeyboardShortcutsModalRuntime(
            createUnavailableKeyboardShortcutsModalRuntimeScope()
        );

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "keyboardShortcutsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
        );
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(8);

        const runtime = getKeyboardShortcutsModalRuntime(
            {} as unknown as KeyboardShortcutsModalRuntimeScope
        );

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "keyboardShortcutsModalRuntime requires a setTimeout provider"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "keyboardShortcutsModalRuntime requires a clearTimeout provider"
        );
        expect(() => runtime.requestAnimationFrame(() => {})).toThrow(
            "keyboardShortcutsModalRuntime requires a requestAnimationFrame provider"
        );
        expect(() => runtime.cancelAnimationFrame(0)).toThrow(
            "keyboardShortcutsModalRuntime requires a cancelAnimationFrame provider"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "keyboardShortcutsModalRuntime requires a document provider"
        );
        expect(() => runtime.getDocumentEventTarget()).toThrow(
            "keyboardShortcutsModalRuntime requires a document provider"
        );
        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow(
            "keyboardShortcutsModalRuntime requires an HTMLElement provider"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "keyboardShortcutsModalRuntime requires a KeyboardEvent provider"
        );
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(15);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("75");
        const timeoutHandle = Number("53");
        const frameHandle = Number("16");
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timeoutHandle);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<BrowserRequestAnimationFrame>(
            () => frameHandle
        );
        const cancelAnimationFrame = vi.fn<BrowserCancelAnimationFrame>();
        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

        const button = document.createElement("button");
        const style = document.createElement("style");
        document.body.append(button);
        button.focus();

        const runtime = getKeyboardShortcutsModalRuntime();
        const modal = runtime.createElement("div");

        expect(runtime.setTimeout(callback, delayMs)).toBe(timeoutHandle);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        runtime.clearTimeout(timeoutHandle);
        expect(clearTimeout).toHaveBeenCalledWith(timeoutHandle);
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(frameHandle);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        runtime.cancelAnimationFrame(frameHandle);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(frameHandle);
        runtime.appendToBody(modal);
        runtime.appendToHead(style);
        runtime.setBodyOverflow("hidden");
        expect(runtime.querySelector("div")).toBe(modal);
        expect(document.body.contains(modal)).toBe(true);
        expect(document.head.contains(style)).toBe(true);
        expect(document.body.style.overflow).toBe("hidden");
        expect(runtime.getActiveElement()).toBe(button);
        expect(runtime.getDocumentEventTarget()).toBe(document);
        expect(runtime.isHTMLElement(modal)).toBe(true);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("schedules animation frames through the injected runtime provider", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 17);
        const scope = createUnavailableKeyboardShortcutsModalRuntimeScope({
            getRequestAnimationFrame: () => requestAnimationFrame,
        });
        const { requestAnimationFrame: requestFrame } =
            getKeyboardShortcutsModalRuntime(scope);

        expect(requestFrame(callback)).toBe(17);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("returns null when animation-frame scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(
            getKeyboardShortcutsModalRuntime(
                createUnavailableKeyboardShortcutsModalRuntimeScope()
            ).requestAnimationFrame(callback)
        ).toBe(null);
        expect(callback).not.toHaveBeenCalled();
    });

    it("cancels animation frames through the injected runtime provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const scope = createUnavailableKeyboardShortcutsModalRuntimeScope({
            getCancelAnimationFrame: () => cancelAnimationFrame,
        });
        const { cancelAnimationFrame: cancelFrame } =
            getKeyboardShortcutsModalRuntime(scope);

        cancelFrame(19);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(19);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("creates SVG elements through the injected document runtime", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument(
            "keyboard shortcuts modal svg runtime"
        );
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const runtime = getKeyboardShortcutsModalRuntime({
            ...createUnavailableKeyboardShortcutsModalRuntimeScope(),
            getDocument: () => documentRef,
        });

        const icon = runtime.createSvgElement("svg");

        expect(icon.tagName.toLowerCase()).toBe("svg");
        expect(icon.namespaceURI).toBe(KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE);
        expect(createElementNS).toHaveBeenCalledWith(
            KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE,
            "svg"
        );
        expect(() => runtime.createSvgElement("path")).not.toThrow();
    });

    it("routes modal DOM operations through the injected document runtime", () => {
        expect.assertions(8);

        const documentRef = document.implementation.createHTMLDocument(
            "keyboard shortcuts modal dom runtime"
        );
        const runtime = getKeyboardShortcutsModalRuntime({
            ...createUnavailableKeyboardShortcutsModalRuntimeScope(),
            getDocument: () => documentRef,
        });
        const modal = runtime.createElement("div");
        modal.id = "keyboard-shortcuts-modal";
        const style = runtime.createElement("style");
        style.id = "keyboard-shortcuts-modal-styles";

        runtime.appendToBody(modal);
        runtime.appendToHead(style);
        runtime.setBodyOverflow("hidden");

        expect(modal).toBeInstanceOf(HTMLDivElement);
        expect(documentRef.body.contains(modal)).toBe(true);
        expect(documentRef.head.contains(style)).toBe(true);
        expect(runtime.querySelector("#keyboard-shortcuts-modal")).toBe(modal);
        expect(runtime.getActiveElement()).toBe(documentRef.body);
        expect(runtime.getDocumentEventTarget()).toBe(documentRef);
        expect(documentRef.body.style.overflow).toBe("hidden");

        runtime.setBodyOverflow("");
        expect(documentRef.body.style.overflow).toBe("");
    });

    it("checks elements and keyboard events through injected providers", () => {
        expect.assertions(4);

        const runtime = getKeyboardShortcutsModalRuntime({
            ...createUnavailableKeyboardShortcutsModalRuntimeScope(),
            getHTMLElement: () => HTMLElement,
            getKeyboardEvent: () => KeyboardEvent,
        });

        expect(runtime.isHTMLElement(document.createElement("button"))).toBe(
            true
        );
        expect(runtime.isHTMLElement({ nodeType: 1 })).toBe(false);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("requires explicit constructor providers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getKeyboardShortcutsModalRuntime(
            createUnavailableKeyboardShortcutsModalRuntimeScope()
        );

        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow(
            "keyboardShortcutsModalRuntime requires an HTMLElement runtime"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "keyboardShortcutsModalRuntime requires a KeyboardEvent runtime"
        );
    });

    it("ignores legacy direct timing runtime properties", () => {
        expect.assertions(20);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const documentRef = document.implementation.createHTMLDocument(
            "legacy keyboard shortcuts modal runtime"
        );
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 37);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 41);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getKeyboardShortcutsModalRuntime({
            ...createUnavailableKeyboardShortcutsModalRuntimeScope(),
            cancelAnimationFrame,
            clearTimeout,
            document: documentRef,
            HTMLElement,
            KeyboardEvent,
            requestAnimationFrame,
            setTimeout,
        } as unknown as Parameters<typeof getKeyboardShortcutsModalRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "keyboardShortcutsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(37)).toThrow(
            "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
        );
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(null);
        expect(() => runtime.createElement("div")).toThrow(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("keyboardShortcutsModalRuntime requires a document runtime");
        expect(() =>
            runtime.appendToHead(document.createElement("style"))
        ).toThrow("keyboardShortcutsModalRuntime requires a document runtime");
        expect(() =>
            runtime.querySelector("#keyboard-shortcuts-modal")
        ).toThrow("keyboardShortcutsModalRuntime requires a document runtime");
        expect(() => runtime.getActiveElement()).toThrow(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
        expect(() => runtime.getDocumentEventTarget()).toThrow(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
        expect(() => runtime.setBodyOverflow("hidden")).toThrow(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow(
            "keyboardShortcutsModalRuntime requires an HTMLElement runtime"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "keyboardShortcutsModalRuntime requires a KeyboardEvent runtime"
        );
        runtime.cancelAnimationFrame(41);

        expect(frameCallback).not.toHaveBeenCalled();
        expect(createElementNS).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getKeyboardShortcutsModalRuntime(
                createUnavailableKeyboardShortcutsModalRuntimeScope()
            ).cancelAnimationFrame(5)
        ).not.toThrow();
    });
});

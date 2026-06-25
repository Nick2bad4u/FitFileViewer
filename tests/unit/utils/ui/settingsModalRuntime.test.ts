import { afterEach, describe, expect, it, vi } from "vitest";

import { getSettingsModalRuntime } from "../../../../electron-app/utils/ui/settingsModalRuntime.js";

describe("getSettingsModalRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.replaceChildren();
        document.head.replaceChildren();
    });

    it("schedules and clears timers through the injected runtime providers", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 17);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const scope = {
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        };
        const {
            clearTimeout: clearCloseTimer,
            setTimeout: scheduleCloseTimer,
        } = getSettingsModalRuntime(scope);

        expect(scheduleCloseTimer(callback, delayMs)).toBe(17);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearCloseTimer(17);

        expect(clearTimeout).toHaveBeenCalledWith(17);
        expect(clearTimeout.mock.contexts[0]).toBe(scope);
    });

    it("routes timers and animation frames through provider functions", () => {
        expect.assertions(12);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("150");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 42);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const getCancelAnimationFrame = vi.fn(() => cancelAnimationFrame);
        const utils = getSettingsModalRuntime({
            getCancelAnimationFrame,
            getClearTimeout,
            getRequestAnimationFrame,
            getSetTimeout,
        });

        expect(utils.setTimeout(callback, delayMs)).toBe(42);
        utils.clearTimeout(42);
        expect(utils.requestAnimationFrame(frameCallback)).toBe(12);
        utils.cancelAnimationFrame(12);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getRequestAnimationFrame).toHaveBeenCalledOnce();
        expect(getCancelAnimationFrame).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(42);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(12);
        expect(callback).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getSettingsModalRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "settingsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "settingsModalRuntime requires a clearTimeout runtime"
        );
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(13);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("70");
        const timeoutHandle = Number("52");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(
            () => timeoutHandle
        );
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn<
            typeof globalThis.requestAnimationFrame
        >(() => 15);
        const cancelAnimationFrame =
            vi.fn<typeof globalThis.cancelAnimationFrame>();
        vi.stubGlobal("setTimeout", setTimeout);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

        const button = document.createElement("button");
        const input = document.createElement("input");
        const select = document.createElement("select");
        document.body.append(button, input, select);
        button.focus();

        const runtime = getSettingsModalRuntime();

        expect(runtime.setTimeout(callback, delayMs)).toBe(timeoutHandle);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        runtime.clearTimeout(timeoutHandle);
        expect(clearTimeout).toHaveBeenCalledWith(timeoutHandle);
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(15);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        runtime.cancelAnimationFrame(15);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(15);
        expect(runtime.queryElement("button")).toBe(button);
        expect(document.body.contains(button)).toBe(true);
        expect(runtime.getActiveHTMLElement()).toBe(button);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
        expect(
            runtime.isKeyboardEvent(new KeyboardEvent("keydown"))
        ).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("routes document operations through the injected runtime provider", () => {
        expect.assertions(12);

        document.body.replaceChildren();
        document.head.replaceChildren();

        const getDocument = vi.fn(() => document);
        const runtime = getSettingsModalRuntime({ getDocument });

        const bodyNode = runtime.createElement("div");
        bodyNode.id = "settings-modal-runtime-body";
        runtime.appendToBody(bodyNode);

        const headNode = runtime.createElement("style");
        headNode.id = "settings-modal-runtime-style";
        runtime.appendToHead(headNode);

        const path = runtime.createSvgElement("path");

        expect(runtime.queryElement("#settings-modal-runtime-body")).toBe(
            bodyNode
        );
        expect(runtime.queryElement("#settings-modal-runtime-style")).toBe(
            headNode
        );
        expect(bodyNode.tagName).toBe("DIV");
        expect(headNode.tagName).toBe("STYLE");
        expect(path.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(path.tagName).toBe("path");
        expect(runtime.getDocumentEventTarget()).toBe(document);
        expect(getDocument).toHaveBeenCalledTimes(8);
        expect(document.body.contains(bodyNode)).toBe(true);
        expect(document.head.contains(headNode)).toBe(true);

        document.body.replaceChildren();
        document.head.replaceChildren();

        expect(document.querySelector("#settings-modal-runtime-body")).toBe(
            null
        );
        expect(document.querySelector("#settings-modal-runtime-style")).toBe(
            null
        );
    });

    it("checks active elements and browser event targets through injected constructors", () => {
        expect.assertions(8);

        document.body.replaceChildren();

        const button = document.createElement("button");
        document.body.append(button);
        button.focus();

        const runtime = getSettingsModalRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
            getHTMLInputElement: () => HTMLInputElement,
            getHTMLSelectElement: () => HTMLSelectElement,
            getKeyboardEvent: () => KeyboardEvent,
        });

        const input = document.createElement("input");
        const select = document.createElement("select");
        const keyboardEvent = new KeyboardEvent("keydown", { key: "Escape" });

        expect(runtime.getActiveHTMLElement()).toBe(button);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(select)).toBe(false);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
        expect(runtime.isHTMLSelectElement(input)).toBe(false);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(
            getSettingsModalRuntime({
                getDocument: () => document,
            }).getActiveHTMLElement()
        ).toBeUndefined();

        document.body.replaceChildren();
    });

    it("requires a document provider for document-backed operations", () => {
        expect.assertions(6);

        const runtime = getSettingsModalRuntime({});

        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("settingsModalRuntime requires a document runtime");
        expect(() =>
            runtime.appendToHead(document.createElement("style"))
        ).toThrow("settingsModalRuntime requires a document runtime");
        expect(() => runtime.createElement("div")).toThrow(
            "settingsModalRuntime requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "settingsModalRuntime requires a document runtime"
        );
        expect(() => runtime.getDocumentEventTarget()).toThrow(
            "settingsModalRuntime requires a document runtime"
        );
        expect(() => runtime.queryElement("#settings-modal")).toThrow(
            "settingsModalRuntime requires a document runtime"
        );
    });

    it("schedules animation frames through the injected runtime provider", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 9);
        const scope = {
            getRequestAnimationFrame: () => requestAnimationFrame,
        };
        const utils = getSettingsModalRuntime(scope);

        expect(utils.requestAnimationFrame(callback)).toBe(9);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("runs animation frame callbacks immediately when scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(
            getSettingsModalRuntime({}).requestAnimationFrame(callback)
        ).toBe(null);
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the injected runtime provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const scope = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
        };
        const utils = getSettingsModalRuntime(scope);

        utils.cancelAnimationFrame(24);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(24);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(11);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 21);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 34);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getSettingsModalRuntime({
            cancelAnimationFrame,
            clearTimeout,
            document,
            HTMLElement,
            requestAnimationFrame,
            setTimeout,
        } as unknown as Parameters<typeof getSettingsModalRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "settingsModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(21)).toThrow(
            "settingsModalRuntime requires a clearTimeout runtime"
        );
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(null);
        runtime.cancelAnimationFrame(34);

        expect(frameCallback).toHaveBeenCalledWith(0);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(() => runtime.createElement("div")).toThrow(
            "settingsModalRuntime requires a document runtime"
        );
        expect(() => runtime.getActiveHTMLElement()).toThrow(
            "settingsModalRuntime requires a document runtime"
        );
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            false
        );
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getSettingsModalRuntime({}).cancelAnimationFrame(4)
        ).not.toThrow();
    });
});

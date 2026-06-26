import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserCancelAnimationFrame,
    BrowserClearTimeout,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { getAboutModalRuntime } from "../../../../../electron-app/utils/ui/modals/aboutModalRuntime.js";

describe("getAboutModalRuntime", () => {
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
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 41);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const scope = {
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        };
        const {
            clearTimeout: clearModalTimer,
            setTimeout: scheduleModalTimer,
        } = getAboutModalRuntime(scope);

        expect(scheduleModalTimer(callback, delayMs)).toBe(41);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);

        clearModalTimer(41);

        expect(clearTimeout).toHaveBeenCalledWith(41);
        expect(clearTimeout.mock.contexts[0]).toBe(scope);
    });

    it("routes timers and animation frames through provider functions", () => {
        expect.assertions(14);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const documentTarget = document.implementation.createHTMLDocument();
        const delayMs = Number("250");
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 42);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 12);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getDocument = vi.fn(() => documentTarget);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const getCancelAnimationFrame = vi.fn(() => cancelAnimationFrame);
        const runtime = getAboutModalRuntime({
            getCancelAnimationFrame,
            getClearTimeout,
            getDocument,
            getRequestAnimationFrame,
            getSetTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(42);
        runtime.clearTimeout(42);
        expect(runtime.getDocument()).toBe(documentTarget);
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(12);
        runtime.cancelAnimationFrame(12);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getDocument).toHaveBeenCalledOnce();
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
        expect.assertions(3);

        const runtime = getAboutModalRuntime({});

        expect(runtime.getDocument()).toBeUndefined();
        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "aboutModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "aboutModalRuntime requires a clearTimeout runtime"
        );
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(17);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("90");
        const timeoutHandle = Number("54");
        const frameHandle = Number("18");
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
        document.body.append(button);
        button.focus();

        const runtime = getAboutModalRuntime();
        const wrapper = runtime.createElement("section");
        const fragment = runtime.createDocumentFragment();
        fragment.append(
            runtime.parseHtmlDocument("<p>About</p>").body.firstChild!
        );
        document.body.append(wrapper);

        expect(runtime.setTimeout(callback, delayMs)).toBe(timeoutHandle);
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        runtime.clearTimeout(timeoutHandle);
        expect(clearTimeout).toHaveBeenCalledWith(timeoutHandle);
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(frameHandle);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        runtime.cancelAnimationFrame(frameHandle);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(frameHandle);
        expect(runtime.getDocument()).toBe(document);
        expect(runtime.getDocumentEventTarget()).toBe(document);
        expect(runtime.queryElement("section")).toBe(wrapper);
        expect(runtime.queryElements("section")).toHaveLength(1);
        expect(runtime.createSvgElement("path").namespaceURI).toBe(
            "http://www.w3.org/2000/svg"
        );
        expect(runtime.createElementTreeWalker(fragment).nextNode()).toBe(
            fragment.firstChild
        );
        expect(runtime.getActiveHTMLElement()).toBe(button);
        expect(runtime.isElement(wrapper)).toBe(true);
        expect(runtime.isHTMLElement(wrapper)).toBe(true);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
    });

    it("routes document operations through injected providers", () => {
        expect.assertions(17);

        document.body.replaceChildren();
        document.head.replaceChildren();

        const getDocument = vi.fn(() => document);
        const runtime = getAboutModalRuntime({
            getDocument,
            getDOMParser: () => DOMParser,
            getElement: () => Element,
            getHTMLElement: () => HTMLElement,
            getKeyboardEvent: () => KeyboardEvent,
            getNodeFilter: () => NodeFilter,
        });

        const bodyNode = runtime.createElement("div");
        bodyNode.id = "about-modal-runtime-body";
        bodyNode.tabIndex = 0;
        runtime.getDocumentEventTarget().body.append(bodyNode);

        const svgPath = runtime.createSvgElement("path");
        const fragment = runtime.createDocumentFragment();
        fragment.append(
            runtime.parseHtmlDocument("<p>Safe</p>").body.firstChild!
        );
        const walker = runtime.createElementTreeWalker(fragment);
        const input = runtime.createElement("input");
        const keydown = new KeyboardEvent("keydown", { key: "Escape" });

        expect(runtime.queryElement("#about-modal-runtime-body")).toBe(
            bodyNode
        );
        expect(runtime.queryElements("#about-modal-runtime-body")).toHaveLength(
            1
        );
        expect(bodyNode.tagName).toBe("DIV");
        expect(svgPath.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svgPath.tagName).toBe("path");
        expect(fragment.textContent).toBe("Safe");
        expect(walker.nextNode()).toBeInstanceOf(HTMLParagraphElement);
        expect(runtime.isElement(input)).toBe(true);
        expect(runtime.isElement({})).toBe(false);
        expect(runtime.isHTMLElement(input)).toBe(true);
        expect(runtime.isHTMLElement(fragment)).toBe(false);
        expect(runtime.isKeyboardEvent(keydown)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(runtime.getActiveHTMLElement()).toBe(document.body);
        expect(getDocument).toHaveBeenCalledTimes(9);

        document.body.replaceChildren(bodyNode);
        bodyNode.focus();

        expect(runtime.getActiveHTMLElement()).toBe(bodyNode);
        expect(getDocument).toHaveBeenCalledTimes(10);

        document.body.replaceChildren();
    });

    it("fails clearly when document-backed providers are unavailable", () => {
        expect.assertions(8);

        const runtime = getAboutModalRuntime({});

        expect(() => runtime.createDocumentFragment()).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
        expect(() => runtime.createElementTreeWalker(document.body)).toThrow(
            "aboutModalRuntime requires a NodeFilter runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
        expect(() => runtime.getActiveHTMLElement()).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
        expect(() => runtime.getDocumentEventTarget()).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
        expect(() => runtime.parseHtmlDocument("<p>x</p>")).toThrow(
            "aboutModalRuntime requires a DOMParser runtime"
        );
        expect(() => runtime.queryElement("#about-modal")).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
    });

    it("schedules animation frames through the injected runtime provider", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 23);
        const scope = {
            getRequestAnimationFrame: () => requestAnimationFrame,
        };
        const { requestAnimationFrame: requestFrame } =
            getAboutModalRuntime(scope);

        expect(requestFrame(callback)).toBe(23);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("runs animation frame callbacks immediately when scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();

        expect(getAboutModalRuntime({}).requestAnimationFrame(callback)).toBe(
            null
        );
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the injected runtime provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const scope = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
        };
        const { cancelAnimationFrame: cancelFrame } =
            getAboutModalRuntime(scope);

        cancelFrame(29);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(29);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getAboutModalRuntime({}).cancelAnimationFrame(11)
        ).not.toThrow();
    });

    it("returns document values from runtime scope providers", () => {
        expect.assertions(1);

        const documentTarget = document.implementation.createHTMLDocument();

        expect(
            getAboutModalRuntime({
                getDocument: () => documentTarget,
            }).getDocument()
        ).toBe(documentTarget);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(15);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const documentTarget = document.implementation.createHTMLDocument();
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 47);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 31);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getAboutModalRuntime({
            cancelAnimationFrame,
            clearTimeout,
            document: documentTarget,
            DOMParser,
            Element,
            HTMLElement,
            KeyboardEvent,
            NodeFilter,
            requestAnimationFrame,
            setTimeout,
        } as unknown as Parameters<typeof getAboutModalRuntime>[0]);

        expect(runtime.getDocument()).toBeUndefined();
        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "aboutModalRuntime requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(47)).toThrow(
            "aboutModalRuntime requires a clearTimeout runtime"
        );
        expect(runtime.requestAnimationFrame(frameCallback)).toBe(null);
        runtime.cancelAnimationFrame(31);

        expect(frameCallback).toHaveBeenCalledWith(0);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
        expect(() => runtime.createElement("div")).toThrow(
            "aboutModalRuntime requires a document runtime"
        );
        expect(() => runtime.parseHtmlDocument("<p>x</p>")).toThrow(
            "aboutModalRuntime requires a DOMParser runtime"
        );
        expect(runtime.isElement(document.body)).toBe(false);
        expect(runtime.isHTMLElement(document.body)).toBe(false);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            false
        );
    });
});

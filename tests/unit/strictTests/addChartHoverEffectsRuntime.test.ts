// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ChartHoverEffectsRuntimeScope } from "../../../electron-app/utils/charts/plugins/addChartHoverEffectsRuntime.js";
import {
    CHART_HOVER_EFFECTS_SVG_NAMESPACE,
    getChartHoverEffectsRuntime,
} from "../../../electron-app/utils/charts/plugins/addChartHoverEffectsRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../electron-app/utils/runtime/browserRuntime.js";

describe("getChartHoverEffectsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getChartHoverEffectsRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getChartHoverEffectsRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getChartHoverEffectsRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "chart hover effects require an AbortController runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 19);
        const runtime = getChartHoverEffectsRuntime({
            getRequestAnimationFrame: () => requestAnimationFrame,
        });

        expect(runtime.requestAnimationFrame(callback)).toBe(19);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBeUndefined();
    });

    it("uses browser runtime providers for production animation frame defaults", () => {
        expect.assertions(3);

        let frameTime = Number("0");
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >((callback) => {
            callback(Number("77"));
            return 45;
        });
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);

        const frameHandle = getChartHoverEffectsRuntime().requestAnimationFrame(
            (timestamp) => {
                frameTime = timestamp;
            }
        );

        expect(frameHandle).toBe(45);
        expect(frameTime).toBe(77);
        expect(requestAnimationFrame).toHaveBeenCalledOnce();
    });

    it("runs animation frame callbacks immediately when frames are unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const runtime = getChartHoverEffectsRuntime({});

        expect(runtime.requestAnimationFrame(callback)).toBeNull();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("schedules timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("600");
        const setTimeout = vi.fn<BrowserSetTimeout>(() => 23);
        const runtime = getChartHoverEffectsRuntime({
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(23);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(setTimeout).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("600");
        const timer = 43 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);

        vi.stubGlobal("setTimeout", setTimeout);

        const runtime = getChartHoverEffectsRuntime();

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(setTimeout).toHaveBeenCalledOnce();
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getChartHoverEffectsRuntime({});

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "chart hover effects require a setTimeout runtime"
        );
    });

    it("registers document keydown listeners through the injected document", () => {
        expect.assertions(4);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const removeEventListener = vi.spyOn(
            documentEventTarget,
            "removeEventListener"
        );
        let keydownCount = 0;
        const listener = () => {
            keydownCount += 1;
        };
        const runtime = getChartHoverEffectsRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );
        runtime.removeDocumentKeydownListener(listener);

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(removeEventListener).toHaveBeenCalledWith("keydown", listener);
        expect(keydownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("registers document fullscreen listeners through provider functions", () => {
        expect.assertions(3);

        const controller = new AbortController();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        let fullscreenChangeCount = 0;
        const listener = () => {
            fullscreenChangeCount += 1;
        };
        const runtime = getChartHoverEffectsRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

        runtime.addDocumentEventListener("fullscreenchange", listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));

        expect(addEventListener).toHaveBeenCalledWith(
            "fullscreenchange",
            listener,
            { signal: controller.signal }
        );
        expect(fullscreenChangeCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("derives document listeners from the scoped document provider", () => {
        expect.assertions(4);

        const controller = new AbortController();
        const documentRef = document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const removeEventListener = vi.spyOn(
            documentRef,
            "removeEventListener"
        );
        let keydownCount = 0;
        const listener = () => {
            keydownCount += 1;
        };
        const runtime = getChartHoverEffectsRuntime({
            getDocument: () => documentRef,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );
        runtime.removeDocumentKeydownListener(listener);

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener, {
            signal: controller.signal,
        });
        expect(removeEventListener).toHaveBeenCalledWith("keydown", listener);
        expect(keydownCount).toBe(1);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("creates SVG elements through the injected document runtime", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument(
            "chart hover svg runtime"
        );
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const runtime = getChartHoverEffectsRuntime({
            getDocument: () => documentRef,
        });

        const svg = runtime.createSvgElement("svg");

        expect(svg.tagName.toLowerCase()).toBe("svg");
        expect(svg.namespaceURI).toBe(CHART_HOVER_EFFECTS_SVG_NAMESPACE);
        expect(createElementNS).toHaveBeenCalledWith(
            CHART_HOVER_EFFECTS_SVG_NAMESPACE,
            "svg"
        );
        expect(() => runtime.createSvgElement("path")).not.toThrow();
    });

    it("appends elements and toggles body classes through the injected document runtime", () => {
        expect.assertions(3);

        const documentRef = document.implementation.createHTMLDocument(
            "chart hover body runtime"
        );
        const runtime = getChartHoverEffectsRuntime({
            getDocument: () => documentRef,
        });
        const wrapper = documentRef.createElement("div");

        runtime.appendToBody(wrapper);
        runtime.setBodyClass("chart-overlay-fullscreen-active", true);

        expect(documentRef.body.contains(wrapper)).toBe(true);
        expect(
            documentRef.body.classList.contains(
                "chart-overlay-fullscreen-active"
            )
        ).toBe(true);

        runtime.setBodyClass("chart-overlay-fullscreen-active", false);
        expect(
            documentRef.body.classList.contains(
                "chart-overlay-fullscreen-active"
            )
        ).toBe(false);
    });

    it("creates elements, queries selectors, and appends head nodes through the injected document runtime", () => {
        expect.assertions(5);

        const documentRef = document.implementation.createHTMLDocument(
            "chart hover document operations"
        );
        const runtime = getChartHoverEffectsRuntime({
            getDocument: () => documentRef,
        });

        const wrapper = runtime.createElement("div");
        wrapper.id = "chart-hover-wrapper";
        runtime.appendToBody(wrapper);

        const style = runtime.createElement("style");
        style.id = "chart-hover-effects-styles";
        runtime.appendToHead(style);

        expect(wrapper.ownerDocument).toBe(documentRef);
        expect(style.ownerDocument).toBe(documentRef);
        expect(documentRef.body.contains(wrapper)).toBe(true);
        expect(documentRef.head.contains(style)).toBe(true);
        expect(runtime.querySelector("#chart-hover-wrapper")).toBe(wrapper);
    });

    it("resolves and exits fullscreen through the injected document runtime", async () => {
        expect.assertions(3);

        const documentRef = document.implementation.createHTMLDocument(
            "chart hover fullscreen runtime"
        );
        const fullscreenTarget = documentRef.createElement("div");
        const exitFullscreen = vi.fn<() => Promise<void>>(async () => {});
        Object.defineProperty(documentRef, "fullscreenElement", {
            configurable: true,
            get: () => fullscreenTarget,
        });
        Object.defineProperty(documentRef, "exitFullscreen", {
            configurable: true,
            value: exitFullscreen,
        });
        const runtime = getChartHoverEffectsRuntime({
            getDocument: () => documentRef,
        });

        expect(runtime.getFullscreenElement()).toBe(fullscreenTarget);

        await runtime.exitFullscreen();

        expect(exitFullscreen).toHaveBeenCalledOnce();
        expect(exitFullscreen.mock.contexts[0]).toBe(documentRef);
    });

    it("uses browser runtime providers for production document defaults", () => {
        expect.assertions(8);

        const documentRef = document.implementation.createHTMLDocument(
            "chart hover production document"
        );
        vi.stubGlobal("document", documentRef);

        const runtime = getChartHoverEffectsRuntime();
        const wrapper = documentRef.createElement("div");
        const style = runtime.createElement("style");
        const svg = runtime.createSvgElement("svg");

        runtime.appendToBody(wrapper);
        runtime.appendToHead(style);
        runtime.setBodyClass("chart-overlay-fullscreen-active", true);

        expect(documentRef.body.contains(wrapper)).toBe(true);
        expect(style.ownerDocument).toBe(documentRef);
        expect(documentRef.head.contains(style)).toBe(true);
        expect(runtime.querySelector("style")).toBe(style);
        expect(svg.ownerDocument).toBe(documentRef);
        expect(svg.namespaceURI).toBe(CHART_HOVER_EFFECTS_SVG_NAMESPACE);
        expect(
            documentRef.body.classList.contains(
                "chart-overlay-fullscreen-active"
            )
        ).toBe(true);

        runtime.setBodyClass("chart-overlay-fullscreen-active", false);
        expect(
            documentRef.body.classList.contains(
                "chart-overlay-fullscreen-active"
            )
        ).toBe(false);
    });

    it("throws when document listener registration is unavailable", () => {
        expect.assertions(3);

        const runtime = getChartHoverEffectsRuntime({});

        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "chart hover effects require a document event-target runtime"
        );
        expect(() =>
            runtime.addDocumentEventListener(
                "fullscreenchange",
                () => undefined,
                {}
            )
        ).toThrow(
            "chart hover effects require a document event-target runtime"
        );
        expect(() =>
            runtime.removeDocumentKeydownListener(() => undefined)
        ).toThrow(
            "chart hover effects require a document event-target runtime"
        );
    });

    it("waits for the next animation frame when frames are available", async () => {
        expect.assertions(3);

        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >((callback) => {
            callback(Number("125"));
            return 29;
        });
        const setTimeout = vi.fn<BrowserSetTimeout>();
        const runtime = getChartHoverEffectsRuntime({
            getRequestAnimationFrame: () => requestAnimationFrame,
            getSetTimeout: () => setTimeout,
        });

        await runtime.waitForAnimationFrame();

        expect(requestAnimationFrame).toHaveBeenCalledOnce();
        expect(typeof requestAnimationFrame.mock.calls[0]?.[0]).toBe(
            "function"
        );
        expect(setTimeout).not.toHaveBeenCalled();
    });

    it("falls back to the timer runtime when waiting without animation frames", async () => {
        expect.assertions(3);

        const setTimeout = vi.fn<BrowserSetTimeout>((callback) => {
            callback();
            return 31;
        });
        const runtime = getChartHoverEffectsRuntime({
            getSetTimeout: () => setTimeout,
        });

        await runtime.waitForAnimationFrame();

        expect(setTimeout).toHaveBeenCalledOnce();
        expect(typeof setTimeout.mock.calls[0]?.[0]).toBe("function");
        expect(setTimeout.mock.calls[0]?.[1]).toBe(0);
    });

    it("throws when waiting without animation frames or a timer runtime", async () => {
        expect.assertions(1);

        const runtime = getChartHoverEffectsRuntime({});

        await expect(runtime.waitForAnimationFrame()).rejects.toThrow(
            "chart hover effects require a setTimeout runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", async () => {
        expect.assertions(13);

        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const legacyScope = {
            AbortController,
            document: documentEventTarget,
            documentEventTarget,
            requestAnimationFrame: vi.fn<BrowserRequestAnimationFrame>(
                () => 37
            ),
            setTimeout: vi.fn<BrowserSetTimeout>(() => 41),
        } as unknown as ChartHoverEffectsRuntimeScope;
        const runtime = getChartHoverEffectsRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "chart hover effects require an AbortController runtime"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "chart hover effects require a setTimeout runtime"
        );
        expect(() =>
            runtime.addDocumentKeydownListener(() => undefined, {})
        ).toThrow(
            "chart hover effects require a document event-target runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "chart hover effects require a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("chart hover effects require a document runtime");
        expect(() => runtime.createElement("div")).toThrow(
            "chart hover effects require a document runtime"
        );
        expect(() =>
            runtime.appendToHead(document.createElement("style"))
        ).toThrow("chart hover effects require a document runtime");
        expect(() => runtime.querySelector("body")).toThrow(
            "chart hover effects require a document runtime"
        );
        expect(() => runtime.getFullscreenElement()).toThrow(
            "chart hover effects require a document runtime"
        );
        await expect(runtime.exitFullscreen()).rejects.toThrow(
            "chart hover effects require a document runtime"
        );
        expect(() => runtime.setBodyClass("test", true)).toThrow(
            "chart hover effects require a document runtime"
        );
        expect(runtime.requestAnimationFrame(vi.fn())).toBeNull();
        await expect(runtime.waitForAnimationFrame()).rejects.toThrow(
            "chart hover effects require a setTimeout runtime"
        );
    });
});

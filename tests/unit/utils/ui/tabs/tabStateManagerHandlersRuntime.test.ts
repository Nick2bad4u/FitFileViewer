// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getTabStateManagerHandlersRuntime,
    type TabStateManagerHandlersRuntimeScope,
} from "../../../../../electron-app/utils/ui/tabs/tabStateManagerHandlersRuntime.js";

describe("getTabStateManagerHandlersRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructorMock = vi.fn(
            function AbortControllerDouble() {
                return controller;
            }
        );
        const AbortControllerConstructor =
            AbortControllerConstructorMock as unknown as typeof globalThis.AbortController;
        const runtime = getTabStateManagerHandlersRuntime({
            getAbortController: () => AbortControllerConstructor,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructorMock).toHaveBeenCalledTimes(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getTabStateManagerHandlersRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(11);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function AbortControllerDouble() {
                return controller;
            }
        );
        const callback = vi.fn<FrameRequestCallback>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const delayMs = Number("80");
        const frameHandle = Number("32");
        const requestAnimationFrame = vi.fn<
            typeof globalThis.requestAnimationFrame
        >(() => frameHandle);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 58);
        const cancelAnimationFrame =
            vi.fn<typeof globalThis.cancelAnimationFrame>();
        vi.stubGlobal("AbortController", AbortControllerConstructor);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
        vi.stubGlobal("setTimeout", setTimeout);

        const runtime = getTabStateManagerHandlersRuntime();
        const iframe = runtime.createElement("iframe");
        const textNode = runtime.createTextNode("ZwiftMap did not load.");

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(runtime.requestAnimationFrame(callback)).toBe(frameHandle);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        runtime.cancelAnimationFrame(frameHandle);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(frameHandle);
        expect(runtime.setTimeout(() => {}, delayMs)).toBe(58);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delayMs);
        runtime.clearTimeout(58);
        expect(clearTimeout).toHaveBeenCalledWith(58);
        expect(iframe).toBeInstanceOf(HTMLIFrameElement);
        expect(textNode.textContent).toBe("ZwiftMap did not load.");
        expect(textNode.nodeType).toBe(Node.TEXT_NODE);
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 31);
        const runtime = getTabStateManagerHandlersRuntime({
            getRequestAnimationFrame: () => requestAnimationFrame,
        });

        expect(runtime.requestAnimationFrame(callback)).toBe(31);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBeUndefined();
    });

    it("returns undefined when animation-frame scheduling is unavailable", () => {
        expect.assertions(1);

        expect(
            getTabStateManagerHandlersRuntime({}).requestAnimationFrame(vi.fn())
        ).toBeUndefined();
    });

    it("cancels animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const runtime = getTabStateManagerHandlersRuntime({
            getCancelAnimationFrame: () => cancelAnimationFrame,
        });

        runtime.cancelAnimationFrame(19);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(19);
        expect(cancelAnimationFrame.mock.contexts[0]).toBeUndefined();
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getTabStateManagerHandlersRuntime({}).cancelAnimationFrame(19)
        ).not.toThrow();
    });

    it("creates DOM nodes through the injected document provider", () => {
        expect.assertions(3);

        const runtimeDocument = {
            createElement: document.createElement.bind(document),
            createTextNode: document.createTextNode.bind(document),
        } as unknown as Document;
        const runtime = getTabStateManagerHandlersRuntime({
            getDocument: () => runtimeDocument,
        });
        const iframe = runtime.createElement("iframe");
        const textNode = runtime.createTextNode("ZwiftMap did not load.");

        expect(iframe).toBeInstanceOf(HTMLIFrameElement);
        expect(textNode.textContent).toBe("ZwiftMap did not load.");
        expect(textNode.nodeType).toBe(Node.TEXT_NODE);
    });

    it("schedules and clears fallback timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const fallbackDelayMs = Number("75");
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 47);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getTabStateManagerHandlersRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, fallbackDelayMs)).toBe(47);
        expect(setTimeout).toHaveBeenCalledWith(callback, fallbackDelayMs);

        runtime.clearTimeout(47);

        expect(clearTimeout).toHaveBeenCalledWith(47);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(5);

        const runtime = getTabStateManagerHandlersRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "tabStateManagerHandlers requires an AbortController runtime"
        );
        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "tabStateManagerHandlers requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "tabStateManagerHandlers requires a clearTimeout runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "tabStateManagerHandlers requires a document runtime"
        );
        expect(() => runtime.createTextNode("ZwiftMap")).toThrow(
            "tabStateManagerHandlers requires a document runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(14);

        const callback = vi.fn<FrameRequestCallback>();
        const AbortControllerConstructor = vi.fn(
            function AbortControllerDouble() {
                return new AbortController();
            }
        );
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 41);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 53);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtimeDocument = {
            createElement: vi.fn(document.createElement.bind(document)),
            createTextNode: vi.fn(document.createTextNode.bind(document)),
        };
        const runtime = getTabStateManagerHandlersRuntime({
            AbortController: AbortControllerConstructor,
            cancelAnimationFrame,
            clearTimeout,
            document: runtimeDocument,
            requestAnimationFrame,
            setTimeout,
        } as unknown as TabStateManagerHandlersRuntimeScope);

        expect(runtime.requestAnimationFrame(callback)).toBeUndefined();
        expect(() => runtime.cancelAnimationFrame(41)).not.toThrow();
        expect(() => runtime.createAbortController()).toThrow(
            "tabStateManagerHandlers requires an AbortController runtime"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "tabStateManagerHandlers requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(53)).toThrow(
            "tabStateManagerHandlers requires a clearTimeout runtime"
        );
        expect(() => runtime.createElement("iframe")).toThrow(
            "tabStateManagerHandlers requires a document runtime"
        );
        expect(() => runtime.createTextNode("ZwiftMap")).toThrow(
            "tabStateManagerHandlers requires a document runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(runtimeDocument.createElement).not.toHaveBeenCalled();
        expect(runtimeDocument.createTextNode).not.toHaveBeenCalled();
    });
});

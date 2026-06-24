import { describe, expect, it, vi } from "vitest";

import {
    FULLSCREEN_BUTTON_SVG_NAMESPACE,
    getAddFullScreenButtonRuntime,
} from "../../../../../electron-app/utils/ui/controls/addFullScreenButtonRuntime.js";

describe("getAddFullScreenButtonRuntime", () => {
    it("routes window and document listeners through injected providers", () => {
        expect.assertions(2);

        const documentEventTarget = new EventTarget();
        const globalEventTarget = new EventTarget();
        const runtime = getAddFullScreenButtonRuntime({
            getDocumentEventTarget: () => documentEventTarget,
            getGlobalEventTarget: () => globalEventTarget,
        });
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };
        const cleanupController = new AbortController();
        const options = { signal: cleanupController.signal };

        runtime.addWindowEventListener("keydown", listener, options);
        runtime.addDocumentEventListener("fullscreenchange", listener, options);

        globalEventTarget.dispatchEvent(new Event("keydown"));
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);

        runtime.removeWindowEventListener("keydown", listener);
        runtime.removeDocumentEventListener("fullscreenchange", listener);
        globalEventTarget.dispatchEvent(new Event("keydown"));
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));
        cleanupController.abort();

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);
    });

    it("ignores missing event targets", () => {
        expect.assertions(1);

        const runtime = getAddFullScreenButtonRuntime({ AbortController });
        const listener = vi.fn();

        expect(() => {
            runtime.addWindowEventListener("keydown", listener);
            runtime.addDocumentEventListener("fullscreenchange", listener);
            runtime.removeWindowEventListener("keydown", listener);
            runtime.removeDocumentEventListener("fullscreenchange", listener);
        }).not.toThrow();
    });

    it("ignores legacy direct scope properties", () => {
        expect.assertions(8);

        const staleDocument = document.implementation.createHTMLDocument(
            "stale fullscreen button runtime"
        );
        const staleDocumentEventTarget = new EventTarget();
        const staleWindowEventTarget = new EventTarget();
        const staleDocumentListenerController = new AbortController();
        const staleWindowListenerController = new AbortController();
        const staleDocumentAddEventListener = vi.fn();
        const staleWindowAddEventListener = vi.fn();
        const runtime = getAddFullScreenButtonRuntime({
            documentEventTarget: {
                addEventListener(type, listener, options) {
                    staleDocumentAddEventListener(type, listener, options);
                    staleDocumentEventTarget.addEventListener(type, listener, {
                        signal: staleDocumentListenerController.signal,
                    });
                },
                removeEventListener: vi.fn(),
            },
            document: staleDocument,
            globalEventTarget: {
                addEventListener(type, listener, options) {
                    staleWindowAddEventListener(type, listener, options);
                    staleWindowEventTarget.addEventListener(type, listener, {
                        signal: staleWindowListenerController.signal,
                    });
                },
                removeEventListener: vi.fn(),
            },
        } as unknown as Parameters<typeof getAddFullScreenButtonRuntime>[0]);
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };

        runtime.addDocumentEventListener("fullscreenchange", listener);
        runtime.addWindowEventListener("keydown", listener);
        staleDocumentEventTarget.dispatchEvent(new Event("fullscreenchange"));
        staleWindowEventTarget.dispatchEvent(new Event("keydown"));

        expect(handledEventTypes).toStrictEqual([]);
        expect(() => runtime.getElementById("global-fullscreen-btn")).toThrow(
            "addFullScreenButton requires a document runtime"
        );
        expect(() => runtime.hasBodyClass("app-has-file")).toThrow(
            "addFullScreenButton requires a document runtime"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "addFullScreenButton requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("addFullScreenButton requires a document runtime");
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "addFullScreenButton requires a document runtime"
        );
        expect(staleDocumentAddEventListener).not.toHaveBeenCalled();
        expect(staleWindowAddEventListener).not.toHaveBeenCalled();
    });

    it("reads fullscreen button state through the injected document runtime", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument(
            "fullscreen button runtime"
        );
        const runtime = getAddFullScreenButtonRuntime({
            getDocument: () => documentRef,
        });
        const button = runtime.createElement("button");
        button.id = "global-fullscreen-btn";
        runtime.appendToBody(button);

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.getElementById("global-fullscreen-btn")).toBe(button);
        expect(runtime.hasBodyClass("app-has-file")).toBe(false);
        documentRef.body.classList.add("app-has-file");
        expect(runtime.hasBodyClass("app-has-file")).toBe(true);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAddFullScreenButtonRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("creates fullscreen SVG elements through the injected document runtime", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument(
            "fullscreen button svg runtime"
        );
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const runtime = getAddFullScreenButtonRuntime({
            getDocument: () => documentRef,
        });

        const icon = runtime.createSvgElement("svg");

        expect(icon.tagName.toLowerCase()).toBe("svg");
        expect(icon.namespaceURI).toBe(FULLSCREEN_BUTTON_SVG_NAMESPACE);
        expect(createElementNS).toHaveBeenCalledWith(
            FULLSCREEN_BUTTON_SVG_NAMESPACE,
            "svg"
        );
        expect(() => runtime.createSvgElement("path")).not.toThrow();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getAddFullScreenButtonRuntime({
            AbortController,
        } as unknown as Parameters<typeof getAddFullScreenButtonRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "addFullScreenButton requires an AbortController runtime"
        );
    });
});

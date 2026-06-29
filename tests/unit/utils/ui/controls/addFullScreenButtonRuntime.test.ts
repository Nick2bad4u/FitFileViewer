import { afterEach, describe, expect, it, vi } from "vitest";

import {
    FULLSCREEN_BUTTON_SVG_NAMESPACE,
    getAddFullScreenButtonRuntime,
    type AddFullScreenButtonRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/addFullScreenButtonRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserMutationObserverConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

function createAddFullScreenButtonRuntimeScope(
    overrides: Partial<AddFullScreenButtonRuntimeScope> = {}
): AddFullScreenButtonRuntimeScope {
    return {
        getAbortController: () => AbortController,
        getDocument: () => document,
        getDocumentEventTarget: () => document,
        getHTMLElement: () => HTMLElement,
        getKeyboardEvent: () => KeyboardEvent,
        getMutationObserver: () => MutationObserver,
        getWindowEventTarget: () => globalThis,
        ...overrides,
    };
}

function createUnavailableAddFullScreenButtonRuntimeScope(
    overrides: Partial<AddFullScreenButtonRuntimeScope> = {}
): AddFullScreenButtonRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getDocumentEventTarget: () => undefined,
        getHTMLElement: () => undefined,
        getKeyboardEvent: () => undefined,
        getMutationObserver: () => undefined,
        getWindowEventTarget: () => undefined,
        ...overrides,
    };
}

describe("getAddFullScreenButtonRuntime", () => {
    afterEach(() => {
        document.body.classList.remove("app-has-file");
        document.body.replaceChildren();
    });

    it("routes window and document listeners through injected providers", () => {
        expect.assertions(2);

        const documentEventTarget = new EventTarget();
        const windowEventTarget = new EventTarget();
        const runtime = getAddFullScreenButtonRuntime(
            createAddFullScreenButtonRuntimeScope({
                getDocumentEventTarget: () => documentEventTarget,
                getWindowEventTarget: () => windowEventTarget,
            })
        );
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };
        const cleanupController = new AbortController();
        const options = { signal: cleanupController.signal };

        runtime.addWindowEventListener("keydown", listener, options);
        runtime.addDocumentEventListener("fullscreenchange", listener, options);

        windowEventTarget.dispatchEvent(new Event("keydown"));
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);

        runtime.removeWindowEventListener("keydown", listener);
        runtime.removeDocumentEventListener("fullscreenchange", listener);
        windowEventTarget.dispatchEvent(new Event("keydown"));
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));
        cleanupController.abort();

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);
    });

    it("ignores missing event targets", () => {
        expect.assertions(1);

        const runtime = getAddFullScreenButtonRuntime(
            createUnavailableAddFullScreenButtonRuntimeScope()
        );
        const listener = vi.fn();

        expect(() => {
            runtime.addWindowEventListener("keydown", listener);
            runtime.addDocumentEventListener("fullscreenchange", listener);
            runtime.removeWindowEventListener("keydown", listener);
            runtime.removeDocumentEventListener("fullscreenchange", listener);
        }).not.toThrow();
    });

    it("ignores legacy direct scope properties", () => {
        expect.assertions(14);

        const staleDocument = document.implementation.createHTMLDocument(
            "stale fullscreen button runtime"
        );
        const element = document.createElement("div");
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
            windowEventTarget: {
                addEventListener(type, listener, options) {
                    staleWindowAddEventListener(type, listener, options);
                    staleWindowEventTarget.addEventListener(type, listener, {
                        signal: staleWindowListenerController.signal,
                    });
                },
                removeEventListener: vi.fn(),
            },
            HTMLElement,
            KeyboardEvent,
            MutationObserver,
        } as unknown as Parameters<typeof getAddFullScreenButtonRuntime>[0]);
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };

        expect(() =>
            runtime.addDocumentEventListener("fullscreenchange", listener)
        ).toThrow(
            "addFullScreenButton requires a document event-target provider"
        );
        expect(() =>
            runtime.addWindowEventListener("keydown", listener)
        ).toThrow(
            "addFullScreenButton requires a window event-target provider"
        );
        staleDocumentEventTarget.dispatchEvent(new Event("fullscreenchange"));
        staleWindowEventTarget.dispatchEvent(new Event("keydown"));

        expect(handledEventTypes).toStrictEqual([]);
        expect(() => runtime.getElementById("global-fullscreen-btn")).toThrow(
            "addFullScreenButton requires a document provider"
        );
        expect(() => runtime.hasBodyClass("app-has-file")).toThrow(
            "addFullScreenButton requires a document provider"
        );
        expect(() => runtime.createElement("button")).toThrow(
            "addFullScreenButton requires a document provider"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("addFullScreenButton requires a document provider");
        expect(() =>
            runtime.observeBody({ observe: vi.fn() }, { attributes: true })
        ).toThrow("addFullScreenButton requires a document provider");
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "addFullScreenButton requires a document provider"
        );
        expect(() => runtime.createMutationObserver(() => undefined)).toThrow(
            "addFullScreenButton requires a MutationObserver provider"
        );
        expect(() => runtime.isHTMLElement(element)).toThrow(
            "addFullScreenButton requires an HTMLElement provider"
        );
        expect(() =>
            runtime.isKeyboardEvent(new KeyboardEvent("keydown"))
        ).toThrow("addFullScreenButton requires a KeyboardEvent provider");
        expect(staleDocumentAddEventListener).not.toHaveBeenCalled();
        expect(staleWindowAddEventListener).not.toHaveBeenCalled();
    });

    it("derives document listeners from the scoped document provider", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument(
            "fullscreen button listener runtime"
        );
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const removeEventListener = vi.spyOn(
            documentRef,
            "removeEventListener"
        );
        const cleanupController = new AbortController();
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };
        const runtime = getAddFullScreenButtonRuntime(
            createAddFullScreenButtonRuntimeScope({
                getDocument: () => documentRef,
                getDocumentEventTarget: () => undefined,
            })
        );

        runtime.addDocumentEventListener("fullscreenchange", listener, {
            signal: cleanupController.signal,
        });
        documentRef.dispatchEvent(new Event("fullscreenchange"));
        runtime.removeDocumentEventListener("fullscreenchange", listener);
        documentRef.dispatchEvent(new Event("fullscreenchange"));
        cleanupController.abort();

        expect(addEventListener).toHaveBeenCalledWith(
            "fullscreenchange",
            listener,
            { signal: cleanupController.signal }
        );
        expect(removeEventListener).toHaveBeenCalledWith(
            "fullscreenchange",
            listener
        );
        expect(handledEventTypes).toStrictEqual(["fullscreenchange"]);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("reads fullscreen button state through the injected document runtime", () => {
        expect.assertions(8);

        document.body.classList.remove("app-has-file");
        document.body.replaceChildren();
        const documentRef = document;
        const runtime = getAddFullScreenButtonRuntime(
            createAddFullScreenButtonRuntimeScope({
                getDocument: () => documentRef,
                getHTMLElement: () => HTMLElement,
            })
        );
        const button = runtime.createElement("button");
        button.id = "global-fullscreen-btn";
        runtime.appendToBody(button);

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.getDocument()).toBe(documentRef);
        expect(runtime.getElementById("global-fullscreen-btn")).toBe(button);
        expect(runtime.querySelector("#global-fullscreen-btn")).toBe(button);
        expect(runtime.isHTMLElement(button)).toBe(true);
        expect(runtime.hasBodyClass("app-has-file")).toBe(false);
        documentRef.body.classList.add("app-has-file");
        expect(runtime.hasBodyClass("app-has-file")).toBe(true);

        const observer = { observe: vi.fn() };
        const options = { attributeFilter: ["class"], attributes: true };
        runtime.observeBody(observer, options);
        expect(observer.observe).toHaveBeenCalledWith(
            documentRef.body,
            options
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAddFullScreenButtonRuntime(
            createAddFullScreenButtonRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            })
        );

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production browser defaults", () => {
        expect.assertions(7);

        const runtime = getAddFullScreenButtonRuntime();
        const button = runtime.createElement("button");
        const observer = runtime.createMutationObserver(vi.fn());
        const listener = vi.fn();

        runtime.addWindowEventListener("fullscreenchange", listener);
        globalThis.dispatchEvent(new Event("fullscreenchange"));
        runtime.removeWindowEventListener("fullscreenchange", listener);
        globalThis.dispatchEvent(new Event("fullscreenchange"));
        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
        expect(runtime.getDocument()).toBe(document);
        expect(runtime.isHTMLElement(button)).toBe(true);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
        expect(observer).toBeInstanceOf(MutationObserver);

        runtime.appendToBody(button);

        expect(document.body.contains(button)).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
    });

    it("creates mutation observers and checks keyboard events through injected constructors", () => {
        expect.assertions(4);

        const observer = { observe: vi.fn() };
        const callback = vi.fn<MutationCallback>();
        const MutationObserverConstructor = vi.fn(function FakeMutationObserver(
            this: unknown,
            receivedCallback: MutationCallback
        ) {
            expect(receivedCallback).toBe(callback);
            return observer;
        });
        const keyboardEvent = new KeyboardEvent("keydown", { key: "F11" });
        const runtime = getAddFullScreenButtonRuntime(
            createAddFullScreenButtonRuntimeScope({
                getKeyboardEvent: () => KeyboardEvent,
                getMutationObserver: () =>
                    MutationObserverConstructor as unknown as BrowserMutationObserverConstructor,
            })
        );

        expect(runtime.createMutationObserver(callback)).toBe(observer);
        expect(MutationObserverConstructor).toHaveBeenCalledOnce();
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
    });

    it("creates fullscreen SVG elements through the injected document runtime", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument(
            "fullscreen button svg runtime"
        );
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const runtime = getAddFullScreenButtonRuntime(
            createAddFullScreenButtonRuntimeScope({
                getDocument: () => documentRef,
            })
        );

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

        const runtime = getAddFullScreenButtonRuntime(
            createUnavailableAddFullScreenButtonRuntimeScope({
                getAbortController: () => undefined,
            })
        );

        expect(() => runtime.createAbortController()).toThrow(
            "addFullScreenButton requires an AbortController runtime"
        );
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(7);

        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getAbortController: undefined,
            }).createAbortController()
        ).toThrow("addFullScreenButton requires an AbortController provider");
        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getDocument: undefined,
            }).getDocument()
        ).toThrow("addFullScreenButton requires a document provider");
        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getDocumentEventTarget: undefined,
            }).addDocumentEventListener("fullscreenchange", vi.fn())
        ).toThrow(
            "addFullScreenButton requires a document event-target provider"
        );
        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getWindowEventTarget: undefined,
            }).addWindowEventListener("keydown", vi.fn())
        ).toThrow(
            "addFullScreenButton requires a window event-target provider"
        );
        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getHTMLElement: undefined,
            }).isHTMLElement(document.body)
        ).toThrow("addFullScreenButton requires an HTMLElement provider");
        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getKeyboardEvent: undefined,
            }).isKeyboardEvent(new KeyboardEvent("keydown"))
        ).toThrow("addFullScreenButton requires a KeyboardEvent provider");
        expect(() =>
            getAddFullScreenButtonRuntime({
                ...createAddFullScreenButtonRuntimeScope(),
                getMutationObserver: undefined,
            }).createMutationObserver(vi.fn())
        ).toThrow("addFullScreenButton requires a MutationObserver provider");
    });

    it("preserves unavailable runtime fallbacks for optional classifiers", () => {
        expect.assertions(2);

        const runtime = getAddFullScreenButtonRuntime(
            createUnavailableAddFullScreenButtonRuntimeScope()
        );

        expect(runtime.isHTMLElement(document.body)).toBe(false);
        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            false
        );
    });
});

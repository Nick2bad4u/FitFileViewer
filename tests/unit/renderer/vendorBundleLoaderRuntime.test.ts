import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererVendorBundleLoaderRuntime,
    type RendererVendorBundleLoaderRuntimeScope,
    type RendererVendorBundleLoaderTimerHandle,
} from "../../../electron-app/renderer/vendorBundleLoaderRuntime.js";
import type {
    BrowserAddEventListener,
    BrowserClearTimeout,
    BrowserRemoveEventListener,
    BrowserSetTimeout,
} from "../../../electron-app/utils/runtime/browserRuntime.js";

function createUnavailableRuntimeScope(
    overrides: Partial<RendererVendorBundleLoaderRuntimeScope> = {}
): RendererVendorBundleLoaderRuntimeScope {
    return {
        getAbortController: () => undefined,
        getAddEventListener: () => undefined,
        getClearTimeout: () => undefined,
        getCustomEvent: () => undefined,
        getDocument: () => undefined,
        getHTMLScriptElement: () => undefined,
        getNow: () => undefined,
        getRemoveEventListener: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getRendererVendorBundleLoaderRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("registers and removes event listeners through the injected runtime scope", () => {
        expect.assertions(4);

        const addEventListener = vi.fn<BrowserAddEventListener>();
        const removeEventListener = vi.fn<BrowserRemoveEventListener>();
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getAddEventListener: () => addEventListener,
                getRemoveEventListener: () => removeEventListener,
            })
        );

        utils.addEventListener("ready", listener, options);
        utils.removeEventListener("ready", listener);

        expect(addEventListener).toHaveBeenCalledWith(
            "ready",
            listener,
            options
        );
        expect(addEventListener.mock.contexts[0]).toBeUndefined();
        expect(removeEventListener).toHaveBeenCalledWith("ready", listener);
        expect(removeEventListener.mock.contexts[0]).toBeUndefined();
    });

    it("uses bound default window listeners when no scope is injected", () => {
        expect.assertions(1);

        const eventType = "ffv-vendor-loader-default-scope";
        let receivedEventType = "";
        const listener: EventListener = (event) => {
            receivedEventType = event.type;
        };
        const utils = getRendererVendorBundleLoaderRuntime();

        try {
            utils.addEventListener(eventType, listener);
            globalThis.dispatchEvent(new Event(eventType));
        } finally {
            utils.removeEventListener(eventType, listener);
        }

        expect(receivedEventType).toBe(eventType);
    });

    it("uses renderer browser runtime providers for production defaults", () => {
        expect.assertions(1);

        vi.stubGlobal("AbortController", AbortController);

        const utils = getRendererVendorBundleLoaderRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(15);

        const addEventListener = vi.fn<BrowserAddEventListener>();
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const pollDelayMs = Number("20");
        const removeEventListener = vi.fn<BrowserRemoveEventListener>();
        const setTimeout = vi.fn<BrowserSetTimeout>(
            () => 29 as RendererVendorBundleLoaderTimerHandle
        );
        const utils = getRendererVendorBundleLoaderRuntime();
        vi.spyOn(Date, "now").mockReturnValue(2468);

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("addEventListener", addEventListener);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("document", document);
        vi.stubGlobal("HTMLScriptElement", HTMLScriptElement);
        vi.stubGlobal("removeEventListener", removeEventListener);
        vi.stubGlobal("setTimeout", setTimeout);

        const controller = utils.createAbortController();
        const customEventDetail = { entryName: "core" };
        const script = utils.createVendorScript(
            "map",
            "http://localhost/renderer-vendor-map.js"
        );

        utils.addEventListener("ready", listener, options);
        utils.appendVendorScript(script);
        utils.removeEventListener("ready", listener);
        utils.clearTimeout(29 as RendererVendorBundleLoaderTimerHandle);

        expect(controller).toBeInstanceOf(AbortController);
        expect(
            utils.getCustomEventDetail(
                new CustomEvent("ready", { detail: customEventDetail })
            )
        ).toBe(customEventDetail);
        expect(script).toBeInstanceOf(HTMLScriptElement);
        expect(script.dataset["ffvRendererVendorEntry"]).toBe("map");
        expect(utils.getExistingVendorScript("map")).toBe(script);
        expect(utils.now()).toBe(2468);
        expect(utils.setTimeout(vi.fn(), pollDelayMs)).toBe(29);
        expect(addEventListener).toHaveBeenCalledWith(
            "ready",
            listener,
            options
        );
        expect(removeEventListener).toHaveBeenCalledWith("ready", listener);
        expect(clearTimeout).toHaveBeenCalledWith(29);
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            pollDelayMs
        );
        expect(addEventListener.mock.contexts[0]).toBe(globalThis);
        expect(removeEventListener.mock.contexts[0]).toBe(globalThis);
        expect(clearTimeout.mock.contexts[0]).toBe(globalThis);
        expect(setTimeout.mock.contexts[0]).toBe(globalThis);

        script.remove();
    });

    it("schedules and clears polling timers through the injected runtime scope", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const pollDelayMs = Number("20");
        const setTimeout = vi.fn<BrowserSetTimeout>(
            () => 29 as RendererVendorBundleLoaderTimerHandle
        );
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(utils.setTimeout(callback, pollDelayMs)).toBe(29);
        expect(setTimeout).toHaveBeenCalledWith(callback, pollDelayMs);

        utils.clearTimeout(29);

        expect(clearTimeout).toHaveBeenCalledWith(29);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("throws when polling timer cleanup is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() =>
            utils.clearTimeout(29 as RendererVendorBundleLoaderTimerHandle)
        ).toThrow("renderer vendor loader requires a clearTimeout runtime");
    });

    it("throws when polling timer scheduling is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderer vendor loader requires a setTimeout runtime"
        );
    });

    it("creates and appends vendor scripts through the injected document", () => {
        expect.assertions(7);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getHTMLScriptElement: () => HTMLScriptElement,
            })
        );
        const script = utils.createVendorScript(
            "map",
            "http://localhost/renderer-vendor-map.js"
        );

        expect(script).toBeInstanceOf(HTMLScriptElement);
        expect(script.dataset["ffvRendererVendorEntry"]).toBe("map");
        expect(script.defer).toBe(true);
        expect(script.src).toBe("http://localhost/renderer-vendor-map.js");
        expect(script.type).toBe("module");

        utils.appendVendorScript(script);

        expect(utils.getExistingVendorScript("map")).toBe(script);
        expect(document.head.contains(script)).toBe(true);

        script.remove();
    });

    it("does not borrow document-window script constructors for explicit document scopes", () => {
        expect.assertions(1);

        const script = document.createElement("script");
        script.dataset["ffvRendererVendorEntry"] = "map";
        document.head.append(script);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getDocument: () =>
                    ({
                        ...document,
                        defaultView: {
                            HTMLScriptElement,
                        },
                        head: document.head,
                        querySelector: (selector: string) =>
                            document.querySelector(selector),
                    }) as unknown as Document,
            })
        );

        expect(utils.getExistingVendorScript("map")).toBeNull();

        script.remove();
    });

    it("registers script load listeners through the script element", () => {
        expect.assertions(2);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
                getHTMLScriptElement: () => HTMLScriptElement,
            })
        );
        const script = document.createElement("script");
        const listener = vi.fn<EventListener>(() => {
            script.dataset["loaded"] = "true";
        });
        const controller = new AbortController();

        utils.addScriptEventListener(script, "load", listener, {
            signal: controller.signal,
        });
        script.dispatchEvent(new Event("load"));
        controller.abort();
        script.dispatchEvent(new Event("load"));

        expect(script.dataset["loaded"]).toBe("true");
        expect(listener).toHaveBeenCalledWith(expect.any(Event));
    });

    it("creates abort controllers and reads the injected clock", () => {
        expect.assertions(2);

        const abortController = new AbortController();
        class TestAbortController {
            public readonly signal = abortController.signal;

            public abort(): void {
                abortController.abort();
            }
        }
        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () => TestAbortController,
                getNow: () => () => 1234,
            })
        );

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(utils.now()).toBe(1234);
    });

    it("reads CustomEvent details through the injected constructor", () => {
        expect.assertions(2);

        const detail = { entryName: "chart-data" };
        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope({
                getCustomEvent: () => CustomEvent,
            })
        );

        expect(
            utils.getCustomEventDetail(new CustomEvent("ready", { detail }))
        ).toBe(detail);
        expect(utils.getCustomEventDetail(new Event("ready"))).toBeUndefined();
    });

    it("throws when clock access is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => utils.now()).toThrow(
            "renderer vendor loader requires a clock runtime"
        );
    });

    it("fails clearly when required document or AbortController runtimes are unavailable", () => {
        expect.assertions(3);

        const utils = getRendererVendorBundleLoaderRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => {
            utils.getExistingVendorScript("map");
        }).toThrow("renderer vendor loader requires a document");
        expect(() => {
            utils.createVendorScript("map", "renderer-vendor-map.js");
        }).toThrow("renderer vendor loader requires a document");
        expect(() => {
            utils.createAbortController();
        }).toThrow("renderer vendor loader requires an AbortController");
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(12);

        const addEventListener = vi.fn<BrowserAddEventListener>();
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const removeEventListener = vi.fn<BrowserRemoveEventListener>();
        const setTimeout = vi.fn<BrowserSetTimeout>(
            () => 29 as RendererVendorBundleLoaderTimerHandle
        );
        const listener = vi.fn<EventListener>();
        const utils = getRendererVendorBundleLoaderRuntime({
            AbortController,
            addEventListener,
            clearTimeout,
            CustomEvent,
            document,
            HTMLScriptElement,
            now: () => 1234,
            removeEventListener,
            setTimeout,
        } as unknown as Parameters<
            typeof getRendererVendorBundleLoaderRuntime
        >[0]);

        expect(() => utils.addEventListener("ready", listener)).toThrow(
            "renderer vendor loader requires an addEventListener provider"
        );
        expect(() => utils.removeEventListener("ready", listener)).toThrow(
            "renderer vendor loader requires a removeEventListener provider"
        );
        expect(addEventListener).not.toHaveBeenCalled();
        expect(removeEventListener).not.toHaveBeenCalled();
        expect(() =>
            utils.clearTimeout(29 as RendererVendorBundleLoaderTimerHandle)
        ).toThrow("renderer vendor loader requires a clearTimeout provider");
        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderer vendor loader requires a setTimeout provider"
        );
        expect(() => utils.now()).toThrow(
            "renderer vendor loader requires a clock provider"
        );
        expect(() =>
            utils.getCustomEventDetail(new CustomEvent("ready", { detail: {} }))
        ).toThrow("renderer vendor loader requires a CustomEvent provider");
        expect(() => utils.createAbortController()).toThrow(
            "renderer vendor loader requires an AbortController provider"
        );
        expect(() => {
            utils.createVendorScript("map", "renderer-vendor-map.js");
        }).toThrow("renderer vendor loader requires a document provider");
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
    });
});

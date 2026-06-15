import { afterEach, describe, expect, it, vi } from "vitest";

import { getRendererVendorBundleLoaderRuntime } from "../../../electron-app/renderer/vendorBundleLoaderRuntime.js";

describe("getRendererVendorBundleLoaderRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("registers and removes event listeners through the injected runtime scope", () => {
        expect.assertions(4);

        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const removeEventListener =
            vi.fn<typeof globalThis.removeEventListener>();
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const utils = getRendererVendorBundleLoaderRuntime({
            addEventListener,
            removeEventListener,
        });

        utils.addEventListener("ready", listener, options);
        utils.removeEventListener("ready", listener);

        expect(addEventListener).toHaveBeenCalledWith(
            "ready",
            listener,
            options
        );
        expect(addEventListener.mock.contexts[0]).toStrictEqual({
            addEventListener,
            removeEventListener,
        });
        expect(removeEventListener).toHaveBeenCalledWith("ready", listener);
        expect(removeEventListener.mock.contexts[0]).toStrictEqual({
            addEventListener,
            removeEventListener,
        });
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

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(13);

        const addEventListener = vi.fn<typeof globalThis.addEventListener>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const listener = vi.fn<EventListener>();
        const options: AddEventListenerOptions = { once: true };
        const pollDelayMs = Number("20");
        const removeEventListener =
            vi.fn<typeof globalThis.removeEventListener>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 29);
        const utils = getRendererVendorBundleLoaderRuntime();

        vi.stubGlobal("AbortController", AbortController);
        vi.stubGlobal("addEventListener", addEventListener);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("document", document);
        vi.stubGlobal("HTMLScriptElement", HTMLScriptElement);
        vi.stubGlobal("removeEventListener", removeEventListener);
        vi.stubGlobal("setTimeout", setTimeout);

        const controller = utils.createAbortController();
        const script = utils.createVendorScript(
            "map",
            "http://localhost/renderer-vendor-map.js"
        );

        utils.addEventListener("ready", listener, options);
        utils.appendVendorScript(script);
        utils.removeEventListener("ready", listener);
        utils.clearTimeout(29 as ReturnType<typeof globalThis.setTimeout>);

        expect(controller).toBeInstanceOf(AbortController);
        expect(script).toBeInstanceOf(HTMLScriptElement);
        expect(script.dataset["ffvRendererVendorEntry"]).toBe("map");
        expect(utils.getExistingVendorScript("map")).toBe(script);
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
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => 29);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const utils = getRendererVendorBundleLoaderRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(utils.setTimeout(callback, pollDelayMs)).toBe(29);
        expect(setTimeout).toHaveBeenCalledWith(callback, pollDelayMs);

        utils.clearTimeout(29);

        expect(clearTimeout).toHaveBeenCalledWith(29);
        expect(clearTimeout.mock.contexts[0]).toBeUndefined();
    });

    it("throws when polling timer cleanup is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorBundleLoaderRuntime({});

        expect(() =>
            utils.clearTimeout(29 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("renderer vendor loader requires a clearTimeout runtime");
    });

    it("throws when polling timer scheduling is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorBundleLoaderRuntime({});

        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderer vendor loader requires a setTimeout runtime"
        );
    });

    it("creates and appends vendor scripts through the injected document", () => {
        expect.assertions(7);

        const utils = getRendererVendorBundleLoaderRuntime({
            document,
            HTMLScriptElement,
        });
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

    it("registers script load listeners through the script element", () => {
        expect.assertions(2);

        const utils = getRendererVendorBundleLoaderRuntime({
            document,
            HTMLScriptElement,
        });
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
        const utils = getRendererVendorBundleLoaderRuntime({
            AbortController: TestAbortController,
            now: () => 1234,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(utils.now()).toBe(1234);
    });

    it("throws when clock access is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererVendorBundleLoaderRuntime({});

        expect(() => utils.now()).toThrow(
            "renderer vendor loader requires a clock runtime"
        );
    });

    it("fails clearly when required document or AbortController runtimes are unavailable", () => {
        expect.assertions(3);

        const utils = getRendererVendorBundleLoaderRuntime({});

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
});

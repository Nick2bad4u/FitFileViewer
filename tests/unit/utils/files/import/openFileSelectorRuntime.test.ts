import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getOpenFileSelectorRuntime,
    type OpenFileSelectorRuntimeScope,
} from "../../../../../electron-app/utils/files/import/openFileSelectorRuntime.js";

describe("getOpenFileSelectorRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
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
        const runtime = getOpenFileSelectorRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getOpenFileSelectorRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(
            AbortController
        );
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getOpenFileSelectorRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "openFileSelector requires an AbortController runtime"
        );
    });

    it("creates and appends input elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getOpenFileSelectorRuntime({
            getDocument: () => document,
        });
        const input = runtime.createInput();

        runtime.appendToBody(input);

        expect(input).toBeInstanceOf(HTMLInputElement);
        expect(input.isConnected).toBe(true);
        expect(document.body.contains(input)).toBe(true);

        input.remove();
    });

    it("uses browser runtime providers for production document and navigator defaults", () => {
        expect.assertions(4);

        vi.stubGlobal("navigator", { userAgent: "jsdom/26.0" });

        const runtime = getOpenFileSelectorRuntime();
        const input = runtime.createInput();

        runtime.appendToBody(input);

        expect(input).toBeInstanceOf(HTMLInputElement);
        expect(document.body.contains(input)).toBe(true);
        expect(runtime.isJsdom()).toBe(true);
        expect(input.ownerDocument).toBe(document);

        input.remove();
    });

    it("detects jsdom from the injected navigator user agent", () => {
        expect.assertions(2);

        expect(
            getOpenFileSelectorRuntime({
                getNavigator: () => ({ userAgent: "jsdom/26.0" }),
            }).isJsdom()
        ).toBe(true);
        expect(
            getOpenFileSelectorRuntime({
                getNavigator: () => ({ userAgent: "Mozilla/5.0" }),
            }).isJsdom()
        ).toBe(false);
    });

    it("uses the injected microtask queue", () => {
        expect.assertions(1);

        let microtaskRan = false;
        const runtime = getOpenFileSelectorRuntime({
            getQueueMicrotask: () => (callback) => {
                callback();
            },
        });

        runtime.queueMicrotask(() => {
            microtaskRan = true;
        });

        expect(microtaskRan).toBe(true);
    });

    it("uses browser runtime providers for production microtask defaults", () => {
        expect.assertions(2);

        let microtaskRan = false;
        const queueMicrotask = vi.fn<typeof globalThis.queueMicrotask>(
            (callback) => {
                callback();
            }
        );
        vi.stubGlobal("queueMicrotask", queueMicrotask);

        getOpenFileSelectorRuntime().queueMicrotask(() => {
            microtaskRan = true;
        });

        expect(microtaskRan).toBe(true);
        expect(queueMicrotask).toHaveBeenCalledOnce();
    });

    it("throws when microtask scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getOpenFileSelectorRuntime({});

        expect(() => runtime.queueMicrotask(vi.fn())).toThrow(
            "openFileSelector requires a queueMicrotask runtime"
        );
    });

    it("uses the injected timeout scheduler and clearer", () => {
        expect.assertions(4);

        let callbackRan = false;
        let clearedTimer: ReturnType<typeof setTimeout> | undefined;
        let scheduledDelayMs = -1;
        const runtime = getOpenFileSelectorRuntime({
            getClearTimeout: () => (timer) => {
                clearedTimer = timer;
            },
            getSetTimeout:
                () =>
                (callback, delayMs): ReturnType<typeof setTimeout> => {
                    scheduledDelayMs = delayMs;
                    callback();
                    return 11 as ReturnType<typeof setTimeout>;
                },
        });
        const cleanupDelayMs = Number.parseInt("0", 10);

        const timer = runtime.setTimeout(() => {
            callbackRan = true;
        }, cleanupDelayMs);
        runtime.clearTimeout(timer);

        expect(timer).toBe(11);
        expect(callbackRan).toBe(true);
        expect(scheduledDelayMs).toBe(cleanupDelayMs);
        expect(clearedTimer).toBe(timer);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const delayMs = Number.parseInt("0", 10);
        const timer = 41 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(
            () => timer
        );
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getOpenFileSelectorRuntime();
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
        expect(clearTimeoutMock).toHaveBeenCalledOnce();
    });

    it("throws when timeout cleanup is unavailable", () => {
        expect.assertions(1);

        const runtime = getOpenFileSelectorRuntime({});

        expect(() =>
            runtime.clearTimeout(11 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("openFileSelector requires a clearTimeout runtime");
    });

    it("throws when timeout scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getOpenFileSelectorRuntime({});

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "openFileSelector requires a setTimeout runtime"
        );
    });

    it("fails clearly when document-backed operations lack a document", () => {
        expect.assertions(2);

        const runtime = getOpenFileSelectorRuntime({});

        expect(() => runtime.createInput()).toThrow(
            "openFileSelector requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("input"))
        ).toThrow("openFileSelector requires a document runtime");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(14);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        let microtaskRan = false;
        let clearedTimer: ReturnType<typeof setTimeout> | undefined;
        let scheduledDelayMs = -1;
        const initialBodyChildCount = document.body.childElementCount;
        const runtime = getOpenFileSelectorRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            clearTimeout(timer): void {
                clearedTimer = timer;
            },
            document,
            navigator: { userAgent: "jsdom/26.0" },
            queueMicrotask(callback): void {
                microtaskRan = true;
                callback();
            },
            setTimeout(callback, delayMs): ReturnType<typeof setTimeout> {
                scheduledDelayMs = delayMs;
                callback();
                return 19 as ReturnType<typeof setTimeout>;
            },
        } as unknown as OpenFileSelectorRuntimeScope);

        expect(() => runtime.createAbortController()).toThrow(
            "openFileSelector requires an AbortController runtime"
        );
        expect(() => runtime.createInput()).toThrow(
            "openFileSelector requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("input"))
        ).toThrow("openFileSelector requires a document runtime");
        expect(runtime.isJsdom()).toBe(false);
        expect(() => runtime.queueMicrotask(vi.fn())).toThrow(
            "openFileSelector requires a queueMicrotask runtime"
        );
        expect(() =>
            runtime.clearTimeout(19 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("openFileSelector requires a clearTimeout runtime");
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "openFileSelector requires a setTimeout runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(microtaskRan).toBe(false);
        expect(clearedTimer).toBeUndefined();
        expect(scheduledDelayMs).toBe(-1);
        expect(controller.signal.aborted).toBe(false);
        expect(document.body.childElementCount).toBe(initialBodyChildCount);
        expect(document.querySelector("input")).toBeNull();
    });
});

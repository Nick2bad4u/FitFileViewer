import { describe, expect, it, vi } from "vitest";

import { getOpenFileSelectorRuntime } from "../../../../../electron-app/utils/files/import/openFileSelectorRuntime.js";

describe("getOpenFileSelectorRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getOpenFileSelectorRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
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

        const runtime = getOpenFileSelectorRuntime({ document });
        const input = runtime.createInput();

        runtime.appendToBody(input);

        expect(input).toBeInstanceOf(HTMLInputElement);
        expect(input.isConnected).toBe(true);
        expect(document.body.contains(input)).toBe(true);

        input.remove();
    });

    it("detects jsdom from the injected navigator user agent", () => {
        expect.assertions(2);

        expect(
            getOpenFileSelectorRuntime({
                navigator: { userAgent: "jsdom/26.0" },
            }).isJsdom()
        ).toBe(true);
        expect(
            getOpenFileSelectorRuntime({
                navigator: { userAgent: "Mozilla/5.0" },
            }).isJsdom()
        ).toBe(false);
    });

    it("uses the injected microtask queue", () => {
        expect.assertions(1);

        let microtaskRan = false;
        const runtime = getOpenFileSelectorRuntime({
            queueMicrotask(callback): void {
                callback();
            },
        });

        runtime.queueMicrotask(() => {
            microtaskRan = true;
        });

        expect(microtaskRan).toBe(true);
    });

    it("uses the injected timeout scheduler and clearer", () => {
        expect.assertions(4);

        let callbackRan = false;
        let clearedTimer: ReturnType<typeof setTimeout> | undefined;
        let scheduledDelayMs = -1;
        const runtime = getOpenFileSelectorRuntime({
            clearTimeout(timer): void {
                clearedTimer = timer;
            },
            setTimeout(callback, delayMs): ReturnType<typeof setTimeout> {
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
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { getErrorHandlingRuntime } from "../../../electron-app/utils/errors/errorHandlingRuntime.js";

describe("getErrorHandlingRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getErrorHandlingRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getErrorHandlingRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "errorHandling requires an AbortController runtime"
        );
    });

    it("resolves the default AbortController when controllers are created", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getErrorHandlingRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("resolves the default event target when listeners are registered", () => {
        expect.assertions(2);

        const addEventListener = vi.fn();
        const listener = vi.fn();
        const controller = new AbortController();
        const options = { signal: controller.signal };

        vi.stubGlobal("addEventListener", addEventListener);

        const target = getErrorHandlingRuntime().getGlobalEventTarget();
        target?.addEventListener("error", listener, options);

        expect(target).toBeDefined();
        expect(addEventListener).toHaveBeenCalledWith(
            "error",
            listener,
            options
        );

        controller.abort();
    });

    it("resolves event targets through the injected listener provider", () => {
        expect.assertions(2);

        const addEventListener = vi.fn();
        const listener = vi.fn();
        const controller = new AbortController();
        const options = { passive: true, signal: controller.signal };
        const runtime = getErrorHandlingRuntime({
            getAddEventListener: () => addEventListener,
        });

        const target = runtime.getGlobalEventTarget();
        target?.addEventListener("unhandledrejection", listener, options);

        expect(target).toBeDefined();
        expect(addEventListener).toHaveBeenCalledWith(
            "unhandledrejection",
            listener,
            options
        );

        controller.abort();
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const addEventListener = vi.fn();
        const runtime = getErrorHandlingRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            eventTarget: { addEventListener },
        } as unknown as Parameters<typeof getErrorHandlingRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "errorHandling requires an AbortController runtime"
        );
        expect(runtime.getGlobalEventTarget()).toBeUndefined();
    });
});

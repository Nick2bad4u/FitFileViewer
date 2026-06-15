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
            AbortController:
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
});

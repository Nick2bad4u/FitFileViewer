import { describe, expect, it, vi } from "vitest";

import { getAddFullScreenButtonRuntime } from "../../../../../electron-app/utils/ui/controls/addFullScreenButtonRuntime.js";

describe("getAddFullScreenButtonRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAddFullScreenButtonRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getAddFullScreenButtonRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "addFullScreenButton requires an AbortController runtime"
        );
    });
});

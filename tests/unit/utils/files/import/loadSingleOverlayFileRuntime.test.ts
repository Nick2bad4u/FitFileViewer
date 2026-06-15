import { describe, expect, it, vi } from "vitest";

import { getLoadSingleOverlayFileRuntime } from "../../../../../electron-app/utils/files/import/loadSingleOverlayFileRuntime.js";

describe("getLoadSingleOverlayFileRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getLoadSingleOverlayFileRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getLoadSingleOverlayFileRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    });
});

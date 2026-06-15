import { describe, expect, it, vi } from "vitest";

import { getAccentColorPickerRuntime } from "../../../../electron-app/ui/modals/accentColorPickerRuntime.js";

describe("getAccentColorPickerRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAccentColorPickerRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getAccentColorPickerRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "accentColorPicker requires an AbortController runtime"
        );
    });
});

import { describe, expect, it, vi } from "vitest";

import { getSettingsStateCoreRuntime } from "../../../../../electron-app/utils/state/domain/settingsStateCoreRuntime.js";

describe("getSettingsStateCoreRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getSettingsStateCoreRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getSettingsStateCoreRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "settingsStateCore requires an AbortController runtime"
        );
    });
});

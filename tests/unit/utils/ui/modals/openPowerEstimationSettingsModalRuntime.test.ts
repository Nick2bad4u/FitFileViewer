import { describe, expect, it, vi } from "vitest";

import { getOpenPowerEstimationSettingsModalRuntime } from "../../../../../electron-app/utils/ui/modals/openPowerEstimationSettingsModalRuntime.js";

describe("getOpenPowerEstimationSettingsModalRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getOpenPowerEstimationSettingsModalRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getOpenPowerEstimationSettingsModalRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "openPowerEstimationSettingsModal requires an AbortController runtime"
        );
    });
});

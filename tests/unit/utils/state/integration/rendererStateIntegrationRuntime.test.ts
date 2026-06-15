import { describe, expect, it, vi } from "vitest";

import { getRendererStateIntegrationRuntime } from "../../../../../electron-app/utils/state/integration/rendererStateIntegrationRuntime.js";

describe("getRendererStateIntegrationRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 79 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getRendererStateIntegrationRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const utils = getRendererStateIntegrationRuntime({});

        expect(() => utils.setTimeout(() => {}, 0)).toThrow(
            "rendererStateIntegration requires a setTimeout runtime"
        );
        expect(() => {
            utils.clearTimeout(
                79 as ReturnType<typeof globalThis.setTimeout>
            );
        }).toThrow("rendererStateIntegration requires a clearTimeout runtime");
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const utils = getRendererStateIntegrationRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(utils.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererStateIntegrationRuntime({});

        expect(() => utils.createAbortController()).toThrow(
            "rendererStateIntegration requires an AbortController runtime"
        );
    });
});

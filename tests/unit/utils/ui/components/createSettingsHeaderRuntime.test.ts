import { describe, expect, it, vi } from "vitest";

import { getCreateSettingsHeaderRuntime } from "../../../../../electron-app/utils/ui/components/createSettingsHeaderRuntime.js";

describe("getCreateSettingsHeaderRuntime", () => {
    it("schedules and clears timers through injected timer functions", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 53 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getCreateSettingsHeaderRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("ignores missing timers when clearing optional slider state", () => {
        expect.assertions(2);

        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getCreateSettingsHeaderRuntime({ clearTimeout });

        expect(() => runtime.clearTimeout(undefined)).not.toThrow();

        expect(clearTimeout).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getCreateSettingsHeaderRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "createSettingsHeader requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("createSettingsHeader requires a clearTimeout runtime");
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getCreateSettingsHeaderRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreateSettingsHeaderRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "createSettingsHeader requires an AbortController runtime"
        );
    });
});

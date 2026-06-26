import { afterEach, describe, expect, it, vi } from "vitest";

import { getSetupThemeRuntime } from "../../../../../electron-app/utils/theming/core/setupThemeRuntime.js";

describe("getSetupThemeRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 97 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getSetupThemeRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("schedules and clears timers through provider functions", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const delayMs = Number("2500");
        const timer = 53 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getSetupThemeRuntime({
            getClearTimeout,
            getSetTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const delayMs = Number("5000");
        const timer = 61 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getSetupThemeRuntime();
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
        expect(clearTimeoutMock).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient timers or storage for explicit scopes", () => {
        expect.assertions(3);

        const runtime = getSetupThemeRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "setupThemeRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("setupThemeRuntime requires clearTimeout");
        expect(() => runtime.getStorageItem("ffv-theme")).toThrow(
            "setupThemeRuntime requires localStorage"
        );
    });

    it("routes storage through provider functions", () => {
        expect.assertions(5);

        const storage = {
            getItem: vi.fn(() => "light"),
            removeItem: vi.fn(),
            setItem: vi.fn(),
        };
        const getLocalStorage = vi.fn(() => storage);
        const runtime = getSetupThemeRuntime({
            getLocalStorage,
        });

        expect(runtime.getStorageItem("ffv-theme")).toBe("light");
        runtime.setStorageItem("ffv-theme", "dark");
        runtime.removeStorageItem("fitFileViewer_theme");

        expect(getLocalStorage).toHaveBeenCalledTimes(3);
        expect(storage.getItem).toHaveBeenCalledWith("ffv-theme");
        expect(storage.setItem).toHaveBeenCalledWith("ffv-theme", "dark");
        expect(storage.removeItem).toHaveBeenCalledWith("fitFileViewer_theme");
    });

    it("ignores legacy direct runtime scope timer and storage properties", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const timer = 101 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const localStorage = {
            getItem: vi.fn(() => "light"),
            removeItem: vi.fn(),
            setItem: vi.fn(),
        };
        const runtime = getSetupThemeRuntime({
            clearTimeout,
            localStorage,
            setTimeout,
        } as unknown as Parameters<typeof getSetupThemeRuntime>[0]);

        expect(() => runtime.setTimeout(callback, 1)).toThrow(
            "setupThemeRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "setupThemeRuntime requires clearTimeout"
        );
        expect(() => runtime.getStorageItem("ffv-theme")).toThrow(
            "setupThemeRuntime requires localStorage"
        );
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(localStorage.getItem).not.toHaveBeenCalled();
    });
});

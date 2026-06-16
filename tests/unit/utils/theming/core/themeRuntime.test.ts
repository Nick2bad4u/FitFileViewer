import { describe, expect, it, vi } from "vitest";

import { getThemeRuntime } from "../../../../../electron-app/utils/theming/core/themeRuntime.js";

describe("getThemeRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getThemeRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getThemeRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "theme core requires an AbortController runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 89 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getThemeRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(14);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 91 as ReturnType<typeof globalThis.setTimeout>;
        const mediaQuery = { matches: true } as MediaQueryList;
        const eventTarget = {
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as EventTarget;
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const matchMedia = vi.fn(() => mediaQuery);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as typeof AbortController
        );
        const getClearTimeout = vi.fn(() => clearTimeout);
        const getEventTarget = vi.fn(() => eventTarget);
        const getMatchMedia = vi.fn(() => matchMedia);
        const getSetTimeout = vi.fn(() => setTimeout);
        const runtime = getThemeRuntime({
            getAbortController,
            getClearTimeout,
            getEventTarget,
            getMatchMedia,
            getSetTimeout,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(runtime.getSystemThemeMediaQuery()).toBe(mediaQuery);
        expect(runtime.getWindowEventTarget()).toBe(eventTarget);

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getMatchMedia).toHaveBeenCalledOnce();
        expect(getEventTarget).toHaveBeenCalledOnce();
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
        expect(callback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const utils = getThemeRuntime({});

        expect(() => utils.setTimeout(() => {}, 0)).toThrow(
            "theme core requires a setTimeout runtime"
        );
        expect(() => {
            utils.clearTimeout(89 as ReturnType<typeof globalThis.setTimeout>);
        }).toThrow("theme core requires a clearTimeout runtime");
    });

    it("resolves system theme media queries from the scoped runtime", () => {
        expect.assertions(3);

        const mediaQuery = { matches: true } as MediaQueryList;
        const scopedMatchMedia = vi.fn(() => mediaQuery);

        expect(
            getThemeRuntime({
                matchMedia: scopedMatchMedia,
            }).getSystemThemeMediaQuery()
        ).toBe(mediaQuery);
        expect(scopedMatchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(getThemeRuntime({}).getSystemThemeMediaQuery()).toBeNull();
    });

    it("exposes the scoped theme event target", () => {
        expect.assertions(1);

        const eventTarget = {
            addEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as EventTarget;
        const runtime = getThemeRuntime({ eventTarget });

        expect(runtime.getWindowEventTarget()).toBe(eventTarget);
    });
});

import { describe, expect, it, vi } from "vitest";

import {
    getGetCurrentSettingsRuntime,
    type GetCurrentSettingsRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/getCurrentSettingsRuntime.js";

describe("getGetCurrentSettingsRuntime", () => {
    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("150");
        const timer = 83 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const {
            clearTimeout: clearScheduledTimeout,
            setTimeout: scheduleTimeout,
        } = getGetCurrentSettingsRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(scheduleTimeout(callback, delayMs)).toBe(timer);
        clearScheduledTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("checks form elements through injected constructor providers", () => {
        expect.assertions(4);

        const runtime = getGetCurrentSettingsRuntime({
            getHTMLInputElement: () => HTMLInputElement,
            getHTMLSelectElement: () => HTMLSelectElement,
        });
        const input = document.createElement("input");
        const select = document.createElement("select");

        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(select)).toBe(false);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
        expect(runtime.isHTMLSelectElement(input)).toBe(false);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(4);

        const runtime = getGetCurrentSettingsRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "getCurrentSettingsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("getCurrentSettingsRuntime requires clearTimeout");
        expect(() => runtime.isHTMLInputElement(document.body)).toThrow(
            "getCurrentSettingsRuntime requires HTMLInputElement"
        );
        expect(() => runtime.isHTMLSelectElement(document.body)).toThrow(
            "getCurrentSettingsRuntime requires HTMLSelectElement"
        );
    });

    it("ignores legacy direct timer and constructor scope properties", () => {
        expect.assertions(4);

        const runtime = getGetCurrentSettingsRuntime({
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            HTMLInputElement,
            HTMLSelectElement,
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as GetCurrentSettingsRuntimeScope);

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "getCurrentSettingsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("getCurrentSettingsRuntime requires clearTimeout");
        expect(() => runtime.isHTMLInputElement(document.body)).toThrow(
            "getCurrentSettingsRuntime requires HTMLInputElement"
        );
        expect(() => runtime.isHTMLSelectElement(document.body)).toThrow(
            "getCurrentSettingsRuntime requires HTMLSelectElement"
        );
    });
});

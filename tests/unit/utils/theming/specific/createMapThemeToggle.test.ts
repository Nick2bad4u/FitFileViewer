import { afterEach, describe, expect, it, vi } from "vitest";

import { createMapThemeToggle } from "../../../../../electron-app/utils/theming/specific/createMapThemeToggle.js";

type MapThemeToggleTestGlobal = typeof globalThis & {
    __ffvMapThemeToggleListenersController?: AbortController;
    __ffvMapThemeToggleListenersInstalled?: boolean;
    __ffvMapThemeToggleUpdate?: () => void;
};

function resetMapThemeToggleGlobals(): void {
    const testGlobal = globalThis as MapThemeToggleTestGlobal;
    testGlobal.__ffvMapThemeToggleListenersController?.abort();
    delete testGlobal.__ffvMapThemeToggleListenersController;
    delete testGlobal.__ffvMapThemeToggleListenersInstalled;
    delete testGlobal.__ffvMapThemeToggleUpdate;
}

describe("createMapThemeToggle renderer environment handling", () => {
    afterEach(() => {
        document.body.replaceChildren();
        localStorage.clear();
        resetMapThemeToggleGlobals();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates the toggle when the renderer has no process global", () => {
        expect.assertions(4);

        vi.stubGlobal("process", undefined);
        vi.spyOn(console, "debug").mockReturnValue(undefined);

        let toggle: HTMLElement | undefined;

        expect(() => {
            toggle = createMapThemeToggle();
        }).not.toThrow();

        expect(toggle).toBeInstanceOf(HTMLElement);
        expect(toggle?.classList.contains("map-theme-toggle")).toBe(true);
        expect(toggle?.getAttribute("aria-label")).toBe("Toggle map theme");
    });

    it("creates the toggle when the renderer process shim has no env object", () => {
        expect.assertions(3);

        vi.stubGlobal("process", {});
        vi.spyOn(console, "debug").mockReturnValue(undefined);

        let toggle: HTMLElement | undefined;

        expect(() => {
            toggle = createMapThemeToggle();
        }).not.toThrow();

        expect(toggle).toBeInstanceOf(HTMLElement);
        expect(toggle?.classList.contains("map-theme-toggle")).toBe(true);
    });
});

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

function getMapThemeToggleState(element: HTMLElement | undefined): {
    ariaLabel: null | string;
    className: string | undefined;
    hasSvgIcon: boolean;
    tagName: string | undefined;
    text: null | string | undefined;
    title: string | undefined;
} {
    return {
        ariaLabel: element?.getAttribute("aria-label") ?? null,
        className: element?.className,
        hasSvgIcon: element?.querySelector(".icon > svg") instanceof SVGElement,
        tagName: element?.tagName,
        text: element?.textContent,
        title: element?.title,
    };
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
        expect.assertions(3);

        vi.stubGlobal("process", undefined);
        vi.spyOn(console, "debug").mockReturnValue(undefined);

        let toggle: HTMLElement | undefined;

        expect(() => {
            toggle = createMapThemeToggle();
        }).not.toThrow();

        expect(toggle).toBeInstanceOf(HTMLButtonElement);
        expect(getMapThemeToggleState(toggle)).toEqual({
            ariaLabel: "Toggle map theme",
            className: "map-action-btn map-theme-toggle active",
            hasSvgIcon: true,
            tagName: "BUTTON",
            text: "Map Theme",
            title: "Map: Dark theme (click for light theme)",
        });
    });

    it("creates the toggle when the renderer process shim has no env object", () => {
        expect.assertions(3);

        vi.stubGlobal("process", {});
        vi.spyOn(console, "debug").mockReturnValue(undefined);

        let toggle: HTMLElement | undefined;

        expect(() => {
            toggle = createMapThemeToggle();
        }).not.toThrow();

        expect(toggle).toBeInstanceOf(HTMLButtonElement);
        expect(getMapThemeToggleState(toggle)).toEqual({
            ariaLabel: "Toggle map theme",
            className: "map-action-btn map-theme-toggle active",
            hasSvgIcon: true,
            tagName: "BUTTON",
            text: "Map Theme",
            title: "Map: Dark theme (click for light theme)",
        });
    });
});

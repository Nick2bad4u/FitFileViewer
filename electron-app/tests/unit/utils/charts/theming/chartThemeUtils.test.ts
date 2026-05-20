import { describe, expect, it, vi } from "vitest";

import { detectCurrentTheme } from "../../../../../utils/charts/theming/chartThemeUtils.js";
import type { EffectiveTheme } from "../../../../../utils/theming/core/theme.js";

const { getEffectiveThemeMock } = vi.hoisted(() => ({
    getEffectiveThemeMock: vi.fn<() => EffectiveTheme>(() => "light"),
}));

vi.mock(import("../../../../../utils/theming/core/theme.js"), () => ({
    getEffectiveTheme: getEffectiveThemeMock,
}));

interface ChartDebugGlobal {
    __FFV_debugCharts?: boolean;
}

function resetThemeEnvironment(): void {
    document.body.className = "";
    localStorage.clear();
    getEffectiveThemeMock.mockReset();
    getEffectiveThemeMock.mockReturnValue("light");

    const debugGlobal = globalThis as typeof globalThis & ChartDebugGlobal;
    delete debugGlobal.__FFV_debugCharts;

    Object.defineProperty(globalThis, "matchMedia", {
        configurable: true,
        value: undefined,
        writable: true,
    });
}

function setMatchMedia(matches: boolean): void {
    const dispatchEvent = vi.fn<(event: Event) => boolean>(() => false);
    const listen = (): void => undefined;

    Object.defineProperty(globalThis, "matchMedia", {
        configurable: true,
        value: vi.fn<(query: string) => MediaQueryList>((query) => ({
            addEventListener: listen,
            addListener: listen,
            dispatchEvent,
            matches,
            media: query,
            onchange: null,
            removeEventListener: listen,
            removeListener: listen,
        })),
        writable: true,
    });
}

describe(detectCurrentTheme, () => {
    it("prefers the dark body class", () => {
        expect.assertions(2);

        resetThemeEnvironment();
        document.body.classList.add("theme-dark");
        getEffectiveThemeMock.mockReturnValue("light");

        expect(detectCurrentTheme()).toBe("dark");
        expect(getEffectiveThemeMock).not.toHaveBeenCalled();
    });

    it("prefers the light body class", () => {
        expect.assertions(2);

        resetThemeEnvironment();
        document.body.classList.add("theme-light");
        getEffectiveThemeMock.mockReturnValue("dark");

        expect(detectCurrentTheme()).toBe("light");
        expect(getEffectiveThemeMock).not.toHaveBeenCalled();
    });

    it("uses getEffectiveTheme when no body class is set", () => {
        expect.assertions(2);

        resetThemeEnvironment();
        getEffectiveThemeMock.mockReturnValue("dark");

        expect(detectCurrentTheme()).toBe("dark");
        expect(getEffectiveThemeMock).toHaveBeenCalledOnce();
    });

    it("falls back to the saved localStorage theme", () => {
        expect.assertions(3);

        resetThemeEnvironment();
        getEffectiveThemeMock.mockImplementation(() => {
            throw new Error("theme unavailable");
        });
        localStorage.setItem("ffv-theme", "dark");

        expect(detectCurrentTheme()).toBe("dark");
        expect(getEffectiveThemeMock).toHaveBeenCalledOnce();
        expect(localStorage.getItem("ffv-theme")).toBe("dark");
    });

    it("resolves auto localStorage theme through system preference", () => {
        expect.assertions(3);

        resetThemeEnvironment();
        getEffectiveThemeMock.mockImplementation(() => {
            throw new Error("theme unavailable");
        });
        localStorage.setItem("ffv-theme", "auto");
        setMatchMedia(true);

        expect(detectCurrentTheme()).toBe("dark");
        expect(globalThis.matchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(localStorage.getItem("ffv-theme")).toBe("auto");
    });

    it("uses system preference when theme state and storage are unavailable", () => {
        expect.assertions(3);

        resetThemeEnvironment();
        getEffectiveThemeMock.mockImplementation(() => {
            throw new Error("theme unavailable");
        });
        setMatchMedia(true);

        expect(detectCurrentTheme()).toBe("dark");
        expect(globalThis.matchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
        expect(localStorage.getItem("ffv-theme")).toBeNull();
    });

    it("uses light as the final fallback", () => {
        expect.assertions(2);

        resetThemeEnvironment();
        getEffectiveThemeMock.mockImplementation(() => {
            throw new Error("theme unavailable");
        });
        setMatchMedia(false);

        expect(detectCurrentTheme()).toBe("light");
        expect(globalThis.matchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
    });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChartTheme } from "../../../../../electron-app/utils/charts/theming/chartThemeUtils.js";

type EffectiveTheme = ChartTheme | null | undefined;

const themeModulePath =
    "../../../../../electron-app/utils/theming/core/theme.js";

async function importChartThemeUtils() {
    return import("../../../../../electron-app/utils/charts/theming/chartThemeUtils.js");
}

function mockEffectiveTheme(theme: EffectiveTheme): void {
    vi.doMock(themeModulePath, () => ({ getEffectiveTheme: () => theme }));
}

function mockThrowingEffectiveTheme(): void {
    vi.doMock(themeModulePath, () => ({
        getEffectiveTheme: () => {
            throw new Error("boom");
        },
    }));
}

function setMatchMedia(dark: boolean | null): void {
    if (dark === null) {
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            value: undefined,
        });
        return;
    }

    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: (query: string): MediaQueryList => ({
            addEventListener: () => {},
            addListener: () => {},
            dispatchEvent: () => false,
            matches: dark,
            media: query,
            onchange: null,
            removeEventListener: () => {},
            removeListener: () => {},
        }),
    });
}

function mockLocalStorageGetItemFailure(): void {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("ls-fail");
    });
}

function setSavedTheme(theme: string): void {
    localStorage.setItem("ffv-theme", theme);
}

async function detectCurrentThemeFromModule(): Promise<ChartTheme> {
    const { detectCurrentTheme } = await importChartThemeUtils();
    return detectCurrentTheme();
}

describe("detectCurrentTheme", () => {
    beforeEach(() => {
        document.body.className = "";
        document.body.replaceChildren();
        localStorage.clear();
        setMatchMedia(null);
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("returns dark when body has theme-dark class", async () => {
        expect.assertions(1);

        document.body.classList.add("theme-dark");

        await expect(detectCurrentThemeFromModule()).resolves.toBe("dark");
    });

    it("returns light when body has theme-light class", async () => {
        expect.assertions(1);

        document.body.classList.add("theme-light");

        await expect(detectCurrentThemeFromModule()).resolves.toBe("light");
    });

    it("uses getEffectiveTheme when available", async () => {
        expect.assertions(1);

        mockEffectiveTheme("dark");

        await expect(detectCurrentThemeFromModule()).resolves.toBe("dark");
    });

    it("falls back to localStorage when getEffectiveTheme throws", async () => {
        expect.assertions(2);

        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        mockThrowingEffectiveTheme();
        setSavedTheme("light");

        await expect(detectCurrentThemeFromModule()).resolves.toBe("light");
        expect(consoleWarn).toHaveBeenCalledWith(
            "[ChartThemeUtils] getEffectiveTheme failed:",
            expect.any(Error)
        );
    });

    it("resolves auto to system dark via matchMedia", async () => {
        expect.assertions(1);

        mockEffectiveTheme(null);
        setSavedTheme("auto");
        setMatchMedia(true);

        await expect(detectCurrentThemeFromModule()).resolves.toBe("dark");
    });

    it("resolves auto to system light via matchMedia false", async () => {
        expect.assertions(1);

        mockEffectiveTheme(null);
        setSavedTheme("auto");
        setMatchMedia(false);

        await expect(detectCurrentThemeFromModule()).resolves.toBe("light");
    });

    it("uses system preference fallback when no storage and no classes", async () => {
        expect.assertions(1);

        mockEffectiveTheme(undefined);
        setMatchMedia(true);

        await expect(detectCurrentThemeFromModule()).resolves.toBe("dark");
    });

    it("final fallback returns light when everything else unavailable", async () => {
        expect.assertions(2);

        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
        mockLocalStorageGetItemFailure();
        mockEffectiveTheme(undefined);
        setMatchMedia(null);

        await expect(detectCurrentThemeFromModule()).resolves.toBe("light");
        expect(consoleWarn).toHaveBeenCalledWith(
            "[ChartThemeUtils] localStorage access failed:",
            expect.any(Error)
        );
    });
});

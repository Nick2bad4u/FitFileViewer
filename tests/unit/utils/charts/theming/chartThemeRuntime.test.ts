import { describe, expect, it, vi } from "vitest";

import { getChartThemeRuntime } from "../../../../../electron-app/utils/charts/theming/chartThemeRuntime.js";

describe("getChartThemeRuntime", () => {
    it("reads body theme classes from an injected runtime scope", () => {
        expect.assertions(2);

        const classList = {
            contains: vi.fn<(themeClass: string) => boolean>(
                (themeClass) => themeClass === "theme-dark"
            ),
        } as unknown as DOMTokenList;
        const runtime = getChartThemeRuntime({
            getDocument: () => ({
                body: {
                    classList,
                } as HTMLElement,
            }),
        });

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(true);
        expect(runtime.hasBodyThemeClass("theme-light")).toBe(false);
    });

    it("reads the saved theme from injected storage", () => {
        expect.assertions(2);

        const getItem = vi.fn<(key: string) => null | string>(() => "auto");
        const runtime = getChartThemeRuntime({
            getLocalStorage: () => ({
                getItem,
            }),
        });

        expect(runtime.getSavedTheme()).toBe("auto");
        expect(getItem).toHaveBeenCalledWith("ffv-theme");
    });

    it("resolves the system preference through injected matchMedia", () => {
        expect.assertions(2);

        const matchMedia = vi.fn<
            (query: string) => Pick<MediaQueryList, "matches">
        >(() => ({ matches: true }));
        const runtime = getChartThemeRuntime({
            getMatchMedia: () => matchMedia,
        });

        expect(runtime.getSystemPreferredTheme()).toBe("dark");
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("routes browser reads through provider functions", () => {
        expect.assertions(9);

        const classList = {
            contains: vi.fn<(themeClass: string) => boolean>(
                (themeClass) => themeClass === "theme-light"
            ),
        } as unknown as DOMTokenList;
        const getDocument = vi.fn(() => ({
            body: {
                classList,
            } as HTMLElement,
        }));
        const getItem = vi.fn<(key: string) => null | string>(() => "dark");
        const getLocalStorage = vi.fn(() => ({
            getItem,
        }));
        const matchMedia = vi.fn<
            (query: string) => Pick<MediaQueryList, "matches">
        >(() => ({ matches: false }));
        const getMatchMedia = vi.fn(() => matchMedia);
        const utils = getChartThemeRuntime({
            getDocument,
            getLocalStorage,
            getMatchMedia,
        });

        expect(utils.hasBodyThemeClass("theme-light")).toBe(true);
        expect(utils.getSavedTheme()).toBe("dark");
        expect(utils.getSystemPreferredTheme()).toBe("light");
        expect(getDocument).toHaveBeenCalledOnce();
        expect(getLocalStorage).toHaveBeenCalledOnce();
        expect(getMatchMedia).toHaveBeenCalledOnce();
        expect(classList.contains).toHaveBeenCalledWith("theme-light");
        expect(getItem).toHaveBeenCalledWith("ffv-theme");
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("falls back to light when runtime browser APIs are unavailable", () => {
        expect.assertions(3);

        const runtime = getChartThemeRuntime({});

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(false);
        expect(runtime.getSavedTheme()).toBeNull();
        expect(runtime.getSystemPreferredTheme()).toBe("light");
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(7);

        const classList = {
            contains: vi.fn<(themeClass: string) => boolean>(
                (themeClass) => themeClass === "theme-dark"
            ),
        } as unknown as DOMTokenList;
        const getItem = vi.fn<(key: string) => null | string>(() => "auto");
        const matchMedia = vi.fn<
            (query: string) => Pick<MediaQueryList, "matches">
        >(() => ({ matches: true }));
        const runtime = getChartThemeRuntime({
            document: {
                body: {
                    classList,
                } as HTMLElement,
            },
            localStorage: {
                getItem,
            },
            matchMedia,
        } as unknown as Parameters<typeof getChartThemeRuntime>[0]);

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(false);
        expect(runtime.getSavedTheme()).toBeNull();
        expect(runtime.getSystemPreferredTheme()).toBe("light");
        expect(classList.contains).not.toHaveBeenCalled();
        expect(getItem).not.toHaveBeenCalled();
        expect(matchMedia).not.toHaveBeenCalled();
        expect(getChartThemeRuntime({}).getSystemPreferredTheme()).toBe(
            "light"
        );
    });
});

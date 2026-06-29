import { afterEach, describe, expect, it, vi } from "vitest";

import {
    type ChartThemeRuntimeScope,
    getChartThemeRuntime,
} from "../../../../../electron-app/utils/charts/theming/chartThemeRuntime.js";

function createUnavailableScope(): ChartThemeRuntimeScope {
    return {
        getDocument: () => undefined,
        getLocalStorage: () => undefined,
        getMatchMedia: () => undefined,
    };
}

describe("getChartThemeRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

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
            getLocalStorage: () => undefined,
            getMatchMedia: () => undefined,
        });

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(true);
        expect(runtime.hasBodyThemeClass("theme-light")).toBe(false);
    });

    it("reads the saved theme from injected storage", () => {
        expect.assertions(2);

        const getItem = vi.fn<(key: string) => null | string>(() => "auto");
        const runtime = getChartThemeRuntime({
            getDocument: () => undefined,
            getLocalStorage: () => ({
                getItem,
            }),
            getMatchMedia: () => undefined,
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
            getDocument: () => undefined,
            getLocalStorage: () => undefined,
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

    it("uses browser runtime providers for production browser defaults", () => {
        expect.assertions(6);

        const classList = {
            contains: vi.fn<(themeClass: string) => boolean>(
                (themeClass) => themeClass === "theme-dark"
            ),
        } as unknown as DOMTokenList;
        const getItem = vi.fn<(key: string) => null | string>(() => "dark");
        const matchMedia = vi.fn<
            (query: string) => Pick<MediaQueryList, "matches">
        >(() => ({ matches: true }));
        vi.stubGlobal("document", {
            body: {
                classList,
            },
        });
        vi.stubGlobal("localStorage", {
            getItem,
        });
        vi.stubGlobal("matchMedia", matchMedia);

        const runtime = getChartThemeRuntime();

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(true);
        expect(runtime.getSavedTheme()).toBe("dark");
        expect(runtime.getSystemPreferredTheme()).toBe("dark");
        expect(classList.contains).toHaveBeenCalledWith("theme-dark");
        expect(getItem).toHaveBeenCalledWith("ffv-theme");
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("fails clearly when explicit scopes omit providers", () => {
        expect.assertions(1);

        expect(() =>
            getChartThemeRuntime({} as unknown as ChartThemeRuntimeScope)
        ).toThrow("chartThemeRuntime requires a document provider");
    });

    it("fails clearly when provider slots are undefined", () => {
        expect.assertions(3);

        expect(() =>
            getChartThemeRuntime({
                getDocument: undefined,
                getLocalStorage: () => undefined,
                getMatchMedia: () => undefined,
            })
        ).toThrow("chartThemeRuntime requires a document provider");
        expect(() =>
            getChartThemeRuntime({
                getDocument: () => undefined,
                getLocalStorage: undefined,
                getMatchMedia: () => undefined,
            })
        ).toThrow("chartThemeRuntime requires a localStorage provider");
        expect(() =>
            getChartThemeRuntime({
                getDocument: () => undefined,
                getLocalStorage: () => undefined,
                getMatchMedia: undefined,
            })
        ).toThrow("chartThemeRuntime requires a matchMedia provider");
    });

    it("fails clearly when individual providers are missing", () => {
        expect.assertions(3);

        expect(() =>
            getChartThemeRuntime({
                getLocalStorage: () => undefined,
                getMatchMedia: () => undefined,
            } as unknown as ChartThemeRuntimeScope)
        ).toThrow("chartThemeRuntime requires a document provider");
        expect(() =>
            getChartThemeRuntime({
                getDocument: () => undefined,
                getMatchMedia: () => undefined,
            } as unknown as ChartThemeRuntimeScope)
        ).toThrow("chartThemeRuntime requires a localStorage provider");
        expect(() =>
            getChartThemeRuntime({
                getDocument: () => undefined,
                getLocalStorage: () => undefined,
            } as unknown as ChartThemeRuntimeScope)
        ).toThrow("chartThemeRuntime requires a matchMedia provider");
    });

    it("keeps unavailable browser APIs behind provider functions", () => {
        expect.assertions(3);

        const runtime = getChartThemeRuntime({
            getDocument: () => undefined,
            getLocalStorage: () => undefined,
            getMatchMedia: () => undefined,
        });

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(false);
        expect(runtime.getSavedTheme()).toBeNull();
        expect(runtime.getSystemPreferredTheme()).toBe("light");
    });

    it("fails clearly when legacy direct runtime primitive properties are provided without providers", () => {
        expect.assertions(4);

        const classList = {
            contains: vi.fn<(themeClass: string) => boolean>(
                (themeClass) => themeClass === "theme-dark"
            ),
        } as unknown as DOMTokenList;
        const getItem = vi.fn<(key: string) => null | string>(() => "auto");
        const matchMedia = vi.fn<
            (query: string) => Pick<MediaQueryList, "matches">
        >(() => ({ matches: true }));

        expect(() =>
            getChartThemeRuntime({
                document: {
                    body: {
                        classList,
                    } as HTMLElement,
                },
                localStorage: {
                    getItem,
                },
                matchMedia,
            } as unknown as Parameters<typeof getChartThemeRuntime>[0])
        ).toThrow("chartThemeRuntime requires a document provider");
        expect(classList.contains).not.toHaveBeenCalled();
        expect(getItem).not.toHaveBeenCalled();
        expect(matchMedia).not.toHaveBeenCalled();
    });

    it("falls back to light when runtime browser providers return unavailable APIs", () => {
        expect.assertions(3);

        const runtime = getChartThemeRuntime(createUnavailableScope());

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(false);
        expect(runtime.getSavedTheme()).toBeNull();
        expect(runtime.getSystemPreferredTheme()).toBe("light");
    });
});

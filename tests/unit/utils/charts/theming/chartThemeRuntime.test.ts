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
            document: {
                body: {
                    classList,
                } as HTMLElement,
            },
        });

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(true);
        expect(runtime.hasBodyThemeClass("theme-light")).toBe(false);
    });

    it("reads the saved theme from injected storage", () => {
        expect.assertions(2);

        const getItem = vi.fn<(key: string) => null | string>(() => "auto");
        const runtime = getChartThemeRuntime({
            localStorage: {
                getItem,
            },
        });

        expect(runtime.getSavedTheme()).toBe("auto");
        expect(getItem).toHaveBeenCalledWith("ffv-theme");
    });

    it("resolves the system preference through injected matchMedia", () => {
        expect.assertions(2);

        const matchMedia = vi.fn<(query: string) => Pick<MediaQueryList, "matches">>(
            () => ({ matches: true })
        );
        const runtime = getChartThemeRuntime({ matchMedia });

        expect(runtime.getSystemPreferredTheme()).toBe("dark");
        expect(matchMedia).toHaveBeenCalledWith(
            "(prefers-color-scheme: dark)"
        );
    });

    it("falls back to light when runtime browser APIs are unavailable", () => {
        expect.assertions(3);

        const runtime = getChartThemeRuntime({});

        expect(runtime.hasBodyThemeClass("theme-dark")).toBe(false);
        expect(runtime.getSavedTheme()).toBeNull();
        expect(runtime.getSystemPreferredTheme()).toBe("light");
    });
});

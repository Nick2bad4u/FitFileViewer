import { afterEach, describe, expect, it, vi } from "vitest";

const themeMocks = vi.hoisted(() => ({
    getThemeConfig: vi.fn<() => unknown>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        getThemeConfig: themeMocks.getThemeConfig,
    })
);

import {
    getThemeConfigSafe,
    normalizeThemeConfig,
} from "../../../../../electron-app/utils/charts/core/renderChartThemeHelpers.js";

interface ThemeConfigGlobalFixture {
    getThemeConfig?: () => unknown;
}

const themeConfigGlobal = globalThis as ThemeConfigGlobalFixture;

describe("renderChartThemeHelpers", () => {
    afterEach(() => {
        vi.clearAllMocks();
        Reflect.deleteProperty(themeConfigGlobal, "getThemeConfig");
    });

    it("normalizes theme configs with fallback chart colors", () => {
        expect.assertions(5);

        const normalized = normalizeThemeConfig({
            colors: {
                accent: "#123456",
                zoneColors: [],
            },
            isDark: true,
        });

        expect(normalized.colors.accent).toBe("#123456");
        expect(normalized.colors.zoneColors.length).toBeGreaterThan(0);
        expect(normalized.colors.heartRateZoneColors.length).toBeGreaterThan(0);
        expect(normalized.isDark).toBe(true);
        expect(normalized.isLight).toBe(false);
    });

    it("loads theme config from the typed import instead of a renderer global", async () => {
        expect.assertions(4);

        const globalProvider = vi.fn<() => unknown>(() => {
            throw new Error("legacy global theme provider should not run");
        });
        themeConfigGlobal.getThemeConfig = globalProvider;
        themeMocks.getThemeConfig.mockReturnValue({
            colors: {
                accent: "#abcdef",
                powerZoneColors: ["#111111"],
            },
            isDark: false,
        });

        const normalized = await getThemeConfigSafe();

        expect(themeMocks.getThemeConfig).toHaveBeenCalledOnce();
        expect(globalProvider).not.toHaveBeenCalled();
        expect(normalized.colors.accent).toBe("#abcdef");
        expect(normalized.colors.powerZoneColors).toStrictEqual(["#111111"]);
    });
});

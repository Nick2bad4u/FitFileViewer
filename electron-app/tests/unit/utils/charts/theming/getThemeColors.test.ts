import { describe, expect, it, vi } from "vitest";

import type { getThemeConfig } from "../../../../../utils/theming/core/theme.js";

const getThemeConfigMock = vi.hoisted(() => vi.fn<typeof getThemeConfig>());

vi.mock(import("../../../../../utils/theming/core/theme.js"), () => ({
    getThemeConfig: getThemeConfigMock,
}));

import {
    FALLBACK_THEME_COLORS,
    getThemeColor,
    getThemeColors,
} from "../../../../../utils/charts/theming/getThemeColors.js";

describe(getThemeColors, () => {
    it("returns a defensive copy of the current theme color map", () => {
        expect.assertions(4);

        getThemeConfigMock.mockReturnValue({
            colors: {
                accent: "#123456",
                heartRateZoneColors: ["#111111", "#222222"],
            },
            isDark: true,
            isLight: false,
            theme: "dark",
        });

        const colors = getThemeColors();

        expect(colors).toStrictEqual({
            accent: "#123456",
            heartRateZoneColors: ["#111111", "#222222"],
        });
        expect(colors).not.toBe(getThemeConfigMock.mock.results[0]?.value);
        expect(colors.accent).toBe("#123456");
        expect(colors.heartRateZoneColors).toStrictEqual([
            "#111111",
            "#222222",
        ]);
    });

    it("uses fallback colors when the theme config is invalid", () => {
        expect.assertions(2);

        getThemeConfigMock.mockReturnValue(
            null as unknown as ReturnType<typeof getThemeConfig>
        );
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockReturnValue(undefined);

        expect(getThemeColors()).toStrictEqual(FALLBACK_THEME_COLORS);
        expect(warnSpy).toHaveBeenCalledWith(
            "[getThemeColors] Invalid theme configuration"
        );

        warnSpy.mockRestore();
    });

    it("uses fallback colors when theme loading throws", () => {
        expect.assertions(2);

        const failure = new Error("theme failed");
        getThemeConfigMock.mockImplementation(() => {
            throw failure;
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockReturnValue(undefined);

        expect(getThemeColors()).toStrictEqual(FALLBACK_THEME_COLORS);
        expect(errorSpy).toHaveBeenCalledWith(
            "[getThemeColors] Failed to access theme colors:",
            failure
        );

        errorSpy.mockRestore();
    });
});

describe(getThemeColor, () => {
    it("returns string color values by key", () => {
        expect.assertions(1);

        getThemeConfigMock.mockReturnValue({
            colors: { accent: "#abcdef" },
            isDark: false,
            isLight: true,
            theme: "light",
        });

        expect(getThemeColor("accent", "#000000")).toBe("#abcdef");
    });

    it("does not return array color values through the string-color helper", () => {
        expect.assertions(1);

        getThemeConfigMock.mockReturnValue({
            colors: { zoneColors: ["#111111", "#222222"] },
            isDark: false,
            isLight: true,
            theme: "light",
        });

        expect(getThemeColor("zoneColors", "#000000")).toBe("#000000");
    });

    it("uses fallback colors for invalid keys", () => {
        expect.assertions(2);

        const warnSpy = vi
            .spyOn(console, "warn")
            .mockReturnValue(undefined);

        expect(getThemeColor("", "#fedcba")).toBe("#fedcba");
        expect(warnSpy).toHaveBeenCalledWith(
            "[getThemeColor] Invalid color key: "
        );

        warnSpy.mockRestore();
    });
});

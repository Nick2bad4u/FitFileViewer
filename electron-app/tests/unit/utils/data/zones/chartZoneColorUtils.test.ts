import { describe, it, expect, beforeEach, vi } from "vitest";

// We'll dynamically import to pick up mocked theme/localStorage each time
const loadModule = async () => {
    vi.resetModules();
    return await import("../../../../../utils/data/zones/chartZoneColorUtils.js");
};

// Mock theme config to provide default zone colors
vi.mock("../../../../../utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn(() => ({
        colors: {
            heartRateZoneColors: ["#111111", "#222222", "#333333", "#444444", "#555555"],
            powerZoneColors: ["#101010", "#202020", "#303030", "#404040", "#505050", "#606060", "#707070"],
        },
        name: "mock-theme",
    })),
}));

// Simple localStorage shim for tests
class LocalStorageShim {
    store: Record<string, string> = {};
    getItem(key: string) {
        return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    }
    setItem(key: string, val: string) {
        this.store[key] = String(val);
    }
    removeItem(key: string) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

const setLocalStorage = () => {
    // @ts-ignore
    globalThis.localStorage = new LocalStorageShim();
};

describe("chartZoneColorUtils", () => {
    beforeEach(() => {
        setLocalStorage();
    });

    it("getZoneTypeFromField infers hr/power or null", async () => {
        const { getZoneTypeFromField } = await loadModule();
        expect(getZoneTypeFromField("hr_zone_doughnut")).toBe("hr");
        expect(getZoneTypeFromField("heart-rate_distribution")).toBe("hr");
        expect(getZoneTypeFromField("power_zone_stacked")).toBe("power");
        expect(getZoneTypeFromField("power-zone-distribution")).toBe("power");
        expect(getZoneTypeFromField("speed_distribution")).toBeNull();
    });

    it("getZoneColor falls back to defaults and wraps index", async () => {
        const { getZoneColor, DEFAULT_HR_ZONE_COLORS, DEFAULT_POWER_ZONE_COLORS } = await loadModule();

        // No saved color yet, should use defaults
        expect(getZoneColor("hr", 0)).toBe(DEFAULT_HR_ZONE_COLORS[0]);
        expect(getZoneColor("hr", 7)).toBe(DEFAULT_HR_ZONE_COLORS[7 % DEFAULT_HR_ZONE_COLORS.length]);

        expect(getZoneColor("power", 0)).toBe(DEFAULT_POWER_ZONE_COLORS[0]);
        expect(getZoneColor("power", 10)).toBe(DEFAULT_POWER_ZONE_COLORS[10 % DEFAULT_POWER_ZONE_COLORS.length]);
    });

    it("saveZoneColor and persistence via getZoneColor", async () => {
        const { saveZoneColor, getZoneColor, DEFAULT_HR_ZONE_COLORS } = await loadModule();

        saveZoneColor("hr", 2, "#abcdef");
        expect(getZoneColor("hr", 2)).toBe("#abcdef");

        // Another index should still use defaults
        expect(getZoneColor("hr", 3)).toBe(DEFAULT_HR_ZONE_COLORS[3]);
    });

    it("getChartSpecificZoneColor prefers chart-specific then zone default", async () => {
        const { getChartSpecificZoneColor, saveChartSpecificZoneColor, saveZoneColor } = await loadModule();

        // No saved -> falls back to generic zone color
        expect(getChartSpecificZoneColor("hr_zone_doughnut", 0)).toBe("#111111");

        // Save generic zone color
        saveZoneColor("hr", 0, "#00ff00");
        expect(getChartSpecificZoneColor("hr_zone_doughnut", 0)).toBe("#00ff00");

        // Save chart-specific which takes precedence
        saveChartSpecificZoneColor("hr_zone_doughnut", 0, "#ff00ff");
        expect(getChartSpecificZoneColor("hr_zone_doughnut", 0)).toBe("#ff00ff");
    });

    it("getChartSpecificZoneColors returns array for count", async () => {
        const { getChartSpecificZoneColors, saveChartSpecificZoneColor } = await loadModule();

        saveChartSpecificZoneColor("power_lap_zone_stacked", 0, "#a0a0a0");
        const colors = getChartSpecificZoneColors("power_lap_zone_stacked", 3);
        expect(colors).toEqual(["#a0a0a0", "#202020", "#303030"]);
    });

    it("hasChartSpecificColors detects presence", async () => {
        const { hasChartSpecificColors, saveChartSpecificZoneColor } = await loadModule();
        expect(hasChartSpecificColors("foo", 3)).toBe(false);
        saveChartSpecificZoneColor("foo", 1, "#123456");
        expect(hasChartSpecificColors("foo", 3)).toBe(true);
    });

    it("resetChartSpecificZoneColors sets scheme to custom and writes defaults", async () => {
        const { resetChartSpecificZoneColors } = await loadModule();

        resetChartSpecificZoneColors("hr_zone_doughnut", 3);
        // Scheme flag
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_color_scheme")).toBe("custom");
        // Default colors written
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_zone_1_color")).toBe("#111111");
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_zone_2_color")).toBe("#222222");
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_zone_3_color")).toBe("#333333");
    });

    it("getZoneColors builds array via getZoneColor", async () => {
        const { getZoneColors } = await loadModule();
        const hr = getZoneColors("hr", 4);
        expect(hr).toEqual(["#111111", "#222222", "#333333", "#444444"]);
    });

    it("getChartZoneColors returns scheme colors for named schemes and custom uses saved/defaults", async () => {
        const { getChartZoneColors, getColorSchemes, saveZoneColor } = await loadModule();
        const schemes = getColorSchemes() as any;

        // A named scheme present in chartColorSchemes
        const vibrantPower = getChartZoneColors("power", 4, "vibrant");
        expect(vibrantPower).toEqual((schemes.vibrant.power as string[]).slice(0, 4));

        // Custom should use saved or default colors
        saveZoneColor("power", 0, "#0f0f0f");
        const custom = getChartZoneColors("power", 3, "custom");
        expect(custom[0]).toBe("#0f0f0f");
        expect(custom[1]).toBe("#202020");
        expect(custom[2]).toBe("#303030");
    });

    it("applyZoneColors maps zone.color using zoneIndex or array index", async () => {
        const { applyZoneColors } = await loadModule();
        const result = applyZoneColors(
            [
                { zone: 2, value: 10, label: "Z2" },
                { value: 20, label: "Z?" },
            ],
            "hr"
        );
        expect(result[0].color).toBe("#222222");
        expect(result[1].color).toBe("#222222");
    });

    it("resetZoneColors writes defaults for given count", async () => {
        const { resetZoneColors } = await loadModule();
        resetZoneColors("hr", 2);
        expect(localStorage.getItem("chartjs_hr_zone_1_color")).toBe("#111111");
        expect(localStorage.getItem("chartjs_hr_zone_2_color")).toBe("#222222");
    });
});

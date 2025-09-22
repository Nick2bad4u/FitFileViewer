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
            heartRateZoneColors: ["#h1", "#h2", "#h3", "#h4", "#h5"],
            powerZoneColors: ["#p1", "#p2", "#p3", "#p4", "#p5", "#p6", "#p7"],
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
        const { saveZoneColor, getZoneColor } = await loadModule();

        saveZoneColor("hr", 2, "#custom");
        expect(getZoneColor("hr", 2)).toBe("#custom");

        // Another index should still use defaults
        expect(getZoneColor("hr", 3)).toBe("#h4");
    });

    it("getChartSpecificZoneColor prefers chart-specific then zone default", async () => {
        const { getChartSpecificZoneColor, saveChartSpecificZoneColor, saveZoneColor } = await loadModule();

        // No saved -> falls back to generic zone color
        expect(getChartSpecificZoneColor("hr_zone_doughnut", 0)).toBe("#h1");

        // Save generic zone color
        saveZoneColor("hr", 0, "#g1");
        expect(getChartSpecificZoneColor("hr_zone_doughnut", 0)).toBe("#g1");

        // Save chart-specific which takes precedence
        saveChartSpecificZoneColor("hr_zone_doughnut", 0, "#c1");
        expect(getChartSpecificZoneColor("hr_zone_doughnut", 0)).toBe("#c1");
    });

    it("getChartSpecificZoneColors returns array for count", async () => {
        const { getChartSpecificZoneColors, saveChartSpecificZoneColor } = await loadModule();

        saveChartSpecificZoneColor("power_lap_zone_stacked", 0, "#pA");
        const colors = getChartSpecificZoneColors("power_lap_zone_stacked", 3);
        expect(colors).toEqual(["#pA", "#p2", "#p3"]);
    });

    it("hasChartSpecificColors detects presence", async () => {
        const { hasChartSpecificColors, saveChartSpecificZoneColor } = await loadModule();
        expect(hasChartSpecificColors("foo", 3)).toBe(false);
        saveChartSpecificZoneColor("foo", 1, "#X");
        expect(hasChartSpecificColors("foo", 3)).toBe(true);
    });

    it("resetChartSpecificZoneColors sets scheme to custom and writes defaults", async () => {
        const { resetChartSpecificZoneColors } = await loadModule();

        resetChartSpecificZoneColors("hr_zone_doughnut", 3);
        // Scheme flag
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_color_scheme")).toBe("custom");
        // Default colors written
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_zone_1_color")).toBe("#h1");
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_zone_2_color")).toBe("#h2");
        expect(localStorage.getItem("chartjs_hr_zone_doughnut_zone_3_color")).toBe("#h3");
    });

    it("getZoneColors builds array via getZoneColor", async () => {
        const { getZoneColors } = await loadModule();
        const hr = getZoneColors("hr", 4);
        expect(hr).toEqual(["#h1", "#h2", "#h3", "#h4"]);
    });

    it("getChartZoneColors returns scheme colors for named schemes and custom uses saved/defaults", async () => {
        const { getChartZoneColors, getColorSchemes, saveZoneColor } = await loadModule();
        const schemes = getColorSchemes() as any;

        // A named scheme present in chartColorSchemes
        const vibrantPower = getChartZoneColors("power", 4, "vibrant");
        expect(vibrantPower).toEqual((schemes.vibrant.power as string[]).slice(0, 4));

        // Custom should use saved or default colors
        saveZoneColor("power", 0, "#Z1");
        const custom = getChartZoneColors("power", 3, "custom");
        expect(custom[0]).toBe("#Z1");
        expect(custom[1]).toBe("#p2");
        expect(custom[2]).toBe("#p3");
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
        expect(result[0].color).toBe("#h2");
        expect(result[1].color).toBe("#h2");
    });

    it("resetZoneColors writes defaults for given count", async () => {
        const { resetZoneColors } = await loadModule();
        resetZoneColors("hr", 2);
        expect(localStorage.getItem("chartjs_hr_zone_1_color")).toBe("#h1");
        expect(localStorage.getItem("chartjs_hr_zone_2_color")).toBe("#h2");
    });
});

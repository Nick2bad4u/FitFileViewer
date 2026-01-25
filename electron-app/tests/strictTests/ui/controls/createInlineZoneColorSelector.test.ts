import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mocks to satisfy Vitest's hoisting of vi.mock
const hoisted = vi.hoisted(() => {
    const renderChartJS = vi.fn();
    const showNotification = vi.fn();
    const debouncedRender = vi.fn();

    const DEFAULT_HR_ZONE_COLORS = ["#a", "#b", "#c"];
    const DEFAULT_POWER_ZONE_COLORS = ["#1", "#2", "#3", "#4"];
    const storeChartSpecific: Record<string, string> = {};
    const storeGeneric: Record<string, string> = {};
    const getChartSpecificZoneColor = vi.fn(
        (field: string, idx: number) => storeChartSpecific[`${field}:${idx}`] || "#000000"
    );
    const saveChartSpecificZoneColor = vi.fn((field: string, idx: number, val: string) => {
        storeChartSpecific[`${field}:${idx}`] = val;
    });
    const saveZoneColor = vi.fn((type: string, idx: number, val: string) => {
        storeGeneric[`${type}:${idx}`] = val;
    });
    const resetChartSpecificZoneColors = vi.fn((field: string, count: number) => {
        for (let i = 0; i < count; i++) delete storeChartSpecific[`${field}:${i}`];
    });
    const resetZoneColors = vi.fn((type: string, count: number) => {
        for (let i = 0; i < count; i++) delete storeGeneric[`${type}:${i}`];
    });
    const getChartZoneColors = vi.fn((zoneType: string, count: number, scheme: string) =>
        Array.from({ length: count }, (_, i) => `#S-${scheme}-${i}`)
    );
    const applyZoneColors = vi.fn((zones: any[], _type: string) => zones);
    const getZoneTypeFromField = vi.fn((field: string) => (field.includes("hr") ? "hr" : "power"));

    // Cache invalidation helper used by the selector when switching schemes.
    const clearCachedChartZoneColor = vi.fn();

    return {
        renderChartJS,
        showNotification,
        debouncedRender,
        DEFAULT_HR_ZONE_COLORS,
        DEFAULT_POWER_ZONE_COLORS,
        storeChartSpecific,
        storeGeneric,
        getChartSpecificZoneColor,
        saveChartSpecificZoneColor,
        saveZoneColor,
        resetChartSpecificZoneColors,
        resetZoneColors,
        getChartZoneColors,
        applyZoneColors,
        getZoneTypeFromField,
        clearCachedChartZoneColor,
    };
});

// Use the real formatTime implementation to avoid hoisting/TDZ issues
vi.mock("../../../../utils/charts/core/renderChartJS.js", () => ({ renderChartJS: hoisted.renderChartJS }));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: hoisted.showNotification,
}));
vi.mock("../../../../utils/charts/core/chartStateManager.js", () => ({
    chartStateManager: { debouncedRender: hoisted.debouncedRender },
}));
vi.mock("../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    DEFAULT_HR_ZONE_COLORS: hoisted.DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS: hoisted.DEFAULT_POWER_ZONE_COLORS,
    applyZoneColors: hoisted.applyZoneColors,
    getChartSpecificZoneColor: hoisted.getChartSpecificZoneColor,
    getChartZoneColors: hoisted.getChartZoneColors,
    getZoneTypeFromField: hoisted.getZoneTypeFromField,
    resetChartSpecificZoneColors: hoisted.resetChartSpecificZoneColors,
    resetZoneColors: hoisted.resetZoneColors,
    saveChartSpecificZoneColor: hoisted.saveChartSpecificZoneColor,
    saveZoneColor: hoisted.saveZoneColor,
    clearCachedChartZoneColor: hoisted.clearCachedChartZoneColor,
}));

// Under test
import {
    createInlineZoneColorSelector,
    removeInlineZoneColorSelectors,
    updateInlineZoneColorSelectors,
    clearZoneColorData,
    getCurrentColorScheme,
} from "../../../../utils/ui/controls/createInlineZoneColorSelector.js";

describe("createInlineZoneColorSelector", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        document.body.innerHTML = "";
        window._chartjsInstances = [] as any;
        localStorage.clear();
        // Default zones on window
        (window as any).heartRateZones = [
            { label: "Z1", zone: 1, time: 10 },
            { label: "Z2", zone: 2, time: 20 },
            { label: "Z3", zone: 3, time: 30 },
        ];
        (window as any).powerZones = [
            { label: "P1", zone: 1, time: 5 },
            { label: "P2", zone: 2, time: 15 },
            { label: "P3", zone: 3, time: 25 },
            { label: "P4", zone: 4, time: 35 },
        ];
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = "";
    });

    it("creates HR zone selector and applies initial scheme when none customized", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector("hr_zone", container);
        expect(el).toBeTruthy();
        expect(container.querySelectorAll(".zone-color-item").length).toBe(3);
        // Initial timers apply scheme if not custom
        vi.advanceTimersByTime(20);
        expect(hoisted.getZoneTypeFromField).toHaveBeenCalledWith("hr_zone");
    });

    it("creates Power zone selector and scheme change updates generic colors and triggers rerender", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector("power_zone", container) as any;
        expect(el).toBeTruthy();
        // Change scheme from default custom to vibrant
        const select = container.querySelector("select") as HTMLSelectElement;
        select.value = "vibrant";
        select.dispatchEvent(new Event("change"));
        // saveZoneColor called for each zone
        expect(hoisted.saveZoneColor).toHaveBeenCalled();
        expect(hoisted.debouncedRender).toHaveBeenCalled();
        expect(hoisted.showNotification).toHaveBeenCalled();
    });

    it("changing a color switches scheme to custom and updates storages and preview", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector("hr_zone", container) as any;
        expect(el).toBeTruthy();
        const item = container.querySelector(".zone-color-item") as HTMLElement;
        const input = item.querySelector(".zone-color-input") as HTMLInputElement;
        const preview = item.querySelector(".zone-color-preview") as HTMLElement;
        input.value = "#ff0000";
        input.dispatchEvent(new Event("change"));
        expect(localStorage.getItem("chartjs_hr_zone_color_scheme")).toBe("custom");
        expect(hoisted.saveChartSpecificZoneColor).toHaveBeenCalledWith("hr_zone", 0, "#ff0000");
        expect(hoisted.saveZoneColor).toHaveBeenCalledWith("hr", 0, "#ff0000");
        const bg = getComputedStyle(preview).backgroundColor;
        expect(bg === "#ff0000" || /rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)/i.test(bg)).toBe(true);
    });

    it("reset button clears storages and triggers rerender and update of all selectors", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector("hr_zone", container) as any;
        expect(el).toBeTruthy();
        // Add a second selector to verify updateInlineZoneColorSelectors behavior
        const el2 = createInlineZoneColorSelector("hr_zone", container) as any;
        expect(el2).toBeTruthy();
        // Spy the _updateDisplay on both
        const upd1 = vi.spyOn(el, "_updateDisplay");
        const upd2 = vi.spyOn(el2, "_updateDisplay");

        // Click reset
        const reset = container.querySelector("button") as HTMLButtonElement;
        reset.click();
        expect(hoisted.resetChartSpecificZoneColors).toHaveBeenCalled();
        expect(hoisted.resetZoneColors).toHaveBeenCalled();
        expect(hoisted.debouncedRender).toHaveBeenCalled();
        expect(upd1).toHaveBeenCalled();
        expect(upd2).toHaveBeenCalled();
    });

    it("helpers: remove and update inline selectors, clearZoneColorData and getCurrentColorScheme", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector("hr_zone", container) as any;
        expect(el).toBeTruthy();

        // updateInlineZoneColorSelectors calls _updateDisplay
        const upd = vi.spyOn(el, "_updateDisplay");
        updateInlineZoneColorSelectors(container);
        expect(upd).toHaveBeenCalled();

        // clear
        clearZoneColorData("hr_zone", 3);
        expect(localStorage.getItem("chartjs_hr_zone_color_scheme")).toBeNull();

        // remove
        removeInlineZoneColorSelectors(container);
        expect(container.querySelector(".inline-zone-color-selector")).toBeNull();

        // scheme getter
        expect(getCurrentColorScheme("hr_zone")).toBe("custom");
        localStorage.setItem("chartjs_hr_zone_color_scheme", "classic");
        expect(getCurrentColorScheme("hr_zone")).toBe("classic");
    });
});

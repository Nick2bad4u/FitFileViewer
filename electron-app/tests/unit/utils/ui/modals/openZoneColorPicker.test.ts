import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const debouncedRenderMock = vi.fn();
const applyZoneColorsMock = vi.fn();
const getChartSpecificZoneColorMock = vi.fn();
const removeChartSpecificZoneColorMock = vi.fn();
const removeZoneColorMock = vi.fn();
const saveChartSpecificZoneColorMock = vi.fn();
const setChartColorSchemeMock = vi.fn();
const showNotificationMock = vi.fn();

const chartStateManagerRef: { current: { debouncedRender: typeof debouncedRenderMock } | null } = {
    current: { debouncedRender: debouncedRenderMock },
};

vi.mock("../../../../../utils/charts/core/chartStateManager.js", () => ({
    get chartStateManager() {
        return chartStateManagerRef.current;
    },
}));

vi.mock("../../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    applyZoneColors: applyZoneColorsMock,
    DEFAULT_HR_ZONE_COLORS: ["#ff5500", "#ff8800", "#ffaa00", "#ffcc00", "#ffee00"],
    DEFAULT_POWER_ZONE_COLORS: ["#0044ff", "#3366ff", "#5588ff", "#77aaff", "#99ccff"],
    getChartSpecificZoneColor: getChartSpecificZoneColorMock,
    removeChartSpecificZoneColor: removeChartSpecificZoneColorMock,
    removeZoneColor: removeZoneColorMock,
    saveChartSpecificZoneColor: saveChartSpecificZoneColorMock,
    setChartColorScheme: setChartColorSchemeMock,
}));

vi.mock("../../../../../utils/formatting/formatters/formatTime.js", () => ({
    formatTime: vi.fn(() => "00:30"),
}));

vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: showNotificationMock,
}));

async function loadModule() {
    await vi.resetModules();
    return await import("../../../../../utils/ui/modals/openZoneColorPicker.js");
}

describe("openZoneColorPicker", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        document.head.innerHTML = "";
        localStorage.clear();
        delete (globalThis as any).heartRateZones;
        delete (globalThis as any).powerZones;
        delete (globalThis as any).clearZoneColorData;
        delete (globalThis as any).updateInlineZoneColorSelectors;
        delete (globalThis as any).resetAllSettings;
        delete (globalThis as any).renderChartJS;
        delete (globalThis as any).showNotification;
        delete (globalThis as any)._chartjsInstances;

        chartStateManagerRef.current = { debouncedRender: debouncedRenderMock };

        debouncedRenderMock.mockClear();
        applyZoneColorsMock.mockClear();
        getChartSpecificZoneColorMock.mockReset();
        removeChartSpecificZoneColorMock.mockClear();
        removeZoneColorMock.mockClear();
        saveChartSpecificZoneColorMock.mockClear();
        setChartColorSchemeMock.mockClear();
        showNotificationMock.mockClear();

        applyZoneColorsMock.mockImplementation((zones: Array<Record<string, unknown>>) =>
            zones.map((zone) => ({ ...zone }))
        );
        getChartSpecificZoneColorMock.mockImplementation((_field: string, index: number) => `#aa00${index}${index}`);
    });

    afterEach(() => {
        delete (globalThis as any).heartRateZones;
        delete (globalThis as any).powerZones;
        delete (globalThis as any).clearZoneColorData;
        delete (globalThis as any).updateInlineZoneColorSelectors;
        delete (globalThis as any).resetAllSettings;
        delete (globalThis as any).renderChartJS;
        delete (globalThis as any).showNotification;
        delete (globalThis as any)._chartjsInstances;
    });

    it("handles unknown zone field gracefully", async () => {
        const { openZoneColorPicker } = await loadModule();

        openZoneColorPicker("unknown-field");

        expect(showNotificationMock).toHaveBeenCalledWith("Unknown zone type", "error");
        expect(document.querySelector("#zone-color-picker-overlay")).toBeNull();
        expect(applyZoneColorsMock).not.toHaveBeenCalled();
    });

    it("warns when zone data is unavailable", async () => {
        const { openZoneColorPicker } = await loadModule();
        (globalThis as any).heartRateZones = [];

        openZoneColorPicker("hr_zone");

        expect(showNotificationMock).toHaveBeenCalledWith("No heart rate zone data available", "warning");
        expect(applyZoneColorsMock).not.toHaveBeenCalled();
    });

    it("renders modal, updates colors, and applies changes for heart rate zones", async () => {
        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "chartjs-settings-wrapper";
        const toggle = document.createElement("label");
        toggle.className = "field-toggle";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        toggle.append(checkbox);
        settingsWrapper.append(toggle);
        document.body.append(settingsWrapper);

        (globalThis as any).heartRateZones = [
            { zone: 1, time: 60, label: "Zone 1" },
            { zone: 2, time: 90, label: "Zone 2" },
        ];
        const inlineSelectorsMock = vi.fn();
        const resetAllSettingsMock = vi.fn();
        const globalNotificationMock = vi.fn();
        (globalThis as any).updateInlineZoneColorSelectors = inlineSelectorsMock;
        (globalThis as any).resetAllSettings = resetAllSettingsMock;
        (globalThis as any).showNotification = globalNotificationMock;

        const module = await loadModule();

        module.openZoneColorPicker("hr_zone");

        const overlay = document.querySelector<HTMLDivElement>("#zone-color-picker-overlay");
        expect(overlay).toBeTruthy();
        if (!overlay) {
            throw new Error("Zone color picker overlay not rendered");
        }
        expect(applyZoneColorsMock).toHaveBeenCalledWith(expect.any(Array), "heart rate");

        const colorInput = overlay.querySelector<HTMLInputElement>('input[type="color"]');
        expect(colorInput).toBeTruthy();
        if (!colorInput) {
            throw new Error("Color input not rendered");
        }
        const colorPreview = colorInput.previousElementSibling as HTMLDivElement | null;

        colorInput.value = "#123456";
        colorInput.dispatchEvent(new Event("change", { bubbles: true }));

        expect(setChartColorSchemeMock).toHaveBeenCalledWith("hr_zone", "custom");
        expect(saveChartSpecificZoneColorMock).toHaveBeenCalledWith("hr_zone", 0, "#123456");
        if (colorPreview) {
            expect(colorPreview.style.background.toLowerCase()).toBe("rgb(18, 52, 86)");
        }
        expect(inlineSelectorsMock).toHaveBeenCalled();

        const resetAllButton = overlay.querySelector<HTMLButtonElement>(".reset-all-btn");
        expect(resetAllButton).toBeTruthy();
        resetAllButton?.click();

        expect(setChartColorSchemeMock).toHaveBeenCalledWith("hr_zone", "custom");
        expect(removeChartSpecificZoneColorMock).toHaveBeenCalledWith("hr_zone", 0);
        expect(removeZoneColorMock).toHaveBeenCalledWith("hr", 0);
        expect(checkbox.checked).toBe(true);
        expect(resetAllSettingsMock).toHaveBeenCalled();
        expect(debouncedRenderMock).toHaveBeenCalledWith("Zone colors reset");
        expect(globalNotificationMock).toHaveBeenCalledWith("Zone colors and settings reset to defaults", "success");

        const applyButton = Array.from(overlay.querySelectorAll<HTMLButtonElement>("button")).find(
            (btn) => btn.textContent && btn.textContent.includes("Apply & Close")
        );
        expect(applyButton).toBeTruthy();
        applyButton?.click();

        expect(debouncedRenderMock).toHaveBeenCalledWith("Zone colors applied");
        expect(showNotificationMock).toHaveBeenCalledWith("Heart Rate zone colors updated", "success");
        expect(document.body.contains(overlay)).toBe(false);
    });
});

describe("updateZoneColorPreview", () => {
    beforeEach(() => {
        debouncedRenderMock.mockClear();
    });

    afterEach(() => {
        delete (globalThis as any)._chartjsInstances;
    });

    it("updates matching heart rate chart without animation", async () => {
        const module = await loadModule();
        const updateMock = vi.fn();
        (globalThis as any)._chartjsInstances = [
            {
                data: {
                    datasets: [
                        {
                            label: "Heart Rate Zones",
                            backgroundColor: ["#000000", "#111111"],
                        },
                    ],
                },
                update: updateMock,
            },
        ];

        module.updateZoneColorPreview("hr_zone", 0, "#fedcba");

        const dataset = (globalThis as any)._chartjsInstances[0].data.datasets[0];
        expect(dataset.backgroundColor[0]).toBe("#fedcba");
        expect(updateMock).toHaveBeenCalledWith("none");
    });

    it("ignores non-matching datasets gracefully", async () => {
        const module = await loadModule();
        const updateMock = vi.fn();
        (globalThis as any)._chartjsInstances = [
            {
                data: {
                    datasets: [
                        {
                            label: "Power Data",
                            backgroundColor: ["#000000"],
                        },
                    ],
                },
                update: updateMock,
            },
        ];

        expect(() => module.updateZoneColorPreview("hr_zone", 0, "#abcdef")).not.toThrow();
        expect(updateMock).not.toHaveBeenCalled();
    });
});

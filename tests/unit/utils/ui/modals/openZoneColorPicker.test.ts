import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type ZoneRecord = Record<string, unknown>;
type ChartInstance = {
    data?: {
        datasets?: Array<{
            backgroundColor?: string[];
            label?: string;
        }>;
    };
    update?: (mode?: string) => void;
};

const debouncedRenderMock = vi.fn<(reason: string) => void>();
const applyZoneColorsMock =
    vi.fn<(zones: ZoneRecord[], zoneType: string) => ZoneRecord[]>();
const getChartSpecificZoneColorMock =
    vi.fn<(field: string, index: number) => string>();
const removeChartSpecificZoneColorMock =
    vi.fn<(field: string, index: number) => void>();
const removeZoneColorMock = vi.fn<(zoneType: string, index: number) => void>();
const saveChartSpecificZoneColorMock =
    vi.fn<(field: string, index: number, color: string) => void>();
const setChartColorSchemeMock =
    vi.fn<(field: string, scheme: string) => void>();
const showNotificationMock =
    vi.fn<(message: string, level: "error" | "success" | "warning") => void>();

const chartStateManagerRef: {
    current: { debouncedRender: typeof debouncedRenderMock } | null;
} = {
    current: { debouncedRender: debouncedRenderMock },
};

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManager.js"),
    () => ({
        get chartStateManager() {
            return chartStateManagerRef.current;
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        applyZoneColors: applyZoneColorsMock,
        DEFAULT_HR_ZONE_COLORS: [
            "#ff5500",
            "#ff8800",
            "#ffaa00",
            "#ffcc00",
            "#ffee00",
        ],
        DEFAULT_POWER_ZONE_COLORS: [
            "#0044ff",
            "#3366ff",
            "#5588ff",
            "#77aaff",
            "#99ccff",
        ],
        getChartSpecificZoneColor: getChartSpecificZoneColorMock,
        removeChartSpecificZoneColor: removeChartSpecificZoneColorMock,
        removeZoneColor: removeZoneColorMock,
        saveChartSpecificZoneColor: saveChartSpecificZoneColorMock,
        setChartColorScheme: setChartColorSchemeMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatTime.js"),
    () => ({
        formatTime: vi.fn<(value: unknown) => string>(() => "00:30"),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: showNotificationMock,
    })
);

async function loadModule() {
    await vi.resetModules();
    return await import("../../../../../electron-app/utils/ui/modals/openZoneColorPicker.js");
}

function requireElement<T extends Element>(element: T | null, message: string) {
    if (!element) {
        throw new Error(message);
    }

    return element;
}

function requireValue<T>(value: T | null | undefined, message: string) {
    if (value === null || value === undefined) {
        throw new Error(message);
    }

    return value;
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

        applyZoneColorsMock.mockImplementation(
            (zones: Array<Record<string, unknown>>) =>
                zones.map((zone) => ({ ...zone }))
        );
        getChartSpecificZoneColorMock.mockImplementation(
            (_field: string, index: number) => `#aa00${index}${index}`
        );
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
        expect.assertions(3);

        const { openZoneColorPicker } = await loadModule();

        openZoneColorPicker("unknown-field");

        expect(showNotificationMock).toHaveBeenCalledWith(
            "Unknown zone type",
            "error"
        );
        expect(document.querySelector("#zone-color-picker-overlay")).toBeNull();
        expect(applyZoneColorsMock).not.toHaveBeenCalled();
    });

    it("warns when zone data is unavailable", async () => {
        expect.assertions(3);

        const { openZoneColorPicker } = await loadModule();
        (globalThis as any).heartRateZones = [];

        openZoneColorPicker("hr_zone");

        expect(showNotificationMock).toHaveBeenCalledWith(
            "No heart rate zone data available",
            "warning"
        );
        expect(document.querySelector("#zone-color-picker-overlay")).toBeNull();
        expect(applyZoneColorsMock).not.toHaveBeenCalled();
    });

    it("renders modal, updates colors, and applies changes for heart rate zones", async () => {
        expect.assertions(20);

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
        const inlineSelectorsMock = vi.fn<(root: HTMLElement) => void>();
        const resetAllSettingsMock = vi.fn<() => void>();
        const globalNotificationMock =
            vi.fn<(message: string, level: string) => void>();
        (globalThis as any).updateInlineZoneColorSelectors =
            inlineSelectorsMock;
        (globalThis as any).resetAllSettings = resetAllSettingsMock;
        (globalThis as any).showNotification = globalNotificationMock;

        const module = await loadModule();

        module.openZoneColorPicker("hr_zone");

        const overlay = document.querySelector<HTMLDivElement>(
            "#zone-color-picker-overlay"
        );
        expect(overlay).toBeInstanceOf(HTMLDivElement);
        const renderedOverlay = requireElement(
            overlay,
            "Zone color picker overlay not rendered"
        );
        expect(applyZoneColorsMock).toHaveBeenCalledWith(
            expect.any(Array),
            "heart rate"
        );

        const colorInput = renderedOverlay.querySelector<HTMLInputElement>(
            'input[type="color"]'
        );
        expect(colorInput).toBeInstanceOf(HTMLInputElement);
        const renderedColorInput = requireElement(
            colorInput,
            "Color input not rendered"
        );
        const colorPreview =
            renderedColorInput.previousElementSibling as HTMLDivElement | null;
        expect(colorPreview).toBeInstanceOf(HTMLDivElement);
        const renderedColorPreview = requireElement(
            colorPreview,
            "Color preview not rendered"
        );

        renderedColorInput.value = "#123456";
        renderedColorInput.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect(setChartColorSchemeMock).toHaveBeenCalledWith(
            "hr_zone",
            "custom"
        );
        expect(saveChartSpecificZoneColorMock).toHaveBeenCalledWith(
            "hr_zone",
            0,
            "#123456"
        );
        expect(renderedColorPreview.style.background.toLowerCase()).toBe(
            "rgb(18, 52, 86)"
        );
        expect(inlineSelectorsMock).toHaveBeenCalledWith(document.body);

        const resetAllButton =
            renderedOverlay.querySelector<HTMLButtonElement>(".reset-all-btn");
        expect(resetAllButton).toBeInstanceOf(HTMLButtonElement);
        const renderedResetAllButton = requireElement(
            resetAllButton,
            "Reset all button not rendered"
        );
        const schemeCallCountBeforeReset =
            setChartColorSchemeMock.mock.calls.length;
        renderedResetAllButton.click();

        const resetSchemeCalls = setChartColorSchemeMock.mock.calls.slice(
            schemeCallCountBeforeReset
        );
        expect(resetSchemeCalls).toStrictEqual([
            ["hr_zone", "custom"],
            ["power_zone", "custom"],
            ["hr_lap_zone", "custom"],
            ["power_lap_zone", "custom"],
            ["hr_zone_doughnut", "custom"],
            ["power_zone_doughnut", "custom"],
            ["hr_lap_zone_stacked", "custom"],
            ["hr_lap_zone_individual", "custom"],
            ["power_lap_zone_stacked", "custom"],
            ["power_lap_zone_individual", "custom"],
            ["hr_zone", "custom"],
        ]);
        expect(removeChartSpecificZoneColorMock).toHaveBeenCalledWith(
            "hr_zone",
            0
        );
        expect(removeZoneColorMock).toHaveBeenCalledWith("hr", 0);
        expect(checkbox).toHaveProperty("checked", true);
        expect(resetAllSettingsMock).toHaveBeenCalledWith();
        expect(debouncedRenderMock).toHaveBeenCalledWith("Zone colors reset");
        expect(globalNotificationMock).toHaveBeenCalledWith(
            "Zone colors and settings reset to defaults",
            "success"
        );

        const applyButton = Array.from(
            renderedOverlay.querySelectorAll<HTMLButtonElement>("button")
        ).find(
            (btn) =>
                btn.textContent && btn.textContent.includes("Apply & Close")
        );
        expect(applyButton).toBeInstanceOf(HTMLButtonElement);
        const renderedApplyButton = requireElement(
            applyButton ?? null,
            "Apply button not rendered"
        );
        renderedApplyButton.click();

        expect(debouncedRenderMock).toHaveBeenCalledWith("Zone colors applied");
        expect(showNotificationMock).toHaveBeenCalledWith(
            "Heart Rate zone colors updated",
            "success"
        );
        expect(renderedOverlay).toHaveProperty("isConnected", false);
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
        expect.assertions(2);

        const module = await loadModule();
        const updateMock = vi.fn<(mode?: string) => void>();
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

        const dataset = requireValue(
            ((globalThis as any)._chartjsInstances as ChartInstance[])[0].data
                ?.datasets?.[0],
            "Heart rate chart dataset not found"
        );
        expect(dataset.backgroundColor[0]).toBe("#fedcba");
        expect(updateMock).toHaveBeenCalledWith("none");
    });

    it("ignores non-matching datasets gracefully", async () => {
        expect.assertions(2);

        const module = await loadModule();
        const updateMock = vi.fn<(mode?: string) => void>();
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

        expect(() =>
            module.updateZoneColorPreview("hr_zone", 0, "#abcdef")
        ).not.toThrow();
        expect(updateMock).not.toHaveBeenCalled();
    });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type ZoneRecord = Record<string, unknown>;
type ChartInstanceRegistryModule =
    typeof import("../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js");
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
const clearZoneColorDataMock =
    vi.fn<(field: string, zoneCount: number) => void>();
const updateInlineZoneColorSelectorsMock =
    vi.fn<(container: HTMLElement) => void>();
const resetAllSettingsMock = vi.fn<() => boolean>();

const chartStateManagerRef: {
    current: { debouncedRender: typeof debouncedRenderMock } | null;
} = {
    current: { debouncedRender: debouncedRenderMock },
};
const getRegisteredChartStateManagerMock = vi.fn(
    () => chartStateManagerRef.current
);
let chartInstanceRegistryModule: ChartInstanceRegistryModule | undefined;

function clearChartInstanceRegistryForTests(): void {
    chartInstanceRegistryModule?.clearChartInstanceRegistryForTests();
}

function getRegisteredChartInstances(): unknown[] {
    return chartInstanceRegistryModule?.getRegisteredChartInstances() ?? [];
}

function setRegisteredChartInstances(charts: readonly unknown[]): unknown[] {
    return (
        chartInstanceRegistryModule?.setRegisteredChartInstances(charts) ?? []
    );
}

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: getRegisteredChartStateManagerMock,
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
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createInlineZoneColorSelector.js"),
    () => ({
        clearZoneColorData: clearZoneColorDataMock,
        updateInlineZoneColorSelectors: updateInlineZoneColorSelectorsMock,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/app/initialization/getCurrentSettings.js"),
    () => ({
        resetAllSettings: resetAllSettingsMock,
    })
);

async function loadModule() {
    await vi.resetModules();
    chartInstanceRegistryModule =
        await import("../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js");
    const zoneDataStateModule =
        await import("../../../../../electron-app/utils/data/zones/zoneDataState.js");
    const zoneColorPickerModule =
        await import("../../../../../electron-app/utils/ui/modals/openZoneColorPicker.js");
    return {
        ...zoneDataStateModule,
        ...zoneColorPickerModule,
    };
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

function normalizeText(value: null | string | undefined): string {
    return value?.replace(/\s+/gu, " ").trim() ?? "";
}

function getZoneColorPickerState(overlay: HTMLElement) {
    const modal = overlay.querySelector(".zone-color-picker-modal");
    const title = requireElement(
        overlay.querySelector("#zone-color-picker-title"),
        "Zone color picker title not rendered"
    );

    return {
        actionButtons: Array.from(
            overlay.querySelectorAll<HTMLButtonElement>(
                ".zone-color-actions button"
            ),
            (button) => ({
                className: button.className,
                text: button.textContent,
                type: button.type,
            })
        ),
        colorInputLabels: Array.from(
            overlay.querySelectorAll<HTMLInputElement>(".zone-color-input"),
            (input) => input.getAttribute("aria-label")
        ),
        colorInputValues: Array.from(
            overlay.querySelectorAll<HTMLInputElement>(".zone-color-input"),
            (input) => input.value
        ),
        colorPreviewCount: overlay.querySelectorAll(".zone-color-preview")
            .length,
        colorPreviewControls: Array.from(
            overlay.querySelectorAll<HTMLElement>(".zone-color-preview"),
            (preview) => ({
                ariaLabel: preview.getAttribute("aria-label"),
                role: preview.getAttribute("role"),
                tabIndex: preview.tabIndex,
            })
        ),
        modalAriaLabelledBy: modal?.getAttribute("aria-labelledby"),
        modalClassName: modal?.className,
        modalRole: modal?.getAttribute("role"),
        overlayClassName: overlay.className,
        title: normalizeText(title.textContent),
        zoneLabels: Array.from(
            overlay.querySelectorAll(".zone-color-label"),
            (label) => normalizeText(label.textContent)
        ),
        zoneTimes: Array.from(
            overlay.querySelectorAll(".zone-color-time"),
            (time) => normalizeText(time.textContent)
        ),
    };
}

describe("openZoneColorPicker", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        document.head.replaceChildren();
        localStorage.clear();
        clearChartInstanceRegistryForTests();

        chartStateManagerRef.current = { debouncedRender: debouncedRenderMock };
        getRegisteredChartStateManagerMock.mockClear();

        debouncedRenderMock.mockClear();
        applyZoneColorsMock.mockClear();
        getChartSpecificZoneColorMock.mockReset();
        removeChartSpecificZoneColorMock.mockClear();
        removeZoneColorMock.mockClear();
        saveChartSpecificZoneColorMock.mockClear();
        setChartColorSchemeMock.mockClear();
        showNotificationMock.mockClear();
        clearZoneColorDataMock.mockClear();
        updateInlineZoneColorSelectorsMock.mockClear();
        resetAllSettingsMock.mockReset();
        resetAllSettingsMock.mockReturnValue(true);

        applyZoneColorsMock.mockImplementation(
            (zones: Array<Record<string, unknown>>) =>
                zones.map((zone) => ({ ...zone }))
        );
        getChartSpecificZoneColorMock.mockImplementation(
            (_field: string, index: number) => `#aa00${index}${index}`
        );
    });

    afterEach(() => {
        clearChartInstanceRegistryForTests();
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

        const { clearZoneDataState, openZoneColorPicker } = await loadModule();
        clearZoneDataState();

        openZoneColorPicker("hr_zone");

        expect(showNotificationMock).toHaveBeenCalledWith(
            "No heart rate zone data available",
            "warning"
        );
        expect(document.querySelector("#zone-color-picker-overlay")).toBeNull();
        expect(applyZoneColorsMock).not.toHaveBeenCalled();
    });

    it("renders modal, updates colors, and applies changes for heart rate zones", async () => {
        expect.assertions(22);

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

        const { openZoneColorPicker, setZoneDataByType } = await loadModule();
        setZoneDataByType("hr", [
            { zone: 1, time: 60, label: "Zone 1" },
            { zone: 2, time: 90, label: "Zone 2" },
        ]);

        openZoneColorPicker("hr_zone");

        const overlay = document.querySelector<HTMLDivElement>(
            "#zone-color-picker-overlay"
        );
        const renderedOverlay = requireElement(
            overlay,
            "Zone color picker overlay not rendered"
        );
        expect(getZoneColorPickerState(renderedOverlay)).toStrictEqual({
            actionButtons: [
                {
                    className: "reset-all-btn",
                    text: "Reset All",
                    type: "button",
                },
                {
                    className: "zone-color-apply-btn",
                    text: "Apply & Close",
                    type: "button",
                },
            ],
            colorInputLabels: ["Zone 1 color", "Zone 2 color"],
            colorInputValues: ["#aa0000", "#aa0011"],
            colorPreviewCount: 2,
            colorPreviewControls: [
                {
                    ariaLabel: "Choose Zone 1 color",
                    role: "button",
                    tabIndex: 0,
                },
                {
                    ariaLabel: "Choose Zone 2 color",
                    role: "button",
                    tabIndex: 0,
                },
            ],
            modalAriaLabelledBy: "zone-color-picker-title",
            modalClassName: "zone-color-picker-modal",
            modalRole: "dialog",
            overlayClassName: "zone-color-picker-overlay",
            title: "Heart Rate Zone Colors - Zone Charts",
            zoneLabels: ["Zone 1", "Zone 2"],
            zoneTimes: ["Time: 00:30", "Time: 00:30"],
        });
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
        expect(
            [
                "clearZoneColorData",
                "renderChartJS",
                "updateInlineZoneColorSelectors",
            ].filter((globalName) => Reflect.has(globalThis, globalName))
        ).toStrictEqual([]);
        expect(updateInlineZoneColorSelectorsMock).toHaveBeenCalledWith(
            document.body
        );

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
        expect(clearZoneColorDataMock).toHaveBeenCalledWith("hr_zone", 2);
        expect(removeChartSpecificZoneColorMock).not.toHaveBeenCalledWith(
            "hr_zone",
            0
        );
        expect(removeZoneColorMock).not.toHaveBeenCalledWith("hr", 0);
        expect(checkbox).toHaveProperty("checked", true);
        expect(resetAllSettingsMock).toHaveBeenCalledWith();
        expect(debouncedRenderMock).toHaveBeenCalledWith("Zone colors reset");
        expect(showNotificationMock).toHaveBeenCalledWith(
            "Zone colors and settings reset to defaults",
            "success"
        );

        const applyButton = renderedOverlay.querySelector<HTMLButtonElement>(
            ".zone-color-apply-btn"
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

    it("traps focus and restores focus when closed", async () => {
        expect.assertions(5);

        const opener = document.createElement("button");
        opener.type = "button";
        opener.textContent = "Open picker";
        document.body.append(opener);
        opener.focus();

        const { openZoneColorPicker, setZoneDataByType } = await loadModule();
        setZoneDataByType("hr", [
            { zone: 1, time: 60, label: "Zone 1" },
            { zone: 2, time: 90, label: "Zone 2" },
        ]);

        openZoneColorPicker("hr_zone");

        const overlay = requireElement(
            document.querySelector<HTMLDivElement>(
                "#zone-color-picker-overlay"
            ),
            "Zone color picker overlay not rendered"
        );
        const closeButton = requireElement(
            overlay.querySelector<HTMLButtonElement>(
                'button[aria-label="Close zone color picker"]'
            ),
            "Close button not rendered"
        );
        const applyButton = requireElement(
            overlay.querySelector<HTMLButtonElement>(".zone-color-apply-btn"),
            "Apply button not rendered"
        );

        expect(document.activeElement).toBe(closeButton);

        applyButton.focus();
        const tabEvent = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Tab",
        });
        document.dispatchEvent(tabEvent);

        expect(tabEvent.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(closeButton);

        document.dispatchEvent(
            new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
        );

        expect(overlay).toHaveProperty("isConnected", false);
        expect(document.activeElement).toBe(opener);
    });
});

describe("updateZoneColorPreview", () => {
    beforeEach(() => {
        debouncedRenderMock.mockClear();
    });

    afterEach(() => {
        clearChartInstanceRegistryForTests();
    });

    it("updates matching heart rate chart without animation", async () => {
        expect.assertions(2);

        const module = await loadModule();
        const updateMock = vi.fn<(mode?: string) => void>();
        setRegisteredChartInstances([
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
        ]);

        module.updateZoneColorPreview("hr_zone", 0, "#fedcba");

        const [registeredChart] =
            getRegisteredChartInstances() as ChartInstance[];
        const dataset = requireValue(
            registeredChart?.data?.datasets?.[0],
            "Heart rate chart dataset not found"
        );
        expect(dataset.backgroundColor[0]).toBe("#fedcba");
        expect(updateMock).toHaveBeenCalledWith("none");
    });

    it("ignores non-matching datasets gracefully", async () => {
        expect.assertions(2);

        const module = await loadModule();
        const updateMock = vi.fn<(mode?: string) => void>();
        setRegisteredChartInstances([
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
        ]);

        expect(() =>
            module.updateZoneColorPreview("hr_zone", 0, "#abcdef")
        ).not.toThrow();
        expect(updateMock).not.toHaveBeenCalled();
    });

    it("ignores array-shaped chart candidates", async () => {
        expect.assertions(2);

        const module = await loadModule();
        const updateMock = vi.fn<(mode?: string) => void>();
        const arrayChart = [] as unknown[] & ChartInstance;
        arrayChart.data = {
            datasets: [
                {
                    label: "Heart Rate Zones",
                    backgroundColor: ["#000000"],
                },
            ],
        };
        arrayChart.update = updateMock;

        setRegisteredChartInstances([arrayChart]);

        module.updateZoneColorPreview("hr_zone", 0, "#abcdef");

        expect(arrayChart.data.datasets[0]?.backgroundColor?.[0]).toBe(
            "#000000"
        );
        expect(updateMock).not.toHaveBeenCalled();
    });
});

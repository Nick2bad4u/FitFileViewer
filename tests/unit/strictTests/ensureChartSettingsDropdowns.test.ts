import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clearChartInstanceRegistryForTests,
    setRegisteredChartInstances,
} from "../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

// Use jsdom timers to control debounce/timeouts
vi.useFakeTimers();

interface ChartInstanceMock {
    readonly config: { readonly type: string };
    readonly data: {
        readonly datasets: readonly {
            readonly data: readonly number[];
            readonly label: string;
        }[];
    };
}

type MockVoidFn = (...args: unknown[]) => void;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

// Hoisted container for spies and state to satisfy Vitest mock hoisting
const h = vi.hoisted(() => {
    const chartSettings: Record<string, unknown> = {};
    const fieldVisibility: Record<string, string> = {};
    const getChartSetting = vi.fn<(key: string) => unknown>(
        (key) => chartSettings[key]
    );
    const setChartSetting = vi.fn<(key: string, value: unknown) => boolean>(
        (key, value) => {
            chartSettings[key] = value;
            return true;
        }
    );
    const getChartFieldVisibility = vi.fn<
        (field: string, fallback?: string) => string
    >(
        (field: string, fallback = "visible") =>
            fieldVisibility[field] ?? fallback
    );
    const setChartFieldVisibility = vi.fn<
        (field: string, visibility: string) => Record<string, string>
    >((field: string, visibility: string) => {
        fieldVisibility[field] = visibility;
        return { [field]: visibility };
    });

    return {
        state: {} as Record<string, unknown>,
        chartSettings,
        fieldVisibility,
        getChartSetting,
        setChartSetting,
        getChartFieldVisibility,
        setChartFieldVisibility,
        spies: {
            applySettingsPanelStyles: vi.fn<MockVoidFn>(),
            createPowerZoneControls: vi.fn<MockVoidFn>(),
            movePowerZoneControlsToSection: vi.fn<MockVoidFn>(),
            createHRZoneControls: vi.fn<MockVoidFn>(),
            moveHRZoneControlsToSection: vi.fn<MockVoidFn>(),
            setupChartStatusUpdates: vi.fn<MockVoidFn>(),
            updateControlsState: vi.fn<MockVoidFn>(),
            reRenderChartsAfterSettingChange: vi.fn<MockVoidFn>(),
            resetAllSettings: vi.fn<() => boolean>().mockReturnValue(true),
            showNotification: vi.fn<MockVoidFn>(),
            renderChartJS: vi.fn<MockVoidFn>(),
            debouncedRender: vi.fn<MockVoidFn>(),
            updateAllChartStatusIndicators: vi.fn<MockVoidFn>(),
        },
    };
});

const state = h.state;
const chartSettings = h.chartSettings;
const fieldVisibility = h.fieldVisibility;
const spies = h.spies as typeof h.spies;

// Mocks for modules used by ensure/create* modules. Must be declared before imports.
vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: (key: string) => state[key],
        setState: (key: string, value: unknown) => {
            state[key] = value;
        },
        subscribe: () => () => {},
        updateState: (ns: string, patch: Record<string, unknown>) => {
            state[ns] = {
                ...(isObjectRecord(state[ns]) ? state[ns] : {}),
                ...patch,
            };
        },
    })
);

vi.mock(
    import("../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: h.getChartSetting,
        setChartSetting: h.setChartSetting,
        getChartFieldVisibility: h.getChartFieldVisibility,
        setChartFieldVisibility: h.setChartFieldVisibility,
    })
);

vi.mock(
    import("../../../electron-app/utils/rendering/helpers/updateControlsState.js"),
    () => ({
        updateControlsState: h.spies.updateControlsState,
    })
);

// Use the real createSettingsHeader module to ensure internal imports (like exportUtils) use our mocks above.

vi.mock(
    import("../../../electron-app/utils/charts/components/chartStatusIndicator.js"),
    () => ({
        createChartStatusIndicator: () => {
            const el = document.createElement("div");
            el.className = "chart-status-indicator-mock";
            return el;
        },
        updateAllChartStatusIndicators: h.spies.updateAllChartStatusIndicators,
        setupChartStatusUpdates: h.spies.setupChartStatusUpdates,
    })
);

// Mock power and HR zone control modules used during initialization
vi.mock(
    import("../../../electron-app/utils/ui/controls/createPowerZoneControls.js"),
    () => ({
        createPowerZoneControls: h.spies.createPowerZoneControls,
        movePowerZoneControlsToSection: h.spies.movePowerZoneControlsToSection,
    })
);

vi.mock(
    import("../../../electron-app/utils/ui/controls/createHRZoneControls.js"),
    () => ({
        createHRZoneControls: h.spies.createHRZoneControls,
        moveHRZoneControlsToSection: h.spies.moveHRZoneControlsToSection,
    })
);

vi.mock(
    import("../../../electron-app/utils/app/initialization/getCurrentSettings.js"),
    () => ({
        getCurrentSettings: () => ({ from: "getCurrentSettings" }),
        getDefaultSettings: () => ({ defaultSettings: true }),
        reRenderChartsAfterSettingChange:
            h.spies.reRenderChartsAfterSettingChange,
        resetAllSettings: h.spies.resetAllSettings,
    })
);

vi.mock(
    import("../../../electron-app/utils/charts/plugins/chartOptionsConfig.js"),
    () => ({
        chartOptionsConfig: [
            {
                id: "alpha",
                label: "Alpha",
                type: "range",
                min: 0,
                max: 100,
                step: 5,
                default: 10,
            },
            {
                id: "smoothing",
                label: "Smoothing",
                type: "toggle",
                default: true,
            },
            {
                id: "maxpoints",
                label: "Max Points",
                type: "select",
                options: [
                    "all",
                    100,
                    500,
                ],
                default: "all",
            },
        ],
    })
);

vi.mock(
    import("../../../electron-app/utils/files/export/exportUtils.js"),
    () => ({
        exportUtils: {
            isValidChart: (chart: unknown) => Boolean(chart),
            downloadChartAsPNG: vi.fn<MockVoidFn>(),
            createCombinedChartsImage: vi.fn<MockVoidFn>(),
            copyChartToClipboard: vi.fn<MockVoidFn>(),
            copyCombinedChartsToClipboard: vi.fn<MockVoidFn>(),
            exportChartDataAsCSV: vi.fn<MockVoidFn>(),
            exportCombinedChartsDataAsCSV: vi.fn<MockVoidFn>(),
            exportChartDataAsJSON: vi.fn<MockVoidFn>(),
            printChart: vi.fn<MockVoidFn>(),
            printCombinedCharts: vi.fn<MockVoidFn>(),
            exportAllAsZip: vi.fn<MockVoidFn>(),
            shareChartsAsURL: vi.fn<MockVoidFn>(),
            isGyazoAuthenticated: () => true,
            showGyazoAccountManager: vi.fn<MockVoidFn>(),
            shareChartsToGyazo: vi.fn<MockVoidFn>(),
        },
    })
);

vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: h.spies.showNotification,
    })
);

vi.mock(import("../../../electron-app/utils/theming/core/theme.js"), () => ({
    getThemeConfig: () => ({ colors: { primaryAlpha: "#123456" } }),
}));

vi.mock(
    import("../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        renderChartJS: h.spies.renderChartJS,
    })
);

vi.mock(
    import("../../../electron-app/utils/data/processing/extractDeveloperFieldsList.js"),
    () => ({
        extractDeveloperFieldsList: () => ["dev_field1"],
    })
);

// Bring in SUT after mocks
import { ensureChartSettingsDropdowns } from "../../../electron-app/utils/ui/components/ensureChartSettingsDropdowns.js";
import { getChartFieldVisibility } from "../../../electron-app/utils/state/domain/settingsStateManager.js";
import { fieldLabels } from "../../../electron-app/utils/formatting/display/formatChartFields.js";
import { exportUtils } from "../../../electron-app/utils/files/export/exportUtils.js";
import {
    registerChartStateManager,
    resetChartStateManagerRegistryForTests,
} from "../../../electron-app/utils/charts/core/chartStateManagerRegistry.js";

function setupDOM(withContainer = false) {
    document.body.replaceChildren();
    if (withContainer) {
        const c = document.createElement("div");
        c.id = "chartjs-chart-container";
        document.body.appendChild(c);
    }
}

function getRequiredElementById<TElement extends HTMLElement>(
    id: string,
    constructor: new (...args: any[]) => TElement
): TElement {
    const element = document.getElementById(id);

    if (!(element instanceof constructor)) {
        throw new TypeError(`Expected #${id} to exist in the test DOM`);
    }

    return element;
}

function queryRequiredElement<TElement extends Element>(
    container: ParentNode,
    selector: string,
    constructor: new (...args: any[]) => TElement
): TElement {
    const element = container.querySelector(selector);

    if (!(element instanceof constructor)) {
        throw new TypeError(`Expected ${selector} to exist in the test DOM`);
    }

    return element;
}

function seedActiveFitRawData() {
    state["fitFile.rawData"] = {
        recordMesgs: [
            {
                speed: 1.2,
                heartRate: 120,
                altitude: 10,
                power: 150,
                cadence: 90,
                temperature: 22,
                distance: 100,
                enhancedSpeed: 1.3,
                enhancedAltitude: 11,
                resistance: 1,
                flow: 2,
                grit: 3,
                positionLat: 1,
                positionLong: 2,
                dev_field1: 5,
            },
            {
                speed: 2.2,
                heartRate: 130,
                altitude: 12,
                power: 170,
                cadence: 88,
                temperature: 24,
                distance: 150,
                enhancedSpeed: 1.8,
                enhancedAltitude: 12,
                resistance: 2,
                flow: 3,
                grit: 4,
                positionLat: 1.1,
                positionLong: 2.2,
                dev_field1: 7,
            },
        ],
        timeInZoneMesgs: [
            {
                referenceMesg: "lap",
                timeInHrZone: [
                    1,
                    2,
                    3,
                ],
            },
            {
                referenceMesg: "lap",
                timeInPowerZone: [
                    1,
                    2,
                    3,
                ],
            },
        ],
        eventMesgs: [{ type: "pause" }],
    };
}

function seedCharts(count = 2): ChartInstanceMock[] {
    const chartInstances = Array.from({ length: count }, (_, i) => ({
        data: {
            datasets: [
                {
                    label: `Field ${i + 1}`,
                    data: [
                        1,
                        2,
                        3,
                    ],
                },
            ],
        },
        config: { type: "line" },
    }));
    setRegisteredChartInstances(chartInstances);

    return chartInstances;
}

beforeEach(() => {
    // reset state and spies
    for (const k of Object.keys(state)) delete state[k];
    for (const k of Object.keys(chartSettings)) delete chartSettings[k];
    for (const k of Object.keys(fieldVisibility)) delete fieldVisibility[k];
    h.getChartSetting.mockClear();
    h.setChartSetting.mockClear();
    h.getChartFieldVisibility.mockClear();
    h.setChartFieldVisibility.mockClear();
    Object.values(spies).forEach((fn) => {
        fn.mockClear();
    });
    if (typeof localStorage !== "undefined") {
        localStorage.clear();
    }
    clearChartInstanceRegistryForTests();
    resetChartStateManagerRegistryForTests();
    registerChartStateManager({ debouncedRender: spies.debouncedRender });
});

afterEach(() => {
    clearChartInstanceRegistryForTests();
    resetChartStateManagerRegistryForTests();
    document.body.replaceChildren();
});

describe("ensureChartSettingsDropdowns integration", () => {
    it("returns default settings when container missing", () => {
        expect.assertions(1);

        setupDOM(false);
        const result = ensureChartSettingsDropdowns("chartjs-chart-container");
        expect(result).toStrictEqual({ defaultSettings: true });
    });

    it("creates panel, toggle button, and sections; moves zone controls after timeout", async () => {
        expect.assertions(14);

        setupDOM(true);
        seedActiveFitRawData();

        const result = ensureChartSettingsDropdowns("chartjs-chart-container");
        expect(result).toStrictEqual({ from: "getCurrentSettings" });

        // Toggle button exists and points to wrapper
        const toggleBtn = getRequiredElementById(
            "chart-controls-toggle",
            HTMLButtonElement
        );
        expect(toggleBtn).toBeInstanceOf(HTMLButtonElement);
        expect(toggleBtn.getAttribute("aria-controls")).toBe(
            "chartjs-settings-wrapper"
        );

        // Wrapper and sections exist
        const wrapper = getRequiredElementById(
            "chartjs-settings-wrapper",
            HTMLDivElement
        );
        expect(wrapper).toBeInstanceOf(HTMLDivElement);
        expect(
            queryRequiredElement(wrapper, ".settings-header", HTMLElement)
        ).toBeInstanceOf(HTMLElement);
        expect(
            queryRequiredElement(wrapper, ".controls-section", HTMLElement)
        ).toBeInstanceOf(HTMLElement);
        expect(
            queryRequiredElement(wrapper, ".export-section", HTMLElement)
        ).toBeInstanceOf(HTMLElement);
        expect(
            queryRequiredElement(wrapper, ".fields-section", HTMLElement)
        ).toBeInstanceOf(HTMLElement);

        // Setup hooks called
        expect(spies.createPowerZoneControls).toHaveBeenCalledWith(wrapper);
        expect(spies.createHRZoneControls).toHaveBeenCalledWith(wrapper);
        expect(spies.setupChartStatusUpdates).toHaveBeenCalledWith();

        // move zone controls after timers
        vi.advanceTimersByTime(120);
        expect(spies.movePowerZoneControlsToSection).toHaveBeenCalledWith();
        expect(spies.moveHRZoneControlsToSection).toHaveBeenCalledWith();

        // state sync called
        expect(spies.updateControlsState).toHaveBeenCalledWith();
    });

    it("range/toggle/select controls update settings and trigger re-render (debounced)", () => {
        expect.assertions(10);

        setupDOM(true);
        seedActiveFitRawData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;

        // Range slider
        const alphaSlider = wrapper.querySelector(
            "#chartjs-alpha-slider"
        ) as HTMLInputElement;
        expect(alphaSlider).toBeInstanceOf(HTMLInputElement);
        alphaSlider.value = "25";
        alphaSlider.dispatchEvent(new Event("input", { bubbles: true }));
        expect(chartSettings).toStrictEqual({ alpha: 25 });
        // Debounce 300ms
        expect(spies.reRenderChartsAfterSettingChange).not.toHaveBeenCalledWith(
            "alpha",
            "25"
        );
        vi.advanceTimersByTime(300);
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith(
            "alpha",
            "25"
        );

        // Toggle control
        const toggleSwitch = wrapper.querySelector(
            ".toggle-switch"
        ) as HTMLElement;
        expect(toggleSwitch).toBeInstanceOf(HTMLElement);
        toggleSwitch.click();
        expect(chartSettings).toStrictEqual({
            alpha: 25,
            smoothing: false,
        });
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith(
            "smoothing",
            false
        );

        // Select control
        const maxpoints = wrapper.querySelector(
            "#chartjs-maxpoints-dropdown"
        ) as HTMLSelectElement;
        expect(maxpoints).toBeInstanceOf(HTMLSelectElement);
        maxpoints.value = "100";
        maxpoints.dispatchEvent(new Event("change", { bubbles: true }));
        expect(chartSettings).toStrictEqual({
            alpha: 25,
            maxpoints: 100,
            smoothing: false,
        });
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith(
            "maxpoints",
            100
        );
    });

    it("field toggle hides/shows and triggers state render and status updates; color picker updates", () => {
        expect.assertions(9);

        setupDOM(true);
        seedActiveFitRawData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;

        // Regular field has color picker
        const speedCheckbox = wrapper.querySelector(
            "#field-toggle-speed"
        ) as HTMLInputElement;
        expect(speedCheckbox).toBeInstanceOf(HTMLInputElement);
        const speedColor = queryRequiredElement(
            speedCheckbox.parentElement ?? document.createDocumentFragment(),
            'input[type="color"]',
            HTMLInputElement
        );
        expect(speedColor).toBeInstanceOf(HTMLInputElement);

        // Toggle off
        speedCheckbox.checked = false;
        speedCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
        expect(getChartFieldVisibility("speed")).toBe("hidden");
        expect(spies.debouncedRender).toHaveBeenCalledWith(
            "Field toggle: speed"
        );
        vi.advanceTimersByTime(100);
        expect(spies.updateAllChartStatusIndicators).toHaveBeenCalledWith();

        // Change color
        speedColor.value = "#abcdef";
        speedColor.dispatchEvent(new Event("change", { bubbles: true }));
        expect(chartSettings.color_speed).toBe("#abcdef");
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith(
            "speed_color",
            "#abcdef"
        );

        // Zone chart has no color picker
        const hrZone = wrapper.querySelector(
            "#field-toggle-hr_zone_doughnut"
        ) as HTMLInputElement;
        expect(hrZone).toBeInstanceOf(HTMLInputElement);
        const hasPicker = hrZone.parentElement?.querySelector(
            'input[type="color"]'
        );
        expect(hasPicker).toBeNull();
    });

    it("toggle all buttons update all fields and notify", () => {
        expect.assertions(10);

        setupDOM(true);
        seedActiveFitRawData();

        const dispatchSpy = vi.spyOn(window, "dispatchEvent");
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;
        const enableAll = Array.from(wrapper.querySelectorAll("button")).find(
            (b) => b.textContent?.trim() === "Enable All"
        ) as HTMLButtonElement;
        const disableAll = Array.from(wrapper.querySelectorAll("button")).find(
            (b) => b.textContent?.trim() === "Disable All"
        ) as HTMLButtonElement;

        expect(enableAll).toBeInstanceOf(HTMLButtonElement);
        expect(disableAll).toBeInstanceOf(HTMLButtonElement);

        enableAll.click();
        expect(spies.showNotification).toHaveBeenCalledWith(
            "All charts enabled",
            "success"
        );
        // spot check a couple of keys
        expect(getChartFieldVisibility("speed")).toBe("visible");
        expect(getChartFieldVisibility("heartRate")).toBe("visible");
        expect(spies.debouncedRender).toHaveBeenCalledWith(
            "All fields enabled"
        );

        disableAll.click();
        expect(spies.showNotification).toHaveBeenCalledWith(
            "All charts disabled",
            "success"
        );
        expect(getChartFieldVisibility("speed")).toBe("hidden");
        expect(getChartFieldVisibility("heartRate")).toBe("hidden");

        const fieldToggleEvents = dispatchSpy.mock.calls
            .map(([event]) => event)
            .filter(
                (
                    event
                ): event is CustomEvent<{
                    fields: string[];
                    visibility: string;
                }> =>
                    event instanceof CustomEvent &&
                    event.type === "fieldToggleChanged"
            )
            .map((event) => ({
                hasDeveloperField: event.detail.fields.includes("dev_field1"),
                hasHeartRate: event.detail.fields.includes("heartRate"),
                hasSpeed: event.detail.fields.includes("speed"),
                visibility: event.detail.visibility,
            }));
        expect(fieldToggleEvents).toStrictEqual([
            {
                hasDeveloperField: true,
                hasHeartRate: true,
                hasSpeed: true,
                visibility: "visible",
            },
            {
                hasDeveloperField: true,
                hasHeartRate: true,
                hasSpeed: true,
                visibility: "hidden",
            },
        ]);
    });

    it("export section: no charts warns; with charts opens modal and calls export utils", () => {
        expect.assertions(9);

        setupDOM(true);
        seedActiveFitRawData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;

        // No charts path
        clearChartInstanceRegistryForTests();
        const exportZipBtn = Array.from(
            wrapper.querySelectorAll("button")
        ).find((b) =>
            b.textContent?.trim().endsWith("Export ZIP")
        ) as HTMLButtonElement;
        expect(exportZipBtn).toBeInstanceOf(HTMLButtonElement);
        exportZipBtn.click();
        expect(spies.showNotification).toHaveBeenCalledWith(
            "No charts available to export",
            "warning"
        );
        expect(exportUtils.exportAllAsZip).not.toHaveBeenCalled();

        // Seed charts and click Save PNG and Combined
        const seededCharts = seedCharts(2);

        const savePngBtn = Array.from(wrapper.querySelectorAll("button")).find(
            (b) => b.textContent?.trim().endsWith("Save PNG")
        ) as HTMLButtonElement;
        expect(savePngBtn).toBeInstanceOf(HTMLButtonElement);

        savePngBtn.click();

        // Modal should exist with chart buttons and combined
        const overlay = document.querySelector(
            '[data-ffv-modal="chart-selection"]'
        );
        expect(overlay).toBeInstanceOf(HTMLElement);
        const chartButtons = Array.from(
            overlay!.querySelectorAll("button")
        ).filter((b) => b.textContent?.startsWith("📊"));
        expect(chartButtons.length).toBeGreaterThanOrEqual(2);

        // Click first chart -> downloadChartAsPNG called
        (chartButtons[0] as HTMLButtonElement).click();
        expect(exportUtils.downloadChartAsPNG).toHaveBeenCalledWith(
            seededCharts[0],
            "field-1-chart.png"
        );

        // Reopen and click combined
        savePngBtn.click();
        const combinedBtn = Array.from(
            document.querySelectorAll("button")
        ).find((b) =>
            b.textContent?.startsWith("🔗 All Charts Combined")
        ) as HTMLButtonElement;
        expect(combinedBtn).toBeInstanceOf(HTMLButtonElement);
        combinedBtn.click();
        expect(exportUtils.createCombinedChartsImage).toHaveBeenCalledWith(
            seededCharts,
            "combined-charts.png"
        );
    });

    it("settings header reset button calls reset and re-enables after delay", () => {
        expect.assertions(4);

        setupDOM(true);
        seedActiveFitRawData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const header = document.querySelector(".settings-header")!;
        const resetBtn = Array.from(header.querySelectorAll("button")).find(
            (b) => b.textContent?.trim().endsWith("Reset")
        ) as HTMLButtonElement;
        expect(resetBtn).toBeInstanceOf(HTMLButtonElement);

        resetBtn.click();
        expect(spies.resetAllSettings).toHaveBeenCalledWith();
        expect(resetBtn).toHaveProperty("disabled", true);
        vi.advanceTimersByTime(200);
        expect(resetBtn).toHaveProperty("disabled", false);
    });
});

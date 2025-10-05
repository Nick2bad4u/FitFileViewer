import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use jsdom timers to control debounce/timeouts
vi.useFakeTimers();

// Hoisted container for spies and state to satisfy Vitest mock hoisting
const h = vi.hoisted(() => {
    return {
        state: {} as Record<string, any>,
        spies: {
            applySettingsPanelStyles: vi.fn(),
            createPowerZoneControls: vi.fn(),
            movePowerZoneControlsToSection: vi.fn(),
            createHRZoneControls: vi.fn(),
            moveHRZoneControlsToSection: vi.fn(),
            setupChartStatusUpdates: vi.fn(),
            updateControlsState: vi.fn(),
            reRenderChartsAfterSettingChange: vi.fn(),
            resetAllSettings: vi.fn().mockReturnValue(true),
            showNotification: vi.fn(),
            renderChartJS: vi.fn(),
            debouncedRender: vi.fn(),
            updateAllChartStatusIndicators: vi.fn(),
        },
    };
});

const state = h.state;
const spies = h.spies as typeof h.spies;

// Mocks for modules used by ensure/create* modules. Must be declared before imports.
vi.mock("../../utils/state/core/stateManager.js", () => ({
    getState: (key: string) => state[key],
    setState: (key: string, value: any) => {
        state[key] = value;
    },
    updateState: (ns: string, patch: any) => {
        state[ns] = { ...(state[ns] || {}), ...patch };
    },
}));

vi.mock("../../utils/rendering/helpers/updateControlsState.js", () => ({
    updateControlsState: h.spies.updateControlsState,
}));

// Use the real createSettingsHeader module to ensure internal imports (like exportUtils) use our mocks above.

vi.mock("../../utils/charts/components/chartStatusIndicator.js", () => ({
    createChartStatusIndicator: () => {
        const el = document.createElement("div");
        el.className = "chart-status-indicator-mock";
        return el;
    },
    updateAllChartStatusIndicators: h.spies.updateAllChartStatusIndicators,
    setupChartStatusUpdates: h.spies.setupChartStatusUpdates,
}));

// Mock power and HR zone control modules used during initialization
vi.mock("../../utils/ui/controls/createPowerZoneControls.js", () => ({
    createPowerZoneControls: h.spies.createPowerZoneControls,
    movePowerZoneControlsToSection: h.spies.movePowerZoneControlsToSection,
}));

vi.mock("../../utils/ui/controls/createHRZoneControls.js", () => ({
    createHRZoneControls: h.spies.createHRZoneControls,
    moveHRZoneControlsToSection: h.spies.moveHRZoneControlsToSection,
}));

vi.mock("../../utils/app/initialization/getCurrentSettings.js", () => ({
    getCurrentSettings: () => ({ from: "getCurrentSettings" }),
    getDefaultSettings: () => ({ defaultSettings: true }),
    reRenderChartsAfterSettingChange: h.spies.reRenderChartsAfterSettingChange,
    resetAllSettings: h.spies.resetAllSettings,
}));

vi.mock("../../utils/charts/plugins/chartOptionsConfig.js", () => ({
    chartOptionsConfig: [
        { id: "alpha", label: "Alpha", type: "range", min: 0, max: 100, step: 5, default: 10 },
        { id: "smoothing", label: "Smoothing", type: "toggle", default: true },
        { id: "maxpoints", label: "Max Points", type: "select", options: ["all", 100, 500], default: "all" },
    ],
}));

vi.mock("../../utils/files/export/exportUtils.js", () => ({
    exportUtils: {
        isValidChart: (c: any) => !!c,
        downloadChartAsPNG: vi.fn(),
        createCombinedChartsImage: vi.fn(),
        copyChartToClipboard: vi.fn(),
        copyCombinedChartsToClipboard: vi.fn(),
        exportChartDataAsCSV: vi.fn(),
        exportCombinedChartsDataAsCSV: vi.fn(),
        exportChartDataAsJSON: vi.fn(),
        printChart: vi.fn(),
        printCombinedCharts: vi.fn(),
        exportAllAsZip: vi.fn(),
        shareChartsAsURL: vi.fn(),
        isGyazoAuthenticated: () => true,
        showGyazoAccountManager: vi.fn(),
        shareChartsToGyazo: vi.fn(),
    },
}));

vi.mock("../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: h.spies.showNotification,
}));

vi.mock("../../utils/theming/core/theme.js", () => ({
    getThemeConfig: () => ({ colors: { primaryAlpha: "#123456" } }),
}));

vi.mock("../../utils/charts/core/renderChartJS.js", () => ({
    renderChartJS: h.spies.renderChartJS,
}));

vi.mock("../../utils/charts/core/chartStateManager.js", () => ({
    chartStateManager: { debouncedRender: h.spies.debouncedRender },
}));

vi.mock("../../utils/data/processing/extractDeveloperFieldsList.js", () => ({
    extractDeveloperFieldsList: () => ["dev_field1"],
}));

// Bring in SUT after mocks
import { ensureChartSettingsDropdowns } from "../../utils/ui/components/ensureChartSettingsDropdowns.js";
import { fieldLabels } from "../../utils/formatting/display/formatChartFields.js";
import { exportUtils } from "../../utils/files/export/exportUtils.js";

function setupDOM(withContainer = false) {
    document.body.innerHTML = "";
    if (withContainer) {
        const c = document.createElement("div");
        c.id = "chartjs-chart-container";
        document.body.appendChild(c);
    }
}

function seedGlobalData() {
    (window as any).globalData = {
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
            { referenceMesg: "lap", timeInHrZone: [1, 2, 3] },
            { referenceMesg: "lap", timeInPowerZone: [1, 2, 3] },
        ],
        eventMesgs: [{ type: "pause" }],
    };
}

function seedCharts(count = 2) {
    (window as any)._chartjsInstances = Array.from({ length: count }).map((_, i) => ({
        data: { datasets: [{ label: `Field ${i + 1}`, data: [1, 2, 3] }] },
        config: { type: "line" },
    }));
}

beforeEach(() => {
    // reset state and spies
    for (const k of Object.keys(state)) delete state[k];
    Object.values(spies).forEach((fn) => (fn as any).mockClear?.());
    if (typeof localStorage !== "undefined") {
        localStorage.clear();
    }
    delete (window as any)._chartjsInstances;
    delete (window as any).globalData;
});

afterEach(() => {
    document.body.innerHTML = "";
});

describe("ensureChartSettingsDropdowns integration", () => {
    it("returns default settings when container missing", () => {
        setupDOM(false);
        const result = ensureChartSettingsDropdowns("chartjs-chart-container");
        expect(result).toEqual({ defaultSettings: true });
    });

    it("creates panel, toggle button, and sections; moves zone controls after timeout", async () => {
        setupDOM(true);
        seedGlobalData();

        const result = ensureChartSettingsDropdowns("chartjs-chart-container");
        expect(result).toEqual({ from: "getCurrentSettings" });

        // Toggle button exists and points to wrapper
        const toggleBtn = document.getElementById("chart-controls-toggle");
        expect(toggleBtn).toBeTruthy();
        expect(toggleBtn?.getAttribute("aria-controls")).toBe("chartjs-settings-wrapper");

        // Wrapper and sections exist
        const wrapper = document.getElementById("chartjs-settings-wrapper");
        expect(wrapper).toBeTruthy();
        expect(wrapper?.querySelector(".settings-header")).toBeTruthy();
        expect(wrapper?.querySelector(".controls-section")).toBeTruthy();
        expect(wrapper?.querySelector(".export-section")).toBeTruthy();
        expect(wrapper?.querySelector(".fields-section")).toBeTruthy();

        // Setup hooks called
        expect(spies.createPowerZoneControls).toHaveBeenCalled();
        expect(spies.createHRZoneControls).toHaveBeenCalled();
        expect(spies.setupChartStatusUpdates).toHaveBeenCalled();

        // move zone controls after timers
        vi.advanceTimersByTime(120);
        expect(spies.movePowerZoneControlsToSection).toHaveBeenCalled();
        expect(spies.moveHRZoneControlsToSection).toHaveBeenCalled();

        // state sync called
        expect(spies.updateControlsState).toHaveBeenCalled();
    });

    it("range/toggle/select controls update localStorage and trigger re-render (debounced)", () => {
        setupDOM(true);
        seedGlobalData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;

        // Range slider
        const alphaSlider = wrapper.querySelector("#chartjs-alpha-slider") as HTMLInputElement;
        expect(alphaSlider).toBeTruthy();
        alphaSlider.value = "25";
        alphaSlider.dispatchEvent(new Event("input", { bubbles: true }));
        expect(localStorage.getItem("chartjs_alpha")).toBe("25");
        // Debounce 300ms
        expect(spies.reRenderChartsAfterSettingChange).not.toHaveBeenCalledWith("alpha", "25");
        vi.advanceTimersByTime(300);
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith("alpha", "25");

        // Toggle control
        const toggleSwitch = wrapper.querySelector(".toggle-switch") as HTMLElement;
        expect(toggleSwitch).toBeTruthy();
        toggleSwitch.click();
        expect(localStorage.getItem("chartjs_smoothing")).toBe("false"); // default true -> toggled to false
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith("smoothing", false);

        // Select control
        const maxpoints = wrapper.querySelector("#chartjs-maxpoints-dropdown") as HTMLSelectElement;
        expect(maxpoints).toBeTruthy();
        maxpoints.value = "100";
        maxpoints.dispatchEvent(new Event("change", { bubbles: true }));
        expect(localStorage.getItem("chartjs_maxpoints")).toBe("100");
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith("maxpoints", "100");
    });

    it("field toggle hides/shows and triggers state render and status updates; color picker updates", () => {
        setupDOM(true);
        seedGlobalData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;

        // Regular field has color picker
        const speedCheckbox = wrapper.querySelector("#field-toggle-speed") as HTMLInputElement;
        expect(speedCheckbox).toBeTruthy();
        const speedColor = speedCheckbox.parentElement?.querySelector('input[type="color"]') as HTMLInputElement;
        expect(speedColor).toBeTruthy();

        // Toggle off
        speedCheckbox.checked = false;
        speedCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
        expect(localStorage.getItem("chartjs_field_speed")).toBe("hidden");
        expect(spies.debouncedRender).toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(spies.updateAllChartStatusIndicators).toHaveBeenCalled();

        // Change color
        speedColor.value = "#abcdef";
        speedColor.dispatchEvent(new Event("change", { bubbles: true }));
        expect(localStorage.getItem("chartjs_color_speed")).toBe("#abcdef");
        expect(spies.reRenderChartsAfterSettingChange).toHaveBeenCalledWith("speed_color", "#abcdef");

        // Zone chart has no color picker
        const hrZone = wrapper.querySelector("#field-toggle-hr_zone_doughnut") as HTMLInputElement;
        expect(hrZone).toBeTruthy();
        const hasPicker = hrZone.parentElement?.querySelector('input[type="color"]');
        expect(hasPicker).toBeNull();
    });

    it("toggle all buttons update all fields and notify", () => {
        setupDOM(true);
        seedGlobalData();

        const dispatchSpy = vi.spyOn(window, "dispatchEvent");
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;
        const enableAll = Array.from(wrapper.querySelectorAll("button")).find((b) =>
            b.textContent?.includes("Enable All")
        ) as HTMLButtonElement;
        const disableAll = Array.from(wrapper.querySelectorAll("button")).find((b) =>
            b.textContent?.includes("Disable All")
        ) as HTMLButtonElement;

        expect(enableAll).toBeTruthy();
        expect(disableAll).toBeTruthy();

        enableAll.click();
        expect(spies.showNotification).toHaveBeenCalledWith("All charts enabled", "success");
        // spot check a couple of keys
        expect(localStorage.getItem("chartjs_field_speed")).toBe("visible");
        expect(localStorage.getItem("chartjs_field_heartRate")).toBe("visible");
        expect(spies.debouncedRender).toHaveBeenCalled();

        disableAll.click();
        expect(spies.showNotification).toHaveBeenCalledWith("All charts disabled", "success");
        expect(localStorage.getItem("chartjs_field_speed")).toBe("hidden");
        expect(localStorage.getItem("chartjs_field_heartRate")).toBe("hidden");

        // dispatched custom event for bulk change
        expect(dispatchSpy).toHaveBeenCalled();
    });

    it("export section: no charts warns; with charts opens modal and calls export utils", () => {
        setupDOM(true);
        seedGlobalData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const wrapper = document.getElementById("chartjs-settings-wrapper")!;

        // No charts path
        delete (window as any)._chartjsInstances;
        const exportZipBtn = Array.from(wrapper.querySelectorAll("button")).find((b) =>
            b.textContent?.includes("Export ZIP")
        ) as HTMLButtonElement;
        expect(exportZipBtn).toBeTruthy();
        exportZipBtn.click();
        expect(spies.showNotification).toHaveBeenCalledWith("No charts available to export", "warning");
        expect(exportUtils.exportAllAsZip).not.toHaveBeenCalled();

        // Seed charts and click Save PNG and Combined
        seedCharts(2);

        const savePngBtn = Array.from(wrapper.querySelectorAll("button")).find((b) =>
            b.textContent?.includes("Save PNG")
        ) as HTMLButtonElement;
        expect(savePngBtn).toBeTruthy();

        savePngBtn.click();

        // Modal should exist with chart buttons and combined
        const overlay = document.querySelector('div[style*="position: fixed"]');
        expect(overlay).toBeTruthy();
        const chartButtons = Array.from(overlay!.querySelectorAll("button")).filter((b) =>
            Boolean(b.querySelector("iconify-icon[icon='fluent-color:chart-multiple-32']"))
        );
        expect(chartButtons.length).toBeGreaterThanOrEqual(2);

        // Click first chart -> downloadChartAsPNG called
        (chartButtons[0] as HTMLButtonElement).click();
        expect(exportUtils.downloadChartAsPNG).toHaveBeenCalled();

        // Reopen and click combined
        savePngBtn.click();
        const combinedBtn = Array.from(document.querySelectorAll("button")).find((b) =>
            Boolean(b.querySelector("iconify-icon[icon='flat-color-icons:link']")) &&
            b.textContent?.includes("All Charts Combined")
        ) as HTMLButtonElement;
        expect(combinedBtn).toBeTruthy();
        combinedBtn.click();
        expect(exportUtils.createCombinedChartsImage).toHaveBeenCalled();
    });

    it("settings header reset button calls reset and re-enables after delay", () => {
        setupDOM(true);
        seedGlobalData();
        ensureChartSettingsDropdowns("chartjs-chart-container");

        const header = document.querySelector(".settings-header")!;
        const resetBtn = Array.from(header.querySelectorAll("button")).find((b) =>
            b.textContent?.includes("Reset")
        ) as HTMLButtonElement;
        expect(resetBtn).toBeTruthy();

        resetBtn.click();
        expect(spies.resetAllSettings).toHaveBeenCalled();
        expect(resetBtn.disabled).toBe(true);
        vi.advanceTimersByTime(200);
        expect(resetBtn.disabled).toBe(false);
    });
});

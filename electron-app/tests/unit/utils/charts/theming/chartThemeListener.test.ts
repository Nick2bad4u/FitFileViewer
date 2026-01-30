/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted references to control the mock across dynamic imports
const { mockedChartStateManager } = /** @type {any} */ vi.hoisted(() => ({
    mockedChartStateManager: { handleThemeChange: vi.fn() },
}));

// Default mock: chartStateManager present
vi.mock("../../../../../utils/charts/core/chartStateManager.js", () => ({
    chartStateManager: mockedChartStateManager,
}));

/**
 * Helper to dynamically import the module under test fresh each time
 */
async function importModule() {
    return await import("../../../../../utils/charts/theming/chartThemeListener.js");
}

describe("chartThemeListener", () => {
    /** @type {any} */ let origWarn;
    /** @type {any} */ let origLog;

    beforeEach(() => {
        // Replace body to drop any lingering event listeners from previous tests
        const freshBody = document.createElement("body");
        document.documentElement.replaceChild(freshBody, document.body);
        // Reset mock state
        mockedChartStateManager.handleThemeChange.mockReset();
        // Clean globals
        // @ts-ignore
        delete window.ChartUpdater;
        // @ts-ignore
        delete window.chartUpdater;
        // @ts-ignore
        delete window.globalData;
        origWarn = console.warn;
        origLog = console.log;
        console.warn = vi.fn();
        console.log = vi.fn();
    });

    afterEach(() => {
        console.warn = /** @type {any} */ origWarn;
        console.log = /** @type {any} */ origLog;
        vi.resetModules();
        vi.useRealTimers();
    });

    function buildSettingsDOM() {
        const settings = document.createElement("div");
        settings.id = "settings";

        // sliders
        const slider1 = document.createElement("input");
        slider1.type = "range";
        slider1.min = "0";
        slider1.max = "100";
        slider1.value = "25";
        const slider2 = document.createElement("input");
        slider2.type = "range";
        slider2.min = "5";
        slider2.max = "5"; // percentage should fall back to 0
        slider2.value = "5";

        // toggles
        const toggleOn = document.createElement("div");
        toggleOn.className = "toggle-switch";
        const thumbOn = document.createElement("div");
        thumbOn.className = "toggle-thumb";
        thumbOn.style.left = "26px"; // considered ON
        toggleOn.appendChild(thumbOn);
        const statusOn = document.createElement("span");
        statusOn.textContent = "On";

        const toggleOff = document.createElement("div");
        toggleOff.className = "toggle-switch";
        const thumbOff = document.createElement("div");
        thumbOff.className = "toggle-thumb";
        thumbOff.style.left = "0px"; // OFF
        toggleOff.appendChild(thumbOff);
        const statusOff = document.createElement("span");
        statusOff.textContent = "Off";

        settings.append(
            slider1,
            slider2,
            toggleOn,
            statusOn,
            toggleOff,
            statusOff
        );
        document.body.appendChild(settings);
        return settings;
    }

    it("sets up listener, debounces, updates charts via chartStateManager, and updates settings UI", async () => {
        const { setupChartThemeListener } = await importModule();
        const chartsContainer = document.createElement("div");
        const settings = buildSettingsDOM();

        // globalData existence gates chart update
        // @ts-ignore
        window.globalData = {};

        vi.useFakeTimers();
        setupChartThemeListener(chartsContainer, settings);

        const evt = new CustomEvent("themechange", {
            detail: { theme: "dark" },
        });
        document.body.dispatchEvent(evt);

        // Should debounce and then call handleThemeChange
        expect(
            mockedChartStateManager.handleThemeChange
        ).not.toHaveBeenCalled();
        vi.advanceTimersByTime(160);
        expect(mockedChartStateManager.handleThemeChange).toHaveBeenCalledTimes(
            1
        );

        // Settings UI should be updated
        const sliders = settings.querySelectorAll('input[type="range"]');
        expect(sliders.length).toBe(2);
        const s1 = /** @type {HTMLInputElement} */ sliders[0];
        expect(s1.style.background).toContain("25%");
        const s2 = /** @type {HTMLInputElement} */ sliders[1];
        expect(s2.style.background).toContain("0%");

        const toggles = settings.querySelectorAll(".toggle-switch");
        // First toggle (ON) picks success color, second stays border
        const t1 = /** @type {HTMLElement} */ toggles[0];
        const t2 = /** @type {HTMLElement} */ toggles[1];
        expect(t1.style.background).toBe("var(--color-success)");
        expect(t2.style.background).toBe("var(--color-border)");

        const statuses = settings.querySelectorAll(".toggle-switch + span");
        expect(/** @type {HTMLElement} */ statuses[0].style.color).toBe(
            "var(--color-success)"
        );
        expect(/** @type {HTMLElement} */ statuses[1].style.color).toBe(
            "var(--color-fg)"
        );
    });

    it("does nothing chart-wise when globalData undefined", async () => {
        const { setupChartThemeListener } = await importModule();
        const settings = buildSettingsDOM();
        const chartsContainer = document.createElement("div");
        vi.useFakeTimers();
        setupChartThemeListener(chartsContainer, settings);
        document.body.dispatchEvent(
            new CustomEvent("themechange", { detail: { theme: "light" } })
        );
        vi.advanceTimersByTime(200);
        expect(
            mockedChartStateManager.handleThemeChange
        ).not.toHaveBeenCalled();
    });

    it("falls back to window.ChartUpdater when chartStateManager unavailable", async () => {
        vi.resetModules();
        // Remock chartStateManager to null for this import cycle
        vi.doMock(
            "../../../../../utils/charts/core/chartStateManager.js",
            () => ({ chartStateManager: null })
        );
        const { setupChartThemeListener } = await importModule();

        const chartsContainer = document.createElement("div");
        const settings = buildSettingsDOM();
        // @ts-ignore
        window.globalData = {};
        const updateAll = vi.fn();
        // @ts-ignore
        window.ChartUpdater = { updateAll };

        vi.useFakeTimers();
        setupChartThemeListener(chartsContainer, settings);
        document.body.dispatchEvent(
            new CustomEvent("themechange", { detail: { theme: "dark" } })
        );
        vi.advanceTimersByTime(200);
        expect(updateAll).toHaveBeenCalledWith("Theme change");
    });

    it("falls back to window.chartUpdater when both chartStateManager and ChartUpdater unavailable", async () => {
        vi.resetModules();
        vi.doMock(
            "../../../../../utils/charts/core/chartStateManager.js",
            () => ({ chartStateManager: null })
        );
        const { setupChartThemeListener } = await importModule();
        const chartsContainer = document.createElement("div");
        const settings = buildSettingsDOM();
        // @ts-ignore
        window.globalData = {};
        const updateAll = vi.fn();
        // @ts-ignore
        window.chartUpdater = { updateAll };

        vi.useFakeTimers();
        setupChartThemeListener(chartsContainer, settings);
        document.body.dispatchEvent(
            new CustomEvent("themechange", { detail: { theme: "dark" } })
        );
        vi.advanceTimersByTime(200);
        expect(updateAll).toHaveBeenCalledWith("Theme change");
    });

    it("warns when no chart update mechanism is available", async () => {
        vi.resetModules();
        vi.doMock(
            "../../../../../utils/charts/core/chartStateManager.js",
            () => ({ chartStateManager: null })
        );
        const warnSpy = vi.spyOn(console, "warn");
        const { setupChartThemeListener } = await importModule();
        const chartsContainer = document.createElement("div");
        const settings = buildSettingsDOM();
        // @ts-ignore
        window.globalData = {};

        vi.useFakeTimers();
        setupChartThemeListener(chartsContainer, settings);
        document.body.dispatchEvent(
            new CustomEvent("themechange", { detail: { theme: "dark" } })
        );
        vi.advanceTimersByTime(200);
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartThemeListener] No chart update mechanism available"
        );
    });

    it("removeChartThemeListener detaches handler", async () => {
        const { setupChartThemeListener, removeChartThemeListener } =
            await importModule();
        const chartsContainer = document.createElement("div");
        const settings = buildSettingsDOM();
        // @ts-ignore
        window.globalData = {};

        vi.useFakeTimers();
        setupChartThemeListener(chartsContainer, settings);
        removeChartThemeListener();
        document.body.dispatchEvent(
            new CustomEvent("themechange", { detail: { theme: "dark" } })
        );
        vi.advanceTimersByTime(200);
        expect(
            mockedChartStateManager.handleThemeChange
        ).not.toHaveBeenCalled();
    });

    it("forceUpdateChartTheme triggers updates immediately and updates settings UI", async () => {
        // For this test, explicitly exercise the fallback path to ensure an update occurs
        vi.resetModules();
        vi.doMock(
            "../../../../../utils/charts/core/chartStateManager.js",
            () => ({ chartStateManager: null })
        );
        const { forceUpdateChartTheme } = await importModule();
        const chartsContainer = document.createElement("div");
        const settings = buildSettingsDOM();
        // @ts-ignore
        window.globalData = {};
        const updateAll = vi.fn();
        // @ts-ignore
        window.ChartUpdater = { updateAll };

        forceUpdateChartTheme(chartsContainer, settings);
        expect(updateAll).toHaveBeenCalledWith("Force theme update");

        // Settings UI should be updated as well
        const sliders = settings.querySelectorAll('input[type="range"]');
        expect(
            /** @type {HTMLInputElement} */ sliders[0].style.background
        ).toContain("25%");
        const toggles = settings.querySelectorAll(".toggle-switch");
        expect(/** @type {HTMLElement} */ toggles[0].style.background).toBe(
            "var(--color-success)"
        );
    });

    it("forceUpdateChartTheme falls back to window.chartUpdater when ChartUpdater is unavailable", async () => {
        vi.resetModules();
        vi.doMock(
            "../../../../../utils/charts/core/chartStateManager.js",
            () => ({ chartStateManager: null })
        );
        const { forceUpdateChartTheme } = await importModule();
        const chartsContainer = document.createElement("div");
        // @ts-ignore
        window.globalData = {};
        const updateAll = vi.fn();
        // @ts-ignore
        window.chartUpdater = { updateAll };
        forceUpdateChartTheme(chartsContainer, /** @type {any} */ null);
        expect(updateAll).toHaveBeenCalledWith("Force theme update");
    });

    it("forceUpdateChartTheme warns when no chart update mechanism is available", async () => {
        vi.resetModules();
        vi.doMock(
            "../../../../../utils/charts/core/chartStateManager.js",
            () => ({ chartStateManager: null })
        );
        const { forceUpdateChartTheme } = await importModule();
        const chartsContainer = document.createElement("div");
        // @ts-ignore
        window.globalData = {};
        const warnSpy = vi.spyOn(console, "warn");
        // Ensure no global updaters exist
        // @ts-ignore
        delete window.ChartUpdater;
        // @ts-ignore
        delete window.chartUpdater;
        forceUpdateChartTheme(chartsContainer, /** @type {any} */ null);
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartThemeListener] No chart update mechanism available for force update"
        );
    });

    it("forceUpdateChartTheme handles errors in settings update gracefully (logs error)", async () => {
        const { forceUpdateChartTheme } = await importModule();
        const chartsContainer = document.createElement("div");
        // @ts-ignore
        window.globalData = {};
        const errorSpy = vi.spyOn(console, "error");
        // Pass a non-HTMLElement truthy object as settings to trigger catch in updateSettingsPanelTheme
        // @ts-ignore
        const bogusSettings = {};
        forceUpdateChartTheme(
            chartsContainer,
            /** @type {any} */ bogusSettings
        );
        expect(errorSpy).toHaveBeenCalled();
    });
});

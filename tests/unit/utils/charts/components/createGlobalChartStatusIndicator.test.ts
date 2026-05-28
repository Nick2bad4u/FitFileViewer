/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mock for getChartCounts
const { mockGetChartCounts } = /** @type {any} */ vi.hoisted(() => ({
    mockGetChartCounts: vi.fn(),
}));

vi.mock(
    "../../../../../electron-app/utils/charts/core/getChartCounts.js",
    () => ({
        getChartCounts: () => mockGetChartCounts(),
    })
);

import { createGlobalChartStatusIndicator } from "../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicator.js";

function createMockChartCounts(available: number, visible: number) {
    return {
        available,
        categories: {
            analysis: { available: 0, total: 0, visible: 0 },
            gps: { available: 0, total: 0, visible: 0 },
            metrics: { available, total: available, visible },
            zones: { available: 0, total: 0, visible: 0 },
        },
        total: available,
        visible,
    };
}

describe("createGlobalChartStatusIndicator", () => {
    /** @type {HTMLDivElement} */
    let root;
    /** @type {any} */
    let origLog;
    /** @type {any} */
    let origInfo;
    /** @type {any} */
    let origWarn;
    /** @type {any} */
    let origError;

    beforeEach(() => {
        // DOM reset
        document.body.innerHTML = "";
        root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);

        // Default chart content container
        const chartContent = document.createElement("div");
        chartContent.id = "content-chartjs";
        root.appendChild(chartContent);

        // Defaults: all visible
        mockGetChartCounts.mockReset();
        mockGetChartCounts.mockReturnValue(createMockChartCounts(3, 3));

        // Silence logs
        origLog = console.log;
        origInfo = console.info;
        origWarn = console.warn;
        origError = console.error;
        console.log = vi.fn();
        console.info = vi.fn();
        console.warn = vi.fn();
        console.error = vi.fn();
    });

    afterEach(() => {
        document.body.innerHTML = "";
        // Restore logs
        console.log = /** @type {any} */ origLog;
        console.info = /** @type {any} */ origInfo;
        console.warn = /** @type {any} */ origWarn;
        console.error = /** @type {any} */ origError;
        vi.resetAllMocks();
    });

    it("returns null and warns when chart content container missing", () => {
        // Remove content container
        document.getElementById("content-chartjs")?.remove();

        const result = createGlobalChartStatusIndicator();
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
    });

    it("creates indicator for all-visible charts with 'Charts Ready' quick action", () => {
        mockGetChartCounts.mockReturnValue(createMockChartCounts(4, 4));
        const indicator = createGlobalChartStatusIndicator();
        expect(indicator).toBeInstanceOf(HTMLElement);

        // Icon should be the ALL_VISIBLE emoji
        const icon =
            /** @type {HTMLElement | null} */ indicator &&
            indicator.querySelector("span");
        expect(icon?.textContent).toBe("✅");

        // Quick action should indicate charts are ready
        const quickAction =
            /** @type {HTMLElement | null} */ indicator &&
            indicator.querySelector("button");
        expect(quickAction?.textContent).toContain("Charts Ready");
    });

    it("creates indicator for some-hidden charts and opens settings on click", async () => {
        // Provide settings wrapper and toggle button that handler manipulates
        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "chartjs-settings-wrapper";
        settingsWrapper.style.display = "none";
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "chart-controls-toggle";
        root.append(settingsWrapper, toggleBtn);

        mockGetChartCounts.mockReturnValue(createMockChartCounts(6, 3));
        const indicator = createGlobalChartStatusIndicator();
        const quickAction = indicator?.querySelector("button");
        expect(quickAction?.textContent).toContain("Show Settings");

        // Click to trigger handleSettingsToggle side effects
        quickAction?.dispatchEvent(new Event("click"));
        // display should be set to block and toggle text changed
        expect(settingsWrapper.style.display).toBe("block");
        expect(toggleBtn.textContent).toContain("Hide Controls");
        expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
    });

    it("creates indicator for no charts with 'Load FIT' quick action", () => {
        mockGetChartCounts.mockReturnValue(createMockChartCounts(0, 0));
        const indicator = createGlobalChartStatusIndicator();
        const statusText = indicator?.querySelectorAll("span")[1];
        expect(statusText?.textContent).toContain("No chart data available");

        const quickAction = indicator?.querySelector("button");
        expect(quickAction?.textContent).toContain("Load FIT");
    });

    it("reuses existing indicator when already present", () => {
        const first = createGlobalChartStatusIndicator();
        const second = createGlobalChartStatusIndicator();
        expect(second).toBe(first);
        const all = document.querySelectorAll("#global-chart-status");
        expect(all.length).toBe(1);
    });

    it("inserts before chart container when present; warns when container missing", () => {
        const chartContent = document.getElementById("content-chartjs");
        // Create chart container to be the reference node
        const chartContainer = document.createElement("div");
        chartContainer.id = "chartjs-chart-container";
        chartContent?.appendChild(chartContainer);

        const indicator = createGlobalChartStatusIndicator();
        expect(indicator?.nextSibling).toBe(chartContainer);

        // Remove container and existing indicator to exercise warn path in getElementSafely during re-create
        chartContainer.remove();
        document.getElementById("global-chart-status")?.remove();
        const indicator2 = createGlobalChartStatusIndicator();
        expect(indicator2).toBeInstanceOf(HTMLElement);
        expect(console.warn).toHaveBeenCalled();
    });
});

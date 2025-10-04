/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mock for getChartCounts
const { mockGetChartCounts } = /** @type {any} */ vi.hoisted(() => ({ mockGetChartCounts: vi.fn() }));

vi.mock("../../../../../utils/charts/core/getChartCounts.js", () => ({
    getChartCounts: () => mockGetChartCounts(),
}));

import { createGlobalChartStatusIndicator } from "../../../../../utils/charts/components/createGlobalChartStatusIndicator.js";

describe("createGlobalChartStatusIndicator", () => {
    let root: HTMLDivElement;
    let origLog: typeof console.log;
    let origInfo: typeof console.info;
    let origWarn: typeof console.warn;
    let origError: typeof console.error;

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
        mockGetChartCounts.mockReturnValue({ available: 3, visible: 3 });

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
        console.log = origLog;
        console.info = origInfo;
        console.warn = origWarn;
        console.error = origError;
        vi.resetAllMocks();
    });

    it("returns null and warns when chart content container missing", () => {
        // Remove content container
        document.getElementById("content-chartjs")?.remove();

        const result = createGlobalChartStatusIndicator();
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
    });

    it("creates indicator for all-visible charts with 'All Set' quick action", () => {
        mockGetChartCounts.mockReturnValue({ available: 4, visible: 4 });
        const indicator = createGlobalChartStatusIndicator();
        expect(indicator).toBeTruthy();

        // Icon should be the ALL_VISIBLE Iconify glyph
        const icon = indicator?.querySelector("span iconify-icon");
        expect(icon?.getAttribute("icon")).toBe("flat-color-icons:ok");

        // Quick action should indicate all set
        const quickAction = indicator?.querySelector("button");
        const quickActionIcon = quickAction?.querySelector("iconify-icon");
        expect(quickActionIcon?.getAttribute("icon")).toBe("flat-color-icons:ok");
        expect(quickAction?.textContent?.trim()).toBe("All Set");
    });

    it("creates indicator for some-hidden charts and opens settings on click", async () => {
        // Provide settings wrapper and toggle button that handler manipulates
        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "chartjs-settings-wrapper";
        settingsWrapper.style.display = "none";
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "chart-controls-toggle";
        toggleBtn.innerHTML = '<iconify-icon icon="flat-color-icons:right" width="18" height="18"></iconify-icon> Show Controls';
        root.append(settingsWrapper, toggleBtn);

        mockGetChartCounts.mockReturnValue({ available: 6, visible: 3 });
        const indicator = createGlobalChartStatusIndicator();
        const quickAction = indicator?.querySelector("button");
        const quickActionIcon = quickAction?.querySelector("iconify-icon");
        expect(quickActionIcon?.getAttribute("icon")).toBe("flat-color-icons:settings");
        expect(quickAction?.textContent?.trim()).toBe("Show Settings");

        // Click to trigger handleSettingsToggle side effects
        quickAction?.dispatchEvent(new Event("click"));
        // display should be set to block and toggle text changed
        expect(settingsWrapper.style.display).toBe("block");
        expect(toggleBtn.innerHTML).toBe(
            '<iconify-icon icon="flat-color-icons:down" width="18" height="18"></iconify-icon> Hide Controls'
        );
        expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
    });

    it("creates indicator for no charts with 'Load FIT' quick action", () => {
        mockGetChartCounts.mockReturnValue({ available: 0, visible: 0 });
        const indicator = createGlobalChartStatusIndicator();
        const statusText = indicator?.querySelectorAll("span")[1];
        expect(statusText?.textContent).toContain("No chart data available");

        const quickAction = indicator?.querySelector("button");
        const quickActionIcon = quickAction?.querySelector("iconify-icon");
        expect(quickActionIcon?.getAttribute("icon")).toBe("flat-color-icons:folder");
        expect(quickAction?.textContent?.trim()).toBe("Load FIT");
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
        expect(indicator2).toBeTruthy();
        expect(console.warn).toHaveBeenCalled();
    });
});

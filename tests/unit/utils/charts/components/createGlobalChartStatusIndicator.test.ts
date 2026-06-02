// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockChartCounts = ReturnType<typeof createMockChartCounts>;

// Hoisted mock for getChartCounts
const { mockGetChartCounts } = vi.hoisted(() => ({
    mockGetChartCounts: vi.fn<() => MockChartCounts>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/core/getChartCounts.js"),
    () => ({
        getChartCounts: mockGetChartCounts,
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

function requireElement<TElement extends Element>(
    element: TElement | null | undefined,
    selector: string
): TElement {
    if (!element) {
        throw new Error(`Expected ${selector} to exist`);
    }

    return element;
}

function getIndicatorState(indicator: HTMLElement) {
    const statusInfo = requireElement(
        indicator.firstElementChild,
        "status info"
    );
    const icon = requireElement(statusInfo.children[0], "status icon");
    const statusText = requireElement(statusInfo.children[1], "status text");
    const quickAction = requireElement(
        indicator.querySelector("button"),
        "quick action"
    );
    const breakdown = requireElement(
        indicator.querySelector(".global-breakdown"),
        ".global-breakdown"
    );

    return {
        breakdownText: breakdown.textContent,
        iconText: icon.textContent,
        iconTitle: icon.getAttribute("title"),
        quickActionActionable: quickAction.getAttribute("data-actionable"),
        quickActionText: quickAction.textContent,
        quickActionTitle: quickAction.getAttribute("title"),
        statusText: statusText.textContent,
    };
}

describe(createGlobalChartStatusIndicator, () => {
    let root: HTMLDivElement;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-02T03:04:05.006Z"));

        document.body.replaceChildren();
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
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.replaceChildren();
        vi.resetAllMocks();
        vi.restoreAllMocks();
    });

    it("returns null and warns when chart content container missing", () => {
        expect.assertions(2);

        // Remove content container
        document.getElementById("content-chartjs")?.remove();

        const result = createGlobalChartStatusIndicator();
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(
            "2026-01-02T03:04:05.006Z [GlobalChartStatus] Chart tab content not found",
            { id: "content_chartjs" }
        );
    });

    it("creates indicator for all-visible charts with 'Charts Ready' quick action", () => {
        expect.assertions(3);

        mockGetChartCounts.mockReturnValue(createMockChartCounts(4, 4));
        const indicator = createGlobalChartStatusIndicator();
        expect(indicator).toBeInstanceOf(HTMLElement);

        const state = getIndicatorState(indicator as HTMLElement);
        expect(state).toMatchObject({
            iconText: "✅",
            iconTitle: "All available charts are visible",
            quickActionActionable: "false",
            quickActionText: "✨ Charts Ready",
            quickActionTitle: "All available charts are visible",
            statusText: "Showing 4 of 4 available charts",
        });
        expect(state.breakdownText).not.toContain("Use settings panel below");
    });

    it("creates indicator for some-hidden charts and opens settings on click", () => {
        expect.assertions(4);

        // Provide settings wrapper and toggle button that handler manipulates
        const settingsWrapper = document.createElement("div");
        settingsWrapper.id = "chartjs-settings-wrapper";
        settingsWrapper.style.display = "none";
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "chart-controls-toggle";
        root.append(settingsWrapper, toggleBtn);

        mockGetChartCounts.mockReturnValue(createMockChartCounts(6, 3));
        const indicator = createGlobalChartStatusIndicator();
        const quickAction = requireElement(
            indicator?.querySelector("button"),
            "quick action"
        );
        expect(getIndicatorState(indicator as HTMLElement)).toMatchObject({
            breakdownText:
                "Chart Categories📊 Metrics: 3/6📈 Analysis: 0/0🎯 Zones: 0/0🗺️ GPS: 0/0💡 Use settings panel below to enable more charts",
            iconText: "⚠️",
            iconTitle: "Some charts are hidden",
            quickActionActionable: "true",
            quickActionText: "⚙️ Show Settings",
            quickActionTitle: "Open chart settings to enable more charts",
            statusText: "Showing 3 of 6 available charts",
        });

        // Click to trigger handleSettingsToggle side effects
        quickAction.dispatchEvent(new Event("click"));
        // display should be set to block and toggle text changed
        expect(settingsWrapper.style.display).toBe("block");
        expect(toggleBtn.textContent).toBe("▼ Hide Controls");
        expect(toggleBtn.getAttribute("aria-expanded")).toBe("true");
    });

    it("creates indicator for no charts with 'Load FIT' quick action", () => {
        expect.assertions(2);

        mockGetChartCounts.mockReturnValue(createMockChartCounts(0, 0));
        const indicator = createGlobalChartStatusIndicator();
        expect(indicator).toBeInstanceOf(HTMLElement);
        expect(getIndicatorState(indicator as HTMLElement)).toMatchObject({
            iconText: "❌",
            iconTitle: "No charts are available",
            quickActionActionable: "false",
            quickActionText: "📂 Load FIT",
            quickActionTitle: "Load a FIT file to see charts",
            statusText: "No chart data available in this FIT file",
        });
    });

    it("reuses existing indicator when already present", () => {
        expect.assertions(2);

        const first = createGlobalChartStatusIndicator();
        const second = createGlobalChartStatusIndicator();
        expect(second).toBe(first);
        const all = document.querySelectorAll("#global-chart-status");
        expect(all).toHaveLength(1);
    });

    it("inserts before chart container when present; warns when container missing", () => {
        expect.assertions(3);

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
        expect(console.warn).toHaveBeenCalledWith(
            "2026-01-02T03:04:05.006Z [GlobalChartStatus] Chart container not found",
            { id: "chartjs_chart_container" }
        );
    });
});

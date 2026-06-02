// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    cleanupGlobalChartStatusIndicatorFromCounts,
    createGlobalChartStatusIndicatorFromCounts,
} from "../../../../../electron-app/utils/charts/components/createGlobalChartStatusIndicatorFromCounts.js";
import type { ChartCounts } from "../../../../../electron-app/utils/charts/core/getChartCounts.js";

const scrollIntoViewMock =
    vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();

function createCounts(overrides: Partial<ChartCounts> = {}): ChartCounts {
    return {
        available: 4,
        categories: {
            analysis: { available: 1, total: 1, visible: 1 },
            gps: { available: 1, total: 1, visible: 1 },
            metrics: { available: 1, total: 1, visible: 1 },
            zones: { available: 1, total: 1, visible: 1 },
        },
        total: 4,
        visible: 4,
        ...overrides,
    };
}

function setupChartContent(): HTMLElement {
    document.body.replaceChildren();
    scrollIntoViewMock.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: scrollIntoViewMock,
    });

    const chartContent = document.createElement("section");
    chartContent.id = "content_chartjs";
    document.body.append(chartContent);
    return chartContent;
}

function cleanupTestDom(): void {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
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
    const breakdownGrid = requireElement(
        breakdown.children[1],
        "breakdown grid"
    );

    return {
        breakdownRows: [...breakdownGrid.children].map(
            (row) => row.textContent
        ),
        breakdownTitle: breakdown.firstElementChild?.textContent ?? null,
        hintText: breakdown.children[2]?.textContent ?? null,
        iconText: icon.textContent,
        iconTitle: icon.getAttribute("title"),
        quickActionActionable: quickAction.getAttribute("data-actionable"),
        quickActionText: quickAction.textContent,
        quickActionTitle: quickAction.getAttribute("title"),
        statusText: statusText.textContent,
    };
}

describe("global chart status indicator from counts", () => {
    it("creates all-visible status content without HTML string insertion", () => {
        expect.assertions(5);

        setupChartContent();

        try {
            const indicator = requireElement(
                createGlobalChartStatusIndicatorFromCounts(createCounts()),
                "#global-chart-status"
            );
            const quickAction = requireElement(
                indicator.querySelector("button"),
                "button"
            );
            const breakdown = requireElement(
                indicator.querySelector(".global-breakdown"),
                ".global-breakdown"
            );
            const state = getIndicatorState(indicator);

            expect(indicator).toBeInstanceOf(HTMLElement);
            expect(indicator.id).toBe("global-chart-status");
            expect(state).toStrictEqual({
                breakdownRows: [
                    "📊 Metrics: 1/1",
                    "📈 Analysis: 1/1",
                    "🎯 Zones: 1/1",
                    "🗺️ GPS: 1/1",
                ],
                breakdownTitle: "Chart Categories",
                hintText: null,
                iconText: "✅",
                iconTitle: "All available charts are visible",
                quickActionActionable: "false",
                quickActionText: "✨ Charts Ready",
                quickActionTitle: "All available charts are visible",
                statusText: "Showing 4 of 4 available charts",
            });
            expect(quickAction).toBeInstanceOf(HTMLButtonElement);
            expect(breakdown).toBeInstanceOf(HTMLDivElement);
        } finally {
            cleanupTestDom();
        }
    });

    it("returns null and warns when chart content is missing", () => {
        expect.assertions(2);

        document.body.replaceChildren();
        const warnSpy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        try {
            const indicator =
                createGlobalChartStatusIndicatorFromCounts(createCounts());

            expect(indicator).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                "[ChartStatus] Chart tab content not found"
            );
        } finally {
            cleanupTestDom();
        }
    });

    it("opens settings and cancels delayed scroll during cleanup", () => {
        expect.assertions(6);

        setupChartContent();
        vi.useFakeTimers();

        try {
            const settingsWrapper = document.createElement("div");
            settingsWrapper.id = "chartjs-settings-wrapper";
            settingsWrapper.style.display = "none";

            const toggleButton = document.createElement("button");
            toggleButton.id = "chart-controls-toggle";

            const fieldsSection = document.createElement("section");
            fieldsSection.className = "fields-section";

            document.body.append(settingsWrapper, toggleButton, fieldsSection);

            const indicator = requireElement(
                createGlobalChartStatusIndicatorFromCounts(
                    createCounts({
                        available: 6,
                        categories: {
                            analysis: { available: 1, total: 1, visible: 0 },
                            gps: { available: 1, total: 1, visible: 0 },
                            metrics: { available: 3, total: 3, visible: 2 },
                            zones: { available: 1, total: 1, visible: 1 },
                        },
                        total: 6,
                        visible: 3,
                    })
                ),
                "#global-chart-status"
            );
            const quickAction = requireElement(
                indicator.querySelector("button"),
                "button"
            );
            const breakdown = requireElement(
                indicator.querySelector(".global-breakdown"),
                ".global-breakdown"
            );

            expect(getIndicatorState(indicator)).toMatchObject({
                breakdownRows: [
                    "📊 Metrics: 2/3",
                    "📈 Analysis: 0/1",
                    "🎯 Zones: 1/1",
                    "🗺️ GPS: 0/1",
                ],
                hintText: "💡 Use settings panel below to enable more charts",
                iconText: "⚠️",
                iconTitle: "Some charts are hidden",
                quickActionActionable: "true",
                quickActionText: "⚙️ Show Settings",
                quickActionTitle: "Open chart settings to enable more charts",
                statusText: "Showing 3 of 6 available charts",
            });

            quickAction.dispatchEvent(new MouseEvent("mouseenter"));

            expect(breakdown.style.visibility).toBe("visible");

            quickAction.dispatchEvent(new MouseEvent("click"));

            expect(settingsWrapper.style.display).toBe("block");
            expect(toggleButton.textContent).toBe("▼ Hide Controls");
            expect(toggleButton.getAttribute("aria-expanded")).toBe("true");

            cleanupGlobalChartStatusIndicatorFromCounts(indicator);
            vi.advanceTimersByTime(100);

            expect(scrollIntoViewMock).not.toHaveBeenCalled();
        } finally {
            cleanupTestDom();
        }
    });

    it("uses a load-file state when no charts are available", () => {
        expect.assertions(2);

        setupChartContent();

        try {
            const indicator = requireElement(
                createGlobalChartStatusIndicatorFromCounts(
                    createCounts({
                        available: 0,
                        categories: {
                            analysis: { available: 0, total: 0, visible: 0 },
                            gps: { available: 0, total: 0, visible: 0 },
                            metrics: { available: 0, total: 0, visible: 0 },
                            zones: { available: 0, total: 0, visible: 0 },
                        },
                        total: 0,
                        visible: 0,
                    })
                ),
                "#global-chart-status"
            );

            expect(indicator).toBeInstanceOf(HTMLElement);
            expect(getIndicatorState(indicator)).toMatchObject({
                iconText: "❌",
                iconTitle: "No charts are available",
                quickActionActionable: "false",
                quickActionText: "📂 Load FIT",
                quickActionTitle: "Load a FIT file to see charts",
                statusText: "No chart data available in this FIT file",
            });
        } finally {
            cleanupTestDom();
        }
    });
});

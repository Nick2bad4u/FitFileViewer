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

describe("global chart status indicator from counts", () => {
    it("creates all-visible status content without HTML string insertion", () => {
        expect.assertions(6);

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

            expect(indicator).toBeInstanceOf(HTMLElement);
            expect(indicator.id).toBe("global-chart-status");
            expect(indicator.textContent).toContain(
                "Showing 4 of 4 available charts"
            );
            expect(quickAction.textContent).toContain("Charts Ready");
            expect(breakdown.textContent).toContain("Metrics: 1/1");
            expect(breakdown.textContent).not.toContain(
                "Use settings panel below"
            );
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

            expect(quickAction.textContent).toContain("Show Settings");

            quickAction.dispatchEvent(new MouseEvent("mouseenter"));

            expect(breakdown.style.visibility).toBe("visible");

            quickAction.dispatchEvent(new MouseEvent("click"));

            expect(settingsWrapper.style.display).toBe("block");
            expect(toggleButton.textContent).toContain("Hide Controls");
            expect(toggleButton.getAttribute("aria-expanded")).toBe("true");

            cleanupGlobalChartStatusIndicatorFromCounts(indicator);
            vi.advanceTimersByTime(100);

            expect(scrollIntoViewMock).not.toHaveBeenCalled();
        } finally {
            cleanupTestDom();
        }
    });

    it("uses a load-file state when no charts are available", () => {
        expect.assertions(3);

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

            expect(indicator.querySelector("span")?.textContent).toBe("❌");
            expect(indicator.textContent).toContain(
                "No chart data available in this FIT file"
            );
            expect(indicator.querySelector("button")?.textContent).toContain(
                "Load FIT"
            );
        } finally {
            cleanupTestDom();
        }
    });
});

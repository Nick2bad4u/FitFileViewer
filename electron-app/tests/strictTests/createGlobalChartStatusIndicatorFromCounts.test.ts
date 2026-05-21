// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    cleanupGlobalChartStatusIndicatorFromCounts,
    createGlobalChartStatusIndicatorFromCounts,
} from "../../utils/charts/components/createGlobalChartStatusIndicatorFromCounts.js";
import type { ChartCounts } from "../../utils/charts/core/getChartCounts.js";

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

function requireElement<TElement extends Element>(
    element: TElement | null | undefined,
    selector: string
): TElement {
    if (!element) {
        throw new Error(`Expected ${selector} to exist`);
    }

    return element;
}

function setupChartContent(): HTMLElement {
    const chartContent = document.createElement("section");
    chartContent.id = "content_chartjs";
    document.body.append(chartContent);
    return chartContent;
}

function setupTestDom(): void {
    document.body.replaceChildren();
    scrollIntoViewMock.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        value: scrollIntoViewMock,
    });
}

function cleanupTestDom(): void {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
}

describe("createGlobalChartStatusIndicatorFromCounts strict behavior", () => {
    it("creates all-visible status content inside the chart content contract", () => {
        expect.assertions(7);

        setupTestDom();

        try {
            setupChartContent();

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

            expect(indicator.id).toBe("global-chart-status");
            expect(indicator.className).toBe("global-chart-status");
            expect(indicator.textContent).toContain(
                "Showing 4 of 4 available charts"
            );
            expect(indicator.querySelector("span")?.textContent).toBe("✅");
            expect(quickAction.textContent).toBe("✨ Charts Ready");
            expect(quickAction.dataset["actionable"]).toBe("false");
            expect(breakdown.textContent).toContain("Metrics: 1/1");
        } finally {
            cleanupTestDom();
        }
    });

    it("returns null and warns when chart content is missing", () => {
        expect.assertions(2);

        setupTestDom();

        try {
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockReturnValue(undefined);

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

    it("opens settings and schedules the field-section scroll for hidden charts", () => {
        expect.assertions(7);

        vi.useFakeTimers();

        setupTestDom();

        try {
            setupChartContent();

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
                            analysis: { available: 1, total: 1, visible: 1 },
                            gps: { available: 1, total: 1, visible: 0 },
                            metrics: { available: 3, total: 3, visible: 2 },
                            zones: { available: 1, total: 1, visible: 0 },
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

            expect(quickAction.textContent).toBe("⚙️ Show Settings");
            expect(quickAction.dataset["actionable"]).toBe("true");

            quickAction.dispatchEvent(new MouseEvent("mouseenter"));

            expect(breakdown.style.visibility).toBe("visible");

            quickAction.dispatchEvent(new MouseEvent("click"));

            expect(settingsWrapper.style.display).toBe("block");
            expect(toggleButton.textContent).toBe("▼ Hide Controls");
            expect(toggleButton.getAttribute("aria-expanded")).toBe("true");

            vi.advanceTimersByTime(100);

            expect(scrollIntoViewMock).toHaveBeenCalledExactlyOnceWith({
                behavior: "smooth",
                block: "start",
            });

            cleanupGlobalChartStatusIndicatorFromCounts(indicator);
        } finally {
            cleanupTestDom();
        }
    });

    it("cancels delayed field-section scroll during cleanup", () => {
        expect.assertions(3);

        vi.useFakeTimers();

        setupTestDom();

        try {
            setupChartContent();

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
                        available: 2,
                        categories: {
                            analysis: { available: 0, total: 0, visible: 0 },
                            gps: { available: 0, total: 0, visible: 0 },
                            metrics: { available: 2, total: 2, visible: 1 },
                            zones: { available: 0, total: 0, visible: 0 },
                        },
                        total: 2,
                        visible: 1,
                    })
                ),
                "#global-chart-status"
            );
            const quickAction = requireElement(
                indicator.querySelector("button"),
                "button"
            );

            quickAction.dispatchEvent(new MouseEvent("click"));

            expect(settingsWrapper.style.display).toBe("block");
            expect(toggleButton.getAttribute("aria-expanded")).toBe("true");

            cleanupGlobalChartStatusIndicatorFromCounts(indicator);
            vi.advanceTimersByTime(100);

            expect(scrollIntoViewMock).not.toHaveBeenCalled();
        } finally {
            cleanupTestDom();
        }
    });

    it("uses the load-file state when no charts are available", () => {
        expect.assertions(3);

        setupTestDom();

        try {
            setupChartContent();

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
            expect(indicator.querySelector("button")?.textContent).toBe(
                "📂 Load FIT"
            );
        } finally {
            cleanupTestDom();
        }
    });
});

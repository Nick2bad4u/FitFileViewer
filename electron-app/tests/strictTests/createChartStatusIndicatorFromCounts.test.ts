// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    cleanupChartStatusIndicatorFromCounts,
    createChartStatusIndicatorFromCounts,
} from "../../utils/charts/components/createChartStatusIndicatorFromCounts.js";
import type { ChartCounts } from "../../utils/charts/core/getChartCounts.js";

const scrollIntoViewMock =
    vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();

function createCounts(overrides: Partial<ChartCounts> = {}): ChartCounts {
    return {
        available: 6,
        categories: {
            analysis: { available: 1, total: 1, visible: 1 },
            gps: { available: 1, total: 1, visible: 0 },
            metrics: { available: 3, total: 3, visible: 2 },
            zones: { available: 1, total: 1, visible: 0 },
        },
        total: 6,
        visible: 3,
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

describe("createChartStatusIndicatorFromCounts strict behavior", () => {
    it("creates status content and a body-level breakdown without HTML insertion", () => {
        expect.assertions(8);

        setupTestDom();

        try {
            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(createCounts()),
                "#chart-status-indicator"
            );
            const statusIcon = requireElement(
                indicator.querySelector(".status-icon"),
                ".status-icon"
            );
            const statusText = requireElement(
                indicator.querySelector(".status-text"),
                ".status-text"
            );
            const breakdown = requireElement(
                document.querySelector(".status-breakdown"),
                ".status-breakdown"
            );

            expect(indicator.id).toBe("chart-status-indicator");
            expect(indicator.className).toBe("chart-status-indicator");
            expect(statusIcon.textContent).toBe("⚠️");
            expect(statusIcon.getAttribute("title")).toBe(
                "Some charts are hidden"
            );
            expect(statusText.textContent).toBe("3 / 6 charts visible");
            expect(breakdown.parentElement).toBe(document.body);
            expect(breakdown.textContent).toContain("Metrics: 2/3");
            expect(breakdown.textContent).toContain(
                'Enable more charts in "Visible Metrics" below'
            );
        } finally {
            cleanupTestDom();
        }
    });

    it("uses the no-chart state when no charts are available", () => {
        expect.assertions(3);

        setupTestDom();

        try {
            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(
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
                "#chart-status-indicator"
            );

            expect(indicator.querySelector(".status-icon")?.textContent).toBe(
                "❌"
            );
            expect(
                indicator.querySelector(".status-icon")?.getAttribute("title")
            ).toBe("No charts are available");
            expect(indicator.querySelector(".status-text")?.textContent).toBe(
                "No charts available"
            );
        } finally {
            cleanupTestDom();
        }
    });

    it("shows, repositions, hides, and cleans up the breakdown", () => {
        expect.assertions(7);

        setupTestDom();

        try {
            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(createCounts()),
                "#chart-status-indicator"
            );
            const breakdown = requireElement(
                document.querySelector(".status-breakdown"),
                ".status-breakdown"
            );

            indicator.dispatchEvent(
                new MouseEvent("mouseenter", {
                    clientX: 100,
                    clientY: 200,
                })
            );
            indicator.dispatchEvent(
                new MouseEvent("mousemove", {
                    clientX: 100,
                    clientY: 200,
                })
            );

            expect(indicator.style.background).toBe(
                "var(--color-glass-border)"
            );
            expect(indicator.style.transform).toBe("translateY(-1px)");
            expect(breakdown.style.visibility).toBe("visible");
            expect(breakdown.style.opacity).toBe("1");
            expect(breakdown.style.left).toBe("112px");
            expect(breakdown.style.top).toBe("216px");

            cleanupChartStatusIndicatorFromCounts(indicator);

            expect(document.querySelector(".status-breakdown")).toBeNull();
        } finally {
            cleanupTestDom();
        }
    });

    it("scrolls to fields and clears the temporary highlight", () => {
        expect.assertions(5);

        vi.useFakeTimers();

        setupTestDom();

        try {
            const fieldsSection = document.createElement("section");
            fieldsSection.className = "fields-section";
            document.body.append(fieldsSection);

            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(createCounts()),
                "#chart-status-indicator"
            );

            indicator.dispatchEvent(new MouseEvent("click"));

            expect(scrollIntoViewMock).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
            expect(fieldsSection.style.outline).toContain("2px solid");
            expect(fieldsSection.style.outlineOffset).toBe("4px");

            vi.advanceTimersByTime(2000);

            expect(fieldsSection.style.outline).toBe("none");
            expect(fieldsSection.style.outlineOffset).toBe("0px");
        } finally {
            cleanupTestDom();
        }
    });

    it("returns a fallback element for invalid count data", () => {
        expect.assertions(3);

        setupTestDom();

        try {
            const errorSpy = vi
                .spyOn(console, "error")
                .mockReturnValue(undefined);

            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(
                    null as unknown as ChartCounts
                ),
                "#chart-status-indicator"
            );

            expect(indicator.textContent).toBe("Chart status unavailable");
            expect(indicator.className).toBe("chart-status-indicator");
            expect(errorSpy).toHaveBeenCalledWith(
                "[ChartStatus] Error creating chart status indicator from counts:",
                expect.any(Error)
            );
        } finally {
            cleanupTestDom();
        }
    });
});

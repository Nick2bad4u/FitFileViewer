// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    cleanupChartStatusIndicatorFromCounts,
    createChartStatusIndicatorFromCounts,
} from "../../../../../electron-app/utils/charts/components/createChartStatusIndicatorFromCounts.js";
import type { ChartCounts } from "../../../../../electron-app/utils/charts/core/getChartCounts.js";

const scrollIntoViewMock =
    vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();

function createCounts(overrides: Partial<ChartCounts> = {}): ChartCounts {
    return {
        available: 6,
        categories: {
            analysis: { available: 1, total: 1, visible: 0 },
            gps: { available: 1, total: 1, visible: 0 },
            metrics: { available: 3, total: 3, visible: 2 },
            zones: { available: 1, total: 1, visible: 1 },
        },
        total: 6,
        visible: 3,
        ...overrides,
    };
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

function requireElement<TElement extends Element>(
    element: TElement | null | undefined,
    selector: string
): TElement {
    if (!element) {
        throw new Error(`Expected ${selector} to exist`);
    }

    return element;
}

describe("chart status indicator from counts", () => {
    it("creates status text and breakdown content without HTML string insertion", () => {
        expect.assertions(7);

        setupTestDom();

        try {
            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(createCounts()),
                "#chart-status-indicator"
            );

            expect(indicator).toBeInstanceOf(HTMLElement);
            expect(indicator.id).toBe("chart-status-indicator");
            expect(
                requireElement(
                    indicator.querySelector(".status-icon"),
                    ".status-icon"
                ).textContent
            ).toBe("⚠️");
            expect(
                requireElement(
                    indicator.querySelector(".status-text"),
                    ".status-text"
                ).textContent
            ).toBe("3 / 6 charts visible");

            const breakdown = requireElement(
                document.querySelector(".status-breakdown"),
                ".status-breakdown"
            );

            expect(breakdown).toBeInstanceOf(HTMLElement);
            expect(breakdown.textContent).toContain("Metrics: 2/3");
            expect(breakdown.textContent).toContain(
                'Enable more charts in "Visible Metrics" below'
            );
        } finally {
            cleanupTestDom();
        }
    });

    it("uses a no-charts state when no charts are available", () => {
        expect.assertions(2);

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

            expect(
                requireElement(
                    indicator.querySelector(".status-icon"),
                    ".status-icon"
                ).textContent
            ).toBe("❌");
            expect(
                requireElement(
                    indicator.querySelector(".status-text"),
                    ".status-text"
                ).textContent
            ).toBe("No charts available");
        } finally {
            cleanupTestDom();
        }
    });

    it("shows, hides, and cleans up the body-level breakdown", () => {
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

            expect(indicator).toBeInstanceOf(HTMLElement);
            expect(breakdown).toBeInstanceOf(HTMLElement);

            indicator.dispatchEvent(
                new MouseEvent("mouseenter", {
                    clientX: 16,
                    clientY: 20,
                })
            );

            expect(breakdown.style.visibility).toBe("visible");
            expect(breakdown.style.opacity).toBe("1");

            indicator.dispatchEvent(new MouseEvent("mouseleave"));

            expect(breakdown.style.visibility).toBe("hidden");
            expect(breakdown.style.opacity).toBe("0");

            cleanupChartStatusIndicatorFromCounts(indicator);

            expect(document.querySelector(".status-breakdown")).toBeNull();
        } finally {
            cleanupTestDom();
        }
    });

    it("scrolls to fields and clears the temporary highlight", () => {
        expect.assertions(6);

        setupTestDom();
        vi.useFakeTimers();

        try {
            const fieldsSection = document.createElement("section");
            fieldsSection.className = "fields-section";
            document.body.append(fieldsSection);

            const indicator = requireElement(
                createChartStatusIndicatorFromCounts(createCounts()),
                "#chart-status-indicator"
            );

            expect(indicator).toBeInstanceOf(HTMLElement);

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
});

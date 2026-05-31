// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock for getChartCounts with rich category data
const { mockGetChartCounts } = vi.hoisted(() => ({
    mockGetChartCounts: vi.fn<() => unknown>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/core/getChartCounts.js"),
    () => ({
        getChartCounts: mockGetChartCounts,
    })
);

import { createChartStatusIndicator } from "../../../../../electron-app/utils/charts/components/createChartStatusIndicator.js";

describe(createChartStatusIndicator, () => {
    beforeEach(() => {
        document.body.innerHTML = "";

        // Default: all visible, with detailed categories to satisfy template
        mockGetChartCounts.mockReset();
        mockGetChartCounts.mockReturnValue({
            available: 4,
            visible: 4,
            categories: {
                metrics: { available: 2, visible: 2 },
                analysis: { available: 1, visible: 1 },
                zones: { available: 1, visible: 1 },
                gps: { available: 0, visible: 0 },
            },
        });

        // Silence noise; keep error to assert in error case
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = "";
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("creates an indicator for all-visible charts (✅) and appends breakdown to body", () => {
        expect.hasAssertions();

        const indicator = createChartStatusIndicator();
        expect(indicator).toBeInstanceOf(HTMLElement);
        expect(indicator.id).toBe("chart-status-indicator");

        const icon = indicator.querySelector(".status-icon");
        expect(icon?.textContent).toBe("✅");
        expect(icon?.getAttribute("title")).toContain(
            "All available charts are visible"
        );

        const statusText = indicator.querySelector(".status-text");
        expect(statusText?.innerHTML).toContain("4");
        expect(statusText?.innerHTML).toContain("charts visible");

        // Breakdown tooltip should be appended to document.body
        const breakdown = document.querySelector(".status-breakdown");
        expect(breakdown).toBeInstanceOf(HTMLElement);
        expect(breakdown?.id).toBe("chart-status-indicator-breakdown");
        // Should not include enable-more tip when nothing hidden
        expect(breakdown?.innerHTML).not.toContain("Enable more charts");
    });

    it("shows warning (⚠️) when some charts are hidden and reveals breakdown on hover", () => {
        expect.hasAssertions();

        mockGetChartCounts.mockReturnValue({
            available: 6,
            visible: 3,
            categories: {
                metrics: { available: 3, visible: 2 },
                analysis: { available: 1, visible: 0 },
                zones: { available: 1, visible: 1 },
                gps: { available: 1, visible: 0 },
            },
        });

        const indicator = createChartStatusIndicator();
        const icon = indicator.querySelector(".status-icon");
        expect(icon?.textContent).toBe("⚠️");

        const breakdown =
            document.querySelector<HTMLElement>(".status-breakdown");

        // Hover in
        indicator.dispatchEvent(new Event("mouseenter"));
        expect(indicator.style.transform).toBe("translateY(-1px)");
        expect(breakdown?.style.visibility).toBe("visible");
        expect(breakdown?.style.opacity).toBe("1");

        // Hover out
        indicator.dispatchEvent(new Event("mouseleave"));
        expect(indicator.style.transform).toBe("translateY(0)");
        expect(breakdown?.style.visibility).toBe("hidden");
        expect(breakdown?.style.opacity).toBe("0");

        // Breakdown content should include guidance tip when hidden charts exist
        expect(breakdown?.innerHTML).toContain("Enable more charts");
    });

    it("click scrolls to fields section and briefly highlights it", () => {
        expect.hasAssertions();

        // Provide a fields section target
        const fields = document.createElement("div");
        fields.className = "fields-section";
        const scrollIntoView =
            vi.fn<(options?: ScrollIntoViewOptions) => void>();
        Object.defineProperty(fields, "scrollIntoView", {
            configurable: true,
            value: scrollIntoView,
        });
        document.body.appendChild(fields);

        mockGetChartCounts.mockReturnValue({
            available: 5,
            visible: 2,
            categories: {
                metrics: { available: 3, visible: 1 },
                analysis: { available: 1, visible: 0 },
                zones: { available: 1, visible: 1 },
                gps: { available: 0, visible: 0 },
            },
        });

        vi.useFakeTimers();
        const indicator = createChartStatusIndicator();
        indicator.dispatchEvent(new Event("click"));

        expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({
            behavior: "smooth",
            block: "start",
        });
        expect(fields.style.outline).toContain("2px solid");
        expect(fields.style.outlineOffset).toBe("4px");

        // After 2s, outline should clear
        vi.advanceTimersByTime(2000);
        expect(fields.style.outline).toBe("none");
        expect(fields.style.outlineOffset).toBe("0px");
        vi.useRealTimers();
    });

    it("shows neutral message when no charts are available", () => {
        expect.hasAssertions();

        mockGetChartCounts.mockReturnValue({
            available: 0,
            visible: 0,
            categories: {
                metrics: { available: 0, visible: 0 },
                analysis: { available: 0, visible: 0 },
                zones: { available: 0, visible: 0 },
                gps: { available: 0, visible: 0 },
            },
        });

        const indicator = createChartStatusIndicator();
        const icon = indicator.querySelector(".status-icon");
        expect(icon?.textContent).toBe("❌");

        const statusText = indicator.querySelector<HTMLElement>(".status-text");
        expect(statusText?.textContent).toBe("No charts available");
        expect(statusText?.style.color).toBe("var(--color-fg-muted)");
    });

    it("uses error state (❌) when visible > available (invalid input)", () => {
        expect.hasAssertions();

        mockGetChartCounts.mockReturnValue({
            available: 1,
            visible: 2,
            categories: {
                metrics: { available: 1, visible: 1 },
                analysis: { available: 0, visible: 1 },
                zones: { available: 0, visible: 0 },
                gps: { available: 0, visible: 0 },
            },
        });
        const indicator = createChartStatusIndicator();
        const icon = indicator.querySelector(".status-icon");
        expect(icon?.textContent).toBe("❌");

        const statusText = indicator.querySelector(".status-text");
        expect(statusText?.innerHTML).toContain("var(--color-error)");
    });

    it("returns a fallback element and logs an error when rendering throws", () => {
        expect.hasAssertions();

        mockGetChartCounts.mockImplementationOnce(() => {
            throw new Error("boom");
        });

        const indicator = createChartStatusIndicator();
        expect(console.error).toHaveBeenCalledWith(
            "[ChartStatus] Error creating chart status indicator:",
            expect.any(Error)
        );
        expect(indicator).toBeInstanceOf(HTMLElement);
        expect(indicator.className).toBe("chart-status-indicator");
        expect(indicator.textContent).toBe("Chart status unavailable");
    });

    it("does not leak duplicate breakdown tooltips across re-renders", () => {
        expect.hasAssertions();

        const first = createChartStatusIndicator();
        document.body.append(first);
        const firstBreakdown = document.querySelector(
            "#chart-status-indicator-breakdown"
        );
        expect(
            document.querySelectorAll("#chart-status-indicator-breakdown")
        ).toHaveLength(1);

        const second = createChartStatusIndicator();
        document.body.append(second);

        // A stable breakdown id is used to prevent orphaned tooltip buildup.
        const breakdowns = document.querySelectorAll(
            "#chart-status-indicator-breakdown"
        );
        expect(breakdowns).toHaveLength(1);
        expect(breakdowns[0]).not.toBe(firstBreakdown);
    });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mock for getChartCounts with rich category data
const { mockGetChartCounts } = /** @type {any} */ (
  vi.hoisted(() => ({ mockGetChartCounts: vi.fn() }))
);

vi.mock("../../../../../utils/charts/core/getChartCounts.js", () => ({
  getChartCounts: () => mockGetChartCounts(),
}));

import { createChartStatusIndicator } from "../../../../../utils/charts/components/createChartStatusIndicator.js";

describe("createChartStatusIndicator", () => {
  /** @type {any} */
  let origError;
  /** @type {any} */
  let origWarn;

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
    origError = console.error;
    origWarn = console.warn;
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    console.error = /** @type {any} */ (origError);
    console.warn = /** @type {any} */ (origWarn);
    vi.restoreAllMocks();
  });

  it("creates an indicator for all-visible charts (✅) and appends breakdown to body", () => {
    const indicator = createChartStatusIndicator();
    expect(indicator).toBeInstanceOf(HTMLElement);
    expect(indicator.id).toBe("chart-status-indicator");

    const icon = indicator.querySelector(".status-icon");
    expect(icon?.textContent).toBe("✅");
    expect(icon?.getAttribute("title")).toContain("All available charts are visible");

    const statusText = indicator.querySelector(".status-text");
    expect(statusText?.innerHTML).toContain("4");
    expect(statusText?.innerHTML).toContain("charts visible");

    // Breakdown tooltip should be appended to document.body
    const breakdown = document.querySelector(".status-breakdown");
    expect(breakdown).toBeTruthy();
    // Should not include enable-more tip when nothing hidden
    expect(breakdown?.innerHTML).not.toContain("Enable more charts");
  });

  it("shows warning (⚠️) when some charts are hidden and reveals breakdown on hover", () => {
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

    const breakdown = /** @type {HTMLElement|null} */ (document.querySelector(".status-breakdown"));

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
    // Provide a fields section target
    const fields = document.createElement("div");
    fields.className = "fields-section";
    /** @type {(opts?: any) => void} */
    // @ts-ignore
    fields.scrollIntoView = vi.fn();
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

    expect(/** @type {any} */(fields.scrollIntoView)).toHaveBeenCalledTimes(1);
    expect(/** @type {any} */(fields.scrollIntoView)).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(fields.style.outline).toContain("2px solid");
    expect(fields.style.outlineOffset).toBe("4px");

    // After 2s, outline should clear
    vi.advanceTimersByTime(2000);
    expect(fields.style.outline).toBe("none");
    expect(fields.style.outlineOffset).toBe("0");
    vi.useRealTimers();
  });

  it("shows neutral message when no charts are available", () => {
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
    // Note: logic sets ✅ icon even when 0/0, but text is overwritten below
    expect(icon?.textContent).toBe("✅");

    const statusText = /** @type {HTMLElement|null} */ (indicator.querySelector(".status-text"));
    expect(statusText?.textContent).toBe("No charts available");
    expect(statusText?.style.color).toBe("var(--color-fg-muted)");
  });

  it("uses error state (❌) when visible > available (invalid input)", () => {
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
    mockGetChartCounts.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const indicator = createChartStatusIndicator();
    expect(console.error).toHaveBeenCalled();
    expect(indicator).toBeInstanceOf(HTMLElement);
    expect(indicator.className).toBe("chart-status-indicator");
    expect(indicator.textContent).toBe("Chart status unavailable");
  });
});

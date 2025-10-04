import { beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

// Mock the function import
const { createChartStatusIndicatorFromCounts } = await import(
    "../../utils/charts/components/createChartStatusIndicatorFromCounts.js"
);

describe("createChartStatusIndicatorFromCounts", () => {
    let dom: JSDOM;
    let document: Document;
    let container: HTMLElement;

    beforeEach(() => {
        dom = new JSDOM(
            `<!DOCTYPE html>
            <html>
                <head>        it("should update tooltip position on mousemove", () => {
            const counts = {
                total: 4,
                visible: 3,
                available: 4,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 }
                }
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;      <style>
                        :root {
                            --color-glass: rgba(255, 255, 255, 0.1);
                            --color-glass-border: rgba(255, 255, 255, 0.2);
                            --color-success: #10b981;
                            --color-warning: #f59e0b;
                            --color-border: rgba(255, 255, 255, 0.1);
                            --color-accent: #3b82f6;
                        }
                    </style>
                </head>
                <body>
                    <div class="fields-section"></div>
                </body>
            </html>`,
            {
                url: "http://localhost",
                pretendToBeVisual: true,
                resources: "usable",
            }
        );

        document = dom.window.document;
        container = document.body;

        // Setup global document
        global.document = document as unknown as Document;
        global.window = dom.window as unknown as Window & typeof globalThis;
        global.HTMLElement = dom.window.HTMLElement;
        global.Element = dom.window.Element;

        // Setup fake timers for timeout tests
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Reset timers after each test
        vi.useRealTimers();
    });

    describe("Basic Functionality", () => {
        it("should create an indicator with correct ID and class", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 5,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 0, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);

            expect(indicator).toBeInstanceOf(dom.window.HTMLDivElement);
            expect(indicator.id).toBe("chart-status-indicator");
            expect(indicator.className).toBe("chart-status-indicator");
        });

        it("should create status icon and text elements", () => {
            const counts = {
                total: 3,
                visible: 3,
                available: 3,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon");
            const statusText = indicator.querySelector(".status-text");

            expect(statusIcon).not.toBeNull();
            expect(statusText).not.toBeNull();
            expect(statusIcon?.className).toBe("status-icon");
            expect(statusText?.className).toBe("status-text");
        });

        it("should set correct CSS styles on the indicator", () => {
            const counts = {
                total: 1,
                visible: 1,
                available: 1,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);

            expect(indicator.style.position).toBe("relative");
            expect(indicator.style.cursor).toBe("pointer");
        });

        it("should create and append tooltip to document body", () => {
            const counts = {
                total: 4,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown");

            expect(breakdown).not.toBeNull();
            expect(breakdown?.parentElement).toBe(document.body);
        });

        it("should return HTMLDivElement type", () => {
            const counts = {
                total: 0,
                visible: 0,
                available: 0,
                categories: {
                    metrics: { total: 0, visible: 0, available: 0 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);

            expect(indicator).toBeInstanceOf(dom.window.HTMLDivElement);
        });
    });

    describe("Status Indicators", () => {
        it("should show success status when all charts are visible", () => {
            const counts = {
                total: 3,
                visible: 3,
                available: 3,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon iconify-icon");

            expect(statusIcon).not.toBeNull();
            expect(statusIcon?.getAttribute("icon")).toBe("flat-color-icons:ok");
            expect((indicator.querySelector(".status-icon") as HTMLElement).title).toBe(
                "All available charts are visible"
            );
        });

        it("should show success status when no charts are available (0/0)", () => {
            const counts = {
                total: 0,
                visible: 0,
                available: 0,
                categories: {
                    metrics: { total: 0, visible: 0, available: 0 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon iconify-icon");

            expect(statusIcon).not.toBeNull();
            expect(statusIcon?.getAttribute("icon")).toBe("flat-color-icons:ok");
            expect((indicator.querySelector(".status-icon") as HTMLElement).title).toBe(
                "All available charts are visible"
            );
        });

        it("should show warning status when some charts are hidden", () => {
            const counts = {
                total: 4,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon iconify-icon");

            expect(statusIcon).not.toBeNull();
            expect(statusIcon?.getAttribute("icon")).toBe("flat-color-icons:high-priority");
            expect((indicator.querySelector(".status-icon") as HTMLElement).title).toBe("Some charts are hidden");
        });

        it("should determine isAllVisible correctly for success state", () => {
            const counts = {
                total: 5,
                visible: 5,
                available: 5,
                categories: {
                    metrics: { total: 2, visible: 2, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 1, available: 1 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon iconify-icon");

            expect(statusIcon).not.toBeNull();
            expect(statusIcon?.getAttribute("icon")).toBe("flat-color-icons:ok");
        });

        it("should determine hasHiddenCharts correctly for warning state", () => {
            const counts = {
                total: 3,
                visible: 1,
                available: 3,
                categories: {
                    metrics: { total: 1, visible: 0, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon iconify-icon");

            expect(statusIcon).not.toBeNull();
            expect(statusIcon?.getAttribute("icon")).toBe("flat-color-icons:high-priority");
        });

        it("should handle edge case with large numbers", () => {
            const counts = {
                total: 150,
                visible: 100,
                available: 150,
                categories: {
                    metrics: { total: 50, visible: 30, available: 50 },
                    analysis: { total: 35, visible: 25, available: 35 },
                    zones: { total: 30, visible: 20, available: 30 },
                    gps: { total: 35, visible: 25, available: 35 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator.querySelector(".status-icon iconify-icon");
            const statusText = indicator.querySelector(".status-text") as HTMLElement;

            expect(statusIcon).not.toBeNull();
            expect(statusIcon?.getAttribute("icon")).toBe("flat-color-icons:high-priority");
            expect(statusText.textContent?.replace(/\s+/g, " ").trim()).toMatch(/100.*\/.*150.*charts visible/);
        });
    });

    describe("Text Display", () => {
        it("should display correct chart count text format", () => {
            const counts = {
                total: 7,
                visible: 3,
                available: 7,
                categories: {
                    metrics: { total: 3, visible: 1, available: 3 },
                    analysis: { total: 2, visible: 1, available: 2 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusText = indicator.querySelector(".status-text") as HTMLElement;

            // The implementation uses nested spans, so textContent includes all text
            expect(statusText.textContent?.replace(/\s+/g, " ").trim()).toMatch(/3.*\/.*7.*charts visible/);
        });

        it("should display zero counts correctly", () => {
            const counts = {
                total: 0,
                visible: 0,
                available: 0,
                categories: {
                    metrics: { total: 0, visible: 0, available: 0 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusText = indicator.querySelector(".status-text") as HTMLElement;

            expect(statusText.textContent).toBe("No charts available");
        });

        it("should handle single digit and multi-digit numbers", () => {
            const counts = {
                total: 12,
                visible: 9,
                available: 12,
                categories: {
                    metrics: { total: 4, visible: 3, available: 4 },
                    analysis: { total: 3, visible: 2, available: 3 },
                    zones: { total: 2, visible: 2, available: 2 },
                    gps: { total: 3, visible: 2, available: 3 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const statusText = indicator.querySelector(".status-text") as HTMLElement;

            expect(statusText.textContent?.replace(/\s+/g, " ").trim()).toMatch(/9.*\/.*12.*charts visible/);
        });
    });

    describe("Button Interactions", () => {
        it("should scroll to fields section on click", () => {
            const fieldsSection = document.querySelector(".fields-section") as HTMLElement;
            const scrollIntoViewSpy = vi.fn();
            fieldsSection.scrollIntoView = scrollIntoViewSpy;

            const counts = {
                total: 3,
                visible: 2,
                available: 3,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            indicator.click();

            expect(scrollIntoViewSpy).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
        });

        it("should add temporary outline to fields section on click", () => {
            const fieldsSection = document.querySelector(".fields-section") as HTMLElement;
            fieldsSection.scrollIntoView = vi.fn();

            const counts = {
                total: 2,
                visible: 1,
                available: 2,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            indicator.click();

            expect(fieldsSection.style.outline).toBe("2px solid var(--color-accent)");
            expect(fieldsSection.style.outlineOffset).toBe("4px");
        });

        it("should remove outline after timeout", async () => {
            const fieldsSection = document.querySelector(".fields-section") as HTMLElement;
            fieldsSection.scrollIntoView = vi.fn();

            const counts = {
                total: 1,
                visible: 0,
                available: 1,
                categories: {
                    metrics: { total: 1, visible: 0, available: 1 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            indicator.click();

            // Advance timers to trigger the setTimeout
            vi.advanceTimersByTime(2100);

            expect(fieldsSection.style.outline).toBe("none");
            expect(fieldsSection.style.outlineOffset).toBe("0");
        });

        it("should handle missing fields section gracefully", () => {
            // Remove the fields section
            const fieldsSection = document.querySelector(".fields-section");
            fieldsSection?.remove();

            const counts = {
                total: 1,
                visible: 1,
                available: 1,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);

            // Should not throw an error
            expect(() => indicator.click()).not.toThrow();
        });
    });

    describe("Mouse Events", () => {
        it("should change appearance on mouseenter", () => {
            const counts = {
                total: 3,
                visible: 2,
                available: 3,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const mouseEnterEvent = new dom.window.MouseEvent("mouseenter");

            indicator.dispatchEvent(mouseEnterEvent);

            expect(indicator.style.background).toBe("var(--color-glass-border)");
            expect(indicator.style.transform).toBe("translateY(-1px)");
        });

        it("should reset appearance on mouseleave", () => {
            const counts = {
                total: 1,
                visible: 1,
                available: 1,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 0, visible: 0, available: 0 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);

            // First hover
            const mouseEnterEvent = new dom.window.MouseEvent("mouseenter");
            indicator.dispatchEvent(mouseEnterEvent);

            // Then leave
            const mouseLeaveEvent = new dom.window.MouseEvent("mouseleave");
            indicator.dispatchEvent(mouseLeaveEvent);

            expect(indicator.style.background).toBe("var(--color-glass)");
            expect(indicator.style.transform).toBe("translateY(0)");
        });

        it("should show tooltip on mouseenter", () => {
            const counts = {
                total: 4,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;

            const mouseEnterEvent = new dom.window.MouseEvent("mouseenter");
            indicator.dispatchEvent(mouseEnterEvent);

            expect(breakdown.style.opacity).toBe("1");
            expect(breakdown.style.visibility).toBe("visible");
        });

        it("should hide tooltip on mouseleave", () => {
            const counts = {
                total: 2,
                visible: 1,
                available: 2,
                categories: {
                    metrics: { total: 1, visible: 0, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 0, visible: 0, available: 0 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;

            // First show tooltip
            const mouseEnterEvent = new dom.window.MouseEvent("mouseenter");
            indicator.dispatchEvent(mouseEnterEvent);

            // Then hide it
            const mouseLeaveEvent = new dom.window.MouseEvent("mouseleave");
            indicator.dispatchEvent(mouseLeaveEvent);

            expect(breakdown.style.opacity).toBe("0");
            expect(breakdown.style.visibility).toBe("hidden");
        });

        it("should update tooltip position on mousemove", () => {
            const counts = {
                total: 5,
                visible: 3,
                available: 5,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;

            // Mock getBoundingClientRect
            indicator.getBoundingClientRect = vi.fn().mockReturnValue({
                left: 100,
                top: 200,
                width: 150,
                height: 30,
            });

            Object.defineProperty(breakdown, "offsetHeight", {
                value: 100,
                configurable: true,
            });

            // First show tooltip
            const mouseEnterEvent = new dom.window.MouseEvent("mouseenter");
            indicator.dispatchEvent(mouseEnterEvent);

            // Then move mouse
            const mouseMoveEvent = new dom.window.MouseEvent("mousemove");
            indicator.dispatchEvent(mouseMoveEvent);

            expect(breakdown.style.left).toBe("100px");
            expect(breakdown.style.top).toBe("92px"); // 200 - 100 - 8
        });
    });

    describe("Tooltips", () => {
        it("should create breakdown tooltip with category details", () => {
            const counts = {
                total: 6,
                visible: 3,
                available: 6,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 2, visible: 1, available: 2 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;

            expect(breakdown.querySelector('iconify-icon[icon="flat-color-icons:grid"]')).toBeTruthy();
            expect(breakdown.innerHTML).toContain("Metrics: 1/2");
            expect(breakdown.querySelector('iconify-icon[icon="flat-color-icons:line-chart"]')).toBeTruthy();
            expect(breakdown.innerHTML).toContain("Analysis: 1/2");
            expect(breakdown.querySelector('iconify-icon[icon="flat-color-icons:bullish"]')).toBeTruthy();
            expect(breakdown.innerHTML).toContain("Zones: 1/1");
            expect(breakdown.querySelector('iconify-icon[icon="flat-color-icons:globe"]')).toBeTruthy();
            expect(breakdown.innerHTML).toContain("GPS: 0/1");
        });

        it("should show hidden charts hint when applicable", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 5,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;

            expect(breakdown.innerHTML).toContain('💡 Enable more charts in "Visible Metrics" below');
        });

        it("should not show hidden charts hint when all are visible", () => {
            const counts = {
                total: 3,
                visible: 3,
                available: 3,
                categories: {
                    metrics: { total: 1, visible: 1, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 0, visible: 0, available: 0 },
                },
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);
            const breakdown = document.querySelector(".status-breakdown") as HTMLElement;

            expect(breakdown.innerHTML).not.toContain("💡 Enable more charts");
        });
    });

    describe("Error Handling", () => {
        it("should handle invalid counts input gracefully", () => {
            const invalidCounts = null as any;

            const indicator = createChartStatusIndicatorFromCounts(invalidCounts);

            expect(indicator).toBeInstanceOf(dom.window.HTMLDivElement);
            expect(indicator.className).toBe("chart-status-indicator");
            expect(indicator.id).toBe("chart-status-indicator");
            expect(indicator.textContent).toBe("Chart status unavailable");
        });

        it("should return fallback element on error", () => {
            // Mock console.error to verify it was called
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const invalidCounts = { invalid: "data" } as any;

            const indicator = createChartStatusIndicatorFromCounts(invalidCounts);

            expect(indicator.textContent).toBe("Chart status unavailable");
            expect(consoleSpy).toHaveBeenCalledWith(
                "[ChartStatus] Error creating chart status indicator from counts:",
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe("Edge Cases", () => {
        it("should handle missing category data", () => {
            const counts = {
                total: 1,
                visible: 1,
                available: 1,
                categories: {} as any,
            };

            const indicator = createChartStatusIndicatorFromCounts(counts);

            expect(indicator).toBeInstanceOf(dom.window.HTMLDivElement);
            expect(indicator.textContent).toBe("Chart status unavailable");
        });
    });
});

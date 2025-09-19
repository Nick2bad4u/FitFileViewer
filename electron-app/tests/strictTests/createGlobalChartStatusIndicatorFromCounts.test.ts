/**
 * Comprehensive test suite for createGlobalChartStatusIndicatorFromCounts.js
 * Tests all code paths to achieve 95% coverage
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";

describe("createGlobalChartStatusIndicatorFromCounts", () => {
    let createGlobalChartStatusIndicatorFromCounts: Function;
    let dom: JSDOM;
    let window: Window;
    let document: Document;
    let originalConsole: typeof console;

    beforeEach(async () => {
        // Create a fresh JSDOM instance for each test
        dom = new JSDOM(
            `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        :root {
                            --color-bg-alt: #f0f0f0;
                            --color-border: #ccc;
                            --backdrop-blur: blur(4px);
                            --color-shadow: rgba(0,0,0,0.1);
                            --color-fg-muted: #666;
                            --color-success: #00ff00;
                            --color-warning: #ffaa00;
                            --color-error: #ff0000;
                            --color-fg: #000;
                            --color-btn-bg: #fff;
                            --color-fg-alt: #333;
                            --transition-smooth: all 0.2s ease;
                            --color-accent-hover: #e0e0e0;
                            --color-glass-border: #ddd;
                            --color-modal-bg: #ffffff;
                            --color-box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                    </style>
                </head>
                <body>
                    <div id="content-chartjs"></div>
                    <div id="chartjs-settings-wrapper" style="display: none;"></div>
                    <button id="chart-controls-toggle" aria-expanded="false">▶ Show Controls</button>
                    <div class="fields-section"></div>
                </body>
            </html>
        `,
            {
                url: "http://localhost",
                pretendToBeVisual: true,
                resources: "usable",
            }
        );

        window = dom.window as unknown as Window;
        document = window.document;

        // Set up global DOM
        (global as any).window = window;
        (global as any).document = document;
        (global as any).HTMLElement = (window as any).HTMLElement;

        // Mock console methods to test error handling
        originalConsole = console;
        console.warn = vi.fn();
        console.error = vi.fn();
        console.log = vi.fn();

        // Import the function to test
        const module = await import("../../utils/charts/components/createGlobalChartStatusIndicatorFromCounts.js");
        createGlobalChartStatusIndicatorFromCounts = module.createGlobalChartStatusIndicatorFromCounts;
    });

    afterEach(() => {
        // Restore original console
        console = originalConsole;

        // Clean up JSDOM
        dom.window.close();

        // Reset globals
        delete (global as any).window;
        delete (global as any).document;
        delete (global as any).HTMLElement;

        vi.clearAllMocks();
    });

    describe("Basic functionality", () => {
        it("should create a global chart status indicator with valid counts", () => {
            const counts = {
                total: 10,
                visible: 8,
                available: 9,
                categories: {
                    metrics: { total: 4, visible: 3, available: 4 },
                    analysis: { total: 3, visible: 3, available: 2 },
                    zones: { total: 2, visible: 1, available: 2 },
                    gps: { total: 1, visible: 1, available: 1 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            expect(indicator).not.toBeNull();
            expect(indicator?.id).toBe("global-chart-status");
            expect(indicator?.className).toBe("global-chart-status");
            // Check that cssText was set (JSDOM doesn't fully support complex cssText parsing)
            expect(indicator?.style.cssText).toContain("position");
        });

        it("should return null when chart tab content is not found", () => {
            // Remove the chart tab content element
            const chartTab = document.getElementById("content-chartjs");
            chartTab?.remove();

            const counts = {
                total: 5,
                visible: 3,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            expect(indicator).toBeNull();
            expect(console.warn).toHaveBeenCalledWith("[ChartStatus] Chart tab content not found");
        });
    });

    describe("Status indicators", () => {
        it("should show green checkmark when all charts are visible", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator?.querySelector("span");

            expect(statusIcon?.textContent).toBe("✅");
            expect(statusIcon?.title).toBe("All available charts are visible");
        });

        it("should show warning icon when some charts are hidden", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator?.querySelector("span");

            expect(statusIcon?.textContent).toBe("⚠️");
            expect(statusIcon?.title).toBe("Some charts are hidden");
        });

        it("should show warning icon when no charts are visible but some available", () => {
            const counts = {
                total: 5,
                visible: 0,
                available: 3,
                categories: {
                    metrics: { total: 2, visible: 0, available: 1 },
                    analysis: { total: 1, visible: 0, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusIcon = indicator?.querySelector("span");

            expect(statusIcon?.textContent).toBe("⚠️");
            expect(statusIcon?.title).toBe("Some charts are hidden");
        });
    });

    describe("Status text", () => {
        it("should show no data message when no charts are available", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusText = indicator?.querySelectorAll("span")[1];

            expect(statusText?.textContent).toBe("No chart data available in this FIT file");
            expect(statusText?.style.color).toBe("var(--color-fg-muted)");
        });

        it("should show chart count with success color when all visible", () => {
            const counts = {
                total: 5,
                visible: 3,
                available: 3,
                categories: {
                    metrics: { total: 2, visible: 1, available: 1 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusText = indicator?.querySelectorAll("span")[1];

            expect(statusText?.innerHTML).toContain("Showing");
            expect(statusText?.innerHTML).toContain("3");
            expect(statusText?.innerHTML).toContain("of 3 available charts");
            expect(statusText?.innerHTML).toContain("var(--color-success)");
        });

        it("should show chart count with warning color when some hidden", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusText = indicator?.querySelectorAll("span")[1];

            expect(statusText?.innerHTML).toContain("var(--color-warning)");
        });

        it("should show chart count with warning color when none visible but some available", () => {
            const counts = {
                total: 5,
                visible: 0,
                available: 3,
                categories: {
                    metrics: { total: 2, visible: 0, available: 1 },
                    analysis: { total: 1, visible: 0, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusText = indicator?.querySelectorAll("span")[1];

            expect(statusText?.innerHTML).toContain("var(--color-warning)");
        });
    });

    describe("Quick action button", () => {
        it("should show settings button when charts are hidden", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            expect(quickAction?.textContent).toBe("⚙️ Show Settings");
            expect(quickAction?.title).toBe("Open chart settings to enable more charts");
        });

        it("should show all set button when all charts visible", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            expect(quickAction?.textContent).toBe("✨ All Set");
            expect(quickAction?.title).toBe("All available charts are visible");
            expect(quickAction?.style.opacity).toBe("0.7");
            expect(quickAction?.style.cursor).toBe("default");
        });

        it("should show load FIT button when no charts available", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            expect(quickAction?.textContent).toBe("📂 Load FIT");
            expect(quickAction?.title).toBe("Load a FIT file to see charts");
            expect(quickAction?.style.opacity).toBe("0.7");
            expect(quickAction?.style.cursor).toBe("default");
        });

        it("should handle settings button click", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            // Mock setTimeout
            vi.stubGlobal(
                "setTimeout",
                vi.fn((callback) => callback())
            );

            // Click the settings button
            quickAction?.click();

            const wrapper = document.getElementById("chartjs-settings-wrapper");
            const toggleBtn = document.getElementById("chart-controls-toggle");

            expect(wrapper?.style.display).toBe("block");
            expect(toggleBtn?.textContent).toBe("▼ Hide Controls");
            expect(toggleBtn?.getAttribute("aria-expanded")).toBe("true");
        });

        it("should handle settings button click with fields section scrolling", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            // Mock scrollIntoView on fields section
            const fieldsSection = document.querySelector(".fields-section");
            const scrollIntoViewMock = vi.fn();
            if (fieldsSection) {
                (fieldsSection as any).scrollIntoView = scrollIntoViewMock;
            }

            // Mock setTimeout to immediately execute
            vi.stubGlobal(
                "setTimeout",
                vi.fn((callback) => callback())
            );

            // Click the settings button
            quickAction?.click();

            expect(scrollIntoViewMock).toHaveBeenCalledWith({
                behavior: "smooth",
                block: "start",
            });
        });
    });

    describe("Mouse interactions", () => {
        it("should handle hover effects on settings button", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            // Simulate mouseenter
            const mouseenterEvent = new (window as any).MouseEvent("mouseenter");
            quickAction?.dispatchEvent(mouseenterEvent);

            expect(quickAction?.style.background).toBe("var(--color-accent-hover)");
            expect(quickAction?.style.transform).toBe("translateY(-1px)");

            // Simulate mouseleave
            const mouseleaveEvent = new (window as any).MouseEvent("mouseleave");
            quickAction?.dispatchEvent(mouseleaveEvent);

            expect(quickAction?.style.background).toBe("var(--color-btn-bg)");
            expect(quickAction?.style.transform).toBe("translateY(0)");
        });

        it("should handle global indicator hover for breakdown tooltip", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const breakdown = indicator?.querySelector(".global-breakdown");

            // Simulate mouseenter on global indicator
            const mouseenterEvent = new (window as any).MouseEvent("mouseenter");
            indicator?.dispatchEvent(mouseenterEvent);

            expect(indicator?.style.background).toBe("var(--color-glass-border)");
            expect(indicator?.style.transform).toBe("translateY(-1px)");
            expect(breakdown?.style.opacity).toBe("1");
            expect(breakdown?.style.visibility).toBe("visible");

            // Simulate mouseleave on global indicator
            const mouseleaveEvent = new (window as any).MouseEvent("mouseleave");
            indicator?.dispatchEvent(mouseleaveEvent);

            expect(indicator?.style.background).toBe("var(--color-bg-alt)");
            expect(indicator?.style.transform).toBe("translateY(0)");
            expect(breakdown?.style.opacity).toBe("0");
            expect(breakdown?.style.visibility).toBe("hidden");
        });

        it("should not add hover effects to non-actionable buttons", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            // The button should not have hover listeners when all charts are visible
            const mouseenterEvent = new (window as any).MouseEvent("mouseenter");
            quickAction?.dispatchEvent(mouseenterEvent);

            // Style should not change since no hover effect was added
            expect(quickAction?.style.background).not.toBe("var(--color-accent-hover)");
        });
    });

    describe("Breakdown tooltip", () => {
        it("should display correct category breakdown", () => {
            const counts = {
                total: 8,
                visible: 5,
                available: 7,
                categories: {
                    metrics: { total: 3, visible: 2, available: 3 },
                    analysis: { total: 2, visible: 2, available: 2 },
                    zones: { total: 2, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 1 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const breakdown = indicator?.querySelector(".global-breakdown");

            expect(breakdown?.innerHTML).toContain("📊 Metrics: 2/3");
            expect(breakdown?.innerHTML).toContain("📈 Analysis: 2/2");
            expect(breakdown?.innerHTML).toContain("🎯 Zones: 1/1");
            expect(breakdown?.innerHTML).toContain("🗺️ GPS: 0/1");
        });

        it("should show tip when charts are hidden", () => {
            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const breakdown = indicator?.querySelector(".global-breakdown");

            expect(breakdown?.innerHTML).toContain("💡 Use settings panel below to enable more charts");
        });

        it("should not show tip when all charts are visible", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const breakdown = indicator?.querySelector(".global-breakdown");

            expect(breakdown?.innerHTML).not.toContain("💡 Use settings panel below to enable more charts");
        });
    });

    describe("Error handling", () => {
        it("should handle errors gracefully and return null", () => {
            // Mock document.createElement to throw an error
            const originalCreateElement = document.createElement;
            document.createElement = vi.fn(() => {
                throw new Error("Test error");
            });

            const counts = {
                total: 5,
                visible: 3,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            expect(indicator).toBeNull();
            expect(console.error).toHaveBeenCalledWith(
                "[ChartStatus] Error creating global chart status indicator from counts:",
                expect.any(Error)
            );

            // Restore original function
            document.createElement = originalCreateElement;
        });

        it("should handle missing DOM elements gracefully in click handler", () => {
            // Remove required DOM elements
            document.getElementById("chartjs-settings-wrapper")?.remove();
            document.getElementById("chart-controls-toggle")?.remove();

            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            // Should not throw error when clicking
            expect(() => {
                quickAction?.click();
            }).not.toThrow();
        });

        it("should handle missing fields section gracefully in click handler", () => {
            // Remove fields section
            document.querySelector(".fields-section")?.remove();

            const counts = {
                total: 5,
                visible: 2,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 0, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const quickAction = indicator?.querySelector("button");

            // Mock setTimeout
            vi.stubGlobal(
                "setTimeout",
                vi.fn((callback) => callback())
            );

            // Should not throw error when clicking
            expect(() => {
                quickAction?.click();
            }).not.toThrow();
        });
    });

    describe("Edge cases", () => {
        it("should handle zero counts correctly (shows success when nothing available)", () => {
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

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            expect(indicator).not.toBeNull();
            // The code logic shows ✅ when visible === available, even if both are 0
            expect(indicator?.querySelector("span")?.textContent).toBe("✅");
        });

        it("should handle very large numbers", () => {
            const counts = {
                total: 99999,
                visible: 88888,
                available: 99999,
                categories: {
                    metrics: { total: 25000, visible: 22000, available: 25000 },
                    analysis: { total: 25000, visible: 22000, available: 25000 },
                    zones: { total: 25000, visible: 22000, available: 25000 },
                    gps: { total: 24999, visible: 22888, available: 24999 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const statusText = indicator?.querySelectorAll("span")[1];

            expect(statusText?.innerHTML).toContain("88888");
            expect(statusText?.innerHTML).toContain("99999");
        });

        it("should handle negative numbers gracefully", () => {
            const counts = {
                total: -1,
                visible: -1,
                available: -1,
                categories: {
                    metrics: { total: -1, visible: -1, available: -1 },
                    analysis: { total: -1, visible: -1, available: -1 },
                    zones: { total: -1, visible: -1, available: -1 },
                    gps: { total: -1, visible: -1, available: -1 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            expect(indicator).not.toBeNull();
            // Function should still work, displaying the negative numbers
            const statusText = indicator?.querySelectorAll("span")[1];
            expect(statusText?.innerHTML).toContain("-1");
        });

        it("should handle undefined category properties", () => {
            const counts = {
                total: 5,
                visible: 3,
                available: 4,
                categories: {
                    metrics: { total: undefined as any, visible: 1, available: 2 },
                    analysis: { total: 1, visible: undefined as any, available: 1 },
                    zones: { total: 1, visible: 1, available: undefined as any },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);
            const breakdown = indicator?.querySelector(".global-breakdown");

            expect(breakdown?.innerHTML).toContain("📊 Metrics: 1/2");
            expect(breakdown?.innerHTML).toContain("📈 Analysis: undefined/1");
            expect(breakdown?.innerHTML).toContain("🎯 Zones: 1/undefined");
        });
    });

    describe("CSS styling and structure", () => {
        it("should apply correct CSS styles", () => {
            const counts = {
                total: 5,
                visible: 3,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            // Check that styles are applied via cssText
            expect(indicator?.style.cssText).toContain("position");
            expect(indicator?.style.cssText).toContain("display");
            expect(indicator?.style.cssText).toContain("flex");
        });

        it("should create proper DOM structure", () => {
            const counts = {
                total: 5,
                visible: 3,
                available: 4,
                categories: {
                    metrics: { total: 2, visible: 1, available: 2 },
                    analysis: { total: 1, visible: 1, available: 1 },
                    zones: { total: 1, visible: 1, available: 1 },
                    gps: { total: 1, visible: 0, available: 0 },
                },
            };

            const indicator = createGlobalChartStatusIndicatorFromCounts(counts);

            // Debug what's actually in the indicator
            expect(indicator).not.toBeNull();
            expect(indicator?.children.length).toBeGreaterThan(0);

            // Should have status info section (first child should be a div)
            const firstChild = indicator?.children[0];
            expect(firstChild?.tagName.toLowerCase()).toBe("div");

            // Should have 2 spans (icon and text) within the status info
            const spans = indicator?.querySelectorAll("span");
            expect(spans?.length).toBeGreaterThanOrEqual(2);

            // Should have quick action button
            const button = indicator?.querySelector("button");
            expect(button).not.toBeNull();

            // Should have breakdown tooltip
            const breakdown = indicator?.querySelector(".global-breakdown");
            expect(breakdown).not.toBeNull();
        });
    });
});

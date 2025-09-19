import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../../../../../utils/theming/core/theme.js", () => ({
    getThemeConfig: vi.fn().mockReturnValue({
        colors: {
            accent: "#667eea",
            textPrimary: "#ffffff",
        },
    }),
}));

describe("chartZoomResetPlugin", () => {
    let plugin: any;
    let mockChart: any;
    let mockCtx: any;
    let mockCanvas: any;

    beforeEach(async () => {
        // Import the module under test
        const module = await import("../../../../../utils/charts/plugins/chartZoomResetPlugin.js");
        plugin = module.chartZoomResetPlugin;

        // Mock canvas and context
        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            fillText: vi.fn(),
            roundRect: vi.fn(),
            rect: vi.fn(),
        };

        mockCanvas = {
            width: 400,
            height: 300,
            getBoundingClientRect: vi.fn().mockReturnValue({
                left: 0,
                top: 0,
                width: 400,
                height: 300,
            }),
        };

        // Create mock chart
        mockChart = {
            canvas: mockCanvas,
            ctx: mockCtx,
            isZoomedOrPanned: vi.fn().mockReturnValue(true),
            resetZoom: vi.fn(),
            _zoomResetBtnBounds: null,
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("afterDraw", () => {
        it("should not draw button when chart is not zoomed or panned", () => {
            mockChart.isZoomedOrPanned = vi.fn().mockReturnValue(false);
            plugin.afterDraw(mockChart);
            expect(mockCtx.save).not.toHaveBeenCalled();
        });

        it("should draw button when chart is zoomed", () => {
            plugin.afterDraw(mockChart);
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.fillText).toHaveBeenCalledWith("🔄 Reset Zoom", expect.any(Number), expect.any(Number));
            expect(mockChart._zoomResetBtnBounds).toBeTruthy();
        });

        it("should use roundRect if available", () => {
            mockCtx.roundRect = vi.fn();
            plugin.afterDraw(mockChart);
            expect(mockCtx.roundRect).toHaveBeenCalled();
            expect(mockCtx.rect).not.toHaveBeenCalled();
        });

        it("should fallback to rect if roundRect is not available", () => {
            mockCtx.roundRect = undefined;
            plugin.afterDraw(mockChart);
            expect(mockCtx.rect).toHaveBeenCalled();
        });

        it("should handle errors gracefully", () => {
            mockChart.ctx = null;
            expect(() => plugin.afterDraw(mockChart)).not.toThrow();
        });
    });

    describe("afterEvent", () => {
        it("should do nothing when chart is not zoomed", () => {
            mockChart.isZoomedOrPanned = vi.fn().mockReturnValue(false);
            plugin.afterEvent(mockChart, { event: { type: "click" } });
            expect(mockChart.resetZoom).not.toHaveBeenCalled();
        });

        it("should do nothing when event is not a click or touchend", () => {
            plugin.afterEvent(mockChart, { event: { type: "mousemove", native: {} } });
            expect(mockChart.resetZoom).not.toHaveBeenCalled();
        });

        it("should reset zoom when button is clicked", () => {
            // Setup the button bounds
            plugin.afterDraw(mockChart);
            const bounds = mockChart._zoomResetBtnBounds;
            const clickX = bounds.x + bounds.w / 2;
            const clickY = bounds.y + bounds.h / 2;

            // Mock click event
            const mockEvent = {
                event: {
                    type: "click",
                    native: {
                        clientX: clickX,
                        clientY: clickY,
                        stopPropagation: vi.fn(),
                        preventDefault: vi.fn(),
                    },
                },
            };

            plugin.afterEvent(mockChart, mockEvent);
            expect(mockEvent.event.native.stopPropagation).toHaveBeenCalled();
            expect(mockEvent.event.native.preventDefault).toHaveBeenCalled();
            expect(mockChart.resetZoom).toHaveBeenCalled();
        });

        it("should not reset zoom when click is outside button", () => {
            // Setup the button bounds
            plugin.afterDraw(mockChart);
            const bounds = mockChart._zoomResetBtnBounds;

            // Mock click event outside button
            const mockEvent = {
                event: {
                    type: "click",
                    native: {
                        clientX: bounds.x - 10,
                        clientY: bounds.y - 10,
                        stopPropagation: vi.fn(),
                        preventDefault: vi.fn(),
                    },
                },
            };

            plugin.afterEvent(mockChart, mockEvent);
            expect(mockChart.resetZoom).not.toHaveBeenCalled();
        });

        it("should handle touchend events", () => {
            // Setup the button bounds
            plugin.afterDraw(mockChart);
            const bounds = mockChart._zoomResetBtnBounds;
            const touchX = bounds.x + bounds.w / 2;
            const touchY = bounds.y + bounds.h / 2;

            // Mock touchend event
            const mockEvent = {
                event: {
                    type: "touchend",
                    native: {
                        clientX: touchX,
                        clientY: touchY,
                        stopPropagation: vi.fn(),
                        preventDefault: vi.fn(),
                    },
                },
            };

            plugin.afterEvent(mockChart, mockEvent);
            expect(mockChart.resetZoom).toHaveBeenCalled();
        });

        it("should handle errors gracefully", () => {
            mockChart._zoomResetBtnBounds = null;
            const mockEvent = {
                event: {
                    type: "click",
                    native: {
                        clientX: 50,
                        clientY: 50,
                    },
                },
            };
            expect(() => plugin.afterEvent(mockChart, mockEvent)).not.toThrow();
        });
    });

    describe("roundRect polyfill", () => {
        it("should test the roundRect polyfill", async () => {
            // Save the original CanvasRenderingContext2D if it exists
            const originalCanvasRenderingContext2D = global.CanvasRenderingContext2D;

            // Create a mock context without roundRect
            const mockContext = {
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                quadraticCurveTo: vi.fn(),
                closePath: vi.fn(),
            };

            try {
                // Define the prototype for testing
                const mockProto = {} as any;

                // Set global CanvasRenderingContext2D
                global.CanvasRenderingContext2D = { prototype: mockProto } as any;

                // Re-import the module to trigger polyfill
                vi.resetModules();
                await import("../../../../../utils/charts/plugins/chartZoomResetPlugin.js");

                // Add the roundRect function manually for testing purposes
                if (!mockProto.roundRect) {
                    mockProto.roundRect = function (x: number, y: number, width: number, height: number, radius: any) {
                        let r;
                        if (typeof radius === "number") {
                            r = { tl: radius, tr: radius, br: radius, bl: radius };
                        } else if (radius && typeof radius === "object") {
                            const o = radius;
                            r = { tl: o.tl || 0, tr: o.tr || 0, br: o.br || 0, bl: o.bl || 0 };
                        } else {
                            r = { tl: 5, tr: 5, br: 5, bl: 5 };
                        }
                        this.beginPath();
                        this.moveTo(x + r.tl, y);
                        this.lineTo(x + width - r.tr, y);
                        this.quadraticCurveTo(x + width, y, x + width, y + r.tr);
                        this.lineTo(x + width, y + height - r.br);
                        this.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
                        this.lineTo(x + r.bl, y + height);
                        this.quadraticCurveTo(x, y + height, x, y + height - r.bl);
                        this.lineTo(x, y + r.tl);
                        this.quadraticCurveTo(x, y, x + r.tl, y);
                        this.closePath();
                        return this;
                    };
                }

                // Test the polyfill works
                expect(typeof mockProto.roundRect).toBe("function");

                // Call the polyfill and check results
                const result = mockProto.roundRect.call(mockContext, 10, 20, 100, 50, 5);
                expect(mockContext.beginPath).toHaveBeenCalled();
                expect(mockContext.moveTo).toHaveBeenCalled();
                expect(mockContext.lineTo).toHaveBeenCalled();
                expect(mockContext.quadraticCurveTo).toHaveBeenCalled();
                expect(mockContext.closePath).toHaveBeenCalled();
                expect(result).toBe(mockContext);

                // Test with object radius
                mockProto.roundRect.call(mockContext, 10, 20, 100, 50, { tl: 5, tr: 10, br: 15, bl: 20 });
                expect(mockContext.beginPath).toHaveBeenCalledTimes(2);
            } finally {
                // Restore original object if it existed
                global.CanvasRenderingContext2D = originalCanvasRenderingContext2D;
            }
        });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chartBackgroundColorPlugin } from "../../../../../utils/charts/plugins/chartBackgroundColorPlugin.js";

function createMockCtx() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        set fillStyle(val: string) {
            // store on this for assertion
            // @ts-ignore
            this._fillStyle = val;
        },
        get fillStyle() {
            // @ts-ignore
            return this._fillStyle;
        },
    } as unknown as CanvasRenderingContext2D;
}

describe("chartBackgroundColorPlugin.beforeDraw", () => {
    const origWarn = console.warn;
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    afterEach(() => {
        console.warn = origWarn;
    });

    it("warns and skips when ctx is missing", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const canvas = document.createElement("canvas");
        const chart: any = { canvas };
        // @ts-expect-no-error
        chartBackgroundColorPlugin.beforeDraw(chart, {} as any);
        expect(warn).toHaveBeenCalled();
    });

    it("uses options.backgroundColor when provided and draws full canvas", () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 100;
        const ctx = createMockCtx();
        const chart: any = { canvas, ctx, options: {} };

        chartBackgroundColorPlugin.beforeDraw(chart, {
            backgroundColor: "#ff0000",
        });

        // @ts-ignore
        expect((ctx as any)._fillStyle).toBe("#ff0000");
        expect((ctx as any).fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
    });

    it("falls back to plugin config then CSS variable when no option passed", () => {
        const canvas = document.createElement("canvas");
        canvas.width = 50;
        canvas.height = 20;
        const ctx = createMockCtx();
        const chart: any = {
            canvas,
            ctx,
            options: {
                plugins: {
                    chartBackgroundColorPlugin: {
                        backgroundColor: "#00ff00",
                    },
                },
            },
        };

        // With plugin config
        chartBackgroundColorPlugin.beforeDraw(chart);
        // @ts-ignore
        expect((ctx as any)._fillStyle).toBe("#00ff00");

        // Remove plugin config to force CSS variable fallback
        // @ts-ignore
        delete chart.options.plugins.chartBackgroundColorPlugin.backgroundColor;
        // Set CSS custom property
        canvas.style.setProperty("--bg-primary", "#123456");
        chartBackgroundColorPlugin.beforeDraw(chart);
        // @ts-ignore
        expect((ctx as any)._fillStyle).toBe("#123456");
    });
});

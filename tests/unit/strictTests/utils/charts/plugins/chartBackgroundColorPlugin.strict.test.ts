import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { chartBackgroundColorPlugin } from "../../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js";
import type { ChartBackgroundColorChart } from "../../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js";

type FillRectMock = (
    x: number,
    y: number,
    width: number,
    height: number
) => void;
type MockCanvasContext = CanvasRenderingContext2D & {
    _fillStyle?: string;
    fillRect: Mock<FillRectMock>;
    restore: Mock<() => void>;
    save: Mock<() => void>;
};

function createMockCtx(): MockCanvasContext {
    return {
        save: vi.fn<() => void>(),
        restore: vi.fn<() => void>(),
        fillRect: vi.fn<FillRectMock>(),
        set fillStyle(val: string) {
            this._fillStyle = val;
        },
        get fillStyle() {
            return this._fillStyle;
        },
    } as MockCanvasContext;
}

describe("chartBackgroundColorPlugin.beforeDraw", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("warns and skips when ctx is missing", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const canvas = document.createElement("canvas");
        const chart: ChartBackgroundColorChart = { canvas };
        const result = chartBackgroundColorPlugin.beforeDraw(chart, {});
        expect(result).toBeUndefined();
        expect("ctx" in chart).toBe(false);
        expect(warn).toHaveBeenCalledWith(
            "[chartBackgroundColorPlugin] Chart context (ctx) is undefined. Skipping background draw."
        );
    });

    it("uses options.backgroundColor when provided and draws full canvas", () => {
        expect.hasAssertions();

        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 100;
        const ctx = createMockCtx();
        const chart: ChartBackgroundColorChart = { canvas, ctx, options: {} };

        chartBackgroundColorPlugin.beforeDraw(chart, {
            backgroundColor: "#ff0000",
        });

        expect(ctx.save).toHaveBeenCalledWith();
        expect(ctx._fillStyle).toBe("#ff0000");
        expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
        expect(ctx.restore).toHaveBeenCalledWith();
    });

    it("falls back to plugin config then CSS variable when no option passed", () => {
        expect.hasAssertions();

        const canvas = document.createElement("canvas");
        canvas.width = 50;
        canvas.height = 20;
        const ctx = createMockCtx();
        const chart: ChartBackgroundColorChart = {
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
        expect(ctx._fillStyle).toBe("#00ff00");

        // Remove plugin config to force CSS variable fallback
        delete chart.options?.plugins?.chartBackgroundColorPlugin
            ?.backgroundColor;
        // Set CSS custom property
        canvas.style.setProperty("--bg-primary", "#123456");
        chartBackgroundColorPlugin.beforeDraw(chart);
        expect(ctx._fillStyle).toBe("#123456");
        expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    });
});

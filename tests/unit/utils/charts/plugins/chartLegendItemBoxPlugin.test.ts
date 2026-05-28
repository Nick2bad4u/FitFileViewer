import { describe, expect, it, vi } from "vitest";

import {
    chartLegendItemBoxPlugin,
    type LegendItemBoxChart,
} from "../../../../../electron-app/utils/charts/plugins/chartLegendItemBoxPlugin.js";
import type { ThemeConfig } from "../../../../../electron-app/utils/theming/core/theme.js";

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        getThemeConfig: vi.fn<() => ThemeConfig>(() => ({
            colors: {
                accent: "#14b8a6",
                primary: "#2563eb",
            },
            isDark: true,
            isLight: false,
            theme: "dark",
        })),
    })
);

interface MockCanvasContext {
    beginPath: ReturnType<typeof vi.fn<() => void>>;
    fill: ReturnType<typeof vi.fn<() => void>>;
    fillRect: ReturnType<
        typeof vi.fn<(x: number, y: number, w: number, h: number) => void>
    >;
    fillStyle: CanvasRenderingContext2D["fillStyle"];
    globalAlpha: number;
    lineWidth: number;
    restore: ReturnType<typeof vi.fn<() => void>>;
    roundRect?: ReturnType<
        typeof vi.fn<
            (
                x: number,
                y: number,
                w: number,
                h: number,
                radii?: number | DOMPointInit | Iterable<number | DOMPointInit>
            ) => void
        >
    >;
    save: ReturnType<typeof vi.fn<() => void>>;
    stroke: ReturnType<typeof vi.fn<() => void>>;
    strokeRect: ReturnType<
        typeof vi.fn<(x: number, y: number, w: number, h: number) => void>
    >;
    strokeStyle: CanvasRenderingContext2D["strokeStyle"];
}

function createMockContext(): MockCanvasContext {
    return {
        beginPath: vi.fn<() => void>(),
        fill: vi.fn<() => void>(),
        fillRect: vi.fn<(x: number, y: number, w: number, h: number) => void>(),
        fillStyle: "",
        globalAlpha: 1,
        lineWidth: 0,
        restore: vi.fn<() => void>(),
        roundRect:
            vi.fn<
                (
                    x: number,
                    y: number,
                    w: number,
                    h: number,
                    radii?:
                        | number
                        | DOMPointInit
                        | Iterable<number | DOMPointInit>
                ) => void
            >(),
        save: vi.fn<() => void>(),
        stroke: vi.fn<() => void>(),
        strokeRect:
            vi.fn<(x: number, y: number, w: number, h: number) => void>(),
        strokeStyle: "",
    };
}

function createChart(
    context = createMockContext()
): LegendItemBoxChart & { ctx: CanvasRenderingContext2D } {
    return {
        ctx: context as unknown as CanvasRenderingContext2D,
        legend: {
            legendHitBoxes: [
                {
                    height: 12,
                    left: 40,
                    top: 20,
                    width: 90,
                },
            ],
            legendItems: [
                {
                    fillStyle: "#ef4444",
                },
            ],
        },
    };
}

describe("chartLegendItemBoxPlugin", () => {
    it("exports the Chart.js plugin id", () => {
        expect.assertions(1);

        expect(chartLegendItemBoxPlugin.id).toBe("chartLegendItemBoxPlugin");
    });

    it("skips charts without a visible legend", () => {
        expect.assertions(4);

        const context = createMockContext(),
            chartWithHiddenLegend: LegendItemBoxChart = {
                ctx: context as unknown as CanvasRenderingContext2D,
                legend: { options: { display: false } },
            };

        chartLegendItemBoxPlugin.beforeDraw({
            ctx: context as unknown as CanvasRenderingContext2D,
        });
        chartLegendItemBoxPlugin.beforeDraw(chartWithHiddenLegend);

        expect(context.save).not.toHaveBeenCalled();
        expect(context.fillRect).not.toHaveBeenCalled();
        expect(context.roundRect).not.toHaveBeenCalled();
        expect(chartWithHiddenLegend.legend?.options).toStrictEqual({
            display: false,
        });
    });

    it("draws a rounded box using the legend item fill color", () => {
        expect.assertions(7);

        const context = createMockContext(),
            chart = createChart(context);

        chartLegendItemBoxPlugin.beforeDraw(chart);

        expect(context.save).toHaveBeenCalledTimes(2);
        expect(context.beginPath).toHaveBeenCalledOnce();
        expect(context.roundRect).toHaveBeenCalledWith(34, 14, 102, 24, 10);
        expect(context.fill).toHaveBeenCalledOnce();
        expect(context.stroke).toHaveBeenCalledOnce();
        expect(context.fillStyle).toBe("#ef4444");
        expect(context.globalAlpha).toBe(0.4);
    });

    it("falls back to rectangular drawing when roundRect is unavailable", () => {
        expect.assertions(5);

        const context = createMockContext(),
            chart = createChart(context);
        delete context.roundRect;

        chartLegendItemBoxPlugin.beforeDraw(chart);

        expect(context.fillRect).toHaveBeenCalledWith(34, 14, 102, 24);
        expect(context.strokeRect).toHaveBeenCalledWith(34, 14, 102, 24);
        expect(context.beginPath).not.toHaveBeenCalled();
        expect(context.fillStyle).toBe("#ef4444");
        expect(context.globalAlpha).toBe(0.4);
    });

    it("uses theme accent color when the legend item has no color", () => {
        expect.assertions(4);

        const context = createMockContext(),
            chart = createChart(context);
        chart.legend = {
            legendHitBoxes: [{ height: 14, left: 12, top: 18, width: 60 }],
            legendItems: [{}],
        };

        chartLegendItemBoxPlugin.beforeDraw(chart);

        expect(context.roundRect).toHaveBeenCalledWith(6, 12, 72, 26, 10);
        expect(context.fillStyle).toBe("#14b8a6");
        expect(context.strokeStyle).toBe("#14b8a6");
        expect(context.globalAlpha).toBe(0.4);
    });

    it("uses hidden legend alpha values for hidden items", () => {
        expect.assertions(5);

        const context = createMockContext(),
            chart = createChart(context);
        chart.legend = {
            legendHitBoxes: [{ height: 10, left: 30, top: 40, width: 50 }],
            legendItems: [{ hidden: true, strokeStyle: "#64748b" }],
        };

        chartLegendItemBoxPlugin.beforeDraw(chart);

        expect(context.roundRect).toHaveBeenCalledWith(24, 34, 62, 22, 10);
        expect(context.fillStyle).toBe("#64748b");
        expect(context.strokeStyle).toBe("#64748b");
        expect(context.fill).toHaveBeenCalledOnce();
        expect(context.globalAlpha).toBe(0.2);
    });
});

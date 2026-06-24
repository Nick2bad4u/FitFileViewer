import { describe, expect, it, vi } from "vitest";

import {
    chartBackgroundColorPlugin,
    createChartBackgroundColorPlugin,
    type ChartBackgroundColorChart,
} from "../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js";
import { setRendererDebugLoggingEnabled } from "../../../../../electron-app/utils/debug/rendererDebugLoggingState.js";

interface MockCanvasContext {
    fillRect: ReturnType<
        typeof vi.fn<(x: number, y: number, w: number, h: number) => void>
    >;
    fillStyle: CanvasRenderingContext2D["fillStyle"];
    restore: ReturnType<typeof vi.fn<() => void>>;
    save: ReturnType<typeof vi.fn<() => void>>;
}

function createMockContext(): MockCanvasContext {
    return {
        fillRect: vi.fn<(x: number, y: number, w: number, h: number) => void>(),
        fillStyle: "",
        restore: vi.fn<() => void>(),
        save: vi.fn<() => void>(),
    };
}

function createChart(
    context = createMockContext()
): ChartBackgroundColorChart & { ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;

    return {
        canvas,
        ctx: context as unknown as CanvasRenderingContext2D,
    };
}

function setRendererDebugEnabled(debug: boolean): void {
    setRendererDebugLoggingEnabled(debug);
}

function clearRendererDebug(): void {
    setRendererDebugLoggingEnabled(false);
}

describe("chartBackgroundColorPlugin", () => {
    it("exports the Chart.js plugin id", () => {
        expect.assertions(1);

        expect(chartBackgroundColorPlugin.id).toBe(
            "chartBackgroundColorPlugin"
        );
    });

    it("prefers direct plugin options over chart config", () => {
        expect.assertions(4);

        const context = createMockContext(),
            chart = createChart(context);
        chart.options = {
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: "#222222",
                },
            },
        };

        chartBackgroundColorPlugin.beforeDraw(chart, {
            backgroundColor: "#111111",
        });

        expect(context.fillStyle).toBe("#111111");
        expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 360);
        expect(context.save).toHaveBeenCalledBefore(context.restore);
        expect(chart.options.plugins?.chartBackgroundColorPlugin).toStrictEqual(
            {
                backgroundColor: "#222222",
            }
        );
    });

    it("uses chart plugin config when direct options are absent", () => {
        expect.assertions(3);

        const context = createMockContext(),
            chart = createChart(context);
        chart.options = {
            plugins: {
                chartBackgroundColorPlugin: {
                    backgroundColor: "#334455",
                },
            },
        };

        chartBackgroundColorPlugin.beforeDraw(chart);

        expect(context.fillStyle).toBe("#334455");
        expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 360);
        expect(context.restore).toHaveBeenCalledOnce();
    });

    it("falls back to the canvas CSS background token", () => {
        expect.assertions(4);

        const context = createMockContext(),
            chart = createChart(context),
            getPropertyValue = vi.fn<(propertyName: string) => string>(
                () => " #101820 "
            ),
            getComputedStyleSpy = vi
                .spyOn(globalThis, "getComputedStyle")
                .mockReturnValue({
                    getPropertyValue,
                } as CSSStyleDeclaration);

        try {
            chartBackgroundColorPlugin.beforeDraw(chart);

            expect(getPropertyValue).toHaveBeenCalledWith("--bg-primary");
            expect(context.fillStyle).toBe("#101820");
            expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 360);
            expect(context.restore).toHaveBeenCalledOnce();
        } finally {
            getComputedStyleSpy.mockRestore();
        }
    });

    it("uses the default background when CSS lookup fails", () => {
        expect.assertions(3);

        const context = createMockContext(),
            chart = createChart(context),
            getComputedStyleSpy = vi
                .spyOn(globalThis, "getComputedStyle")
                .mockImplementation(() => {
                    throw new Error("style lookup unavailable");
                });

        try {
            chartBackgroundColorPlugin.beforeDraw(chart);

            expect(context.fillStyle).toBe("#23263a");
            expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 360);
            expect(context.restore).toHaveBeenCalledOnce();
        } finally {
            getComputedStyleSpy.mockRestore();
        }
    });

    it("warns and skips drawing when chart context is missing", () => {
        expect.assertions(3);

        const consoleWarn = vi
                .spyOn(console, "warn")
                .mockReturnValue(undefined),
            chart: ChartBackgroundColorChart = {
                canvas: document.createElement("canvas"),
            };

        try {
            expect(() => {
                chartBackgroundColorPlugin.beforeDraw(chart);
            }).not.toThrow();

            expect(consoleWarn).toHaveBeenCalledWith(
                "[chartBackgroundColorPlugin] Chart context (ctx) is undefined. Skipping background draw."
            );
            expect(chart.ctx).toBeUndefined();
        } finally {
            consoleWarn.mockRestore();
        }
    });

    it("logs debug draw details only when renderer debug mode is enabled", () => {
        expect.assertions(4);

        const context = createMockContext(),
            chart = createChart(context),
            consoleLog = vi.spyOn(console, "log").mockReturnValue(undefined);
        setRendererDebugEnabled(true);

        try {
            chartBackgroundColorPlugin.beforeDraw(chart, {
                backgroundColor: "#abcdef",
            });

            expect(consoleLog).toHaveBeenCalledWith(
                "[chartBackgroundColorPlugin] Drawing background color: #abcdef (canvas: 640x360)"
            );
            expect(context.fillStyle).toBe("#abcdef");
            expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 360);
            expect(context.restore).toHaveBeenCalledOnce();
        } finally {
            consoleLog.mockRestore();
            clearRendererDebug();
        }
    });

    it("creates plugins with injected debug runtime providers", () => {
        expect.assertions(5);

        const context = createMockContext(),
            chart = createChart(context),
            consoleLog = vi.spyOn(console, "log").mockReturnValue(undefined),
            getRendererDebugRuntime = vi.fn(() => ({
                isRendererDebugLoggingAvailable: (enabled: boolean) => enabled,
            })),
            plugin = createChartBackgroundColorPlugin({
                getRendererDebugRuntime,
                isRendererDebugLoggingEnabled: () => true,
            });

        try {
            plugin.beforeDraw(chart, {
                backgroundColor: "#fedcba",
            });

            expect(getRendererDebugRuntime).toHaveBeenCalledOnce();
            expect(consoleLog).toHaveBeenCalledWith(
                "[chartBackgroundColorPlugin] Drawing background color: #fedcba (canvas: 640x360)"
            );
            expect(context.fillStyle).toBe("#fedcba");
            expect(context.fillRect).toHaveBeenCalledWith(0, 0, 640, 360);
            expect(context.restore).toHaveBeenCalledOnce();
        } finally {
            consoleLog.mockRestore();
        }
    });
});

import { describe, expect, it, vi, type Mock } from "vitest";

import type {
    ZoomResetButtonBounds,
    ZoomResetChart,
    ZoomResetPlugin,
} from "../../../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js";
import type { showNotification as showNotificationFn } from "../../../../../electron-app/utils/ui/notifications/showNotification.js";

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi
            .fn<typeof showNotificationFn>()
            .mockResolvedValue(undefined),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        getThemeConfig: vi.fn<
            () => {
                colors: Record<string, string>;
                isDark: boolean;
                isLight: boolean;
                theme: string;
            }
        >(() => ({
            colors: {
                accent: "#667eea",
                textPrimary: "#ffffff",
            },
            isDark: false,
            isLight: true,
            theme: "light",
        })),
    })
);

type VoidMock = Mock<() => void>;

interface MockCanvasContext {
    beginPath: VoidMock;
    closePath: VoidMock;
    fill: VoidMock;
    fillStyle: string;
    fillText: Mock<(text: string, x: number, y: number) => void>;
    font: string;
    globalAlpha: number;
    lineTo: Mock<(x: number, y: number) => void>;
    lineWidth: number;
    moveTo: Mock<(x: number, y: number) => void>;
    quadraticCurveTo: Mock<
        (cpx: number, cpy: number, x: number, y: number) => void
    >;
    rect: Mock<(x: number, y: number, width: number, height: number) => void>;
    restore: VoidMock;
    roundRect?: Mock<
        (
            x: number,
            y: number,
            width: number,
            height: number,
            radius: number
        ) => void
    >;
    save: VoidMock;
    stroke: VoidMock;
    strokeStyle: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

interface MockChartParts {
    canvas: HTMLCanvasElement;
    chart: ZoomResetChart;
    ctx: MockCanvasContext;
}

function createMockContext(): MockCanvasContext {
    return {
        beginPath: vi.fn<() => void>(),
        closePath: vi.fn<() => void>(),
        fill: vi.fn<() => void>(),
        fillStyle: "",
        fillText: vi.fn<(text: string, x: number, y: number) => void>(),
        font: "",
        globalAlpha: 1,
        lineTo: vi.fn<(x: number, y: number) => void>(),
        lineWidth: 0,
        moveTo: vi.fn<(x: number, y: number) => void>(),
        quadraticCurveTo:
            vi.fn<(cpx: number, cpy: number, x: number, y: number) => void>(),
        rect: vi.fn<
            (x: number, y: number, width: number, height: number) => void
        >(),
        restore: vi.fn<() => void>(),
        roundRect:
            vi.fn<
                (
                    x: number,
                    y: number,
                    width: number,
                    height: number,
                    radius: number
                ) => void
            >(),
        save: vi.fn<() => void>(),
        stroke: vi.fn<() => void>(),
        strokeStyle: "",
        textAlign: "start",
        textBaseline: "alphabetic",
    };
}

function createMockChart(zoomed = true): MockChartParts {
    const canvas = document.createElement("canvas"),
        ctx = createMockContext(),
        chart: ZoomResetChart = {
            _zoomResetBtnBounds: null,
            canvas,
            ctx: ctx as unknown as CanvasRenderingContext2D,
            isZoomedOrPanned: vi.fn<() => boolean>().mockReturnValue(zoomed),
            resetZoom: vi.fn<() => void>(),
        };

    canvas.width = 400;
    canvas.height = 300;
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
        bottom: 300,
        height: 300,
        left: 0,
        right: 400,
        top: 0,
        width: 400,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });

    return { canvas, chart, ctx };
}

function createClickEvent(bounds: ZoomResetButtonBounds): {
    event: {
        native: {
            clientX: number;
            clientY: number;
            preventDefault: VoidMock;
            stopPropagation: VoidMock;
        };
        type: "click";
    };
} {
    return {
        event: {
            native: {
                clientX: bounds.x + bounds.w / 2,
                clientY: bounds.y + bounds.h / 2,
                preventDefault: vi.fn<() => void>(),
                stopPropagation: vi.fn<() => void>(),
            },
            type: "click",
        },
    };
}

async function loadPlugin(): Promise<{
    chartZoomResetPlugin: ZoomResetPlugin;
    createChartZoomResetPlugin: (options?: {
        readonly getRendererDebugRuntime?:
            | (() => {
                  isRendererDebugLoggingAvailable: (
                      enabled: boolean
                  ) => boolean;
              })
            | undefined;
        readonly isRendererDebugLoggingEnabled?: (() => boolean) | undefined;
    }) => ZoomResetPlugin;
    installRoundRectPolyfill: () => void;
    showNotification: Mock<typeof showNotificationFn>;
}> {
    const notificationModule =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
        pluginModule =
            await import("../../../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
        showNotification = vi.mocked(notificationModule.showNotification);

    showNotification.mockClear();

    return {
        chartZoomResetPlugin: pluginModule.chartZoomResetPlugin,
        createChartZoomResetPlugin: pluginModule.createChartZoomResetPlugin,
        installRoundRectPolyfill: pluginModule.installRoundRectPolyfill,
        showNotification,
    };
}

describe("chartZoomResetPlugin.afterDraw", () => {
    it("does not draw when the chart is not zoomed or panned", async () => {
        expect.assertions(2);

        const { chartZoomResetPlugin } = await loadPlugin(),
            { chart, ctx } = createMockChart(false);

        chartZoomResetPlugin.afterDraw(chart);

        expect(ctx.save).not.toHaveBeenCalled();
        expect(chart._zoomResetBtnBounds).toBeNull();
    });

    it("draws the reset button and stores click bounds", async () => {
        expect.assertions(4);

        const { chartZoomResetPlugin } = await loadPlugin(),
            { chart, ctx } = createMockChart();

        chartZoomResetPlugin.afterDraw(chart);

        expect(ctx.save).toHaveBeenCalledOnce();
        expect(ctx.roundRect).toHaveBeenCalledWith(288, 12, 100, 30, 8);
        expect(ctx.fillText).toHaveBeenCalledWith("🔄 Reset Zoom", 338, 27);
        expect(chart._zoomResetBtnBounds).toStrictEqual({
            h: 30,
            w: 100,
            x: 288,
            y: 12,
        });
    });

    it("falls back to rect when roundRect is unavailable", async () => {
        expect.assertions(3);

        const { chartZoomResetPlugin } = await loadPlugin(),
            { chart, ctx } = createMockChart();
        delete ctx.roundRect;

        chartZoomResetPlugin.afterDraw(chart);

        expect(ctx.rect).toHaveBeenCalledWith(288, 12, 100, 30);
        expect(ctx.fillText).toHaveBeenCalledWith("🔄 Reset Zoom", 338, 27);
        expect(chart._zoomResetBtnBounds).toStrictEqual({
            h: 30,
            w: 100,
            x: 288,
            y: 12,
        });
    });

    it("creates plugins with injected debug warning providers", async () => {
        expect.assertions(4);

        const { createChartZoomResetPlugin } = await loadPlugin(),
            drawError = new Error("draw failed"),
            consoleWarn = vi.spyOn(console, "warn").mockReturnValue(undefined),
            getRendererDebugRuntime = vi.fn(() => ({
                isRendererDebugLoggingAvailable: (enabled: boolean) => enabled,
            })),
            plugin = createChartZoomResetPlugin({
                getRendererDebugRuntime,
                isRendererDebugLoggingEnabled: () => true,
            }),
            chart: ZoomResetChart = {
                _zoomResetBtnBounds: null,
                isZoomedOrPanned: () => {
                    throw drawError;
                },
            };

        try {
            const result = plugin.afterDraw(chart);

            expect(result).toBeUndefined();
            expect(getRendererDebugRuntime).toHaveBeenCalledOnce();
            expect(consoleWarn).toHaveBeenCalledWith(
                "[chartZoomResetPlugin] afterDraw error",
                drawError
            );
            expect(chart._zoomResetBtnBounds).toBeNull();
        } finally {
            consoleWarn.mockRestore();
        }
    });

    it("accepts partial debug runtime provider overrides", async () => {
        expect.assertions(3);

        const { createChartZoomResetPlugin } = await loadPlugin(),
            plugin = createChartZoomResetPlugin({
                isRendererDebugLoggingEnabled: () => false,
            }),
            { chart, ctx } = createMockChart();

        plugin.afterDraw(chart);

        expect(ctx.save).toHaveBeenCalledOnce();
        expect(ctx.fillText).toHaveBeenCalledWith("🔄 Reset Zoom", 338, 27);
        expect(chart._zoomResetBtnBounds).toStrictEqual({
            h: 30,
            w: 100,
            x: 288,
            y: 12,
        });
    });
});

describe("chartZoomResetPlugin.afterEvent", () => {
    it("ignores non-zoomed charts and non-reset events", async () => {
        expect.assertions(4);

        const { chartZoomResetPlugin, showNotification } = await loadPlugin(),
            nonZoomed = createMockChart(false),
            mouseMove = createMockChart();

        chartZoomResetPlugin.afterEvent(nonZoomed.chart, {
            event: {
                native: { clientX: 10, clientY: 10 },
                type: "click",
            },
        });
        mouseMove.chart._zoomResetBtnBounds = { h: 30, w: 100, x: 288, y: 12 };
        chartZoomResetPlugin.afterEvent(mouseMove.chart, {
            event: {
                native: { clientX: 338, clientY: 27 },
                type: "mousemove",
            },
        });

        expect(nonZoomed.chart.resetZoom).not.toHaveBeenCalled();
        expect(mouseMove.chart.resetZoom).not.toHaveBeenCalled();
        expect(showNotification).not.toHaveBeenCalled();
        expect(mouseMove.chart._zoomResetBtnBounds).toStrictEqual({
            h: 30,
            w: 100,
            x: 288,
            y: 12,
        });
    });

    it("resets zoom and shows a success notification when the button is clicked", async () => {
        expect.assertions(5);

        const { chartZoomResetPlugin, showNotification } = await loadPlugin(),
            { chart } = createMockChart();
        chartZoomResetPlugin.afterDraw(chart);

        const bounds = chart._zoomResetBtnBounds;

        expect(bounds).toStrictEqual({ h: 30, w: 100, x: 288, y: 12 });

        const clickEvent = createClickEvent(bounds);

        chartZoomResetPlugin.afterEvent(chart, clickEvent);

        expect(clickEvent.event.native.stopPropagation).toHaveBeenCalledOnce();
        expect(clickEvent.event.native.preventDefault).toHaveBeenCalledOnce();
        expect(chart.resetZoom).toHaveBeenCalledOnce();
        expect(showNotification).toHaveBeenCalledWith(
            "Chart zoom reset",
            "success"
        );
    });

    it("does not reset zoom when the click is outside the button", async () => {
        expect.assertions(3);

        const { chartZoomResetPlugin, showNotification } = await loadPlugin(),
            { chart } = createMockChart();
        chartZoomResetPlugin.afterDraw(chart);

        chartZoomResetPlugin.afterEvent(chart, {
            event: {
                native: {
                    clientX: 20,
                    clientY: 20,
                    preventDefault: vi.fn<() => void>(),
                    stopPropagation: vi.fn<() => void>(),
                },
                type: "click",
            },
        });

        expect(chart._zoomResetBtnBounds).toStrictEqual({
            h: 30,
            w: 100,
            x: 288,
            y: 12,
        });
        expect(chart.resetZoom).not.toHaveBeenCalled();
        expect(showNotification).not.toHaveBeenCalled();
    });
});

describe("installRoundRectPolyfill", () => {
    it("installs a chainable canvas roundRect polyfill", async () => {
        expect.assertions(5);

        const { installRoundRectPolyfill } = await loadPlugin();
        const mockProto: Partial<CanvasRenderingContext2D> = {};

        expect(mockProto).not.toHaveProperty("roundRect");

        vi.stubGlobal("CanvasRenderingContext2D", { prototype: mockProto });

        try {
            installRoundRectPolyfill();

            const roundRect = mockProto.roundRect;

            expect(roundRect).toBeTypeOf("function");

            if (typeof roundRect !== "function") {
                throw new TypeError("roundRect polyfill was not installed");
            }

            const mockContext = createMockContext(),
                result = roundRect.call(
                    mockContext as unknown as CanvasRenderingContext2D,
                    10,
                    20,
                    100,
                    50,
                    5
                );

            expect(
                [mockContext.beginPath, mockContext.closePath].map(
                    (mockFn) => mockFn.mock.calls.length
                )
            ).toStrictEqual([1, 1]);
            expect(mockContext.moveTo).toHaveBeenCalledWith(15, 20);
            expect(result).toBe(mockContext);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});

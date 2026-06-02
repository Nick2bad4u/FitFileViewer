import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/chartThemeUtils.js"),
    () => ({
        detectCurrentTheme: () => "light",
    })
);
vi.mock(
    import("../../../../../electron-app/utils/data/lookups/getUnitSymbol.js"),
    () => ({
        getUnitSymbol: (_field: string, _type?: string) => "s",
    })
);
vi.mock(
    import("../../../../../electron-app/utils/formatting/formatters/formatTime.js"),
    () => ({
        formatTime: (value: number) => `${value}s`,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/plugins/chartZoomResetPlugin.js"),
    () => ({
        chartZoomResetPlugin: { id: "zoomReset" },
    })
);
vi.mock(
    import("../../../../../electron-app/utils/charts/plugins/chartBackgroundColorPlugin.js"),
    () => ({ chartBackgroundColorPlugin: { id: "backgroundColor" } })
);
vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        getChartZoneColors: () => [
            "#f00",
            "#0f0",
            "#00f",
        ],
    })
);

interface TooltipContext {
    readonly dataset: {
        readonly label?: string;
    };
    readonly parsed: {
        readonly y: number;
    };
}

interface SingleZoneBarChartConfig {
    readonly options: {
        readonly plugins: {
            readonly tooltip: {
                readonly callbacks: {
                    readonly label: (context: TooltipContext) => string;
                };
            };
        };
        readonly scales: {
            readonly y: {
                readonly ticks: {
                    readonly callback: (value: number | string) => string;
                };
            };
        };
    };
    readonly type: "bar";
}

interface ChartView {
    readonly config: SingleZoneBarChartConfig;
    readonly destroy: () => void;
}

type ChartConstructorMock = typeof vi.fn<
    (canvas: HTMLCanvasElement, config: SingleZoneBarChartConfig) => ChartView
>;

interface RenderSinglePowerZoneBarTestGlobal {
    Chart?: ChartConstructorMock;
    showNotification?: (message: string, type: "error") => void;
}

const testGlobal = globalThis as typeof globalThis &
    RenderSinglePowerZoneBarTestGlobal;

describe("renderSinglePowerZoneBar", () => {
    beforeEach(() => {
        document.body.replaceChildren();
        delete testGlobal.Chart;
        delete testGlobal.showNotification;
        vi.resetModules();
    });

    it("renders chart when Chart is available", async () => {
        expect.assertions(4);

        vi.spyOn(console, "log").mockReturnValue(undefined);
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        const Chart = vi.fn<
            (
                canvas: HTMLCanvasElement,
                config: SingleZoneBarChartConfig
            ) => ChartView
        >(function ChartMock(_canvas, config) {
            return { config, destroy: vi.fn<() => void>() };
        }) as ChartConstructorMock;
        testGlobal.Chart = Chart;

        const { renderSinglePowerZoneBar } =
            await import("../../../../../electron-app/utils/data/zones/renderSinglePowerZoneBar.js");
        const view = renderSinglePowerZoneBar(
            canvas as HTMLCanvasElement,
            [
                { label: "Z1", value: 10 },
                { label: "Z2", value: 20 },
                { label: "Z3", value: 30 },
            ],
            { title: "Power Zones" }
        );
        expect(view).toEqual(
            expect.objectContaining({
                config: expect.any(Object),
                destroy: expect.any(Function),
            })
        );
        expect(Chart).toHaveBeenCalledWith(
            canvas,
            expect.objectContaining({ type: "bar" })
        );

        const cfg = Chart.mock.calls[0][1];
        const yTickCb = cfg.options.scales.y.ticks.callback;
        const tooltipCb = cfg.options.plugins.tooltip.callbacks.label;
        expect(yTickCb(30)).toBe("30s");
        expect(tooltipCb({ dataset: { label: "Z1" }, parsed: { y: 30 } })).toBe(
            "Z1: 30s"
        );
    });

    it("handles errors gracefully when Chart.js missing", async () => {
        expect.assertions(2);

        vi.spyOn(console, "error").mockReturnValue(undefined);
        delete testGlobal.Chart;
        const { renderSinglePowerZoneBar } =
            await import("../../../../../electron-app/utils/data/zones/renderSinglePowerZoneBar.js");
        const showNotification =
            vi.fn<(message: string, type: "error") => void>();
        testGlobal.showNotification = showNotification;

        const view = renderSinglePowerZoneBar(
            null as unknown as HTMLCanvasElement,
            null as unknown as readonly unknown[]
        );

        expect(view).toBeNull();
        expect(showNotification).toHaveBeenCalledWith(
            "Failed to render power zone bar",
            "error"
        );
    });
});

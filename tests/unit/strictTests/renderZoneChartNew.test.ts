import { describe, expect, it } from "vitest";
import { renderZoneChart } from "../../../electron-app/utils/charts/rendering/renderZoneChartNew.js";

interface ChartMockInstance {
    readonly canvas: HTMLCanvasElement;
    readonly config: {
        readonly type?: unknown;
    };
}

interface ChartTestGlobal {
    Chart?: new (
        canvas: HTMLCanvasElement,
        config: ChartMockInstance["config"]
    ) => ChartMockInstance;
    _chartjsInstances?: unknown[];
}

describe("renderZoneChartNew", () => {
    const chartGlobal = globalThis as ChartTestGlobal;

    function setupContainer(): HTMLElement {
        document.body.replaceChildren();
        chartGlobal._chartjsInstances = [];
        chartGlobal.Chart = class ChartMock implements ChartMockInstance {
            public constructor(
                public readonly canvas: HTMLCanvasElement,
                public readonly config: ChartMockInstance["config"]
            ) {}
        };

        const container = document.createElement("div");
        container.id = "root";
        document.body.append(container);
        return container;
    }

    function teardown(): void {
        document.body.replaceChildren();
        delete chartGlobal.Chart;
        delete chartGlobal._chartjsInstances;
    }

    it("renders doughnut and bar charts through the managed chart path", () => {
        expect.assertions(5);

        const container = setupContainer();

        expect(container).toBeInstanceOf(HTMLElement);

        renderZoneChart(
            container as HTMLElement,
            "HR Zones",
            [
                { color: "#ff0000", label: "Z1", time: 120, zone: 1 },
                { color: "#00ff00", label: "Z2", time: 240, zone: 2 },
            ],
            "heart-rate-zones",
            { chartType: "doughnut" }
        );

        renderZoneChart(
            container as HTMLElement,
            "Power Zones",
            [
                { label: "Z1", time: 150, zone: 1 },
                { label: "Z2", time: 300, zone: 2 },
            ],
            "power-zones",
            { chartType: "bar" }
        );

        expect(container?.querySelectorAll("canvas")).toHaveLength(2);
        expect(chartGlobal._chartjsInstances).toHaveLength(2);
        expect(
            (chartGlobal._chartjsInstances?.[0] as ChartMockInstance).config
                .type
        ).toBe("doughnut");
        expect(
            (chartGlobal._chartjsInstances?.[1] as ChartMockInstance).config
                .type
        ).toBe("bar");

        teardown();
    });

    it("returns without rendering for invalid inputs", () => {
        expect.assertions(1);

        setupContainer();
        renderZoneChart(null as unknown as HTMLElement, "Invalid", [], "zones");
        renderZoneChart(
            document.body,
            "Invalid",
            null as unknown as [],
            "zones"
        );

        expect({
            chartInstanceTypes: chartGlobal._chartjsInstances?.map(
                (chart) => typeof chart
            ),
            renderedCanvasIds: [...document.querySelectorAll("canvas")].map(
                (canvas) => canvas.id
            ),
        }).toStrictEqual({
            chartInstanceTypes: [],
            renderedCanvasIds: [],
        });

        teardown();
    });
});

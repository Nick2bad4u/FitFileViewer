import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import {
    buildChartConfigFromSpec,
    buildChartSpecFromDefinition,
} from "../../../../../utils/charts/core/chartSpecFactory.js";
import { createManagedChart } from "../../../../../utils/charts/core/createManagedChart.js";

type ChartSpecFromFactory = Parameters<typeof buildChartConfigFromSpec>[0];

vi.mock("../../../../../utils/charts/core/createManagedChart.js", () => ({
    createManagedChart: vi.fn((canvas: HTMLCanvasElement, config: any) => {
        // Simulate Chart.js instance
        return { canvas, config } as any;
    }),
}));

describe("chartSpecFactory.js - Declarative Chart Spec Builder", () => {
    let dom: JSDOM;

    beforeEach(() => {
        dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
            url: "http://localhost",
        });
        (globalThis as any).window = dom.window as any;
        (globalThis as any).document = dom.window.document as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete (globalThis as any).window;
        delete (globalThis as any).document;
    });

    it("builds a basic line chart config from spec and theme", () => {
        const themeConfig = {
            colors: {
                primary: "#1677ff",
                gridLines: "#e9ecef",
                text: "#000000",
                textPrimary: "#111111",
            },
        } as any;

        const spec: ChartSpecFromFactory = {
            type: "line" as const,
            title: "Heart Rate Over Time",
            showLegend: true,
            showGrid: true,
            datasets: [
                {
                    id: "hr-main",
                    label: "Heart Rate",
                    data: [
                        { x: 0, y: 100 },
                        { x: 60, y: 130 },
                        { x: 120, y: 125 },
                    ],
                    colorRole: "primary",
                },
            ],
            axes: [
                { id: "x", type: "linear", label: "Time (s)", display: true },
                { id: "y", type: "linear", label: "Heart Rate (bpm)", display: true },
            ],
        };

        const config = buildChartConfigFromSpec(spec, themeConfig);

        expect(config.type).toBe("line");
        expect(config.data.datasets).toHaveLength(1);

        const dataset = config.data.datasets[0];
        expect(dataset.label).toBe("Heart Rate");
        expect(dataset.data).toHaveLength(3);
        expect(dataset.borderColor).toBe("#1677ff");
        expect(dataset.backgroundColor).toBe("#1677ff33");
        expect(dataset.showLine).toBe(true);

        expect(config.options.plugins.title.text).toBe("Heart Rate Over Time");
        expect(config.options.scales.x.title.text).toBe("Time (s)");
        expect(config.options.scales.y.title.text).toBe("Heart Rate (bpm)");
    });

    it("builds a scatter chart with explicit colors and no line", () => {
        const themeConfig = {
            colors: {
                gridLines: "#444444",
                text: "#ffffff",
                textPrimary: "#f0f0f0",
            },
        } as any;

        const spec: ChartSpecFromFactory = {
            type: "scatter" as const,
            title: "Power vs Heart Rate",
            showLegend: false,
            showGrid: false,
            datasets: [
                {
                    id: "pwr-hr",
                    label: "Power vs HR",
                    data: [
                        { x: 150, y: 250 },
                        { x: 160, y: 270 },
                    ],
                    borderColor: "#ff5722",
                    backgroundColor: "#ff572233",
                    showLine: false,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                },
            ],
            axes: [
                { id: "x", type: "linear", label: "Heart Rate (bpm)", display: true },
                { id: "y", type: "linear", label: "Power (W)", display: true },
            ],
        };

        const config = buildChartConfigFromSpec(spec, themeConfig);

        expect(config.type).toBe("scatter");
        expect(config.options.plugins.legend.display).toBe(false);

        const dataset = config.data.datasets[0];
        expect(dataset.borderColor).toBe("#ff5722");
        expect(dataset.backgroundColor).toBe("#ff572233");
        expect(dataset.showLine).toBe(false);
        expect(dataset.pointRadius).toBe(3);
        expect(dataset.pointHoverRadius).toBe(5);
    });

    it("builds a chart spec from a declarative definition with settings", () => {
        type SampleRecord = {
            time: number;
            speed: number;
            power: number;
        };

        const definition = {
            id: "speed",
            title: "Speed Over Time",
            chartType: "line",
            labelSelector: (record: SampleRecord) => record.time,
            datasets: [
                {
                    id: "speed",
                    label: "Speed",
                    dataKey: "speed",
                    color: "#ff9800",
                },
                {
                    id: "power",
                    label: "Power",
                    dataKey: "power",
                    transform: (value: number | null) => (value == null ? null : value * 2),
                },
            ],
        } as const;

        const records = [
            { time: 0, speed: 10, power: 150 },
            { time: 1, speed: 12, power: 160 },
        ];

        const spec = buildChartSpecFromDefinition(definition, records, {
            chartSettings: {
                fieldVisibility: {
                    speed: "hidden",
                },
            },
        });

        expect(spec.labels).toEqual([0, 1]);
        expect(spec.datasets).toHaveLength(2);
        expect(spec.datasets[0].data).toEqual([10, 12]);
        expect(spec.datasets[0].hidden).toBe(true);
        expect(spec.datasets[1].data).toEqual([300, 320]);
    });

    it("produces a config that can be passed to createManagedChart", () => {
        const themeConfig = {
            colors: {
                primary: "#00b894",
                gridLines: "#dfe6e9",
                text: "#2d3436",
                textPrimary: "#2d3436",
            },
        } as any;

        const spec: ChartSpecFromFactory = {
            type: "line" as const,
            title: "Spec Chart",
            showLegend: true,
            showGrid: true,
            datasets: [
                {
                    id: "spec-ds",
                    label: "Spec Dataset",
                    data: [{ x: 0, y: 1 }],
                    colorRole: "primary",
                },
            ],
            axes: [{ id: "x", type: "linear", label: "X", display: true }],
        };

        const canvas = document.createElement("canvas");
        const config = buildChartConfigFromSpec(spec, themeConfig);

        const chart = (createManagedChart as any)(canvas, config);

        expect(createManagedChart).toHaveBeenCalledWith(canvas, expect.any(Object));
        expect(chart).toBeDefined();
        expect(chart.config.type).toBe("line");
        expect(chart.config.data.datasets[0].label).toBe("Spec Dataset");
    });
});

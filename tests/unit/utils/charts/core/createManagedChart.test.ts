import { describe, expect, it } from "vitest";

import {
    createManagedChart,
    type ManagedChartConfig,
    type ManagedChartInstance,
} from "../../../../../electron-app/utils/charts/core/createManagedChart.js";

type TestChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: ManagedChartConfig
) => ManagedChartInstance;

type TestChartGlobal = typeof globalThis & {
    Chart?: TestChartConstructor;
    _chartjsInstances?: ManagedChartInstance[];
};

const testGlobal = globalThis as TestChartGlobal;

class FakeChart {
    readonly canvas: HTMLCanvasElement;
    readonly config: ManagedChartConfig;

    constructor(canvas: HTMLCanvasElement, config: ManagedChartConfig) {
        this.canvas = canvas;
        this.config = config;
    }
}

function resetChartGlobals(): void {
    delete testGlobal.Chart;
    delete testGlobal._chartjsInstances;
}

describe(createManagedChart, () => {
    it("returns null when Chart.js is not loaded", () => {
        expect.assertions(2);

        resetChartGlobals();

        const canvas = document.createElement("canvas");

        expect(createManagedChart(canvas, {})).toBeNull();
        expect(testGlobal._chartjsInstances).toBeUndefined();

        resetChartGlobals();
    });

    it("creates and registers a Chart.js instance", () => {
        expect.assertions(2);

        resetChartGlobals();

        const canvas = document.createElement("canvas"),
            config = { data: { datasets: [] }, type: "line" };
        testGlobal.Chart = FakeChart;

        const chart = createManagedChart(canvas, config);

        expect(chart).toBeInstanceOf(FakeChart);
        expect(testGlobal._chartjsInstances).toStrictEqual([chart]);

        resetChartGlobals();
    });

    it("reuses the existing chart instance registry", () => {
        expect.assertions(1);

        resetChartGlobals();

        const canvas = document.createElement("canvas"),
            existingChart = { id: "existing" };
        testGlobal.Chart = FakeChart;
        testGlobal._chartjsInstances = [existingChart];

        const chart = createManagedChart(canvas, {});

        expect(testGlobal._chartjsInstances).toStrictEqual([
            existingChart,
            chart,
        ]);

        resetChartGlobals();
    });
});

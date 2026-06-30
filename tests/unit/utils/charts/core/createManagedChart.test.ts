import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    ManagedChartConfig,
    ManagedChartInstance,
} from "../../../../../electron-app/utils/charts/core/createManagedChart.js";
import {
    clearChartRuntimeForTests,
    registerChartRuntime,
} from "../../../../../electron-app/utils/charts/core/chartRuntime.js";
import {
    clearChartInstanceRegistryForTests,
    getRegisteredChartInstances,
    setRegisteredChartInstances,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

type CreateManagedChart =
    typeof import("../../../../../electron-app/utils/charts/core/createManagedChart.js").createManagedChart;

type TestChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: ManagedChartConfig
) => ManagedChartInstance;

class FakeChart {
    readonly canvas: HTMLCanvasElement;
    readonly config: ManagedChartConfig;

    constructor(canvas: HTMLCanvasElement, config: ManagedChartConfig) {
        this.canvas = canvas;
        this.config = config;
    }
}

async function loadCreateManagedChart(
    chartConstructor: TestChartConstructor | undefined
): Promise<CreateManagedChart> {
    if (chartConstructor) {
        registerChartRuntime(chartConstructor);
    } else {
        clearChartRuntimeForTests();
    }

    const module =
        await import("../../../../../electron-app/utils/charts/core/createManagedChart.js");
    return module.createManagedChart;
}

function resetChartRegistry(): void {
    clearChartInstanceRegistryForTests();
    clearChartRuntimeForTests();
}

describe("createManagedChart", () => {
    afterEach(() => {
        resetChartRegistry();
    });

    it("returns null when Chart.js is not loaded", async () => {
        expect.assertions(2);

        const createManagedChart = await loadCreateManagedChart(undefined),
            canvas = document.createElement("canvas");

        expect(createManagedChart(canvas, {})).toBeNull();
        expect(getRegisteredChartInstances()).toStrictEqual([]);
    });

    it("creates and registers a Chart.js instance", async () => {
        expect.assertions(2);

        const createManagedChart = await loadCreateManagedChart(FakeChart),
            canvas = document.createElement("canvas"),
            config = { data: { datasets: [] }, type: "line" };

        const chart = createManagedChart(canvas, config);

        expect(chart).toBeInstanceOf(FakeChart);
        expect(getRegisteredChartInstances()).toStrictEqual([chart]);
    });

    it("reuses the existing chart instance registry", async () => {
        expect.assertions(1);

        const createManagedChart = await loadCreateManagedChart(FakeChart),
            canvas = document.createElement("canvas"),
            existingChart = { id: "existing" };
        setRegisteredChartInstances([existingChart]);

        const chart = createManagedChart(canvas, {});

        expect(getRegisteredChartInstances()).toStrictEqual([
            existingChart,
            chart,
        ]);
    });
});

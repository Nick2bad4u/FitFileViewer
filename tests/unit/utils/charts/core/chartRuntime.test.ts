import { afterEach, describe, expect, it } from "vitest";

import {
    clearChartRuntimeForTests,
    resolveChartRuntime,
    resolveChartZoomPlugin,
    setChartRuntime,
} from "../../../../../electron-app/utils/charts/core/chartRuntime.js";

interface ChartRuntimeRegistry {
    runtime?: unknown;
    zoomPlugin?: unknown;
}

const chartRuntimeRegistryKey = Symbol.for("fitfileviewer.chartRuntime");

function getChartRuntimeRegistry(): ChartRuntimeRegistry {
    const chartGlobal = globalThis as typeof globalThis &
        Record<symbol, ChartRuntimeRegistry | undefined>;
    chartGlobal[chartRuntimeRegistryKey] ??= {};
    return chartGlobal[chartRuntimeRegistryKey];
}

function isRuntime(value: unknown): value is { register: () => void } {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as { register?: unknown }).register === "function"
    );
}

describe("chartRuntime", () => {
    afterEach(() => {
        clearChartRuntimeForTests();
    });

    it("resolves the registered Chart.js runtime and zoom plugin", () => {
        expect.assertions(2);

        const runtime = { register() {} };
        const zoomPlugin = { id: "zoom" };

        setChartRuntime(runtime, zoomPlugin);

        expect(resolveChartRuntime(isRuntime)).toBe(runtime);
        expect(resolveChartZoomPlugin()).toBe(zoomPlugin);
    });

    it("reads runtimes registered by a separate bundle through the shared symbol registry", () => {
        expect.assertions(2);

        const runtime = { register() {} };
        const zoomPlugin = { id: "zoom" };
        const registry = getChartRuntimeRegistry();
        registry.runtime = runtime;
        registry.zoomPlugin = zoomPlugin;

        expect(resolveChartRuntime(isRuntime)).toBe(runtime);
        expect(resolveChartZoomPlugin()).toBe(zoomPlugin);
    });
});

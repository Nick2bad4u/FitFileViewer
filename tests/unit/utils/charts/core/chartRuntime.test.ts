import { afterEach, describe, expect, it } from "vitest";

import {
    clearChartRuntimeForTests,
    resolveChartRuntime,
    resolveChartZoomPlugin,
    setChartRuntime,
} from "../../../../../electron-app/utils/charts/core/chartRuntime.js";

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

    it("clears the module-local runtime adapter", () => {
        expect.assertions(2);

        const runtime = { register() {} };
        const zoomPlugin = { id: "zoom" };
        setChartRuntime(runtime, zoomPlugin);

        clearChartRuntimeForTests();

        expect(resolveChartRuntime(isRuntime)).toBeNull();
        expect(resolveChartZoomPlugin()).toBeNull();
    });
});

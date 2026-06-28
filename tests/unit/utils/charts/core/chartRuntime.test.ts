import { afterEach, describe, expect, it } from "vitest";

import {
    clearChartRuntimeForTests,
    isRegisteredChartRuntime,
    isRegisteredChartZoomPlugin,
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

    it("validates registered Chart.js runtime payloads", () => {
        expect.assertions(6);

        expect(isRegisteredChartRuntime({ register() {} })).toBe(true);
        expect(
            isRegisteredChartRuntime(
                Object.assign(function Chart() {}, {
                    register() {},
                })
            )
        ).toBe(true);
        expect(isRegisteredChartRuntime({ register: "missing" })).toBe(false);
        expect(isRegisteredChartRuntime(null)).toBe(false);
        expect(isRegisteredChartRuntime([])).toBe(false);
        expect(isRegisteredChartRuntime({})).toBe(false);
    });

    it("validates registered Chart.js zoom plugin payloads", () => {
        expect.assertions(4);

        expect(isRegisteredChartZoomPlugin({ id: "zoom" })).toBe(true);
        expect(isRegisteredChartZoomPlugin({ id: "" })).toBe(false);
        expect(isRegisteredChartZoomPlugin({ id: 123 })).toBe(false);
        expect(isRegisteredChartZoomPlugin([])).toBe(false);
    });
});

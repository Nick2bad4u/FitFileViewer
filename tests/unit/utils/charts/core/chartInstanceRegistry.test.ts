import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearChartInstanceRegistryForTests,
    clearRegisteredChartInstances,
    destroyRegisteredChartInstances,
    getRegisteredChartInstanceCount,
    getRegisteredChartInstances,
    registerChartInstance,
    setRegisteredChartInstances,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

afterEach(() => {
    clearChartInstanceRegistryForTests();
});

describe("chartInstanceRegistry", () => {
    it("registers charts through a typed registry", () => {
        expect.assertions(2);

        const chart = { id: "chart" };

        registerChartInstance(chart);

        expect(getRegisteredChartInstances()).toStrictEqual([chart]);
        expect(getRegisteredChartInstanceCount()).toBe(1);
    });

    it("replaces and clears registered chart instances", () => {
        expect.assertions(2);

        const charts = [{ id: "first" }, { id: "second" }];

        expect(setRegisteredChartInstances(charts)).toStrictEqual(charts);

        clearRegisteredChartInstances();

        expect(getRegisteredChartInstances()).toStrictEqual([]);
    });

    it("destroys registered charts and reports per-chart errors", () => {
        expect.assertions(3);

        const destroy = vi.fn<() => void>();
        const destroyError = new Error("destroy failed");
        const onError = vi.fn<(index: number, error: unknown) => void>();
        setRegisteredChartInstances([
            { destroy },
            {
                destroy() {
                    throw destroyError;
                },
            },
        ]);

        destroyRegisteredChartInstances(onError);

        expect(destroy).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledWith(1, destroyError);
        expect(getRegisteredChartInstances()).toStrictEqual([]);
    });
});

import { describe, expect, it, vi } from "vitest";

import {
    normalizeRenderChartOptions,
    shouldAbortInactiveChartRender,
} from "../../../../electron-app/utils/charts/core/renderChartPreflight.js";

function createDependencies(activeTab: unknown, isTestEnvironment = false) {
    return {
        getStateManager: () => ({
            getState: vi.fn<(path: string) => unknown>((path) =>
                path === "ui.activeTab" ? activeTab : undefined
            ),
        }),
        isTestEnvironment: () => isTestEnvironment,
        log: vi.fn<(message: string) => void>(),
    };
}

describe("renderChartPreflight", () => {
    it("normalizes render options to explicit booleans", () => {
        expect.assertions(1);

        expect(
            normalizeRenderChartOptions({
                allowInactiveTab: 1,
                skipControls: "",
                skipTabAbort: "yes",
            })
        ).toStrictEqual({
            allowInactiveTab: true,
            skipControls: false,
            skipTabAbort: true,
        });
    });

    it("allows active chart tabs through the shared renderer tab contract", () => {
        expect.assertions(2);

        expect(
            shouldAbortInactiveChartRender(createDependencies("chart"), false)
        ).toBe(false);
        expect(
            shouldAbortInactiveChartRender(createDependencies("chartjs"), false)
        ).toBe(false);
    });

    it("aborts stale chart tab aliases instead of accepting arbitrary tab names", () => {
        expect.assertions(2);

        const dependencies = createDependencies("charts");

        expect(shouldAbortInactiveChartRender(dependencies, false)).toBe(true);
        expect(dependencies.log).toHaveBeenCalledWith(
            "[ChartJS] Skipping render - chart tab not active (current tab: charts)"
        );
    });

    it("does not abort inactive tabs when the caller or test runtime opts out", () => {
        expect.assertions(2);

        expect(
            shouldAbortInactiveChartRender(createDependencies("data"), true)
        ).toBe(false);
        expect(
            shouldAbortInactiveChartRender(
                createDependencies("data", true),
                false
            )
        ).toBe(false);
    });
});

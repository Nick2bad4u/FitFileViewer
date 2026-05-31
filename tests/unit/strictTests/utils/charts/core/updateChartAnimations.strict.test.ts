import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateChartAnimations } from "../../../../../../electron-app/utils/charts/core/updateChartAnimations.js";

type TestChart = {
    config?: {
        type?: string;
    };
    options: {
        animation?: unknown;
        animations?: Record<string, unknown>;
    };
};

describe(updateChartAnimations, () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("returns null and warns on invalid chart", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const res = updateChartAnimations(undefined, "line");
        expect(res).toBeNull();
        expect(warn).toHaveBeenCalledWith(
            "[ChartAnimations] Invalid chart instance provided"
        );
    });

    it("returns null when options missing", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const res = updateChartAnimations({}, "line");
        expect(res).toBeNull();
        expect(warn).toHaveBeenCalledWith(
            "[ChartAnimations] Chart instance missing options object"
        );
    });

    it("configures base animation and type-specific for line charts", () => {
        expect.hasAssertions();

        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});
        const chart: TestChart = { options: {}, config: { type: "line" } };
        const res = updateChartAnimations(chart, "Line Chart");
        expect(res).toBe(chart);
        expect(chart.options.animation).toEqual(
            expect.objectContaining({
                duration: 1200,
                easing: "easeInOutQuart",
                onComplete: expect.any(Function),
                onProgress: expect.any(Function),
            })
        );
        expect(chart.options.animations.tension).toEqual({
            duration: 1500,
            easing: "easeOutQuart",
            from: 0,
            to: 0.4,
        });
        expect(consoleLog).toHaveBeenCalledWith(
            "[ChartAnimations] Animation configuration updated for Line Chart chart"
        );
    });

    it("configures bar chart color animations", () => {
        expect.hasAssertions();

        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});
        const chart: TestChart = { options: {}, config: { type: "bar" } };
        const res = updateChartAnimations(chart, "Bar Chart");
        expect(res).toBe(chart);
        expect(chart.options.animations.colors).toEqual({
            duration: 1000,
            easing: "easeOutQuart",
        });
        expect(consoleLog).toHaveBeenCalledWith(
            "[ChartAnimations] Animation configuration updated for Bar Chart chart"
        );
    });

    it("configures doughnut chart rotate/scale animations", () => {
        expect.hasAssertions();

        vi.spyOn(console, "log").mockImplementation(() => {});
        const chart: TestChart = { options: {}, config: { type: "doughnut" } };
        const res = updateChartAnimations(chart, "Doughnut Chart");
        expect(res).toBe(chart);
        expect(chart.options.animations.animateRotate).toBe(true);
        expect(chart.options.animations.animateScale).toBe(true);
    });

    it("warns when chart type missing but still sets base animation", () => {
        expect.hasAssertions();

        vi.spyOn(console, "log").mockImplementation(() => {});
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const chart: TestChart = { options: {}, config: {} };
        updateChartAnimations(chart, "Unknown");
        expect(chart.options.animation).toEqual(
            expect.objectContaining({
                duration: 1200,
                easing: "easeInOutQuart",
                onComplete: expect.any(Function),
                onProgress: expect.any(Function),
            })
        );
        expect(warn).toHaveBeenCalledWith(
            "[ChartAnimations] Chart config missing type property"
        );
    });

    it("logs error and returns original chart if exception thrown", () => {
        expect.hasAssertions();

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        // Force error by monkey-patching Object spread target via getter throwing
        const badChart = {
            options: {
                get animation() {
                    throw new Error("boom");
                },
            },
        };
        const res = updateChartAnimations(badChart, "Any");
        expect(res).toBe(badChart);
        expect(errorSpy).toHaveBeenCalledWith(
            "[ChartAnimations] Error updating chart animations:",
            expect.any(Error)
        );
    });
});

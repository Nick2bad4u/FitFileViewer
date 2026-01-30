import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateChartAnimations } from "../../../../../utils/charts/core/updateChartAnimations.js";

describe("updateChartAnimations", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("returns null and warns on invalid chart", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        // @ts-expect-no-error
        const res = updateChartAnimations(undefined as any, "line");
        expect(res).toBeNull();
        expect(warn).toHaveBeenCalled();
    });

    it("returns null when options missing", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        // @ts-ignore
        const res = updateChartAnimations({}, "line");
        expect(res).toBeNull();
        expect(warn).toHaveBeenCalled();
    });

    it("configures base animation and type-specific for line charts", () => {
        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});
        const chart: any = { options: {}, config: { type: "line" } };
        const res = updateChartAnimations(chart, "Line Chart");
        expect(res).toBe(chart);
        expect(chart.options.animation.duration).toBeGreaterThan(0);
        expect(chart.options.animations.tension).toBeDefined();
        expect(consoleLog).toHaveBeenCalled();
    });

    it("configures bar chart color animations", () => {
        const chart: any = { options: {}, config: { type: "bar" } };
        const res = updateChartAnimations(chart, "Bar Chart");
        expect(res).toBe(chart);
        expect(chart.options.animations.colors).toBeDefined();
    });

    it("configures doughnut chart rotate/scale animations", () => {
        const chart: any = { options: {}, config: { type: "doughnut" } };
        const res = updateChartAnimations(chart, "Doughnut Chart");
        expect(res).toBe(chart);
        expect(chart.options.animations.animateRotate).toBe(true);
        expect(chart.options.animations.animateScale).toBe(true);
    });

    it("warns when chart type missing but still sets base animation", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const chart: any = { options: {}, config: {} };
        updateChartAnimations(chart, "Unknown");
        expect(chart.options.animation).toBeDefined();
        expect(warn).toHaveBeenCalled();
    });

    it("logs error and returns original chart if exception thrown", () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const chart: any = { options: {} };
        // Force error by monkey-patching Object spread target via getter throwing
        const badChart: any = {
            options: {
                get animation() {
                    throw new Error("boom");
                },
            },
        };
        const res = updateChartAnimations(badChart, "Any");
        expect(res).toBe(badChart);
        expect(errorSpy).toHaveBeenCalled();
    });
});

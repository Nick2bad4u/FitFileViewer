import { describe, expect, it, vi } from "vitest";

import { throttledAnimLog } from "../../../../../electron-app/utils/debug/lastAnimLog.js";

const throttledAnimLogMock = vi.hoisted(() => vi.fn<typeof throttledAnimLog>());

vi.mock(
    import("../../../../../electron-app/utils/debug/lastAnimLog.js"),
    () => ({
        throttledAnimLog: throttledAnimLogMock,
    })
);

import { updateChartAnimations } from "../../../../../electron-app/utils/charts/core/updateChartAnimations.js";

type AnimationProgressContext = {
    currentStep?: unknown;
    numSteps?: unknown;
};

type ChartAnimation = {
    duration?: number;
    easing?: string;
    onComplete?: () => void;
    onProgress?: (context: AnimationProgressContext) => void;
    preserveMe?: string;
};

type ChartAnimations = {
    animateRotate?: boolean;
    animateScale?: boolean;
    colors?: {
        duration: number;
        easing: string;
    };
    tension?: {
        duration: number;
        easing: string;
        from: number;
        to: number;
    };
};

type TestChart = {
    config?: {
        type?: unknown;
    };
    options: {
        animation?: ChartAnimation;
        animations?: ChartAnimations;
    };
};

function createChart(type: string): TestChart {
    return {
        config: { type },
        options: {
            animation: { preserveMe: "yes" },
        },
    };
}

describe(updateChartAnimations, () => {
    it("returns null for invalid chart input", () => {
        expect.assertions(2);

        throttledAnimLogMock.mockClear();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(updateChartAnimations(null, "speed")).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartAnimations] Invalid chart instance provided"
        );

        warnSpy.mockRestore();
    });

    it("returns null when the chart has no options object", () => {
        expect.assertions(2);

        throttledAnimLogMock.mockClear();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(
            updateChartAnimations({ config: { type: "line" } }, "speed")
        ).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartAnimations] Chart instance missing options object"
        );

        warnSpy.mockRestore();
    });

    it("configures base and line-specific animations", () => {
        expect.assertions(5);

        throttledAnimLogMock.mockClear();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const chart = createChart("line"),
            result = updateChartAnimations(chart, "speed");

        expect(result).toBe(chart);
        expect(chart.options.animation).toMatchObject({
            duration: 1200,
            easing: "easeInOutQuart",
            preserveMe: "yes",
        });
        expect(chart.options.animation?.onComplete).toBeTypeOf("function");
        expect(chart.options.animation?.onProgress).toBeTypeOf("function");
        expect(chart.options.animations?.tension).toStrictEqual({
            duration: 1500,
            easing: "easeOutQuart",
            from: 0,
            to: 0.4,
        });

        logSpy.mockRestore();
    });

    it("configures bar color animations", () => {
        expect.assertions(1);

        throttledAnimLogMock.mockClear();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const chart = createChart("bar");

        updateChartAnimations(chart, "power");

        expect(chart.options.animations?.colors).toStrictEqual({
            duration: 1000,
            easing: "easeOutQuart",
        });

        logSpy.mockRestore();
    });

    it("configures doughnut rotation and scale animations", () => {
        expect.assertions(1);

        throttledAnimLogMock.mockClear();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const chart = createChart("doughnut");

        updateChartAnimations(chart, "zones");

        expect(chart.options.animations).toMatchObject({
            animateRotate: true,
            animateScale: true,
        });

        logSpy.mockRestore();
    });

    it("leaves the chart usable when the logging type is invalid", () => {
        expect.assertions(2);

        throttledAnimLogMock.mockClear();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {}),
            chart = createChart("line");

        expect(updateChartAnimations(chart, "")).toBe(chart);
        expect(warnSpy).toHaveBeenCalledWith(
            "[ChartAnimations] Invalid chart type provided:",
            ""
        );

        warnSpy.mockRestore();
    });

    it("logs completion and throttled numeric progress from generated callbacks", () => {
        expect.assertions(3);

        throttledAnimLogMock.mockClear();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {}),
            chart = createChart("line");

        updateChartAnimations(chart, "speed");
        chart.options.animation?.onComplete?.();
        chart.options.animation?.onProgress?.({ currentStep: 3, numSteps: 4 });
        chart.options.animation?.onProgress?.({
            currentStep: "3",
            numSteps: 4,
        });

        expect(chart.options.animation?.duration).toBe(1200);
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartJS] speed chart animation complete"
        );
        expect(throttledAnimLogMock).toHaveBeenCalledExactlyOnceWith(
            "[ChartJS] speed chart animation: 75%"
        );

        logSpy.mockRestore();
    });
});

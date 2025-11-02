// @ts-nocheck

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    clampPercent,
    clampRangeValue,
    computeRangeState,
    formatMetricValue,
    formatPercent,
    resolveInitialConfig,
    toSliderString,
    updateGlobalFilter,
} from "../../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js";

const originalConsoleError = console.error;

describe("stateHelpers", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        console.error = originalConsoleError;
        delete globalThis.mapDataPointFilter;
        globalThis.globalData = { recordMesgs: [] };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("clampPercent restricts values to 1-100 and truncates decimals", () => {
        expect(clampPercent(-5)).toBe(1);
        expect(clampPercent(0)).toBe(1);
        expect(clampPercent(150)).toBe(100);
        expect(clampPercent(42.9)).toBe(42);
    });

    it("resolveInitialConfig derives defaults when no persisted state exists", () => {
        const config = resolveInitialConfig("speed", "25");
        expect(config.metric).toBe("speed");
        expect(config.mode).toBe("topPercent");
        expect(config.percent).toBe(25);
        expect(config.enabled).toBe(false);
    });

    it("resolveInitialConfig honors persisted window configuration", () => {
        globalThis.mapDataPointFilter = {
            enabled: true,
            maxValue: 750,
            metric: "power",
            minValue: 200,
            mode: "valueRange",
            percent: 5,
        };
        const config = resolveInitialConfig("speed", "10");
        expect(config).toEqual({
            enabled: true,
            maxValue: 750,
            metric: "power",
            minValue: 200,
            mode: "valueRange",
            percent: 5,
        });
    });

    it("computeRangeState returns normalized stats and slider strings for available data", () => {
        globalThis.globalData = {
            recordMesgs: [
                { speed: 10 },
                { speed: 30.25 },
                { speed: 25.5 },
            ],
        };

        const { stats, rangeValues, sliderValues } = computeRangeState("speed", null);
        expect(stats).toBeTruthy();
        expect(stats.metric).toBe("speed");
        expect(stats.min).toBeCloseTo(10);
        expect(stats.max).toBeCloseTo(30.25);
        expect(rangeValues).toEqual({ min: stats.min, max: stats.max });
        expect(sliderValues).toEqual({
            max: toSliderString(stats.max, stats.decimals),
            min: toSliderString(stats.min, stats.decimals),
        });
    });

    it("computeRangeState handles empty datasets gracefully", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const result = computeRangeState("speed", null);
        expect(result).toEqual({ stats: null, rangeValues: null, sliderValues: null });
        expect(spy).not.toHaveBeenCalled();
    });

    it("clampRangeValue respects min/max bounds", () => {
        const stats = { min: 100, max: 400 };
        expect(clampRangeValue(50, stats)).toBe(100);
        expect(clampRangeValue(1000, stats)).toBe(400);
        expect(clampRangeValue(250, stats)).toBe(250);
    });

    it("formatMetricValue uses locale-aware formatting", () => {
        const stats = { decimals: 2 };
        const formatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        });
        expect(formatMetricValue(123.456, stats)).toBe(formatter.format(123.456));
    });

    it("formatPercent outputs a single decimal by default", () => {
        const formatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 0,
        });
        expect(formatPercent(12.345)).toBe(formatter.format(12.345));
    });

    it("updateGlobalFilter persists state on the window", () => {
        const config = { enabled: true, metric: "speed", mode: "topPercent", percent: 10 };
        updateGlobalFilter(config);
        expect(globalThis.mapDataPointFilter).toEqual(config);
    });
});

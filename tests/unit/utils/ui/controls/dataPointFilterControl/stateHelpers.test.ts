import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    clampPercent,
    clampRangeValue,
    computeRangeState,
    formatMetricValue,
    formatPercent,
    resolveInitialConfig,
    toSliderString,
    updateDataPointFilterState,
} from "../../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js";
import { setActiveFitRawData } from "../../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getMapDataPointFilter,
    resetMapDataPointFilterStateForTests,
    setMapDataPointFilter,
} from "../../../../../../electron-app/utils/maps/state/mapDataPointFilterState.js";

type DataPointFilterConfig = {
    enabled: boolean;
    maxValue?: number;
    metric: string;
    minValue?: number;
    mode: "topPercent" | "valueRange";
    percent: number;
};

type MetricStats = {
    decimals?: number;
    max: number;
    min: number;
};

describe("stateHelpers", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        vi.restoreAllMocks();
        resetMapDataPointFilterStateForTests();
        setActiveFitRawData({ recordMesgs: [] }, { source: "test" });
    });

    afterEach(() => {
        __resetStateManagerForTests();
        vi.restoreAllMocks();
        resetMapDataPointFilterStateForTests();
    });

    it("clampPercent restricts values to 1-100 and truncates decimals", () => {
        expect.hasAssertions();

        expect(clampPercent(-5)).toBe(1);
        expect(clampPercent(0)).toBe(1);
        expect(clampPercent(150)).toBe(100);
        expect(clampPercent(42.9)).toBe(42);
    });

    it("resolveInitialConfig derives defaults when no persisted state exists", () => {
        expect.hasAssertions();

        const config = resolveInitialConfig("speed", "25");
        expect(config.metric).toBe("speed");
        expect(config.mode).toBe("topPercent");
        expect(config.percent).toBe(25);
        expect(config.enabled).toBe(false);
    });

    it("resolveInitialConfig honors persisted map filter state configuration", () => {
        expect.hasAssertions();

        setMapDataPointFilter({
            enabled: true,
            maxValue: 750,
            metric: "power",
            minValue: 200,
            mode: "valueRange",
            percent: 5,
        });
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
        expect.hasAssertions();

        setActiveFitRawData(
            {
                recordMesgs: [
                    { speed: 10 },
                    { speed: 30.25 },
                    { speed: 25.5 },
                ],
            },
            { source: "test" }
        );

        const { stats, rangeValues, sliderValues } = computeRangeState(
            "speed",
            null
        );
        expect(stats).toEqual(
            expect.objectContaining({
                decimals: 2,
                max: 30.25,
                metric: "speed",
                min: 10,
            })
        );
        expect(rangeValues).toEqual({ min: 10, max: 30.25 });
        expect(sliderValues).toEqual({
            max: toSliderString(30.25, 2),
            min: toSliderString(10, 2),
        });
    });

    it("computeRangeState handles empty datasets gracefully", () => {
        expect.hasAssertions();

        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const result = computeRangeState("speed", null);
        expect(result).toEqual({
            stats: null,
            rangeValues: null,
            sliderValues: null,
        });
        expect(spy).not.toHaveBeenCalled();
    });

    it("clampRangeValue respects min/max bounds", () => {
        expect.hasAssertions();

        const stats: MetricStats = { min: 100, max: 400 };
        expect(clampRangeValue(50, stats)).toBe(100);
        expect(clampRangeValue(1000, stats)).toBe(400);
        expect(clampRangeValue(250, stats)).toBe(250);
    });

    it("formatMetricValue uses locale-aware formatting", () => {
        expect.hasAssertions();

        const stats: Pick<MetricStats, "decimals"> = { decimals: 2 };
        const formatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        });
        expect(formatMetricValue(123.456, stats)).toBe(
            formatter.format(123.456)
        );
    });

    it("formatPercent outputs a single decimal by default", () => {
        expect.hasAssertions();

        const formatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 0,
        });
        expect(formatPercent(12.345)).toBe(formatter.format(12.345));
    });

    it("updateDataPointFilterState persists through typed map filter state", () => {
        expect.hasAssertions();

        const config: DataPointFilterConfig = {
            enabled: true,
            metric: "speed",
            mode: "topPercent",
            percent: 10,
        };
        updateDataPointFilterState(config);
        expect(getMapDataPointFilter()).toEqual(config);
    });
});

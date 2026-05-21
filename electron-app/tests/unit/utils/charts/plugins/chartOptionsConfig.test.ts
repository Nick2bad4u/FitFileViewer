import { describe, expect, it } from "vitest";

import {
    DEFAULT_MAX_POINTS,
    chartOptionsConfig,
    getDefaultValue,
    getMaxPointsWarningLevel,
    getOptionConfig,
    isValidOptionValue,
    maxPointsOptions,
} from "../../../../../utils/charts/plugins/chartOptionsConfig.js";

describe("chartOptionsConfig exports", () => {
    it("exports a non-empty options array", () => {
        expect.assertions(1);

        expect([
            Array.isArray(chartOptionsConfig),
            chartOptionsConfig.length > 0,
        ]).toStrictEqual([true, true]);
    });

    it("includes expected option IDs", () => {
        expect.assertions(1);

        const ids = new Set(chartOptionsConfig.map((option) => option.id));

        expect([
            [
                "maxpoints",
                "chartType",
                "interpolation",
                "animation",
                "exportTheme",
                "showGrid",
                "showLegend",
                "showTitle",
                "showPoints",
                "showFill",
                "smoothing",
                "timeUnits",
                "distanceUnits",
                "temperatureUnits",
            ].every((id) => ids.has(id)),
            ids.has("__missing__"),
        ]).toStrictEqual([true, false]);
    });

    it("keeps chart option IDs unique", () => {
        expect.assertions(2);

        const ids = chartOptionsConfig.map((option) => option.id),
            uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(ids.length);
        expect(ids).not.toContain("__duplicate__");
    });
});

describe(getDefaultValue, () => {
    it("returns the defined default for a known option", () => {
        expect.assertions(2);

        expect(getDefaultValue("maxpoints")).toBe(DEFAULT_MAX_POINTS);
        expect(getDefaultValue("maxpoints")).not.toBe("all");
    });

    it("returns undefined for an unknown option", () => {
        expect.assertions(2);

        expect(getDefaultValue("nonexistent-option")).toBeUndefined();
        expect(getDefaultValue("nonexistent-option")).not.toBe(
            DEFAULT_MAX_POINTS
        );
    });
});

describe(getOptionConfig, () => {
    it("returns the option config by id", () => {
        expect.assertions(2);

        const opt = getOptionConfig("chartType");

        expect(opt).toMatchObject({
            id: "chartType",
            label: "Chart Type",
            type: "select",
        });
        expect(opt?.options).toContain("line");
    });

    it("returns undefined for unknown id", () => {
        expect.assertions(2);

        expect(getOptionConfig("__nope__")).toBeUndefined();
        expect(getOptionConfig("__nope__")).not.toBe(
            getOptionConfig("chartType")
        );
    });
});

describe(isValidOptionValue, () => {
    it("validates range type within bounds", () => {
        expect.assertions(1);

        expect([
            isValidOptionValue("smoothing", 0),
            isValidOptionValue("smoothing", 0.4),
            isValidOptionValue("smoothing", 1),
        ]).toStrictEqual([
            true,
            true,
            true,
        ]);
    });

    it("rejects out-of-bounds and invalid values for range type", () => {
        expect.assertions(1);

        expect([
            isValidOptionValue("smoothing", -0.1),
            isValidOptionValue("smoothing", 1.1),
            isValidOptionValue("smoothing", Number.POSITIVE_INFINITY),
            isValidOptionValue("smoothing", "0.5"),
        ]).toStrictEqual([
            false,
            false,
            false,
            false,
        ]);
    });

    it("validates select type membership", () => {
        expect.assertions(1);

        expect([
            isValidOptionValue("chartType", "line"),
            isValidOptionValue("chartType", "scatter"),
            isValidOptionValue("chartType", "area"),
            isValidOptionValue("chartType", "nope"),
        ]).toStrictEqual([
            true,
            true,
            true,
            false,
        ]);
    });

    it("validates toggle type boolean", () => {
        expect.assertions(1);

        expect([
            isValidOptionValue("showLegend", true),
            isValidOptionValue("showLegend", false),
            isValidOptionValue("showLegend", 1),
        ]).toStrictEqual([
            true,
            true,
            false,
        ]);
    });

    it("returns false for unknown optionId", () => {
        expect.assertions(1);

        expect([
            isValidOptionValue("__unknown__", 123),
            isValidOptionValue("showLegend", true),
        ]).toStrictEqual([false, true]);
    });
});

describe(getMaxPointsWarningLevel, () => {
    it("returns not-recommended for all", () => {
        expect.assertions(2);

        expect(getMaxPointsWarningLevel("all")).toBe("not-recommended");
        expect(getMaxPointsWarningLevel("all")).not.toBe("slow");
    });

    it("returns null for small values and invalid input", () => {
        expect.assertions(2);

        expect([
            getMaxPointsWarningLevel(1),
            getMaxPointsWarningLevel(5),
            getMaxPointsWarningLevel(Number.NaN),
        ]).toStrictEqual([
            null,
            null,
            null,
        ]);
        expect(getMaxPointsWarningLevel(5)).not.toBe("slow");
    });

    it("returns slow, very-slow, and not-recommended at thresholds", () => {
        expect.assertions(2);

        expect([
            getMaxPointsWarningLevel(10_000),
            getMaxPointsWarningLevel(50_000),
            getMaxPointsWarningLevel(100_000),
            getMaxPointsWarningLevel(1_000_000),
            getMaxPointsWarningLevel(1_000_001),
        ]).toStrictEqual([
            "slow",
            "slow",
            "very-slow",
            "not-recommended",
            "not-recommended",
        ]);
        expect(getMaxPointsWarningLevel(100_000)).not.toBe("slow");
    });

    it("maxPointsOptions contain expected warnings entries", () => {
        expect.assertions(2);

        expect([
            maxPointsOptions.includes(10_000),
            maxPointsOptions.includes(100_000),
            maxPointsOptions.includes(1_000_000),
            maxPointsOptions.includes("all"),
        ]).toStrictEqual([
            true,
            true,
            true,
            true,
        ]);
        expect(maxPointsOptions).not.toContain(0);
    });
});

import { describe, it, expect } from "vitest";

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
    expect(Array.isArray(chartOptionsConfig)).toBe(true);
    expect(chartOptionsConfig.length).toBeGreaterThan(0);
  });

  it("includes expected option IDs", () => {
    const ids = new Set(chartOptionsConfig.map((o) => o.id));
    for (const id of [
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
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe("getDefaultValue", () => {
  it("returns the defined default for a known option", () => {
    expect(getDefaultValue("maxpoints")).toBe(DEFAULT_MAX_POINTS);
  });

  it("returns undefined for an unknown option", () => {
    expect(getDefaultValue("nonexistent-option")).toBeUndefined();
  });
});

describe("getOptionConfig", () => {
  it("returns the option config by id", () => {
    const opt = getOptionConfig("chartType");
    expect(opt).toBeDefined();
    expect(opt?.type).toBe("select");
    expect(opt?.options).toContain("line");
  });

  it("returns undefined for unknown id", () => {
    expect(getOptionConfig("__nope__")).toBeUndefined();
  });
});

describe("isValidOptionValue", () => {
  it("validates range type within bounds", () => {
    expect(isValidOptionValue("smoothing", 0)).toBe(true);
    expect(isValidOptionValue("smoothing", 0.4)).toBe(true);
    expect(isValidOptionValue("smoothing", 1)).toBe(true);
  });

  it("rejects out-of-bounds for range type", () => {
    expect(isValidOptionValue("smoothing", -0.1)).toBe(false);
    expect(isValidOptionValue("smoothing", 1.1)).toBe(false);
    expect(isValidOptionValue("smoothing", Number.POSITIVE_INFINITY)).toBe(false);
    // wrong type
    expect(isValidOptionValue("smoothing", "0.5" as unknown as number)).toBe(false);
  });

  it("validates select type membership", () => {
    expect(isValidOptionValue("chartType", "line")).toBe(true);
    expect(isValidOptionValue("chartType", "scatter")).toBe(true);
    expect(isValidOptionValue("chartType", "area")).toBe(true);
    expect(isValidOptionValue("chartType", "nope")).toBe(false);
  });

  it("validates toggle type boolean", () => {
    expect(isValidOptionValue("showLegend", true)).toBe(true);
    expect(isValidOptionValue("showLegend", false)).toBe(true);
    expect(isValidOptionValue("showLegend", 1 as unknown as boolean)).toBe(false);
  });

  it("returns false for unknown optionId", () => {
    expect(isValidOptionValue("__unknown__", 123)).toBe(false);
  });
});

describe("getMaxPointsWarningLevel", () => {
  it("returns not-recommended for 'all'", () => {
    expect(getMaxPointsWarningLevel("all")).toBe("not-recommended");
  });

  it("returns null for small values and invalid input", () => {
    expect(getMaxPointsWarningLevel(1)).toBe(null);
    expect(getMaxPointsWarningLevel(5)).toBe(null);
    // NaN path should produce null (no thresholds matched)
    expect(getMaxPointsWarningLevel("not-a-number" as unknown as number)).toBe(null);
  });

  it("returns slow, very-slow, and not-recommended at thresholds", () => {
    expect(getMaxPointsWarningLevel(10_000)).toBe("slow");
    expect(getMaxPointsWarningLevel(50_000)).toBe("slow");
    expect(getMaxPointsWarningLevel(100_000)).toBe("very-slow");
    expect(getMaxPointsWarningLevel(1_000_000)).toBe("not-recommended");
    expect(getMaxPointsWarningLevel(1_000_001)).toBe("not-recommended");
  });

  it("maxPointsOptions contain expected warnings entries", () => {
    expect(maxPointsOptions).toContain(10_000);
    expect(maxPointsOptions).toContain(100_000);
    expect(maxPointsOptions).toContain(1_000_000);
    expect(maxPointsOptions).toContain("all");
  });
});

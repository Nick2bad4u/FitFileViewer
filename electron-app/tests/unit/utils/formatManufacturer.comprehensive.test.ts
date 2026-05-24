import { describe, it, expect } from "vitest";
import {
    formatManufacturer,
    getAllManufacturerMappings,
    hasManufacturerMapping,
} from "../../../utils/formatting/formatters/formatManufacturer.js";

describe("formatManufacturer comprehensive", () => {
    it("formats known manufacturer keys with display names", () => {
        expect(formatManufacturer("garmin")).toBe("Garmin");
        expect(formatManufacturer("  wahoo  ")).toBe("Wahoo");
        expect(formatManufacturer("sram")).toBe("SRAM");
    });

    it("falls back for missing manufacturer input", () => {
        expect(formatManufacturer(null)).toBe("Unknown Manufacturer");
        expect(formatManufacturer(undefined)).not.toBe("");
    });

    it("exposes mapping copies without mutating formatter lookup", () => {
        const mappings = getAllManufacturerMappings();
        mappings.garmin = "Mutated";

        expect(hasManufacturerMapping("garmin")).toBe(true);
        expect(hasManufacturerMapping("missing-brand")).toBe(false);
        expect(formatManufacturer("garmin")).toBe("Garmin");
    });
});

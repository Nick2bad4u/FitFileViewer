import { describe, expect, it, vi } from "vitest";
import {
    formatManufacturer,
    getAllManufacturerMappings,
    hasManufacturerMapping,
} from "../../../electron-app/utils/formatting/formatters/formatManufacturer.js";

describe(formatManufacturer, () => {
    it("formats known manufacturer keys and IDs with display names", () => {
        expect.assertions(4);

        expect(formatManufacturer("garmin")).toBe("Garmin");
        expect(formatManufacturer("  wahoo  ")).toBe("Wahoo");
        expect(formatManufacturer("sram")).toBe("SRAM");
        expect(formatManufacturer(1)).toBe("Garmin");
    });

    it("handles invalid-input manufacturers with fallback values", () => {
        expect.assertions(4);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        try {
            expect(formatManufacturer(null)).toBe("Unknown Manufacturer");
            expect(formatManufacturer(undefined)).toBe("Unknown Manufacturer");
            expect(formatManufacturer("missing-brand")).toBe("missing-brand");
            expect(warnSpy).toHaveBeenCalledWith(
                "[formatManufacturer] Null or undefined manufacturer provided"
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("exposes mapping copies without mutating formatter lookup", () => {
        expect.assertions(2);

        const mappings = getAllManufacturerMappings();
        mappings.garmin = "Mutated";

        expect({
            garmin: hasManufacturerMapping("garmin"),
            missingBrand: hasManufacturerMapping("missing-brand"),
        }).toStrictEqual({
            garmin: true,
            missingBrand: false,
        });
        expect(formatManufacturer("garmin")).toBe("Garmin");
    });
});

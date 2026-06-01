import { describe, expect, it } from "vitest";
import * as formatters from "../../../electron-app/utils/formatting/formatters/index.js";

const expectedFormatterExports = [
    "formatArray",
    "formatDistance",
    "formatDuration",
    "formatHeight",
    "formatManufacturer",
    "formatProduct",
    "formatSensorName",
    "formatTime",
    "formatWeight",
    "getAllManufacturerMappings",
    "hasManufacturerMapping",
] as const;

describe("formatters barrel", () => {
    it("exports the stable formatter API surface", () => {
        expect.assertions(12);

        expect(Object.keys(formatters).sort()).toEqual(
            [...expectedFormatterExports].sort()
        );

        for (const exportName of expectedFormatterExports) {
            expect(formatters[exportName]).toBeTypeOf("function");
        }
    });

    it("routes representative formatter calls through the barrel exports", () => {
        expect.assertions(4);

        expect(formatters.formatDistance(1000)).toBe("1.00 km / 0.62 mi");
        expect(formatters.formatDuration(90)).toBe("1 min 30 sec");
        expect(formatters.formatWeight(70)).toBe("70 kg (154 lbs)");
        expect(formatters.formatArray([1.234, 2.567], 1)).toBe("1.2, 2.6");
    });

    it("does not expose removed legacy formatter names", () => {
        expect.assertions(1);

        expect(formatters).not.toHaveProperty("formatPace");
    });
});

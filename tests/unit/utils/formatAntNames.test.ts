import { describe, expect, it, vi } from "vitest";
import {
    getManufacturerAndProduct,
    getManufacturerIdFromName,
    getManufacturerName,
    getProductName,
} from "../../../electron-app/utils/formatting/display/formatAntNames.js";

vi.mock(
    "../../../electron-app/utils/data/lookups/dataAntManufacturerIDs.js",
    () => ({
        dataAntManufacturerIDs: {
            1: "garmin",
            2: "wahoo",
            32: "wahoo_fitness",
            89: "favero_electronics",
            255: "development",
        },
    })
);

vi.mock(
    "../../../electron-app/utils/data/lookups/dataAntProductIds.js",
    () => ({
        dataAntProductIds: {
            1: {
                717: "edge_130",
                1036: "edge500",
            },
            2: {
                1: "kickr",
            },
            89: {
                2: "assioma",
            },
        },
    })
);

describe("formatAntNames", () => {
    it("looks up manufacturer names while preserving unknown IDs", () => {
        expect(getManufacturerName(1)).toBe("garmin");
        expect(getManufacturerName("001")).toBe("garmin");
        expect(getManufacturerName(32)).toBe("wahoo_fitness");
        expect(getManufacturerName(999)).toBe(999);
        expect(getManufacturerName("unknown")).toBe("unknown");
        expect(getManufacturerName(null)).toBe(null);
    });

    it("looks up product names while preserving unknown product IDs", () => {
        expect(getProductName(1, 1036)).toBe("edge500");
        expect(getProductName("1", "717")).toBe("edge_130");
        expect(getProductName(2, 1)).toBe("kickr");
        expect(getProductName(999, 1)).toBe(1);
        expect(getProductName(1, 999)).toBe(999);
        expect(getProductName("missing", "abc")).toBe("abc");
    });

    it("combines manufacturer and product lookups", () => {
        expect(getManufacturerAndProduct(1, 717)).toEqual({
            manufacturerName: "garmin",
            productName: "edge_130",
        });
        expect(getManufacturerAndProduct(255)).toEqual({
            manufacturerName: "development",
            productName: null,
        });
        expect(getManufacturerAndProduct(999, 123)).toEqual({
            manufacturerName: 999,
            productName: 123,
        });
    });

    it("resolves manufacturer IDs from normalized names", () => {
        expect(getManufacturerIdFromName("GARMIN")).toBe(1);
        expect(getManufacturerIdFromName("wahoo_fitness")).toBe(32);
        expect(getManufacturerIdFromName("wahoofitness")).toBe(32);
        expect(getManufacturerIdFromName("faveroelectronics")).toBe(89);
        expect(getManufacturerIdFromName("favero_electronics")).toBe(89);
    });

    it("handles invalid-input manufacturer names with null results", () => {
        for (const value of [
            null,
            undefined,
            123,
            {},
            [],
            "",
            "   ",
            "unknown",
            "garmin_extra",
        ]) {
            expect(getManufacturerIdFromName(value)).toBe(null);
        }
    });
});

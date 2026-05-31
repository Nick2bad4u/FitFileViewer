import { describe, expect, it, vi } from "vitest";
import {
    getManufacturerAndProduct,
    getManufacturerIdFromName,
    getManufacturerName,
    getProductName,
} from "../../../electron-app/utils/formatting/display/formatAntNames.js";

vi.mock(
    import("../../../electron-app/utils/data/lookups/dataAntManufacturerIDs.js"),
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
    import("../../../electron-app/utils/data/lookups/dataAntProductIds.js"),
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
        expect.assertions(1);

        expect(
            [
                1,
                "001",
                32,
                999,
                "unknown",
                null,
            ].map((manufacturerId) => getManufacturerName(manufacturerId))
        ).toEqual([
            "garmin",
            "garmin",
            "wahoo_fitness",
            999,
            "unknown",
            null,
        ]);
    });

    it("looks up product names while preserving unknown product IDs", () => {
        expect.assertions(1);

        expect(
            [
                [1, 1036],
                ["1", "717"],
                [2, 1],
                [999, 1],
                [1, 999],
                ["missing", "abc"],
            ].map(([manufacturerId, productId]) =>
                getProductName(manufacturerId, productId)
            )
        ).toEqual([
            "edge500",
            "edge_130",
            "kickr",
            1,
            999,
            "abc",
        ]);
    });

    it("combines manufacturer and product lookups", () => {
        expect.assertions(3);

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
        expect.assertions(1);

        expect(
            [
                "GARMIN",
                "wahoo_fitness",
                "wahoofitness",
                "faveroelectronics",
                "favero_electronics",
            ].map((manufacturerName) =>
                getManufacturerIdFromName(manufacturerName)
            )
        ).toEqual([
            1,
            32,
            32,
            89,
            89,
        ]);
    });

    it("handles invalid-input manufacturer names with null results", () => {
        expect.assertions(1);

        const invalidNames = [
            null,
            undefined,
            123,
            {},
            [],
            "",
            "   ",
            "unknown",
            "garmin_extra",
        ];

        expect(
            invalidNames.map((value) => getManufacturerIdFromName(value))
        ).toEqual([
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
        ]);
    });
});

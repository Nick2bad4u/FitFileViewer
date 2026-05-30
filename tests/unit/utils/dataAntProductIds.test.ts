import { describe, expect, it } from "vitest";

import { dataAntProductIds } from "../../../electron-app/utils/data/lookups/dataAntProductIds.js";

type ProductLookup = Readonly<
    Record<string, Readonly<Record<string, string | undefined>> | undefined>
>;

const productLookup = dataAntProductIds as ProductLookup;

const knownProductMappings = [
    [
        1,
        1036,
        "edge500",
    ],
    [
        1,
        3121,
        "edge_530",
    ],
    [
        1,
        4315,
        "fr965",
    ],
    [
        1,
        4440,
        "edge_1050",
    ],
    [
        32,
        3,
        "kickr_core",
    ],
    [
        32,
        11,
        "elemnt_bolt",
    ],
    [
        32,
        20,
        "tickr",
    ],
    [
        68,
        4,
        "power_meter_lr",
    ],
    [
        263,
        12,
        "assioma_duo",
    ],
    [
        280,
        1,
        "quarq_dzero",
    ],
] as const;

const invalidLookups = [
    [999_999, 1],
    [1, 999_999],
    [0, 1],
    [-1, 1],
    ["garmin", 1036],
    [1, "edge500"],
    [null, 1],
    [1, null],
] as const;

const getProduct = (
    manufacturerId: unknown,
    productId: unknown
): string | undefined =>
    productLookup[String(manufacturerId)]?.[String(productId)];

describe("data ant product ID lookup", () => {
    it("exports nested manufacturer product maps", () => {
        expect.hasAssertions();

        const entries = Object.entries(dataAntProductIds);

        expect(dataAntProductIds).toBeTypeOf("object");
        expect({ isArray: Array.isArray(dataAntProductIds) }).toEqual({
            isArray: false,
        });
        expect(entries).toHaveLength(5);
        expect(productLookup["1"]).toBeTypeOf("object");
        expect(productLookup["32"]).toBeTypeOf("object");
        expect(productLookup["99999"]).toBeUndefined();
    });

    it("uses positive integer string keys and non-empty product names", () => {
        expect.hasAssertions();

        const productEntries = Object.entries(dataAntProductIds);

        for (const [manufacturerId, products] of productEntries) {
            const numericManufacturerId = Number(manufacturerId);

            expect({
                isArray: Array.isArray(products),
                manufacturerIdIsInteger: Number.isInteger(
                    numericManufacturerId
                ),
            }).toEqual({
                isArray: false,
                manufacturerIdIsInteger: true,
            });
            expect(numericManufacturerId).toBeGreaterThanOrEqual(1);
            expect(products).toBeTypeOf("object");

            for (const [productId, productName] of Object.entries(products)) {
                const numericProductId = Number(productId);

                expect({
                    productIdIsInteger: Number.isInteger(numericProductId),
                }).toEqual({
                    productIdIsInteger: true,
                });
                expect(numericProductId).toBeGreaterThanOrEqual(1);
                expect(productName).toBeTypeOf("string");
                expect(productName.trim()).toBe(productName);
                expect(productName).not.toBe("");
            }
        }
    });

    it("keeps representative product mappings stable", () => {
        expect.hasAssertions();

        expect(
            new Set(
                knownProductMappings.map(
                    ([manufacturerId, productId]) =>
                        `${manufacturerId}:${productId}`
                )
            ).size
        ).toBe(knownProductMappings.length);

        for (const [
            manufacturerId,
            productId,
            expectedName,
        ] of knownProductMappings) {
            expect(getProduct(manufacturerId, productId)).toBe(expectedName);
        }
    });

    it("rejects unsupported manufacturer or product IDs", () => {
        expect.hasAssertions();

        for (const [manufacturerId, productId] of invalidLookups) {
            expect(getProduct(manufacturerId, productId)).toBeUndefined();
        }
    });

    it("supports string and integer-equivalent numeric access consistently", () => {
        expect.hasAssertions();

        expect(getProduct(1, 1036)).toBe("edge500");
        expect(getProduct("1", "1036")).toBe("edge500");
        expect(getProduct(1.0, 1036.0)).toBe("edge500");
        expect(getProduct("0001", "1036")).toBeUndefined();
    });

    it("keeps product names in formatter-safe display keys", () => {
        expect.hasAssertions();

        const productNames = Object.values(dataAntProductIds).flatMap(
            (products) => Object.values(products)
        );

        for (const productName of productNames) {
            expect(productName).toMatch(/^[a-zA-Z0-9_ +()-]+$/);
            expect(productName).not.toContain("__");
            expect(productName).not.toMatch(/^_/);
            expect(productName).not.toMatch(/_$/);
        }
    });

    it("is enumerable for reverse lookup formatting", () => {
        expect.hasAssertions();

        const productEntries = Object.entries(productLookup["1"] ?? {});
        const edge500Entry = productEntries.find(
            ([, productName]) => productName === "edge500"
        );

        expect(productEntries).toHaveLength(458);
        expect(edge500Entry).toEqual(["1036", "edge500"]);
        expect(
            productEntries.map(([, productName]) => productName)
        ).not.toContain("missing");
    });
});

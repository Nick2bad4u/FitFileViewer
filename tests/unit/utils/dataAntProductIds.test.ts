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
        expect.assertions(4);

        const entries = Object.entries(dataAntProductIds);

        expect(Object.getPrototypeOf(dataAntProductIds)).toBe(Object.prototype);
        expect(Object.keys(dataAntProductIds)).toStrictEqual([
            "1",
            "32",
            "68",
            "263",
            "280",
        ]);
        expect(entries).toHaveLength(5);
        expect({
            garminEdge500: productLookup["1"]?.["1036"],
            hasUnknownManufacturer: Object.hasOwn(productLookup, "99999"),
            wahooKickrCore: productLookup["32"]?.["3"],
        }).toStrictEqual({
            garminEdge500: "edge500",
            hasUnknownManufacturer: false,
            wahooKickrCore: "kickr_core",
        });
    });

    it("uses positive integer string keys and non-empty product names", () => {
        expect.assertions(2430);

        const productEntries = Object.entries(dataAntProductIds);

        for (const [manufacturerId, products] of productEntries) {
            const numericManufacturerId = Number(manufacturerId);

            expect(Object.getPrototypeOf(products)).toBe(Object.prototype);
            expect(numericManufacturerId).toBe(
                Math.trunc(numericManufacturerId)
            );
            expect(numericManufacturerId).toBeGreaterThanOrEqual(1);
            expect(Object.values(products)).not.toHaveLength(0);

            for (const [productId, productName] of Object.entries(products)) {
                const numericProductId = Number(productId);

                expect({
                    productIdIsInteger: Number.isInteger(numericProductId),
                }).toStrictEqual({
                    productIdIsInteger: true,
                });
                expect(numericProductId).toBeGreaterThanOrEqual(1);
                expect(productName).toEqual(expect.stringMatching(/\S/u));
                expect(productName.trim()).toBe(productName);
                expect(productName).not.toBe("");
            }
        }
    });

    it("keeps representative product mappings stable", () => {
        expect.assertions(11);

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
        expect.assertions(8);

        for (const [manufacturerId, productId] of invalidLookups) {
            const manufacturerKey = String(manufacturerId),
                productKey = String(productId);

            expect({
                hasManufacturer: Object.hasOwn(productLookup, manufacturerKey),
                hasProduct: Object.hasOwn(
                    productLookup[manufacturerKey] ?? {},
                    productKey
                ),
                product: getProduct(manufacturerId, productId),
            }).toStrictEqual({
                hasManufacturer: manufacturerKey === "1",
                hasProduct: false,
                product: undefined,
            });
        }
    });

    it("supports string and integer-equivalent numeric access consistently", () => {
        expect.assertions(4);

        expect(getProduct(1, 1036)).toBe("edge500");
        expect(getProduct("1", "1036")).toBe("edge500");
        expect(getProduct(1.0, 1036.0)).toBe("edge500");
        expect({
            hasManufacturer: Object.hasOwn(productLookup, "0001"),
            product: getProduct("0001", "1036"),
        }).toStrictEqual({
            hasManufacturer: false,
            product: undefined,
        });
    });

    it("keeps product names in formatter-safe display keys", () => {
        expect.assertions(1928);

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
        expect.assertions(3);

        const productEntries = Object.entries(productLookup["1"] ?? {});
        const edge500Entry = productEntries.find(
            ([, productName]) => productName === "edge500"
        );

        expect(productEntries).toHaveLength(458);
        expect(edge500Entry).toStrictEqual(["1036", "edge500"]);
        expect(
            productEntries.map(([, productName]) => productName)
        ).not.toContain("missing");
    });
});

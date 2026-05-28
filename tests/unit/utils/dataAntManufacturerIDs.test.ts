import { describe, expect, it } from "vitest";

import { dataAntManufacturerIDs } from "../../../electron-app/utils/data/lookups/dataAntManufacturerIDs.js";

const manufacturerLookup = dataAntManufacturerIDs as Readonly<
    Record<string, string | undefined>
>;

const knownManufacturerMappings = [
    [1, "garmin"],
    [2, "garmin_fr405_antfs"],
    [3, "zephyr"],
    [6, "srm"],
    [7, "quarq"],
    [9, "saris"],
    [11, "tanita"],
    [12, "echowell"],
    [14, "nautilus"],
    [15, "dynastream"],
    [16, "timex"],
    [17, "metrigear"],
    [20, "cardiosport"],
    [21, "a_and_d"],
    [23, "suunto"],
    [32, "wahoo_fitness"],
    [33, "octane_fitness"],
    [40, "concept2"],
    [41, "shimano"],
    [44, "brim_brothers"],
    [86, "elite"],
    [89, "tacx"],
    [123, "polar_electro"],
    [260, "zwift"],
    [294, "coros"],
    [5759, "actigraphcorp"],
] as const;

const invalidLookupKeys = [
    ["zero", 0],
    ["negative number", -1],
    ["unknown high ID", 999_999],
    ["fractional ID", 1.5],
    ["non-numeric string", "garmin"],
    ["empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["boolean true", true],
    ["boolean false", false],
    ["empty array", []],
    ["plain object", {}],
] as const;

const getManufacturer = (manufacturerId: unknown): string | undefined =>
    manufacturerLookup[String(manufacturerId)];

describe("data ant manufacturer ID lookup", () => {
    it("exports an immutable numeric lookup table", () => {
        expect.assertions(7);

        const entries = Object.entries(dataAntManufacturerIDs);
        const keys = Object.keys(dataAntManufacturerIDs);

        expect(dataAntManufacturerIDs).toBeTypeOf("object");
        expect(Array.isArray(dataAntManufacturerIDs)).toBe(false);
        expect(Object.isFrozen(dataAntManufacturerIDs)).toBe(true);
        expect(entries).toHaveLength(232);
        expect(keys.slice(0, 3)).toEqual([
            "1",
            "2",
            "3",
        ]);
        expect(entries.at(0)).toEqual(["1", "garmin"]);
        expect(entries.at(-1)).toEqual(["5759", "actigraphcorp"]);
    });

    it("uses positive integer string keys and non-empty manufacturer keys", () => {
        const entries = Object.entries(dataAntManufacturerIDs);

        expect.assertions(entries.length * 5);

        for (const [key, value] of entries) {
            const numericKey = Number(key);

            expect(Number.isInteger(numericKey)).toBe(true);
            expect(numericKey).toBeGreaterThanOrEqual(1);
            expect(value).toBeTypeOf("string");
            expect(value.trim()).toBe(value);
            expect(value).not.toBe("");
        }
    });

    it("keeps canonical ANT and FIT manufacturer mappings stable", () => {
        expect.assertions(knownManufacturerMappings.length + 1);

        expect(new Set(knownManufacturerMappings.map(([id]) => id)).size).toBe(
            knownManufacturerMappings.length
        );

        for (const [
            manufacturerId,
            expectedName,
        ] of knownManufacturerMappings) {
            expect(getManufacturer(manufacturerId)).toBe(expectedName);
        }
    });

    it("rejects unsupported lookup keys without falling back to a manufacturer", () => {
        expect.assertions(invalidLookupKeys.length * 2);

        for (const [, manufacturerId] of invalidLookupKeys) {
            expect(
                Object.hasOwn(manufacturerLookup, String(manufacturerId))
            ).toBe(false);
            expect(getManufacturer(manufacturerId)).toBeUndefined();
        }
    });

    it("keeps names in the canonical adapter-safe format", () => {
        const values = Object.values(dataAntManufacturerIDs);
        const lowercaseNames = values.filter(
            (value) => value === value.toLowerCase()
        );

        expect.assertions(1 + values.length * 5);

        expect(lowercaseNames).toHaveLength(230);

        for (const value of values) {
            expect(value).toMatch(/^[a-zA-Z0-9_]+$/);
            expect(value).not.toContain(" ");
            expect(value).not.toContain("__");
            expect(value).not.toMatch(/^_/);
            expect(value).not.toMatch(/_$/);
        }
    });

    it("does not duplicate manufacturer IDs or canonical names", () => {
        expect.assertions(4);

        const keys = Object.keys(dataAntManufacturerIDs);
        const values = Object.values(dataAntManufacturerIDs);
        const uniqueKeys = new Set(keys);
        const uniqueValues = new Set(values);

        expect(keys).toHaveLength(uniqueKeys.size);
        expect(values).toHaveLength(uniqueValues.size);
        expect(uniqueKeys.has("0")).toBe(false);
        expect(uniqueValues.has("unknown")).toBe(false);
    });

    it("supports string and integer-equivalent numeric access consistently", () => {
        expect.assertions(5);

        expect(getManufacturer("1")).toBe("garmin");
        expect(getManufacturer(1)).toBe("garmin");
        expect(getManufacturer(1.0)).toBe("garmin");
        expect(getManufacturer("32")).toBe("wahoo_fitness");
        expect(getManufacturer("0001")).toBeUndefined();
    });

    it("is enumerable for formatter reverse lookups", () => {
        expect.assertions(6);

        const entries = Object.entries(dataAntManufacturerIDs);
        const garminEntry = entries.find(([, name]) => name === "garmin");
        const wahooEntry = entries.find(([, name]) => name === "wahoo_fitness");

        expect(entries).toHaveLength(232);
        expect(garminEntry).toEqual(["1", "garmin"]);
        expect(wahooEntry).toEqual(["32", "wahoo_fitness"]);
        expect(entries.some(([, name]) => name === "not_a_manufacturer")).toBe(
            false
        );
        expect(entries.every(([key]) => Number.isInteger(Number(key)))).toBe(
            true
        );
        expect(entries.every(([, value]) => typeof value === "string")).toBe(
            true
        );
    });

    it("prevents accidental mutation of the canonical table", () => {
        expect.assertions(4);

        expect(
            Object.getOwnPropertyDescriptor(dataAntManufacturerIDs, "1")
        ).toMatchObject({
            configurable: false,
            value: "garmin",
            writable: false,
        });
        expect(() => {
            (manufacturerLookup as Record<string, string>)["1"] = "modified";
        }).toThrow(TypeError);
        expect(dataAntManufacturerIDs[1]).toBe("garmin");
        expect(manufacturerLookup["1"]).not.toBe("modified");
    });
});

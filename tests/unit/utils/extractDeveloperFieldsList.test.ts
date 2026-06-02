import { describe, expect, it } from "vitest";
import { extractDeveloperFieldsList } from "../../../electron-app/utils/data/processing/extractDeveloperFieldsList.js";

describe(extractDeveloperFieldsList, () => {
    it("returns no fields for non-record-list input", () => {
        expect.assertions(1);

        expect(
            [
                null,
                undefined,
                "records",
                42,
                {},
                true,
            ].map((value) => extractDeveloperFieldsList(value))
        ).toStrictEqual([
            [],
            [],
            [],
            [],
            [],
            [],
        ]);
    });

    it("extracts numeric scalar fields and array indices from developerFields JSON", () => {
        expect.assertions(1);

        const records = [
            { developerFields: '{"1": 100, "2": [10, "x", null]}' },
            { developerFields: '{"3": 0, "4": -12.5}' },
        ];

        expect(extractDeveloperFieldsList(records)).toStrictEqual([
            "dev_1",
            "dev_2_0",
            "dev_2_1",
            "dev_2_2",
            "dev_3",
            "dev_4",
        ]);
    });

    it("handles invalid-input developerFields payloads by ignoring them", () => {
        expect.assertions(1);

        const records = [
            null,
            { developerFields: "" },
            { developerFields: "{invalid json}" },
            { developerFields: "[1, 2, 3]" },
            { developerFields: "null" },
            { developerFields: 123 },
            { developerFields: '{"7": 700}' },
        ];

        expect(extractDeveloperFieldsList(records)).toStrictEqual(["dev_7"]);
    });

    it("ignores non-numeric scalar values while preserving array index fields", () => {
        expect.assertions(1);

        const records = [
            {
                developerFields: JSON.stringify({
                    "1": "100",
                    "2": true,
                    "3": null,
                    "4": { nested: 1 },
                    "5": Number.NaN,
                    "6": [
                        undefined,
                        false,
                        { nested: true },
                    ],
                    "7": 0,
                }),
            },
        ];

        expect(extractDeveloperFieldsList(records)).toStrictEqual([
            "dev_6_0",
            "dev_6_1",
            "dev_6_2",
            "dev_7",
        ]);
    });

    it("deduplicates fields across records and sorts identifiers naturally", () => {
        expect.assertions(1);

        const records = [
            { developerFields: '{"10": 10, "2": [1, 2]}' },
            { developerFields: '{"2": [1, 2, 3], "1": 1, "10": 20}' },
        ];

        expect(extractDeveloperFieldsList(records)).toStrictEqual([
            "dev_1",
            "dev_2_0",
            "dev_2_1",
            "dev_2_2",
            "dev_10",
        ]);
    });
});

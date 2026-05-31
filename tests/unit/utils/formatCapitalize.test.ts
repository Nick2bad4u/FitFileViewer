import { describe, expect, it } from "vitest";
import {
    formatCapitalize,
    type FormatCapitalizeOptions,
} from "../../../electron-app/utils/formatting/display/formatCapitalize.js";

describe(formatCapitalize, () => {
    it("capitalizes strings with lowercase-rest enabled by default", () => {
        expect.hasAssertions();

        expect([
            formatCapitalize("hello"),
            formatCapitalize("FIT FILE"),
            formatCapitalize("aLREADY Mixed"),
        ]).toStrictEqual([
            "Hello",
            "Fit file",
            "Already mixed",
        ]);
    });

    it("can preserve the rest of the string casing", () => {
        expect.hasAssertions();

        expect(formatCapitalize("fit FILE", { lowercaseRest: false })).toBe(
            "Fit FILE"
        );
    });

    it("handles invalid-input and falsy values by returning them unchanged", () => {
        expect.hasAssertions();

        expect({
            emptyString: formatCapitalize(""),
            falseValue: formatCapitalize(false),
            nullValue: formatCapitalize(null),
            numberValue: formatCapitalize(123),
            undefinedValue: formatCapitalize(undefined),
        }).toStrictEqual({
            emptyString: "",
            falseValue: false,
            nullValue: null,
            numberValue: 123,
            undefinedValue: undefined,
        });
    });

    it("keeps the legacy null-options TypeError for string values", () => {
        expect.hasAssertions();

        expect(() =>
            formatCapitalize("fit", null as unknown as FormatCapitalizeOptions)
        ).toThrow(TypeError);
    });
});

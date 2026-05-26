import { describe, expect, it } from "vitest";
import {
    formatCapitalize,
    type FormatCapitalizeOptions,
} from "../../../utils/formatting/display/formatCapitalize.js";

describe("formatCapitalize", () => {
    it("capitalizes strings with lowercase-rest enabled by default", () => {
        expect(formatCapitalize("hello")).toBe("Hello");
        expect(formatCapitalize("FIT FILE")).toBe("Fit file");
        expect(formatCapitalize("aLREADY Mixed")).toBe("Already mixed");
    });

    it("can preserve the rest of the string casing", () => {
        expect(formatCapitalize("fit FILE", { lowercaseRest: false })).toBe(
            "Fit FILE"
        );
    });

    it("handles invalid-input and falsy values by returning them unchanged", () => {
        expect(formatCapitalize("")).toBe("");
        expect(formatCapitalize(null)).toBe(null);
        expect(formatCapitalize(undefined)).toBe(undefined);
        expect(formatCapitalize(123)).toBe(123);
        expect(formatCapitalize(false)).toBe(false);
    });

    it("keeps the legacy null-options TypeError for string values", () => {
        expect(() =>
            formatCapitalize("fit", null as unknown as FormatCapitalizeOptions)
        ).toThrow(TypeError);
    });
});

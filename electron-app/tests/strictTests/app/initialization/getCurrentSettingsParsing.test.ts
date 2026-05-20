import { describe, expect, it } from "vitest";

import { parseStoredValue } from "../../../../utils/app/initialization/getCurrentSettingsParsing.js";

describe(parseStoredValue, () => {
    it("returns defaults for absent stored values", () => {
        expect.assertions(2);

        const option = { default: "fallback", type: "select" };

        expect(parseStoredValue(null, option)).toBe("fallback");
        expect(parseStoredValue(undefined, option)).toBe("fallback");
    });

    it("parses numeric range values and falls back for invalid values", () => {
        expect.assertions(3);

        const option = { default: 5, type: "range" };

        expect(parseStoredValue(7, option)).toBe(7);
        expect(parseStoredValue("7.5", option)).toBe(7.5);
        expect(parseStoredValue("bad-value", option)).toBe(5);
    });

    it("preserves all and parses finite numeric maxpoints select values", () => {
        expect.assertions(4);

        const option = { default: "all", id: "maxpoints", type: "select" };

        expect(parseStoredValue("all", option)).toBe("all");
        expect(parseStoredValue("1000", option)).toBe(1000);
        expect(parseStoredValue(2500, option)).toBe(2500);
        expect(parseStoredValue("not-a-number", option)).toBe("all");
    });

    it("normalizes ordinary select values to strings", () => {
        expect.assertions(2);

        const option = { default: "line", id: "chartType", type: "select" };

        expect(parseStoredValue(42, option)).toBe("42");
        expect(parseStoredValue(true, option)).toBe("true");
    });

    it("normalizes toggle values from booleans and legacy strings", () => {
        expect.assertions(1);

        const option = { default: true, type: "toggle" };

        expect([
            parseStoredValue(true, option),
            parseStoredValue(false, option),
            parseStoredValue("true", option),
            parseStoredValue("on", option),
            parseStoredValue("false", option),
            parseStoredValue(1, option),
            parseStoredValue(0, option),
        ]).toStrictEqual([true, false, true, true, false, true, false]);
    });

    it("returns stored values unchanged for unknown option types", () => {
        expect.assertions(2);

        expect(
            parseStoredValue("raw", { default: "fallback", type: "custom" })
        ).toBe("raw");
        expect(parseStoredValue("raw", undefined)).toBe("raw");
    });
});

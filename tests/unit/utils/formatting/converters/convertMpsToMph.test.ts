import { afterEach, describe, expect, it, vi } from "vitest";
import { convertMpsToMph } from "../../../../../electron-app/utils/formatting/converters/convertMpsToMph.js";

describe(convertMpsToMph, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        [0, 0],
        [1, 2.236_936],
        [1.4, 3.131_710_4],
        [5, 11.184_68],
        [10, 22.369_36],
        [13.41, 29.997_311_76],
        [29.06, 65.005_360_16],
        [1_000_000, 2_236_936],
    ])("converts %d m/s to %d mph", (mps, expected) => {
        expect.hasAssertions();

        expect(convertMpsToMph(mps)).toBeCloseTo(expected, 10);
    });

    it.each([
        [null, "object"],
        [undefined, "undefined"],
        ["10", "string"],
        [true, "boolean"],
        [{}, "object"],
        [[], "object"],
        [Number.NaN, "number"],
    ])("rejects %s input", (value, type) => {
        expect.hasAssertions();

        expect(() => convertMpsToMph(value)).toThrow(
            `Expected mps to be a number, received ${type}`
        );
    });

    it("warns but still converts negative speeds", () => {
        expect.hasAssertions();

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertMpsToMph(-5)).toBeCloseTo(-11.184_68, 10);
        expect(convertMpsToMph(-Infinity)).toBe(-Infinity);
        expect(warn).toHaveBeenNthCalledWith(
            1,
            "[convertMpsToMph] Negative speed value:",
            -5
        );
        expect(warn).toHaveBeenNthCalledWith(
            2,
            "[convertMpsToMph] Negative speed value:",
            -Infinity
        );
    });

    it("preserves special numeric values and floating point precision", () => {
        expect.hasAssertions();

        expect(convertMpsToMph(Infinity)).toBe(Infinity);
        expect(convertMpsToMph(0.0001)).toBeCloseTo(0.000_223_693_6, 10);
        expect(convertMpsToMph(1 / 3)).toBeCloseTo((1 / 3) * 2.236_936, 10);
        expect(convertMpsToMph(25.5) / 2.236_936).toBeCloseTo(25.5, 10);
    });
});

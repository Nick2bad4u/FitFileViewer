import { afterEach, describe, expect, it, vi } from "vitest";
import { convertMpsToKmh } from "../../../../../electron-app/utils/formatting/converters/convertMpsToKmh.js";

describe(convertMpsToKmh, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each([
        [0, 0],
        [1, 3.6],
        [1.4, 5.04],
        [5, 18],
        [10, 36],
        [13.889, 50.0004],
        [28, 100.8],
        [1_000_000, 3_600_000],
    ])("converts %d m/s to %d km/h", (mps, expected) => {
        expect.assertions(1);

        expect(convertMpsToKmh(mps)).toBeCloseTo(expected, 10);
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
        expect.assertions(1);

        expect(() => convertMpsToKmh(value)).toThrow(
            `Expected mps to be a number, received ${type}`
        );
    });

    it("warns but still converts negative speeds", () => {
        expect.assertions(4);

        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertMpsToKmh(-5)).toBe(-18);
        expect(convertMpsToKmh(-Infinity)).toBe(-Infinity);
        expect(warn).toHaveBeenNthCalledWith(
            1,
            "[convertMpsToKmh] Negative speed value:",
            -5
        );
        expect(warn).toHaveBeenNthCalledWith(
            2,
            "[convertMpsToKmh] Negative speed value:",
            -Infinity
        );
    });

    it("preserves special numeric values and floating point precision", () => {
        expect.assertions(4);

        expect(convertMpsToKmh(Infinity)).toBe(Infinity);
        expect(convertMpsToKmh(0.0001)).toBeCloseTo(0.00036, 10);
        expect(convertMpsToKmh(1 / 3)).toBeCloseTo((1 / 3) * 3.6, 10);
        expect(convertMpsToKmh(25.5) / 3.6).toBeCloseTo(25.5, 10);
    });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { formatArray } from "../../../electron-app/utils/formatting/formatters/formatUtils.js";

describe(formatArray, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("formats numeric arrays and comma-separated strings", () => {
        expect.hasAssertions();

        expect(
            formatArray([
                1.234,
                2.567,
                3.891,
            ])
        ).toBe("1.23, 2.57, 3.89");
        expect(formatArray([1.234, 2.567], 1)).toBe("1.2, 2.6");
        expect(formatArray("1.234, 2.567", 1)).toBe("1.2, 2.6");
        expect(formatArray([1.23, 2.45], 2, { separator: " | " })).toBe(
            "1.23 | 2.45"
        );
    });

    it("returns unsupported inputs unchanged", () => {
        expect.hasAssertions();

        const objectValue = { value: 1 };

        expect([formatArray(null), formatArray(undefined)]).toEqual([
            null,
            undefined,
        ]);
        expect(formatArray(123.456)).toBe(123.456);
        expect(formatArray("123.456")).toBe("123.456");
        expect(formatArray(objectValue)).toBe(objectValue);
    });

    it("handles invalid-input values strictly by default", () => {
        expect.hasAssertions();

        expect(() => formatArray(["bad", 2.5])).toThrow("Invalid number: bad");
        expect(() => formatArray("1.23,bad,4.56")).toThrow(
            "Invalid number in string: bad"
        );
        expect(() => formatArray([1.234], -1)).toThrow(RangeError);
    });

    it("keeps invalid-input values when strict validation is disabled", () => {
        expect.hasAssertions();

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(
            formatArray(
                [
                    "bad",
                    2.5,
                    "worse",
                ],
                2,
                {
                    strictValidation: false,
                }
            )
        ).toBe("bad, 2.5, worse");
        expect(
            formatArray("1.23,bad,4.56", 1, {
                strictValidation: false,
            })
        ).toBe("1.2, bad, 4.6");
        expect(warnSpy).toHaveBeenCalledWith(
            "[FormatUtils] Invalid number: bad"
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[FormatUtils] Invalid number in string: bad"
        );
    });

    it("logs and rethrows formatting errors", () => {
        expect.hasAssertions();

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        vi.spyOn(Number.prototype, "toFixed").mockImplementationOnce(() => {
            throw new Error("format failed");
        });

        expect(() => formatArray([1.23])).toThrow("format failed");
        expect(errorSpy).toHaveBeenCalledWith(
            "[FormatUtils] Error formatting array: format failed"
        );
    });
});

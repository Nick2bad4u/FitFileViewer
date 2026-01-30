/**
 * @file Comprehensive test suite for formatCapitalize.js utility
 *
 *   Tests all aspects of the string capitalization utility including:
 *
 *   - Basic string capitalization with default options
 *   - Custom options configuration (lowercaseRest)
 *   - Input validation and error handling
 *   - Edge cases and boundary conditions
 *   - Performance and consistency testing
 *   - Real-world usage scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatCapitalize } from "../../../utils/formatting/display/formatCapitalize.js";

describe("formatCapitalize.js - String Capitalization Utility", () => {
    let consoleSpy: any;

    beforeEach(() => {
        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        consoleSpy.log.mockRestore();
        consoleSpy.warn.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe("Basic String Capitalization", () => {
        it("should capitalize the first letter of a lowercase string", () => {
            const result = formatCapitalize("hello");
            expect(result).toBe("Hello");
        });

        it("should capitalize and lowercase rest by default", () => {
            const result = formatCapitalize("HELLO WORLD");
            expect(result).toBe("Hello world");
        });

        it("should handle single character strings", () => {
            const result = formatCapitalize("a");
            expect(result).toBe("A");
        });

        it("should handle single uppercase character", () => {
            const result = formatCapitalize("A");
            expect(result).toBe("A");
        });

        it("should handle already capitalized strings", () => {
            const result = formatCapitalize("Hello");
            expect(result).toBe("Hello");
        });

        it("should handle mixed case strings", () => {
            const result = formatCapitalize("hELLo WoRLd");
            expect(result).toBe("Hello world");
        });

        it("should handle strings with numbers", () => {
            const result = formatCapitalize("hello123world");
            expect(result).toBe("Hello123world");
        });

        it("should handle strings starting with numbers", () => {
            const result = formatCapitalize("123hello");
            expect(result).toBe("123hello");
        });

        it("should handle strings with special characters", () => {
            const result = formatCapitalize("hello-world_test");
            expect(result).toBe("Hello-world_test");
        });

        it("should handle strings starting with special characters", () => {
            const result = formatCapitalize("-hello");
            expect(result).toBe("-hello");
        });
    });

    describe("Options Configuration", () => {
        it("should preserve rest of string when lowercaseRest is false", () => {
            const result = formatCapitalize("hELLo WoRLd", {
                lowercaseRest: false,
            });
            expect(result).toBe("HELLo WoRLd");
        });

        it("should handle single character with lowercaseRest false", () => {
            const result = formatCapitalize("a", { lowercaseRest: false });
            expect(result).toBe("A");
        });

        it("should handle uppercase string with lowercaseRest false", () => {
            const result = formatCapitalize("HELLO", { lowercaseRest: false });
            expect(result).toBe("HELLO");
        });

        it("should handle mixed case with lowercaseRest false", () => {
            const result = formatCapitalize("mCdONALD", {
                lowercaseRest: false,
            });
            expect(result).toBe("MCdONALD");
        });

        it("should use default options when options object is empty", () => {
            const result = formatCapitalize("HELLO WORLD", {});
            expect(result).toBe("Hello world");
        });

        it("should handle explicit lowercaseRest true", () => {
            const result = formatCapitalize("HELLO WORLD", {
                lowercaseRest: true,
            });
            expect(result).toBe("Hello world");
        });

        it("should handle undefined options gracefully", () => {
            const result = formatCapitalize("hello world", undefined);
            expect(result).toBe("Hello world");
        });

        it("should handle null options (throws error as expected)", () => {
            // The function doesn't handle null options gracefully, it throws an error
            expect(() =>
                formatCapitalize("hello world", null as any)
            ).toThrow();
        });

        it("should ignore extra options properties", () => {
            const result = formatCapitalize("hello", {
                lowercaseRest: false,
                extraOption: true,
                anotherOption: "test",
            } as any);
            expect(result).toBe("Hello");
        });
    });

    describe("Input Validation and Error Handling", () => {
        it("should return original value for null input", () => {
            const result = formatCapitalize(null as any);
            expect(result).toBe(null);
        });

        it("should return original value for undefined input", () => {
            const result = formatCapitalize(undefined as any);
            expect(result).toBe(undefined);
        });

        it("should return original value for non-string types", () => {
            expect(formatCapitalize(123 as any)).toBe(123);
            expect(formatCapitalize(true as any)).toBe(true);
            expect(formatCapitalize(false as any)).toBe(false);
            expect(formatCapitalize([] as any)).toEqual([]);
            expect(formatCapitalize({} as any)).toEqual({});
        });

        it("should handle empty string", () => {
            const result = formatCapitalize("");
            expect(result).toBe("");
        });

        it("should handle string with only whitespace", () => {
            const result = formatCapitalize("   ");
            expect(result).toBe("   ");
        });

        it("should handle string with leading/trailing whitespace", () => {
            const result = formatCapitalize("  hello world  ");
            expect(result).toBe("  hello world  ");
        });

        it("should handle zero-width strings", () => {
            const result = formatCapitalize("\u200B"); // Zero-width space
            expect(result).toBe("\u200B");
        });

        it("should handle function input", () => {
            const func = () => "test";
            expect(formatCapitalize(func as any)).toBe(func);
        });

        it("should handle date input", () => {
            const date = new Date();
            expect(formatCapitalize(date as any)).toBe(date);
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very long strings", () => {
            const longString = "a".repeat(10000);
            const result = formatCapitalize(longString);
            expect(result).toBe("A" + "a".repeat(9999));
        });

        it("should handle very long strings with lowercaseRest false", () => {
            const longString = "A".repeat(10000);
            const result = formatCapitalize(longString, {
                lowercaseRest: false,
            });
            expect(result).toBe("A".repeat(10000));
        });

        it("should handle unicode characters", () => {
            const result = formatCapitalize("ñiño");
            expect(result).toBe("Ñiño");
        });

        it("should handle unicode characters with lowercaseRest false", () => {
            const result = formatCapitalize("ñIÑO", { lowercaseRest: false });
            expect(result).toBe("ÑIÑO");
        });

        it("should handle emoji in strings", () => {
            const result = formatCapitalize("🚀hello world");
            expect(result).toBe("🚀hello world");
        });

        it("should handle strings starting with accented characters", () => {
            const result = formatCapitalize("àpple");
            expect(result).toBe("Àpple");
        });

        it("should handle special unicode spaces", () => {
            const result = formatCapitalize("\u00A0hello"); // Non-breaking space
            expect(result).toBe("\u00A0hello");
        });

        it("should handle tab and newline characters", () => {
            const result = formatCapitalize("\thello\nworld");
            expect(result).toBe("\thello\nworld");
        });

        it("should handle escape sequences", () => {
            const result = formatCapitalize("hello\\nworld");
            expect(result).toBe("Hello\\nworld");
        });

        it("should handle strings with null bytes", () => {
            const result = formatCapitalize("hello\0world");
            expect(result).toBe("Hello\0world");
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should format proper names", () => {
            expect(formatCapitalize("john")).toBe("John");
            expect(formatCapitalize("SMITH")).toBe("Smith");
            expect(formatCapitalize("mcdonald")).toBe("Mcdonald");
        });

        it("should format proper names preserving case", () => {
            expect(formatCapitalize("McDONALD", { lowercaseRest: false })).toBe(
                "McDONALD"
            );
            expect(formatCapitalize("iPhone", { lowercaseRest: false })).toBe(
                "IPhone"
            );
        });

        it("should format technical terms", () => {
            expect(formatCapitalize("javascript")).toBe("Javascript");
            expect(formatCapitalize("HTML")).toBe("Html");
            expect(formatCapitalize("CSS")).toBe("Css");
        });

        it("should format technical terms preserving case", () => {
            expect(
                formatCapitalize("javaScript", { lowercaseRest: false })
            ).toBe("JavaScript");
            expect(formatCapitalize("iOS", { lowercaseRest: false })).toBe(
                "IOS"
            );
        });

        it("should format file extensions", () => {
            expect(formatCapitalize(".txt")).toBe(".txt");
            expect(formatCapitalize(".PDF")).toBe(".pdf");
        });

        it("should format error messages", () => {
            expect(formatCapitalize("error: file not found")).toBe(
                "Error: file not found"
            );
            expect(formatCapitalize("WARNING: LOW BATTERY")).toBe(
                "Warning: low battery"
            );
        });

        it("should format user input", () => {
            expect(formatCapitalize("hELLo WoRLd")).toBe("Hello world");
            expect(formatCapitalize("tEST mESSAGE")).toBe("Test message");
        });

        it("should format abbreviations", () => {
            expect(formatCapitalize("usa")).toBe("Usa");
            expect(formatCapitalize("UK")).toBe("Uk");
            expect(formatCapitalize("fbi")).toBe("Fbi");
        });

        it("should format abbreviations preserving case", () => {
            expect(formatCapitalize("usa", { lowercaseRest: false })).toBe(
                "Usa"
            );
            expect(formatCapitalize("UK", { lowercaseRest: false })).toBe("UK");
            expect(formatCapitalize("FBI", { lowercaseRest: false })).toBe(
                "FBI"
            );
        });

        it("should format device names from FIT files", () => {
            expect(formatCapitalize("garmin edge 520")).toBe("Garmin edge 520");
            expect(formatCapitalize("WAHOO KICKR")).toBe("Wahoo kickr");
        });

        it("should format device names preserving brand casing", () => {
            expect(
                formatCapitalize("garmin EDGE 520", { lowercaseRest: false })
            ).toBe("Garmin EDGE 520");
            expect(formatCapitalize("iphone", { lowercaseRest: false })).toBe(
                "Iphone"
            );
        });
    });

    describe("Performance and Consistency", () => {
        it("should handle rapid successive calls efficiently", () => {
            const inputs = [
                "hello",
                "WORLD",
                "tEsT",
                "sample",
            ];
            const results = inputs.map((str) => formatCapitalize(str));
            expect(results).toEqual([
                "Hello",
                "World",
                "Test",
                "Sample",
            ]);
        });

        it("should be consistent across multiple calls", () => {
            const input = "hello world";
            const result1 = formatCapitalize(input);
            const result2 = formatCapitalize(input);
            const result3 = formatCapitalize(input);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
            expect(result1).toBe("Hello world");
        });

        it("should handle batch processing efficiently", () => {
            const batch = Array.from({ length: 1000 }, (_, i) => `test${i}`);
            const results = batch.map((str) => formatCapitalize(str));

            expect(results).toHaveLength(1000);
            expect(results[0]).toBe("Test0");
            expect(results[999]).toBe("Test999");
        });

        it("should handle alternating options consistently", () => {
            const input = "tEST";
            const result1 = formatCapitalize(input, { lowercaseRest: true });
            const result2 = formatCapitalize(input, { lowercaseRest: false });
            const result3 = formatCapitalize(input, { lowercaseRest: true });

            expect(result1).toBe("Test");
            expect(result2).toBe("TEST");
            expect(result3).toBe("Test");
        });

        it("should not modify original string or options", () => {
            const originalString = "hello world";
            const originalOptions = { lowercaseRest: false };

            formatCapitalize(originalString, originalOptions);

            expect(originalString).toBe("hello world");
            expect(originalOptions).toEqual({ lowercaseRest: false });
        });
    });

    describe("String Immutability", () => {
        it("should not modify the original string", () => {
            const original = "hello world";
            const result = formatCapitalize(original);

            expect(original).toBe("hello world");
            expect(result).toBe("Hello world");
            expect(result).not.toBe(original); // Different references
        });

        it("should not modify original options object", () => {
            const options = { lowercaseRest: false };
            formatCapitalize("hello", options);

            expect(options).toEqual({ lowercaseRest: false });
        });

        it("should handle frozen strings", () => {
            const frozenString = Object.freeze("hello");
            const result = formatCapitalize(frozenString);
            expect(result).toBe("Hello");
        });
    });

    describe("Type Safety and Guards", () => {
        it("should handle string-like objects gracefully", () => {
            const stringObj = new String("hello");
            expect(formatCapitalize(stringObj as any)).toBe(stringObj);
        });

        it("should handle toString-able objects", () => {
            const obj = { toString: () => "hello" };
            expect(formatCapitalize(obj as any)).toBe(obj);
        });

        it("should handle Symbol inputs", () => {
            const sym = Symbol("test");
            expect(formatCapitalize(sym as any)).toBe(sym);
        });

        it("should handle BigInt inputs", () => {
            const bigInt = BigInt(123);
            expect(formatCapitalize(bigInt as any)).toBe(bigInt);
        });
    });
});

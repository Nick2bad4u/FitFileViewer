/**
 * Comprehensive test suite for formatDuration utility function
 *
 * Tests the function that formats durations from seconds into human-readable
 * strings with appropriate time units (seconds, minutes, hours).
 */

import { vi, describe, it, expect } from "vitest";
import { formatDuration } from "../../../utils/formatting/formatters/formatDuration.js";

describe("formatDuration.js - Duration Formatting Utility", () => {
    describe("Input Validation and Null/Undefined Handling", () => {
        it("should return empty string for null input", () => {
            const result = formatDuration(null);
            expect(result).toBe("");
        });

        it("should return empty string for undefined input", () => {
            const result = formatDuration(undefined);
            expect(result).toBe("");
        });

        it("should throw error for empty string input", () => {
            expect(() => formatDuration("")).toThrow("Invalid duration input: Empty string input");
        });

        it("should throw error for whitespace-only string input", () => {
            expect(() => formatDuration("   ")).toThrow("Invalid duration input: Empty string input");
        });

        it("should throw error for non-numeric string input", () => {
            expect(() => formatDuration("invalid")).toThrow("Invalid duration input: Input must be a finite number");
        });

        it("should throw error for NaN input", () => {
            expect(() => formatDuration(NaN)).toThrow("Invalid duration input: Input must be a finite number");
        });

        it("should throw error for Infinity input", () => {
            expect(() => formatDuration(Infinity)).toThrow("Invalid duration input: Input must be a finite number");
        });

        it("should throw error for negative Infinity input", () => {
            expect(() => formatDuration(-Infinity)).toThrow("Invalid duration input: Input must be a finite number");
        });

        it("should throw error for negative number input", () => {
            expect(() => formatDuration(-10)).toThrow("Invalid duration input: Duration cannot be negative");
        });

        it("should throw error for negative decimal input", () => {
            expect(() => formatDuration(-5.5)).toThrow("Invalid duration input: Duration cannot be negative");
        });

        it("should throw error for array input", () => {
            expect(() => formatDuration([30] as any)).toThrow("Invalid duration input: Input must be a finite number");
        });

        it("should throw error for object input", () => {
            expect(() => formatDuration({ seconds: 30 } as any)).toThrow(
                "Invalid duration input: Input must be a finite number"
            );
        });

        it("should throw error for boolean input", () => {
            expect(() => formatDuration(true as any)).toThrow("Invalid duration input: Input must be a finite number");
        });
    });

    describe("String Input Conversion", () => {
        it("should convert valid numeric string to number", () => {
            const result = formatDuration("30");
            expect(result).toBe("30 sec");
        });

        it("should convert valid decimal string to rounded number", () => {
            const result = formatDuration("30.7");
            expect(result).toBe("31 sec"); // Rounded to nearest integer
        });

        it("should handle string with leading/trailing whitespace", () => {
            const result = formatDuration("  45  ");
            expect(result).toBe("45 sec");
        });

        it("should convert scientific notation string", () => {
            const result = formatDuration("1e2"); // 100
            expect(result).toBe("1 min 40 sec");
        });

        it("should convert negative zero string", () => {
            const result = formatDuration("-0");
            expect(result).toBe("0 sec");
        });
    });

    describe("Decimal Number Rounding", () => {
        it("should round decimal seconds down to integer", () => {
            const result = formatDuration(30.4);
            expect(result).toBe("30 sec");
        });

        it("should round decimal seconds up to integer", () => {
            const result = formatDuration(30.6);
            expect(result).toBe("31 sec");
        });

        it("should round exactly half up to integer", () => {
            const result = formatDuration(30.5);
            expect(result).toBe("31 sec");
        });

        it("should handle very small decimal values", () => {
            const result = formatDuration(0.3);
            expect(result).toBe("0 sec");
        });

        it("should handle large decimal values", () => {
            const result = formatDuration(3661.8);
            expect(result).toBe("1 hr 1 min"); // Rounded to 3662 seconds
        });
    });

    describe("Seconds Only Format (< 60 seconds)", () => {
        it("should format zero seconds", () => {
            const result = formatDuration(0);
            expect(result).toBe("0 sec");
        });

        it("should format single second", () => {
            const result = formatDuration(1);
            expect(result).toBe("1 sec");
        });

        it("should format multiple seconds", () => {
            const result = formatDuration(30);
            expect(result).toBe("30 sec");
        });

        it("should format maximum seconds before minutes threshold", () => {
            const result = formatDuration(59);
            expect(result).toBe("59 sec");
        });

        it("should format very small positive number", () => {
            const result = formatDuration(0.1);
            expect(result).toBe("0 sec"); // Rounded down
        });
    });

    describe("Minutes and Seconds Format (60 seconds to < 1 hour)", () => {
        it("should format exactly 60 seconds", () => {
            const result = formatDuration(60);
            expect(result).toBe("1 min 0 sec");
        });

        it("should format 1 minute 30 seconds", () => {
            const result = formatDuration(90);
            expect(result).toBe("1 min 30 sec");
        });

        it("should format multiple minutes with seconds", () => {
            const result = formatDuration(150); // 2:30
            expect(result).toBe("2 min 30 sec");
        });

        it("should format whole minutes without remaining seconds", () => {
            const result = formatDuration(300); // 5:00
            expect(result).toBe("5 min 0 sec");
        });

        it("should format maximum time before hours threshold", () => {
            const result = formatDuration(3599); // 59:59
            expect(result).toBe("59 min 59 sec");
        });

        it("should handle edge cases near minute boundaries", () => {
            const result = formatDuration(119); // 1:59
            expect(result).toBe("1 min 59 sec");
        });

        it("should format large number of minutes", () => {
            const result = formatDuration(3540); // 59:00
            expect(result).toBe("59 min 0 sec");
        });
    });

    describe("Hours and Minutes Format (>= 1 hour)", () => {
        it("should format exactly 1 hour", () => {
            const result = formatDuration(3600);
            expect(result).toBe("1 hr 0 min");
        });

        it("should format 1 hour with minutes", () => {
            const result = formatDuration(3661); // 1:01:01
            expect(result).toBe("1 hr 1 min");
        });

        it("should format multiple hours with minutes", () => {
            const result = formatDuration(7320); // 2:02:00
            expect(result).toBe("2 hrs 2 min");
        });

        it("should format hours without remaining minutes", () => {
            const result = formatDuration(7200); // 2:00:00
            expect(result).toBe("2 hrs 0 min");
        });

        it('should use singular "hr" for 1 hour', () => {
            const result = formatDuration(3900); // 1:05:00
            expect(result).toBe("1 hr 5 min");
        });

        it('should use plural "hrs" for multiple hours', () => {
            const result = formatDuration(10800); // 3:00:00
            expect(result).toBe("3 hrs 0 min");
        });

        it("should handle large hour values", () => {
            const result = formatDuration(36000); // 10:00:00
            expect(result).toBe("10 hrs 0 min");
        });

        it("should handle very large hour values", () => {
            const result = formatDuration(86400); // 24:00:00
            expect(result).toBe("24 hrs 0 min");
        });

        it("should discard seconds when formatting hours", () => {
            const result = formatDuration(3661); // 1:01:01 → 1 hr 1 min (seconds discarded)
            expect(result).toBe("1 hr 1 min");
        });

        it("should handle complex hour/minute combinations", () => {
            const result = formatDuration(5461); // 1:31:01 → 1 hr 31 min
            expect(result).toBe("1 hr 31 min");
        });
    });

    describe("Edge Cases and Boundary Values", () => {
        it("should handle very large numbers", () => {
            const result = formatDuration(1000000); // ~277 hours
            expect(result).toBe("277 hrs 46 min");
        });

        it("should handle maximum safe integer", () => {
            const maxSafe = Number.MAX_SAFE_INTEGER;
            // This is an extremely large number, but should still work
            const result = formatDuration(maxSafe);
            expect(result).toMatch(/^\d+ hrs \d+ min$/);
        });

        it("should handle exact threshold boundaries", () => {
            // Test exactly at 60 seconds threshold
            expect(formatDuration(59)).toBe("59 sec");
            expect(formatDuration(60)).toBe("1 min 0 sec");

            // Test exactly at 3600 seconds (1 hour) threshold
            expect(formatDuration(3599)).toBe("59 min 59 sec");
            expect(formatDuration(3600)).toBe("1 hr 0 min");
        });
    });

    describe("Performance and Consistency", () => {
        it("should produce consistent results for same input", () => {
            const input = 1234;
            const result1 = formatDuration(input);
            const result2 = formatDuration(input);
            expect(result1).toBe(result2);
            expect(result1).toBe("20 min 34 sec");
        });

        it("should handle repeated calls efficiently", () => {
            const inputs = [0, 30, 90, 150, 3600, 7320];
            const results = inputs.map((input) => formatDuration(input));
            expect(results).toEqual(["0 sec", "30 sec", "1 min 30 sec", "2 min 30 sec", "1 hr 0 min", "2 hrs 2 min"]);
        });

        it("should handle mixed input types consistently", () => {
            expect(formatDuration(90)).toBe("1 min 30 sec");
            expect(formatDuration("90")).toBe("1 min 30 sec");
            expect(formatDuration(90.0)).toBe("1 min 30 sec");
        });
    });

    describe("Real-world Use Cases", () => {
        it("should format typical workout durations", () => {
            expect(formatDuration(1800)).toBe("30 min 0 sec"); // 30 minute workout
            expect(formatDuration(2700)).toBe("45 min 0 sec"); // 45 minute workout
            expect(formatDuration(5400)).toBe("1 hr 30 min"); // 90 minute workout
        });

        it("should format typical activity durations", () => {
            expect(formatDuration(15)).toBe("15 sec"); // Quick activity
            expect(formatDuration(300)).toBe("5 min 0 sec"); // Short break
            expect(formatDuration(1200)).toBe("20 min 0 sec"); // Medium activity
        });

        it("should format marathon-like durations", () => {
            expect(formatDuration(10800)).toBe("3 hrs 0 min"); // 3 hour marathon
            expect(formatDuration(14400)).toBe("4 hrs 0 min"); // 4 hour marathon
        });
    });

    describe("Error Handling and Recovery", () => {
        it("should provide clear error messages for invalid inputs", () => {
            expect(() => formatDuration("abc")).toThrow("Invalid duration input: Input must be a finite number");
            expect(() => formatDuration(-5)).toThrow("Invalid duration input: Duration cannot be negative");
            expect(() => formatDuration("")).toThrow("Invalid duration input: Empty string input");
        });

        it("should handle type coercion edge cases", () => {
            // These should all throw errors with appropriate messages
            expect(() => formatDuration({} as any)).toThrow("Invalid duration input: Input must be a finite number");
            expect(() => formatDuration([] as any)).toThrow("Invalid duration input: Input must be a finite number");
            expect(() => formatDuration(false as any)).toThrow("Invalid duration input: Input must be a finite number");
        });
    });
});

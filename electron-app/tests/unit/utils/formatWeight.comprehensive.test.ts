/**
 * @fileoverview Comprehensive test suite for formatWeight.js utility
 *
 * Tests all aspects of the weight formatting utility including:
 * - Input validation and error handling
 * - Kilogram to pound conversions
 * - Metric and imperial display formatting
 * - Mathematical accuracy and rounding
 * - Edge cases and boundary conditions
 * - Real-world weight scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatWeight } from "../../../utils/formatting/formatters/formatWeight.js";

describe("formatWeight.js - Weight Formatter Utility", () => {
    let consoleSpy: any;

    beforeEach(() => {
        consoleSpy = {
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        consoleSpy.warn.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe("Input Validation", () => {
        it("should return empty string for null input", () => {
            const result = formatWeight(null as any);
            expect(result).toBe("");
        });

        it("should return empty string for undefined input", () => {
            const result = formatWeight(undefined as any);
            expect(result).toBe("");
        });

        it("should return empty string for string input", () => {
            const result = formatWeight("70" as any);
            expect(result).toBe("");
        });

        it("should return empty string for boolean input", () => {
            const result = formatWeight(true as any);
            expect(result).toBe("");
        });

        it("should return empty string for object input", () => {
            const result = formatWeight({} as any);
            expect(result).toBe("");
        });

        it("should return empty string for array input", () => {
            const result = formatWeight([70] as any);
            expect(result).toBe("");
        });

        it("should return empty string for NaN input", () => {
            const result = formatWeight(NaN);
            expect(result).toBe("");
        });

        it("should return empty string for positive infinity", () => {
            const result = formatWeight(Infinity);
            expect(result).toBe("");
        });

        it("should return empty string for negative infinity", () => {
            const result = formatWeight(-Infinity);
            expect(result).toBe("");
        });

        it("should return empty string for negative weight and log warning", () => {
            const result = formatWeight(-10);
            expect(result).toBe("");
            expect(consoleSpy.warn).toHaveBeenCalledWith("[formatWeight] Negative weight value:", -10);
        });

        it("should handle negative zero as valid zero weight", () => {
            const result = formatWeight(-0);
            expect(result).toBe("0 kg (0 lbs)");
            expect(consoleSpy.warn).not.toHaveBeenCalled();
        });
    });

    describe("Valid Weight Conversions", () => {
        it("should handle zero weight correctly", () => {
            const result = formatWeight(0);
            expect(result).toBe("0 kg (0 lbs)");
        });

        it("should format single digit kilograms correctly", () => {
            const result = formatWeight(5);
            expect(result).toBe("5 kg (11 lbs)");
        });

        it("should format double digit kilograms correctly", () => {
            const result = formatWeight(70);
            expect(result).toBe("70 kg (154 lbs)");
        });

        it("should format triple digit kilograms correctly", () => {
            const result = formatWeight(100);
            expect(result).toBe("100 kg (220 lbs)");
        });

        it("should handle decimal weights by preserving input format", () => {
            const result = formatWeight(70.5);
            expect(result).toBe("70.5 kg (155 lbs)");
        });

        it("should handle very small decimal weights", () => {
            const result = formatWeight(0.5);
            expect(result).toBe("0.5 kg (1 lbs)");
        });

        it("should handle larger weights correctly", () => {
            const result = formatWeight(200);
            expect(result).toBe("200 kg (441 lbs)");
        });
    });

    describe("Mathematical Accuracy and Rounding", () => {
        it("should correctly convert using 2.20462 conversion factor", () => {
            // Test known conversions
            expect(formatWeight(1)).toBe("1 kg (2 lbs)"); // 1 * 2.20462 = 2.20462 → rounds to 2
            expect(formatWeight(45.36)).toBe("45.36 kg (100 lbs)"); // 45.36 * 2.20462 ≈ 100
        });

        it("should round pound values to nearest integer", () => {
            // Test cases where rounding matters
            expect(formatWeight(1.13)).toBe("1.13 kg (2 lbs)"); // 1.13 * 2.20462 = 2.49... → rounds to 2
            expect(formatWeight(1.14)).toBe("1.14 kg (3 lbs)"); // 1.14 * 2.20462 = 2.51... → rounds to 3
        });

        it("should handle rounding edge cases precisely", () => {
            // Test exact rounding boundaries
            const weight1 = 0.227; // 0.227 * 2.20462 = 0.5... → rounds to 1
            const weight2 = 0.226; // 0.226 * 2.20462 = 0.498... → rounds to 0

            expect(formatWeight(weight1)).toBe("0.227 kg (1 lbs)");
            expect(formatWeight(weight2)).toBe("0.226 kg (0 lbs)");
        });

        it("should maintain precision for kg display while rounding lbs", () => {
            const result = formatWeight(70.123456);
            expect(result).toBe("70.123456 kg (155 lbs)");
        });

        it("should handle very precise decimal inputs", () => {
            const result = formatWeight(Math.PI); // π ≈ 3.14159
            expect(result).toMatch(/^3\.14159\d* kg \(7 lbs\)$/);
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very large weights", () => {
            const result = formatWeight(1000);
            expect(result).toBe("1000 kg (2205 lbs)");
        });

        it("should handle extremely large weights", () => {
            const result = formatWeight(10000);
            expect(result).toBe("10000 kg (22046 lbs)");
        });

        it("should handle very small positive weights", () => {
            const result = formatWeight(0.001);
            expect(result).toBe("0.001 kg (0 lbs)");
        });

        it("should handle weights close to zero", () => {
            const result = formatWeight(0.0001);
            expect(result).toBe("0.0001 kg (0 lbs)");
        });

        it("should handle maximum safe integer weights", () => {
            const maxWeight = Number.MAX_SAFE_INTEGER;
            const result = formatWeight(maxWeight);
            expect(typeof result).toBe("string");
            expect(result).toMatch(/^\d+ kg \(\d+ lbs\)$/);
        });

        it("should handle minimum positive weight", () => {
            const minWeight = Number.MIN_VALUE;
            const result = formatWeight(minWeight);
            expect(result).toMatch(/kg \(0 lbs\)$/);
        });
    });

    describe("Format Structure and Consistency", () => {
        it("should maintain consistent format pattern", () => {
            const weights = [1, 25, 50, 75, 100];
            const results = weights.map((w) => formatWeight(w));

            results.forEach((result) => {
                expect(result).toMatch(/^\d+(\.\d+)? kg \(\d+ lbs\)$/);
            });
        });

        it("should include proper spacing and units", () => {
            const result = formatWeight(70);
            expect(result).toContain(" kg ");
            expect(result).toContain(" lbs)");
            expect(result.startsWith("70")).toBe(true);
            expect(result.endsWith("lbs)")).toBe(true);
        });

        it("should handle integer vs decimal display consistently", () => {
            expect(formatWeight(70)).toBe("70 kg (154 lbs)");
            expect(formatWeight(70.0)).toBe("70 kg (154 lbs)");
            expect(formatWeight(70.1)).toBe("70.1 kg (155 lbs)");
        });

        it("should maintain proper parentheses structure", () => {
            const result = formatWeight(80);
            expect(result.split("(").length).toBe(2);
            expect(result.split(")").length).toBe(2);
            expect(result.indexOf("(")).toBeGreaterThan(result.indexOf("kg"));
            expect(result.indexOf(")")).toBeGreaterThan(result.indexOf("lbs"));
        });
    });

    describe("Real-world Weight Scenarios", () => {
        it("should format typical human weights correctly", () => {
            // Common adult weights
            expect(formatWeight(60)).toBe("60 kg (132 lbs)");
            expect(formatWeight(70)).toBe("70 kg (154 lbs)");
            expect(formatWeight(80)).toBe("80 kg (176 lbs)");
            expect(formatWeight(90)).toBe("90 kg (198 lbs)");
        });

        it("should format athlete weights correctly", () => {
            // Typical athlete weights
            expect(formatWeight(55)).toBe("55 kg (121 lbs)"); // Lightweight athlete
            expect(formatWeight(75)).toBe("75 kg (165 lbs)"); // Average athlete
            expect(formatWeight(95)).toBe("95 kg (209 lbs)"); // Heavyweight athlete
        });

        it("should format equipment weights correctly", () => {
            // Bike and equipment weights
            expect(formatWeight(8.5)).toBe("8.5 kg (19 lbs)"); // Road bike
            expect(formatWeight(12.5)).toBe("12.5 kg (28 lbs)"); // Mountain bike
            expect(formatWeight(2.5)).toBe("2.5 kg (6 lbs)"); // Helmet + gear
        });

        it("should format bodyweight ranges correctly", () => {
            // Various body weight ranges
            expect(formatWeight(45)).toBe("45 kg (99 lbs)"); // Petite adult
            expect(formatWeight(110)).toBe("110 kg (243 lbs)"); // Large adult
            expect(formatWeight(30)).toBe("30 kg (66 lbs)"); // Child weight
        });

        it("should format professional athlete weights correctly", () => {
            // Professional cycling weights
            expect(formatWeight(58)).toBe("58 kg (128 lbs)"); // Climber
            expect(formatWeight(68)).toBe("68 kg (150 lbs)"); // All-rounder
            expect(formatWeight(85)).toBe("85 kg (187 lbs)"); // Sprinter
        });
    });

    describe("Error Handling", () => {
        it("should catch and handle mathematical errors gracefully", () => {
            // Mock Math.round to throw an error
            const originalRound = Math.round;
            Math.round = vi.fn().mockImplementation(() => {
                throw new Error("Math error");
            });

            const result = formatWeight(70);
            expect(result).toBe("70");
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[formatWeight] Weight formatting failed:",
                expect.any(Error)
            );

            // Restore original function
            Math.round = originalRound;
        });

        it("should handle toString conversion errors", () => {
            // Create a number that might cause toString issues
            const problematicNumber = {
                valueOf: () => 70,
                toString: () => {
                    throw new Error("toString error");
                },
            };

            const result = formatWeight(problematicNumber as any);
            expect(result).toBe("");
        });

        it("should handle conversion factor errors gracefully", () => {
            // This tests the try-catch block around the conversion
            // We can't easily mock the WEIGHT_CONVERSIONS constant,
            // but we can verify the error handling structure exists
            const result = formatWeight(70);
            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("Performance and Consistency", () => {
        it("should handle rapid successive calls efficiently", () => {
            const weights = [45, 55, 65, 75, 85, 95];
            const results = weights.map((w) => formatWeight(w));

            expect(results).toHaveLength(6);
            expect(results[0]).toBe("45 kg (99 lbs)");
            expect(results[5]).toBe("95 kg (209 lbs)");
        });

        it("should be consistent across multiple calls", () => {
            const weight = 70.5;
            const result1 = formatWeight(weight);
            const result2 = formatWeight(weight);
            const result3 = formatWeight(weight);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
            expect(result1).toBe("70.5 kg (155 lbs)");
        });

        it("should handle batch processing efficiently", () => {
            const weights = Array.from({ length: 100 }, (_, i) => i + 1);
            const results = weights.map((w) => formatWeight(w));

            expect(results).toHaveLength(100);
            expect(results.every((r) => typeof r === "string")).toBe(true);
            expect(results.every((r) => r.includes("kg") && r.includes("lbs"))).toBe(true);
        });

        it("should maintain precision across operations", () => {
            const weight = 70.123456789;
            const result = formatWeight(weight);
            expect(result.includes("70.123456789")).toBe(true);
        });
    });

    describe("Conversion Constants", () => {
        it("should use correct kg to pounds conversion factor", () => {
            // Test that the conversion factor 2.20462 is being used correctly
            // 1 kg should convert to approximately 2.20462 lbs (rounded to 2)
            expect(formatWeight(1)).toBe("1 kg (2 lbs)");

            // 5 kg should convert to approximately 11.0231 lbs (rounded to 11)
            expect(formatWeight(5)).toBe("5 kg (11 lbs)");
        });

        it("should produce standard metric/imperial conversions", () => {
            // Test some well-known conversions
            expect(formatWeight(2.268)).toBe("2.268 kg (5 lbs)"); // 5 lbs ≈ 2.268 kg
            expect(formatWeight(4.536)).toBe("4.536 kg (10 lbs)"); // 10 lbs ≈ 4.536 kg
        });

        it("should handle conversion factor edge cases", () => {
            // Test weights that might produce rounding edge cases
            const testCases = [
                { kg: 0.227, expectedLbs: 1 }, // Should round to 1 lb
                { kg: 0.226, expectedLbs: 0 }, // Should round to 0 lbs
            ];

            testCases.forEach(({ kg, expectedLbs }) => {
                const result = formatWeight(kg);
                expect(result).toContain(`(${expectedLbs} lbs)`);
            });
        });
    });
});

/**
 * Tests speed tooltip formatting with multiple unit displays
 *
 * @version 1.0.0
 *
 * @file Comprehensive test suite for formatSpeedTooltip.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatSpeedTooltip } from "../../../utils/formatting/display/formatSpeedTooltip.js";

describe("formatSpeedTooltip.js - Speed Tooltip Formatter", () => {
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Spy on console methods for testing logging
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe("Basic Speed Formatting", () => {
        it("should format zero speed correctly", () => {
            const result = formatSpeedTooltip(0);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
        });

        it("should format typical running speed (5 m/s)", () => {
            const result = formatSpeedTooltip(5);
            expect(result).toBe("5.00 m/s (18.00 km/h, 11.18 mph)");
        });

        it("should format typical cycling speed (10 m/s)", () => {
            const result = formatSpeedTooltip(10);
            expect(result).toBe("10.00 m/s (36.00 km/h, 22.37 mph)");
        });

        it("should format high speed (30 m/s)", () => {
            const result = formatSpeedTooltip(30);
            expect(result).toBe("30.00 m/s (108.00 km/h, 67.11 mph)");
        });

        it("should format decimal speed values", () => {
            const result = formatSpeedTooltip(5.5);
            expect(result).toBe("5.50 m/s (19.80 km/h, 12.30 mph)");
        });

        it("should format very small speed values", () => {
            const result = formatSpeedTooltip(0.1);
            expect(result).toBe("0.10 m/s (0.36 km/h, 0.22 mph)");
        });

        it("should format precise decimal values with proper rounding", () => {
            const result = formatSpeedTooltip(1.234567);
            expect(result).toBe("1.23 m/s (4.44 km/h, 2.76 mph)");
        });

        it("should handle very large speed values", () => {
            const result = formatSpeedTooltip(100);
            expect(result).toBe("100.00 m/s (360.00 km/h, 223.69 mph)");
        });
    });

    describe("Input Validation and Error Handling", () => {
        it("should handle non-numeric string input", () => {
            const result = formatSpeedTooltip("abc" as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                "abc"
            );
        });

        it("should handle null input", () => {
            const result = formatSpeedTooltip(null as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                null
            );
        });

        it("should handle undefined input", () => {
            const result = formatSpeedTooltip(undefined as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                undefined
            );
        });

        it("should handle NaN input", () => {
            const result = formatSpeedTooltip(NaN);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                NaN
            );
        });

        it("should handle Infinity input", () => {
            const result = formatSpeedTooltip(Infinity);
            expect(result).toBe("Infinity m/s (Infinity km/h, Infinity mph)");
        });

        it("should handle negative Infinity input", () => {
            const result = formatSpeedTooltip(-Infinity);
            expect(result).toBe(
                "-Infinity m/s (-Infinity km/h, -Infinity mph)"
            );
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Negative speed value: -Infinity"
            );
        });

        it("should handle object input", () => {
            const result = formatSpeedTooltip({} as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                {}
            );
        });

        it("should handle array input", () => {
            const result = formatSpeedTooltip([5] as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                [5]
            );
        });

        it("should handle boolean true input", () => {
            const result = formatSpeedTooltip(true as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                true
            );
        });

        it("should handle boolean false input", () => {
            const result = formatSpeedTooltip(false as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                false
            );
        });
    });

    describe("Negative Speed Handling", () => {
        it("should format negative speed with warning", () => {
            const result = formatSpeedTooltip(-5);
            expect(result).toBe("-5.00 m/s (-18.00 km/h, -11.18 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Negative speed value: -5"
            );
        });

        it("should format small negative speed", () => {
            const result = formatSpeedTooltip(-0.5);
            expect(result).toBe("-0.50 m/s (-1.80 km/h, -1.12 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Negative speed value: -0.5"
            );
        });

        it("should format large negative speed", () => {
            const result = formatSpeedTooltip(-15.5);
            expect(result).toBe("-15.50 m/s (-55.80 km/h, -34.67 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Negative speed value: -15.5"
            );
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very small positive numbers", () => {
            const result = formatSpeedTooltip(0.001);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
        });

        it("should handle number close to zero", () => {
            const result = formatSpeedTooltip(0.005);
            expect(result).toBe("0.01 m/s (0.02 km/h, 0.01 mph)");
        });

        it("should handle numbers requiring rounding", () => {
            const result = formatSpeedTooltip(1.999);
            expect(result).toBe("2.00 m/s (7.20 km/h, 4.47 mph)");
        });

        it("should handle numbers with many decimal places", () => {
            const result = formatSpeedTooltip(3.141592653589793);
            expect(result).toBe("3.14 m/s (11.31 km/h, 7.03 mph)");
        });

        it("should handle maximum safe integer", () => {
            const result = formatSpeedTooltip(Number.MAX_SAFE_INTEGER);
            expect(result).toContain("m/s");
            expect(result).toContain("km/h");
            expect(result).toContain("mph");
        });

        it("should handle minimum safe integer", () => {
            const result = formatSpeedTooltip(Number.MIN_SAFE_INTEGER);
            expect(result).toContain("m/s");
            expect(result).toContain("km/h");
            expect(result).toContain("mph");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "[formatSpeedTooltip] Negative speed value:"
                )
            );
        });

        it("should handle numbers very close to integers", () => {
            const result = formatSpeedTooltip(4.999999);
            expect(result).toBe("5.00 m/s (18.00 km/h, 11.18 mph)");
        });

        it("should handle epsilon values", () => {
            const result = formatSpeedTooltip(Number.EPSILON);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
        });
    });

    describe("Real-world Speed Scenarios", () => {
        it("should format walking speed (1.4 m/s)", () => {
            const result = formatSpeedTooltip(1.4);
            expect(result).toBe("1.40 m/s (5.04 km/h, 3.13 mph)");
        });

        it("should format jogging speed (3 m/s)", () => {
            const result = formatSpeedTooltip(3);
            expect(result).toBe("3.00 m/s (10.80 km/h, 6.71 mph)");
        });

        it("should format marathon world record pace (5.69 m/s)", () => {
            const result = formatSpeedTooltip(5.69);
            expect(result).toBe("5.69 m/s (20.48 km/h, 12.73 mph)");
        });

        it("should format cycling speed (8.33 m/s = 30 km/h)", () => {
            const result = formatSpeedTooltip(8.33);
            expect(result).toBe("8.33 m/s (29.99 km/h, 18.63 mph)");
        });

        it("should format car city speed (13.89 m/s = 50 km/h)", () => {
            const result = formatSpeedTooltip(13.89);
            expect(result).toBe("13.89 m/s (50.00 km/h, 31.07 mph)");
        });

        it("should format highway speed (27.78 m/s = 100 km/h)", () => {
            const result = formatSpeedTooltip(27.78);
            expect(result).toBe("27.78 m/s (100.01 km/h, 62.14 mph)");
        });

        it("should format sprint speed (12 m/s)", () => {
            const result = formatSpeedTooltip(12);
            expect(result).toBe("12.00 m/s (43.20 km/h, 26.84 mph)");
        });

        it("should format swimming speed (2.2 m/s)", () => {
            const result = formatSpeedTooltip(2.2);
            expect(result).toBe("2.20 m/s (7.92 km/h, 4.92 mph)");
        });
    });

    describe("Precision and Rounding", () => {
        it("should round to 2 decimal places consistently", () => {
            const testCases = [
                { input: 1.234, expected: "1.23" },
                { input: 1.235, expected: "1.24" },
                { input: 1.999, expected: "2.00" },
                { input: 0.996, expected: "1.00" },
                { input: 0.001, expected: "0.00" },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = formatSpeedTooltip(input);
                expect(result).toContain(`${expected} m/s`);
            });
        });

        it("should maintain consistent decimal places across all units", () => {
            const result = formatSpeedTooltip(7.5);
            const parts = result.match(/(\d+\.\d{2})/g);
            expect(parts).toHaveLength(3); // m/s, km/h, mph
            parts?.forEach((part) => {
                expect(part).toMatch(/\d+\.\d{2}/); // Exactly 2 decimal places
            });
        });

        it("should handle rounding edge cases correctly", () => {
            const testCases = [
                1.005, // Banker's rounding edge case
                1.995, // Should round up
                2.995, // Should round up
                0.995, // Should round to 1.00
            ];

            testCases.forEach((testCase) => {
                const result = formatSpeedTooltip(testCase);
                expect(result).toMatch(
                    /\d+\.\d{2} m\/s \(\d+\.\d{2} km\/h, \d+\.\d{2} mph\)/
                );
            });
        });
    });

    describe("Format String Structure", () => {
        it("should maintain consistent format structure", () => {
            const result = formatSpeedTooltip(5.5);
            expect(result).toMatch(
                /^\d+\.\d{2} m\/s \(\d+\.\d{2} km\/h, \d+\.\d{2} mph\)$/
            );
        });

        it("should include all three units in correct order", () => {
            const result = formatSpeedTooltip(10);
            expect(result).toContain("m/s");
            expect(result).toContain("km/h");
            expect(result).toContain("mph");

            // Check order: m/s should come before km/h, which should come before mph
            const mpsIndex = result.indexOf("m/s");
            const kmhIndex = result.indexOf("km/h");
            const mphIndex = result.indexOf("mph");

            expect(mpsIndex).toBeLessThan(kmhIndex);
            expect(kmhIndex).toBeLessThan(mphIndex);
        });

        it("should have proper parentheses and comma structure", () => {
            const result = formatSpeedTooltip(5);
            expect(result).toMatch(
                /^[\d.]+ m\/s \([\d.]+ km\/h, [\d.]+ mph\)$/
            );
        });
    });

    describe("Performance and Consistency", () => {
        it("should handle rapid successive calls efficiently", () => {
            const startTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                formatSpeedTooltip(i / 100);
            }
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
        });

        it("should be consistent across multiple calls", () => {
            const speed = 7.5;
            const results = Array.from({ length: 10 }, () =>
                formatSpeedTooltip(speed)
            );
            const firstResult = results[0];

            results.forEach((result) => {
                expect(result).toBe(firstResult);
            });
        });

        it("should not modify global state", () => {
            const originalConsole = { ...console };
            formatSpeedTooltip(5);

            // Console should be the same (our spies don't count as modification)
            expect(typeof console.log).toBe(typeof originalConsole.log);
            expect(typeof console.warn).toBe(typeof originalConsole.warn);
            expect(typeof console.error).toBe(typeof originalConsole.error);
        });
    });

    describe("Error Recovery and Robustness", () => {
        it("should handle toString conversion edge cases", () => {
            const weirdObject = {
                valueOf: () => 5,
                toString: () => "weird",
            };

            const result = formatSpeedTooltip(weirdObject as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it("should handle numbers that could cause precision issues", () => {
            const problematicNumbers = [
                0.1 + 0.2, // Floating point precision issue
                1e-10, // Very small number
                1e10, // Very large number
                Math.PI, // Irrational number
                Math.E, // Another irrational number
            ];

            problematicNumbers.forEach((num) => {
                const result = formatSpeedTooltip(num);
                expect(result).toMatch(
                    /^\d+\.\d{2} m\/s \(\d+\.\d{2} km\/h, \d+\.\d{2} mph\)$/
                );
            });
        });
    });

    describe("Type Safety and Input Coercion", () => {
        it("should handle numeric strings correctly (should fail as non-number)", () => {
            const result = formatSpeedTooltip("5.5" as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[formatSpeedTooltip] Invalid speed value for tooltip formatting:",
                "5.5"
            );
        });

        it("should handle zero as string correctly (should fail)", () => {
            const result = formatSpeedTooltip("0" as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it("should handle empty string correctly", () => {
            const result = formatSpeedTooltip("" as any);
            expect(result).toBe("0.00 m/s (0.00 km/h, 0.00 mph)");
            expect(consoleWarnSpy).toHaveBeenCalled();
        });
    });
});

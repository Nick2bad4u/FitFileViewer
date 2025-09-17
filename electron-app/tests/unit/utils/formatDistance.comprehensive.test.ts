/**
 * @fileoverview Comprehensive test suite for formatDistance.js utility
 *
 * Tests all aspects of the distance formatting utility including:
 * - Input validation and error handling
 * - Distance conversions (meters to km/miles)
 * - Formatting and precision
 * - Edge cases and boundary conditions
 * - Performance scenarios
 * - Real-world usage patterns
 */

import { describe, it, expect } from "vitest";
import { formatDistance } from "../../../utils/formatting/formatters/formatDistance.js";

describe("formatDistance.js - Distance Formatter Utility", () => {
    describe("Input Validation", () => {
        it("should return empty string for null input", () => {
            expect(formatDistance(null as any)).toBe("");
        });

        it("should return empty string for undefined input", () => {
            expect(formatDistance(undefined as any)).toBe("");
        });

        it("should return empty string for string input", () => {
            expect(formatDistance("1000" as any)).toBe("");
        });

        it("should return empty string for boolean input", () => {
            expect(formatDistance(true as any)).toBe("");
        });

        it("should return empty string for object input", () => {
            expect(formatDistance({} as any)).toBe("");
        });

        it("should return empty string for array input", () => {
            expect(formatDistance([1000] as any)).toBe("");
        });

        it("should return empty string for NaN input", () => {
            expect(formatDistance(NaN)).toBe("");
        });

        it("should return empty string for positive infinity", () => {
            expect(formatDistance(Infinity)).toBe("");
        });

        it("should return empty string for negative infinity", () => {
            expect(formatDistance(-Infinity)).toBe("");
        });

        it("should return empty string for zero distance", () => {
            expect(formatDistance(0)).toBe("");
        });

        it("should return empty string for negative distance", () => {
            expect(formatDistance(-1000)).toBe("");
        });

        it("should return empty string for very small negative values", () => {
            expect(formatDistance(-0.1)).toBe("");
        });
    });

    describe("Valid Distance Conversions", () => {
        it("should format 1000 meters correctly", () => {
            const result = formatDistance(1000);
            expect(result).toBe("1.00 km / 0.62 mi");
        });

        it("should format 5000 meters correctly", () => {
            const result = formatDistance(5000);
            expect(result).toBe("5.00 km / 3.11 mi");
        });

        it("should format 1609.34 meters (1 mile) correctly", () => {
            const result = formatDistance(1609.34);
            expect(result).toBe("1.61 km / 1.00 mi");
        });

        it("should format 10000 meters correctly", () => {
            const result = formatDistance(10000);
            expect(result).toBe("10.00 km / 6.21 mi");
        });

        it("should format half kilometer correctly", () => {
            const result = formatDistance(500);
            expect(result).toBe("0.50 km / 0.31 mi");
        });

        it("should format quarter mile (402.335 meters) correctly", () => {
            const result = formatDistance(402.335);
            expect(result).toBe("0.40 km / 0.25 mi");
        });

        it("should format marathon distance correctly", () => {
            const marathonMeters = 42195; // 42.195 km
            const result = formatDistance(marathonMeters);
            expect(result).toBe("42.20 km / 26.22 mi");
        });
    });

    describe("Decimal Precision and Formatting", () => {
        it("should format to exactly 2 decimal places", () => {
            const result = formatDistance(1234.567);
            expect(result).toMatch(/^\d+\.\d{2} km \/ \d+\.\d{2} mi$/);
        });

        it("should round to 2 decimal places correctly", () => {
            const result = formatDistance(1000.999);
            expect(result).toBe("1.00 km / 0.62 mi");
        });

        it("should handle trailing zeros in formatting", () => {
            const result = formatDistance(2000);
            expect(result).toBe("2.00 km / 1.24 mi");
        });

        it("should format very precise decimal values", () => {
            const result = formatDistance(1609.344); // Slightly more than 1 mile
            expect(result).toBe("1.61 km / 1.00 mi");
        });

        it("should handle rounding edge cases", () => {
            const result = formatDistance(1999.999);
            expect(result).toBe("2.00 km / 1.24 mi");
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very small positive values", () => {
            const result = formatDistance(0.1);
            expect(result).toBe("0.00 km / 0.00 mi");
        });

        it("should handle 1 meter", () => {
            const result = formatDistance(1);
            expect(result).toBe("0.00 km / 0.00 mi");
        });

        it("should handle very large distances", () => {
            const result = formatDistance(1000000); // 1000 km
            expect(result).toBe("1000.00 km / 621.37 mi");
        });

        it("should handle ultra-marathon distances", () => {
            const result = formatDistance(160934); // 100 miles
            expect(result).toBe("160.93 km / 100.00 mi");
        });

        it("should handle fractional meter values", () => {
            const result = formatDistance(1.5);
            expect(result).toBe("0.00 km / 0.00 mi");
        });

        it("should handle float precision issues", () => {
            const result = formatDistance(1000.0000001);
            expect(result).toBe("1.00 km / 0.62 mi");
        });
    });

    describe("Mathematical Accuracy", () => {
        it("should maintain conversion accuracy for kilometers", () => {
            const meters = 5000;
            const expectedKm = meters / 1000;
            const result = formatDistance(meters);
            expect(result).toContain(`${expectedKm.toFixed(2)} km`);
        });

        it("should maintain conversion accuracy for miles", () => {
            const meters = 1609.34; // Exactly 1 mile
            const expectedMiles = meters / 1609.34;
            const result = formatDistance(meters);
            expect(result).toContain(`${expectedMiles.toFixed(2)} mi`);
        });

        it("should handle conversion factor precision", () => {
            const oneMileInMeters = 1609.34;
            const result = formatDistance(oneMileInMeters);
            expect(result).toBe("1.61 km / 1.00 mi");
        });

        it("should verify kilometers calculation", () => {
            const meters = 3456;
            const result = formatDistance(meters);
            const expectedKm = (meters / 1000).toFixed(2);
            expect(result).toContain(`${expectedKm} km`);
        });

        it("should verify miles calculation", () => {
            const meters = 8047; // Approximately 5 miles
            const result = formatDistance(meters);
            const expectedMiles = (meters / 1609.34).toFixed(2);
            expect(result).toContain(`${expectedMiles} mi`);
        });
    });

    describe("Performance Scenarios", () => {
        it("should handle rapid successive calls", () => {
            const distances = [100, 500, 1000, 2000, 5000];
            const results = distances.map((d) => formatDistance(d));

            expect(results).toHaveLength(5);
            results.forEach((result) => {
                expect(result).toMatch(/^\d+\.\d{2} km \/ \d+\.\d{2} mi$/);
            });
        });

        it("should be consistent across multiple calls", () => {
            const distance = 1500;
            const result1 = formatDistance(distance);
            const result2 = formatDistance(distance);
            const result3 = formatDistance(distance);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it("should handle performance with large batch processing", () => {
            const distances = Array.from({ length: 100 }, (_, i) => (i + 1) * 100);
            const results = distances.map((d) => formatDistance(d));

            expect(results).toHaveLength(100);
            expect(results.every((r) => typeof r === "string")).toBe(true);
        });
    });

    describe("Real-world Distance Scenarios", () => {
        it("should format common running distances correctly", () => {
            const fiveK = formatDistance(5000);
            const tenK = formatDistance(10000);
            const halfMarathon = formatDistance(21097.5);

            expect(fiveK).toBe("5.00 km / 3.11 mi");
            expect(tenK).toBe("10.00 km / 6.21 mi");
            expect(halfMarathon).toBe("21.10 km / 13.11 mi");
        });

        it("should format cycling distances correctly", () => {
            const centuryRide = formatDistance(160934); // 100 miles
            const shortRide = formatDistance(20000); // 20 km

            expect(centuryRide).toBe("160.93 km / 100.00 mi");
            expect(shortRide).toBe("20.00 km / 12.43 mi");
        });

        it("should format triathlon distances correctly", () => {
            const ironmanSwim = formatDistance(3800); // 3.8 km swim
            const ironmanBike = formatDistance(180246); // 112 miles bike

            expect(ironmanSwim).toBe("3.80 km / 2.36 mi");
            expect(ironmanBike).toBe("180.25 km / 112.00 mi");
        });

        it("should format track and field distances", () => {
            const track400m = formatDistance(400);
            const track800m = formatDistance(800);
            const track1500m = formatDistance(1500);

            expect(track400m).toBe("0.40 km / 0.25 mi");
            expect(track800m).toBe("0.80 km / 0.50 mi");
            expect(track1500m).toBe("1.50 km / 0.93 mi");
        });
    });

    describe("String Format Validation", () => {
        it("should always include km and mi units", () => {
            const result = formatDistance(1000);
            expect(result).toContain("km");
            expect(result).toContain("mi");
        });

        it("should use forward slash separator", () => {
            const result = formatDistance(1000);
            expect(result).toContain(" / ");
        });

        it("should maintain consistent format structure", () => {
            const results = [100, 1000, 10000].map((d) => formatDistance(d));
            results.forEach((result) => {
                expect(result).toMatch(/^\d+\.\d{2} km \/ \d+\.\d{2} mi$/);
            });
        });

        it("should not include extra whitespace", () => {
            const result = formatDistance(1000);
            expect(result.trim()).toBe(result);
            expect(result).not.toContain("  "); // No double spaces
        });
    });

    describe("Validation Function Behavior", () => {
        it("should correctly identify valid distances", () => {
            // Test positive values that should pass validation
            expect(formatDistance(1)).not.toBe("");
            expect(formatDistance(0.1)).not.toBe("");
            expect(formatDistance(1000.5)).not.toBe("");
        });

        it("should correctly reject invalid inputs", () => {
            // All these should return empty string
            expect(formatDistance(0)).toBe("");
            expect(formatDistance(-1)).toBe("");
            expect(formatDistance(NaN)).toBe("");
            expect(formatDistance(null as any)).toBe("");
        });

        it("should handle minimum distance boundary", () => {
            expect(formatDistance(0)).toBe(""); // At boundary (not included)
            expect(formatDistance(0.00001)).not.toBe(""); // Just above boundary
        });
    });
});

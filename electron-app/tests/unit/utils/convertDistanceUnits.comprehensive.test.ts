/**
 * @file Comprehensive test suite for convertDistanceUnits utility function
 *
 *   Test Categories:
 *
 *   - Input Validation: Type checking, NaN handling, negative values
 *   - Unit Conversions: All supported conversions with precision checking
 *   - Edge Cases: Zero values, very large/small numbers, infinity
 *   - Error Handling: Invalid units, conversion failures, console warnings
 *   - Performance: Efficiency with different number sizes
 *   - Real-world Scenarios: Typical FIT file distance values
 *   - Constants Validation: DISTANCE_UNITS enum values
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    convertDistanceUnits,
    DISTANCE_UNITS,
} from "../../../utils/formatting/converters/convertDistanceUnits.js";

// Mock console to capture warnings and errors
const mockConsole = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
};

// Setup global console mock
beforeEach(() => {
    globalThis.console = mockConsole as any;
});

afterEach(() => {
    vi.clearAllMocks();
});

describe("convertDistanceUnits.js - Distance Unit Converter Utility", () => {
    describe("Input Validation", () => {
        it("should throw TypeError for null input", () => {
            expect(() =>
                convertDistanceUnits(null as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits(null as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow("Expected meters to be a number, received object");
        });

        it("should throw TypeError for undefined input", () => {
            expect(() =>
                convertDistanceUnits(
                    undefined as any,
                    DISTANCE_UNITS.KILOMETERS
                )
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits(
                    undefined as any,
                    DISTANCE_UNITS.KILOMETERS
                )
            ).toThrow("Expected meters to be a number, received undefined");
        });

        it("should throw TypeError for string input", () => {
            expect(() =>
                convertDistanceUnits("1000" as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits("1000" as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow("Expected meters to be a number, received string");
        });

        it("should throw TypeError for boolean input", () => {
            expect(() =>
                convertDistanceUnits(true as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits(true as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow("Expected meters to be a number, received boolean");
        });

        it("should throw TypeError for object input", () => {
            expect(() =>
                convertDistanceUnits({} as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits({} as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow("Expected meters to be a number, received object");
        });

        it("should throw TypeError for array input", () => {
            expect(() =>
                convertDistanceUnits([1000] as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits([1000] as any, DISTANCE_UNITS.KILOMETERS)
            ).toThrow("Expected meters to be a number, received object");
        });

        it("should throw TypeError for NaN input", () => {
            expect(() =>
                convertDistanceUnits(NaN, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
            expect(() =>
                convertDistanceUnits(NaN, DISTANCE_UNITS.KILOMETERS)
            ).toThrow("Expected meters to be a number, received number");
        });

        it("should warn for negative distance values", () => {
            const result = convertDistanceUnits(
                -1000,
                DISTANCE_UNITS.KILOMETERS
            );
            expect(result).toBe(-1); // Should still convert but warn
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertDistanceUnits] Negative distance value:",
                -1000
            );
        });
    });

    describe("Unit Conversions - Meters to Kilometers", () => {
        it("should convert 1000 meters to 1 kilometer", () => {
            const result = convertDistanceUnits(
                1000,
                DISTANCE_UNITS.KILOMETERS
            );
            expect(result).toBe(1);
        });

        it("should convert 5000 meters to 5 kilometers", () => {
            const result = convertDistanceUnits(
                5000,
                DISTANCE_UNITS.KILOMETERS
            );
            expect(result).toBe(5);
        });

        it("should convert 500 meters to 0.5 kilometers", () => {
            const result = convertDistanceUnits(500, DISTANCE_UNITS.KILOMETERS);
            expect(result).toBe(0.5);
        });

        it("should convert 1 meter to 0.001 kilometers", () => {
            const result = convertDistanceUnits(1, DISTANCE_UNITS.KILOMETERS);
            expect(result).toBe(0.001);
        });

        it("should handle decimal input for kilometers conversion", () => {
            const result = convertDistanceUnits(
                1234.5,
                DISTANCE_UNITS.KILOMETERS
            );
            expect(result).toBe(1.2345);
        });
    });

    describe("Unit Conversions - Meters to Feet", () => {
        it("should convert 1 meter to approximately 3.28084 feet", () => {
            const result = convertDistanceUnits(1, DISTANCE_UNITS.FEET);
            expect(result).toBeCloseTo(3.28084, 5);
        });

        it("should convert 10 meters to approximately 32.8084 feet", () => {
            const result = convertDistanceUnits(10, DISTANCE_UNITS.FEET);
            expect(result).toBeCloseTo(32.8084, 4);
        });

        it("should convert 100 meters to approximately 328.084 feet", () => {
            const result = convertDistanceUnits(100, DISTANCE_UNITS.FEET);
            expect(result).toBeCloseTo(328.084, 3);
        });

        it("should handle decimal input for feet conversion", () => {
            const result = convertDistanceUnits(2.5, DISTANCE_UNITS.FEET);
            expect(result).toBeCloseTo(8.2021, 4);
        });
    });

    describe("Unit Conversions - Meters to Miles", () => {
        it("should convert 1609.344 meters to 1 mile", () => {
            const result = convertDistanceUnits(1609.344, DISTANCE_UNITS.MILES);
            expect(result).toBeCloseTo(1, 10);
        });

        it("should convert 3218.688 meters to 2 miles", () => {
            const result = convertDistanceUnits(3218.688, DISTANCE_UNITS.MILES);
            expect(result).toBeCloseTo(2, 10);
        });

        it("should convert 1000 meters to approximately 0.621371 miles", () => {
            const result = convertDistanceUnits(1000, DISTANCE_UNITS.MILES);
            expect(result).toBeCloseTo(0.621371, 6);
        });

        it("should convert 5000 meters to approximately 3.106856 miles", () => {
            const result = convertDistanceUnits(5000, DISTANCE_UNITS.MILES);
            expect(result).toBeCloseTo(3.106856, 6);
        });
    });

    describe("Unit Conversions - Meters to Meters", () => {
        it("should return same value for meters to meters", () => {
            const result = convertDistanceUnits(1000, DISTANCE_UNITS.METERS);
            expect(result).toBe(1000);
        });

        it("should handle decimal values for meters to meters", () => {
            const result = convertDistanceUnits(
                1234.567,
                DISTANCE_UNITS.METERS
            );
            expect(result).toBe(1234.567);
        });

        it("should handle zero for meters to meters", () => {
            const result = convertDistanceUnits(0, DISTANCE_UNITS.METERS);
            expect(result).toBe(0);
        });
    });

    describe("Edge Cases", () => {
        it("should handle zero distance", () => {
            expect(convertDistanceUnits(0, DISTANCE_UNITS.KILOMETERS)).toBe(0);
            expect(convertDistanceUnits(0, DISTANCE_UNITS.FEET)).toBe(0);
            expect(convertDistanceUnits(0, DISTANCE_UNITS.MILES)).toBe(0);
            expect(convertDistanceUnits(0, DISTANCE_UNITS.METERS)).toBe(0);
        });

        it("should handle very large numbers", () => {
            const largeNumber = 1e10; // 10 billion meters
            const kmResult = convertDistanceUnits(
                largeNumber,
                DISTANCE_UNITS.KILOMETERS
            );
            expect(kmResult).toBe(10000000); // 10 million km

            const feetResult = convertDistanceUnits(
                largeNumber,
                DISTANCE_UNITS.FEET
            );
            expect(feetResult).toBeCloseTo(32808400000, 0); // Very large feet value
        });

        it("should handle very small numbers", () => {
            const smallNumber = 0.001; // 1 millimeter
            const kmResult = convertDistanceUnits(
                smallNumber,
                DISTANCE_UNITS.KILOMETERS
            );
            expect(kmResult).toBe(0.000001);

            const feetResult = convertDistanceUnits(
                smallNumber,
                DISTANCE_UNITS.FEET
            );
            expect(feetResult).toBeCloseTo(0.00328084, 8);
        });

        it("should handle Infinity input", () => {
            expect(
                convertDistanceUnits(Infinity, DISTANCE_UNITS.KILOMETERS)
            ).toBe(Infinity);
            expect(convertDistanceUnits(Infinity, DISTANCE_UNITS.FEET)).toBe(
                Infinity
            );
            expect(convertDistanceUnits(Infinity, DISTANCE_UNITS.MILES)).toBe(
                Infinity
            );
        });

        it("should handle negative infinity", () => {
            expect(
                convertDistanceUnits(-Infinity, DISTANCE_UNITS.KILOMETERS)
            ).toBe(-Infinity);
            expect(convertDistanceUnits(-Infinity, DISTANCE_UNITS.FEET)).toBe(
                -Infinity
            );
            expect(convertDistanceUnits(-Infinity, DISTANCE_UNITS.MILES)).toBe(
                -Infinity
            );
        });
    });

    describe("Error Handling", () => {
        it("should warn for unknown units and default to meters", () => {
            const result = convertDistanceUnits(1000, "unknown" as any);
            expect(result).toBe(1000); // Should default to meters
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertDistanceUnits] Unknown unit 'unknown', defaulting to meters"
            );
        });

        it("should handle empty string unit", () => {
            const result = convertDistanceUnits(1000, "" as any);
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertDistanceUnits] Unknown unit '', defaulting to meters"
            );
        });

        it("should handle null unit", () => {
            const result = convertDistanceUnits(1000, null as any);
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertDistanceUnits] Unknown unit 'null', defaulting to meters"
            );
        });

        it("should handle undefined unit", () => {
            const result = convertDistanceUnits(1000, undefined as any);
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertDistanceUnits] Unknown unit 'undefined', defaulting to meters"
            );
        });
    });

    describe("Performance and Precision", () => {
        it("should be consistent across multiple calls", () => {
            const input = 1000;
            const unit = DISTANCE_UNITS.KILOMETERS;

            const result1 = convertDistanceUnits(input, unit);
            const result2 = convertDistanceUnits(input, unit);
            const result3 = convertDistanceUnits(input, unit);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it("should handle rapid successive conversions", () => {
            const inputs = [
                100,
                1000,
                5000,
                10000,
                42195,
            ]; // Various distances including marathon
            const results = inputs.map((input) =>
                convertDistanceUnits(input, DISTANCE_UNITS.KILOMETERS)
            );

            expect(results).toEqual([
                0.1,
                1,
                5,
                10,
                42.195,
            ]);
        });

        it("should maintain precision for common running distances", () => {
            // 5K run
            expect(convertDistanceUnits(5000, DISTANCE_UNITS.KILOMETERS)).toBe(
                5
            );

            // 10K run
            expect(convertDistanceUnits(10000, DISTANCE_UNITS.KILOMETERS)).toBe(
                10
            );

            // Half marathon
            expect(
                convertDistanceUnits(21097.5, DISTANCE_UNITS.KILOMETERS)
            ).toBe(21.0975);

            // Marathon
            expect(convertDistanceUnits(42195, DISTANCE_UNITS.KILOMETERS)).toBe(
                42.195
            );
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should convert GPS track distance correctly", () => {
            // Typical GPS track: 15.5 km cycling route
            const trackDistance = 15500; // meters

            const km = convertDistanceUnits(
                trackDistance,
                DISTANCE_UNITS.KILOMETERS
            );
            const miles = convertDistanceUnits(
                trackDistance,
                DISTANCE_UNITS.MILES
            );
            const feet = convertDistanceUnits(
                trackDistance,
                DISTANCE_UNITS.FEET
            );

            expect(km).toBe(15.5);
            expect(miles).toBeCloseTo(9.631253, 6);
            expect(feet).toBeCloseTo(50853.02, 2);
        });

        it("should handle elevation gain conversion", () => {
            // Elevation gain: 500 meters
            const elevationGain = 500;

            const feet = convertDistanceUnits(
                elevationGain,
                DISTANCE_UNITS.FEET
            );
            expect(feet).toBeCloseTo(1640.42, 2);
        });

        it("should convert running pace distances", () => {
            // 400m track lap
            const trackLap = 400;
            expect(
                convertDistanceUnits(trackLap, DISTANCE_UNITS.FEET)
            ).toBeCloseTo(1312.336, 3);

            // 1 mile in meters
            const oneMileInMeters = 1609.344;
            expect(
                convertDistanceUnits(oneMileInMeters, DISTANCE_UNITS.MILES)
            ).toBeCloseTo(1, 10);
        });

        it("should handle swimming pool distances", () => {
            // Olympic pool: 50 meters
            const olympicPool = 50;
            expect(
                convertDistanceUnits(olympicPool, DISTANCE_UNITS.FEET)
            ).toBeCloseTo(164.042, 3);

            // Yard pool: 25 yards ≈ 22.86 meters
            const yardPool = 22.86;
            expect(
                convertDistanceUnits(yardPool, DISTANCE_UNITS.FEET)
            ).toBeCloseTo(75, 0);
        });

        it("should convert FIT file distance data types", () => {
            // Typical FIT file distance values (in meters)
            const fitDistances = [
                1000, // 1km segment
                5000, // 5km total
                21097.5, // Half marathon
                42195, // Marathon
            ];

            const kilometersResults = fitDistances.map((d) =>
                convertDistanceUnits(d, DISTANCE_UNITS.KILOMETERS)
            );
            const milesResults = fitDistances.map((d) =>
                convertDistanceUnits(d, DISTANCE_UNITS.MILES)
            );

            expect(kilometersResults).toEqual([
                1,
                5,
                21.0975,
                42.195,
            ]);
            expect(milesResults[0]).toBeCloseTo(0.621371, 6);
            expect(milesResults[1]).toBeCloseTo(3.106856, 6);
            expect(milesResults[2]).toBeCloseTo(13.109, 3);
            expect(milesResults[3]).toBeCloseTo(26.219, 3);
        });
    });

    describe("Constants Validation", () => {
        it("should have correct DISTANCE_UNITS enum values", () => {
            expect(DISTANCE_UNITS.METERS).toBe("meters");
            expect(DISTANCE_UNITS.KILOMETERS).toBe("kilometers");
            expect(DISTANCE_UNITS.FEET).toBe("feet");
            expect(DISTANCE_UNITS.MILES).toBe("miles");
        });

        it("should export DISTANCE_UNITS as a constant object", () => {
            expect(typeof DISTANCE_UNITS).toBe("object");
            expect(DISTANCE_UNITS).toBeDefined();

            // Verify all expected properties exist
            const expectedUnits = [
                "METERS",
                "KILOMETERS",
                "FEET",
                "MILES",
            ];
            expectedUnits.forEach((unit) => {
                expect(DISTANCE_UNITS).toHaveProperty(unit);
            });
        });

        it("should use correct conversion factors internally", () => {
            // Test that conversion factors are mathematically correct

            // 1000 meters = 1 kilometer
            expect(convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS)).toBe(
                1
            );

            // 1 meter = 3.28084 feet (standard conversion)
            expect(convertDistanceUnits(1, DISTANCE_UNITS.FEET)).toBeCloseTo(
                3.28084,
                5
            );

            // 1609.344 meters = 1 mile (exactly)
            expect(
                convertDistanceUnits(1609.344, DISTANCE_UNITS.MILES)
            ).toBeCloseTo(1, 10);
        });
    });

    describe("Conversion Accuracy", () => {
        it("should maintain accuracy for round-trip conversions where possible", () => {
            const originalMeters = 1000;

            // Convert to km and back (should be exact)
            const km = convertDistanceUnits(
                originalMeters,
                DISTANCE_UNITS.KILOMETERS
            );
            const backToMeters = km * 1000; // Manual conversion back
            expect(backToMeters).toBe(originalMeters);
        });

        it("should handle floating point precision correctly", () => {
            // Test values that might cause floating point issues
            const testValue = 123.456789;

            const km = convertDistanceUnits(
                testValue,
                DISTANCE_UNITS.KILOMETERS
            );
            const feet = convertDistanceUnits(testValue, DISTANCE_UNITS.FEET);
            const miles = convertDistanceUnits(testValue, DISTANCE_UNITS.MILES);

            expect(km).toBeCloseTo(0.123456789, 9);
            expect(feet).toBeCloseTo(405.04197, 5);
            expect(miles).toBeCloseTo(0.0767125, 7);
        });

        it("should handle edge case measurements accurately", () => {
            // Test some specific distances that are commonly referenced

            // 100 meters (common track distance)
            expect(convertDistanceUnits(100, DISTANCE_UNITS.FEET)).toBeCloseTo(
                328.084,
                3
            );

            // 1500 meters (metric mile)
            expect(
                convertDistanceUnits(1500, DISTANCE_UNITS.MILES)
            ).toBeCloseTo(0.932057, 6);

            // 10000 meters (10K race)
            expect(
                convertDistanceUnits(10000, DISTANCE_UNITS.MILES)
            ).toBeCloseTo(6.213712, 6);
        });
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertMpsToMph } from "../../../utils/formatting/converters/convertMpsToMph.js";

describe("convertMpsToMph.js - Speed Unit Converter Utility (MPS to MPH)", () => {
    let mockConsole: {
        warn: any;
        error: any;
    };

    beforeEach(() => {
        mockConsole = {
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        mockConsole.warn.mockRestore();
        mockConsole.error.mockRestore();
    });

    describe("Input Validation", () => {
        it("should throw TypeError for null input", () => {
            expect(() => convertMpsToMph(null as any)).toThrow("Expected mps to be a number, received object");
        });

        it("should throw TypeError for undefined input", () => {
            expect(() => convertMpsToMph(undefined as any)).toThrow("Expected mps to be a number, received undefined");
        });

        it("should throw TypeError for string input", () => {
            expect(() => convertMpsToMph("10" as any)).toThrow("Expected mps to be a number, received string");
        });

        it("should throw TypeError for boolean input", () => {
            expect(() => convertMpsToMph(true as any)).toThrow("Expected mps to be a number, received boolean");
        });

        it("should throw TypeError for object input", () => {
            expect(() => convertMpsToMph({} as any)).toThrow("Expected mps to be a number, received object");
        });

        it("should throw TypeError for array input", () => {
            expect(() => convertMpsToMph([] as any)).toThrow("Expected mps to be a number, received object");
        });

        it("should throw TypeError for NaN input", () => {
            expect(() => convertMpsToMph(NaN)).toThrow("Expected mps to be a number, received number");
        });

        it("should warn for negative speed values", () => {
            const result = convertMpsToMph(-5);
            expect(result).toBeCloseTo(-11.18468, 5); // Still converts but warns
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertMpsToMph] Negative speed value:", -5);
        });
    });

    describe("Basic Conversions", () => {
        it("should convert zero meters per second correctly", () => {
            expect(convertMpsToMph(0)).toBe(0);
        });

        it("should convert common walking speed (1.4 m/s)", () => {
            const result = convertMpsToMph(1.4);
            expect(result).toBeCloseTo(3.13171, 5); // ~3.1 mph
        });

        it("should convert common running speed (5 m/s)", () => {
            const result = convertMpsToMph(5);
            expect(result).toBeCloseTo(11.18468, 5); // ~11.2 mph
        });

        it("should convert common cycling speed (10 m/s)", () => {
            const result = convertMpsToMph(10);
            expect(result).toBeCloseTo(22.36936, 5); // ~22.4 mph
        });

        it("should convert car highway speed (28 m/s)", () => {
            const result = convertMpsToMph(28);
            expect(result).toBeCloseTo(62.63408, 3); // ~62.6 mph
        });

        it("should handle decimal input values", () => {
            const result = convertMpsToMph(4.4704); // 10 mph in m/s
            expect(result).toBeCloseTo(10, 4);
        });
    });

    describe("Edge Cases", () => {
        it("should handle very small numbers", () => {
            const result = convertMpsToMph(0.0001);
            expect(result).toBeCloseTo(0.0002236936, 10);
        });

        it("should handle very large numbers", () => {
            const result = convertMpsToMph(1000000);
            expect(result).toBeCloseTo(2236936, 0);
        });

        it("should handle Infinity input", () => {
            const result = convertMpsToMph(Infinity);
            expect(result).toBe(Infinity);
        });

        it("should handle negative infinity", () => {
            const result = convertMpsToMph(-Infinity);
            expect(result).toBe(-Infinity);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertMpsToMph] Negative speed value:", -Infinity);
        });

        it("should handle floating point precision edge cases", () => {
            // Test for precision issues with decimal multiplication
            const result = convertMpsToMph(0.1);
            expect(result).toBeCloseTo(0.2236936, 7);
        });
    });

    describe("Performance and Precision", () => {
        it("should be consistent across multiple calls", () => {
            const testSpeed = 22.352; // ~50 mph
            const results = Array.from({ length: 100 }, () => convertMpsToMph(testSpeed));
            const firstResult = results[0];

            expect(results.every((result) => result === firstResult)).toBe(true);
        });

        it("should handle rapid successive conversions", () => {
            const testSpeeds = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
            const expectedResults = testSpeeds.map((speed) => speed * 2.236936);

            const results = testSpeeds.map((speed) => convertMpsToMph(speed));

            results.forEach((result, index) => {
                expect(result).toBeCloseTo(expectedResults[index], 5);
            });
        });

        it("should maintain precision for common fitness speeds", () => {
            // Test speeds common in fitness tracking
            expect(convertMpsToMph(2.5)).toBeCloseTo(5.5923, 4); // Jogging
            expect(convertMpsToMph(4.17)).toBeCloseTo(9.32802, 5); // Fast running
            expect(convertMpsToMph(8.33)).toBeCloseTo(18.63364, 4); // Cycling
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should convert GPS track speeds correctly", () => {
            // Typical GPS speeds from fitness tracking
            const gpsSpeed = 3.2; // m/s from GPS
            const result = convertMpsToMph(gpsSpeed);
            expect(result).toBeCloseTo(7.15819, 4);
        });

        it("should handle running pace conversions", () => {
            // Marathon world record pace (approximately)
            const marathonPace = 5.7; // m/s
            const result = convertMpsToMph(marathonPace);
            expect(result).toBeCloseTo(12.75054, 5);
        });

        it("should convert cycling speeds", () => {
            // Professional cycling speeds
            const cyclingSpeed = 16.67; // m/s (~60 km/h)
            const result = convertMpsToMph(cyclingSpeed);
            expect(result).toBeCloseTo(37.29373, 2);
        });

        it("should handle FIT file speed data types", () => {
            // FIT files often contain speed in m/s as integers or fixed-point
            const fitSpeeds = [0, 1, 2, 3, 5, 8, 13, 21]; // Fibonacci-like progression
            const results = fitSpeeds.map((speed) => convertMpsToMph(speed));

            const expected = [0, 2.236936, 4.473872, 6.710808, 11.18468, 17.89549, 29.08021, 46.97565];
            results.forEach((result, index) => {
                expect(result).toBeCloseTo(expected[index], 4);
            });
        });

        it("should handle speed sensor data", () => {
            // Speed sensor typically provides m/s readings
            const sensorReading = 4.5; // m/s
            const result = convertMpsToMph(sensorReading);
            expect(result).toBeCloseTo(10.06621, 5);
        });
    });

    describe("Constants Validation", () => {
        it("should use correct conversion factor (2.236936)", () => {
            // 1 m/s = 2.236936 mph (standard conversion factor)
            expect(convertMpsToMph(1)).toBeCloseTo(2.236936, 6);
        });

        it("should validate conversion factor precision", () => {
            // Test that our conversion factor is mathematically correct
            // 1 m/s = 3.6 km/h = 3.6 / 1.609344 mph ≈ 2.236936 mph
            const testCases = [
                { mps: 1, expected: 2.236936 },
                { mps: 10, expected: 22.36936 },
                { mps: 100, expected: 223.6936 },
            ];

            testCases.forEach(({ mps, expected }) => {
                expect(convertMpsToMph(mps)).toBeCloseTo(expected, 5);
            });
        });
    });

    describe("Conversion Accuracy", () => {
        it("should maintain accuracy for round-trip conversions where possible", () => {
            // Note: Perfect round-trip isn't always possible due to floating point,
            // but we can test reasonable accuracy
            const originalSpeeds = [1, 2, 5, 10, 25.5];

            originalSpeeds.forEach((speed) => {
                const converted = convertMpsToMph(speed);
                const roundTrip = converted / 2.236936; // Convert back to m/s
                expect(roundTrip).toBeCloseTo(speed, 8);
            });
        });

        it("should handle floating point precision correctly", () => {
            // Test cases that might cause floating point issues
            const precisionTests = [
                { input: 1 / 3, expected: (1 / 3) * 2.236936 },
                { input: 0.1, expected: 0.2236936 },
                { input: 0.3, expected: 0.6710808 },
            ];

            precisionTests.forEach(({ input, expected }) => {
                const result = convertMpsToMph(input);
                expect(result).toBeCloseTo(expected, 7);
            });
        });

        it("should handle edge case measurements accurately", () => {
            // Test some specific speeds that are commonly referenced

            // Walking speed (3 mph = 1.341 m/s, reverse check)
            expect(convertMpsToMph(1.341)).toBeCloseTo(3.000025, 3);

            // Highway speed (65 mph = 29.058 m/s, reverse check)
            expect(convertMpsToMph(29.058)).toBeCloseTo(65.001255, 3);
        });
    });

    describe("Standard Speed References", () => {
        it("should convert common US speed limits correctly", () => {
            // Test common US speed limits in mph
            expect(convertMpsToMph(13.41)).toBeCloseTo(30, 1); // 30 mph speed limit
            expect(convertMpsToMph(22.35)).toBeCloseTo(50, 1); // 50 mph speed limit
            expect(convertMpsToMph(29.06)).toBeCloseTo(65, 1); // 65 mph highway speed
        });

        it("should handle athletic performance benchmarks", () => {
            // World record marathon pace is about 4:34/mile = ~13.1 mph = ~5.86 m/s
            expect(convertMpsToMph(5.86)).toBeCloseTo(13.1, 1);

            // Elite cycling time trial speed ~50 km/h = ~13.89 m/s = ~31 mph
            expect(convertMpsToMph(13.89)).toBeCloseTo(31.1, 1);
        });
    });
});

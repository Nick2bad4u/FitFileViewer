import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertMpsToKmh } from '../../../utils/formatting/converters/convertMpsToKmh.js';

describe('convertMpsToKmh.js - Speed Unit Converter Utility (MPS to KMH)', () => {
  let mockConsole: {
    warn: any;
    error: any;
  };

  beforeEach(() => {
    mockConsole = {
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    mockConsole.warn.mockRestore();
    mockConsole.error.mockRestore();
  });

  describe('Input Validation', () => {
    it('should throw TypeError for null input', () => {
      expect(() => convertMpsToKmh(null as any))
        .toThrow('Expected mps to be a number, received object');
    });

    it('should throw TypeError for undefined input', () => {
      expect(() => convertMpsToKmh(undefined as any))
        .toThrow('Expected mps to be a number, received undefined');
    });

    it('should throw TypeError for string input', () => {
      expect(() => convertMpsToKmh('10' as any))
        .toThrow('Expected mps to be a number, received string');
    });

    it('should throw TypeError for boolean input', () => {
      expect(() => convertMpsToKmh(true as any))
        .toThrow('Expected mps to be a number, received boolean');
    });

    it('should throw TypeError for object input', () => {
      expect(() => convertMpsToKmh({} as any))
        .toThrow('Expected mps to be a number, received object');
    });

    it('should throw TypeError for array input', () => {
      expect(() => convertMpsToKmh([] as any))
        .toThrow('Expected mps to be a number, received object');
    });

    it('should throw TypeError for NaN input', () => {
      expect(() => convertMpsToKmh(NaN))
        .toThrow('Expected mps to be a number, received number');
    });

    it('should warn for negative speed values', () => {
      const result = convertMpsToKmh(-5);
      expect(result).toBe(-18); // Still converts but warns
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertMpsToKmh] Negative speed value:", -5
      );
    });
  });

  describe('Basic Conversions', () => {
    it('should convert zero meters per second correctly', () => {
      expect(convertMpsToKmh(0)).toBe(0);
    });

    it('should convert common walking speed (1.4 m/s)', () => {
      const result = convertMpsToKmh(1.4);
      expect(result).toBeCloseTo(5.04, 2); // ~5 km/h
    });

    it('should convert common running speed (5 m/s)', () => {
      const result = convertMpsToKmh(5);
      expect(result).toBe(18); // Exactly 18 km/h
    });

    it('should convert common cycling speed (10 m/s)', () => {
      const result = convertMpsToKmh(10);
      expect(result).toBe(36); // Exactly 36 km/h
    });

    it('should convert car highway speed (28 m/s)', () => {
      const result = convertMpsToKmh(28);
      expect(result).toBeCloseTo(100.8, 1); // ~100 km/h
    });

    it('should handle decimal input values', () => {
      const result = convertMpsToKmh(2.777778);
      expect(result).toBeCloseTo(10, 5); // ~10 km/h
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small numbers', () => {
      const result = convertMpsToKmh(0.0001);
      expect(result).toBeCloseTo(0.00036, 7);
    });

    it('should handle very large numbers', () => {
      const result = convertMpsToKmh(1000000);
      expect(result).toBe(3600000); // 3.6 million km/h
    });

    it('should handle Infinity input', () => {
      const result = convertMpsToKmh(Infinity);
      expect(result).toBe(Infinity);
    });

    it('should handle negative infinity', () => {
      const result = convertMpsToKmh(-Infinity);
      expect(result).toBe(-Infinity);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertMpsToKmh] Negative speed value:", -Infinity
      );
    });

    it('should handle floating point precision edge cases', () => {
      // Test for precision issues with decimal multiplication
      const result = convertMpsToKmh(0.1);
      expect(result).toBeCloseTo(0.36, 10);
    });
  });

  describe('Performance and Precision', () => {
    it('should be consistent across multiple calls', () => {
      const testSpeed = 13.89; // 50 km/h
      const results = Array.from({ length: 100 }, () => convertMpsToKmh(testSpeed));
      const firstResult = results[0];

      expect(results.every(result => result === firstResult)).toBe(true);
    });

    it('should handle rapid successive conversions', () => {
      const testSpeeds = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
      const expectedResults = [3.6, 7.2, 10.8, 14.4, 18, 36, 54, 72, 90, 108];

      const results = testSpeeds.map(speed => convertMpsToKmh(speed));

      results.forEach((result, index) => {
        expect(result).toBeCloseTo(expectedResults[index], 1);
      });
    });

    it('should maintain precision for common fitness speeds', () => {
      // Test speeds common in fitness tracking
      expect(convertMpsToKmh(2.5)).toBeCloseTo(9, 1); // Jogging
      expect(convertMpsToKmh(4.17)).toBeCloseTo(15.012, 3); // Fast running
      expect(convertMpsToKmh(8.33)).toBeCloseTo(29.988, 3); // Cycling
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should convert GPS track speeds correctly', () => {
      // Typical GPS speeds from fitness tracking
      const gpsSpeed = 3.2; // m/s from GPS
      const result = convertMpsToKmh(gpsSpeed);
      expect(result).toBeCloseTo(11.52, 2);
    });

    it('should handle running pace conversions', () => {
      // Marathon world record pace (approximately)
      const marathonPace = 5.7; // m/s
      const result = convertMpsToKmh(marathonPace);
      expect(result).toBeCloseTo(20.52, 2);
    });

    it('should convert cycling speeds', () => {
      // Professional cycling speeds
      const cyclingSpeed = 16.67; // m/s (60 km/h)
      const result = convertMpsToKmh(cyclingSpeed);
      expect(result).toBeCloseTo(60.012, 3);
    });

    it('should handle FIT file speed data types', () => {
      // FIT files often contain speed in m/s as integers or fixed-point
      const fitSpeeds = [0, 1, 2, 3, 5, 8, 13, 21]; // Fibonacci-like progression
      const results = fitSpeeds.map(speed => convertMpsToKmh(speed));

      expect(results).toEqual(expect.arrayContaining([
        expect.closeTo(0, 1),
        expect.closeTo(3.6, 1),
        expect.closeTo(7.2, 1),
        expect.closeTo(10.8, 1),
        expect.closeTo(18, 1),
        expect.closeTo(28.8, 1),
        expect.closeTo(46.8, 1),
        expect.closeTo(75.6, 1)
      ]));
    });

    it('should handle speed sensor data', () => {
      // Speed sensor typically provides m/s readings
      const sensorReading = 4.5; // m/s
      const result = convertMpsToKmh(sensorReading);
      expect(result).toBeCloseTo(16.2, 1);
    });
  });

  describe('Constants Validation', () => {
    it('should use correct conversion factor (3.6)', () => {
      // 1 m/s = 3.6 km/h (exact mathematical relationship)
      expect(convertMpsToKmh(1)).toBe(3.6);
    });

    it('should validate conversion factor precision', () => {
      // Test that our conversion factor is mathematically correct
      // 1 m/s = 1 meter / 1 second = 3600 meters / 3600 seconds = 3600 meters / 1 hour = 3.6 km / 1 hour
      const testCases = [
        { mps: 1, expected: 3.6 },
        { mps: 10, expected: 36 },
        { mps: 100, expected: 360 }
      ];

      testCases.forEach(({ mps, expected }) => {
        expect(convertMpsToKmh(mps)).toBe(expected);
      });
    });
  });

  describe('Conversion Accuracy', () => {
    it('should maintain accuracy for round-trip conversions where possible', () => {
      // Note: Perfect round-trip isn't always possible due to floating point,
      // but we can test reasonable accuracy
      const originalSpeeds = [1, 2, 5, 10, 25.5];

      originalSpeeds.forEach(speed => {
        const converted = convertMpsToKmh(speed);
        const roundTrip = converted / 3.6; // Convert back to m/s
        expect(roundTrip).toBeCloseTo(speed, 10);
      });
    });

    it('should handle floating point precision correctly', () => {
      // Test cases that might cause floating point issues
      const precisionTests = [
        { input: 1/3, expected: (1/3) * 3.6 },
        { input: 0.1, expected: 0.36 },
        { input: 0.3, expected: 1.08 }
      ];

      precisionTests.forEach(({ input, expected }) => {
        const result = convertMpsToKmh(input);
        expect(result).toBeCloseTo(expected, 10);
      });
    });

    it('should handle edge case measurements accurately', () => {
      // Test some specific speeds that are commonly referenced

      // Walking speed (5 km/h = 1.389 m/s, reverse check)
      expect(convertMpsToKmh(1.389)).toBeCloseTo(5.0004, 4);

      // Running speed (15 km/h = 4.167 m/s, reverse check)
      expect(convertMpsToKmh(4.167)).toBeCloseTo(15.0012, 4);

      // Speed limit (50 km/h = 13.889 m/s, reverse check)
      expect(convertMpsToKmh(13.889)).toBeCloseTo(50.0004, 4);
    });
  });
});

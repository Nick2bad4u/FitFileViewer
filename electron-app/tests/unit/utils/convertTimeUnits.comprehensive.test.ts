import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertTimeUnits, TIME_UNITS } from '../../../utils/formatting/converters/convertTimeUnits.js';

describe('convertTimeUnits.js - Time Unit Converter Utility', () => {
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
      expect(() => convertTimeUnits(null as any, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received object');
    });

    it('should throw TypeError for undefined input', () => {
      expect(() => convertTimeUnits(undefined as any, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received undefined');
    });

    it('should throw TypeError for string input', () => {
      expect(() => convertTimeUnits('60' as any, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received string');
    });

    it('should throw TypeError for boolean input', () => {
      expect(() => convertTimeUnits(true as any, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received boolean');
    });

    it('should throw TypeError for object input', () => {
      expect(() => convertTimeUnits({} as any, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received object');
    });

    it('should throw TypeError for array input', () => {
      expect(() => convertTimeUnits([] as any, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received object');
    });

    it('should throw TypeError for NaN input', () => {
      expect(() => convertTimeUnits(NaN, TIME_UNITS.MINUTES))
        .toThrow('Expected seconds to be a number, received number');
    });

    it('should warn for negative time values', () => {
      const result = convertTimeUnits(-60, TIME_UNITS.MINUTES);
      expect(result).toBe(-1); // Still converts but warns
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTimeUnits] Negative time value:", -60
      );
    });
  });

  describe('Basic Conversions - Seconds to Minutes', () => {
    it('should convert 60 seconds to 1 minute', () => {
      const result = convertTimeUnits(60, TIME_UNITS.MINUTES);
      expect(result).toBe(1);
    });

    it('should convert 120 seconds to 2 minutes', () => {
      const result = convertTimeUnits(120, TIME_UNITS.MINUTES);
      expect(result).toBe(2);
    });

    it('should convert 30 seconds to 0.5 minutes', () => {
      const result = convertTimeUnits(30, TIME_UNITS.MINUTES);
      expect(result).toBe(0.5);
    });

    it('should convert 90 seconds to 1.5 minutes', () => {
      const result = convertTimeUnits(90, TIME_UNITS.MINUTES);
      expect(result).toBe(1.5);
    });

    it('should convert zero seconds to zero minutes', () => {
      const result = convertTimeUnits(0, TIME_UNITS.MINUTES);
      expect(result).toBe(0);
    });
  });

  describe('Basic Conversions - Seconds to Hours', () => {
    it('should convert 3600 seconds to 1 hour', () => {
      const result = convertTimeUnits(3600, TIME_UNITS.HOURS);
      expect(result).toBe(1);
    });

    it('should convert 7200 seconds to 2 hours', () => {
      const result = convertTimeUnits(7200, TIME_UNITS.HOURS);
      expect(result).toBe(2);
    });

    it('should convert 1800 seconds to 0.5 hours', () => {
      const result = convertTimeUnits(1800, TIME_UNITS.HOURS);
      expect(result).toBe(0.5);
    });

    it('should convert 5400 seconds to 1.5 hours', () => {
      const result = convertTimeUnits(5400, TIME_UNITS.HOURS);
      expect(result).toBe(1.5);
    });

    it('should convert zero seconds to zero hours', () => {
      const result = convertTimeUnits(0, TIME_UNITS.HOURS);
      expect(result).toBe(0);
    });
  });

  describe('Basic Conversions - Seconds to Seconds', () => {
    it('should return same value for seconds to seconds', () => {
      expect(convertTimeUnits(0, TIME_UNITS.SECONDS)).toBe(0);
      expect(convertTimeUnits(60, TIME_UNITS.SECONDS)).toBe(60);
      expect(convertTimeUnits(3600, TIME_UNITS.SECONDS)).toBe(3600);
      expect(convertTimeUnits(12345, TIME_UNITS.SECONDS)).toBe(12345);
    });

    it('should handle decimal values for seconds to seconds', () => {
      expect(convertTimeUnits(60.5, TIME_UNITS.SECONDS)).toBe(60.5);
      expect(convertTimeUnits(3600.25, TIME_UNITS.SECONDS)).toBe(3600.25);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      const result = convertTimeUnits(1000000, TIME_UNITS.HOURS);
      expect(result).toBeCloseTo(277.777778, 6);
    });

    it('should handle very small numbers', () => {
      const result = convertTimeUnits(0.001, TIME_UNITS.MINUTES);
      expect(result).toBeCloseTo(0.0000166667, 10);
    });

    it('should handle Infinity input', () => {
      expect(convertTimeUnits(Infinity, TIME_UNITS.MINUTES)).toBe(Infinity);
      expect(convertTimeUnits(Infinity, TIME_UNITS.HOURS)).toBe(Infinity);
    });

    it('should handle negative infinity', () => {
      const result = convertTimeUnits(-Infinity, TIME_UNITS.MINUTES);
      expect(result).toBe(-Infinity);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTimeUnits] Negative time value:", -Infinity
      );
    });

    it('should handle floating point precision edge cases', () => {
      const result = convertTimeUnits(0.1, TIME_UNITS.MINUTES);
      expect(result).toBeCloseTo(0.001666667, 9);
    });
  });

  describe('Error Handling', () => {
    it('should warn for unknown units and default to seconds', () => {
      const result = convertTimeUnits(3600, 'milliseconds' as any);
      expect(result).toBe(3600); // Should default to seconds (no conversion)
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTimeUnits] Unknown unit 'milliseconds', defaulting to seconds"
      );
    });

    it('should handle empty string unit', () => {
      const result = convertTimeUnits(3600, '' as any);
      expect(result).toBe(3600);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTimeUnits] Unknown unit '', defaulting to seconds"
      );
    });

    it('should handle null unit', () => {
      const result = convertTimeUnits(3600, null as any);
      expect(result).toBe(3600);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTimeUnits] Unknown unit 'null', defaulting to seconds"
      );
    });

    it('should handle undefined unit', () => {
      const result = convertTimeUnits(3600, undefined as any);
      expect(result).toBe(3600);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTimeUnits] Unknown unit 'undefined', defaulting to seconds"
      );
    });
  });

  describe('Performance and Precision', () => {
    it('should be consistent across multiple calls', () => {
      const testTime = 7200; // 2 hours
      const results = Array.from({ length: 100 }, () => convertTimeUnits(testTime, TIME_UNITS.HOURS));
      const firstResult = results[0];

      expect(results.every(result => result === firstResult)).toBe(true);
      expect(firstResult).toBe(2);
    });

    it('should handle rapid successive conversions', () => {
      const testTimes = [60, 120, 180, 240, 300, 600, 900, 1200, 1800, 3600];
      const expectedMinutes = [1, 2, 3, 4, 5, 10, 15, 20, 30, 60];

      const results = testTimes.map(time => convertTimeUnits(time, TIME_UNITS.MINUTES));

      results.forEach((result, index) => {
        expect(result).toBe(expectedMinutes[index]);
      });
    });

    it('should maintain precision for workout durations', () => {
      // Test times common in fitness tracking
      expect(convertTimeUnits(1800, TIME_UNITS.MINUTES)).toBe(30); // 30-minute workout
      expect(convertTimeUnits(2700, TIME_UNITS.MINUTES)).toBe(45); // 45-minute workout
      expect(convertTimeUnits(5400, TIME_UNITS.HOURS)).toBe(1.5); // 1.5-hour workout
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should convert workout session times', () => {
      // Typical workout durations
      expect(convertTimeUnits(1200, TIME_UNITS.MINUTES)).toBe(20); // 20-minute HIIT
      expect(convertTimeUnits(2400, TIME_UNITS.MINUTES)).toBe(40); // 40-minute run
      expect(convertTimeUnits(3600, TIME_UNITS.HOURS)).toBe(1); // 1-hour cycling
    });

    it('should handle GPS activity durations', () => {
      // GPS track durations
      const shortRun = convertTimeUnits(1800, TIME_UNITS.MINUTES);
      expect(shortRun).toBe(30);

      const longRide = convertTimeUnits(14400, TIME_UNITS.HOURS);
      expect(longRide).toBe(4);
    });

    it('should convert lap and split times', () => {
      // Track lap times (typical 400m lap in seconds)
      const lapTime = convertTimeUnits(75, TIME_UNITS.MINUTES);
      expect(lapTime).toBe(1.25);

      // Mile split time
      const mileTime = convertTimeUnits(480, TIME_UNITS.MINUTES);
      expect(mileTime).toBe(8);
    });

    it('should handle FIT file time data types', () => {
      // FIT files often contain time in seconds
      const fitTimes = [0, 30, 60, 300, 600, 1800, 3600, 7200];
      const expectedMinutes = [0, 0.5, 1, 5, 10, 30, 60, 120];

      const results = fitTimes.map(time => convertTimeUnits(time, TIME_UNITS.MINUTES));

      results.forEach((result, index) => {
        expect(result).toBe(expectedMinutes[index]);
      });
    });

    it('should convert heart rate zone durations', () => {
      // Time spent in various HR zones
      const zone1Time = convertTimeUnits(600, TIME_UNITS.MINUTES); // 10 minutes
      expect(zone1Time).toBe(10);

      const zone3Time = convertTimeUnits(1200, TIME_UNITS.MINUTES); // 20 minutes
      expect(zone3Time).toBe(20);
    });
  });

  describe('Constants Validation', () => {
    it('should have correct TIME_UNITS enum values', () => {
      expect(TIME_UNITS.SECONDS).toBe('seconds');
      expect(TIME_UNITS.MINUTES).toBe('minutes');
      expect(TIME_UNITS.HOURS).toBe('hours');
    });

    it('should export TIME_UNITS as a constant object', () => {
      expect(typeof TIME_UNITS).toBe('object');
      expect(TIME_UNITS).not.toBeNull();

      // Ensure it's not an array
      expect(Array.isArray(TIME_UNITS)).toBe(false);
    });

    it('should use correct conversion factors internally', () => {
      // 1 minute = 60 seconds
      expect(convertTimeUnits(60, TIME_UNITS.MINUTES)).toBe(1);

      // 1 hour = 3600 seconds
      expect(convertTimeUnits(3600, TIME_UNITS.HOURS)).toBe(1);

      // Verify conversion factors
      expect(convertTimeUnits(120, TIME_UNITS.MINUTES)).toBe(2);
      expect(convertTimeUnits(7200, TIME_UNITS.HOURS)).toBe(2);
    });
  });

  describe('Conversion Accuracy', () => {
    it('should maintain accuracy for round-trip conversions where possible', () => {
      // Test mathematical accuracy
      const testTimes = [60, 120, 300, 600, 1800, 3600, 7200];

      testTimes.forEach(time => {
        // Convert to minutes and back
        const minutes = convertTimeUnits(time, TIME_UNITS.MINUTES);
        const backToSeconds = minutes * 60;
        expect(backToSeconds).toBeCloseTo(time, 10);

        // Convert to hours and back
        const hours = convertTimeUnits(time, TIME_UNITS.HOURS);
        const backToSeconds2 = hours * 3600;
        expect(backToSeconds2).toBeCloseTo(time, 10);
      });
    });

    it('should handle floating point precision correctly', () => {
      // Test cases that might cause floating point issues
      const precisionTests = [
        { input: 1/3, expectedMinutes: (1/3) / 60 },
        { input: 1, expectedMinutes: 1/60 },
        { input: 59, expectedMinutes: 59/60 }
      ];

      precisionTests.forEach(({ input, expectedMinutes }) => {
        const result = convertTimeUnits(input, TIME_UNITS.MINUTES);
        expect(result).toBeCloseTo(expectedMinutes, 15);
      });
    });

    it('should handle edge case measurements accurately', () => {
      // Test some specific times that are commonly referenced

      // 1 minute
      expect(convertTimeUnits(60, TIME_UNITS.MINUTES)).toBe(1);

      // 1 hour
      expect(convertTimeUnits(3600, TIME_UNITS.HOURS)).toBe(1);

      // Half hour
      expect(convertTimeUnits(1800, TIME_UNITS.MINUTES)).toBe(30);
      expect(convertTimeUnits(1800, TIME_UNITS.HOURS)).toBe(0.5);

      // Quarter hour
      expect(convertTimeUnits(900, TIME_UNITS.MINUTES)).toBe(15);
      expect(convertTimeUnits(900, TIME_UNITS.HOURS)).toBe(0.25);
    });
  });

  describe('Athletic Performance Times', () => {
    it('should convert common running pace times', () => {
      // 5-minute mile pace per kilometer (approximately)
      expect(convertTimeUnits(300, TIME_UNITS.MINUTES)).toBe(5);

      // 8-minute mile pace
      expect(convertTimeUnits(480, TIME_UNITS.MINUTES)).toBe(8);

      // Marathon world record pace (approximately 2:01:39 = 7299 seconds)
      expect(convertTimeUnits(7299, TIME_UNITS.HOURS)).toBeCloseTo(2.0275, 4);
    });

    it('should handle cycling session durations', () => {
      // Short interval session
      expect(convertTimeUnits(2400, TIME_UNITS.MINUTES)).toBe(40);

      // Long endurance ride
      expect(convertTimeUnits(18000, TIME_UNITS.HOURS)).toBe(5);

      // Century ride duration (approximately)
      expect(convertTimeUnits(21600, TIME_UNITS.HOURS)).toBe(6);
    });

    it('should convert swimming workout times', () => {
      // 1500m swim time (approximately 20 minutes)
      expect(convertTimeUnits(1200, TIME_UNITS.MINUTES)).toBe(20);

      // 50m sprint time (30 seconds)
      expect(convertTimeUnits(30, TIME_UNITS.MINUTES)).toBe(0.5);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertTemperatureUnits, TEMPERATURE_UNITS } from '../../../utils/formatting/converters/convertTemperatureUnits.js';

describe('convertTemperatureUnits.js - Temperature Unit Converter Utility', () => {
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
      expect(() => convertTemperatureUnits(null as any, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received object');
    });

    it('should throw TypeError for undefined input', () => {
      expect(() => convertTemperatureUnits(undefined as any, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received undefined');
    });

    it('should throw TypeError for string input', () => {
      expect(() => convertTemperatureUnits('25' as any, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received string');
    });

    it('should throw TypeError for boolean input', () => {
      expect(() => convertTemperatureUnits(true as any, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received boolean');
    });

    it('should throw TypeError for object input', () => {
      expect(() => convertTemperatureUnits({} as any, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received object');
    });

    it('should throw TypeError for array input', () => {
      expect(() => convertTemperatureUnits([] as any, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received object');
    });

    it('should throw TypeError for NaN input', () => {
      expect(() => convertTemperatureUnits(NaN, TEMPERATURE_UNITS.FAHRENHEIT))
        .toThrow('Expected celsius to be a number, received number');
    });
  });

  describe('Basic Conversions - Celsius to Fahrenheit', () => {
    it('should convert freezing point (0°C to 32°F)', () => {
      const result = convertTemperatureUnits(0, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(32);
    });

    it('should convert boiling point (100°C to 212°F)', () => {
      const result = convertTemperatureUnits(100, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(212);
    });

    it('should convert room temperature (25°C to 77°F)', () => {
      const result = convertTemperatureUnits(25, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(77);
    });

    it('should convert body temperature (37°C to 98.6°F)', () => {
      const result = convertTemperatureUnits(37, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBeCloseTo(98.6, 1);
    });

    it('should convert negative temperatures (-40°C to -40°F)', () => {
      const result = convertTemperatureUnits(-40, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(-40);
    });

    it('should handle decimal input values', () => {
      const result = convertTemperatureUnits(36.5, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBeCloseTo(97.7, 1);
    });
  });

  describe('Basic Conversions - Celsius to Celsius', () => {
    it('should return same value for celsius to celsius', () => {
      expect(convertTemperatureUnits(0, TEMPERATURE_UNITS.CELSIUS)).toBe(0);
      expect(convertTemperatureUnits(25, TEMPERATURE_UNITS.CELSIUS)).toBe(25);
      expect(convertTemperatureUnits(-10, TEMPERATURE_UNITS.CELSIUS)).toBe(-10);
      expect(convertTemperatureUnits(100, TEMPERATURE_UNITS.CELSIUS)).toBe(100);
    });

    it('should handle decimal values for celsius to celsius', () => {
      expect(convertTemperatureUnits(23.5, TEMPERATURE_UNITS.CELSIUS)).toBe(23.5);
      expect(convertTemperatureUnits(-15.7, TEMPERATURE_UNITS.CELSIUS)).toBe(-15.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle absolute zero (-273.15°C)', () => {
      const result = convertTemperatureUnits(-273.15, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBeCloseTo(-459.67, 2);
    });

    it('should handle very high temperatures', () => {
      const result = convertTemperatureUnits(1000, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(1832);
    });

    it('should handle very low temperatures', () => {
      const result = convertTemperatureUnits(-1000, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(-1768);
    });

    it('should handle Infinity input', () => {
      const result = convertTemperatureUnits(Infinity, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(Infinity);
    });

    it('should handle negative infinity', () => {
      const result = convertTemperatureUnits(-Infinity, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBe(-Infinity);
    });

    it('should handle very small decimal differences', () => {
      const result = convertTemperatureUnits(0.1, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(result).toBeCloseTo(32.18, 2);
    });
  });

  describe('Error Handling', () => {
    it('should warn for unknown units and default to celsius', () => {
      const result = convertTemperatureUnits(25, 'kelvin' as any);
      expect(result).toBe(25); // Should default to celsius (no conversion)
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTemperatureUnits] Unknown unit 'kelvin', defaulting to celsius"
      );
    });

    it('should handle empty string unit', () => {
      const result = convertTemperatureUnits(25, '' as any);
      expect(result).toBe(25);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTemperatureUnits] Unknown unit '', defaulting to celsius"
      );
    });

    it('should handle null unit', () => {
      const result = convertTemperatureUnits(25, null as any);
      expect(result).toBe(25);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTemperatureUnits] Unknown unit 'null', defaulting to celsius"
      );
    });

    it('should handle undefined unit', () => {
      const result = convertTemperatureUnits(25, undefined as any);
      expect(result).toBe(25);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        "[convertTemperatureUnits] Unknown unit 'undefined', defaulting to celsius"
      );
    });
  });

  describe('Performance and Precision', () => {
    it('should be consistent across multiple calls', () => {
      const testTemp = 20; // 20°C
      const results = Array.from({ length: 100 }, () => convertTemperatureUnits(testTemp, TEMPERATURE_UNITS.FAHRENHEIT));
      const firstResult = results[0];

      expect(results.every(result => result === firstResult)).toBe(true);
      expect(firstResult).toBe(68); // 20°C = 68°F
    });

    it('should handle rapid successive conversions', () => {
      const testTemps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const expectedResults = [32, 50, 68, 86, 104, 122, 140, 158, 176, 194, 212];

      const results = testTemps.map(temp => convertTemperatureUnits(temp, TEMPERATURE_UNITS.FAHRENHEIT));

      results.forEach((result, index) => {
        expect(result).toBe(expectedResults[index]);
      });
    });

    it('should maintain precision for weather temperatures', () => {
      // Test temperatures common in weather reporting
      expect(convertTemperatureUnits(15, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(59); // Cool day
      expect(convertTemperatureUnits(30, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(86); // Hot day
      expect(convertTemperatureUnits(-5, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(23); // Cold day
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should convert body temperature correctly', () => {
      // Normal body temperature
      const normalTemp = convertTemperatureUnits(36.7, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(normalTemp).toBeCloseTo(98.06, 2);

      // Fever temperature
      const feverTemp = convertTemperatureUnits(38.5, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(feverTemp).toBeCloseTo(101.3, 1);
    });

    it('should handle cooking temperatures', () => {
      // Oven temperatures
      expect(convertTemperatureUnits(180, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(356); // Common baking temp
      expect(convertTemperatureUnits(200, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(392); // High heat baking
      expect(convertTemperatureUnits(220, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(428); // Very high heat
    });

    it('should convert weather station data', () => {
      // Typical weather station readings
      const morningTemp = convertTemperatureUnits(12, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(morningTemp).toBeCloseTo(53.6, 1);

      const afternoonTemp = convertTemperatureUnits(28, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(afternoonTemp).toBeCloseTo(82.4, 1);
    });

    it('should handle fitness tracker temperature data', () => {
      // Skin temperature from fitness devices
      const skinTemp = convertTemperatureUnits(32, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(skinTemp).toBeCloseTo(89.6, 1);

      // Ambient temperature
      const ambientTemp = convertTemperatureUnits(22, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(ambientTemp).toBeCloseTo(71.6, 1);
    });

    it('should convert scientific measurement data', () => {
      // Laboratory conditions
      const labTemp = convertTemperatureUnits(23, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(labTemp).toBeCloseTo(73.4, 1);

      // Calibration temperature
      const calTemp = convertTemperatureUnits(20, TEMPERATURE_UNITS.FAHRENHEIT);
      expect(calTemp).toBe(68);
    });
  });

  describe('Constants Validation', () => {
    it('should have correct TEMPERATURE_UNITS enum values', () => {
      expect(TEMPERATURE_UNITS.CELSIUS).toBe('celsius');
      expect(TEMPERATURE_UNITS.FAHRENHEIT).toBe('fahrenheit');
    });

    it('should export TEMPERATURE_UNITS as a constant object', () => {
      expect(typeof TEMPERATURE_UNITS).toBe('object');
      expect(TEMPERATURE_UNITS).not.toBeNull();

      // Ensure it's not an array
      expect(Array.isArray(TEMPERATURE_UNITS)).toBe(false);
    });

    it('should use correct conversion factors internally', () => {
      // Verify the formula: F = C * (9/5) + 32
      // Test with known reference points
      expect(convertTemperatureUnits(0, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(32);
      expect(convertTemperatureUnits(100, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(212);

      // Verify the conversion factor (9/5 = 1.8)
      expect(convertTemperatureUnits(1, TEMPERATURE_UNITS.FAHRENHEIT)).toBeCloseTo(33.8, 1);
    });
  });

  describe('Conversion Accuracy', () => {
    it('should maintain accuracy for round-trip conversions where possible', () => {
      // Note: Since we only convert C->F, we can't test round-trip directly,
      // but we can verify mathematical accuracy
      const testTemps = [0, 25, 50, 75, 100, -10, -50];

      testTemps.forEach(temp => {
        const fahrenheit = convertTemperatureUnits(temp, TEMPERATURE_UNITS.FAHRENHEIT);
        const backToCelsius = (fahrenheit - 32) * (5/9);
        expect(backToCelsius).toBeCloseTo(temp, 10);
      });
    });

    it('should handle floating point precision correctly', () => {
      // Test cases that might cause floating point issues
      const precisionTests = [
        { input: 1/3, expected: (1/3) * (9/5) + 32 },
        { input: 0.1, expected: 0.1 * 1.8 + 32 },
        { input: 0.3, expected: 0.3 * 1.8 + 32 }
      ];

      precisionTests.forEach(({ input, expected }) => {
        const result = convertTemperatureUnits(input, TEMPERATURE_UNITS.FAHRENHEIT);
        expect(result).toBeCloseTo(expected, 10);
      });
    });

    it('should handle edge case measurements accurately', () => {
      // Test some specific temperatures that are commonly referenced

      // Water freezing point
      expect(convertTemperatureUnits(0, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(32);

      // Water boiling point
      expect(convertTemperatureUnits(100, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(212);

      // Room temperature
      expect(convertTemperatureUnits(20, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(68);

      // Body temperature
      expect(convertTemperatureUnits(37, TEMPERATURE_UNITS.FAHRENHEIT)).toBeCloseTo(98.6, 1);
    });
  });

  describe('Mathematical Verification', () => {
    it('should verify the Celsius to Fahrenheit formula', () => {
      // F = C * (9/5) + 32
      const testCases = [
        { celsius: 0, fahrenheit: 32 },
        { celsius: 5, fahrenheit: 41 },
        { celsius: 10, fahrenheit: 50 },
        { celsius: 15, fahrenheit: 59 },
        { celsius: 20, fahrenheit: 68 },
        { celsius: 25, fahrenheit: 77 },
        { celsius: 30, fahrenheit: 86 },
        { celsius: 35, fahrenheit: 95 },
        { celsius: 40, fahrenheit: 104 }
      ];

      testCases.forEach(({ celsius, fahrenheit }) => {
        expect(convertTemperatureUnits(celsius, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(fahrenheit);
      });
    });

    it('should handle negative temperatures correctly', () => {
      // Test negative Celsius temperatures
      expect(convertTemperatureUnits(-10, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(14);
      expect(convertTemperatureUnits(-20, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(-4);
      expect(convertTemperatureUnits(-30, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(-22);
      expect(convertTemperatureUnits(-40, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(-40); // Special case where C = F
    });
  });
});

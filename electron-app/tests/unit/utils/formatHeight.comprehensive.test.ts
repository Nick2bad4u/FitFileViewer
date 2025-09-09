/**
 * @fileoverview Comprehensive test suite for formatHeight.js utility
 *
 * Tests all aspects of the height formatting utility including:
 * - Input validation and error handling
 * - Height conversions (meters to feet/inches)
 * - Metric and imperial formatting
 * - Edge cases and boundary conditions
 * - Rounding and precision handling
 * - Real-world height scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatHeight } from '../../../utils/formatting/formatters/formatHeight.js';

describe('formatHeight.js - Height Formatter Utility', () => {

    let consoleSpy: any;

    beforeEach(() => {
        consoleSpy = {
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        };
    });

    afterEach(() => {
        consoleSpy.warn.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe('Input Validation', () => {
        it('should return empty string for null input', () => {
            expect(formatHeight(null as any)).toBe('');
        });

        it('should return empty string for undefined input', () => {
            expect(formatHeight(undefined as any)).toBe('');
        });

        it('should return empty string for string input', () => {
            expect(formatHeight('1.75' as any)).toBe('');
        });

        it('should return empty string for boolean input', () => {
            expect(formatHeight(true as any)).toBe('');
        });

        it('should return empty string for object input', () => {
            expect(formatHeight({} as any)).toBe('');
        });

        it('should return empty string for array input', () => {
            expect(formatHeight([1.75] as any)).toBe('');
        });

        it('should return empty string for NaN input', () => {
            expect(formatHeight(NaN)).toBe('');
        });

        it('should return empty string for positive infinity', () => {
            expect(formatHeight(Infinity)).toBe('');
        });

        it('should return empty string for negative infinity', () => {
            expect(formatHeight(-Infinity)).toBe('');
        });

        it('should return empty string for negative height and log warning', () => {
            const result = formatHeight(-1.75);
            expect(result).toBe('');
            expect(consoleSpy.warn).toHaveBeenCalledWith('[formatHeight] Negative height value:', -1.75);
        });

        it('should format zero height correctly', () => {
            const result = formatHeight(0);
            expect(result).toBe('0.00 m (0\'0")');
        });

        it('should format negative zero correctly', () => {
            const result = formatHeight(-0);
            expect(result).toBe('0.00 m (0\'0")');
        });
    });

    describe('Valid Height Conversions', () => {
        it('should format 1.75 meters correctly', () => {
            const result = formatHeight(1.75);
            expect(result).toBe('1.75 m (5\'9")');
        });

        it('should format 1.83 meters correctly', () => {
            const result = formatHeight(1.83);
            expect(result).toBe('1.83 m (6\'0")');
        });

        it('should format 2.0 meters correctly', () => {
            const result = formatHeight(2.0);
            expect(result).toBe('2.00 m (6\'7")');
        });

        it('should format 1.52 meters correctly', () => {
            const result = formatHeight(1.52);
            expect(result).toBe('1.52 m (5\'0")');
        });

        it('should format 1.68 meters correctly', () => {
            const result = formatHeight(1.68);
            expect(result).toBe('1.68 m (5\'6")');
        });

        it('should format very small positive height', () => {
            const result = formatHeight(0.1);
            expect(result).toBe('0.10 m (0\'4")');
        });

        it('should format very large height', () => {
            const result = formatHeight(3.0);
            expect(result).toBe('3.00 m (9\'10")');
        });
    });

    describe('Decimal Precision and Formatting', () => {
        it('should always format meters to 2 decimal places', () => {
            expect(formatHeight(1.5)).toBe('1.50 m (4\'11")');
            expect(formatHeight(1.333)).toBe('1.33 m (4\'4")');
            expect(formatHeight(1.999)).toBe('2.00 m (6\'7")');
            expect(formatHeight(2)).toBe('2.00 m (6\'7")');
        });

        it('should handle very precise decimal values', () => {
            const result = formatHeight(1.7526);
            expect(result).toBe('1.75 m (5\'9")');
        });

        it('should round meters to 2 decimal places', () => {
            expect(formatHeight(1.755)).toBe('1.75 m (5\'9")'); // toFixed uses banker's rounding
            expect(formatHeight(1.756)).toBe('1.76 m (5\'9")');
        });

        it('should handle float precision issues', () => {
            const result = formatHeight(1.75000000001);
            expect(result).toBe('1.75 m (5\'9")');
        });
    });

    describe('Inch Rounding and Adjustment', () => {
        it('should handle rounding up to 12 inches', () => {
            // Find a height that would round to exactly 12 inches
            const heightFor12Inches = 1.8288; // Should be close to 6'0"
            const result = formatHeight(heightFor12Inches);
            expect(result).toMatch(/6'0"/); // Should adjust 5'12" to 6'0"
        });

        it('should round inches to nearest whole number', () => {
            const results = [1.75, 1.76, 1.77].map(h => formatHeight(h));
            results.forEach(result => {
                expect(result).toMatch(/\d+'(\d{1,2})"/); // Should have whole number inches
            });
        });

        it('should handle edge case near 12 inches', () => {
            // Height that should round to almost 12 inches but not quite
            const result = formatHeight(1.8235);
            expect(result).not.toContain('12"'); // Should not contain 12 inches
        });

        it('should correctly adjust feet when inches round to 12', () => {
            // Test a height that will cause inches to round to exactly 12
            const testHeight = 1.8288; // Approximately 6 feet
            const result = formatHeight(testHeight);
            const feetMatch = result.match(/(\d+)'/);
            const inchesMatch = result.match(/'(\d+)"/);

            expect(feetMatch).toBeTruthy();
            expect(inchesMatch).toBeTruthy();
            expect(Number(inchesMatch![1])).toBeLessThan(12);
        });
    });

    describe('Mathematical Accuracy', () => {
        it('should convert meters to inches accurately', () => {
            const meters = 1.0;
            const expectedInches = meters * 39.3701;
            const result = formatHeight(meters);

            // Extract the imperial measurement and verify it's mathematically correct
            expect(result).toBe('1.00 m (3\'3")');
            // 1 meter = 39.3701 inches = 3 feet 3.3701 inches ≈ 3'3"
        });

        it('should handle standard height conversions', () => {
            // 5 feet = 60 inches = 1.524 meters
            const fiveFeet = 60 / 39.3701;
            const result = formatHeight(fiveFeet);
            expect(result).toContain('5\'0"');
        });

        it('should handle 6 feet conversion', () => {
            // 6 feet = 72 inches = 1.8288 meters
            const sixFeet = 72 / 39.3701;
            const result = formatHeight(sixFeet);
            expect(result).toContain('6\'0"');
        });

        it('should maintain consistency in conversion factors', () => {
            // Test that our conversion factors are consistent
            const testHeights = [1.5, 1.6, 1.7, 1.8, 1.9, 2.0];
            const results = testHeights.map(h => formatHeight(h));

            results.forEach((result, index) => {
                expect(result).toMatch(/^\d+\.\d{2} m \(\d+'(\d{1,2})"\)$/);
                expect(result).not.toContain('12"'); // No 12 inches should appear
            });
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        it('should handle very small positive values', () => {
            const result = formatHeight(0.01);
            expect(result).toBe('0.01 m (0\'0")');
        });

        it('should handle minimum practical height', () => {
            const result = formatHeight(0.5);
            expect(result).toBe('0.50 m (1\'8")');
        });

        it('should handle maximum practical height', () => {
            const result = formatHeight(2.5);
            expect(result).toBe('2.50 m (8\'2")');
        });

        it('should handle decimal values near boundaries', () => {
            const results = [0.999, 1.001, 1.999, 2.001].map(h => formatHeight(h));
            results.forEach(result => {
                expect(result).toMatch(/^\d+\.\d{2} m \(\d+'(\d{1,2})"\)$/);
            });
        });

        it('should handle very large numbers', () => {
            const result = formatHeight(10.0);
            expect(result).toBe('10.00 m (32\'10")');
        });

        it('should handle very precise decimal inputs', () => {
            const result = formatHeight(1.23456789);
            expect(result).toBe('1.23 m (4\'1")');
        });
    });

    describe('Real-world Height Scenarios', () => {
        it('should format common adult heights correctly', () => {
            const commonHeights = [
                { meters: 1.60, expected: '1.60 m (5\'3")' },
                { meters: 1.65, expected: '1.65 m (5\'5")' },
                { meters: 1.70, expected: '1.70 m (5\'7")' },
                { meters: 1.75, expected: '1.75 m (5\'9")' },
                { meters: 1.80, expected: '1.80 m (5\'11")' },
                { meters: 1.85, expected: '1.85 m (6\'1")' }
            ];

            commonHeights.forEach(({ meters, expected }) => {
                expect(formatHeight(meters)).toBe(expected);
            });
        });

        it('should format basketball player heights', () => {
            expect(formatHeight(2.01)).toBe('2.01 m (6\'7")'); // Average NBA height
            expect(formatHeight(2.16)).toBe('2.16 m (7\'1")'); // Tall NBA player
            expect(formatHeight(2.29)).toBe('2.29 m (7\'6")'); // Very tall NBA player
        });

        it('should format child heights', () => {
            expect(formatHeight(1.20)).toBe('1.20 m (3\'11")'); // Tall child
            expect(formatHeight(1.00)).toBe('1.00 m (3\'3")'); // Average child
            expect(formatHeight(0.80)).toBe('0.80 m (2\'7")'); // Young child
        });

        it('should format athletic heights', () => {
            expect(formatHeight(1.68)).toBe('1.68 m (5\'6")'); // Gymnast
            expect(formatHeight(1.78)).toBe('1.78 m (5\'10")'); // Soccer player
            expect(formatHeight(1.93)).toBe('1.93 m (6\'4")'); // Volleyball player
        });
    });

    describe('String Format Validation', () => {
        it('should always include both metric and imperial units', () => {
            const result = formatHeight(1.75);
            expect(result).toContain('m');
            expect(result).toContain('\'');
            expect(result).toContain('"');
        });

        it('should use consistent format structure', () => {
            const results = [1.5, 1.7, 1.9, 2.1].map(h => formatHeight(h));
            results.forEach(result => {
                expect(result).toMatch(/^\d+\.\d{2} m \(\d+'(\d{1,2})"\)$/);
            });
        });

        it('should not include extra whitespace', () => {
            const result = formatHeight(1.75);
            expect(result.trim()).toBe(result);
            expect(result).not.toContain('  '); // No double spaces
        });

        it('should maintain parentheses for imperial measurement', () => {
            const result = formatHeight(1.75);
            expect(result).toContain('(');
            expect(result).toContain(')');
        });
    });

    describe('Error Handling', () => {
        it('should catch and handle conversion errors gracefully', () => {
            // Mock Math.floor to throw an error
            const originalFloor = Math.floor;
            Math.floor = vi.fn().mockImplementation(() => {
                throw new Error('Math error');
            });

            const result = formatHeight(1.75);
            expect(result).toBe('1.75');
            expect(consoleSpy.error).toHaveBeenCalledWith('[formatHeight] Height formatting failed:', expect.any(Error));

            // Restore original function
            Math.floor = originalFloor;
        });

        it('should catch and handle rounding errors gracefully', () => {
            // Mock Math.round to throw an error
            const originalRound = Math.round;
            Math.round = vi.fn().mockImplementation(() => {
                throw new Error('Rounding error');
            });

            const result = formatHeight(1.75);
            expect(result).toBe('1.75');
            expect(consoleSpy.error).toHaveBeenCalled();

            // Restore original function
            Math.round = originalRound;
        });

        it('should return original value as string when formatting fails', () => {
            // Mock toFixed to throw an error
            const originalToFixed = Number.prototype.toFixed;
            Number.prototype.toFixed = vi.fn().mockImplementation(() => {
                throw new Error('toFixed error');
            });

            const result = formatHeight(1.75);
            expect(result).toBe('1.75');

            // Restore original function
            Number.prototype.toFixed = originalToFixed;
        });
    });

    describe('Performance and Consistency', () => {
        it('should handle rapid successive calls', () => {
            const heights = [1.60, 1.70, 1.80, 1.90, 2.00];
            const results = heights.map(h => formatHeight(h));

            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toMatch(/^\d+\.\d{2} m \(\d+'(\d{1,2})"\)$/);
            });
        });

        it('should be consistent across multiple calls', () => {
            const height = 1.75;
            const result1 = formatHeight(height);
            const result2 = formatHeight(height);
            const result3 = formatHeight(height);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it('should handle batch processing efficiently', () => {
            const heights = Array.from({ length: 100 }, (_, i) => 1.5 + (i * 0.01));
            const results = heights.map(h => formatHeight(h));

            expect(results).toHaveLength(100);
            expect(results.every(r => typeof r === 'string')).toBe(true);
        });
    });
});

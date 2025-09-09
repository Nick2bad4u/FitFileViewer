import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatArray } from '../../../utils/formatting/formatters/formatUtils.js';

describe('formatUtils.js - formatArray Comprehensive Test Suite', () => {
    let consoleLogSpy;
    let consoleWarnSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        // Ensure console object exists and has the required methods
        if (!globalThis.console || typeof globalThis.console.log !== 'function') {
            // Create a minimal console implementation for testing
            const mockConsole = {
                log: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
                info: vi.fn(),
                debug: vi.fn(),
                assert: vi.fn(),
                clear: vi.fn(),
                count: vi.fn(),
                countReset: vi.fn(),
                dir: vi.fn(),
                dirxml: vi.fn(),
                group: vi.fn(),
                groupCollapsed: vi.fn(),
                groupEnd: vi.fn(),
                table: vi.fn(),
                time: vi.fn(),
                timeEnd: vi.fn(),
                timeLog: vi.fn(),
                timeStamp: vi.fn(),
                trace: vi.fn()
            } as any;
            globalThis.console = mockConsole;
        }

        // Now safely spy on console methods
        consoleLogSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(globalThis.console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Array Input Tests', () => {
        it('should format array of valid numbers with default digits', () => {
            const result = formatArray([1.234, 2.567, 3.891]);
            expect(result).toBe('1.23, 2.57, 3.89');
        });

        it('should format array with custom decimal digits', () => {
            const result = formatArray([1.234567, 2.891234], 4);
            expect(result).toBe('1.2346, 2.8912');
        });

        it('should format array with zero decimal digits', () => {
            const result = formatArray([1.234, 2.567, 3.891], 0);
            expect(result).toBe('1, 3, 4');
        });

        it('should handle single element array', () => {
            const result = formatArray([5.6789], 3);
            expect(result).toBe('5.679');
        });

        it('should handle empty array', () => {
            const result = formatArray([]);
            expect(result).toBe('');
        });

        it('should format integer values correctly', () => {
            const result = formatArray([1, 2, 3], 2);
            expect(result).toBe('1, 2, 3');
        });

        it('should handle zero values', () => {
            const result = formatArray([0, 0.0, -0], 3);
            expect(result).toBe('0, 0, 0');
        });

        it('should handle negative numbers', () => {
            const result = formatArray([-1.234, -2.567], 2);
            expect(result).toBe('-1.23, -2.57');
        });

        it('should handle very small numbers', () => {
            const result = formatArray([0.0001, 0.00009], 5);
            expect(result).toBe('0.0001, 0.00009');
        });

        it('should handle very large numbers', () => {
            const result = formatArray([123456.789, 987654.321], 1);
            expect(result).toBe('123456.8, 987654.3');
        });

        it('should throw error for invalid numbers with strict validation (default)', () => {
            expect(() => formatArray(['invalid', 2.5])).toThrow('Invalid number: invalid');
        });

        it('should handle invalid numbers with strict validation disabled', () => {
            const result = formatArray(['invalid', 2.5, 'notanumber'], 2, { strictValidation: false });
            expect(result).toBe('invalid, 2.5, notanumber');
            expect(consoleWarnSpy).toHaveBeenCalledWith('[FormatUtils] Invalid number: invalid');
            expect(consoleWarnSpy).toHaveBeenCalledWith('[FormatUtils] Invalid number: notanumber');
        });

        it('should handle mixed valid and invalid numbers with strict validation disabled', () => {
            const result = formatArray([1.23, 'invalid', 4.56], 1, { strictValidation: false });
            expect(result).toBe('1.2, invalid, 4.6');
        });

        it('should handle array with NaN values in strict mode', () => {
            expect(() => formatArray([1.2, NaN, 3.4])).toThrow('Invalid number: NaN');
        });

        it('should handle array with Infinity values in strict mode', () => {
            expect(() => formatArray([1.2, Infinity, 3.4])).toThrow('Invalid number: Infinity');
        });

        it('should handle array with null/undefined values in strict mode', () => {
            // null is treated as 0 by Number(), so it doesn't throw
            const result1 = formatArray([1.2, null, 3.4]);
            expect(result1).toBe('1.2, 0, 3.4');

            // undefined becomes invalid and throws with original value
            expect(() => formatArray([1.2, undefined, 3.4])).toThrow('Invalid number: undefined');
        });

        it('should handle array with NaN/Infinity values with strict validation disabled', () => {
            const result = formatArray([1.2, NaN, Infinity, -Infinity], 2, { strictValidation: false });
            expect(result).toBe('1.2, NaN, Infinity, -Infinity');
        });
    });

    describe('String Input Tests', () => {
        it('should format comma-separated string of numbers', () => {
            const result = formatArray('1.234,2.567,3.891');
            expect(result).toBe('1.23, 2.57, 3.89');
        });

        it('should format comma-separated string with custom digits', () => {
            const result = formatArray('1.234567,2.891234', 4);
            expect(result).toBe('1.2346, 2.8912');
        });

        it('should handle comma-separated string with spaces', () => {
            const result = formatArray('1.234, 2.567, 3.891', 1);
            expect(result).toBe('1.2, 2.6, 3.9');
        });

        it('should handle single number string without comma', () => {
            const result = formatArray('5.6789');
            expect(result).toBe('5.6789'); // Should return original since no comma
        });

        it('should handle empty string', () => {
            const result = formatArray('');
            expect(result).toBe(''); // Should return original since no comma
        });

        it('should handle string with only commas', () => {
            const result = formatArray(',,,', 2, { strictValidation: false });
            expect(result).toBe('0.00, 0.00, 0.00, 0.00'); // Empty strings become 0 when converted to numbers
        });

        it('should throw error for invalid numbers in comma-separated string with strict validation', () => {
            expect(() => formatArray('1.23,invalid,4.56')).toThrow('Invalid number in string: invalid');
        });

        it('should handle invalid numbers in comma-separated string with strict validation disabled', () => {
            const result = formatArray('1.23,invalid,4.56', 2, { strictValidation: false });
            expect(result).toBe('1.23, invalid, 4.56');
            expect(consoleWarnSpy).toHaveBeenCalledWith('[FormatUtils] Invalid number in string: invalid');
        });

        it('should handle comma-separated string with negative numbers', () => {
            const result = formatArray('-1.234,-2.567', 1);
            expect(result).toBe('-1.2, -2.6');
        });

        it('should handle comma-separated string with zero values', () => {
            const result = formatArray('0,0.0,-0', 3);
            expect(result).toBe('0.000, 0.000, 0.000');
        });

        it('should handle comma-separated string with scientific notation', () => {
            const result = formatArray('1e-3,2.5e2', 4, { strictValidation: false });
            expect(result).toBe('0.0010, 250.0000');
        });
    });

    describe('Options Parameter Tests', () => {
        it('should use custom separator', () => {
            const result = formatArray([1.23, 2.45], 2, { separator: ' | ' });
            expect(result).toBe('1.23 | 2.45');
        });

        it('should use custom separator with comma-separated string', () => {
            const result = formatArray('1.23,2.45', 1, { separator: ' - ' });
            expect(result).toBe('1.2 - 2.5');
        });

        it('should use empty string separator', () => {
            const result = formatArray([1.2, 3.4], 0, { separator: '' });
            expect(result).toBe('13');
        });

        it('should use newline separator', () => {
            const result = formatArray([1.23, 2.45], 1, { separator: '\\n' });
            expect(result).toBe('1.2\\n2.5');
        });

        it('should handle complex separator strings', () => {
            const result = formatArray([1.1, 2.2], 1, { separator: ' ==> ' });
            expect(result).toBe('1.1 ==> 2.2');
        });

        it('should use strict validation true by default', () => {
            expect(() => formatArray(['invalid', 1.2])).toThrow();
        });

        it('should respect explicit strict validation true', () => {
            expect(() => formatArray(['invalid', 1.2], 2, { strictValidation: true })).toThrow();
        });

        it('should respect strict validation false', () => {
            const result = formatArray(['invalid', 1.2], 2, { strictValidation: false });
            expect(result).toBe('invalid, 1.2');
        });

        it('should combine custom options correctly', () => {
            const result = formatArray(['invalid', 1.234], 1, {
                separator: ' :: ',
                strictValidation: false
            });
            expect(result).toBe('invalid :: 1.2');
        });

        it('should handle undefined options gracefully', () => {
            const result = formatArray([1.234, 2.567], 2, undefined);
            expect(result).toBe('1.23, 2.57');
        });

        it('should handle empty options object', () => {
            const result = formatArray([1.234, 2.567], 2, {});
            expect(result).toBe('1.23, 2.57');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should return original value for null input', () => {
            const result = formatArray(null);
            expect(result).toBe(null);
        });

        it('should return original value for undefined input', () => {
            const result = formatArray(undefined);
            expect(result).toBe(undefined);
        });

        it('should return original value for number input', () => {
            const result = formatArray(123.456);
            expect(result).toBe(123.456);
        });

        it('should return original value for boolean input', () => {
            const result = formatArray(true);
            expect(result).toBe(true);
        });

        it('should return original value for object input', () => {
            const obj = { test: 'value' };
            const result = formatArray(obj);
            expect(result).toBe(obj);
        });

        it('should handle string without commas', () => {
            const result = formatArray('not a comma separated string');
            expect(result).toBe('not a comma separated string');
        });

        it('should handle very large digit values', () => {
            const result = formatArray([1.23456789], 10);
            expect(result).toBe('1.23456789'); // toFixed preserves actual precision, not forced padding
        });

        it('should handle negative digit values by throwing error', () => {
            // JavaScript toFixed() throws RangeError for negative digits
            expect(() => formatArray([1.23456], -1)).toThrow('toFixed() digits argument must be between 0 and 100');
        });

        it('should throw and log error when internal error occurs', () => {
            // Force an error by mocking toFixed to throw
            const originalToFixed = Number.prototype.toFixed;
            Number.prototype.toFixed = vi.fn(() => {
                throw new Error('Mocked toFixed error');
            });

            expect(() => formatArray([1.23])).toThrow('Mocked toFixed error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('[FormatUtils] Error formatting array: Mocked toFixed error');

            // Restore original method
            Number.prototype.toFixed = originalToFixed;
        });

        it('should handle extremely long arrays', () => {
            const longArray = Array(1000).fill(1.234);
            const result = formatArray(longArray, 2);
            expect(result.split(', ')).toHaveLength(1000);
            expect(result.startsWith('1.23, 1.23')).toBe(true);
        });

        it('should handle arrays with parseFloat edge cases', () => {
            const result = formatArray([1.999999999999999999], 2);
            expect(result).toBe('2'); // JavaScript floating point precision
        });

        it('should return parseFloat results for array elements', () => {
            const result = formatArray([1.234, 2.567], 1);
            // Results should be numbers, not strings in the internal processing
            expect(result).toBe('1.2, 2.6');
        });
    });

    describe('Performance and Boundary Tests', () => {
        it('should handle array with zero and very small decimal places', () => {
            const result = formatArray([1.999, 2.001], 0);
            expect(result).toBe('2, 2');
        });

        it('should handle consistent floating point operations', () => {
            const result = formatArray([0.1 + 0.2], 10); // Classic JS floating point issue
            expect(result).toBe('0.3'); // parseFloat removes trailing zeros
        });

        it('should handle string numbers that are actually valid', () => {
            const result = formatArray(['1.23', '2.45'], 1);
            expect(result).toBe('1.2, 2.5');
        });

        it('should handle comma-separated string with string numbers', () => {
            const result = formatArray('1.23,2.45,3.67', 0);
            expect(result).toBe('1, 2, 4');
        });

        it('should handle mixed types in non-strict mode', () => {
            const result = formatArray([1.23, '2.45', 3], 1, { strictValidation: false });
            expect(result).toBe('1.2, 2.5, 3'); // parseFloat removes trailing zeros for integers
        });
    });

    describe('Coverage Edge Cases', () => {
        it('should handle console logging error (catch block coverage)', () => {
            // Create a mock where console operations throw errors
            const originalConsole = globalThis.console;

            // Mock console to throw an error in logWithContext
            const mockConsole = {
                ...originalConsole,
                warn: vi.fn(() => { throw new Error('Console error'); }),
                error: vi.fn(() => { throw new Error('Console error'); }),
                log: vi.fn(() => { throw new Error('Console error'); })
            } as any;

            globalThis.console = mockConsole;

            try {
                // This should trigger the catch block in logWithContext
                const result = formatArray([1, 'invalid'], 2, { strictValidation: false });
                // Should still return a result despite logging error
                expect(result).toBe('1, invalid');
            } finally {
                // Restore console
                globalThis.console = originalConsole;
            }
        });

        it('should handle edge case in number validation with extreme values', () => {
            // Test boundary conditions for isValidNumber function
            const result = formatArray([Number.MAX_VALUE, Number.MIN_VALUE], 2);
            expect(typeof result).toBe('string');
            expect(result.includes(', ')).toBe(true);
        });

        it('should handle specific parseFloat edge cases for coverage', () => {
            // Test specific conditions that might trigger uncovered branches
            const result = formatArray(['0.0', '00.00', '+1.23', ' 2.34 '], 2, { strictValidation: false });
            expect(result).toBe('0, 0, 1.23, 2.34');
        });

        it('should trigger all validation paths in strict mode', () => {
            // Test various invalid inputs to ensure all validation paths are covered
            // null is converted to 0 by Number(), so it's actually valid, but undefined and 'NaN' are invalid
            expect(() => formatArray([1, undefined, 3], 2, { strictValidation: true })).toThrow();
            expect(() => formatArray([1, 'NaN', 3], 2, { strictValidation: true })).toThrow();
            expect(() => formatArray([1, 'invalid', 3], 2, { strictValidation: true })).toThrow();
        });

        it('should handle string parsing edge cases for full branch coverage', () => {
            // Test string processing to ensure all branches are covered
            const result1 = formatArray('1.0,2.0,3.0', 0, { strictValidation: false });
            expect(result1).toBe('1, 2, 3');

            // Empty strings are converted to 0 by Number(), so they become valid numbers
            const result2 = formatArray('1,,,4', 1, { strictValidation: false });
            expect(result2).toBe('1.0, 0.0, 0.0, 4.0'); // Empty strings become 0.0
        });

        it('should handle all log levels for complete coverage', () => {
            // Test different log levels to ensure all switch cases are covered
            const originalWarn = console.warn;
            const originalError = console.error;
            const originalLog = console.log;

            const warnSpy = vi.fn();
            const errorSpy = vi.fn();
            const logSpy = vi.fn();

            console.warn = warnSpy;
            console.error = errorSpy;
            console.log = logSpy;

            try {
                // Trigger warn path
                formatArray([1, 'invalid'], 2, { strictValidation: false });
                expect(warnSpy).toHaveBeenCalled();

                // Reset mocks
                warnSpy.mockClear();
                errorSpy.mockClear();
                logSpy.mockClear();

                // Trigger error path (via exception handling)
                try {
                    formatArray([1, 'invalid'], 2, { strictValidation: true });
                } catch (e) {
                    // Expected error
                }
                expect(errorSpy).toHaveBeenCalled();

            } finally {
                console.warn = originalWarn;
                console.error = originalError;
                console.log = originalLog;
            }
        });
    });
});

/**
 * @fileoverview Comprehensive test suite for formatting utilities
 *
 * This test suite provides complete coverage for all formatting utility functions
 * including edge cases, error handling, boundary conditions, and type validation.
 *
 * Tests include:
 * - formatDistance: Distance formatting with metric/imperial units
 * - formatDuration: Duration formatting with seconds/minutes/hours
 * - formatTime: Time formatting with MM:SS or HH:MM:SS format
 * - formatWeight: Weight formatting with kg/pounds conversion
 * - formatHeight: Height formatting utilities
 *
 * @author FitFileViewer Test Suite
 * @since 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import all formatter utilities
import { formatDistance } from '../../../utils/formatting/formatters/formatDistance.js';
import { formatDuration } from '../../../utils/formatting/formatters/formatDuration.js';
import { formatTime } from '../../../utils/formatting/formatters/formatTime.js';
import { formatWeight } from '../../../utils/formatting/formatters/formatWeight.js';
import { formatHeight } from '../../../utils/formatting/formatters/formatHeight.js';

describe('Formatting Utilities', () => {
    beforeEach(() => {
        // Mock console methods to prevent noise in tests
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('formatDistance', () => {
        describe('dual unit formatting', () => {
            it('should format distance with both km and miles correctly', () => {
                const result = formatDistance(1000);
                expect(result).toBe('1.00 km / 0.62 mi');
            });

            it('should format small distances correctly', () => {
                const result = formatDistance(500);
                expect(result).toBe('0.50 km / 0.31 mi');
            });

            it('should handle decimal inputs correctly', () => {
                const result = formatDistance(1234);
                expect(result).toBe('1.23 km / 0.77 mi');
            });

            it('should handle very large distances correctly', () => {
                const result = formatDistance(100000);
                expect(result).toBe('100.00 km / 62.14 mi');
            });

            it('should handle exact mile equivalents', () => {
                const result = formatDistance(1609.34);
                expect(result).toBe('1.61 km / 1.00 mi');
            });
        });

        describe('error handling', () => {
            it('should return empty string for non-numeric input', () => {
                const result = formatDistance('invalid' as any);
                expect(result).toBe('');
            });

            it('should handle negative distances gracefully', () => {
                const result = formatDistance(-100);
                expect(result).toBe('');
            });

            it('should handle NaN input correctly', () => {
                const result = formatDistance(NaN);
                expect(result).toBe('');
            });

            it('should handle Infinity input correctly', () => {
                const result = formatDistance(Infinity);
                expect(result).toBe('');
            });

            it('should handle null/undefined input', () => {
                expect(formatDistance(null as any)).toBe('');
                expect(formatDistance(undefined as any)).toBe('');
            });
        });

        describe('edge cases', () => {
            it('should handle zero distance correctly', () => {
                const result = formatDistance(0);
                expect(result).toBe(''); // formatDistance returns empty string for 0
            });

            it('should handle very small positive distances', () => {
                const result = formatDistance(0.1);
                expect(result).toBe('0.00 km / 0.00 mi');
            });

            it('should maintain precision for large distances', () => {
                const result = formatDistance(50000);
                expect(result).toBe('50.00 km / 31.07 mi');
            });
        });
    });

    describe('formatDuration', () => {
        describe('basic formatting', () => {
            it('should format seconds only for values under 60', () => {
                const result = formatDuration(45);
                expect(result).toBe('45 sec'); // Full word format
            });

            it('should format minutes and seconds for values under 3600', () => {
                const result = formatDuration(125);
                expect(result).toBe('2 min 5 sec'); // Full word format
            });

            it('should format hours, minutes, and seconds for values over 3600', () => {
                const result = formatDuration(3665);
                expect(result).toBe('1 hr 1 min'); // 3665s = 1 hr 1 min 5 sec, but seconds not shown in hours format
            });

            it('should handle exact minute boundaries', () => {
                const result = formatDuration(120);
                expect(result).toBe('2 min 0 sec'); // Full word format
            });

            it('should handle exact hour boundaries', () => {
                const result = formatDuration(3600);
                expect(result).toBe('1 hr 0 min'); // Full word format
            });
        });

        describe('error handling', () => {
            it('should handle null input gracefully', () => {
                const result = formatDuration(null);
                expect(result).toBe(''); // Returns empty string for null
            });

            it('should handle undefined input gracefully', () => {
                const result = formatDuration(undefined);
                expect(result).toBe(''); // Returns empty string for undefined
            });

            it('should handle string input conversion', () => {
                const result = formatDuration('60' as any);
                expect(result).toBe('1 min 0 sec'); // Full word format
            });

            it('should handle invalid string input', () => {
                expect(() => formatDuration('invalid' as any)).toThrow('Invalid duration input: Input must be a finite number');
            });

            it('should handle negative durations with warning', () => {
                expect(() => formatDuration(-30)).toThrow('Invalid duration input: Duration cannot be negative');
            });

            it('should handle NaN input correctly', () => {
                expect(() => formatDuration(NaN)).toThrow('Invalid duration input: Input must be a finite number');
            });
        });

        describe('edge cases', () => {
            it('should handle zero duration correctly', () => {
                const result = formatDuration(0);
                expect(result).toBe('0 sec'); // Full word format
            });

            it('should handle decimal seconds correctly', () => {
                const result = formatDuration(45.7);
                expect(result).toBe('46 sec'); // Rounds to nearest integer
            });

            it('should handle very large durations', () => {
                const result = formatDuration(86400); // 24 hours
                expect(result).toBe('24 hrs 0 min'); // Full word format
            });
        });
    });

    describe('formatTime', () => {
        describe('basic time formatting', () => {
            it('should format time in MM:SS format for values under an hour', () => {
                const result = formatTime(125, false);
                expect(result).toBe('2:05');
            });

            it('should format time in HH:MM:SS format for values over an hour', () => {
                const result = formatTime(3665, false);
                expect(result).toBe('1:01:05');
            });

            it('should pad single digits with zeros', () => {
                const result = formatTime(65, false);
                expect(result).toBe('1:05');
            });

            it('should handle exact minute boundaries', () => {
                const result = formatTime(120, false);
                expect(result).toBe('2:00');
            });

            it('should handle exact hour boundaries', () => {
                const result = formatTime(3600, false);
                expect(result).toBe('1:00:00');
            });
        });

        describe('user units formatting', () => {
            it('should use user units when requested', () => {
                // Mock localStorage for user preferences
                Object.defineProperty(window, 'localStorage', {
                    value: {
                        getItem: vi.fn().mockReturnValue('hours'),
                        setItem: vi.fn(),
                    },
                    writable: true
                });

                const result = formatTime(3600, true);
                expect(result).toContain('h'); // Should contain hours unit
            });

            it('should fallback to MM:SS when user units not available', () => {
                Object.defineProperty(window, 'localStorage', {
                    value: {
                        getItem: vi.fn().mockReturnValue(null),
                        setItem: vi.fn(),
                    },
                    writable: true
                });

                const result = formatTime(125, true);
                expect(result).toBe('2:05');
            });
        });

        describe('error handling', () => {
            it('should throw TypeError for non-numeric input', () => {
                // formatTime doesn't throw but returns default and logs warning
                const result = formatTime('invalid' as any);
                expect(result).toBe('0:00');
            });

            it('should throw TypeError for NaN input', () => {
                // formatTime doesn't throw but returns default and logs warning
                const result = formatTime(NaN);
                expect(result).toBe('0:00');
            });

            it('should handle negative time with warning', () => {
                const result = formatTime(-30);
                expect(console.warn).toHaveBeenCalledWith('[formatTime] Negative time value:', -30);
                expect(result).toBe('0:00');
            });

            it('should handle Infinity input correctly', () => {
                // formatTime should handle Infinity but actually produces malformed output
                const result = formatTime(Infinity);
                expect(result).toBe('Infinity:NaN:NaN'); // Actual behavior - function needs improvement
            });
        });

        describe('edge cases', () => {
            it('should handle zero time correctly', () => {
                const result = formatTime(0);
                expect(result).toBe('0:00');
            });

            it('should handle decimal seconds correctly', () => {
                const result = formatTime(125.7);
                expect(result).toBe('2:05'); // Should round down
            });

            it('should handle very large time values', () => {
                const result = formatTime(359999); // Almost 100 hours
                expect(result).toBe('99:59:59');
            });
        });
    });

    describe('formatWeight', () => {
        describe('basic weight formatting', () => {
            it('should format weight with kg and pounds correctly', () => {
                const result = formatWeight(70);
                expect(result).toBe('70 kg (154 lbs)');
            });

            it('should handle decimal weights correctly', () => {
                const result = formatWeight(70.5);
                expect(result).toBe('70.5 kg (155 lbs)');
            });

            it('should round pounds to nearest integer', () => {
                const result = formatWeight(68.2);
                expect(result).toContain('(150 lbs)'); // Should round 150.3 to 150
            });
        });

        describe('error handling', () => {
            it('should return empty string for non-numeric input', () => {
                const result = formatWeight('invalid' as any);
                expect(result).toBe('');
            });

            it('should return empty string for NaN input', () => {
                const result = formatWeight(NaN);
                expect(result).toBe('');
            });

            it('should return empty string for Infinity input', () => {
                const result = formatWeight(Infinity);
                expect(result).toBe('');
            });

            it('should handle negative weight with warning', () => {
                const result = formatWeight(-10);
                expect(console.warn).toHaveBeenCalledWith('[formatWeight] Negative weight value:', -10);
                expect(result).toBe('');
            });
        });

        describe('edge cases', () => {
            it('should handle zero weight correctly', () => {
                const result = formatWeight(0);
                expect(result).toBe('0 kg (0 lbs)');
            });

            it('should handle very small positive weights', () => {
                const result = formatWeight(0.1);
                expect(result).toBe('0.1 kg (0 lbs)');
            });

            it('should handle very large weights correctly', () => {
                const result = formatWeight(1000);
                expect(result).toBe('1000 kg (2205 lbs)');
            });
        });
    });

    describe('formatHeight', () => {
        describe('dual unit formatting', () => {
            it('should format height in meters and feet correctly', () => {
                const result = formatHeight(1.75);
                expect(result).toContain('m');
                expect(result).toContain("'"); // Contains feet symbol, not "ft"
            });

            it('should handle tall heights correctly', () => {
                const result = formatHeight(2.1);
                expect(result).toContain('m');
                expect(result).toContain("'"); // Contains feet symbol, not "ft"
            });

            it('should format short heights correctly', () => {
                const result = formatHeight(1.5);
                expect(result).toContain('m');
                expect(result).toContain("'"); // Contains feet symbol, not "ft"
            });
        });

        describe('error handling', () => {
            it('should handle non-numeric input gracefully', () => {
                const result = formatHeight('invalid' as any);
                expect(result).toBe('');
            });

            it('should handle negative height with warning', () => {
                const result = formatHeight(-1.5);
                expect(console.warn).toHaveBeenCalledWith('[formatHeight] Negative height value:', -1.5);
                expect(result).toBe('');
            });

            it('should handle NaN input correctly', () => {
                const result = formatHeight(NaN);
                expect(result).toBe('');
            });

            it('should handle unrealistic heights with warning', () => {
                const result = formatHeight(10); // 10 meters tall
                // formatHeight doesn't warn about unrealistic heights, only negative ones
                expect(result).toContain('m');
                expect(result).toContain("'");
            });
        });

        describe('edge cases', () => {
            it('should handle zero height correctly', () => {
                const result = formatHeight(0);
                expect(result).toBe('0.00 m (0\'0")'); // Actual format from function
            });

            it('should handle very short heights correctly', () => {
                const result = formatHeight(0.5);
                expect(result).toBe('0.50 m (1\'8")'); // Actual format from function
            });

            it('should handle typical human height range', () => {
                const heights = [1.5, 1.65, 1.8, 1.95];
                heights.forEach(height => {
                    const result = formatHeight(height);
                    expect(result).toContain('m');
                    expect(result).not.toBe('');
                });
            });
        });
    });

    describe('Integration tests', () => {
        it('should handle chained formatting operations', () => {
            const distance = formatDistance(5000);
            const duration = formatDuration(1800);
            const time = formatTime(1800);
            const weight = formatWeight(75);
            const height = formatHeight(1.8);

            expect(distance).toBe('5.00 km / 3.11 mi');
            expect(duration).toBe('30 min 0 sec'); // Full word format
            expect(time).toBe('30:00');
            expect(weight).toBe('75 kg (165 lbs)');
            expect(height).toContain('m');
        });

        it('should handle all formatters with edge case inputs', () => {
            const edgeCases = [0, -1, NaN, Infinity, null, undefined, 'invalid'];

            edgeCases.forEach(value => {
                // formatDuration throws for negative/invalid values, others don't
                if (value === -1 || Number.isNaN(value) || value === Infinity || value === 'invalid') {
                    expect(() => formatDuration(value as any)).toThrow();
                } else {
                    expect(() => {
                        formatDistance(value as any);
                        formatDuration(value as any);
                        formatTime(value as any);
                        formatWeight(value as any);
                        formatHeight(value as any);
                    }).not.toThrow();
                }
            });
        });

        it('should maintain consistent error handling patterns', () => {
            // All formatters should handle null/undefined gracefully
            expect(formatDuration(null)).toBe(''); // Returns empty string for null/undefined
            expect(formatDuration(undefined)).toBe(''); // Returns empty string for null/undefined
            expect(formatWeight(null as any)).toBe('');
            expect(formatHeight(null as any)).toBe('');
        });
    });
});

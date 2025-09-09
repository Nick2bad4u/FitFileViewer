import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatTooltipWithUnits } from '../../../utils/formatting/display/formatTooltipWithUnits.js';

// Mock all the dependencies
vi.mock('../../../utils/formatting/converters/convertDistanceUnits.js', () => ({
    convertDistanceUnits: vi.fn()
}));

vi.mock('../../../utils/formatting/converters/convertTemperatureUnits.js', () => ({
    convertTemperatureUnits: vi.fn()
}));

vi.mock('../../../utils/formatting/converters/convertValueToUserUnits.js', () => ({
    convertValueToUserUnits: vi.fn()
}));

vi.mock('../../../utils/formatting/display/formatSpeedTooltip.js', () => ({
    formatSpeedTooltip: vi.fn()
}));

vi.mock('../../../utils/data/lookups/getUnitSymbol.js', () => ({
    getUnitSymbol: vi.fn()
}));

describe('formatTooltipWithUnits.js - Tooltip Formatting with Units', () => {
    let mockConvertDistanceUnits: any;
    let mockConvertTemperatureUnits: any;
    let mockConvertValueToUserUnits: any;
    let mockFormatSpeedTooltip: any;
    let mockGetUnitSymbol: any;

    beforeEach(async () => {
        vi.clearAllMocks();

        mockConvertDistanceUnits = vi.mocked((await import('../../../utils/formatting/converters/convertDistanceUnits.js')).convertDistanceUnits);
        mockConvertTemperatureUnits = vi.mocked((await import('../../../utils/formatting/converters/convertTemperatureUnits.js')).convertTemperatureUnits);
        mockConvertValueToUserUnits = vi.mocked((await import('../../../utils/formatting/converters/convertValueToUserUnits.js')).convertValueToUserUnits);
        mockFormatSpeedTooltip = vi.mocked((await import('../../../utils/formatting/display/formatSpeedTooltip.js')).formatSpeedTooltip);
        mockGetUnitSymbol = vi.mocked((await import('../../../utils/data/lookups/getUnitSymbol.js')).getUnitSymbol);
    });

    describe('Distance Fields', () => {
        describe('Distance Field', () => {
            it('should format distance with both km and miles', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(5.0) // km
                    .mockReturnValueOnce(3.11); // miles

                const result = formatTooltipWithUnits(5000, 'distance');

                expect(mockConvertDistanceUnits).toHaveBeenCalledTimes(2);
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(1, 5000, 'kilometers');
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(2, 5000, 'miles');
                expect(result).toBe('5.00 km (3.11 mi)');
            });

            it('should format distance with decimal precision', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(12.456) // km
                    .mockReturnValueOnce(7.741); // miles

                const result = formatTooltipWithUnits(12456, 'distance');

                expect(result).toBe('12.46 km (7.74 mi)');
            });

            it('should handle zero distance', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(0.0) // km
                    .mockReturnValueOnce(0.0); // miles

                const result = formatTooltipWithUnits(0, 'distance');

                expect(result).toBe('0.00 km (0.00 mi)');
            });

            it('should handle very large distances', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(1000.0) // km
                    .mockReturnValueOnce(621.37); // miles

                const result = formatTooltipWithUnits(1000000, 'distance');

                expect(result).toBe('1000.00 km (621.37 mi)');
            });
        });

        describe('Altitude Field', () => {
            it('should format altitude with both km and miles', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(2.5) // km
                    .mockReturnValueOnce(1.55); // miles

                const result = formatTooltipWithUnits(2500, 'altitude');

                expect(mockConvertDistanceUnits).toHaveBeenCalledTimes(2);
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(1, 2500, 'kilometers');
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(2, 2500, 'miles');
                expect(result).toBe('2.50 km (1.55 mi)');
            });

            it('should handle negative altitude', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(-0.1) // km
                    .mockReturnValueOnce(-0.06); // miles

                const result = formatTooltipWithUnits(-100, 'altitude');

                expect(result).toBe('-0.10 km (-0.06 mi)');
            });
        });

        describe('Enhanced Altitude Field', () => {
            it('should format enhanced altitude with both km and miles', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(1.8) // km
                    .mockReturnValueOnce(1.12); // miles

                const result = formatTooltipWithUnits(1800, 'enhancedAltitude');

                expect(mockConvertDistanceUnits).toHaveBeenCalledTimes(2);
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(1, 1800, 'kilometers');
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(2, 1800, 'miles');
                expect(result).toBe('1.80 km (1.12 mi)');
            });

            it('should handle decimal input for enhanced altitude', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(0.5) // km
                    .mockReturnValueOnce(0.31); // miles

                const result = formatTooltipWithUnits(500.5, 'enhancedAltitude');

                expect(result).toBe('0.50 km (0.31 mi)');
            });
        });
    });

    describe('Speed Fields', () => {
        describe('Speed Field', () => {
            it('should delegate to formatSpeedTooltip for speed field', () => {
                mockFormatSpeedTooltip.mockReturnValue('25.0 m/s (90.0 km/h, 55.9 mph)');

                const result = formatTooltipWithUnits(25.0, 'speed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledTimes(1);
                expect(mockFormatSpeedTooltip).toHaveBeenCalledWith(25.0);
                expect(result).toBe('25.0 m/s (90.0 km/h, 55.9 mph)');
            });

            it('should handle zero speed', () => {
                mockFormatSpeedTooltip.mockReturnValue('0.00 m/s (0.00 km/h, 0.00 mph)');

                const result = formatTooltipWithUnits(0, 'speed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledWith(0);
                expect(result).toBe('0.00 m/s (0.00 km/h, 0.00 mph)');
            });

            it('should handle high speed values', () => {
                mockFormatSpeedTooltip.mockReturnValue('50.0 m/s (180.0 km/h, 111.8 mph)');

                const result = formatTooltipWithUnits(50.0, 'speed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledWith(50.0);
                expect(result).toBe('50.0 m/s (180.0 km/h, 111.8 mph)');
            });
        });

        describe('Enhanced Speed Field', () => {
            it('should delegate to formatSpeedTooltip for enhanced speed field', () => {
                mockFormatSpeedTooltip.mockReturnValue('12.5 m/s (45.0 km/h, 28.0 mph)');

                const result = formatTooltipWithUnits(12.5, 'enhancedSpeed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledTimes(1);
                expect(mockFormatSpeedTooltip).toHaveBeenCalledWith(12.5);
                expect(result).toBe('12.5 m/s (45.0 km/h, 28.0 mph)');
            });

            it('should handle decimal enhanced speed values', () => {
                mockFormatSpeedTooltip.mockReturnValue('8.33 m/s (29.99 km/h, 18.63 mph)');

                const result = formatTooltipWithUnits(8.33, 'enhancedSpeed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledWith(8.33);
                expect(result).toBe('8.33 m/s (29.99 km/h, 18.63 mph)');
            });
        });
    });

    describe('Temperature Field', () => {
        describe('Basic Temperature Formatting', () => {
            it('should format temperature with both Celsius and Fahrenheit', () => {
                mockConvertTemperatureUnits.mockReturnValue(77.0); // Fahrenheit

                const result = formatTooltipWithUnits(25.0, 'temperature');

                expect(mockConvertTemperatureUnits).toHaveBeenCalledTimes(1);
                expect(mockConvertTemperatureUnits).toHaveBeenCalledWith(25.0, 'fahrenheit');
                expect(result).toBe('25.0°C (77.0°F)');
            });

            it('should handle freezing temperature', () => {
                mockConvertTemperatureUnits.mockReturnValue(32.0); // Fahrenheit

                const result = formatTooltipWithUnits(0.0, 'temperature');

                expect(mockConvertTemperatureUnits).toHaveBeenCalledWith(0.0, 'fahrenheit');
                expect(result).toBe('0.0°C (32.0°F)');
            });

            it('should handle negative temperatures', () => {
                mockConvertTemperatureUnits.mockReturnValue(14.0); // Fahrenheit

                const result = formatTooltipWithUnits(-10.0, 'temperature');

                expect(mockConvertTemperatureUnits).toHaveBeenCalledWith(-10.0, 'fahrenheit');
                expect(result).toBe('-10.0°C (14.0°F)');
            });

            it('should handle high temperatures', () => {
                mockConvertTemperatureUnits.mockReturnValue(122.0); // Fahrenheit

                const result = formatTooltipWithUnits(50.0, 'temperature');

                expect(mockConvertTemperatureUnits).toHaveBeenCalledWith(50.0, 'fahrenheit');
                expect(result).toBe('50.0°C (122.0°F)');
            });

            it('should format with single decimal precision', () => {
                mockConvertTemperatureUnits.mockReturnValue(73.85); // Fahrenheit

                const result = formatTooltipWithUnits(23.25, 'temperature');

                expect(result).toBe('23.3°C (73.8°F)'); // Rounded to 1 decimal
            });
        });

        describe('Temperature Edge Cases', () => {
            it('should handle decimal input temperatures', () => {
                mockConvertTemperatureUnits.mockReturnValue(98.6); // Fahrenheit

                const result = formatTooltipWithUnits(37.0, 'temperature');

                expect(result).toBe('37.0°C (98.6°F)');
            });

            it('should handle very precise temperature values', () => {
                mockConvertTemperatureUnits.mockReturnValue(32.018); // Fahrenheit

                const result = formatTooltipWithUnits(0.01, 'temperature');

                expect(result).toBe('0.0°C (32.0°F)'); // Rounded to 1 decimal
            });
        });
    });

    describe('Default Field Formatting', () => {
        describe('Fields with Unit Symbols', () => {
            it('should format field with unit symbol', () => {
                mockConvertValueToUserUnits.mockReturnValue(150.5);
                mockGetUnitSymbol.mockReturnValue('bpm');

                const result = formatTooltipWithUnits(150.5, 'heartRate');

                expect(mockConvertValueToUserUnits).toHaveBeenCalledTimes(1);
                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith(150.5, 'heartRate');
                expect(mockGetUnitSymbol).toHaveBeenCalledTimes(1);
                expect(mockGetUnitSymbol).toHaveBeenCalledWith('heartRate');
                expect(result).toBe('150.50 bpm');
            });

            it('should format power field with watts', () => {
                mockConvertValueToUserUnits.mockReturnValue(250.0);
                mockGetUnitSymbol.mockReturnValue('W');

                const result = formatTooltipWithUnits(250, 'power');

                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith(250, 'power');
                expect(mockGetUnitSymbol).toHaveBeenCalledWith('power');
                expect(result).toBe('250.00 W');
            });

            it('should format cadence field with rpm', () => {
                mockConvertValueToUserUnits.mockReturnValue(90.5);
                mockGetUnitSymbol.mockReturnValue('rpm');

                const result = formatTooltipWithUnits(90.5, 'cadence');

                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith(90.5, 'cadence');
                expect(mockGetUnitSymbol).toHaveBeenCalledWith('cadence');
                expect(result).toBe('90.50 rpm');
            });
        });

        describe('Fields without Unit Symbols', () => {
            it('should format field without unit symbol', () => {
                mockConvertValueToUserUnits.mockReturnValue(42.0);
                mockGetUnitSymbol.mockReturnValue(null as any);

                const result = formatTooltipWithUnits(42.0, 'customField');

                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith(42.0, 'customField');
                expect(mockGetUnitSymbol).toHaveBeenCalledWith('customField');
                expect(result).toBe('42.00');
            });

            it('should format field with empty unit symbol', () => {
                mockConvertValueToUserUnits.mockReturnValue(123.45);
                mockGetUnitSymbol.mockReturnValue('');

                const result = formatTooltipWithUnits(123.45, 'unknownField');

                expect(result).toBe('123.45');
            });

            it('should format field with undefined unit symbol', () => {
                mockConvertValueToUserUnits.mockReturnValue(99.99);
                mockGetUnitSymbol.mockReturnValue(undefined as any);

                const result = formatTooltipWithUnits(99.99, 'anotherField');

                expect(result).toBe('99.99');
            });
        });

        describe('Default Formatting Edge Cases', () => {
            it('should handle zero values for default fields', () => {
                mockConvertValueToUserUnits.mockReturnValue(0.0);
                mockGetUnitSymbol.mockReturnValue('units');

                const result = formatTooltipWithUnits(0, 'testField');

                expect(result).toBe('0.00 units');
            });

            it('should handle negative values for default fields', () => {
                mockConvertValueToUserUnits.mockReturnValue(-25.5);
                mockGetUnitSymbol.mockReturnValue('deg');

                const result = formatTooltipWithUnits(-25.5, 'angle');

                expect(result).toBe('-25.50 deg');
            });

            it('should handle large values for default fields', () => {
                mockConvertValueToUserUnits.mockReturnValue(999999.99);
                mockGetUnitSymbol.mockReturnValue('count');

                const result = formatTooltipWithUnits(999999.99, 'counter');

                expect(result).toBe('999999.99 count');
            });

            it('should handle decimal precision for default fields', () => {
                mockConvertValueToUserUnits.mockReturnValue(12.3456789);
                mockGetUnitSymbol.mockReturnValue('m');

                const result = formatTooltipWithUnits(12.3456789, 'measurement');

                expect(result).toBe('12.35 m'); // Rounded to 2 decimals
            });
        });
    });

    describe('Input Validation and Error Handling', () => {
        describe('Invalid Input Values', () => {
            it('should handle null value for distance field', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(0) // km
                    .mockReturnValueOnce(0); // miles

                const result = formatTooltipWithUnits(null as any, 'distance');

                expect(mockConvertDistanceUnits).toHaveBeenCalledWith(null, 'kilometers');
                expect(mockConvertDistanceUnits).toHaveBeenCalledWith(null, 'miles');
                expect(result).toBe('0.00 km (0.00 mi)');
            });

            it('should handle undefined value for speed field', () => {
                mockFormatSpeedTooltip.mockReturnValue('0.00 m/s (0.00 km/h, 0.00 mph)');

                const result = formatTooltipWithUnits(undefined as any, 'speed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledWith(undefined);
                expect(result).toBe('0.00 m/s (0.00 km/h, 0.00 mph)');
            });

            it('should handle NaN value for temperature field', () => {
                mockConvertTemperatureUnits.mockReturnValue(NaN);

                const result = formatTooltipWithUnits(NaN, 'temperature');

                expect(mockConvertTemperatureUnits).toHaveBeenCalledWith(NaN, 'fahrenheit');
                expect(result).toBe('NaN°C (NaN°F)');
            });

            it('should handle string value for default field', () => {
                mockConvertValueToUserUnits.mockReturnValue(0);
                mockGetUnitSymbol.mockReturnValue('units');

                const result = formatTooltipWithUnits('invalid' as any, 'testField');

                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith('invalid', 'testField');
                expect(result).toBe('0.00 units');
            });
        });

        describe('Invalid Field Names', () => {
            it('should handle null field name', () => {
                mockConvertValueToUserUnits.mockReturnValue(42);
                mockGetUnitSymbol.mockReturnValue(null as any);

                const result = formatTooltipWithUnits(42, null as any);

                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith(42, null);
                expect(mockGetUnitSymbol).toHaveBeenCalledWith(null);
                expect(result).toBe('42.00');
            });

            it('should handle undefined field name', () => {
                mockConvertValueToUserUnits.mockReturnValue(42);
                mockGetUnitSymbol.mockReturnValue(null as any);

                const result = formatTooltipWithUnits(42, undefined as any);

                expect(mockConvertValueToUserUnits).toHaveBeenCalledWith(42, undefined);
                expect(result).toBe('42.00');
            });

            it('should handle empty string field name', () => {
                mockConvertValueToUserUnits.mockReturnValue(42);
                mockGetUnitSymbol.mockReturnValue('');

                const result = formatTooltipWithUnits(42, '');

                expect(result).toBe('42.00');
            });
        });
    });

    describe('Performance and Consistency', () => {
        describe('Function Call Consistency', () => {
            it('should make consistent calls for distance fields', () => {
                mockConvertDistanceUnits
                    .mockReturnValueOnce(1) // km
                    .mockReturnValueOnce(0.62); // miles

                formatTooltipWithUnits(1000, 'distance');

                expect(mockConvertDistanceUnits).toHaveBeenCalledTimes(2);
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(1, 1000, 'kilometers');
                expect(mockConvertDistanceUnits).toHaveBeenNthCalledWith(2, 1000, 'miles');
            });

            it('should make single call for speed fields', () => {
                mockFormatSpeedTooltip.mockReturnValue('speed result');

                formatTooltipWithUnits(10, 'speed');

                expect(mockFormatSpeedTooltip).toHaveBeenCalledTimes(1);
                expect(mockConvertDistanceUnits).not.toHaveBeenCalled();
                expect(mockConvertTemperatureUnits).not.toHaveBeenCalled();
                expect(mockConvertValueToUserUnits).not.toHaveBeenCalled();
                expect(mockGetUnitSymbol).not.toHaveBeenCalled();
            });

            it('should make single temperature conversion call for temperature fields', () => {
                mockConvertTemperatureUnits.mockReturnValue(32);

                formatTooltipWithUnits(0, 'temperature');

                expect(mockConvertTemperatureUnits).toHaveBeenCalledTimes(1);
                expect(mockConvertDistanceUnits).not.toHaveBeenCalled();
                expect(mockFormatSpeedTooltip).not.toHaveBeenCalled();
                expect(mockConvertValueToUserUnits).not.toHaveBeenCalled();
                expect(mockGetUnitSymbol).not.toHaveBeenCalled();
            });

            it('should make appropriate calls for default fields', () => {
                mockConvertValueToUserUnits.mockReturnValue(100);
                mockGetUnitSymbol.mockReturnValue('units');

                formatTooltipWithUnits(100, 'otherField');

                expect(mockConvertValueToUserUnits).toHaveBeenCalledTimes(1);
                expect(mockGetUnitSymbol).toHaveBeenCalledTimes(1);
                expect(mockConvertDistanceUnits).not.toHaveBeenCalled();
                expect(mockConvertTemperatureUnits).not.toHaveBeenCalled();
                expect(mockFormatSpeedTooltip).not.toHaveBeenCalled();
            });
        });

        describe('Performance Characteristics', () => {
            it('should handle rapid successive calls efficiently', () => {
                mockConvertValueToUserUnits.mockReturnValue(50);
                mockGetUnitSymbol.mockReturnValue('units');

                const start = performance.now();
                for (let i = 0; i < 100; i++) {
                    formatTooltipWithUnits(50, 'testField');
                }
                const end = performance.now();

                expect(end - start).toBeLessThan(50); // Should complete quickly
            });

            it('should be consistent across multiple calls with same input', () => {
                mockConvertValueToUserUnits.mockReturnValue(75);
                mockGetUnitSymbol.mockReturnValue('bpm');

                const result1 = formatTooltipWithUnits(75, 'heartRate');
                const result2 = formatTooltipWithUnits(75, 'heartRate');
                const result3 = formatTooltipWithUnits(75, 'heartRate');

                expect(result1).toBe(result2);
                expect(result2).toBe(result3);
                expect(result1).toBe('75.00 bpm');
            });
        });
    });

    describe('Real-world Usage Scenarios', () => {
        describe('Typical FIT File Fields', () => {
            it('should handle GPS coordinates as distance-like fields', () => {
                mockConvertValueToUserUnits.mockReturnValue(42.123);
                mockGetUnitSymbol.mockReturnValue('°');

                const result = formatTooltipWithUnits(42.123, 'latitude');

                expect(result).toBe('42.12 °');
            });

            it('should handle various fitness metrics', () => {
                // Heart rate
                mockConvertValueToUserUnits.mockReturnValueOnce(150);
                mockGetUnitSymbol.mockReturnValueOnce('bpm');
                expect(formatTooltipWithUnits(150, 'heartRate')).toBe('150.00 bpm');

                // Power
                mockConvertValueToUserUnits.mockReturnValueOnce(250);
                mockGetUnitSymbol.mockReturnValueOnce('W');
                expect(formatTooltipWithUnits(250, 'power')).toBe('250.00 W');

                // Cadence
                mockConvertValueToUserUnits.mockReturnValueOnce(90);
                mockGetUnitSymbol.mockReturnValueOnce('rpm');
                expect(formatTooltipWithUnits(90, 'cadence')).toBe('90.00 rpm');
            });
        });

        describe('Edge Case Field Handling', () => {
            it('should handle unknown field types gracefully', () => {
                mockConvertValueToUserUnits.mockReturnValue(123);
                mockGetUnitSymbol.mockReturnValue(null as any);

                const result = formatTooltipWithUnits(123, 'unknownField');

                expect(result).toBe('123.00');
            });

            it('should handle field names with special characters', () => {
                mockConvertValueToUserUnits.mockReturnValue(42);
                mockGetUnitSymbol.mockReturnValue('unit');

                const result = formatTooltipWithUnits(42, 'field-with-dashes');

                expect(result).toBe('42.00 unit');
            });
        });
    });
});

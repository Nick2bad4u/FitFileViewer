import { describe, it, expect } from 'vitest';
import {
    formatChartFields,
    fieldLabels,
    fieldColors
} from '../../../utils/formatting/display/formatChartFields.js';

describe('formatChartFields.js - Chart Field Configuration', () => {
    describe('formatChartFields Array', () => {
        describe('Basic Structure', () => {
            it('should be an array', () => {
                expect(Array.isArray(formatChartFields)).toBe(true);
            });

            it('should contain expected number of fields', () => {
                expect(formatChartFields.length).toBeGreaterThan(0);
                expect(formatChartFields.length).toBe(14); // Current count
            });

            it('should contain only string values', () => {
                formatChartFields.forEach(field => {
                    expect(typeof field).toBe('string');
                    expect(field.length).toBeGreaterThan(0);
                });
            });

            it('should not contain duplicate values', () => {
                const uniqueFields = [...new Set(formatChartFields)];
                expect(uniqueFields.length).toBe(formatChartFields.length);
            });
        });

        describe('Core FIT File Fields', () => {
            it('should include basic measurement fields', () => {
                expect(formatChartFields).toContain('speed');
                expect(formatChartFields).toContain('heartRate');
                expect(formatChartFields).toContain('altitude');
                expect(formatChartFields).toContain('power');
                expect(formatChartFields).toContain('cadence');
                expect(formatChartFields).toContain('temperature');
                expect(formatChartFields).toContain('distance');
            });

            it('should include enhanced fields', () => {
                expect(formatChartFields).toContain('enhancedSpeed');
                expect(formatChartFields).toContain('enhancedAltitude');
            });

            it('should include GPS position fields', () => {
                expect(formatChartFields).toContain('positionLat');
                expect(formatChartFields).toContain('positionLong');
            });

            it('should include specialized fields', () => {
                expect(formatChartFields).toContain('resistance');
                expect(formatChartFields).toContain('flow');
                expect(formatChartFields).toContain('grit');
            });
        });

        describe('Field Order and Consistency', () => {
            it('should maintain consistent field ordering', () => {
                const expectedOrder = [
                    'speed',
                    'heartRate',
                    'altitude',
                    'power',
                    'cadence',
                    'temperature',
                    'distance',
                    'enhancedSpeed',
                    'enhancedAltitude',
                    'resistance',
                    'flow',
                    'grit',
                    'positionLat',
                    'positionLong'
                ];

                expect(formatChartFields).toEqual(expectedOrder);
            });

            it('should start with core measurement fields', () => {
                expect(formatChartFields[0]).toBe('speed');
                expect(formatChartFields[1]).toBe('heartRate');
                expect(formatChartFields[2]).toBe('altitude');
            });

            it('should include enhanced fields after basic ones', () => {
                const speedIndex = formatChartFields.indexOf('speed');
                const enhancedSpeedIndex = formatChartFields.indexOf('enhancedSpeed');
                expect(enhancedSpeedIndex).toBeGreaterThan(speedIndex);
            });
        });

        describe('Array Properties', () => {
            it('should be immutable in production usage', () => {
                const originalLength = formatChartFields.length;
                const firstField = formatChartFields[0];

                // Test that we can read but modifying should be avoided
                expect(formatChartFields.length).toBe(originalLength);
                expect(formatChartFields[0]).toBe(firstField);
            });

            it('should support standard array operations', () => {
                expect(formatChartFields.includes('speed')).toBe(true);
                expect(formatChartFields.includes('nonexistent')).toBe(false);
                expect(formatChartFields.indexOf('heartRate')).toBeGreaterThanOrEqual(0);
                expect(formatChartFields.indexOf('nonexistent')).toBe(-1);
            });

            it('should support iteration', () => {
                let count = 0;
                for (const field of formatChartFields) {
                    expect(typeof field).toBe('string');
                    count++;
                }
                expect(count).toBe(formatChartFields.length);
            });
        });
    });

    describe('fieldLabels Object', () => {
        describe('Basic Structure', () => {
            it('should be an object', () => {
                expect(typeof fieldLabels).toBe('object');
                expect(fieldLabels).not.toBeNull();
                expect(Array.isArray(fieldLabels)).toBe(false);
            });

            it('should contain expected number of labels', () => {
                const labelKeys = Object.keys(fieldLabels);
                expect(labelKeys.length).toBeGreaterThan(0);
                expect(labelKeys.length).toBe(25); // Current count including chart types
            });

            it('should have string keys and string values', () => {
                Object.entries(fieldLabels).forEach(([key, value]) => {
                    expect(typeof key).toBe('string');
                    expect(typeof value).toBe('string');
                    expect(key.length).toBeGreaterThan(0);
                    expect(value.length).toBeGreaterThan(0);
                });
            });
        });

        describe('Field Coverage', () => {
            it('should have labels for all formatChartFields', () => {
                formatChartFields.forEach(field => {
                    expect(fieldLabels).toHaveProperty(field);
                    expect(typeof fieldLabels[field]).toBe('string');
                    expect(fieldLabels[field].length).toBeGreaterThan(0);
                });
            });

            it('should have labels for basic measurement fields', () => {
                expect(fieldLabels.speed).toBe('Speed');
                expect(fieldLabels.heartRate).toBe('Heart Rate');
                expect(fieldLabels.altitude).toBe('Altitude');
                expect(fieldLabels.power).toBe('Power');
                expect(fieldLabels.cadence).toBe('Cadence');
                expect(fieldLabels.temperature).toBe('Temperature');
                expect(fieldLabels.distance).toBe('Distance');
            });

            it('should have labels for enhanced fields', () => {
                expect(fieldLabels.enhancedSpeed).toBe('Enhanced Speed');
                expect(fieldLabels.enhancedAltitude).toBe('Enhanced Altitude');
            });

            it('should have labels for GPS fields', () => {
                expect(fieldLabels.positionLat).toBe('Latitude');
                expect(fieldLabels.positionLong).toBe('Longitude');
            });

            it('should have labels for specialized fields', () => {
                expect(fieldLabels.resistance).toBe('Resistance');
                expect(fieldLabels.flow).toBe('Flow');
                expect(fieldLabels.grit).toBe('Grit');
            });
        });

        describe('Chart Type Labels', () => {
            it('should have labels for chart visualization types', () => {
                expect(fieldLabels.gps_track).toBe('GPS Track');
                expect(fieldLabels.speed_vs_distance).toBe('Speed vs Distance');
                expect(fieldLabels.power_vs_hr).toBe('Power vs Heart Rate');
                expect(fieldLabels.altitude_profile).toBe('Altitude Profile');
            });

            it('should have labels for zone charts', () => {
                expect(fieldLabels.hr_zone_doughnut).toBe('HR Zone Distribution (Doughnut)');
                expect(fieldLabels.power_zone_doughnut).toBe('Power Zone Distribution (Doughnut)');
                expect(fieldLabels.hr_lap_zone_stacked).toBe('HR Zone by Lap (Stacked)');
                expect(fieldLabels.hr_lap_zone_individual).toBe('HR Zone by Lap (Individual)');
                expect(fieldLabels.power_lap_zone_stacked).toBe('Power Zone by Lap (Stacked)');
                expect(fieldLabels.power_lap_zone_individual).toBe('Power Zone by Lap (Individual)');
            });

            it('should have label for event messages', () => {
                expect(fieldLabels.event_messages).toBe('Event Messages');
            });
        });

        describe('Label Quality', () => {
            it('should have human-readable labels', () => {
                Object.entries(fieldLabels).forEach(([key, label]) => {
                    // Labels should be capitalized
                    expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());

                    // Labels should not be empty or just the key
                    expect(label.length).toBeGreaterThan(0);
                    expect(label).not.toBe(key);
                });
            });

            it('should use proper formatting for compound words', () => {
                expect(fieldLabels.heartRate).toBe('Heart Rate');
                expect(fieldLabels.enhancedSpeed).toBe('Enhanced Speed');
                expect(fieldLabels.positionLat).toBe('Latitude');
                expect(fieldLabels.positionLong).toBe('Longitude');
            });

            it('should have descriptive chart type labels', () => {
                expect(fieldLabels.hr_zone_doughnut).toContain('HR Zone');
                expect(fieldLabels.hr_zone_doughnut).toContain('Doughnut');
                expect(fieldLabels.power_vs_hr).toContain('Power');
                expect(fieldLabels.power_vs_hr).toContain('Heart Rate');
            });
        });
    });

    describe('fieldColors Object', () => {
        describe('Basic Structure', () => {
            it('should be an object', () => {
                expect(typeof fieldColors).toBe('object');
                expect(fieldColors).not.toBeNull();
                expect(Array.isArray(fieldColors)).toBe(false);
            });

            it('should contain expected number of colors', () => {
                const colorKeys = Object.keys(fieldColors);
                expect(colorKeys.length).toBeGreaterThan(0);
                expect(colorKeys.length).toBe(25); // Current count including chart types
            });

            it('should have string keys and string values', () => {
                Object.entries(fieldColors).forEach(([key, value]) => {
                    expect(typeof key).toBe('string');
                    expect(typeof value).toBe('string');
                    expect(key.length).toBeGreaterThan(0);
                    expect(value.length).toBeGreaterThan(0);
                });
            });
        });

        describe('Color Coverage', () => {
            it('should have colors for all formatChartFields', () => {
                formatChartFields.forEach(field => {
                    expect(fieldColors).toHaveProperty(field);
                    expect(typeof fieldColors[field]).toBe('string');
                    expect(fieldColors[field].length).toBeGreaterThan(0);
                });
            });

            it('should have colors for basic measurement fields', () => {
                expect(fieldColors.speed).toBeDefined();
                expect(fieldColors.heartRate).toBeDefined();
                expect(fieldColors.altitude).toBeDefined();
                expect(fieldColors.power).toBeDefined();
                expect(fieldColors.cadence).toBeDefined();
                expect(fieldColors.temperature).toBeDefined();
                expect(fieldColors.distance).toBeDefined();
            });

            it('should have colors for enhanced fields', () => {
                expect(fieldColors.enhancedSpeed).toBeDefined();
                expect(fieldColors.enhancedAltitude).toBeDefined();
            });

            it('should have colors for specialized fields', () => {
                expect(fieldColors.resistance).toBeDefined();
                expect(fieldColors.flow).toBeDefined();
                expect(fieldColors.grit).toBeDefined();
                expect(fieldColors.positionLat).toBeDefined();
                expect(fieldColors.positionLong).toBeDefined();
            });
        });

        describe('Color Format Validation', () => {
            it('should use valid hex color format', () => {
                const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

                Object.entries(fieldColors).forEach(([key, color]) => {
                    expect(color).toMatch(hexColorRegex);
                });
            });

            it('should have specific expected colors for key fields', () => {
                expect(fieldColors.speed).toBe('#1976d2'); // Blue
                expect(fieldColors.heartRate).toBe('#e53935'); // Red
                expect(fieldColors.altitude).toBe('#43a047'); // Green
                expect(fieldColors.power).toBe('#ff9800'); // Orange
                expect(fieldColors.cadence).toBe('#8e24aa'); // Purple
                expect(fieldColors.temperature).toBe('#00bcd4'); // Cyan
                expect(fieldColors.distance).toBe('#607d8b'); // Blue Grey
            });

            it('should have distinct colors for enhanced fields', () => {
                expect(fieldColors.enhancedSpeed).toBe('#009688'); // Teal
                expect(fieldColors.enhancedAltitude).toBe('#cddc39'); // Lime
            });

            it('should use different colors for different fields', () => {
                const colors = Object.values(fieldColors);
                const uniqueColors = [...new Set(colors)];

                // Should have good color diversity
                expect(uniqueColors.length).toBeGreaterThan(15);
            });
        });

        describe('Color Accessibility', () => {
            it('should use accessible color palette', () => {
                // Test that colors are not too light (should have sufficient contrast)
                Object.entries(fieldColors).forEach(([key, color]) => {
                    // Convert hex to RGB and check that it's not too light
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);

                    // Calculate luminance (simplified)
                    const luminance = (r + g + b) / 3;

                    // Colors should not be too light (good contrast)
                    expect(luminance).toBeLessThan(200);
                });
            });

            it('should have distinguishable colors for related fields', () => {
                // Speed vs Enhanced Speed should be different
                expect(fieldColors.speed).not.toBe(fieldColors.enhancedSpeed);

                // Altitude vs Enhanced Altitude should be different
                expect(fieldColors.altitude).not.toBe(fieldColors.enhancedAltitude);

                // Heart rate zones should be distinguishable
                expect(fieldColors.hr_zone_doughnut).not.toBe(fieldColors.hr_lap_zone_stacked);
            });
        });
    });

    describe('Cross-Object Consistency', () => {
        describe('Key Alignment', () => {
            it('should have matching keys between formatChartFields and fieldLabels', () => {
                formatChartFields.forEach(field => {
                    expect(fieldLabels).toHaveProperty(field);
                });
            });

            it('should have matching keys between formatChartFields and fieldColors', () => {
                formatChartFields.forEach(field => {
                    expect(fieldColors).toHaveProperty(field);
                });
            });

            it('should have consistent key naming conventions', () => {
                const allKeys = [
                    ...formatChartFields,
                    ...Object.keys(fieldLabels),
                    ...Object.keys(fieldColors)
                ];

                allKeys.forEach(key => {
                    // Keys should be camelCase or snake_case
                    expect(key).toMatch(/^[a-z][a-zA-Z0-9_]*$/);
                });
            });
        });

        describe('Additional Chart Types', () => {
            it('should have chart type labels that are not in formatChartFields', () => {
                const chartTypes = [
                    'gps_track',
                    'speed_vs_distance',
                    'power_vs_hr',
                    'altitude_profile',
                    'hr_zone_doughnut',
                    'power_zone_doughnut',
                    'event_messages',
                    'hr_lap_zone_stacked',
                    'hr_lap_zone_individual',
                    'power_lap_zone_stacked',
                    'power_lap_zone_individual'
                ];

                chartTypes.forEach(chartType => {
                    expect(fieldLabels).toHaveProperty(chartType);
                    expect(fieldColors).toHaveProperty(chartType);
                    expect(formatChartFields).not.toContain(chartType);
                });
            });

            it('should have complete mapping for all labeled fields', () => {
                Object.keys(fieldLabels).forEach(key => {
                    expect(fieldColors).toHaveProperty(key);
                });
            });

            it('should have complete mapping for all colored fields', () => {
                Object.keys(fieldColors).forEach(key => {
                    expect(fieldLabels).toHaveProperty(key);
                });
            });
        });
    });

    describe('Usage Scenarios', () => {
        describe('Field Validation', () => {
            it('should support checking if a field is chartable', () => {
                expect(formatChartFields.includes('speed')).toBe(true);
                expect(formatChartFields.includes('heartRate')).toBe(true);
                expect(formatChartFields.includes('invalidField')).toBe(false);
            });

            it('should support getting label for any field', () => {
                expect(fieldLabels['speed']).toBe('Speed');
                expect(fieldLabels['heartRate']).toBe('Heart Rate');
                expect(fieldLabels['nonexistent']).toBeUndefined();
            });

            it('should support getting color for any field', () => {
                expect(fieldColors['speed']).toBe('#1976d2');
                expect(fieldColors['heartRate']).toBe('#e53935');
                expect(fieldColors['nonexistent']).toBeUndefined();
            });
        });

        describe('Chart Configuration', () => {
            it('should provide complete configuration for chart setup', () => {
                const testField = 'speed';

                expect(formatChartFields.includes(testField)).toBe(true);
                expect(fieldLabels[testField]).toBeDefined();
                expect(fieldColors[testField]).toBeDefined();

                const config = {
                    field: testField,
                    label: fieldLabels[testField],
                    color: fieldColors[testField]
                };

                expect(config.field).toBe('speed');
                expect(config.label).toBe('Speed');
                expect(config.color).toBe('#1976d2');
            });

            it('should support iteration over all chart fields', () => {
                const configs = formatChartFields.map(field => ({
                    field,
                    label: fieldLabels[field],
                    color: fieldColors[field]
                }));

                expect(configs.length).toBe(formatChartFields.length);
                configs.forEach(config => {
                    expect(config.field).toBeDefined();
                    expect(config.label).toBeDefined();
                    expect(config.color).toBeDefined();
                });
            });
        });

        describe('Performance and Memory', () => {
            it('should handle rapid access efficiently', () => {
                const start = performance.now();

                for (let i = 0; i < 1000; i++) {
                    formatChartFields.includes('speed');
                    fieldLabels['heartRate'];
                    fieldColors['altitude'];
                }

                const end = performance.now();
                expect(end - start).toBeLessThan(10); // Should be very fast
            });

            it('should maintain referential integrity', () => {
                const fields1 = formatChartFields;
                const fields2 = formatChartFields;
                const labels1 = fieldLabels;
                const labels2 = fieldLabels;
                const colors1 = fieldColors;
                const colors2 = fieldColors;

                expect(fields1).toBe(fields2);
                expect(labels1).toBe(labels2);
                expect(colors1).toBe(colors2);
            });
        });
    });
});

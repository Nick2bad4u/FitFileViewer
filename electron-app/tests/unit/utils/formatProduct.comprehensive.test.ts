import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatProduct } from '../../../utils/formatting/formatters/formatProduct.js';

// Mock the external dependencies
vi.mock('../../../utils/formatting/display/formatAntNames.js', () => ({
    getManufacturerIdFromName: vi.fn(),
    getProductName: vi.fn()
}));

// Import the mocked functions
import { getManufacturerIdFromName, getProductName } from '../../../utils/formatting/display/formatAntNames.js';

describe('formatProduct.js - Comprehensive Test Suite', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Set up default mock implementations
        const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
        const mockGetProductName = vi.mocked(getProductName);

        // Default behaviors
        mockGetManufacturerIdFromName.mockImplementation((name) => {
            const nameMap: Record<string, number> = {
                'garmin': 1,
                'wahoo': 32,
                'polar': 7,
                'suunto': 23,
                'stages': 69
            };
            return nameMap[name?.toLowerCase()] || null;
        });

        mockGetProductName.mockImplementation((manufacturerId, productId) => {
            // Mock some known product mappings
            const products: Record<string, string> = {
                '1_1735': 'edge_520',
                '1_1561': 'edge_810',
                '1_2067': 'fenix_5',
                '32_1537': 'elemnt_bolt',
                '7_1': 'v800'
            };
            return products[`${manufacturerId}_${productId}`] || String(productId);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('formatProduct() - Main Function Tests', () => {
        describe('Valid Input Combinations', () => {
            it('should format product with manufacturer ID and product ID', () => {
                const result = formatProduct(1, 1735);
                expect(result).toBe('Edge 520');
            });

            it('should format product with manufacturer name and product ID', () => {
                const result = formatProduct('garmin', 1735);
                expect(result).toBe('Edge 520');
            });

            it('should handle numeric strings for manufacturer ID', () => {
                const result = formatProduct('1', 1735);
                expect(result).toBe('Edge 520');
            });

            it('should handle numeric strings for product ID', () => {
                const result = formatProduct(1, '1735');
                expect(result).toBe('Edge 520');
            });

            it('should format multiple word product names correctly', () => {
                const result = formatProduct(32, 1537);
                expect(result).toBe('Elemnt Bolt');
            });

            it('should handle case variations in manufacturer names', () => {
                expect(formatProduct('GARMIN', 1735)).toBe('Edge 520');
                expect(formatProduct('Garmin', 1735)).toBe('Edge 520');
                expect(formatProduct('gArMiN', 1735)).toBe('Edge 520');
            });
        });

        describe('Invalid Manufacturer Handling', () => {
            it('should handle null manufacturer', () => {
                const result = formatProduct(null as any, 1735);
                expect(result).toBe('1735');
            });

            it('should handle undefined manufacturer', () => {
                const result = formatProduct(undefined as any, 1735);
                expect(result).toBe('1735');
            });

            it('should handle empty string manufacturer', () => {
                const result = formatProduct('', 1735);
                expect(result).toBe('1735');
            });

            it('should handle unknown manufacturer name', () => {
                const result = formatProduct('unknown', 1735);
                expect(result).toBe('1735');
            });

            it('should handle non-numeric string manufacturer', () => {
                const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
                mockGetManufacturerIdFromName.mockReturnValue(null);

                const result = formatProduct('invalidname', 1735);
                expect(result).toBe('1735');
            });
        });

        describe('Invalid Product ID Handling', () => {
            it('should handle null product ID', () => {
                const result = formatProduct(1, null as any);
                expect(result).toBe('Unknown Product');
            });

            it('should handle undefined product ID', () => {
                const result = formatProduct(1, undefined as any);
                expect(result).toBe('Unknown Product');
            });

            it('should handle empty string product ID', () => {
                const result = formatProduct(1, '');
                expect(result).toBe('Unknown Product');
            });

            it('should handle zero as valid product ID', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('special_device');

                const result = formatProduct(1, 0);
                expect(result).toBe('Special Device');
            });
        });

        describe('Product Name Lookup and Formatting', () => {
            it('should format snake_case product names to Title Case', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('heart_rate_monitor');

                const result = formatProduct(1, 123);
                expect(result).toBe('Heart Rate Monitor');
            });

            it('should handle single word product names', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('forerunner');

                const result = formatProduct(1, 123);
                expect(result).toBe('Forerunner');
            });

            it('should handle product names with multiple underscores', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('gps_bike_computer_pro');

                const result = formatProduct(1, 123);
                expect(result).toBe('Gps Bike Computer Pro');
            });

            it('should fallback to product ID when no mapping found', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('999'); // Returns same as input

                const result = formatProduct(1, 999);
                expect(result).toBe('999');
            });

            it('should fallback to product ID when mapping returns null', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue(null as any);

                const result = formatProduct(1, 999);
                expect(result).toBe('999');
            });

            it('should fallback to product ID when mapping returns undefined', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue(undefined as any);

                const result = formatProduct(1, 999);
                expect(result).toBe('999');
            });
        });

        describe('Edge Cases and Error Handling', () => {
            it('should handle boolean manufacturer input', () => {
                const result = formatProduct(true as any, 1735);
                expect(result).toBe('Edge 520'); // boolean true is truthy, gets converted to number
            });

            it('should handle object manufacturer input', () => {
                const result = formatProduct({} as any, 1735);
                expect(result).toBe('1735');
            });

            it('should handle array manufacturer input', () => {
                const result = formatProduct([] as any, 1735);
                expect(result).toBe('1735');
            });

            it('should handle boolean product ID input', () => {
                const result = formatProduct(1, true as any);
                expect(result).toBe('True'); // boolean converts to "True" via toString()
            });

            it('should handle object product ID input', () => {
                const result = formatProduct(1, {} as any);
                expect(result).toBe('[object object]'); // object converts to "[object object]" via toString()
            });

            it('should handle array product ID input', () => {
                const result = formatProduct(1, [] as any);
                expect(result).toBe('Unknown Product');
            });

            it('should handle NaN manufacturer', () => {
                const result = formatProduct(NaN, 1735);
                expect(result).toBe('1735');
            });

            it('should handle NaN product ID', () => {
                const result = formatProduct(1, NaN);
                expect(result).toBe('Nan'); // NaN converts to "Nan" via toString()
            });

            it('should handle Infinity manufacturer', () => {
                const result = formatProduct(Infinity, 1735);
                expect(result).toBe('1735'); // Infinity treated as invalid manufacturer, uses fallback
            });

            it('should handle Infinity product ID', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('Infinity');

                const result = formatProduct(1, Infinity);
                expect(result).toBe('Infinity');
            });

            it('should handle getManufacturerIdFromName throwing error', () => {
                const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
                const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
                mockGetManufacturerIdFromName.mockImplementation(() => {
                    throw new Error('Manufacturer lookup failed');
                });

                const result = formatProduct('garmin', 1735);
                expect(result).toBe('1735');
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Error looking up manufacturer ID:'),
                    expect.any(Error)
                );

                consoleSpy.mockRestore();
            });

            it('should handle getProductName throwing error', () => {
                const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockImplementation(() => {
                    throw new Error('Product lookup failed');
                });

                const result = formatProduct(1, 1735);
                expect(result).toBe('1735');
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Error looking up product name:'),
                    expect.any(Error)
                );

                consoleSpy.mockRestore();
            });

            it('should handle main function throwing error', () => {
                const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

                // Force an error in manufacturer ID resolution
                const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
                mockGetManufacturerIdFromName.mockImplementation(() => {
                    throw new Error('Unexpected error');
                });

                const result = formatProduct('garmin', 1735);
                expect(result).toBe('1735'); // Falls back to productId when manufacturer resolution fails
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Error looking up manufacturer ID:'),
                    expect.any(Error)
                );

                consoleSpy.mockRestore();
            });

            it('should handle null fallback product gracefully', () => {
                const result = formatProduct(1, null as any);
                expect(result).toBe('Unknown Product');
            });

            it('should handle undefined fallback product gracefully', () => {
                const result = formatProduct(1, undefined as any);
                expect(result).toBe('Unknown Product');
            });
        });

        describe('Complex Scenarios', () => {
            it('should handle whitespace in manufacturer names', () => {
                const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
                mockGetManufacturerIdFromName.mockImplementation((name) => {
                    if (typeof name === 'string' && name.trim().toLowerCase() === 'garmin') {
                        return 1;
                    }
                    return null;
                });

                const result = formatProduct('  garmin  ', 1735);
                expect(result).toBe('Edge 520');
            });

            it('should handle very long product names', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('very_long_product_name_with_many_words_and_underscores');

                const result = formatProduct(1, 999);
                expect(result).toBe('Very Long Product Name With Many Words And Underscores');
            });

            it('should handle special characters in product names', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('device_v2.0_pro');

                const result = formatProduct(1, 999);
                expect(result).toBe('Device V2.0 Pro');
            });

            it('should handle numeric product names correctly', () => {
                const mockGetProductName = vi.mocked(getProductName);
                mockGetProductName.mockReturnValue('520');

                const result = formatProduct(1, 999);
                expect(result).toBe('520');
            });
        });

        describe('Performance and Edge Boundaries', () => {
            it('should handle rapid successive calls efficiently', () => {
                const start = performance.now();

                for (let i = 0; i < 1000; i++) {
                    formatProduct(1, i);
                }

                const end = performance.now();
                expect(end - start).toBeLessThan(100); // Should complete quickly
            });

            it('should handle large manufacturer IDs', () => {
                const result = formatProduct(999999, 1735);
                expect(result).toBe('1735'); // Falls back when product not found
            });

            it('should handle large product IDs', () => {
                const result = formatProduct(1, 999999);
                expect(result).toBe('999999');
            });

            it('should handle negative manufacturer IDs', () => {
                const result = formatProduct(-1, 1735);
                expect(result).toBe('1735'); // Falls back when product not found
            });

            it('should handle negative product IDs', () => {
                const result = formatProduct(1, -1735);
                expect(result).toBe('-1735');
            });
        });
    });

    describe('Integration and Cross-Dependency Tests', () => {
        it('should work with various manufacturer-product combinations', () => {
            const testCases = [
                { manufacturer: 1, productId: 1735, expected: 'Edge 520' },
                { manufacturer: 'garmin', productId: 1561, expected: 'Edge 810' },
                { manufacturer: 32, productId: 1537, expected: 'Elemnt Bolt' },
                { manufacturer: 'wahoo', productId: 1537, expected: 'Elemnt Bolt' },
                { manufacturer: 7, productId: 1, expected: 'V800' }
            ];

            testCases.forEach(({ manufacturer, productId, expected }) => {
                expect(formatProduct(manufacturer, productId)).toBe(expected);
            });
        });

        it('should handle mixed valid and invalid inputs', () => {
            const result1 = formatProduct(null as any, 1735);
            const result2 = formatProduct(1, null as any);
            const result3 = formatProduct('unknown', 999);

            expect(result1).toBe('1735');
            expect(result2).toBe('Unknown Product');
            expect(result3).toBe('999');
        });

        it('should maintain function purity (no side effects)', () => {
            const manufacturer = 'garmin';
            const productId = 1735;

            const result1 = formatProduct(manufacturer, productId);
            const result2 = formatProduct(manufacturer, productId);

            expect(result1).toBe(result2);
            expect(result1).toBe('Edge 520');
        });

        it('should handle dependencies returning different data types', () => {
            const mockGetProductName = vi.mocked(getProductName);

            // Test with string return
            mockGetProductName.mockReturnValueOnce('device_name');
            expect(formatProduct(1, 123)).toBe('Device Name');

            // Test with number return (same as input)
            mockGetProductName.mockReturnValueOnce('123');
            expect(formatProduct(1, 123)).toBe('123');

            // Test with null return
            mockGetProductName.mockReturnValueOnce(null as any);
            expect(formatProduct(1, 123)).toBe('123');
        });
    });

    describe('Error Recovery and Resilience', () => {
        it('should recover from dependency failures gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
            const mockGetProductName = vi.mocked(getProductName);

            // First call fails, second succeeds
            mockGetManufacturerIdFromName
                .mockImplementationOnce(() => { throw new Error('Network error'); })
                .mockReturnValueOnce(1);

            const result1 = formatProduct('garmin', 1735);
            const result2 = formatProduct('garmin', 1735);

            expect(result1).toBe('1735'); // Fallback
            expect(result2).toBe('Edge 520'); // Success

            consoleSpy.mockRestore();
        });

        it('should handle cascading dependency failures', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const mockGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
            const mockGetProductName = vi.mocked(getProductName);

            mockGetManufacturerIdFromName.mockImplementation(() => {
                throw new Error('Manufacturer lookup failed');
            });
            mockGetProductName.mockImplementation(() => {
                throw new Error('Product lookup failed');
            });

            const result = formatProduct('garmin', 1735);
            expect(result).toBe('1735');

            consoleSpy.mockRestore();
        });

        it('should handle formatting edge cases with special strings', () => {
            const mockGetProductName = vi.mocked(getProductName);

            // Test empty string
            mockGetProductName.mockReturnValueOnce('');
            expect(formatProduct(1, 123)).toBe('123');

            // Test only underscores
            mockGetProductName.mockReturnValueOnce('___');
            expect(formatProduct(1, 123)).toBe('   ');

            // Test single character
            mockGetProductName.mockReturnValueOnce('a');
            expect(formatProduct(1, 123)).toBe('A');
        });
    });
});

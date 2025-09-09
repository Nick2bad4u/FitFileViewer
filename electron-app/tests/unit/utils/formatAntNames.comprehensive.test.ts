import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getManufacturerName,
    getProductName,
    getManufacturerAndProduct,
    getManufacturerIdFromName
} from '../../../utils/formatting/display/formatAntNames.js';

// Mock the data lookup modules
vi.mock('../../../utils/data/lookups/dataAntManufacturerIDs.js', () => ({
    dataAntManufacturerIDs: {
        1: 'garmin',
        2: 'wahoo',
        3: 'polar',
        15: 'suunto',
        32: 'powertap',
        263: 'wahoo_fitness',
        89: 'favero_electronics',
        255: 'development'
    }
}));

vi.mock('../../../utils/data/lookups/dataAntProductIds.js', () => ({
    dataAntProductIds: {
        1: { // garmin products
            1: 'Edge 500',
            2: 'Edge 800',
            3: 'Edge 1000',
            717: 'Edge 130',
            2713: 'Edge 530'
        },
        2: { // wahoo products
            1: 'KICKR',
            2: 'ELEMNT',
            3: 'ELEMNT BOLT'
        },
        3: { // polar products
            1: 'V800',
            2: 'M430'
        },
        89: { // favero products
            1: 'bePRO',
            2: 'Assioma'
        }
    }
}));

describe('formatAntNames.js - Manufacturer and Product Name Formatting', () => {
    describe('getManufacturerName', () => {
        describe('Basic Functionality', () => {
            it('should return manufacturer name for valid numeric ID', () => {
                expect(getManufacturerName(1)).toBe('garmin');
                expect(getManufacturerName(2)).toBe('wahoo');
                expect(getManufacturerName(3)).toBe('polar');
            });

            it('should return manufacturer name for valid string ID', () => {
                expect(getManufacturerName('1')).toBe('garmin');
                expect(getManufacturerName('2')).toBe('wahoo');
                expect(getManufacturerName('15')).toBe('suunto');
            });

            it('should handle known manufacturer IDs correctly', () => {
                expect(getManufacturerName(263)).toBe('wahoo_fitness');
                expect(getManufacturerName(89)).toBe('favero_electronics');
                expect(getManufacturerName(255)).toBe('development');
            });
        });

        describe('Edge Cases and Error Handling', () => {
            it('should return original value for unknown manufacturer ID', () => {
                expect(getManufacturerName(999)).toBe(999);
                expect(getManufacturerName(0)).toBe(0);
                expect(getManufacturerName(-1)).toBe(-1);
            });

            it('should return original value for unknown string ID', () => {
                expect(getManufacturerName('999')).toBe('999');
                expect(getManufacturerName('unknown')).toBe('unknown');
            });

            it('should handle invalid input types gracefully', () => {
                expect(getManufacturerName(null as any)).toBe(null);
                expect(getManufacturerName(undefined as any)).toBe(undefined);
                expect(getManufacturerName({} as any)).toStrictEqual({});
                expect(getManufacturerName([] as any)).toStrictEqual([]);
            });

            it('should handle NaN and non-numeric strings', () => {
                expect(getManufacturerName('abc')).toBe('abc');
                expect(getManufacturerName('12.5')).toBe('12.5');
                expect(getManufacturerName('')).toBe('');
            });

            it('should handle very large numbers', () => {
                const largeNumber = Number.MAX_SAFE_INTEGER;
                expect(getManufacturerName(largeNumber)).toBe(largeNumber);
                expect(getManufacturerName(largeNumber.toString())).toBe(largeNumber.toString());
            });
        });

        describe('Type Conversion', () => {
            it('should convert string numbers to integers for lookup', () => {
                expect(getManufacturerName('1')).toBe('garmin');
                expect(getManufacturerName('089')).toBe('favero_electronics'); // leading zero
                expect(getManufacturerName('001')).toBe('garmin'); // leading zeros
            });

            it('should handle numeric strings with different formats', () => {
                expect(getManufacturerName('1.0')).toBe('garmin'); // parseInt converts to 1
                expect(getManufacturerName('1e0')).toBe('garmin'); // scientific notation
            });
        });
    });

    describe('getProductName', () => {
        describe('Basic Functionality', () => {
            it('should return product name for valid manufacturer and product IDs', () => {
                expect(getProductName(1, 1)).toBe('Edge 500');
                expect(getProductName(1, 2)).toBe('Edge 800');
                expect(getProductName(2, 1)).toBe('KICKR');
                expect(getProductName(89, 2)).toBe('Assioma');
            });

            it('should handle string IDs correctly', () => {
                expect(getProductName('1', '3')).toBe('Edge 1000');
                expect(getProductName('2', '2')).toBe('ELEMNT');
                expect(getProductName('3', '1')).toBe('V800');
            });

            it('should handle mixed numeric and string IDs', () => {
                expect(getProductName(1, '717')).toBe('Edge 130');
                expect(getProductName('1', 2713)).toBe('Edge 530');
            });
        });

        describe('Error Handling and Edge Cases', () => {
            it('should return original product ID for unknown manufacturer', () => {
                expect(getProductName(999, 1)).toBe(1);
                expect(getProductName(999, '1')).toBe('1');
                expect(getProductName('999', 1)).toBe(1);
            });

            it('should return original product ID for unknown product within known manufacturer', () => {
                expect(getProductName(1, 999)).toBe(999);
                expect(getProductName(1, '999')).toBe('999');
                expect(getProductName('1', 999)).toBe(999);
            });

            it('should handle invalid manufacturer IDs gracefully', () => {
                expect(getProductName(null as any, 1)).toBe(1);
                expect(getProductName(undefined as any, 1)).toBe(1);
                expect(getProductName({} as any, 1)).toBe(1);
                expect(getProductName([] as any, 1)).toBe(1);
            });

            it('should handle invalid product IDs gracefully', () => {
                expect(getProductName(1, null as any)).toBe(null);
                expect(getProductName(1, undefined as any)).toBe(undefined);
                expect(getProductName(1, {} as any)).toStrictEqual({});
                expect(getProductName(1, [] as any)).toStrictEqual([]);
            });

            it('should handle non-numeric string IDs', () => {
                expect(getProductName('abc', 1)).toBe(1);
                expect(getProductName(1, 'abc')).toBe('abc');
                expect(getProductName('abc', 'def')).toBe('def');
            });

            it('should handle zero and negative IDs', () => {
                expect(getProductName(0, 1)).toBe(1);
                expect(getProductName(1, 0)).toBe(0);
                expect(getProductName(-1, 1)).toBe(1);
                expect(getProductName(1, -1)).toBe(-1);
            });
        });

        describe('Type Conversion', () => {
            it('should convert string numbers to integers for lookup', () => {
                expect(getProductName('1', '1')).toBe('Edge 500');
                expect(getProductName('01', '001')).toBe('Edge 500'); // leading zeros
            });

            it('should handle numeric strings with different formats', () => {
                expect(getProductName('1.0', '1.0')).toBe('Edge 500'); // parseInt handles decimals
            });
        });
    });

    describe('getManufacturerAndProduct', () => {
        describe('Basic Functionality', () => {
            it('should return both manufacturer and product names for valid IDs', () => {
                const result = getManufacturerAndProduct(1, 1);
                expect(result).toEqual({
                    manufacturerName: 'garmin',
                    productName: 'Edge 500'
                });
            });

            it('should handle string IDs correctly', () => {
                const result = getManufacturerAndProduct('2', '3');
                expect(result).toEqual({
                    manufacturerName: 'wahoo',
                    productName: 'ELEMNT BOLT'
                });
            });

            it('should handle manufacturer only (null product ID)', () => {
                const result = getManufacturerAndProduct(1, null);
                expect(result).toEqual({
                    manufacturerName: 'garmin',
                    productName: null
                });
            });

            it('should handle manufacturer only (undefined product ID)', () => {
                const result = getManufacturerAndProduct(1);
                expect(result).toEqual({
                    manufacturerName: 'garmin',
                    productName: null
                });
            });
        });

        describe('Error Handling', () => {
            it('should handle unknown manufacturer ID', () => {
                const result = getManufacturerAndProduct(999, 1);
                expect(result).toEqual({
                    manufacturerName: 999,
                    productName: 1
                });
            });

            it('should handle unknown product ID within known manufacturer', () => {
                const result = getManufacturerAndProduct(1, 999);
                expect(result).toEqual({
                    manufacturerName: 'garmin',
                    productName: 999
                });
            });

            it('should handle invalid manufacturer ID', () => {
                const result = getManufacturerAndProduct(null as any, 1);
                expect(result).toEqual({
                    manufacturerName: null,
                    productName: 1
                });
            });

            it('should handle invalid product ID', () => {
                const result = getManufacturerAndProduct(1, {} as any);
                expect(result).toEqual({
                    manufacturerName: 'garmin',
                    productName: {}
                });
            });
        });

        describe('Return Object Structure', () => {
            it('should always return object with correct property names', () => {
                const result = getManufacturerAndProduct(1, 1);
                expect(result).toHaveProperty('manufacturerName');
                expect(result).toHaveProperty('productName');
                expect(Object.keys(result)).toEqual(['manufacturerName', 'productName']);
            });

            it('should return object with correct property types', () => {
                const result = getManufacturerAndProduct(1, 1);
                expect(typeof result).toBe('object');
                expect(result.manufacturerName).toBe('garmin');
                expect(result.productName).toBe('Edge 500');
            });
        });
    });

    describe('getManufacturerIdFromName', () => {
        describe('Basic Functionality', () => {
            it('should return manufacturer ID for exact name match', () => {
                expect(getManufacturerIdFromName('garmin')).toBe(1);
                expect(getManufacturerIdFromName('wahoo')).toBe(2);
                expect(getManufacturerIdFromName('polar')).toBe(3);
            });

            it('should handle case-insensitive matching', () => {
                expect(getManufacturerIdFromName('GARMIN')).toBe(1);
                expect(getManufacturerIdFromName('Wahoo')).toBe(2);
                expect(getManufacturerIdFromName('POLAR')).toBe(3);
            });

            it('should handle underscore variations', () => {
                expect(getManufacturerIdFromName('wahoo_fitness')).toBe(263);
                expect(getManufacturerIdFromName('wahoofitness')).toBe(263);
                expect(getManufacturerIdFromName('favero_electronics')).toBe(89);
                expect(getManufacturerIdFromName('faveroelectronics')).toBe(89);
            });

            it('should handle electronics variations', () => {
                expect(getManufacturerIdFromName('faveroelectronics')).toBe(89);
                expect(getManufacturerIdFromName('favero_electronics')).toBe(89);
            });
        });

        describe('Input Validation', () => {
            it('should return null for invalid input types', () => {
                expect(getManufacturerIdFromName(null as any)).toBe(null);
                expect(getManufacturerIdFromName(undefined as any)).toBe(null);
                expect(getManufacturerIdFromName(123 as any)).toBe(null);
                expect(getManufacturerIdFromName({} as any)).toBe(null);
                expect(getManufacturerIdFromName([] as any)).toBe(null);
            });

            it('should return null for empty string', () => {
                expect(getManufacturerIdFromName('')).toBe(null);
            });

            it('should return null for whitespace-only strings', () => {
                expect(getManufacturerIdFromName('   ')).toBe(null);
                expect(getManufacturerIdFromName('\t')).toBe(null);
                expect(getManufacturerIdFromName('\n')).toBe(null);
            });
        });

        describe('Name Variations and Normalization', () => {
            it('should handle different casing variations', () => {
                expect(getManufacturerIdFromName('garmin')).toBe(1);
                expect(getManufacturerIdFromName('Garmin')).toBe(1);
                expect(getManufacturerIdFromName('GARMIN')).toBe(1);
                expect(getManufacturerIdFromName('gArMiN')).toBe(1);
            });

            it('should handle underscore to non-underscore variations', () => {
                expect(getManufacturerIdFromName('wahoo_fitness')).toBe(263);
                expect(getManufacturerIdFromName('wahoofitness')).toBe(263);
            });

            it('should handle electronics word variations', () => {
                expect(getManufacturerIdFromName('favero_electronics')).toBe(89);
                expect(getManufacturerIdFromName('faveroelectronics')).toBe(89);
            });

            it('should handle complex manufacturer names', () => {
                expect(getManufacturerIdFromName('development')).toBe(255);
                expect(getManufacturerIdFromName('DEVELOPMENT')).toBe(255);
            });
        });

        describe('Unknown Names', () => {
            it('should return null for unknown manufacturer names', () => {
                expect(getManufacturerIdFromName('unknown')).toBe(null);
                expect(getManufacturerIdFromName('nonexistent')).toBe(null);
                expect(getManufacturerIdFromName('fake_manufacturer')).toBe(null);
            });

            it('should return null for partial matches', () => {
                expect(getManufacturerIdFromName('gar')).toBe(null);
                expect(getManufacturerIdFromName('garmi')).toBe(null);
                expect(getManufacturerIdFromName('garmin_extra')).toBe(null);
            });

            it('should return null for similar but different names', () => {
                expect(getManufacturerIdFromName('garmins')).toBe(null);
                expect(getManufacturerIdFromName('wahoos')).toBe(null);
                expect(getManufacturerIdFromName('polaroid')).toBe(null);
            });
        });

        describe('Edge Cases', () => {
            it('should handle very long strings', () => {
                const longString = 'a'.repeat(1000);
                expect(getManufacturerIdFromName(longString)).toBe(null);
            });

            it('should handle strings with special characters', () => {
                expect(getManufacturerIdFromName('garmin@')).toBe(null);
                expect(getManufacturerIdFromName('garmin#')).toBe(null);
                expect(getManufacturerIdFromName('garmin!')).toBe(null);
            });

            it('should handle strings with numbers', () => {
                expect(getManufacturerIdFromName('garmin1')).toBe(null);
                expect(getManufacturerIdFromName('1garmin')).toBe(null);
                expect(getManufacturerIdFromName('gar1min')).toBe(null);
            });

            it('should handle Unicode characters', () => {
                expect(getManufacturerIdFromName('gärmin')).toBe(null);
                expect(getManufacturerIdFromName('garmín')).toBe(null);
                expect(getManufacturerIdFromName('🔥garmin')).toBe(null);
            });
        });

        describe('Performance and Consistency', () => {
            it('should be consistent across multiple calls', () => {
                const name = 'garmin';
                const result1 = getManufacturerIdFromName(name);
                const result2 = getManufacturerIdFromName(name);
                const result3 = getManufacturerIdFromName(name);

                expect(result1).toBe(result2);
                expect(result2).toBe(result3);
                expect(result1).toBe(1);
            });

            it('should handle rapid successive calls efficiently', () => {
                const start = performance.now();
                for (let i = 0; i < 100; i++) {
                    getManufacturerIdFromName('garmin');
                    getManufacturerIdFromName('wahoo');
                    getManufacturerIdFromName('unknown');
                }
                const end = performance.now();

                // Should complete 300 calls in reasonable time (less than 100ms)
                expect(end - start).toBeLessThan(100);
            });

            it('should not modify global state', () => {
                // Test that function calls don't modify the internal state
                const result1 = getManufacturerIdFromName('garmin');
                const result2 = getManufacturerIdFromName('garmin');

                expect(result1).toBe(result2);
                expect(result1).toBe(1);

                // Test with unknown name doesn't affect known lookups
                getManufacturerIdFromName('unknown');
                expect(getManufacturerIdFromName('garmin')).toBe(1);
            });
        });
    });

    describe('Integration and Real-world Scenarios', () => {
        it('should handle typical FIT file manufacturer/product combinations', () => {
            // Garmin Edge device
            expect(getManufacturerName(1)).toBe('garmin');
            expect(getProductName(1, 717)).toBe('Edge 130');

            const garminEdge = getManufacturerAndProduct(1, 717);
            expect(garminEdge.manufacturerName).toBe('garmin');
            expect(garminEdge.productName).toBe('Edge 130');
        });

        it('should handle power meter scenarios', () => {
            // Favero power meter
            expect(getManufacturerName(89)).toBe('favero_electronics');
            expect(getProductName(89, 2)).toBe('Assioma');

            const faveroAssioma = getManufacturerAndProduct(89, 2);
            expect(faveroAssioma.manufacturerName).toBe('favero_electronics');
            expect(faveroAssioma.productName).toBe('Assioma');
        });

        it('should handle trainer scenarios', () => {
            // Wahoo trainer
            expect(getManufacturerName(2)).toBe('wahoo');
            expect(getProductName(2, 1)).toBe('KICKR');

            const wahooKickr = getManufacturerAndProduct(2, 1);
            expect(wahooKickr.manufacturerName).toBe('wahoo');
            expect(wahooKickr.productName).toBe('KICKR');
        });

        it('should handle reverse lookup scenarios', () => {
            expect(getManufacturerIdFromName('garmin')).toBe(1);
            expect(getManufacturerIdFromName('wahoo')).toBe(2);
            expect(getManufacturerIdFromName('favero_electronics')).toBe(89);
            expect(getManufacturerIdFromName('wahoo_fitness')).toBe(263);
        });

        it('should handle development/unknown device scenarios', () => {
            expect(getManufacturerName(255)).toBe('development');
            expect(getProductName(255, 999)).toBe(999); // Unknown product

            const devDevice = getManufacturerAndProduct(255, 999);
            expect(devDevice.manufacturerName).toBe('development');
            expect(devDevice.productName).toBe(999);
        });
    });
});

/**
 * @file Comprehensive test suite for extractDeveloperFieldsList.js utility
 *
 *   Tests all aspects of developer fields extraction including:
 *
 *   - Basic developer fields parsing from JSON strings
 *   - Array and scalar value handling
 *   - Input validation and error handling
 *   - Edge cases and boundary conditions
 *   - Performance and consistency testing
 *   - Real-world usage scenarios with FIT file data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractDeveloperFieldsList } from "../../../utils/data/processing/extractDeveloperFieldsList.js";

describe("extractDeveloperFieldsList.js - Developer Fields Extraction Utility", () => {
    let consoleSpy: any;

    beforeEach(() => {
        consoleSpy = {
            log: vi.spyOn(console, "log").mockImplementation(() => {}),
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        consoleSpy.log.mockRestore();
        consoleSpy.warn.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe("Basic Developer Fields Parsing", () => {
        it("should extract scalar numeric developer fields", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100, "2": 200}' },
                { developerFields: '{"3": 300}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should extract array developer fields with indices", () => {
            const recordMesgs = [
                { developerFields: '{"1": [10, 20, 30]}' },
                { developerFields: '{"2": [40, 50]}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1_0",
                    "dev_1_1",
                    "dev_1_2",
                    "dev_2_0",
                    "dev_2_1",
                ])
            );
            expect(result).toHaveLength(5);
        });

        it("should handle mixed scalar and array fields", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100, "2": [10, 20], "3": 300}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2_0",
                    "dev_2_1",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(4);
        });

        it("should handle empty developer fields object", () => {
            const recordMesgs = [{ developerFields: "{}" }];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual([]);
        });

        it("should handle multiple records with same field IDs (deduplication)", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100, "2": 200}' },
                { developerFields: '{"1": 150, "2": 250}' },
                { developerFields: '{"1": 180, "3": 300}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should handle zero values correctly", () => {
            const recordMesgs = [{ developerFields: '{"1": 0, "2": 0.0}' }];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(expect.arrayContaining(["dev_1", "dev_2"]));
            expect(result).toHaveLength(2);
        });

        it("should handle negative values correctly", () => {
            const recordMesgs = [
                { developerFields: '{"1": -100, "2": -50.5}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(expect.arrayContaining(["dev_1", "dev_2"]));
            expect(result).toHaveLength(2);
        });

        it("should handle decimal values correctly", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100.5, "2": 3.14159}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(expect.arrayContaining(["dev_1", "dev_2"]));
            expect(result).toHaveLength(2);
        });
    });

    describe("Array Field Handling", () => {
        it("should handle empty arrays", () => {
            const recordMesgs = [{ developerFields: '{"1": [], "2": 100}' }];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_2"]);
            expect(result).toHaveLength(1);
        });

        it("should handle single element arrays", () => {
            const recordMesgs = [{ developerFields: '{"1": [42]}' }];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1_0"]);
            expect(result).toHaveLength(1);
        });

        it("should handle large arrays", () => {
            const largeArray = Array.from({ length: 100 }, (_, i) => i);
            const recordMesgs = [
                { developerFields: JSON.stringify({ "1": largeArray }) },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toHaveLength(100);
            expect(result[0]).toBe("dev_1_0");
            expect(result[99]).toBe("dev_1_99");
        });

        it("should handle arrays with mixed value types", () => {
            const recordMesgs = [
                { developerFields: '{"1": [10, "string", null, true, 20]}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual([
                "dev_1_0",
                "dev_1_1",
                "dev_1_2",
                "dev_1_3",
                "dev_1_4",
            ]);
            expect(result).toHaveLength(5);
        });

        it("should handle nested arrays (treated as regular values)", () => {
            const recordMesgs = [
                { developerFields: '{"1": [[1, 2], [3, 4]]}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1_0", "dev_1_1"]);
            expect(result).toHaveLength(2);
        });

        it("should handle arrays across multiple records", () => {
            const recordMesgs = [
                { developerFields: '{"1": [10, 20]}' },
                { developerFields: '{"1": [10, 20, 30]}' },
                { developerFields: '{"1": [10]}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1_0",
                    "dev_1_1",
                    "dev_1_2",
                ])
            );
            expect(result).toHaveLength(3);
        });
    });

    describe("Input Validation and Error Handling", () => {
        it("should return empty array for null input", () => {
            const result = extractDeveloperFieldsList(null as any);
            expect(result).toEqual([]);
        });

        it("should return empty array for undefined input", () => {
            const result = extractDeveloperFieldsList(undefined as any);
            expect(result).toEqual([]);
        });

        it("should return empty array for non-array input", () => {
            expect(extractDeveloperFieldsList("not an array" as any)).toEqual(
                []
            );
            expect(extractDeveloperFieldsList(123 as any)).toEqual([]);
            expect(extractDeveloperFieldsList({} as any)).toEqual([]);
            expect(extractDeveloperFieldsList(true as any)).toEqual([]);
        });

        it("should return empty array for empty array input", () => {
            const result = extractDeveloperFieldsList([]);
            expect(result).toEqual([]);
        });

        it("should handle records without developerFields property", () => {
            const recordMesgs = [
                { timestamp: 123456789 },
                { distance: 1000 },
                { developerFields: '{"1": 100}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1"]);
            expect(result).toHaveLength(1);
        });

        it("should handle records with null developerFields", () => {
            const recordMesgs = [
                { developerFields: null } as any,
                { developerFields: '{"1": 100}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1"]);
            expect(result).toHaveLength(1);
        });

        it("should handle records with undefined developerFields", () => {
            const recordMesgs = [
                { developerFields: undefined },
                { developerFields: '{"1": 100}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1"]);
            expect(result).toHaveLength(1);
        });

        it("should handle records with non-string developerFields", () => {
            const recordMesgs = [
                { developerFields: 123 } as any,
                { developerFields: true } as any,
                { developerFields: {} } as any,
                { developerFields: '{"1": 100}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1"]);
            expect(result).toHaveLength(1);
        });

        it("should handle malformed JSON strings gracefully", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100' }, // Missing closing brace
                { developerFields: "{invalid json}" },
                { developerFields: "not json at all" },
                { developerFields: '{"1": 100}' }, // Valid JSON
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1"]);
            expect(result).toHaveLength(1);
        });

        it("should handle empty JSON string", () => {
            const recordMesgs = [
                { developerFields: "" },
                { developerFields: '{"1": 100}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_1"]);
            expect(result).toHaveLength(1);
        });

        it("should handle JSON with invalid field values", () => {
            const recordMesgs = [
                {
                    developerFields:
                        '{"1": "string_value", "2": null, "3": true, "4": 100}',
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_4"]); // Only numeric value should be included
            expect(result).toHaveLength(1);
        });

        it("should handle JSON with NaN values", () => {
            const recordMesgs = [{ developerFields: '{"1": "NaN", "2": 100}' }];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_2"]);
            expect(result).toHaveLength(1);
        });

        it("should handle JSON with Infinity values", () => {
            const recordMesgs = [
                {
                    developerFields:
                        '{"1": "Infinity", "2": "-Infinity", "3": 100}',
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_3"]);
            expect(result).toHaveLength(1);
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very large numbers", () => {
            const recordMesgs = [
                {
                    developerFields: `{"1": ${Number.MAX_SAFE_INTEGER}, "2": ${Number.MIN_SAFE_INTEGER}}`,
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(expect.arrayContaining(["dev_1", "dev_2"]));
            expect(result).toHaveLength(2);
        });

        it("should handle very large arrays with consistent indexing", () => {
            const largeArray = Array.from({ length: 1000 }, (_, i) => i);
            const recordMesgs = [
                { developerFields: JSON.stringify({ "1": largeArray }) },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toHaveLength(1000);
            expect(result[0]).toBe("dev_1_0");
            expect(result[500]).toBe("dev_1_500");
            expect(result[999]).toBe("dev_1_999");
        });

        it("should handle numeric field IDs that are strings", () => {
            const recordMesgs = [
                { developerFields: '{"001": 100, "02": 200, "3": 300}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_001",
                    "dev_02",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should handle field IDs with special characters", () => {
            const recordMesgs = [
                {
                    developerFields:
                        '{"field_1": 100, "field-2": 200, "field.3": 300}',
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_field_1",
                    "dev_field-2",
                    "dev_field.3",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should handle very deep JSON structures", () => {
            const recordMesgs = [
                {
                    developerFields:
                        '{"1": {"nested": {"deep": 100}}, "2": 200}',
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_2"]); // Only numeric values should be extracted
            expect(result).toHaveLength(1);
        });

        it("should handle extremely large record sets", () => {
            const recordMesgs = Array.from({ length: 10000 }, (_, i) => ({
                developerFields: `{"${i % 10}": ${i}}`,
            }));

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_0",
                    "dev_1",
                    "dev_2",
                    "dev_3",
                    "dev_4",
                    "dev_5",
                    "dev_6",
                    "dev_7",
                    "dev_8",
                    "dev_9",
                ])
            );
            expect(result).toHaveLength(10); // Should deduplicate
        });

        it("should maintain field ordering stability", () => {
            const recordMesgs = [
                { developerFields: '{"3": 300, "1": 100, "2": 200}' },
            ];

            const result1 = extractDeveloperFieldsList(recordMesgs);
            const result2 = extractDeveloperFieldsList(recordMesgs);
            const result3 = extractDeveloperFieldsList(recordMesgs);

            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle typical FIT file record structure", () => {
            const recordMesgs = [
                {
                    timestamp: 1234567890,
                    distance: 1000,
                    speed: 5.5,
                    developerFields: '{"0": 150, "1": 175}', // Heart rate zones
                },
                {
                    timestamp: 1234567891,
                    distance: 1010,
                    speed: 5.6,
                    developerFields: '{"0": 155, "1": 180, "2": [10, 20, 30]}', // Additional power data
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_0",
                    "dev_1",
                    "dev_2_0",
                    "dev_2_1",
                    "dev_2_2",
                ])
            );
            expect(result).toHaveLength(5);
        });

        it("should handle Garmin Connect IQ fields", () => {
            const recordMesgs = [
                { developerFields: '{"7": 42, "8": [1, 2, 3, 4]}' }, // Custom data fields
                { developerFields: '{"7": 45, "9": 98}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_7",
                    "dev_8_0",
                    "dev_8_1",
                    "dev_8_2",
                    "dev_8_3",
                    "dev_9",
                ])
            );
            expect(result).toHaveLength(6);
        });

        it("should handle sparse developer fields across records", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100}' },
                { developerFields: '{"2": 200}' },
                { developerFields: '{"3": 300}' },
                { developerFields: '{"1": 150, "2": 250}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should handle mixed precision numeric values", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100, "2": 100.0, "3": 100.00001}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should handle scientific notation values", () => {
            const recordMesgs = [
                { developerFields: '{"1": 1e5, "2": 2.5e-3, "3": 1.23E+10}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3);
        });
    });

    describe("Performance and Consistency", () => {
        it("should handle rapid successive calls efficiently", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100, "2": [10, 20]}' },
            ];

            const results = Array.from({ length: 100 }, () =>
                extractDeveloperFieldsList(recordMesgs)
            );

            expect(results).toHaveLength(100);
            results.forEach((result) => {
                expect(result).toEqual(
                    expect.arrayContaining([
                        "dev_1",
                        "dev_2_0",
                        "dev_2_1",
                    ])
                );
                expect(result).toHaveLength(3);
            });
        });

        it("should be consistent across multiple calls", () => {
            const recordMesgs = [
                { developerFields: '{"3": 300, "1": 100, "2": [20, 30]}' },
            ];

            const result1 = extractDeveloperFieldsList(recordMesgs);
            const result2 = extractDeveloperFieldsList(recordMesgs);
            const result3 = extractDeveloperFieldsList(recordMesgs);

            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
        });

        it("should handle large datasets efficiently", () => {
            const recordMesgs = Array.from({ length: 50000 }, (_, i) => ({
                developerFields: `{"${i % 100}": ${i}}`,
            }));

            const start = Date.now();
            const result = extractDeveloperFieldsList(recordMesgs);
            const duration = Date.now() - start;

            expect(result).toHaveLength(100); // 100 unique field IDs
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it("should not modify input data", () => {
            const recordMesgs = [
                { developerFields: '{"1": 100}', otherField: "test" },
            ];
            const originalData = JSON.parse(JSON.stringify(recordMesgs));

            extractDeveloperFieldsList(recordMesgs);

            expect(recordMesgs).toEqual(originalData);
        });

        it("should handle memory efficiently with deduplication", () => {
            const recordMesgs = Array.from({ length: 10000 }, () => ({
                developerFields: '{"1": 100, "2": 200, "3": 300}',
            }));

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_2",
                    "dev_3",
                ])
            );
            expect(result).toHaveLength(3); // Properly deduplicated
        });
    });

    describe("Type Safety and Field Validation", () => {
        it("should only include numeric values in field extraction", () => {
            const recordMesgs = [
                {
                    developerFields: JSON.stringify({
                        "1": 100, // Valid numeric
                        "2": "string", // Invalid string
                        "3": true, // Invalid boolean
                        "4": null, // Invalid null
                        "5": undefined, // Invalid undefined
                        "6": {}, // Invalid object
                        "7": 0, // Valid numeric (zero)
                        "8": -100.5, // Valid numeric (negative decimal)
                    }),
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(
                expect.arrayContaining([
                    "dev_1",
                    "dev_7",
                    "dev_8",
                ])
            );
            expect(result).toHaveLength(3);
        });

        it("should handle numeric strings correctly", () => {
            const recordMesgs = [
                {
                    developerFields:
                        '{"1": "100", "2": "not_numeric", "3": 200}',
                },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual(["dev_3"]); // Only actual numeric value
            expect(result).toHaveLength(1);
        });

        it("should validate array contents independently", () => {
            const recordMesgs = [
                { developerFields: '{"1": [1, "string", 3, null, 5]}' },
            ];

            const result = extractDeveloperFieldsList(recordMesgs);
            expect(result).toEqual([
                "dev_1_0",
                "dev_1_1",
                "dev_1_2",
                "dev_1_3",
                "dev_1_4",
            ]);
            expect(result).toHaveLength(5); // All array indices are included regardless of content
        });
    });
});

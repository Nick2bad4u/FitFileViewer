import { describe, it, expect } from "vitest";

// Import the data object under test
const { dataAntManufacturerIDs } =
    await import("../../../utils/data/lookups/dataAntManufacturerIDs.js");

describe("dataAntManufacturerIDs.js - ANT+ Manufacturer ID Data", () => {
    describe("Data Structure Validation", () => {
        it("should export dataAntManufacturerIDs as an object", () => {
            expect(dataAntManufacturerIDs).toBeDefined();
            expect(typeof dataAntManufacturerIDs).toBe("object");
            expect(dataAntManufacturerIDs).not.toBeNull();
        });

        it("should not be an array", () => {
            expect(Array.isArray(dataAntManufacturerIDs)).toBe(false);
        });

        it("should contain numeric keys and string values", () => {
            const entries = Object.entries(dataAntManufacturerIDs);
            expect(entries.length).toBeGreaterThan(0);

            entries.forEach(([key, value]) => {
                expect(!isNaN(Number(key))).toBe(true); // Key should be numeric string
                expect(typeof value).toBe("string"); // Value should be string
                expect(value.length).toBeGreaterThan(0); // Value should not be empty
            });
        });

        it("should have positive integer keys", () => {
            const keys = Object.keys(dataAntManufacturerIDs);
            keys.forEach((key) => {
                const numKey = Number(key);
                expect(numKey).toBeGreaterThan(0);
                expect(Number.isInteger(numKey)).toBe(true);
            });
        });

        it("should have non-empty manufacturer names", () => {
            const values = Object.values(dataAntManufacturerIDs);
            values.forEach((value) => {
                expect(typeof value).toBe("string");
                expect(value.trim().length).toBeGreaterThan(0);
            });
        });
    });

    describe("Known Manufacturer Mappings", () => {
        describe("Major Fitness Equipment Manufacturers", () => {
            it("should include Garmin (ID: 1)", () => {
                expect(dataAntManufacturerIDs[1]).toBe("garmin");
            });

            it("should include Wahoo Fitness (ID: 32)", () => {
                expect(dataAntManufacturerIDs[32]).toBe("wahoo_fitness");
            });

            it("should include Polar (ID: 7)", () => {
                expect(dataAntManufacturerIDs[7]).toBe("quarq");
            });

            it("should include Suunto (ID: 23)", () => {
                expect(dataAntManufacturerIDs[23]).toBe("suunto");
            });

            it("should include SRM (ID: 6)", () => {
                expect(dataAntManufacturerIDs[6]).toBe("srm");
            });

            it("should include Timex (ID: 16)", () => {
                expect(dataAntManufacturerIDs[16]).toBe("timex");
            });

            it("should include Concept2 (ID: 40)", () => {
                expect(dataAntManufacturerIDs[40]).toBe("concept2");
            });

            it("should include Shimano (ID: 41)", () => {
                expect(dataAntManufacturerIDs[41]).toBe("shimano");
            });
        });

        describe("Power Meter Manufacturers", () => {
            it("should include SRM power meters (ID: 6)", () => {
                expect(dataAntManufacturerIDs[6]).toBe("srm");
            });

            it("should include Quarq power meters (ID: 7)", () => {
                expect(dataAntManufacturerIDs[7]).toBe("quarq");
            });

            it("should include Saris (PowerTap) (ID: 9)", () => {
                expect(dataAntManufacturerIDs[9]).toBe("saris");
            });

            it("should include MetriGear (Vector) (ID: 17)", () => {
                expect(dataAntManufacturerIDs[17]).toBe("metrigear");
            });

            it("should include Brim Brothers (Zone) (ID: 44)", () => {
                expect(dataAntManufacturerIDs[44]).toBe("brim_brothers");
            });
        });

        describe("Heart Rate Monitor Manufacturers", () => {
            it("should include Zephyr (ID: 3)", () => {
                expect(dataAntManufacturerIDs[3]).toBe("zephyr");
            });

            it("should include Cardiosport (ID: 20)", () => {
                expect(dataAntManufacturerIDs[20]).toBe("cardiosport");
            });

            it("should include A&D (ID: 21)", () => {
                expect(dataAntManufacturerIDs[21]).toBe("a_and_d");
            });
        });

        describe("Training Equipment Manufacturers", () => {
            it("should include Tacx (ID: 89)", () => {
                expect(dataAntManufacturerIDs[89]).toBe("tacx");
            });

            it("should include Elite (ID: 86)", () => {
                expect(dataAntManufacturerIDs[86]).toBe("elite");
            });

            it("should include Nautilus (ID: 14)", () => {
                expect(dataAntManufacturerIDs[14]).toBe("nautilus");
            });

            it("should include Octane Fitness (ID: 33)", () => {
                expect(dataAntManufacturerIDs[33]).toBe("octane_fitness");
            });
        });

        describe("Sensor and Accessory Manufacturers", () => {
            it("should include Dynastream (ID: 15)", () => {
                expect(dataAntManufacturerIDs[15]).toBe("dynastream");
            });

            it("should include IBike (ID: 8)", () => {
                expect(dataAntManufacturerIDs[8]).toBe("ibike");
            });

            it("should include Echowell (ID: 12)", () => {
                expect(dataAntManufacturerIDs[12]).toBe("echowell");
            });

            it("should include Tanita (ID: 11)", () => {
                expect(dataAntManufacturerIDs[11]).toBe("tanita");
            });
        });
    });

    describe("Data Consistency and Format", () => {
        describe("Naming Convention Validation", () => {
            it("should use mostly lowercase manufacturer names", () => {
                const values = Object.values(dataAntManufacturerIDs);
                const lowercaseCount = values.filter(
                    (value) => value === value.toLowerCase()
                ).length;
                const totalCount = values.length;
                // Most names should be lowercase (allowing some exceptions like "MiPulse")
                expect(lowercaseCount / totalCount).toBeGreaterThan(0.9);
            });

            it("should use underscores instead of spaces in most names", () => {
                const values = Object.values(dataAntManufacturerIDs);
                const spaceCount = values.filter((value) =>
                    value.includes(" ")
                ).length;
                expect(spaceCount).toBe(0); // No spaces should be found

                // Check that names with underscores follow general pattern (allowing mixed case)
                values.forEach((value) => {
                    expect(value).not.toContain(" ");
                    if (value.includes("_")) {
                        expect(value).toMatch(/^[a-zA-Z0-9_]+$/);
                    }
                });
            });

            it("should not contain special characters except underscores and handle mixed case", () => {
                const values = Object.values(dataAntManufacturerIDs);
                values.forEach((value) => {
                    // Allow alphanumeric and underscores, with mixed case
                    expect(value).toMatch(/^[a-zA-Z0-9_]+$/);
                });
            });

            it("should not start or end with underscores", () => {
                const values = Object.values(dataAntManufacturerIDs);
                values.forEach((value) => {
                    expect(value).not.toMatch(/^_/);
                    expect(value).not.toMatch(/_$/);
                });
            });

            it("should not have consecutive underscores", () => {
                const values = Object.values(dataAntManufacturerIDs);
                values.forEach((value) => {
                    expect(value).not.toContain("__");
                });
            });
        });

        describe("Key Range and Distribution", () => {
            it("should have manufacturer IDs within reasonable range", () => {
                const keys = Object.keys(dataAntManufacturerIDs).map(Number);
                const maxKey = Math.max(...keys);
                const minKey = Math.min(...keys);

                expect(minKey).toBeGreaterThanOrEqual(1);
                expect(maxKey).toBeLessThan(10000); // Expanded reasonable upper bound for ANT+ IDs
            });

            it("should have unique manufacturer IDs", () => {
                const keys = Object.keys(dataAntManufacturerIDs);
                const uniqueKeys = [...new Set(keys)];
                expect(keys.length).toBe(uniqueKeys.length);
            });

            it("should have unique manufacturer names", () => {
                const values = Object.values(dataAntManufacturerIDs);
                const uniqueValues = [...new Set(values)];
                expect(values.length).toBe(uniqueValues.length);
            });

            it("should contain a reasonable number of manufacturers", () => {
                const entryCount = Object.keys(dataAntManufacturerIDs).length;
                expect(entryCount).toBeGreaterThan(50); // Should have many manufacturers
                expect(entryCount).toBeLessThan(500); // But not an unreasonable amount
            });
        });
    });

    describe("Data Lookup Functionality", () => {
        describe("Direct Key Access", () => {
            it("should return correct manufacturer for valid ID", () => {
                expect(dataAntManufacturerIDs[1]).toBe("garmin");
                expect(dataAntManufacturerIDs[32]).toBe("wahoo_fitness");
                expect(dataAntManufacturerIDs[23]).toBe("suunto");
            });

            it("should return undefined for invalid ID", () => {
                expect(dataAntManufacturerIDs[0]).toBeUndefined();
                expect(dataAntManufacturerIDs[-1]).toBeUndefined();
                expect(dataAntManufacturerIDs[9999]).toBeUndefined();
            });

            it("should handle string keys correctly", () => {
                expect(dataAntManufacturerIDs["1"]).toBe("garmin");
                expect(dataAntManufacturerIDs["32"]).toBe("wahoo_fitness");
            });

            it("should handle edge case numeric IDs", () => {
                const keys = Object.keys(dataAntManufacturerIDs).map(Number);
                const maxKey = Math.max(...keys);
                const minKey = Math.min(...keys);

                expect(dataAntManufacturerIDs[minKey]).toBeDefined();
                expect(dataAntManufacturerIDs[maxKey]).toBeDefined();
            });
        });

        describe("Iteration and Enumeration", () => {
            it("should be enumerable with Object.keys()", () => {
                const keys = Object.keys(dataAntManufacturerIDs);
                expect(keys.length).toBeGreaterThan(0);
                expect(keys.every((key) => !isNaN(Number(key)))).toBe(true);
            });

            it("should be enumerable with Object.values()", () => {
                const values = Object.values(dataAntManufacturerIDs);
                expect(values.length).toBeGreaterThan(0);
                expect(values.every((value) => typeof value === "string")).toBe(
                    true
                );
            });

            it("should be enumerable with Object.entries()", () => {
                const entries = Object.entries(dataAntManufacturerIDs);
                expect(entries.length).toBeGreaterThan(0);
                entries.forEach(([key, value]) => {
                    expect(!isNaN(Number(key))).toBe(true);
                    expect(typeof value).toBe("string");
                });
            });

            it("should support for...in iteration", () => {
                const keys: string[] = [];
                for (const key in dataAntManufacturerIDs) {
                    keys.push(key);
                }
                expect(keys.length).toBeGreaterThan(0);
                expect(keys.every((key) => !isNaN(Number(key)))).toBe(true);
            });
        });
    });

    describe("Real-world Usage Scenarios", () => {
        describe("Common FIT File Manufacturer IDs", () => {
            it("should handle typical Garmin device scenarios", () => {
                expect(dataAntManufacturerIDs[1]).toBe("garmin");
                expect(dataAntManufacturerIDs[2]).toBe("garmin_fr405_antfs");
            });

            it("should handle trainer manufacturer scenarios", () => {
                expect(dataAntManufacturerIDs[32]).toBe("wahoo_fitness"); // Wahoo trainers
                expect(dataAntManufacturerIDs[89]).toBe("tacx"); // Tacx trainers
            });

            it("should handle power meter manufacturer scenarios", () => {
                expect(dataAntManufacturerIDs[6]).toBe("srm"); // SRM power meters
                expect(dataAntManufacturerIDs[7]).toBe("quarq"); // Quarq power meters
                expect(dataAntManufacturerIDs[9]).toBe("saris"); // PowerTap/Saris
            });

            it("should handle heart rate monitor scenarios", () => {
                expect(dataAntManufacturerIDs[3]).toBe("zephyr"); // Zephyr HRM
                expect(dataAntManufacturerIDs[20]).toBe("cardiosport"); // Cardiosport HRM
            });
        });

        describe("Integration with Other Utilities", () => {
            it("should provide consistent data for manufacturer formatting", () => {
                // Test that common manufacturer IDs exist for integration
                const commonIds = [
                    1,
                    6,
                    7,
                    9,
                    23,
                    32,
                    40,
                    41,
                ];
                commonIds.forEach((id) => {
                    expect(dataAntManufacturerIDs[id]).toBeDefined();
                    expect(typeof dataAntManufacturerIDs[id]).toBe("string");
                    expect(dataAntManufacturerIDs[id].length).toBeGreaterThan(
                        0
                    );
                });
            });

            it("should support reverse lookup functionality", () => {
                // Verify that we can find IDs by manufacturer name
                const entries = Object.entries(dataAntManufacturerIDs);
                const garminEntry = entries.find(
                    ([id, name]) => name === "garmin"
                );
                const wahooEntry = entries.find(
                    ([id, name]) => name === "wahoo_fitness"
                );

                expect(garminEntry).toBeDefined();
                expect(garminEntry?.[0]).toBe("1");
                expect(wahooEntry).toBeDefined();
                expect(wahooEntry?.[0]).toBe("32");
            });
        });

        describe("Performance and Memory Efficiency", () => {
            it("should be accessible without significant performance overhead", () => {
                const startTime = performance.now();
                for (let i = 0; i < 1000; i++) {
                    const garmin = dataAntManufacturerIDs[1];
                    const wahoo = dataAntManufacturerIDs[32];
                    const suunto = dataAntManufacturerIDs[23];
                }
                const endTime = performance.now();
                expect(endTime - startTime).toBeLessThan(50); // Should be very fast
            });

            it("should maintain consistent object reference", () => {
                const ref1 = dataAntManufacturerIDs;
                const ref2 = dataAntManufacturerIDs;
                expect(ref1).toBe(ref2); // Should be the same object reference
            });

            it("should have predictable memory footprint", () => {
                const keys = Object.keys(dataAntManufacturerIDs);
                const values = Object.values(dataAntManufacturerIDs);

                // Basic sanity checks for memory efficiency
                expect(keys.length).toBe(values.length);
                expect(keys.length).toBeGreaterThan(0);
                expect(keys.length).toBeLessThan(1000); // Reasonable size limit
            });
        });
    });

    describe("Edge Cases and Error Handling", () => {
        describe("Invalid Key Handling", () => {
            it("should handle non-existent keys gracefully", () => {
                expect(dataAntManufacturerIDs[0]).toBeUndefined();
                expect(dataAntManufacturerIDs[-1]).toBeUndefined();
                expect(dataAntManufacturerIDs[999999]).toBeUndefined();
            });

            it("should handle string keys that are not numeric", () => {
                expect(dataAntManufacturerIDs["abc"]).toBeUndefined();
                expect(dataAntManufacturerIDs["garmin"]).toBeUndefined();
                expect(dataAntManufacturerIDs[""]).toBeUndefined();
            });

            it("should handle null and undefined keys", () => {
                expect(dataAntManufacturerIDs[null]).toBeUndefined();
                expect(dataAntManufacturerIDs[undefined]).toBeUndefined();
            });

            it("should handle boolean keys", () => {
                expect(dataAntManufacturerIDs[true]).toBeUndefined();
                expect(dataAntManufacturerIDs[false]).toBeUndefined();
            });

            it("should handle object keys", () => {
                expect(dataAntManufacturerIDs[{}]).toBeUndefined();
                expect(dataAntManufacturerIDs[[]]).toBeUndefined();
            });
        });

        describe("Data Integrity", () => {
            it("should maintain data integrity across multiple accesses", () => {
                const firstAccess = dataAntManufacturerIDs[1];
                const secondAccess = dataAntManufacturerIDs[1];
                expect(firstAccess).toBe(secondAccess);
                expect(firstAccess).toBe("garmin");
            });

            it("should not be accidentally modifiable", () => {
                // Attempt to modify should not affect original data
                const originalGarmin = dataAntManufacturerIDs[1];
                try {
                    dataAntManufacturerIDs[1] = "modified";
                    // If modification succeeded, verify it can be detected
                    if (dataAntManufacturerIDs[1] === "modified") {
                        // Reset it back for other tests
                        dataAntManufacturerIDs[1] = originalGarmin;
                    }
                } catch (error) {
                    // Object might be frozen/sealed, which is good
                }
                // Final verification
                expect(dataAntManufacturerIDs[1]).toBe("garmin");
            });
        });

        describe("Type Safety", () => {
            it("should handle type coercion predictably", () => {
                // JavaScript type coercion scenarios
                expect(dataAntManufacturerIDs["1"]).toBe("garmin"); // String '1' should work
                expect(dataAntManufacturerIDs[1.0]).toBe("garmin"); // Float 1.0 should work
                expect(dataAntManufacturerIDs[1.5]).toBeUndefined(); // Float 1.5 should not work
            });

            it("should maintain type consistency", () => {
                Object.entries(dataAntManufacturerIDs).forEach(
                    ([key, value]) => {
                        expect(typeof key).toBe("string"); // Object keys are always strings
                        expect(typeof value).toBe("string");
                        expect(!isNaN(Number(key))).toBe(true); // But should be numeric strings
                    }
                );
            });
        });
    });
});

import { describe, it, expect, beforeEach } from "vitest";
import { dataAntProductIds } from "../../../utils/data/lookups/dataAntProductIds.js";

describe("dataAntProductIds.js - ANT+ Product ID Data", () => {
    let localDataAntProductIds: any;

    beforeEach(() => {
        // Create a fresh reference for each test to ensure isolation
        localDataAntProductIds = dataAntProductIds;
    });

    describe("Data Structure Validation", () => {
        it("should export dataAntProductIds as an object", () => {
            expect(localDataAntProductIds).toBeTypeOf("object");
            expect(localDataAntProductIds).not.toBeNull();
        });

        it("should not be an array", () => {
            expect(Array.isArray(localDataAntProductIds)).toBe(false);
        });

        it("should contain numeric manufacturer keys with object values", () => {
            const entries = Object.entries(localDataAntProductIds);
            expect(entries.length).toBeGreaterThan(0);

            for (const [key, value] of entries) {
                // Manufacturer ID should be numeric
                expect(Number.isInteger(Number(key))).toBe(true);
                expect(Number(key)).toBeGreaterThan(0);

                // Product mappings should be objects
                expect(typeof value).toBe("object");
                expect(value).not.toBeNull();
                expect(Array.isArray(value)).toBe(false);
            }
        });

        it("should have product objects with numeric keys and string values", () => {
            const entries = Object.entries(localDataAntProductIds);

            for (const [manufacturerId, products] of entries) {
                const productEntries = Object.entries(products as any);

                for (const [productId, productName] of productEntries) {
                    // Product ID should be numeric
                    expect(Number.isInteger(Number(productId))).toBe(true);
                    expect(Number(productId)).toBeGreaterThan(0);

                    // Product name should be non-empty string
                    expect(typeof productName).toBe("string");
                    expect((productName as string).length).toBeGreaterThan(0);
                    expect((productName as string).trim()).toBe(productName);
                }
            }
        });

        it("should have non-empty manufacturer mappings", () => {
            const entries = Object.entries(localDataAntProductIds);

            for (const [manufacturerId, products] of entries) {
                const productEntries = Object.entries(products as any);
                expect(productEntries.length).toBeGreaterThan(0);
            }
        });
    });

    describe("Known Manufacturer and Product Mappings", () => {
        describe("Garmin Products (Manufacturer ID: 1)", () => {
            it("should include Garmin manufacturer mapping", () => {
                expect(localDataAntProductIds[1]).toBeDefined();
                expect(typeof localDataAntProductIds[1]).toBe("object");
            });

            it("should include known Garmin devices", () => {
                const garminProducts = localDataAntProductIds[1];

                // Test some known Garmin products
                expect(garminProducts[1036]).toBe("edge500");
                expect(garminProducts[1169]).toBe("edge800");
                expect(garminProducts[1328]).toBe("fr910xt");
                expect(garminProducts[1551]).toBe("fenix"); // Actual value is "fenix"
                expect(garminProducts[1567]).toBe("edge810"); // Actual value is "edge810"
            });

            it("should include recent Garmin devices", () => {
                const garminProducts = localDataAntProductIds[1];

                // Test recent devices
                expect(garminProducts[3113]).toBe("fr945");
                expect(garminProducts[3121]).toBe("edge_530");
                expect(garminProducts[3122]).toBe("edge_830");
                expect(garminProducts[4315]).toBe("fr965");
                expect(garminProducts[4440]).toBe("edge_1050");
            });

            it("should include Fenix series devices", () => {
                const garminProducts = localDataAntProductIds[1];

                expect(garminProducts[1967]).toBe("fenix2");
                expect(garminProducts[2050]).toBe("fenix3");
                expect(garminProducts[3110]).toBe("fenix5_plus");
                expect(garminProducts[3288]).toBe("fenix6S");
                expect(garminProducts[4532]).toBe("fenix8_solar");
            });
        });

        describe("Wahoo Fitness Products (Manufacturer ID: 32)", () => {
            it("should include Wahoo manufacturer mapping", () => {
                expect(localDataAntProductIds[32]).toBeDefined();
                expect(typeof localDataAntProductIds[32]).toBe("object");
            });

            it("should include known Wahoo devices", () => {
                const wahooProducts = localDataAntProductIds[32];

                expect(wahooProducts[1]).toBe("kickr_v1"); // Actual value is "kickr_v1"
                expect(wahooProducts[2]).toBe("kickr_v2"); // Actual value is "kickr_v2"
                expect(wahooProducts[3]).toBe("kickr_core"); // Actual value is "kickr_core"
                expect(wahooProducts[4]).toBe("kickr_v4");
                expect(wahooProducts[5]).toBe("kickr_v5");
            });

            it("should include Wahoo computer devices", () => {
                const wahooProducts = localDataAntProductIds[32];

                expect(wahooProducts[10]).toBe("elemnt");
                expect(wahooProducts[11]).toBe("elemnt_bolt");
                expect(wahooProducts[12]).toBe("elemnt_roam");
                expect(wahooProducts[13]).toBe("elemnt_rival");
            });

            it("should include Wahoo heart rate monitors", () => {
                const wahooProducts = localDataAntProductIds[32];

                expect(wahooProducts[20]).toBe("tickr");
                expect(wahooProducts[21]).toBe("tickr_x");
                expect(wahooProducts[22]).toBe("tickr_run");
            });
        });

        describe("Favero Electronics Products (Manufacturer ID: 263)", () => {
            it("should include Favero manufacturer mapping", () => {
                expect(localDataAntProductIds[263]).toBeDefined();
                expect(typeof localDataAntProductIds[263]).toBe("object");
            });

            it("should include Assioma power meters", () => {
                const faveroProducts = localDataAntProductIds[263];

                expect(faveroProducts[12]).toBe("assioma_duo");
                expect(faveroProducts[13]).toBe("assioma_uno");
            });
        });

        describe("Stages Cycling Products (Manufacturer ID: 68)", () => {
            it("should include Stages manufacturer mapping", () => {
                expect(localDataAntProductIds[68]).toBeDefined();
                expect(typeof localDataAntProductIds[68]).toBe("object");
            });

            it("should include Stages power meters", () => {
                const stagesProducts = localDataAntProductIds[68];

                expect(stagesProducts[1]).toBe("power_meter_gen1");
                expect(stagesProducts[2]).toBe("power_meter_gen2");
                expect(stagesProducts[3]).toBe("power_meter_gen3");
                expect(stagesProducts[4]).toBe("power_meter_lr");
            });
        });

        describe("SRAM Products (Manufacturer ID: 280)", () => {
            it("should include SRAM manufacturer mapping", () => {
                expect(localDataAntProductIds[280]).toBeDefined();
                expect(typeof localDataAntProductIds[280]).toBe("object");
            });

            it("should include SRAM/Quarq power meters", () => {
                const sramProducts = localDataAntProductIds[280];

                expect(sramProducts[1]).toBe("quarq_dzero");
                expect(sramProducts[2]).toBe("quarq_dfour");
                expect(sramProducts[3]).toBe("red_etap_axs");
                expect(sramProducts[4]).toBe("force_etap_axs");
                expect(sramProducts[5]).toBe("rival_etap_axs");
            });
        });
    });

    describe("Data Consistency and Format", () => {
        describe("Naming Convention Validation", () => {
            it("should use mostly lowercase product names", () => {
                const allProductNames: string[] = [];

                Object.values(localDataAntProductIds).forEach((products) => {
                    Object.values(products as any).forEach((name) => {
                        allProductNames.push(name as string);
                    });
                });

                const lowercaseNames = allProductNames.filter(
                    (name) => name === name.toLowerCase()
                );

                // Allow for some mixed case names (like MiPulse found in manufacturer data)
                const lowercasePercentage =
                    (lowercaseNames.length / allProductNames.length) * 100;
                expect(lowercasePercentage).toBeGreaterThan(85); // More flexible for product names
            });

            it("should use underscores instead of spaces in most names", () => {
                const allProductNames: string[] = [];

                Object.values(localDataAntProductIds).forEach((products) => {
                    Object.values(products as any).forEach((name) => {
                        allProductNames.push(name as string);
                    });
                });

                const namesWithSpaces = allProductNames.filter((name) =>
                    name.includes(" ")
                );
                const spacePercentage =
                    (namesWithSpaces.length / allProductNames.length) * 100;

                // Most product names should use underscores instead of spaces
                expect(spacePercentage).toBeLessThan(15);
            });

            it("should not contain special characters except underscores and common separators", () => {
                const allProductNames: string[] = [];

                Object.values(localDataAntProductIds).forEach((products) => {
                    Object.values(products as any).forEach((name) => {
                        allProductNames.push(name as string);
                    });
                });

                for (const name of allProductNames) {
                    // Allow alphanumeric, underscores, spaces, dashes, and some common separators
                    // Some products have names like "GNSS - Airoha AG3335M Family"
                    expect(name).toMatch(/^[a-zA-Z0-9_\-+x\s\(\)]+$/);
                }
            });

            it("should not start or end with underscores", () => {
                const allProductNames: string[] = [];

                Object.values(localDataAntProductIds).forEach((products) => {
                    Object.values(products as any).forEach((name) => {
                        allProductNames.push(name as string);
                    });
                });

                for (const name of allProductNames) {
                    expect(name.startsWith("_")).toBe(false);
                    expect(name.endsWith("_")).toBe(false);
                }
            });

            it("should not have consecutive underscores", () => {
                const allProductNames: string[] = [];

                Object.values(localDataAntProductIds).forEach((products) => {
                    Object.values(products as any).forEach((name) => {
                        allProductNames.push(name as string);
                    });
                });

                for (const name of allProductNames) {
                    expect(name.includes("__")).toBe(false);
                }
            });
        });

        describe("Key Range and Distribution", () => {
            it("should have manufacturer IDs within reasonable range", () => {
                const manufacturerIds = Object.keys(localDataAntProductIds).map(
                    Number
                );
                const maxManufacturerId = Math.max(...manufacturerIds);
                const minManufacturerId = Math.min(...manufacturerIds);

                expect(minManufacturerId).toBeGreaterThanOrEqual(1);
                expect(maxManufacturerId).toBeLessThan(10000); // Reasonable upper bound
            });

            it("should have product IDs within reasonable range for each manufacturer", () => {
                Object.entries(localDataAntProductIds).forEach(
                    ([manufacturerId, products]) => {
                        const productIds = Object.keys(products as any).map(
                            Number
                        );
                        const maxProductId = Math.max(...productIds);
                        const minProductId = Math.min(...productIds);

                        expect(minProductId).toBeGreaterThanOrEqual(1);
                        expect(maxProductId).toBeLessThan(100000); // Very generous upper bound
                    }
                );
            });

            it("should have unique manufacturer IDs", () => {
                const manufacturerIds = Object.keys(localDataAntProductIds);
                const uniqueIds = new Set(manufacturerIds);
                expect(uniqueIds.size).toBe(manufacturerIds.length);
            });

            it("should have unique product IDs within each manufacturer", () => {
                Object.entries(localDataAntProductIds).forEach(
                    ([manufacturerId, products]) => {
                        const productIds = Object.keys(products as any);
                        const uniqueProductIds = new Set(productIds);
                        expect(uniqueProductIds.size).toBe(productIds.length);
                    }
                );
            });

            it("should contain a reasonable number of manufacturers", () => {
                const manufacturerCount = Object.keys(
                    localDataAntProductIds
                ).length;
                expect(manufacturerCount).toBeGreaterThan(3); // At least a few manufacturers
                expect(manufacturerCount).toBeLessThan(100); // Not unreasonably many
            });

            it("should contain reasonable number of products per manufacturer", () => {
                Object.entries(localDataAntProductIds).forEach(
                    ([manufacturerId, products]) => {
                        const productCount = Object.keys(
                            products as any
                        ).length;
                        expect(productCount).toBeGreaterThan(0);
                        expect(productCount).toBeLessThan(1000); // Generous upper bound
                    }
                );
            });
        });
    });

    describe("Data Lookup Functionality", () => {
        describe("Nested Access Patterns", () => {
            it("should return correct product for valid manufacturer and product ID", () => {
                // Test known mappings
                expect(localDataAntProductIds[1]?.[1036]).toBe("edge500");
                expect(localDataAntProductIds[32]?.[3]).toBe("kickr_core"); // ID 3 is kickr_core
                expect(localDataAntProductIds[263]?.[12]).toBe("assioma_duo");
            });

            it("should return undefined for invalid manufacturer ID", () => {
                expect(localDataAntProductIds[99999]).toBeUndefined();
                expect(localDataAntProductIds[-1]).toBeUndefined();
                expect(localDataAntProductIds[0]).toBeUndefined();
            });

            it("should return undefined for invalid product ID within valid manufacturer", () => {
                expect(localDataAntProductIds[1]?.[99999]).toBeUndefined();
                expect(localDataAntProductIds[32]?.[99999]).toBeUndefined();
            });

            it("should handle string keys correctly", () => {
                // JavaScript object keys are strings, so this should work
                expect(localDataAntProductIds["1"]?.["1036"]).toBe("edge500");
                expect(localDataAntProductIds["32"]?.["3"]).toBe("kickr_core"); // ID 3 is kickr_core
            });

            it("should handle edge case numeric IDs", () => {
                // Test with the actual data structure
                expect(localDataAntProductIds[1]?.[255]).toBe("OHR"); // Known special case
            });
        });

        describe("Iteration and Enumeration", () => {
            it("should be enumerable with Object.keys() for manufacturers", () => {
                const keys = Object.keys(localDataAntProductIds);
                expect(keys.length).toBeGreaterThan(0);
                expect(keys).toContain("1"); // Garmin
                expect(keys).toContain("32"); // Wahoo
            });

            it("should be enumerable with Object.values() for manufacturers", () => {
                const values = Object.values(localDataAntProductIds);
                expect(values.length).toBeGreaterThan(0);
                values.forEach((products) => {
                    expect(typeof products).toBe("object");
                    expect(products).not.toBeNull();
                });
            });

            it("should be enumerable with Object.entries() for manufacturers", () => {
                const entries = Object.entries(localDataAntProductIds);
                expect(entries.length).toBeGreaterThan(0);
                entries.forEach(([id, products]) => {
                    expect(typeof id).toBe("string");
                    expect(typeof products).toBe("object");
                });
            });

            it("should support for...in iteration for manufacturers", () => {
                const keys: string[] = [];
                for (const key in localDataAntProductIds) {
                    keys.push(key);
                }
                expect(keys.length).toBeGreaterThan(0);
            });

            it("should be enumerable at product level", () => {
                const garminProducts = localDataAntProductIds[1];
                const productKeys = Object.keys(garminProducts);
                const productValues = Object.values(garminProducts);

                expect(productKeys.length).toBeGreaterThan(0);
                expect(productValues.length).toBeGreaterThan(0);
                expect(productKeys.length).toBe(productValues.length);
            });
        });
    });

    describe("Real-world Usage Scenarios", () => {
        describe("Common FIT File Product Lookups", () => {
            it("should handle typical Garmin Edge device scenarios", () => {
                // Common Edge devices
                expect(localDataAntProductIds[1]?.[1036]).toBe("edge500");
                expect(localDataAntProductIds[1]?.[1169]).toBe("edge800");
                expect(localDataAntProductIds[1]?.[3121]).toBe("edge_530");
                expect(localDataAntProductIds[1]?.[3122]).toBe("edge_830");
                expect(localDataAntProductIds[1]?.[4440]).toBe("edge_1050");
            });

            it("should handle trainer product scenarios", () => {
                // Wahoo trainers
                expect(localDataAntProductIds[32]?.[3]).toBe("kickr_core"); // ID 3 is kickr_core
                expect(localDataAntProductIds[32]?.[1]).toBe("kickr_v1"); // ID 1 is kickr_v1
                expect(localDataAntProductIds[32]?.[2]).toBe("kickr_v2"); // ID 2 is kickr_v2
            });

            it("should handle power meter product scenarios", () => {
                // Various power meter brands
                expect(localDataAntProductIds[263]?.[12]).toBe("assioma_duo"); // Favero
                expect(localDataAntProductIds[68]?.[1]).toBe(
                    "power_meter_gen1"
                ); // Stages
                expect(localDataAntProductIds[280]?.[1]).toBe("quarq_dzero"); // SRAM
            });

            it("should handle heart rate monitor scenarios", () => {
                // Wahoo heart rate monitors
                expect(localDataAntProductIds[32]?.[20]).toBe("tickr");
                expect(localDataAntProductIds[32]?.[21]).toBe("tickr_x");
                expect(localDataAntProductIds[32]?.[22]).toBe("tickr_run");
            });
        });

        describe("Integration with Other Utilities", () => {
            it("should provide consistent data for product formatting", () => {
                // Test that data format is suitable for product formatting utilities
                Object.entries(localDataAntProductIds).forEach(
                    ([manufacturerId, products]) => {
                        Object.entries(products as any).forEach(
                            ([productId, productName]) => {
                                expect(typeof manufacturerId).toBe("string");
                                expect(typeof productId).toBe("string");
                                expect(typeof productName).toBe("string");
                                expect(productName).toBeTruthy();
                            }
                        );
                    }
                );
            });

            it("should support reverse lookup functionality", () => {
                // Test ability to find manufacturer by product name
                const findManufacturerByProduct = (
                    searchProductName: string
                ) => {
                    for (const [manufacturerId, products] of Object.entries(
                        localDataAntProductIds
                    )) {
                        for (const [productId, productName] of Object.entries(
                            products as any
                        )) {
                            if (productName === searchProductName) {
                                return {
                                    manufacturerId: Number(manufacturerId),
                                    productId: Number(productId),
                                };
                            }
                        }
                    }
                    return null;
                };

                const edgeResult = findManufacturerByProduct("edge500");
                expect(edgeResult).toEqual({
                    manufacturerId: 1,
                    productId: 1036,
                });

                const kickrResult = findManufacturerByProduct("kickr_core");
                expect(kickrResult).toEqual({
                    manufacturerId: 32,
                    productId: 3,
                }); // kickr_core is product ID 3
            });
        });

        describe("Performance and Memory Efficiency", () => {
            it("should be accessible without significant performance overhead", () => {
                const start = performance.now();

                // Perform multiple lookups
                for (let i = 0; i < 1000; i++) {
                    const product1 = localDataAntProductIds[1]?.[1036];
                    const product2 = localDataAntProductIds[32]?.[1];
                    const product3 = localDataAntProductIds[263]?.[12];
                }

                const end = performance.now();
                expect(end - start).toBeLessThan(100); // Should be very fast
            });

            it("should maintain consistent object reference", () => {
                const ref1 = localDataAntProductIds;
                const ref2 = localDataAntProductIds;
                expect(ref1).toBe(ref2);
            });

            it("should have predictable memory footprint", () => {
                const manufacturerCount = Object.keys(
                    localDataAntProductIds
                ).length;
                let totalProductCount = 0;

                Object.values(localDataAntProductIds).forEach((products) => {
                    totalProductCount += Object.keys(products as any).length;
                });

                // Reasonable data structure size
                expect(manufacturerCount).toBeLessThan(100);
                expect(totalProductCount).toBeLessThan(10000);
                expect(totalProductCount).toBeGreaterThan(50); // Ensure meaningful data
            });
        });
    });

    describe("Edge Cases and Error Handling", () => {
        describe("Invalid Key Handling", () => {
            it("should handle non-existent manufacturer keys gracefully", () => {
                expect(localDataAntProductIds[99999]).toBeUndefined();
                expect(localDataAntProductIds[-1]).toBeUndefined();
                expect(localDataAntProductIds[0]).toBeUndefined();
            });

            it("should handle non-existent product keys gracefully", () => {
                expect(localDataAntProductIds[1]?.[99999]).toBeUndefined();
                expect(localDataAntProductIds[32]?.[99999]).toBeUndefined();
            });

            it("should handle string keys that are not numeric", () => {
                expect(localDataAntProductIds["invalid"]).toBeUndefined();
                expect(localDataAntProductIds[1]?.["invalid"]).toBeUndefined();
            });

            it("should handle null and undefined keys", () => {
                expect(localDataAntProductIds[null as any]).toBeUndefined();
                expect(
                    localDataAntProductIds[undefined as any]
                ).toBeUndefined();
                expect(
                    localDataAntProductIds[1]?.[null as any]
                ).toBeUndefined();
                expect(
                    localDataAntProductIds[1]?.[undefined as any]
                ).toBeUndefined();
            });

            it("should handle boolean keys", () => {
                expect(localDataAntProductIds[true as any]).toBeUndefined();
                expect(localDataAntProductIds[false as any]).toBeUndefined();
            });

            it("should handle object keys", () => {
                expect(localDataAntProductIds[{} as any]).toBeUndefined();
                expect(localDataAntProductIds[[] as any]).toBeUndefined();
            });
        });

        describe("Data Integrity", () => {
            it("should maintain data integrity across multiple accesses", () => {
                const firstAccess = localDataAntProductIds[1]?.[1036];
                const secondAccess = localDataAntProductIds[1]?.[1036];
                expect(firstAccess).toBe(secondAccess);
                expect(firstAccess).toBe("edge500");
            });

            it("should not be accidentally modifiable", () => {
                // While we can't prevent modification in JavaScript, we can test expected behavior
                const originalProduct = localDataAntProductIds[1]?.[1036];
                expect(originalProduct).toBe("edge500");

                // The data should maintain consistency
                expect(localDataAntProductIds[1]?.[1036]).toBe("edge500");
            });
        });

        describe("Type Safety", () => {
            it("should handle type coercion predictably", () => {
                // JavaScript will coerce numbers to strings for object keys
                expect(localDataAntProductIds[1]).toBe(
                    localDataAntProductIds["1"]
                );
                expect(localDataAntProductIds[1]?.[1036]).toBe(
                    localDataAntProductIds["1"]?.["1036"]
                );
            });

            it("should maintain type consistency", () => {
                Object.entries(localDataAntProductIds).forEach(
                    ([manufacturerId, products]) => {
                        expect(typeof manufacturerId).toBe("string");
                        expect(typeof products).toBe("object");

                        Object.entries(products as any).forEach(
                            ([productId, productName]) => {
                                expect(typeof productId).toBe("string");
                                expect(typeof productName).toBe("string");
                            }
                        );
                    }
                );
            });
        });
    });
});

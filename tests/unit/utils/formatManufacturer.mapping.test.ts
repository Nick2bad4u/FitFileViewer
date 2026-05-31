import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetManufacturerName = vi.fn();
vi.mock(
    "../../../electron-app/utils/formatting/display/formatAntNames.js",
    () => ({
        getManufacturerName: mockGetManufacturerName,
    })
);

const {
    formatManufacturer,
    getAllManufacturerMappings,
    hasManufacturerMapping,
} =
    await import("../../../electron-app/utils/formatting/formatters/formatManufacturer.js");

describe("formatManufacturer mapping behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("Basic Manufacturer Formatting", () => {
        describe("String-based Manufacturer Names", () => {
            it("should format known manufacturer names with proper capitalization", () => {
                expect(
                    [
                        "garmin",
                        "GARMIN",
                        "GaRmIn",
                        "  garmin  ",
                    ].map((manufacturer) => formatManufacturer(manufacturer))
                ).toStrictEqual([
                    "Garmin",
                    "Garmin",
                    "Garmin",
                    "Garmin",
                ]);
            });

            it("should format all cycling manufacturers correctly", () => {
                expect(formatManufacturer("wahoo")).toBe("Wahoo");
                expect(formatManufacturer("polar")).toBe("Polar");
                expect(formatManufacturer("suunto")).toBe("Suunto");
                expect(formatManufacturer("stages")).toBe("Stages Cycling");
                expect(formatManufacturer("sram")).toBe("SRAM");
                expect(formatManufacturer("shimano")).toBe("Shimano");
            });

            it("should format trainer manufacturers correctly", () => {
                expect(formatManufacturer("tacx")).toBe("Tacx");
                expect(formatManufacturer("elite")).toBe("Elite");
                expect(formatManufacturer("kinetic")).toBe("Kinetic");
                expect(formatManufacturer("cycleops")).toBe("CycleOps");
                expect(formatManufacturer("kickr")).toBe("Wahoo KICKR");
                expect(formatManufacturer("neo")).toBe("Tacx NEO");
            });

            it("should format power meter manufacturers correctly", () => {
                expect(formatManufacturer("powertap")).toBe("PowerTap");
                expect(formatManufacturer("quarq")).toBe("Quarq");
                expect(formatManufacturer("srm")).toBe("SRM");
                expect(formatManufacturer("pioneer")).toBe("Pioneer");
                expect(formatManufacturer("rotor")).toBe("Rotor");
            });

            it("should format software/app manufacturers correctly", () => {
                expect(formatManufacturer("zwift")).toBe("Zwift");
                expect(formatManufacturer("trainerroad")).toBe("TrainerRoad");
                expect(formatManufacturer("sufferfest")).toBe("The Sufferfest");
            });

            it("should format GPS device manufacturers correctly", () => {
                expect(formatManufacturer("magene")).toBe("Magene");
                expect(formatManufacturer("igpsport")).toBe("iGPSPORT");
                expect(formatManufacturer("bryton")).toBe("Bryton");
                expect(formatManufacturer("lezyne")).toBe("Lezyne");
                expect(formatManufacturer("sigma")).toBe("Sigma Sport");
            });

            it("should format bike component manufacturers correctly", () => {
                expect(formatManufacturer("look")).toBe("Look");
                expect(formatManufacturer("speedplay")).toBe("Speedplay");
                expect(formatManufacturer("time")).toBe("Time");
                expect(formatManufacturer("crankbrothers")).toBe(
                    "Crankbrothers"
                );
                expect(formatManufacturer("bontrager")).toBe("Bontrager");
            });

            it("should format safety equipment manufacturers correctly", () => {
                expect(formatManufacturer("kask")).toBe("Kask");
                expect(formatManufacturer("giro")).toBe("Giro");
                expect(formatManufacturer("bell")).toBe("Bell");
                expect(formatManufacturer("poc")).toBe("POC");
                expect(formatManufacturer("lazer")).toBe("Lazer");
                expect(formatManufacturer("met")).toBe("MET");
                expect(formatManufacturer("oakley")).toBe("Oakley");
                expect(formatManufacturer("smith")).toBe("Smith");
                expect(formatManufacturer("uvex")).toBe("Uvex");
            });

            it("should return original value for unknown manufacturers", () => {
                expect(formatManufacturer("unknownBrand")).toBe("unknownBrand");
                expect(formatManufacturer("CustomManufacturer")).toBe(
                    "CustomManufacturer"
                );
                expect(formatManufacturer("MyBike")).toBe("MyBike");
                expect(
                    hasManufacturerMapping("unknownBrand")
                ).not.toStrictEqual(true);
            });
        });

        describe("Special Categories and Product Lines", () => {
            it("should format bike brand manufacturers correctly", () => {
                expect(formatManufacturer("giant")).toBe("Giant");
                expect(formatManufacturer("trek")).toBe("Trek");
                expect(formatManufacturer("specialized")).toBe("Specialized");
                expect(formatManufacturer("cannondale")).toBe("Cannondale");
            });

            it("should format electronics manufacturers correctly", () => {
                expect(formatManufacturer("faveroElectronics")).toBe(
                    "Favero Electronics"
                );
                expect(
                    hasManufacturerMapping("faveroElectronics")
                ).toStrictEqual(true);
                expect(formatManufacturer("faveroElectronicsPlus")).not.toBe(
                    "Favero Electronics"
                );
                expect(formatManufacturer("cateye")).toBe("CatEye");
            });

            it("should format trainer model names correctly", () => {
                expect(formatManufacturer("flux")).toBe("Tacx Flux");
                expect(formatManufacturer("vortex")).toBe("Tacx Vortex");
                expect(formatManufacturer("bushido")).toBe("Tacx Bushido");
                expect(formatManufacturer("genius")).toBe("Tacx Genius");
                expect(formatManufacturer("direto")).toBe("Elite Direto");
                expect(formatManufacturer("suito")).toBe("Elite Suito");
                expect(formatManufacturer("novo")).toBe("Elite Novo");
                expect(formatManufacturer("rampa")).toBe("Elite Rampa");
                expect(formatManufacturer("turbo")).toBe("Elite Turbo");
            });

            it("should format Kinetic model names correctly", () => {
                expect(formatManufacturer("rock")).toBe("Kinetic Rock");
                expect(formatManufacturer("road")).toBe("Kinetic Road");
                expect(formatManufacturer("inride")).toBe("Kinetic inRide");
            });

            it("should format CycleOps model names correctly", () => {
                expect(formatManufacturer("fluid2")).toBe("CycleOps Fluid2");
                expect(formatManufacturer("magnus")).toBe("CycleOps Magnus");
                expect(formatManufacturer("hammer")).toBe("CycleOps Hammer");
                expect(formatManufacturer("h3")).toBe("CycleOps H3");
            });

            it("should format development/testing manufacturers correctly", () => {
                expect(formatManufacturer("development")).toBe("Development");
                expect(formatManufacturer("computrainer")).toBe("CompuTrainer");
            });
        });
    });

    describe("Numeric ID-based Manufacturer Resolution", () => {
        describe("Successful ID Resolution", () => {
            it("should resolve numeric IDs using external lookup service", () => {
                mockGetManufacturerName.mockReturnValue("Garmin");
                expect(formatManufacturer(1)).toBe("Garmin");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(1);
                expect(mockGetManufacturerName).not.toHaveBeenCalledWith(2);
            });

            it("should resolve string numeric IDs using external lookup service", () => {
                mockGetManufacturerName.mockReturnValue("Wahoo");
                expect(formatManufacturer("255")).toBe("Wahoo");
                expect(mockGetManufacturerName).toHaveBeenCalledWith("255");
            });

            it("should apply formatting to resolved manufacturer names", () => {
                mockGetManufacturerName.mockReturnValue("garmin");
                expect(formatManufacturer(1)).toBe("Garmin");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(1);
            });

            it("should handle zero ID correctly", () => {
                mockGetManufacturerName.mockReturnValue("0");
                expect(formatManufacturer(0)).toBe("0");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(0);
            });

            it("should handle large manufacturer IDs", () => {
                mockGetManufacturerName.mockReturnValue("65535");
                expect(formatManufacturer(65535)).toBe("65535");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(65535);
            });
        });

        describe("ID Resolution Fallbacks", () => {
            it("should fall back to original value when ID lookup returns same value", () => {
                mockGetManufacturerName.mockReturnValue("123");
                expect(formatManufacturer(123)).toBe("123");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(123);
            });

            it("should fall back to original value when ID lookup returns null", () => {
                mockGetManufacturerName.mockReturnValue(null);
                expect(formatManufacturer(999)).toBe("999");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(999);
            });

            it("should fall back to original value when ID lookup returns undefined", () => {
                mockGetManufacturerName.mockReturnValue(undefined);
                expect(formatManufacturer(888)).toBe("888");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(888);
            });

            it("should handle ID lookup service errors gracefully", () => {
                mockGetManufacturerName.mockImplementation(() => {
                    throw new Error("ID lookup service unavailable");
                });
                expect(formatManufacturer(1)).toBe("1");
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatManufacturer] Error looking up manufacturer by ID:",
                    expect.any(Error)
                );
            });

            it("should continue processing after ID lookup failure", () => {
                mockGetManufacturerName.mockImplementation(() => {
                    throw new Error("Network error");
                });
                // Should still apply formatting to fallback value if it matches mapping
                expect(formatManufacturer("garmin")).toBe("Garmin");
            });
        });
    });

    describe("Input Validation and Error Handling", () => {
        describe("Null and Undefined Inputs", () => {
            it("should handle null input gracefully", () => {
                expect(formatManufacturer(null as any)).toBe(
                    "Unknown Manufacturer"
                );
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatManufacturer] Null or undefined manufacturer provided"
                );
                expect(console.error).not.toHaveBeenCalled();
            });

            it("should handle undefined input gracefully", () => {
                expect(formatManufacturer(undefined as any)).toBe(
                    "Unknown Manufacturer"
                );
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatManufacturer] Null or undefined manufacturer provided"
                );
                expect(console.error).not.toHaveBeenCalled();
            });
        });

        describe("Invalid Data Types", () => {
            it("should handle boolean inputs by converting to string", () => {
                expect(formatManufacturer(true as any)).toBe("true");
                expect(formatManufacturer(false as any)).toBe("false");
                expect(console.error).not.toHaveBeenCalled();
            });

            it("should handle array inputs by converting to string", () => {
                expect(formatManufacturer(["garmin"] as any)).toBe("Garmin");
                expect(
                    formatManufacturer([
                        1,
                        2,
                        3,
                    ] as any)
                ).toBe("1,2,3");
            });

            it("should handle object inputs by converting to string", () => {
                expect(formatManufacturer({ name: "garmin" } as any)).toBe(
                    "[object Object]"
                );
            });

            it("should handle function inputs by converting to string", () => {
                const func = () => "garmin";
                const result = formatManufacturer(func as any);
                expect(result).toBe('() => "garmin"');
            });
        });

        describe("Edge Case Values", () => {
            it("should handle empty string input", () => {
                expect(formatManufacturer("")).toBe("");
            });

            it("should handle whitespace-only string input", () => {
                expect(formatManufacturer("   ")).toBe("   ");
            });

            it("should handle numeric zero string", () => {
                mockGetManufacturerName.mockReturnValue("0");
                expect(formatManufacturer("0")).toBe("0");
            });

            it("should handle negative numbers", () => {
                mockGetManufacturerName.mockReturnValue("-1");
                expect(formatManufacturer(-1)).toBe("-1");
            });

            it("should handle floating point numbers", () => {
                expect(formatManufacturer(1.5 as any)).toBe("1.5");
            });

            it("should handle very long strings", () => {
                const longString = "a".repeat(1000);
                expect(formatManufacturer(longString)).toBe(longString);
            });

            it("should handle special characters in manufacturer names", () => {
                expect(formatManufacturer("Mañufacturer-123_test")).toBe(
                    "Mañufacturer-123_test"
                );
                expect(formatManufacturer("Test & Co.")).toBe("Test & Co.");
                expect(formatManufacturer("Brand™")).toBe("Brand™");
            });
        });

        describe("General Error Handling", () => {
            it("should provide fallback value when all processing fails", () => {
                // Test with input that could cause various errors
                expect(formatManufacturer(Symbol("test") as any)).toBe(
                    "Symbol(test)"
                );
            });
        });
    });

    describe("Support Functions", () => {
        describe("getAllManufacturerMappings", () => {
            it("should return a copy of all manufacturer mappings", () => {
                const mappings = getAllManufacturerMappings();
                expect(mappings).toBeTypeOf("object");
                expect(mappings.garmin).toBe("Garmin");
                expect(mappings.wahoo).toBe("Wahoo");
                expect(mappings.polar).toBe("Polar");
            });

            it("should return an immutable copy (not reference)", () => {
                const mappings1 = getAllManufacturerMappings();
                const mappings2 = getAllManufacturerMappings();

                expect(mappings1).toEqual(mappings2);
                mappings1.garmin = "Mutated Garmin";
                expect(getAllManufacturerMappings().garmin).toBe("Garmin");
                expect(getAllManufacturerMappings().garmin).not.toBe(
                    "Mutated Garmin"
                );
            });

            it("should include all major manufacturer categories", () => {
                const mappings = getAllManufacturerMappings();

                // Check cycling brands
                expect(mappings.garmin).toBe("Garmin");
                expect(mappings.wahoo).toBe("Wahoo");
                expect(mappings.polar).toBe("Polar");

                // Check trainer brands
                expect(mappings.tacx).toBe("Tacx");
                expect(mappings.elite).toBe("Elite");
                expect(mappings.kinetic).toBe("Kinetic");

                // Check power meter brands
                expect(mappings.powertap).toBe("PowerTap");
                expect(mappings.quarq).toBe("Quarq");
                expect(mappings.srm).toBe("SRM");

                // Check bike brands
                expect(mappings.giant).toBe("Giant");
                expect(mappings.trek).toBe("Trek");
                expect(mappings.specialized).toBe("Specialized");
            });

            it("should contain proper formatting for all entries", () => {
                const mappings = getAllManufacturerMappings();
                const values = Object.values(mappings);
                const nonIgpsportValues = values.filter(
                    (value) => value !== "iGPSPORT"
                );

                expect(
                    values.every(
                        (value) => typeof value === "string" && value.length > 0
                    )
                ).toStrictEqual(true);
                expect(
                    nonIgpsportValues.every((value) => /^[A-Z]/.test(value))
                ).toStrictEqual(true);
                expect(
                    values.some((value) => value.length === 0)
                ).toStrictEqual(false);
            });
        });

        describe("hasManufacturerMapping", () => {
            it("should return true for manufacturers with defined mappings", () => {
                expect(
                    [
                        "garmin",
                        "wahoo",
                        "polar",
                        "tacx",
                        "elite",
                    ].map((manufacturer) =>
                        hasManufacturerMapping(manufacturer)
                    )
                ).toStrictEqual([
                    true,
                    true,
                    true,
                    true,
                    true,
                ]);
            });

            it("should return false for manufacturers without defined mappings", () => {
                expect(
                    [
                        "unknownBrand",
                        "customManufacturer",
                        "testBrand",
                    ].map((manufacturer) =>
                        hasManufacturerMapping(manufacturer)
                    )
                ).toStrictEqual([
                    false,
                    false,
                    false,
                ]);
            });

            it("should be case-insensitive for mapped manufacturers", () => {
                expect(
                    [
                        "GARMIN",
                        "GaRmIn",
                        "garmin",
                        "Garmin",
                        "faveroElectronics",
                    ].map((manufacturer) =>
                        hasManufacturerMapping(manufacturer)
                    )
                ).toStrictEqual([
                    true,
                    true,
                    true,
                    true,
                    true,
                ]);
            });

            it("should handle whitespace in manufacturer names", () => {
                expect(
                    [
                        "  garmin  ",
                        " wahoo ",
                        "\tpolar\n",
                    ].map((manufacturer) =>
                        hasManufacturerMapping(manufacturer)
                    )
                ).toStrictEqual([
                    true,
                    true,
                    true,
                ]);
            });

            it("should handle non-string inputs gracefully", () => {
                expect(
                    [
                        null,
                        undefined,
                        123,
                        true,
                        [],
                        {},
                    ].map((manufacturer) =>
                        hasManufacturerMapping(manufacturer as any)
                    )
                ).toStrictEqual([
                    false,
                    false,
                    false,
                    false,
                    false,
                    false,
                ]);
            });

            it("should handle empty and whitespace-only strings", () => {
                expect(
                    [
                        "",
                        "   ",
                        "\t\n",
                    ].map((manufacturer) =>
                        hasManufacturerMapping(manufacturer)
                    )
                ).toStrictEqual([
                    false,
                    false,
                    false,
                ]);
            });
        });
    });

    describe("External Dependency Integration", () => {
        describe("formatAntNames Integration", () => {
            it("should properly integrate with getManufacturerName function", () => {
                mockGetManufacturerName.mockReturnValue("Test Manufacturer");
                const result = formatManufacturer(42);

                expect(result).toBe("42");
                expect(mockGetManufacturerName).toHaveBeenCalledWith(42);
                expect(mockGetManufacturerName).toHaveBeenCalledTimes(1);
                expect(console.error).not.toHaveBeenCalled();
            });

            it("should handle when getManufacturerName is not available", () => {
                mockGetManufacturerName.mockImplementation(() => {
                    throw new Error("Function not available");
                });
                expect(formatManufacturer(1)).toBe("1");
                expect(console.warn).toHaveBeenCalled();
            });

            it("should work when getManufacturerName returns valid manufacturer names", () => {
                mockGetManufacturerName.mockReturnValue("garmin");
                expect(formatManufacturer(1)).toBe("Garmin");

                mockGetManufacturerName.mockReturnValue("wahoo");
                expect(formatManufacturer(255)).toBe("Wahoo");
            });
        });
    });

    describe("Performance and Edge Cases", () => {
        describe("Performance Characteristics", () => {
            it("should handle rapid successive calls efficiently", () => {
                const startTime = performance.now();
                for (let i = 0; i < 1000; i++) {
                    formatManufacturer("garmin");
                }
                const endTime = performance.now();
                expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
            });

            it("should be consistent across multiple calls with same input", () => {
                const result1 = formatManufacturer("garmin");
                const result2 = formatManufacturer("garmin");
                const result3 = formatManufacturer("garmin");

                expect(result1).toBe(result2);
                expect(result2).toBe(result3);
                expect(result1).toBe("Garmin");
                expect(result1).not.toBe("garmin");
            });
        });

        describe("Real-world Data Scenarios", () => {
            it("should handle typical FIT file manufacturer data", () => {
                // Test common manufacturer IDs from FIT files
                mockGetManufacturerName.mockReturnValue("garmin");
                expect(formatManufacturer(1)).toBe("Garmin");

                mockGetManufacturerName.mockReturnValue("wahoo");
                expect(formatManufacturer(32)).toBe("Wahoo");

                // Test fallback for unknown IDs
                mockGetManufacturerName.mockReturnValue(null);
                expect(formatManufacturer(9999)).toBe("9999");
                expect(formatManufacturer(9999)).not.toBe("Garmin");
            });

            it("should handle device string identifiers", () => {
                expect(formatManufacturer("Garmin Edge 1030")).toBe(
                    "Garmin Edge 1030"
                );
                expect(formatManufacturer("Wahoo ELEMNT BOLT")).toBe(
                    "Wahoo ELEMNT BOLT"
                );
                expect(formatManufacturer("Polar Vantage V2")).toBe(
                    "Polar Vantage V2"
                );
            });

            it("should handle mixed case manufacturer data from different sources", () => {
                expect(formatManufacturer("GARMIN")).toBe("Garmin");
                expect(formatManufacturer("wahoo_fitness")).toBe(
                    "wahoo_fitness"
                ); // Not in mapping
                expect(formatManufacturer("Polar-H10")).toBe("Polar-H10"); // Not in mapping
            });
        });
    });
});

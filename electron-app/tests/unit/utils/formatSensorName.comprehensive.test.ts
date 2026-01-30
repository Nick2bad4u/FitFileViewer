/**
 * Comprehensive test suite for formatSensorName utility function
 *
 * Tests the function that formats sensor names for consistent display across
 * the application. Uses multiple formatting strategies depending on available
 * sensor data:
 *
 * 1. Manufacturer + Product combination (preferred)
 * 2. Garmin product name formatting
 * 3. Manufacturer name only
 * 4. Fallback to unknown sensor
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { formatSensorName } from "../../../utils/formatting/formatters/formatSensorName.js";

// Mock the dependencies
vi.mock("../../../utils/formatting/formatters/formatManufacturer.js", () => ({
    formatManufacturer: vi.fn(),
}));

vi.mock("../../../utils/formatting/formatters/formatProduct.js", () => ({
    formatProduct: vi.fn(),
}));

// Import the mocked functions for direct access in tests
import { formatManufacturer } from "../../../utils/formatting/formatters/formatManufacturer.js";
import { formatProduct } from "../../../utils/formatting/formatters/formatProduct.js";

// Mock console for testing error handling
const mockConsole = {
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    dir: vi.fn(),
    table: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    groupCollapsed: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
    countReset: vi.fn(),
    assert: vi.fn(),
    dirxml: vi.fn(),
    timeLog: vi.fn(),
    timeStamp: vi.fn(),
    Console: vi.fn(),
    memory: {} as any,
    profile: vi.fn(),
    profileEnd: vi.fn(),
} as Console;

// Setup comprehensive console mocking
globalThis.console = mockConsole;
global.console = mockConsole;

describe("formatSensorName.js - Sensor Name Formatter Utility", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        (mockConsole.warn as any).mockClear();
        (mockConsole.error as any).mockClear();
    });

    afterEach(() => {
        // Additional cleanup after each test
        vi.clearAllMocks();
    });

    describe("Input Validation", () => {
        it("should return fallback for null sensor", () => {
            const result = formatSensorName(null as any);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                null
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for undefined sensor", () => {
            const result = formatSensorName(undefined as any);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                undefined
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for non-object sensor (string)", () => {
            const result = formatSensorName("invalid" as any);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                "invalid"
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for non-object sensor (number)", () => {
            const result = formatSensorName(123 as any);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                123
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for non-object sensor (boolean)", () => {
            const result = formatSensorName(true as any);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                true
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for empty object", () => {
            const result = formatSensorName({});
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).not.toHaveBeenCalled();
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });
    });

    describe("Strategy 1: Manufacturer + Product Combination", () => {
        it("should format sensor with manufacturer and product", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).toHaveBeenCalledWith(1, 1735);
        });

        it("should avoid duplication when product name includes manufacturer", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Garmin Edge 520");

            const sensor = { manufacturer: "garmin", product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith("garmin");
            expect(formatProduct).toHaveBeenCalledWith("garmin", 1735);
        });

        it("should handle case-insensitive duplication check", () => {
            (formatManufacturer as any).mockReturnValue("GARMIN");
            (formatProduct as any).mockReturnValue("garmin edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("garmin edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).toHaveBeenCalledWith(1, 1735);
        });

        it("should not use manufacturer+product if manufacturer is null", () => {
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = { manufacturer: null as any, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should not use manufacturer+product if manufacturer is undefined", () => {
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = { manufacturer: undefined, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should not use manufacturer+product if product is null", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");

            const sensor = { manufacturer: 1, product: null as any };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should not use manufacturer+product if product is undefined", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");

            const sensor = { manufacturer: 1, product: undefined };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should handle zero values as valid", () => {
            (formatManufacturer as any).mockReturnValue("Test Manufacturer");
            (formatProduct as any).mockReturnValue("Test Product");

            const sensor = { manufacturer: 0, product: 0 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Test Manufacturer Test Product");
            expect(formatManufacturer).toHaveBeenCalledWith(0);
            expect(formatProduct).toHaveBeenCalledWith(0, 0);
        });
    });

    describe("Strategy 2: Garmin Product Formatting", () => {
        it("should format garmin product with snake_case", () => {
            const sensor = { garminProduct: "edge_520_plus" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Edge 520 Plus");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should format garmin product with single word", () => {
            const sensor = { garminProduct: "fenix" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Fenix");
        });

        it("should format garmin product with multiple underscores", () => {
            const sensor = { garminProduct: "forerunner_945_lte_ultra" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Forerunner 945 Lte Ultra");
        });

        it("should handle garmin product with numbers", () => {
            const sensor = { garminProduct: "vivoactive_4s" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Vivoactive 4s");
        });

        it("should handle garmin product that is a number", () => {
            const sensor = { garminProduct: String(1735) };
            const result = formatSensorName(sensor);

            expect(result).toBe("1735");
        });

        it("should handle garmin product with no underscores", () => {
            const sensor = { garminProduct: "fenix7" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Fenix7");
        });

        it("should handle empty garmin product", () => {
            const sensor = { garminProduct: "" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
        });

        it("should prioritize manufacturer+product over garmin product", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = {
                manufacturer: 1,
                product: 1735,
                garminProduct: "edge_520_plus",
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).toHaveBeenCalledWith(1, 1735);
        });
    });

    describe("Strategy 3: Manufacturer Only", () => {
        it("should format manufacturer when no product available", () => {
            (formatManufacturer as any).mockReturnValue("Wahoo");

            const sensor = { manufacturer: "wahoo" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Wahoo");
            expect(formatManufacturer).toHaveBeenCalledWith("wahoo");
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should format manufacturer numeric ID", () => {
            (formatManufacturer as any).mockReturnValue("Polar");

            const sensor = { manufacturer: 7 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Polar");
            expect(formatManufacturer).toHaveBeenCalledWith(7);
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should prioritize garmin product over manufacturer only", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");

            const sensor = {
                manufacturer: "garmin",
                garminProduct: "edge_520",
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Edge 520");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should handle manufacturer zero", () => {
            (formatManufacturer as any).mockReturnValue("Test Manufacturer");

            const sensor = { manufacturer: 0 };
            const result = formatSensorName(sensor);

            // Manufacturer 0 is falsy, so function falls back to "Unknown Sensor"
            expect(result).toBe("Unknown Sensor");
            expect(formatManufacturer).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle formatManufacturer throwing error", () => {
            (formatManufacturer as any).mockImplementation(() => {
                throw new Error("Manufacturer error");
            });

            const sensor = { manufacturer: 1 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[formatSensorName] Error formatting sensor name:",
                expect.any(Error)
            );
        });

        it("should handle formatProduct throwing error", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockImplementation(() => {
                throw new Error("Product error");
            });

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[formatSensorName] Error formatting sensor name:",
                expect.any(Error)
            );
        });

        it("should handle garmin product formatting error", () => {
            // Test with a garmin product that might cause String conversion issues
            // Since we can't easily mock String globally, test edge case inputs
            const sensor = { garminProduct: {} as any }; // Invalid type that would cause String() to not work as expected
            const result = formatSensorName(sensor);

            // Function should handle any garmin product formatting gracefully
            expect(result).toBe("[object object]"); // String({}) returns '[object object]' after formatting
        });

        it("should handle unexpected object properties gracefully", () => {
            const sensor = {
                invalidProperty: "invalid",
                manufacturer: null as any,
                product: null as any,
                garminProduct: null as any,
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.error).not.toHaveBeenCalled();
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle Garmin Edge 520 sensor correctly", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
        });

        it("should handle Wahoo KICKR sensor correctly", () => {
            (formatManufacturer as any).mockReturnValue("Wahoo");
            (formatProduct as any).mockReturnValue("KICKR");

            const sensor = { manufacturer: "wahoo", product: 1537 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Wahoo KICKR");
        });

        it("should handle heart rate monitor sensor", () => {
            (formatManufacturer as any).mockReturnValue("Polar");
            (formatProduct as any).mockReturnValue("H10");

            const sensor = { manufacturer: 7, product: 1 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Polar H10");
        });

        it("should handle unknown manufacturer correctly", () => {
            (formatManufacturer as any).mockReturnValue("Unknown Manufacturer");

            const sensor = { manufacturer: 999 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Manufacturer");
        });

        it("should handle Garmin fenix series", () => {
            const sensor = { garminProduct: "fenix_7_sapphire_solar" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Fenix 7 Sapphire Solar");
        });

        it("should handle sensors with product already containing manufacturer name", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Garmin Edge 1030 Plus");

            const sensor = { manufacturer: 1, product: 3624 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 1030 Plus");
        });
    });

    describe("Edge Cases", () => {
        it("should handle sensor with all properties set", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = {
                manufacturer: 1,
                product: 1735,
                garminProduct: "edge_520_different",
            };
            const result = formatSensorName(sensor);

            // Should use manufacturer+product strategy (highest priority)
            expect(result).toBe("Garmin Edge 520");
        });

        it("should handle sensor with very long product names", () => {
            const sensor = {
                garminProduct:
                    "this_is_a_very_long_product_name_with_many_words",
            };
            const result = formatSensorName(sensor);

            expect(result).toBe(
                "This Is A Very Long Product Name With Many Words"
            );
        });

        it("should handle sensor with special characters in garmin product", () => {
            const sensor = { garminProduct: "edge-520" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Edge-520");
        });

        it("should handle sensor with numbers in garmin product", () => {
            const sensor = { garminProduct: "device_123_v2" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Device 123 V2");
        });

        it("should handle manufacturer with partial duplication in product", () => {
            (formatManufacturer as any).mockReturnValue("Gar");
            (formatProduct as any).mockReturnValue("Garmin Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
        });

        it("should handle case where formatted values return empty strings", () => {
            (formatManufacturer as any).mockReturnValue("");
            (formatProduct as any).mockReturnValue("");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            // When both are empty, productName.includes(manufacturerName) is true (''.includes('') === true)
            // so function returns productName (empty string) to avoid duplication
            expect(result).toBe("");
        });

        it("should handle array as manufacturer", () => {
            const sensor = {
                manufacturer: [
                    1,
                    2,
                    3,
                ] as any,
                product: 1735,
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
        });

        it("should handle object as product", () => {
            const sensor = { manufacturer: 1, product: { id: 1735 } as any };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
        });
    });

    describe("Performance and Efficiency", () => {
        it("should not call unnecessary functions for invalid inputs", () => {
            formatSensorName(null as any);
            formatSensorName(undefined as any);
            formatSensorName("invalid" as any);

            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should call functions in correct priority order", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            formatSensorName(sensor);

            expect(formatManufacturer).toHaveBeenCalledBefore(
                formatProduct as any
            );
        });

        it("should handle multiple calls efficiently", () => {
            (formatManufacturer as any).mockReturnValue("Garmin");
            (formatProduct as any).mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };

            formatSensorName(sensor);
            formatSensorName(sensor);
            formatSensorName(sensor);

            expect(formatManufacturer).toHaveBeenCalledTimes(3);
            expect(formatProduct).toHaveBeenCalledTimes(3);
        });

        it("should short-circuit when garmin product is available without manufacturer/product", () => {
            const sensor = { garminProduct: "edge_520" };
            formatSensorName(sensor);

            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });
    });
});

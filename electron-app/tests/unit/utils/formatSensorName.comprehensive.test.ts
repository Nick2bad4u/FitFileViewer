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

type SensorInput = {
    readonly garminProduct?: unknown;
    readonly invalidProperty?: unknown;
    readonly manufacturer?: unknown;
    readonly product?: unknown;
};

const mockFormatManufacturer = vi.mocked(formatManufacturer);
const mockFormatProduct = vi.mocked(formatProduct);

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
    memory: {},
    profile: vi.fn(),
    profileEnd: vi.fn(),
};

// Setup comprehensive console mocking
globalThis.console = mockConsole as unknown as Console;
global.console = mockConsole as unknown as Console;

describe("formatSensorName.js - Sensor Name Formatter Utility", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        mockConsole.warn.mockClear();
        mockConsole.error.mockClear();
    });

    afterEach(() => {
        // Additional cleanup after each test
        vi.clearAllMocks();
    });

    describe("Input Validation", () => {
        it("should return fallback for null sensor", () => {
            const result = formatSensorName(null);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                null
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for undefined sensor", () => {
            const result = formatSensorName(undefined);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                undefined
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for non-object sensor (string)", () => {
            const result = formatSensorName("invalid");
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                "invalid"
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for non-object sensor (number)", () => {
            const result = formatSensorName(123);
            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[formatSensorName] Invalid sensor object provided:",
                123
            );
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should return fallback for non-object sensor (boolean)", () => {
            const result = formatSensorName(true);
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
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).toHaveBeenCalledWith(1, 1735);
        });

        it("should avoid duplication when product name includes manufacturer", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Garmin Edge 520");

            const sensor = { manufacturer: "garmin", product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith("garmin");
            expect(formatProduct).toHaveBeenCalledWith("garmin", 1735);
        });

        it("should handle case-insensitive duplication check", () => {
            mockFormatManufacturer.mockReturnValue("GARMIN");
            mockFormatProduct.mockReturnValue("garmin edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("garmin edge 520");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).toHaveBeenCalledWith(1, 1735);
        });

        it("should not use manufacturer+product if manufacturer is null", () => {
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor: SensorInput = { manufacturer: null, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should not use manufacturer+product if manufacturer is undefined", () => {
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor = { manufacturer: undefined, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should not use manufacturer+product if product is null", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");

            const sensor: SensorInput = { manufacturer: 1, product: null };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should not use manufacturer+product if product is undefined", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");

            const sensor = { manufacturer: 1, product: undefined };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin");
            expect(formatManufacturer).toHaveBeenCalledWith(1);
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should handle zero values as valid", () => {
            mockFormatManufacturer.mockReturnValue("Test Manufacturer");
            mockFormatProduct.mockReturnValue("Test Product");

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
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Edge 520");

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
            mockFormatManufacturer.mockReturnValue("Wahoo");

            const sensor = { manufacturer: "wahoo" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Wahoo");
            expect(formatManufacturer).toHaveBeenCalledWith("wahoo");
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should format manufacturer numeric ID", () => {
            mockFormatManufacturer.mockReturnValue("Polar");

            const sensor = { manufacturer: 7 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Polar");
            expect(formatManufacturer).toHaveBeenCalledWith(7);
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should prioritize garmin product over manufacturer only", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");

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
            mockFormatManufacturer.mockReturnValue("Test Manufacturer");

            const sensor = { manufacturer: 0 };
            const result = formatSensorName(sensor);

            // Manufacturer 0 is falsy, so function falls back to "Unknown Sensor"
            expect(result).toBe("Unknown Sensor");
            expect(formatManufacturer).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle formatManufacturer throwing error", () => {
            mockFormatManufacturer.mockImplementation(() => {
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
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockImplementation(() => {
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
            const sensor: SensorInput = { garminProduct: {} }; // Invalid type that would cause String() to not work as expected
            const result = formatSensorName(sensor);

            // Function should handle any garmin product formatting gracefully
            expect(result).toBe("[object object]"); // String({}) returns '[object object]' after formatting
        });

        it("should handle unexpected object properties gracefully", () => {
            const sensor = {
                invalidProperty: "invalid",
                manufacturer: null,
                product: null,
                garminProduct: null,
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
            expect(mockConsole.error).not.toHaveBeenCalled();
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle Garmin Edge 520 sensor correctly", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(result).not.toBe("edge_520_different");
        });

        it("should handle Wahoo KICKR sensor correctly", () => {
            mockFormatManufacturer.mockReturnValue("Wahoo");
            mockFormatProduct.mockReturnValue("KICKR");

            const sensor = { manufacturer: "wahoo", product: 1537 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Wahoo KICKR");
        });

        it("should handle heart rate monitor sensor", () => {
            mockFormatManufacturer.mockReturnValue("Polar");
            mockFormatProduct.mockReturnValue("H10");

            const sensor = { manufacturer: 7, product: 1 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Polar H10");
        });

        it("should handle unknown manufacturer correctly", () => {
            mockFormatManufacturer.mockReturnValue("Unknown Manufacturer");

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
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Garmin Edge 1030 Plus");

            const sensor = { manufacturer: 1, product: 3624 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 1030 Plus");
        });
    });

    describe("Edge Cases", () => {
        it("should handle sensor with all properties set", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor = {
                manufacturer: 1,
                product: 1735,
                garminProduct: "edge_520_different",
            };
            const result = formatSensorName(sensor);

            // Should use manufacturer+product strategy (highest priority)
            expect(result).toBe("Garmin Edge 520");
            expect(result).not.toBe("Edge 520 Different");
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
            mockFormatManufacturer.mockReturnValue("Gar");
            mockFormatProduct.mockReturnValue("Garmin Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
        });

        it("should handle case where formatted values return empty strings", () => {
            mockFormatManufacturer.mockReturnValue("");
            mockFormatProduct.mockReturnValue("");

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
                ],
                product: 1735,
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
        });

        it("should handle object as product", () => {
            const sensor: SensorInput = {
                manufacturer: 1,
                product: { id: 1735 },
            };
            const result = formatSensorName(sensor);

            expect(result).toBe("Unknown Sensor");
        });
    });

    describe("Performance and Efficiency", () => {
        it("should not call unnecessary functions for invalid inputs", () => {
            expect(formatSensorName(null)).toBe("Unknown Sensor");
            expect(formatSensorName(undefined)).toBe("Unknown Sensor");
            expect(formatSensorName("invalid")).toBe("Unknown Sensor");

            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });

        it("should call functions in correct priority order", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledBefore(
                mockFormatProduct
            );
        });

        it("should handle multiple calls efficiently", () => {
            mockFormatManufacturer.mockReturnValue("Garmin");
            mockFormatProduct.mockReturnValue("Edge 520");

            const sensor = { manufacturer: 1, product: 1735 };

            formatSensorName(sensor);
            formatSensorName(sensor);
            const result = formatSensorName(sensor);

            expect(result).toBe("Garmin Edge 520");
            expect(formatManufacturer).toHaveBeenCalledTimes(3);
            expect(formatProduct).toHaveBeenCalledTimes(3);
        });

        it("should short-circuit when garmin product is available without manufacturer/product", () => {
            const sensor = { garminProduct: "edge_520" };
            const result = formatSensorName(sensor);

            expect(result).toBe("Edge 520");
            expect(formatManufacturer).not.toHaveBeenCalled();
            expect(formatProduct).not.toHaveBeenCalled();
        });
    });
});

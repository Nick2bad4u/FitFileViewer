import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { convertValueToUserUnits } from "../../../utils/formatting/converters/convertValueToUserUnits.js";
import { convertDistanceUnits } from "../../../utils/formatting/converters/convertDistanceUnits.js";
import { convertTemperatureUnits } from "../../../utils/formatting/converters/convertTemperatureUnits.js";

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mock the converter dependencies
vi.mock("../../../utils/formatting/converters/convertDistanceUnits.js", () => ({
    DISTANCE_UNITS: {
        METERS: "meters",
        KILOMETERS: "kilometers",
        MILES: "miles",
    },
    convertDistanceUnits: vi.fn(),
}));

vi.mock("../../../utils/formatting/converters/convertTemperatureUnits.js", () => ({
    TEMPERATURE_UNITS: {
        CELSIUS: "celsius",
        FAHRENHEIT: "fahrenheit",
    },
    convertTemperatureUnits: vi.fn(),
}));

describe("convertValueToUserUnits.js - Value to User Units Converter Utility", () => {
    let mockConsole: {
        warn: any;
        error: any;
    };

    beforeEach(() => {
        // Setup localStorage mock
        Object.defineProperty(global, "localStorage", {
            value: mockLocalStorage,
            writable: true,
        });

        mockConsole = {
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Setup default mock implementations
        (convertDistanceUnits as any).mockImplementation((value, unit) => {
            if (unit === "kilometers") return value / 1000;
            if (unit === "miles") return value / 1609.34;
            return value; // meters
        });

        (convertTemperatureUnits as any).mockImplementation((value, unit) => {
            if (unit === "fahrenheit") return (value * 9) / 5 + 32;
            return value; // celsius
        });

        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        mockConsole.warn.mockRestore();
        mockConsole.error.mockRestore();
    });

    describe("Input Validation", () => {
        it("should warn for null value and return unchanged", () => {
            const result = convertValueToUserUnits(null as any, "distance");
            expect(result).toBeNull();
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Invalid value for field 'distance':",
                null
            );
        });

        it("should warn for undefined value and return unchanged", () => {
            const result = convertValueToUserUnits(undefined as any, "distance");
            expect(result).toBeUndefined();
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Invalid value for field 'distance':",
                undefined
            );
        });

        it("should warn for string value and return unchanged", () => {
            const result = convertValueToUserUnits("123" as any, "distance");
            expect(result).toBe("123");
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Invalid value for field 'distance':",
                "123"
            );
        });

        it("should warn for boolean value and return unchanged", () => {
            const result = convertValueToUserUnits(true as any, "distance");
            expect(result).toBe(true);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Invalid value for field 'distance':",
                true
            );
        });

        it("should warn for NaN value and return unchanged", () => {
            const result = convertValueToUserUnits(NaN, "distance");
            expect(result).toBeNaN();
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Invalid value for field 'distance':",
                NaN
            );
        });

        it("should warn for object value and return unchanged", () => {
            const objValue = { value: 123 };
            const result = convertValueToUserUnits(objValue as any, "distance");
            expect(result).toBe(objValue);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Invalid value for field 'distance':",
                objValue
            );
        });

        it("should warn for empty string field and return value unchanged", () => {
            const result = convertValueToUserUnits(1000, "");
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertValueToUserUnits] Invalid field name:", "");
        });

        it("should warn for whitespace-only field and return value unchanged", () => {
            const result = convertValueToUserUnits(1000, "   ");
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertValueToUserUnits] Invalid field name:", "   ");
        });

        it("should warn for null field and return value unchanged", () => {
            const result = convertValueToUserUnits(1000, null as any);
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertValueToUserUnits] Invalid field name:", null);
        });

        it("should warn for undefined field and return value unchanged", () => {
            const result = convertValueToUserUnits(1000, undefined as any);
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertValueToUserUnits] Invalid field name:", undefined);
        });
    });

    describe("Distance Field Conversions", () => {
        beforeEach(() => {
            // Reset distance converter mock
            (convertDistanceUnits as any).mockImplementation((value, unit) => {
                if (unit === "kilometers") return value / 1000;
                if (unit === "miles") return value / 1609.34;
                return value;
            });
        });

        it("should convert distance field with user preference from localStorage", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(1000, "distance");

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");
            expect(result).toBe(1); // 1000m = 1km
        });

        it("should convert distance field with default kilometers when no preference", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = convertValueToUserUnits(1000, "distance");

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");
            expect(result).toBe(1); // Default kilometers conversion
        });

        it("should convert altitude field as distance", () => {
            mockLocalStorage.getItem.mockReturnValue("miles");

            const result = convertValueToUserUnits(1609.34, "altitude");

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");
            expect(result).toBeCloseTo(1, 5); // 1609.34m = 1 mile
        });

        it("should convert enhancedAltitude field as distance", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(5000, "enhancedAltitude");

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");
            expect(result).toBe(5); // 5000m = 5km
        });

        it("should handle zero distance values", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(0, "distance");

            expect(result).toBe(0);
        });

        it("should handle negative distance values", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(-1000, "distance");

            expect(result).toBe(-1);
        });

        it("should handle decimal distance values", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(1500.5, "distance");

            expect(result).toBeCloseTo(1.5005, 6);
        });
    });

    describe("Temperature Field Conversions", () => {
        beforeEach(() => {
            // Reset temperature converter mock
            (convertTemperatureUnits as any).mockImplementation((value, unit) => {
                if (unit === "fahrenheit") return (value * 9) / 5 + 32;
                return value;
            });
        });

        it("should convert temperature field with user preference from localStorage", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const result = convertValueToUserUnits(25, "temperature");

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_temperatureUnits");
            expect(result).toBe(77); // 25°C = 77°F
        });

        it("should convert temperature field with default celsius when no preference", () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = convertValueToUserUnits(25, "temperature");

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_temperatureUnits");
            expect(result).toBe(25); // Default celsius
        });

        it("should handle zero temperature values", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const result = convertValueToUserUnits(0, "temperature");

            expect(result).toBe(32); // 0°C = 32°F
        });

        it("should handle negative temperature values", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const result = convertValueToUserUnits(-10, "temperature");

            expect(result).toBe(14); // -10°C = 14°F
        });

        it("should handle decimal temperature values", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const result = convertValueToUserUnits(25.5, "temperature");

            expect(result).toBeCloseTo(77.9, 1); // 25.5°C ≈ 77.9°F
        });
    });

    describe("Non-Convertible Fields", () => {
        it("should return value unchanged for unrecognized field", () => {
            const result = convertValueToUserUnits(123.45, "power");

            expect(result).toBe(123.45);
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it("should return value unchanged for speed field", () => {
            const result = convertValueToUserUnits(15.5, "speed");

            expect(result).toBe(15.5);
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it("should return value unchanged for heartRate field", () => {
            const result = convertValueToUserUnits(150, "heartRate");

            expect(result).toBe(150);
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it("should return value unchanged for cadence field", () => {
            const result = convertValueToUserUnits(90, "cadence");

            expect(result).toBe(90);
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it("should return value unchanged for timestamp field", () => {
            const result = convertValueToUserUnits(1640995200000, "timestamp");

            expect(result).toBe(1640995200000);
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it("should handle arbitrary field names gracefully", () => {
            const result = convertValueToUserUnits(42, "customField");

            expect(result).toBe(42);
            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle conversion errors and return original value", () => {
            (convertDistanceUnits as any).mockImplementation(() => {
                throw new Error("Conversion failed");
            });

            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(1000, "distance");

            expect(result).toBe(1000); // Original value returned
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Conversion failed for field 'distance':",
                expect.any(Error)
            );
        });

        it("should handle temperature conversion errors", () => {
            (convertTemperatureUnits as any).mockImplementation(() => {
                throw new Error("Temperature conversion failed");
            });

            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const result = convertValueToUserUnits(25, "temperature");

            expect(result).toBe(25); // Original value returned
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Conversion failed for field 'temperature':",
                expect.any(Error)
            );
        });

        it("should handle localStorage errors gracefully", () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("LocalStorage error");
            });

            const result = convertValueToUserUnits(1000, "distance");

            expect(result).toBe(1000); // Should return original value
            expect(mockConsole.error).toHaveBeenCalledWith(
                "[convertValueToUserUnits] Conversion failed for field 'distance':",
                expect.any(Error)
            );
        });

        it("should handle corrupted localStorage values", () => {
            mockLocalStorage.getItem.mockReturnValue("invalid-unit");

            // Mock converter to handle invalid unit gracefully
            (convertDistanceUnits as any).mockImplementation((value, unit) => {
                if (unit === "invalid-unit") return value; // No conversion for unknown unit
                return value / 1000;
            });

            const result = convertValueToUserUnits(1000, "distance");

            expect(result).toBe(1000); // No conversion applied
        });
    });

    describe("Edge Cases and Performance", () => {
        it("should handle very large values", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(1e12, "distance");

            expect(result).toBe(1e9); // 1e12 meters = 1e9 kilometers
        });

        it("should handle very small values", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(0.001, "distance");

            expect(result).toBe(0.000001); // 0.001m = 0.000001km
        });

        it("should handle Infinity values", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const result = convertValueToUserUnits(Infinity, "distance");

            expect(result).toBe(Infinity);
        });

        it("should handle negative Infinity values", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const result = convertValueToUserUnits(-Infinity, "temperature");

            expect(result).toBe(-Infinity);
        });

        it("should be consistent across multiple calls", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const results = Array.from({ length: 100 }, () => convertValueToUserUnits(1000, "distance"));

            expect(results.every((result) => result === 1)).toBe(true);
        });

        it("should handle rapid successive conversions", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const testValues = [0, 10, 20, 30, 40, 50];
            const expectedValues = [32, 50, 68, 86, 104, 122];

            const results = testValues.map((temp) => convertValueToUserUnits(temp, "temperature"));

            results.forEach((result, index) => {
                expect(result).toBe(expectedValues[index]);
            });
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle FIT file distance data conversion", () => {
            mockLocalStorage.getItem.mockReturnValue("miles");

            // Typical GPS distance in meters
            const results = [
                convertValueToUserUnits(1000, "distance"), // 1km
                convertValueToUserUnits(5000, "distance"), // 5km
                convertValueToUserUnits(10000, "distance"), // 10km
                convertValueToUserUnits(21097.5, "distance"), // Half marathon
            ];

            expect(results[0]).toBeCloseTo(0.6213727366498067, 4);
            expect(results[1]).toBeCloseTo(3.1068636832490337, 4);
            expect(results[2]).toBeCloseTo(6.213727366498067, 4);
            expect(results[3]).toBeCloseTo(13.109375, 4);
        });

        it("should handle altitude elevation data", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            const elevations = [
                convertValueToUserUnits(100, "altitude"), // 100m hill
                convertValueToUserUnits(1000, "enhancedAltitude"), // 1km mountain
                convertValueToUserUnits(8848, "altitude"), // Mount Everest
            ];

            expect(elevations[0]).toBe(0.1);
            expect(elevations[1]).toBe(1);
            expect(elevations[2]).toBe(8.848);
        });

        it("should handle temperature sensor data", () => {
            mockLocalStorage.getItem.mockReturnValue("fahrenheit");

            const temperatures = [
                convertValueToUserUnits(20, "temperature"), // Room temperature
                convertValueToUserUnits(37, "temperature"), // Body temperature
                convertValueToUserUnits(100, "temperature"), // Boiling water
            ];

            expect(temperatures[0]).toBe(68); // 20°C = 68°F
            expect(temperatures[1]).toBe(98.6); // 37°C = 98.6°F
            expect(temperatures[2]).toBe(212); // 100°C = 212°F
        });

        it("should handle mixed field types in typical FIT record", () => {
            // Setup different preferences
            mockLocalStorage.getItem.mockImplementation((key) => {
                if (key === "chartjs_distanceUnits") return "miles";
                if (key === "chartjs_temperatureUnits") return "fahrenheit";
                return null;
            });

            const fitRecord = {
                distance: convertValueToUserUnits(1609.34, "distance"), // 1 mile
                altitude: convertValueToUserUnits(500, "altitude"), // 500m
                temperature: convertValueToUserUnits(22, "temperature"), // 22°C
                heartRate: convertValueToUserUnits(150, "heartRate"), // No conversion
                speed: convertValueToUserUnits(5.5, "speed"), // No conversion
                power: convertValueToUserUnits(250, "power"), // No conversion
            };

            expect(fitRecord.distance).toBeCloseTo(1, 5);
            expect(fitRecord.altitude).toBeCloseTo(0.3106863683249033, 4);
            expect(fitRecord.temperature).toBeCloseTo(71.6, 1);
            expect(fitRecord.heartRate).toBe(150);
            expect(fitRecord.speed).toBe(5.5);
            expect(fitRecord.power).toBe(250);
        });

        it("should handle user preference changes consistently", () => {
            // Start with metric
            mockLocalStorage.getItem.mockReturnValue("kilometers");
            let result1 = convertValueToUserUnits(1000, "distance");
            expect(result1).toBe(1);

            // Change to imperial
            mockLocalStorage.getItem.mockReturnValue("miles");
            let result2 = convertValueToUserUnits(1000, "distance");
            expect(result2).toBeCloseTo(0.6213727366498067, 4);

            // Back to metric
            mockLocalStorage.getItem.mockReturnValue("kilometers");
            let result3 = convertValueToUserUnits(1000, "distance");
            expect(result3).toBe(1);
        });
    });

    describe("Integration with Storage System", () => {
        it("should use correct storage keys for different unit types", () => {
            convertValueToUserUnits(1000, "distance");
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");

            vi.clearAllMocks();

            convertValueToUserUnits(25, "temperature");
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_temperatureUnits");
        });

        it("should handle missing localStorage gracefully", () => {
            // Simulate environment without localStorage
            Object.defineProperty(global, "localStorage", {
                value: undefined,
                writable: true,
            });

            const result = convertValueToUserUnits(1000, "distance");

            // Should handle gracefully and return original value
            expect(result).toBe(1000);
        });

        it("should cache localStorage calls efficiently", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            // Multiple calls for same field type
            convertValueToUserUnits(1000, "distance");
            convertValueToUserUnits(2000, "distance");
            convertValueToUserUnits(3000, "altitude");

            // Should call localStorage for each conversion (no caching in this implementation)
            expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(3);
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");
        });
    });

    describe("Type Safety and Validation", () => {
        it("should handle edge case numeric values correctly", () => {
            mockLocalStorage.getItem.mockReturnValue("kilometers");

            expect(convertValueToUserUnits(Number.MAX_VALUE, "distance")).toBeDefined();
            expect(convertValueToUserUnits(Number.MIN_VALUE, "distance")).toBeDefined();
            expect(convertValueToUserUnits(Number.EPSILON, "distance")).toBeDefined();
        });

        it("should validate field names case-sensitively", () => {
            // These should NOT trigger conversions (wrong case)
            expect(convertValueToUserUnits(1000, "Distance")).toBe(1000);
            expect(convertValueToUserUnits(1000, "DISTANCE")).toBe(1000);
            expect(convertValueToUserUnits(25, "Temperature")).toBe(25);
            expect(convertValueToUserUnits(25, "TEMPERATURE")).toBe(25);

            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });

        it("should handle field names with extra whitespace", () => {
            // Fields with whitespace should not match
            expect(convertValueToUserUnits(1000, " distance ")).toBe(1000);
            expect(convertValueToUserUnits(1000, "distance ")).toBe(1000);
            expect(convertValueToUserUnits(1000, " distance")).toBe(1000);

            expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        });
    });
});

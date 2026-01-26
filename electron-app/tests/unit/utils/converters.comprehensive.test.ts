import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import all converter utilities
import { convertMpsToKmh } from "../../../utils/formatting/converters/convertMpsToKmh.js";
import { convertMpsToMph } from "../../../utils/formatting/converters/convertMpsToMph.js";
import { convertDistanceUnits, DISTANCE_UNITS } from "../../../utils/formatting/converters/convertDistanceUnits.js";
import {
    convertTemperatureUnits,
    TEMPERATURE_UNITS,
} from "../../../utils/formatting/converters/convertTemperatureUnits.js";
import { convertTimeUnits, TIME_UNITS } from "../../../utils/formatting/converters/convertTimeUnits.js";
import { convertArrayBufferToBase64 } from "../../../utils/formatting/converters/convertArrayBufferToBase64.js";
import { convertValueToUserUnits } from "../../../utils/formatting/converters/convertValueToUserUnits.js";

// Mock console methods to avoid noise in tests
const mockConsole = {
    warn: vi.fn(),
    error: vi.fn(),
};
vi.stubGlobal("console", mockConsole);

// Mock localStorage for convertValueToUserUnits
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
vi.stubGlobal("localStorage", mockLocalStorage);

describe("Converter Utilities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("convertMpsToKmh", () => {
        it("should convert meters per second to kilometers per hour correctly", () => {
            expect(convertMpsToKmh(10)).toBeCloseTo(36, 1);
            expect(convertMpsToKmh(0)).toBe(0);
            expect(convertMpsToKmh(1)).toBeCloseTo(3.6, 1);
            expect(convertMpsToKmh(27.78)).toBeCloseTo(100, 1);
        });

        it("should handle decimal inputs correctly", () => {
            expect(convertMpsToKmh(5.5)).toBeCloseTo(19.8, 1);
            expect(convertMpsToKmh(0.1)).toBeCloseTo(0.36, 2);
        });

        it("should handle negative speeds with warning", () => {
            const result = convertMpsToKmh(-5);
            expect(result).toBeCloseTo(-18, 1);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertMpsToKmh] Negative speed value:", -5);
        });

        it("should throw TypeError for non-numeric input", () => {
            expect(() => convertMpsToKmh("10" as any)).toThrow(TypeError);
            expect(() => convertMpsToKmh(null as any)).toThrow(TypeError);
            expect(() => convertMpsToKmh(undefined as any)).toThrow(TypeError);
            expect(() => convertMpsToKmh(NaN)).toThrow(TypeError);
            expect(() => convertMpsToKmh({} as any)).toThrow(TypeError);
        });

        it("should handle very large numbers", () => {
            expect(convertMpsToKmh(1000)).toBeCloseTo(3600, 1);
            expect(convertMpsToKmh(Number.MAX_SAFE_INTEGER)).toBeDefined();
        });

        it("should handle very small positive numbers", () => {
            expect(convertMpsToKmh(0.001)).toBeCloseTo(0.0036, 4);
            expect(convertMpsToKmh(Number.MIN_VALUE)).toBeDefined();
        });
    });

    describe("convertMpsToMph", () => {
        it("should convert meters per second to miles per hour correctly", () => {
            expect(convertMpsToMph(10)).toBeCloseTo(22.37, 1);
            expect(convertMpsToMph(0)).toBe(0);
            expect(convertMpsToMph(1)).toBeCloseTo(2.237, 2);
            expect(convertMpsToMph(44.7)).toBeCloseTo(100, 0);
        });

        it("should handle decimal inputs correctly", () => {
            expect(convertMpsToMph(5.5)).toBeCloseTo(12.3, 1);
            expect(convertMpsToMph(0.1)).toBeCloseTo(0.224, 2);
        });

        it("should handle negative speeds with warning", () => {
            const result = convertMpsToMph(-5);
            expect(result).toBeCloseTo(-11.18, 1);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertMpsToMph] Negative speed value:", -5);
        });

        it("should throw TypeError for non-numeric input", () => {
            expect(() => convertMpsToMph("10" as any)).toThrow(TypeError);
            expect(() => convertMpsToMph(null as any)).toThrow(TypeError);
            expect(() => convertMpsToMph(undefined as any)).toThrow(TypeError);
            expect(() => convertMpsToMph(NaN)).toThrow(TypeError);
            expect(() => convertMpsToMph({} as any)).toThrow(TypeError);
        });

        it("should handle very large numbers", () => {
            expect(convertMpsToMph(1000)).toBeCloseTo(2236.936, 1);
            expect(convertMpsToMph(Number.MAX_SAFE_INTEGER)).toBeDefined();
        });

        it("should handle very small positive numbers", () => {
            expect(convertMpsToMph(0.001)).toBeCloseTo(0.002237, 5);
            expect(convertMpsToMph(Number.MIN_VALUE)).toBeDefined();
        });
    });

    describe("convertDistanceUnits", () => {
        it("should convert meters to kilometers correctly", () => {
            expect(convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS)).toBeCloseTo(1, 1);
            expect(convertDistanceUnits(500, DISTANCE_UNITS.KILOMETERS)).toBeCloseTo(0.5, 1);
            expect(convertDistanceUnits(0, DISTANCE_UNITS.KILOMETERS)).toBe(0);
        });

        it("should convert meters to miles correctly", () => {
            expect(convertDistanceUnits(1609.34, DISTANCE_UNITS.MILES)).toBeCloseTo(1, 2);
            expect(convertDistanceUnits(804.67, DISTANCE_UNITS.MILES)).toBeCloseTo(0.5, 2);
            expect(convertDistanceUnits(0, DISTANCE_UNITS.MILES)).toBe(0);
        });

        it("should return meters unchanged when target unit is meters", () => {
            expect(convertDistanceUnits(1000, DISTANCE_UNITS.METERS)).toBe(1000);
            expect(convertDistanceUnits(500.5, DISTANCE_UNITS.METERS)).toBe(500.5);
        });

        it("should handle unknown units with warning and return original value", () => {
            const result = convertDistanceUnits(1000, "unknown");
            expect(result).toBe(1000);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertDistanceUnits] Unknown unit 'unknown', defaulting to meters"
            );
        });

        it("should throw TypeError for non-numeric input", () => {
            expect(() => convertDistanceUnits("1000" as any, DISTANCE_UNITS.KILOMETERS)).toThrow(TypeError);
            expect(() => convertDistanceUnits(null as any, DISTANCE_UNITS.KILOMETERS)).toThrow(TypeError);
            expect(() => convertDistanceUnits(undefined as any, DISTANCE_UNITS.KILOMETERS)).toThrow(TypeError);
            expect(() => convertDistanceUnits(NaN, DISTANCE_UNITS.KILOMETERS)).toThrow(TypeError);
        });

        it("should handle negative distances with warning", () => {
            const result = convertDistanceUnits(-1000, DISTANCE_UNITS.KILOMETERS);
            expect(result).toBeCloseTo(-1, 1);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertDistanceUnits] Negative distance value:", -1000);
        });

        it("should handle very large distances", () => {
            expect(convertDistanceUnits(1000000, DISTANCE_UNITS.KILOMETERS)).toBeCloseTo(1000, 1);
            expect(convertDistanceUnits(1000000, DISTANCE_UNITS.MILES)).toBeCloseTo(621.371, 1);
        });
    });

    describe("convertTemperatureUnits", () => {
        it("should convert Celsius to Fahrenheit correctly", () => {
            expect(convertTemperatureUnits(0, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(32);
            expect(convertTemperatureUnits(100, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(212);
            expect(convertTemperatureUnits(25, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(77);
            expect(convertTemperatureUnits(-40, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(-40);
        });

        it("should return Celsius unchanged when target unit is Celsius", () => {
            expect(convertTemperatureUnits(25, TEMPERATURE_UNITS.CELSIUS)).toBe(25);
            expect(convertTemperatureUnits(0, TEMPERATURE_UNITS.CELSIUS)).toBe(0);
            expect(convertTemperatureUnits(-10, TEMPERATURE_UNITS.CELSIUS)).toBe(-10);
        });

        it("should handle unknown units with warning and return original value", () => {
            const result = convertTemperatureUnits(25, "kelvin");
            expect(result).toBe(25);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertTemperatureUnits] Unknown unit 'kelvin', defaulting to celsius"
            );
        });

        it("should throw TypeError for non-numeric input", () => {
            expect(() => convertTemperatureUnits("25" as any, TEMPERATURE_UNITS.FAHRENHEIT)).toThrow(TypeError);
            expect(() => convertTemperatureUnits(null as any, TEMPERATURE_UNITS.FAHRENHEIT)).toThrow(TypeError);
            expect(() => convertTemperatureUnits(undefined as any, TEMPERATURE_UNITS.FAHRENHEIT)).toThrow(TypeError);
            expect(() => convertTemperatureUnits(NaN, TEMPERATURE_UNITS.FAHRENHEIT)).toThrow(TypeError);
        });

        it("should handle decimal temperatures correctly", () => {
            expect(convertTemperatureUnits(20.5, TEMPERATURE_UNITS.FAHRENHEIT)).toBeCloseTo(68.9, 1);
            expect(convertTemperatureUnits(36.7, TEMPERATURE_UNITS.FAHRENHEIT)).toBeCloseTo(98.06, 1);
        });

        it("should handle extreme temperatures", () => {
            expect(convertTemperatureUnits(-273.15, TEMPERATURE_UNITS.FAHRENHEIT)).toBeCloseTo(-459.67, 1);
            expect(convertTemperatureUnits(1000, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(1832);
        });
    });

    describe("convertTimeUnits", () => {
        it("should convert seconds to minutes correctly", () => {
            expect(convertTimeUnits(60, TIME_UNITS.MINUTES)).toBe(1);
            expect(convertTimeUnits(120, TIME_UNITS.MINUTES)).toBe(2);
            expect(convertTimeUnits(30, TIME_UNITS.MINUTES)).toBe(0.5);
            expect(convertTimeUnits(0, TIME_UNITS.MINUTES)).toBe(0);
        });

        it("should convert seconds to hours correctly", () => {
            expect(convertTimeUnits(3600, TIME_UNITS.HOURS)).toBe(1);
            expect(convertTimeUnits(7200, TIME_UNITS.HOURS)).toBe(2);
            expect(convertTimeUnits(1800, TIME_UNITS.HOURS)).toBe(0.5);
            expect(convertTimeUnits(0, TIME_UNITS.HOURS)).toBe(0);
        });

        it("should return seconds unchanged when target unit is seconds", () => {
            expect(convertTimeUnits(3600, TIME_UNITS.SECONDS)).toBe(3600);
            expect(convertTimeUnits(100.5, TIME_UNITS.SECONDS)).toBe(100.5);
        });

        it("should handle unknown units with warning and return original value", () => {
            const result = convertTimeUnits(3600, "days");
            expect(result).toBe(3600);
            expect(mockConsole.warn).toHaveBeenCalledWith(
                "[convertTimeUnits] Unknown unit 'days', defaulting to seconds"
            );
        });

        it("should throw TypeError for non-numeric input", () => {
            expect(() => convertTimeUnits("3600" as any, TIME_UNITS.HOURS)).toThrow(TypeError);
            expect(() => convertTimeUnits(null as any, TIME_UNITS.HOURS)).toThrow(TypeError);
            expect(() => convertTimeUnits(undefined as any, TIME_UNITS.HOURS)).toThrow(TypeError);
            expect(() => convertTimeUnits(NaN, TIME_UNITS.HOURS)).toThrow(TypeError);
        });

        it("should handle negative time values with warning", () => {
            const result = convertTimeUnits(-3600, TIME_UNITS.HOURS);
            expect(result).toBe(-1);
            expect(mockConsole.warn).toHaveBeenCalledWith("[convertTimeUnits] Negative time value:", -3600);
        });

        it("should handle decimal time values correctly", () => {
            expect(convertTimeUnits(90, TIME_UNITS.MINUTES)).toBe(1.5);
            expect(convertTimeUnits(5400, TIME_UNITS.HOURS)).toBe(1.5);
        });

        it("should handle very large time values", () => {
            expect(convertTimeUnits(86400, TIME_UNITS.HOURS)).toBe(24);
            expect(convertTimeUnits(604800, TIME_UNITS.HOURS)).toBe(168);
        });
    });

    describe("convertArrayBufferToBase64", () => {
        it("should convert ArrayBuffer to base64 string correctly", () => {
            const buffer = new ArrayBuffer(4);
            const view = new Uint8Array(buffer);
            view[0] = 65; // 'A'
            view[1] = 66; // 'B'
            view[2] = 67; // 'C'
            view[3] = 68; // 'D'

            const result = convertArrayBufferToBase64(buffer);
            expect(result).toBe("QUJDRA==");
        });

        it("should handle empty ArrayBuffer", () => {
            const buffer = new ArrayBuffer(0);
            const result = convertArrayBufferToBase64(buffer);
            expect(result).toBe("");
        });

        it("should handle single byte ArrayBuffer", () => {
            const buffer = new ArrayBuffer(1);
            const view = new Uint8Array(buffer);
            view[0] = 65; // 'A'

            const result = convertArrayBufferToBase64(buffer);
            expect(result).toBe("QQ==");
        });

        it("should handle large ArrayBuffer (chunk processing)", () => {
            const size = 100000; // 100KB
            const buffer = new ArrayBuffer(size);
            const view = new Uint8Array(buffer);

            // Fill with pattern
            for (let i = 0; i < size; i++) {
                view[i] = i % 256;
            }

            const result = convertArrayBufferToBase64(buffer);
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);
            expect(typeof result).toBe("string");
        });

        it("should throw TypeError for non-ArrayBuffer input", () => {
            expect(() => convertArrayBufferToBase64("not an array buffer" as any)).toThrow(TypeError);
            expect(() => convertArrayBufferToBase64(null as any)).toThrow(TypeError);
            expect(() => convertArrayBufferToBase64(undefined as any)).toThrow(TypeError);
            expect(() => convertArrayBufferToBase64({} as any)).toThrow(TypeError);
            expect(() => convertArrayBufferToBase64([] as any)).toThrow(TypeError);
            expect(() => convertArrayBufferToBase64(new Uint8Array(4) as any)).toThrow(TypeError);
        });

        it("should handle ArrayBuffer with all zero bytes", () => {
            const buffer = new ArrayBuffer(4);
            // Uint8Array defaults to all zeros
            const result = convertArrayBufferToBase64(buffer);
            expect(result).toBe("AAAAAA==");
        });

        it("should handle ArrayBuffer with all 255 bytes", () => {
            const buffer = new ArrayBuffer(4);
            const view = new Uint8Array(buffer);
            view.fill(255);

            const result = convertArrayBufferToBase64(buffer);
            expect(result).toBe("/////w==");
        });
    });

    describe("convertValueToUserUnits", () => {
        beforeEach(() => {
            mockLocalStorage.getItem.mockClear();
        });

        describe("distance field conversion", () => {
            it("should convert distance to kilometers when user preference is kilometers", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                const result = convertValueToUserUnits(1000, "distance");
                expect(result).toBeCloseTo(1, 1);
                expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_distanceUnits");
            });

            it("should convert distance to miles when user preference is miles", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.MILES);
                const result = convertValueToUserUnits(1609.34, "distance");
                expect(result).toBeCloseTo(1, 2);
            });

            it("should convert altitude field as distance", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                const result = convertValueToUserUnits(1000, "altitude");
                expect(result).toBeCloseTo(1, 1);
            });

            it("should convert enhancedAltitude field as distance", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                const result = convertValueToUserUnits(1000, "enhancedAltitude");
                expect(result).toBeCloseTo(1, 1);
            });

            it("should default to kilometers when no user preference stored", () => {
                mockLocalStorage.getItem.mockReturnValue(null);
                const result = convertValueToUserUnits(1000, "distance");
                expect(result).toBeCloseTo(1, 1);
            });
        });

        describe("temperature field conversion", () => {
            it("should convert temperature to Fahrenheit when user preference is Fahrenheit", () => {
                mockLocalStorage.getItem.mockReturnValue(TEMPERATURE_UNITS.FAHRENHEIT);
                const result = convertValueToUserUnits(25, "temperature");
                expect(result).toBe(77);
                expect(mockLocalStorage.getItem).toHaveBeenCalledWith("chartjs_temperatureUnits");
            });

            it("should keep temperature in Celsius when user preference is Celsius", () => {
                mockLocalStorage.getItem.mockReturnValue(TEMPERATURE_UNITS.CELSIUS);
                const result = convertValueToUserUnits(25, "temperature");
                expect(result).toBe(25);
            });

            it("should default to Celsius when no user preference stored", () => {
                mockLocalStorage.getItem.mockReturnValue(null);
                const result = convertValueToUserUnits(25, "temperature");
                expect(result).toBe(25);
            });
        });

        describe("other fields (no conversion)", () => {
            it("should return original value for unknown fields", () => {
                const result = convertValueToUserUnits(100, "power");
                expect(result).toBe(100);
                expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
            });

            it("should return converted value for speed field (default km/h)", () => {
                const result = convertValueToUserUnits(50, "speed");
                expect(result).toBe(180);
            });

            it("should return original value for cadence field", () => {
                const result = convertValueToUserUnits(90, "cadence");
                expect(result).toBe(90);
            });
        });

        describe("error handling", () => {
            it("should handle non-numeric values gracefully", () => {
                mockConsole.warn.mockClear();
                const result = convertValueToUserUnits("not a number", "distance");
                expect(result).toBe("not a number");
                expect(mockConsole.warn).toHaveBeenCalledWith(
                    "[convertValueToUserUnits] Invalid value for field 'distance':",
                    "not a number"
                );
            });

            it("should handle NaN values gracefully", () => {
                mockConsole.warn.mockClear();
                const result = convertValueToUserUnits(NaN, "distance");
                expect(result).toBeNaN();
                expect(mockConsole.warn).toHaveBeenCalledWith(
                    "[convertValueToUserUnits] Invalid value for field 'distance':",
                    NaN
                );
            });

            it("should handle invalid field names gracefully", () => {
                mockConsole.warn.mockClear();
                const result = convertValueToUserUnits(100, "");
                expect(result).toBe(100);
                expect(mockConsole.warn).toHaveBeenCalledWith("[convertValueToUserUnits] Invalid field name:", "");
            });

            it("should handle null field names gracefully", () => {
                mockConsole.warn.mockClear();
                const result = convertValueToUserUnits(100, null as any);
                expect(result).toBe(100);
                expect(mockConsole.warn).toHaveBeenCalledWith("[convertValueToUserUnits] Invalid field name:", null);
            });

            it("should handle conversion errors gracefully", () => {
                // Mock localStorage to throw error
                mockLocalStorage.getItem.mockImplementation(() => {
                    throw new Error("Storage error");
                });

                mockConsole.error.mockClear();
                const result = convertValueToUserUnits(1000, "distance");
                expect(result).toBe(1); // Falls back to kilometers when settings access fails
            });
        });

        describe("edge cases", () => {
            it("should handle zero values correctly", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                expect(convertValueToUserUnits(0, "distance")).toBe(0);

                mockLocalStorage.getItem.mockReturnValue(TEMPERATURE_UNITS.FAHRENHEIT);
                expect(convertValueToUserUnits(0, "temperature")).toBe(32);
            });

            it("should handle negative values correctly", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                expect(convertValueToUserUnits(-1000, "distance")).toBeCloseTo(-1, 1);

                mockLocalStorage.getItem.mockReturnValue(TEMPERATURE_UNITS.FAHRENHEIT);
                expect(convertValueToUserUnits(-10, "temperature")).toBe(14);
            });

            it("should handle very large values correctly", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                expect(convertValueToUserUnits(1000000, "distance")).toBe(1000);
            });

            it("should handle very small decimal values correctly", () => {
                mockLocalStorage.getItem.mockReturnValue(DISTANCE_UNITS.KILOMETERS);
                expect(convertValueToUserUnits(0.001, "distance")).toBeCloseTo(0.000001, 6);
            });
        });
    });
});

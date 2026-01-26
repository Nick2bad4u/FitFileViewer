/**
 * Comprehensive test suite for getUnitSymbol utility function
 *
 * Tests the function that provides appropriate unit symbols for display based on
 * field types and user preferences stored in settings state. Supports distance,
 * temperature, speed, time, and various fitness metrics.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUnitSymbol } from "../../../utils/data/lookups/getUnitSymbol.js";
import { getChartSetting } from "../../../utils/state/domain/settingsStateManager.js";

vi.mock("../../../utils/state/domain/settingsStateManager.js", () => ({
    getChartSetting: vi.fn(),
}));

// Mock console for testing warnings and errors
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

describe("getUnitSymbol.js - Unit Symbol Utility", () => {
    let mockGetChartSetting: any;
    beforeEach(() => {
        mockGetChartSetting = vi.mocked(getChartSetting);
        mockGetChartSetting.mockReset();
        vi.clearAllMocks();
        (mockConsole.warn as any).mockClear();
        (mockConsole.error as any).mockClear();
    });

    afterEach(() => {
        // Additional cleanup after each test
        vi.clearAllMocks();
    });

    describe("Input Validation", () => {
        it("should return empty string for null field", () => {
            const result = getUnitSymbol(null as any);
            expect(result).toBe("");
            expect(mockConsole.warn).toHaveBeenCalledWith("[UnitSymbol] Invalid field parameter:", null);
        });

        it("should return empty string for undefined field", () => {
            const result = getUnitSymbol(undefined as any);
            expect(result).toBe("");
            expect(mockConsole.warn).toHaveBeenCalledWith("[UnitSymbol] Invalid field parameter:", undefined);
        });

        it("should return empty string for empty string field", () => {
            const result = getUnitSymbol("");
            expect(result).toBe("");
            expect(mockConsole.warn).toHaveBeenCalledWith("[UnitSymbol] Invalid field parameter:", "");
        });

        it("should return empty string for non-string field", () => {
            const result = getUnitSymbol(123 as any);
            expect(result).toBe("");
            expect(mockConsole.warn).toHaveBeenCalledWith("[UnitSymbol] Invalid field parameter:", 123);
        });

        it("should return empty string for array field", () => {
            const result = getUnitSymbol(["distance"] as any);
            expect(result).toBe("");
            expect(mockConsole.warn).toHaveBeenCalledWith("[UnitSymbol] Invalid field parameter:", ["distance"]);
        });

        it("should return empty string for object field", () => {
            const result = getUnitSymbol({ field: "distance" } as any);
            expect(result).toBe("");
            expect(mockConsole.warn).toHaveBeenCalledWith("[UnitSymbol] Invalid field parameter:", {
                field: "distance",
            });
        });
    });

    describe("Distance Fields", () => {
        describe("With Default Settings", () => {
            it("should return km symbol for distance field with default settings", () => {
                const result = getUnitSymbol("distance");
                expect(result).toBe("km");
            });

            it("should return km symbol for altitude field with default settings", () => {
                const result = getUnitSymbol("altitude");
                expect(result).toBe("km");
            });

            it("should return km symbol for enhancedAltitude field with default settings", () => {
                const result = getUnitSymbol("enhancedAltitude");
                expect(result).toBe("km");
            });
        });

        describe("With User Preferences", () => {
            it("should return meters symbol when user prefers meters", () => {
                mockGetChartSetting.mockReturnValue("meters");
                const result = getUnitSymbol("distance");
                expect(result).toBe("m");
            });

            it("should return feet symbol when user prefers feet", () => {
                mockGetChartSetting.mockReturnValue("feet");
                const result = getUnitSymbol("distance");
                expect(result).toBe("ft");
            });

            it("should return miles symbol when user prefers miles", () => {
                mockGetChartSetting.mockReturnValue("miles");
                const result = getUnitSymbol("distance");
                expect(result).toBe("mi");
            });

            it("should return kilometers symbol when user prefers kilometers", () => {
                mockGetChartSetting.mockReturnValue("kilometers");
                const result = getUnitSymbol("distance");
                expect(result).toBe("km");
            });
        });

        describe("With Invalid User Preferences", () => {
            it("should fallback to meters symbol for unknown distance unit", () => {
                mockGetChartSetting.mockReturnValue("lightyears");
                const result = getUnitSymbol("distance");
                expect(result).toBe("m"); // fallback to UNIT_SYMBOLS.DISTANCE.meters
            });

            it("should fallback to kilometers symbol for null distance unit", () => {
                mockGetChartSetting.mockReturnValue(null);
                const result = getUnitSymbol("distance");
                expect(result).toBe("km"); // fallback to default kilometers via getUserPreference
            });
        });
    });

    describe("Temperature Fields", () => {
        describe("With Default Settings", () => {
            it("should return celsius symbol for temperature field with default settings", () => {
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°C");
            });
        });

        describe("With User Preferences", () => {
            it("should return celsius symbol when user prefers celsius", () => {
                mockGetChartSetting.mockReturnValue("celsius");
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°C");
            });

            it("should return fahrenheit symbol when user prefers fahrenheit", () => {
                mockGetChartSetting.mockReturnValue("fahrenheit");
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°F");
            });
        });

        describe("With Invalid User Preferences", () => {
            it("should fallback to celsius symbol for unknown temperature unit", () => {
                mockGetChartSetting.mockReturnValue("kelvin");
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°C");
            });

            it("should fallback to celsius symbol for null temperature unit", () => {
                mockGetChartSetting.mockReturnValue(null);
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°C");
            });
        });
    });

    describe("Speed Fields", () => {
        it("should return km/h for speed field by default", () => {
            const result = getUnitSymbol("speed");
            expect(result).toBe("km/h");
        });

        it("should return km/h for enhancedSpeed field by default", () => {
            const result = getUnitSymbol("enhancedSpeed");
            expect(result).toBe("km/h");
        });

        it("should return mph for speed when distance unit is miles", () => {
            mockGetChartSetting.mockReturnValue("miles");
            const result = getUnitSymbol("speed");
            expect(result).toBe("mph");
        });
    });

    describe("Time Unit Context", () => {
        describe("With Default Settings", () => {
            it("should return seconds symbol for time unitType with default settings", () => {
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("s");
            });
        });

        describe("With User Preferences", () => {
            it("should return seconds symbol when user prefers seconds", () => {
                mockGetChartSetting.mockReturnValue("seconds");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("s");
            });

            it("should return minutes symbol when user prefers minutes", () => {
                mockGetChartSetting.mockReturnValue("minutes");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("min");
            });

            it("should return hours symbol when user prefers hours", () => {
                mockGetChartSetting.mockReturnValue("hours");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("h");
            });
        });

        describe("With Invalid User Preferences", () => {
            it("should fallback to seconds symbol for unknown time unit", () => {
                mockGetChartSetting.mockReturnValue("days");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("s");
            });

            it("should fallback to seconds symbol for null time unit", () => {
                mockGetChartSetting.mockReturnValue(null);
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("s");
            });
        });

        it("should prioritize time unitType over field-specific logic", () => {
            // Even for distance field, time unitType should take precedence
            const result = getUnitSymbol("distance", "time");
            expect(result).toBe("s");
        });
    });

    describe("Fitness Metrics Fields", () => {
        it("should return bpm for heartRate field", () => {
            const result = getUnitSymbol("heartRate");
            expect(result).toBe("bpm");
        });

        it("should return W for power field", () => {
            const result = getUnitSymbol("power");
            expect(result).toBe("W");
        });

        it("should return rpm for cadence field", () => {
            const result = getUnitSymbol("cadence");
            expect(result).toBe("rpm");
        });

        it("should return empty string for resistance field", () => {
            const result = getUnitSymbol("resistance");
            expect(result).toBe("");
        });

        it("should return # for flow field", () => {
            const result = getUnitSymbol("flow");
            expect(result).toBe("#");
        });

        it("should return # for grit field", () => {
            const result = getUnitSymbol("grit");
            expect(result).toBe("#");
        });

        it("should return ° for positionLat field", () => {
            const result = getUnitSymbol("positionLat");
            expect(result).toBe("°");
        });

        it("should return ° for positionLong field", () => {
            const result = getUnitSymbol("positionLong");
            expect(result).toBe("°");
        });
    });

    describe("Unknown Fields", () => {
        it("should return empty string for completely unknown field", () => {
            const result = getUnitSymbol("unknownField");
            expect(result).toBe("");
        });

        it("should return empty string for custom field", () => {
            const result = getUnitSymbol("customMetric");
            expect(result).toBe("");
        });

        it("should return empty string for misspelled known field", () => {
            const result = getUnitSymbol("distanc"); // missing 'e'
            expect(result).toBe("");
        });
    });

    describe("Settings Error Handling", () => {
        beforeEach(() => {
            // Mock settings access to throw errors
            mockGetChartSetting.mockImplementation(() => {
                throw new Error("settings access denied");
            });
        });

        it("should handle settings errors gracefully for distance fields", () => {
            const result = getUnitSymbol("distance");
            expect(result).toBe("km"); // Should fallback to default kilometers
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading setting "distanceUnits":',
                expect.any(Error)
            );
        });

        it("should handle settings errors gracefully for temperature fields", () => {
            const result = getUnitSymbol("temperature");
            expect(result).toBe("°C"); // Should fallback to celsius
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading setting "temperatureUnits":',
                expect.any(Error)
            );
        });

        it("should handle settings errors gracefully for time context", () => {
            const result = getUnitSymbol("anyField", "time");
            expect(result).toBe("s"); // Should fallback to seconds
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading setting "timeUnits":',
                expect.any(Error)
            );
        });
    });

    describe("Function Error Handling", () => {
        it("should handle and log unexpected errors", () => {
            mockGetChartSetting.mockImplementation(() => {
                throw new Error("Unexpected error");
            });

            const result = getUnitSymbol("distance");

            // Should still return a value (default) because error is in try-catch
            expect(result).toBe("km"); // Still returns default value
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading setting "distanceUnits":',
                expect.any(Error)
            );
        });
    });

    describe("Edge Cases", () => {
        it("should handle whitespace-only field names", () => {
            const result = getUnitSymbol("   ");
            expect(result).toBe(""); // Whitespace-only field doesn't match any known fields
            // No console warning expected since it's a valid string, just doesn't match any field types
        });

        it("should handle field names with different casing", () => {
            const result = getUnitSymbol("DISTANCE");
            expect(result).toBe(""); // Case sensitive, should not match
        });

        it("should handle field names with special characters", () => {
            const result = getUnitSymbol("distance@#$");
            expect(result).toBe(""); // Should not match any known fields
        });

        it("should handle very long field names", () => {
            const longFieldName = "a".repeat(1000);
            const result = getUnitSymbol(longFieldName);
            expect(result).toBe("");
        });

        it("should handle unicode field names", () => {
            const result = getUnitSymbol("дистанция"); // Russian for distance
            expect(result).toBe("");
        });
    });

    describe("Combined Scenarios", () => {
        it("should correctly handle distance field with multiple preference types set", () => {
            mockGetChartSetting.mockImplementation((key: string) => {
                if (key === "distanceUnits") return "miles";
                if (key === "temperatureUnits") return "fahrenheit";
                if (key === "timeUnits") return "hours";
                return undefined;
            });

            const result = getUnitSymbol("distance");
            expect(result).toBe("mi"); // Should use distance preference
        });

        it("should correctly handle time context with multiple preference types set", () => {
            mockGetChartSetting.mockImplementation((key: string) => {
                if (key === "distanceUnits") return "miles";
                if (key === "temperatureUnits") return "fahrenheit";
                if (key === "timeUnits") return "hours";
                return undefined;
            });

            const result = getUnitSymbol("distance", "time");
            expect(result).toBe("h"); // Should use time preference, not distance
        });

        it("should handle multiple calls with different fields efficiently", () => {
            mockGetChartSetting.mockImplementation((key: string) => {
                if (key === "distanceUnits") return "kilometers";
                if (key === "temperatureUnits") return "celsius";
                return undefined;
            });

            const results = [
                getUnitSymbol("distance"),
                getUnitSymbol("temperature"),
                getUnitSymbol("speed"),
                getUnitSymbol("heartRate"),
                getUnitSymbol("unknownField"),
            ];

            expect(results).toEqual(["km", "°C", "km/h", "bpm", ""]);
        });
    });
});

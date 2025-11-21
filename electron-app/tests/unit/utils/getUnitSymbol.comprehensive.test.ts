/**
 * Comprehensive test suite for getUnitSymbol utility function
 *
 * Tests the function that provides appropriate unit symbols for display based on
 * field types and user preferences stored in localStorage. Supports distance,
 * temperature, speed, time, and various fitness metrics.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUnitSymbol } from "../../../utils/data/lookups/getUnitSymbol.js";

// Mock localStorage for testing
const mockLocalStorage = {
    store: new Map(),
    getItem: vi.fn((key) => mockLocalStorage.store.get(key) || null),
    setItem: vi.fn((key, value) => mockLocalStorage.store.set(key, value)),
    removeItem: vi.fn((key) => mockLocalStorage.store.delete(key)),
    clear: vi.fn(() => mockLocalStorage.store.clear()),
};

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

// Setup global mocks
Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
});

// Setup comprehensive console mocking
globalThis.console = mockConsole;
global.console = mockConsole;

describe("getUnitSymbol.js - Unit Symbol Utility", () => {
    beforeEach(() => {
        // Clear localStorage and console mocks before each test
        mockLocalStorage.store.clear();
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
                mockLocalStorage.store.set("chartjs_distanceUnits", "meters");
                const result = getUnitSymbol("distance");
                expect(result).toBe("m");
            });

            it("should return feet symbol when user prefers feet", () => {
                mockLocalStorage.store.set("chartjs_distanceUnits", "feet");
                const result = getUnitSymbol("distance");
                expect(result).toBe("ft");
            });

            it("should return miles symbol when user prefers miles", () => {
                mockLocalStorage.store.set("chartjs_distanceUnits", "miles");
                const result = getUnitSymbol("distance");
                expect(result).toBe("mi");
            });

            it("should return kilometers symbol when user prefers kilometers", () => {
                mockLocalStorage.store.set("chartjs_distanceUnits", "kilometers");
                const result = getUnitSymbol("distance");
                expect(result).toBe("km");
            });
        });

        describe("With Invalid User Preferences", () => {
            it("should fallback to meters symbol for unknown distance unit", () => {
                mockLocalStorage.store.set("chartjs_distanceUnits", "lightyears");
                const result = getUnitSymbol("distance");
                expect(result).toBe("m"); // fallback to UNIT_SYMBOLS.DISTANCE.meters
            });

            it("should fallback to kilometers symbol for null distance unit", () => {
                mockLocalStorage.store.set("chartjs_distanceUnits", null);
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
                mockLocalStorage.store.set("chartjs_temperatureUnits", "celsius");
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°C");
            });

            it("should return fahrenheit symbol when user prefers fahrenheit", () => {
                mockLocalStorage.store.set("chartjs_temperatureUnits", "fahrenheit");
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°F");
            });
        });

        describe("With Invalid User Preferences", () => {
            it("should fallback to celsius symbol for unknown temperature unit", () => {
                mockLocalStorage.store.set("chartjs_temperatureUnits", "kelvin");
                const result = getUnitSymbol("temperature");
                expect(result).toBe("°C");
            });

            it("should fallback to celsius symbol for null temperature unit", () => {
                mockLocalStorage.store.set("chartjs_temperatureUnits", null);
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
            mockLocalStorage.store.set("chartjs_distanceUnits", "miles");
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
                mockLocalStorage.store.set("chartjs_timeUnits", "seconds");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("s");
            });

            it("should return minutes symbol when user prefers minutes", () => {
                mockLocalStorage.store.set("chartjs_timeUnits", "minutes");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("min");
            });

            it("should return hours symbol when user prefers hours", () => {
                mockLocalStorage.store.set("chartjs_timeUnits", "hours");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("h");
            });
        });

        describe("With Invalid User Preferences", () => {
            it("should fallback to seconds symbol for unknown time unit", () => {
                mockLocalStorage.store.set("chartjs_timeUnits", "days");
                const result = getUnitSymbol("anyField", "time");
                expect(result).toBe("s");
            });

            it("should fallback to seconds symbol for null time unit", () => {
                mockLocalStorage.store.set("chartjs_timeUnits", null);
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

    describe("localStorage Error Handling", () => {
        beforeEach(() => {
            // Mock localStorage to throw errors
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("localStorage access denied");
            });
        });

        it("should handle localStorage errors gracefully for distance fields", () => {
            const result = getUnitSymbol("distance");
            expect(result).toBe("km"); // Should fallback to default kilometers
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading localStorage key "chartjs_distanceUnits":',
                expect.any(Error)
            );
        });

        it("should handle localStorage errors gracefully for temperature fields", () => {
            const result = getUnitSymbol("temperature");
            expect(result).toBe("°C"); // Should fallback to celsius
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading localStorage key "chartjs_temperatureUnits":',
                expect.any(Error)
            );
        });

        it("should handle localStorage errors gracefully for time context", () => {
            const result = getUnitSymbol("anyField", "time");
            expect(result).toBe("s"); // Should fallback to seconds
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading localStorage key "chartjs_timeUnits":',
                expect.any(Error)
            );
        });
    });

    describe("Function Error Handling", () => {
        it("should handle and log unexpected errors", () => {
            // Mock the field parameter to cause an error
            const originalGetItem = mockLocalStorage.getItem;
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error("Unexpected error");
            });

            const result = getUnitSymbol("distance");

            // Should still return a value (default) because error is in try-catch
            expect(result).toBe("km"); // Still returns default value
            expect(mockConsole.warn).toHaveBeenCalledWith(
                '[UnitSymbol] Error reading localStorage key "chartjs_distanceUnits":',
                expect.any(Error)
            );

            // Restore original implementation
            mockLocalStorage.getItem.mockImplementation(originalGetItem);
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
            mockLocalStorage.store.set("chartjs_distanceUnits", "miles");
            mockLocalStorage.store.set("chartjs_temperatureUnits", "fahrenheit");
            mockLocalStorage.store.set("chartjs_timeUnits", "hours");

            const result = getUnitSymbol("distance");
            expect(result).toBe("mi"); // Should use distance preference
        });

        it("should correctly handle time context with multiple preference types set", () => {
            mockLocalStorage.store.set("chartjs_distanceUnits", "miles");
            mockLocalStorage.store.set("chartjs_temperatureUnits", "fahrenheit");
            mockLocalStorage.store.set("chartjs_timeUnits", "hours");

            const result = getUnitSymbol("distance", "time");
            expect(result).toBe("h"); // Should use time preference, not distance
        });

        it("should handle multiple calls with different fields efficiently", () => {
            mockLocalStorage.store.set("chartjs_distanceUnits", "kilometers");
            mockLocalStorage.store.set("chartjs_temperatureUnits", "celsius");

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

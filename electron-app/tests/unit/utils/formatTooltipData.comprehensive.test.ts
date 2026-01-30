/**
 * Comprehensive test coverage for tooltip data formatting with FIT file data
 * points
 *
 * Tests the formatTooltipData utility function that formats complete tooltip
 * HTML strings for display on maps and charts. Handles various FIT file data
 * points including altitude, heart rate, speed, power, cadence, distance, and
 * timing information.
 *
 * Coverage Target: 95-100% line coverage with comprehensive edge case testing
 *
 * @file FormatTooltipData.comprehensive.test.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the state manager
vi.mock("../../../utils/state/core/stateManager.js", () => ({
    getState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
}));

describe("formatTooltipData.js - Tooltip Data HTML Formatting", () => {
    let formatTooltipData;
    let mockGetState;

    beforeEach(async () => {
        // Clear all mocks
        vi.clearAllMocks();

        // Import the function after mocks are set up
        const module =
            await import("../../../utils/formatting/display/formatTooltipData.js");
        formatTooltipData = module.formatTooltipData;

        // Get mock references
        mockGetState = (
            await import("../../../utils/state/core/stateManager.js")
        ).getState;

        // Set up default mock returns
        mockGetState.mockReturnValue([]);
    });

    describe("Basic Tooltip Formatting", () => {
        describe("Standard Data Points", () => {
            it("should format basic tooltip with lap and index", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                    heartRate: 150,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> 10");
                expect(result).toContain("<b>Time:</b>");
                expect(result).toContain("<b>Alt:</b> 100.0 m / 328 ft");
                expect(result).toContain("<b>HR:</b> 150.0 bpm");
            });

            it("should format tooltip with all standard metrics", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 250.5,
                    heartRate: 165,
                    speed: 8.33, // ~30 km/h
                    power: 200,
                    cadence: 85,
                    distance: 5000,
                };

                const result = formatTooltipData(50, row, 2);

                expect(result).toContain("<b>Lap:</b> 2");
                expect(result).toContain("<b>Index:</b> 50");
                expect(result).toContain("<b>Alt:</b> 250.5 m / 822 ft");
                expect(result).toContain("<b>HR:</b> 165.0 bpm");
                expect(result).toContain("<b>Speed:</b> 30.0 km/h / 18.6 mph");
                expect(result).toContain("<b>Power:</b> 200.0 W");
                expect(result).toContain("<b>Cadence:</b> 85.0 rpm");
                expect(result).toContain("<b>Distance:</b>");
            });

            it("should handle partial data gracefully", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    speed: 5.56, // ~20 km/h
                };

                const result = formatTooltipData(25, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> 25");
                expect(result).toContain("<b>Speed:</b> 20.0 km/h / 12.4 mph");
                expect(result).not.toContain("<b>Alt:</b>");
                expect(result).not.toContain("<b>HR:</b>");
            });

            it("should omit fields when values are non-numeric", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    cadence: "bad",
                    heart_rate: "bad",
                    power: "bad",
                    distance: "bad",
                };

                const result = formatTooltipData(3, row, 1);

                expect(result).not.toContain("<b>Cadence:</b>");
                expect(result).not.toContain("<b>HR:</b>");
                expect(result).not.toContain("<b>Power:</b>");
                expect(result).not.toContain("<b>Distance:</b>");
            });

            it("should show estimated power when power is missing", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    estimatedPower: 199.9,
                };

                const result = formatTooltipData(1, row, 1);

                expect(result).toContain("<b>Est. Power:</b> 200 W");
                expect(result).not.toContain("<b>Power:</b>");
            });

            it("should prefer real power over estimated power when both exist", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    power: 250,
                    estimatedPower: 999,
                };

                const result = formatTooltipData(2, row, 1);

                expect(result).toContain("<b>Power:</b> 250.0 W");
                expect(result).not.toContain("Est. Power");
            });
        });

        describe("Edge Case Values", () => {
            it("should handle zero values correctly", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 0,
                    heartRate: 0,
                    speed: 0,
                    power: 0,
                    cadence: 0,
                    distance: 0,
                };

                const result = formatTooltipData(0, row, 1);

                expect(result).toContain("<b>Alt:</b> 0.0 m / 0 ft");
                expect(result).toContain("<b>HR:</b> 0.0 bpm");
                expect(result).toContain("<b>Speed:</b> 0.0 km/h / 0.0 mph");
                expect(result).toContain("<b>Power:</b> 0.0 W");
                expect(result).toContain("<b>Cadence:</b> 0.0 rpm");
            });

            it("should handle negative altitude values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: -50.3,
                };

                const result = formatTooltipData(15, row, 1);

                expect(result).toContain("<b>Alt:</b> -50.3 m / -165 ft");
            });

            it("should handle very large values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 8848, // Mount Everest
                    heartRate: 220,
                    speed: 50, // Very fast cycling
                    power: 1500, // Pro cyclist sprint
                    distance: 999999,
                };

                const result = formatTooltipData(999, row, 10);

                expect(result).toContain("<b>Alt:</b> 8848.0 m / 29029 ft");
                expect(result).toContain("<b>HR:</b> 220.0 bpm");
                expect(result).toContain(
                    "<b>Speed:</b> 180.0 km/h / 111.8 mph"
                );
                expect(result).toContain("<b>Power:</b> 1500.0 W");
            });

            it("should handle decimal precision correctly", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 123.456,
                    heartRate: 145.789,
                    speed: 12.345,
                    power: 234.567,
                    cadence: 87.123,
                };

                const result = formatTooltipData(100, row, 3);

                expect(result).toContain("<b>Alt:</b> 123.5 m / 405 ft");
                expect(result).toContain("<b>HR:</b> 145.8 bpm");
                expect(result).toContain("<b>Speed:</b> 44.4 km/h / 27.6 mph");
                expect(result).toContain("<b>Power:</b> 234.6 W");
                expect(result).toContain("<b>Cadence:</b> 87.1 rpm");
            });
        });
    });

    describe("Input Validation and Error Handling", () => {
        describe("Invalid Row Data", () => {
            it("should handle null row data", () => {
                const result = formatTooltipData(10, null, 1);

                expect(result).toBe("No data available");
            });

            it("should handle undefined row data", () => {
                const result = formatTooltipData(10, undefined, 1);

                expect(result).toBe("No data available");
            });

            it("should handle empty object row data", () => {
                const result = formatTooltipData(10, {}, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> 10");
                expect(result).not.toContain("<b>Time:</b>");
            });

            it("should handle non-object row data", () => {
                const result = formatTooltipData(10, "invalid" as any, 1);

                expect(result).toBe("No data available");
            });

            it("should handle array as row data", () => {
                const result = formatTooltipData(10, [] as any, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> 10");
            });
        });

        describe("Invalid Field Values", () => {
            it("should handle null field values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: null,
                    heartRate: null,
                    speed: null,
                    power: null,
                    cadence: null,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> 10");
                expect(result).not.toContain("<b>Alt:</b>");
                expect(result).not.toContain("<b>HR:</b>");
                expect(result).not.toContain("<b>Speed:</b>");
            });

            it("should handle undefined field values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: undefined,
                    heartRate: undefined,
                    speed: undefined,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).not.toContain("<b>Alt:</b>");
                expect(result).not.toContain("<b>HR:</b>");
            });

            it("should handle NaN field values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: NaN,
                    heartRate: NaN,
                    speed: NaN,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).not.toContain("<b>Alt:</b>");
                expect(result).not.toContain("<b>HR:</b>");
            });

            it("should handle infinite field values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: Infinity,
                    heartRate: -Infinity,
                    speed: Number.POSITIVE_INFINITY,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).not.toContain("<b>Alt:</b>");
                expect(result).not.toContain("<b>HR:</b>");
            });

            it("should handle string field values", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: "100" as any,
                    heartRate: "invalid" as any,
                    speed: "5.5" as any,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Alt:</b> 100.0 m / 328 ft");
                expect(result).not.toContain("<b>HR:</b>"); // 'invalid' should be filtered out
                expect(result).toContain("<b>Speed:</b> 19.8 km/h / 12.3 mph");
            });
        });

        describe("Invalid Parameters", () => {
            it("should handle null index", () => {
                const row = { timestamp: new Date("2023-01-01T10:00:00Z") };

                const result = formatTooltipData(null as any, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> null");
            });

            it("should handle undefined index", () => {
                const row = { timestamp: new Date("2023-01-01T10:00:00Z") };

                const result = formatTooltipData(undefined as any, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> undefined");
            });

            it("should handle negative index", () => {
                const row = { timestamp: new Date("2023-01-01T10:00:00Z") };

                const result = formatTooltipData(-5, row, 1);

                expect(result).toContain("<b>Index:</b> -5");
            });

            it("should handle null lap number", () => {
                const row = { timestamp: new Date("2023-01-01T10:00:00Z") };

                const result = formatTooltipData(10, row, null as any);

                expect(result).toContain("<b>Lap:</b> null");
            });
        });
    });

    describe("Timestamp and Time Formatting", () => {
        describe("Timestamp Handling", () => {
            it("should format valid timestamp", () => {
                const row = {
                    timestamp: new Date("2023-06-15T14:30:45Z"),
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Time:</b>");
                expect(result).toContain("2023");
            });

            it("should handle null timestamp", () => {
                const row = {
                    timestamp: null,
                    altitude: 100,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).not.toContain("<b>Time:</b>");
                expect(result).toContain("<b>Alt:</b>");
            });

            it("should handle undefined timestamp", () => {
                const row = {
                    timestamp: undefined,
                    heartRate: 150,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).not.toContain("<b>Time:</b>");
                expect(result).toContain("<b>HR:</b>");
            });

            it("should handle invalid timestamp string", () => {
                const row = {
                    timestamp: "invalid-date" as any,
                    power: 200,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Power:</b>");
            });
        });

        describe("Ride Time Calculation", () => {
            it("should calculate ride time with record messages", () => {
                const recordMesgs = [
                    { timestamp: new Date("2023-01-01T10:00:00Z") },
                    { timestamp: new Date("2023-01-01T10:01:00Z") },
                    { timestamp: new Date("2023-01-01T10:02:00Z") },
                ];
                mockGetState.mockReturnValue(recordMesgs);

                const row = {
                    timestamp: new Date("2023-01-01T10:02:00Z"),
                    altitude: 100,
                };

                const result = formatTooltipData(2, row, 1);

                expect(result).toContain("<b>Elapsed Time:</b>");
                expect(result).toContain("2 minutes");
            });

            it("should handle missing record messages", () => {
                mockGetState.mockReturnValue(null);

                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Alt:</b>");
                expect(result).not.toContain("<b>Elapsed Time:</b>");
            });

            it("should handle empty record messages array", () => {
                mockGetState.mockReturnValue([]);

                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).not.toContain("<b>Elapsed Time:</b>");
            });

            it("should use record messages override parameter", () => {
                const recordMesgsOverride = [
                    { timestamp: new Date("2023-01-01T10:00:00Z") },
                    { timestamp: new Date("2023-01-01T10:01:30Z") },
                ];

                const row = {
                    timestamp: new Date("2023-01-01T10:01:30Z"),
                    speed: 10,
                };

                const result = formatTooltipData(
                    1,
                    row,
                    1,
                    recordMesgsOverride
                );

                expect(result).toContain("<b>Elapsed Time:</b>");
                expect(result).toContain("1 minute, 30 seconds");
            });

            it("should include hours when elapsed time exceeds 1 hour", () => {
                const recordMesgsOverride = [
                    { timestamp: new Date("2023-01-01T10:00:00Z") },
                ];

                const row = {
                    timestamp: new Date("2023-01-01T11:02:03Z"),
                    altitude: 100,
                };

                const result = formatTooltipData(
                    1,
                    row,
                    1,
                    recordMesgsOverride
                );

                expect(result).toContain("<b>Elapsed Time:</b>");
                expect(result).toContain("1 hour");
                expect(result).toContain("2 minutes");
                expect(result).toContain("3 seconds");
            });

            it("should omit elapsed time when no valid first timestamp exists", () => {
                const recordMesgsOverride = [
                    { timestamp: null },
                    { timestamp: undefined },
                ];

                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                };

                const result = formatTooltipData(
                    1,
                    row,
                    1,
                    recordMesgsOverride
                );

                expect(result).not.toContain("<b>Elapsed Time:</b>");
            });

            it("should omit elapsed time when current timestamp is invalid", () => {
                const recordMesgsOverride = [
                    { timestamp: new Date("2023-01-01T10:00:00Z") },
                ];

                const row = {
                    timestamp: "not-a-date",
                    altitude: 100,
                };

                const result = formatTooltipData(
                    1,
                    row,
                    1,
                    recordMesgsOverride
                );

                expect(result).not.toContain("<b>Elapsed Time:</b>");
            });

            it("should not throw if record timestamp getter throws during elapsed time lookup", () => {
                /** @type {Record<string, number>} */
                const badRecord = {};
                Object.defineProperty(badRecord, "timestamp", {
                    get: () => {
                        throw new Error("boom");
                    },
                });

                const recordMesgsOverride = [badRecord];
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                };

                expect(() =>
                    formatTooltipData(1, row, 1, recordMesgsOverride)
                ).not.toThrow();
            });
        });

        describe("Tooltip Formatting Resilience", () => {
            it("should return an error message if tooltip formatting throws", () => {
                const row = { altitude: 100 };
                Object.defineProperty(row, "timestamp", {
                    get: () => {
                        throw new Error("timestamp getter failure");
                    },
                });

                const result = formatTooltipData(1, row, 1);
                expect(result).toContain("Error loading data");
            });
        });
    });

    describe("Distance Formatting", () => {
        describe("Distance Conversion", () => {
            it("should format distance in kilometers and miles", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    distance: 5000, // 5 km
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Distance:</b>");
                expect(result).toContain("5.00 km");
                expect(result).toContain("3.11 mi");
            });

            it("should handle small distances", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    distance: 100, // 100 meters
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Distance:</b>");
                expect(result).toContain("0.10 km");
                expect(result).toContain("0.06 mi");
            });

            it("should handle large distances", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    distance: 100000, // 100 km
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Distance:</b>");
                expect(result).toContain("100.00 km");
                expect(result).toContain("62.14 mi");
            });

            it("should handle zero distance", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    distance: 0,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Distance:</b>");
                expect(result).toContain("0.00 km");
                expect(result).toContain("0.00 mi");
            });
        });
    });

    describe("HTML Structure and Formatting", () => {
        describe("HTML Output Structure", () => {
            it("should use proper HTML structure with bold labels", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                    heartRate: 150,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Lap:</b>");
                expect(result).toContain("<b>Index:</b>");
                expect(result).toContain("<b>Time:</b>");
                expect(result).toContain("<b>Alt:</b>");
                expect(result).toContain("<b>HR:</b>");
                expect(result.split("<br>").length).toBeGreaterThan(1);
            });

            it("should join multiple fields with <br> tags", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                    heartRate: 150,
                    speed: 10,
                };

                const result = formatTooltipData(10, row, 1);

                const parts = result.split("<br>");
                expect(parts.length).toBeGreaterThanOrEqual(5);
                expect(parts[0]).toContain("<b>Lap:</b>");
                expect(parts[1]).toContain("<b>Index:</b>");
            });

            it("should handle distance formatting with <br> removal", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    distance: 5000,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Distance:</b>");
                // Distance should not contain nested <br> tags
                const distancePart = result
                    .split("<br>")
                    .find((part) => part.includes("<b>Distance:</b>"));
                expect(distancePart).toBeDefined();
                expect(distancePart?.split("<br>").length).toBe(1);
            });
        });
    });

    describe("State Management Integration", () => {
        describe("Global State Access", () => {
            it("should call getState for record messages", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                };

                formatTooltipData(10, row, 1);

                expect(mockGetState).toHaveBeenCalledWith(
                    "globalData.recordMesgs"
                );
            });

            it("should fallback to window.globalData if state manager fails", () => {
                mockGetState.mockReturnValue(null);

                const originalWindow = global.window;
                global.window = {
                    globalData: {
                        recordMesgs: [
                            { timestamp: new Date("2023-01-01T10:00:00Z") },
                        ],
                    },
                } as any;

                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                };

                const result = formatTooltipData(10, row, 1);

                expect(result).toContain("<b>Alt:</b>");

                global.window = originalWindow;
            });
        });
    });

    describe("Performance and Edge Cases", () => {
        describe("Performance Characteristics", () => {
            it("should handle rapid successive calls efficiently", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                    heartRate: 150,
                };

                const startTime = performance.now();
                for (let i = 0; i < 100; i++) {
                    formatTooltipData(i, row, 1);
                }
                const endTime = performance.now();

                expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
            });

            it("should be consistent across multiple calls with same input", () => {
                const row = {
                    timestamp: new Date("2023-01-01T10:00:00Z"),
                    altitude: 100,
                    heartRate: 150,
                };

                const result1 = formatTooltipData(10, row, 1);
                const result2 = formatTooltipData(10, row, 1);
                const result3 = formatTooltipData(10, row, 1);

                expect(result1).toBe(result2);
                expect(result2).toBe(result3);
            });
        });

        describe("Real-world Data Scenarios", () => {
            it("should handle typical cycling workout data", () => {
                const row = {
                    timestamp: new Date("2023-06-15T14:30:45Z"),
                    altitude: 245.8,
                    heartRate: 155,
                    speed: 8.89, // ~32 km/h
                    power: 285,
                    cadence: 88,
                    distance: 12500, // 12.5 km
                };

                const result = formatTooltipData(458, row, 3);

                expect(result).toContain("<b>Lap:</b> 3");
                expect(result).toContain("<b>Index:</b> 458");
                expect(result).toContain("<b>Alt:</b> 245.8 m / 806 ft");
                expect(result).toContain("<b>HR:</b> 155.0 bpm");
                expect(result).toContain("<b>Speed:</b> 32.0 km/h / 19.9 mph");
                expect(result).toContain("<b>Power:</b> 285.0 W");
                expect(result).toContain("<b>Cadence:</b> 88.0 rpm");
                expect(result).toContain("<b>Distance:</b>");
            });

            it("should handle running workout data without power/cadence", () => {
                const row = {
                    timestamp: new Date("2023-06-15T07:15:30Z"),
                    altitude: 125.2,
                    heartRate: 165,
                    speed: 3.33, // ~12 km/h running pace
                    distance: 5000, // 5 km
                };

                const result = formatTooltipData(125, row, 1);

                expect(result).toContain("<b>Lap:</b> 1");
                expect(result).toContain("<b>Index:</b> 125");
                expect(result).toContain("<b>HR:</b> 165.0 bpm");
                expect(result).toContain("<b>Speed:</b> 12.0 km/h / 7.4 mph");
                expect(result).not.toContain("<b>Power:</b>");
                expect(result).not.toContain("<b>Cadence:</b>");
            });

            it("should handle GPS-only data with minimal metrics", () => {
                const row = {
                    timestamp: new Date("2023-06-15T16:45:12Z"),
                    altitude: 892.3,
                    distance: 25000, // 25 km
                };

                const result = formatTooltipData(890, row, 5);

                expect(result).toContain("<b>Lap:</b> 5");
                expect(result).toContain("<b>Index:</b> 890");
                expect(result).toContain("<b>Alt:</b> 892.3 m / 2927 ft");
                expect(result).toContain("<b>Distance:</b>");
                expect(result).not.toContain("<b>HR:</b>");
                expect(result).not.toContain("<b>Speed:</b>");
            });
        });
    });
});

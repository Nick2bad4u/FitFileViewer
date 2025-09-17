/**
 * @fileoverview Comprehensive test suite for getLapNumForIdx.js
 * @description Tests lap number determination from data point indices
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLapNumForIdx } from "../../../utils/data/processing/getLapNumForIdx.js";

describe("getLapNumForIdx.js - Lap Number Lookup Utility", () => {
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Spy on console methods for testing logging
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe("Basic Lap Number Lookup", () => {
        it("should return correct lap number for index in first lap", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(50, lapMesgs)).toBe(1);
        });

        it("should return correct lap number for index in second lap", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
        });

        it("should return correct lap number for index at lap boundary start", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(100, lapMesgs)).toBe(2);
        });

        it("should return correct lap number for index at lap boundary end", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(99, lapMesgs)).toBe(1);
        });

        it("should return null for index not in any lap", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(250, lapMesgs)).toBeNull();
        });

        it("should handle single lap correctly", () => {
            const lapMesgs = [{ start_index: 0, end_index: 999 }];
            expect(getLapNumForIdx(500, lapMesgs)).toBe(1);
        });

        it("should return null for index below first lap range", () => {
            const lapMesgs = [
                { start_index: 100, end_index: 199 },
                { start_index: 200, end_index: 299 },
            ];
            expect(getLapNumForIdx(50, lapMesgs)).toBeNull();
        });

        it("should return null for index between laps", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 200, end_index: 299 },
            ];
            expect(getLapNumForIdx(150, lapMesgs)).toBeNull();
        });
    });

    describe("Input Validation and Error Handling", () => {
        it("should return null for negative index", () => {
            const lapMesgs = [{ start_index: 0, end_index: 99 }];
            expect(getLapNumForIdx(-1, lapMesgs)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Invalid index: must be a non-negative finite number, got -1"
            );
        });

        it("should return null for non-numeric index", () => {
            const lapMesgs = [{ start_index: 0, end_index: 99 }];
            expect(getLapNumForIdx("abc" as any, lapMesgs)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Invalid index: must be a non-negative finite number, got abc"
            );
        });

        it("should return null for NaN index", () => {
            const lapMesgs = [{ start_index: 0, end_index: 99 }];
            expect(getLapNumForIdx(NaN, lapMesgs)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Invalid index: must be a non-negative finite number, got NaN"
            );
        });

        it("should return null for Infinity index", () => {
            const lapMesgs = [{ start_index: 0, end_index: 99 }];
            expect(getLapNumForIdx(Infinity, lapMesgs)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Invalid index: must be a non-negative finite number, got Infinity"
            );
        });

        it("should return null for null lapMesgs", () => {
            expect(getLapNumForIdx(50, null as any)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] Invalid lapMesgs: must be an array, got object");
        });

        it("should return null for undefined lapMesgs", () => {
            expect(getLapNumForIdx(50, undefined as any)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Invalid lapMesgs: must be an array, got undefined"
            );
        });

        it("should return null for non-array lapMesgs", () => {
            expect(getLapNumForIdx(50, "not an array" as any)).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] Invalid lapMesgs: must be an array, got string");
        });

        it("should return null for empty lapMesgs array", () => {
            expect(getLapNumForIdx(50, [])).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] lapMesgs array is empty");
        });
    });

    describe("Lap Message Validation", () => {
        it("should skip invalid lap objects", () => {
            const lapMesgs = [null, { start_index: 100, end_index: 199 }] as any;
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            // Note: null laps are silently skipped without warning
        });

        it("should skip laps missing start_index", () => {
            const lapMesgs = [{ end_index: 99 }, { start_index: 100, end_index: 199 }] as any;
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Lap at index 0 missing numeric start_index or end_index:",
                { end_index: 99 }
            );
        });

        it("should skip laps missing end_index", () => {
            const lapMesgs = [{ start_index: 0 }, { start_index: 100, end_index: 199 }] as any;
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Lap at index 0 missing numeric start_index or end_index:",
                { start_index: 0 }
            );
        });

        it("should skip laps with non-numeric indices", () => {
            const lapMesgs = [
                { start_index: "abc", end_index: 99 },
                { start_index: 100, end_index: 199 },
            ] as any;
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Lap at index 0 missing numeric start_index or end_index:",
                { start_index: "abc", end_index: 99 }
            );
        });

        it("should skip laps with negative start_index", () => {
            const lapMesgs = [
                { start_index: -10, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] Lap at index 0 has negative indices:", {
                start_index: -10,
                end_index: 99,
            });
        });

        it("should skip laps with negative end_index", () => {
            const lapMesgs = [
                { start_index: 0, end_index: -10 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] Lap at index 0 has negative indices:", {
                start_index: 0,
                end_index: -10,
            });
        });

        it("should skip laps with start_index > end_index", () => {
            const lapMesgs = [
                { start_index: 100, end_index: 50 },
                { start_index: 200, end_index: 299 },
            ];
            expect(getLapNumForIdx(250, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] Lap at index 0 has start_index > end_index:", {
                start_index: 100,
                end_index: 50,
            });
        });

        it("should handle lap objects with additional properties", () => {
            const lapMesgs = [
                {
                    start_index: 0,
                    end_index: 99,
                    total_elapsed_time: 1000,
                    total_timer_time: 950,
                    total_distance: 5000,
                },
            ];
            expect(getLapNumForIdx(50, lapMesgs)).toBe(1);
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle zero index correctly", () => {
            const lapMesgs = [{ start_index: 0, end_index: 99 }];
            expect(getLapNumForIdx(0, lapMesgs)).toBe(1);
        });

        it("should handle large indices correctly", () => {
            const lapMesgs = [{ start_index: 1000000, end_index: 2000000 }];
            expect(getLapNumForIdx(1500000, lapMesgs)).toBe(1);
        });

        it("should handle laps with same start and end index", () => {
            const lapMesgs = [{ start_index: 100, end_index: 100 }];
            expect(getLapNumForIdx(100, lapMesgs)).toBe(1);
        });

        it("should handle overlapping laps (returns first match)", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 150 },
                { start_index: 100, end_index: 199 },
            ];
            expect(getLapNumForIdx(125, lapMesgs)).toBe(1);
        });

        it("should handle many laps efficiently", () => {
            const lapMesgs = Array.from({ length: 1000 }, (_, i) => ({
                start_index: i * 100,
                end_index: (i + 1) * 100 - 1,
            }));
            expect(getLapNumForIdx(50050, lapMesgs)).toBe(501);
        });

        it("should handle floating point indices by truncating", () => {
            const lapMesgs = [{ start_index: 0, end_index: 99 }];
            expect(getLapNumForIdx(50.7, lapMesgs)).toBe(1);
        });

        it("should handle all invalid laps gracefully", () => {
            const lapMesgs = [
                null,
                { start_index: "invalid", end_index: 99 },
                { start_index: -1, end_index: 50 },
            ] as any;
            expect(getLapNumForIdx(50, lapMesgs)).toBeNull();
        });
    });

    describe("Real-world Usage Scenarios", () => {
        it("should handle typical cycling activity lap structure", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 1799 }, // 30 minute lap
                { start_index: 1800, end_index: 3599 }, // 30 minute lap
                { start_index: 3600, end_index: 5399 }, // 30 minute lap
                { start_index: 5400, end_index: 7199 }, // 30 minute lap
            ];

            expect(getLapNumForIdx(900, lapMesgs)).toBe(1); // 15 minutes into first lap
            expect(getLapNumForIdx(2700, lapMesgs)).toBe(2); // 15 minutes into second lap
            expect(getLapNumForIdx(4500, lapMesgs)).toBe(3); // 15 minutes into third lap
            expect(getLapNumForIdx(6300, lapMesgs)).toBe(4); // 15 minutes into fourth lap
        });

        it("should handle GPS track with varying lap lengths", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 599 }, // 10 minute warmup
                { start_index: 600, end_index: 1799 }, // 20 minute main set
                { start_index: 1800, end_index: 2999 }, // 20 minute main set
                { start_index: 3000, end_index: 3299 }, // 5 minute cooldown
            ];

            expect(getLapNumForIdx(300, lapMesgs)).toBe(1); // Warmup
            expect(getLapNumForIdx(1200, lapMesgs)).toBe(2); // Main set 1
            expect(getLapNumForIdx(2400, lapMesgs)).toBe(3); // Main set 2
            expect(getLapNumForIdx(3150, lapMesgs)).toBe(4); // Cooldown
        });

        it("should handle activity with manual lap splits", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 1234 },
                { start_index: 1235, end_index: 2456 },
                { start_index: 2457, end_index: 3678 },
                { start_index: 3679, end_index: 4890 },
            ];

            expect(getLapNumForIdx(1234, lapMesgs)).toBe(1);
            expect(getLapNumForIdx(1235, lapMesgs)).toBe(2);
            expect(getLapNumForIdx(2456, lapMesgs)).toBe(2);
            expect(getLapNumForIdx(2457, lapMesgs)).toBe(3);
        });

        it("should handle sparse lap coverage with gaps", () => {
            const lapMesgs = [
                { start_index: 100, end_index: 299 },
                { start_index: 500, end_index: 699 },
                { start_index: 1000, end_index: 1199 },
            ];

            expect(getLapNumForIdx(50, lapMesgs)).toBeNull(); // Before first lap
            expect(getLapNumForIdx(200, lapMesgs)).toBe(1); // In first lap
            expect(getLapNumForIdx(400, lapMesgs)).toBeNull(); // Gap between laps
            expect(getLapNumForIdx(600, lapMesgs)).toBe(2); // In second lap
            expect(getLapNumForIdx(800, lapMesgs)).toBeNull(); // Gap between laps
            expect(getLapNumForIdx(1100, lapMesgs)).toBe(3); // In third lap
            expect(getLapNumForIdx(1500, lapMesgs)).toBeNull(); // After last lap
        });
    });

    describe("Performance and Consistency", () => {
        it("should handle rapid successive calls efficiently", () => {
            const lapMesgs = Array.from({ length: 100 }, (_, i) => ({
                start_index: i * 1000,
                end_index: (i + 1) * 1000 - 1,
            }));

            const startTime = performance.now();
            for (let i = 0; i < 1000; i++) {
                getLapNumForIdx(i * 50, lapMesgs);
            }
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
        });

        it("should be consistent across multiple calls", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 999 },
                { start_index: 1000, end_index: 1999 },
            ];

            const results = Array.from({ length: 10 }, () => getLapNumForIdx(500, lapMesgs));
            expect(results.every((result) => result === 1)).toBe(true);
        });

        it("should not modify input data", () => {
            const originalLapMesgs = [
                { start_index: 0, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ];
            const lapMesgsCopy = JSON.parse(JSON.stringify(originalLapMesgs));

            getLapNumForIdx(50, lapMesgsCopy);
            expect(lapMesgsCopy).toEqual(originalLapMesgs);
        });

        it("should handle large datasets efficiently", () => {
            const lapMesgs = Array.from({ length: 10000 }, (_, i) => ({
                start_index: i * 100,
                end_index: (i + 1) * 100 - 1,
            }));

            const startTime = performance.now();
            const result = getLapNumForIdx(500000, lapMesgs);
            const endTime = performance.now();

            expect(result).toBe(5001);
            expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
        });
    });

    describe("Error Handling and Recovery", () => {
        it("should handle thrown exceptions gracefully", () => {
            // Create a lap object that will cause an error during processing
            const problematicLapMesgs = [
                {
                    get start_index() {
                        throw new Error("Property access error");
                    },
                    end_index: 99,
                },
            ] as any;

            expect(getLapNumForIdx(50, problematicLapMesgs)).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[LapLookup] Error determining lap number for index 50:",
                expect.any(Error)
            );
        });

        it("should handle corrupted lap data gracefully", () => {
            const lapMesgs = [
                { start_index: 0, end_index: 99 },
                "corrupted data",
                { start_index: 200, end_index: 299 },
            ] as any;

            expect(getLapNumForIdx(50, lapMesgs)).toBe(1);
            expect(getLapNumForIdx(250, lapMesgs)).toBe(3);
            expect(consoleWarnSpy).toHaveBeenCalledWith("[LapLookup] Invalid lap object at index 1:", "corrupted data");
        });
    });

    describe("Type Safety and Field Validation", () => {
        it("should handle lap objects with extra numeric properties", () => {
            const lapMesgs = [
                {
                    start_index: 0,
                    end_index: 99,
                    extra_field: 12345,
                    another_field: "string_value",
                },
            ];
            expect(getLapNumForIdx(50, lapMesgs)).toBe(1);
        });

        it("should handle lap objects with undefined indices gracefully", () => {
            const lapMesgs = [
                { start_index: undefined, end_index: 99 },
                { start_index: 100, end_index: 199 },
            ] as any;
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Lap at index 0 missing numeric start_index or end_index:",
                { start_index: undefined, end_index: 99 }
            );
        });

        it("should handle lap objects with null indices gracefully", () => {
            const lapMesgs = [
                { start_index: 0, end_index: null },
                { start_index: 100, end_index: 199 },
            ] as any;
            expect(getLapNumForIdx(150, lapMesgs)).toBe(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[LapLookup] Lap at index 0 missing numeric start_index or end_index:",
                { start_index: 0, end_index: null }
            );
        });
    });
});

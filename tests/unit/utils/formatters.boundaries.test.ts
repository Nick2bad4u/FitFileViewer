// Covers shared formatter boundary behavior with representative unit, invalid,
// and edge-case inputs.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDistance } from "../../../electron-app/utils/formatting/formatters/formatDistance.js";
import { formatTime } from "../../../electron-app/utils/formatting/formatters/formatTime.js";
import { formatWeight } from "../../../electron-app/utils/formatting/formatters/formatWeight.js";
import { formatHeight } from "../../../electron-app/utils/formatting/formatters/formatHeight.js";

describe("formatter boundary behavior", () => {
    beforeEach(() => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe(formatDistance, () => {
        describe("dual unit formatting", () => {
            it("should format distance with both km and miles correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(1000);
                expect(result).toBe("1.00 km / 0.62 mi");
                expect(result).not.toBe("");
            });

            it("should format small distances correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(500);
                expect(result).toBe("0.50 km / 0.31 mi");
            });

            it("should handle decimal inputs correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(1234);
                expect(result).toBe("1.23 km / 0.77 mi");
            });

            it("should handle very large distances correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(100000);
                expect(result).toBe("100.00 km / 62.14 mi");
            });

            it("should handle exact mile equivalents", () => {
                expect.hasAssertions();

                const result = formatDistance(1609.34);
                expect(result).toBe("1.61 km / 1.00 mi");
            });
        });

        describe("error handling", () => {
            it("should return empty string for non-numeric input", () => {
                expect.hasAssertions();

                const result = formatDistance("invalid" as any);
                expect(result).toBe("");
            });

            it("should handle negative distances gracefully", () => {
                expect.hasAssertions();

                const result = formatDistance(-100);
                expect(result).toBe("");
            });

            it("should handle NaN input correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(NaN);
                expect(result).toBe("");
            });

            it("should handle Infinity input correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(Infinity);
                expect(result).toBe("");
            });

            it("should handle null/undefined input", () => {
                expect.hasAssertions();

                expect(formatDistance(null as any)).toBe("");
                expect(formatDistance(undefined as any)).toBe("");
            });
        });

        describe("edge cases", () => {
            it("should handle zero distance correctly", () => {
                expect.hasAssertions();

                const result = formatDistance(0);
                expect(result).toBe(""); // Function validates and rejects 0
                expect(result).not.toContain("km");
            });

            it("should handle very small positive distances", () => {
                expect.hasAssertions();

                const result = formatDistance(0.1);
                expect(result).toBe("0.00 km / 0.00 mi");
            });

            it("should maintain precision for large distances", () => {
                expect.hasAssertions();

                const result = formatDistance(50000);
                expect(result).toBe("50.00 km / 31.07 mi");
            });
        });
    });

    describe(formatTime, () => {
        describe("basic time formatting", () => {
            it("should format time in MM:SS format for values under an hour", () => {
                expect.hasAssertions();

                const result = formatTime(125, false);
                expect(result).toBe("2:05");
                expect(result).not.toBe("0:00");
            });

            it("should format time in HH:MM:SS format for values over an hour", () => {
                expect.hasAssertions();

                const result = formatTime(3665, false);
                expect(result).toBe("1:01:05");
            });

            it("should pad single digits with zeros", () => {
                expect.hasAssertions();

                const result = formatTime(65, false);
                expect(result).toBe("1:05");
            });

            it("should handle exact minute boundaries", () => {
                expect.hasAssertions();

                const result = formatTime(120, false);
                expect(result).toBe("2:00");
            });

            it("should handle exact hour boundaries", () => {
                expect.hasAssertions();

                const result = formatTime(3600, false);
                expect(result).toBe("1:00:00");
            });
        });

        describe("user units formatting", () => {
            it("should use user units when requested", () => {
                expect.hasAssertions();

                // Mock localStorage for user preferences
                Object.defineProperty(window, "localStorage", {
                    value: {
                        getItem: vi
                            .fn<Storage["getItem"]>()
                            .mockReturnValue("hours"),
                        setItem: vi.fn<Storage["setItem"]>(),
                    },
                    writable: true,
                });

                const result = formatTime(3600, true);
                expect(result).toContain("h"); // Should contain hours unit
                expect(result).not.toBe("1:00:00");
            });

            it("should fallback to MM:SS when user units not available", () => {
                expect.hasAssertions();

                Object.defineProperty(window, "localStorage", {
                    value: {
                        getItem: vi
                            .fn<Storage["getItem"]>()
                            .mockReturnValue(null),
                        setItem: vi.fn<Storage["setItem"]>(),
                    },
                    writable: true,
                });

                const result = formatTime(125, true);
                expect(result).toBe("2:05");
            });
        });

        describe("error handling", () => {
            it("should handle non-numeric input gracefully", () => {
                expect.hasAssertions();

                const result = formatTime("invalid" as any);
                expect(result).toBe("0:00"); // Function handles gracefully
            });

            it("should handle NaN input gracefully", () => {
                expect.hasAssertions();

                const result = formatTime(NaN);
                expect(result).toBe("0:00");
            });

            it("should handle negative time with warning", () => {
                expect.hasAssertions();

                const result = formatTime(-30);
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatTime] Negative time value:",
                    -30
                );
                expect(result).toBe("0:00");
            });

            it("should handle Infinity input gracefully", () => {
                expect.hasAssertions();

                const result = formatTime(Infinity);
                expect(result).toBe("0:00");
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatTime] Invalid seconds value:",
                    Infinity
                );
            });

            it("should handle negative Infinity input gracefully", () => {
                expect.hasAssertions();

                const result = formatTime(-Infinity);
                expect(result).toBe("0:00");
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatTime] Invalid seconds value:",
                    -Infinity
                );
            });
        });

        describe("edge cases", () => {
            it("should handle zero time correctly", () => {
                expect.hasAssertions();

                const result = formatTime(0);
                expect(result).toBe("0:00");
                expect(result).not.toBe("");
            });

            it("should handle decimal seconds correctly", () => {
                expect.hasAssertions();

                const result = formatTime(125.7);
                expect(result).toBe("2:05"); // Should round down
            });

            it("should handle very large time values", () => {
                expect.hasAssertions();

                const result = formatTime(359999); // Almost 100 hours
                expect(result).toBe("99:59:59");
            });
        });
    });

    describe(formatWeight, () => {
        describe("basic weight formatting", () => {
            it("should format weight with kg and pounds correctly", () => {
                expect.hasAssertions();

                const result = formatWeight(70);
                expect(result).toBe("70 kg (154 lbs)");
                expect(result).not.toBe("");
            });

            it("should handle decimal weights correctly", () => {
                expect.hasAssertions();

                const result = formatWeight(70.5);
                expect(result).toBe("70.5 kg (155 lbs)");
            });

            it("should round pounds to nearest integer", () => {
                expect.hasAssertions();

                const result = formatWeight(68.2);
                expect(result).toContain("(150 lbs)"); // Should round 150.3 to 150
            });
        });

        describe("error handling", () => {
            it("should return empty string for non-numeric input", () => {
                expect.hasAssertions();

                const result = formatWeight("invalid" as any);
                expect(result).toBe("");
            });

            it("should return empty string for NaN input", () => {
                expect.hasAssertions();

                const result = formatWeight(NaN);
                expect(result).toBe("");
            });

            it("should return empty string for Infinity input", () => {
                expect.hasAssertions();

                const result = formatWeight(Infinity);
                expect(result).toBe("");
            });

            it("should handle negative weight with warning", () => {
                expect.hasAssertions();

                const result = formatWeight(-10);
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatWeight] Negative weight value:",
                    -10
                );
                expect(result).toBe("");
            });
        });

        describe("edge cases", () => {
            it("should handle zero weight correctly", () => {
                expect.hasAssertions();

                const result = formatWeight(0);
                expect(result).toBe("0 kg (0 lbs)");
                expect(result).not.toBe("");
            });

            it("should handle very small positive weights", () => {
                expect.hasAssertions();

                const result = formatWeight(0.1);
                expect(result).toBe("0.1 kg (0 lbs)");
            });

            it("should handle very large weights correctly", () => {
                expect.hasAssertions();

                const result = formatWeight(1000);
                expect(result).toBe("1000 kg (2205 lbs)");
            });
        });
    });

    describe(formatHeight, () => {
        describe("dual unit formatting", () => {
            it("should format height in meters and feet correctly", () => {
                expect.hasAssertions();

                const result = formatHeight(1.75);
                expect(result).toBe("1.75 m (5'9\")");
                expect(result).not.toBe("");
            });

            it("should handle tall heights correctly", () => {
                expect.hasAssertions();

                const result = formatHeight(2.1);
                expect(result).toBe("2.10 m (6'11\")");
            });

            it("should format short heights correctly", () => {
                expect.hasAssertions();

                const result = formatHeight(1.5);
                expect(result).toBe("1.50 m (4'11\")");
            });
        });

        describe("error handling", () => {
            it("should handle non-numeric input gracefully", () => {
                expect.hasAssertions();

                const result = formatHeight("invalid" as any);
                expect(result).toBe("");
            });

            it("should handle negative height with warning", () => {
                expect.hasAssertions();

                const result = formatHeight(-1.5);
                expect(console.warn).toHaveBeenCalledWith(
                    "[formatHeight] Negative height value:",
                    -1.5
                );
                expect(result).toBe("");
            });

            it("should handle NaN input correctly", () => {
                expect.hasAssertions();

                const result = formatHeight(NaN);
                expect(result).toBe("");
            });

            it("should handle very tall heights without warning", () => {
                expect.hasAssertions();

                const result = formatHeight(10); // 10 meters tall
                expect(result).toBe("10.00 m (32'10\")"); // No warning in actual function
            });
        });

        describe("edge cases", () => {
            it("should handle zero height correctly", () => {
                expect.hasAssertions();

                const result = formatHeight(0);
                expect(result).toBe("0.00 m (0'0\")");
            });

            it("should handle very short heights correctly", () => {
                expect.hasAssertions();

                const result = formatHeight(0.5);
                expect(result).toBe("0.50 m (1'8\")");
            });

            it("should handle typical human height range", () => {
                expect.hasAssertions();

                const heights = [
                    1.5,
                    1.65,
                    1.8,
                    1.95,
                ];
                heights.forEach((height) => {
                    const result = formatHeight(height);
                    expect(result).toContain("m");
                    expect(result).toContain('"');
                    expect(result).not.toBe("");
                });
            });
        });
    });

    describe("integration tests", () => {
        it("should handle chained formatting operations", () => {
            expect.hasAssertions();

            const distance = formatDistance(5000);
            const time = formatTime(1800);
            const weight = formatWeight(75);
            const height = formatHeight(1.8);

            expect(distance).toBe("5.00 km / 3.11 mi");
            expect(time).toBe("30:00");
            expect(weight).toBe("75 kg (165 lbs)");
            expect(height).toBe("1.80 m (5'11\")");
            expect(distance).not.toBe("");
        });

        it("should handle all formatters with null inputs gracefully", () => {
            expect.hasAssertions();

            expect(formatDistance(null as any)).toBe("");
            expect(formatTime(null as any)).toBe("0:00");
            expect(formatWeight(null as any)).toBe("");
            expect(formatHeight(null as any)).toBe("");
        });

        it("should handle all formatters with undefined inputs gracefully", () => {
            expect.hasAssertions();

            expect(formatDistance(undefined as any)).toBe("");
            expect(formatTime(undefined as any)).toBe("0:00");
            expect(formatWeight(undefined as any)).toBe("");
            expect(formatHeight(undefined as any)).toBe("");
        });

        it("should maintain consistent number handling", () => {
            expect.hasAssertions();

            // All formatters should handle zero appropriately for their domain
            expect(formatDistance(1)).toBe("0.00 km / 0.00 mi"); // Very small distance
            expect(formatTime(1)).toBe("0:01"); // 1 second
            expect(formatWeight(1)).toBe("1 kg (2 lbs)"); // 1 kg
            expect(formatHeight(1)).toBe("1.00 m (3'3\")"); // 1 meter
        });
    });
});

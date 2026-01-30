/**
 * @file Comprehensive test suite for formatTime.js utility
 *
 *   Tests all aspects of the time formatting utility including:
 *
 *   - Input validation and error handling
 *   - Time string formatting (MM:SS, HH:MM:SS)
 *   - User units integration with settings state
 *   - Dependency mocking (convertTimeUnits)
 *   - Edge cases and boundary conditions
 *   - Real-world time scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getChartSetting } from "../../../utils/state/domain/settingsStateManager.js";

// Mock the convertTimeUnits dependency
vi.mock("../../../utils/formatting/converters/convertTimeUnits.js", () => ({
    TIME_UNITS: {
        SECONDS: "seconds",
        MINUTES: "minutes",
        HOURS: "hours",
    },
    convertTimeUnits: vi.fn(),
}));

vi.mock("../../../utils/state/domain/settingsStateManager.js", () => ({
    getChartSetting: vi.fn(),
}));

import { formatTime } from "../../../utils/formatting/formatters/formatTime.js";
import { convertTimeUnits } from "../../../utils/formatting/converters/convertTimeUnits.js";

describe("formatTime.js - Time Formatter Utility", () => {
    let consoleSpy: any;
    let mockGetChartSetting: any;

    beforeEach(() => {
        mockGetChartSetting = vi.mocked(getChartSetting);

        consoleSpy = {
            warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
            error: vi.spyOn(console, "error").mockImplementation(() => {}),
        };

        // Reset all mocks
        vi.clearAllMocks();
        mockGetChartSetting.mockReturnValue(undefined);
        (convertTimeUnits as any).mockReturnValue(0);
    });

    afterEach(() => {
        consoleSpy.warn.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe("Input Validation", () => {
        it('should return "0:00" for null input and log warning', () => {
            const result = formatTime(null as any);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                null
            );
        });

        it('should return "0:00" for undefined input and log warning', () => {
            const result = formatTime(undefined as any);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                undefined
            );
        });

        it('should return "0:00" for string input and log warning', () => {
            const result = formatTime("60" as any);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                "60"
            );
        });

        it('should return "0:00" for boolean input and log warning', () => {
            const result = formatTime(true as any);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                true
            );
        });

        it('should return "0:00" for object input and log warning', () => {
            const result = formatTime({} as any);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                {}
            );
        });

        it('should return "0:00" for array input and log warning', () => {
            const result = formatTime([60] as any);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                [60]
            );
        });

        it('should return "0:00" for NaN input and log warning', () => {
            const result = formatTime(NaN);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Invalid seconds value:",
                NaN
            );
        });

        it('should return "0:00" for negative number and log warning', () => {
            const result = formatTime(-60);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Negative time value:",
                -60
            );
        });

        it("should handle positive infinity gracefully", () => {
            const result = formatTime(Infinity);
            // Infinity is a valid number, should process through but might fail in formatting
            expect(typeof result).toBe("string");
        });

        it("should handle negative infinity and log warning", () => {
            const result = formatTime(-Infinity);
            expect(result).toBe("0:00");
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                "[formatTime] Negative time value:",
                -Infinity
            );
        });
    });

    describe("Basic Time String Formatting (Default Mode)", () => {
        it("should format zero seconds correctly", () => {
            expect(formatTime(0)).toBe("0:00");
        });

        it("should format single digit seconds with padding", () => {
            expect(formatTime(5)).toBe("0:05");
        });

        it("should format double digit seconds without padding", () => {
            expect(formatTime(30)).toBe("0:30");
        });

        it("should format exactly 60 seconds as 1 minute", () => {
            expect(formatTime(60)).toBe("1:00");
        });

        it("should format 90 seconds correctly", () => {
            expect(formatTime(90)).toBe("1:30");
        });

        it("should format 3599 seconds (just under 1 hour)", () => {
            expect(formatTime(3599)).toBe("59:59");
        });

        it("should format exactly 3600 seconds as 1 hour", () => {
            expect(formatTime(3600)).toBe("1:00:00");
        });

        it("should format 3661 seconds correctly", () => {
            expect(formatTime(3661)).toBe("1:01:01");
        });

        it("should format large time values", () => {
            expect(formatTime(36000)).toBe("10:00:00"); // 10 hours
        });

        it("should handle decimal seconds by flooring", () => {
            expect(formatTime(90.7)).toBe("1:30");
            expect(formatTime(90.9)).toBe("1:30");
        });
    });

    describe("User Units Mode", () => {
        describe("With Seconds Units", () => {
            beforeEach(() => {
                mockGetChartSetting.mockReturnValue("seconds");
            });

            it("should format time as MM:SS when user prefers seconds", () => {
                expect(formatTime(90, true)).toBe("1:30");
            });

            it("should format time as HH:MM:SS when over 1 hour and user prefers seconds", () => {
                expect(formatTime(3661, true)).toBe("1:01:01");
            });
        });

        describe("With Minutes Units", () => {
            beforeEach(() => {
                mockGetChartSetting.mockReturnValue("minutes");
                (convertTimeUnits as any).mockReturnValue(1.5);
            });

            it("should use convertTimeUnits and format with minutes suffix", () => {
                const result = formatTime(90, true);
                expect(convertTimeUnits).toHaveBeenCalledWith(90, "minutes");
                expect(result).toBe("1.5m");
            });

            it("should format to 1 decimal place for minutes", () => {
                (convertTimeUnits as any).mockReturnValue(2.33333);
                const result = formatTime(140, true);
                expect(result).toBe("2.3m");
            });
        });

        describe("With Hours Units", () => {
            beforeEach(() => {
                mockGetChartSetting.mockReturnValue("hours");
                (convertTimeUnits as any).mockReturnValue(1.02);
            });

            it("should use convertTimeUnits and format with hours suffix", () => {
                const result = formatTime(3672, true);
                expect(convertTimeUnits).toHaveBeenCalledWith(3672, "hours");
                expect(result).toBe("1.02h");
            });

            it("should format to 2 decimal places for hours", () => {
                (convertTimeUnits as any).mockReturnValue(2.5555);
                const result = formatTime(9200, true);
                expect(result).toBe("2.56h");
            });
        });

        describe("With No Stored Setting", () => {
            beforeEach(() => {
                mockGetChartSetting.mockReturnValue(undefined);
            });

            it("should default to seconds mode when no stored setting", () => {
                const result = formatTime(90, true);
                expect(result).toBe("1:30");
            });
        });

        describe("With Invalid Stored Setting", () => {
            beforeEach(() => {
                mockGetChartSetting.mockReturnValue("invalid");
            });

            it("should default to MM:SS format for unknown units", () => {
                const result = formatTime(90, true);
                expect(result).toBe("1:30");
            });
        });
    });

    describe("Edge Cases and Boundary Conditions", () => {
        it("should handle very large numbers", () => {
            const result = formatTime(359999); // 99:59:59
            expect(result).toBe("99:59:59");
        });

        it("should handle very small positive numbers", () => {
            expect(formatTime(0.1)).toBe("0:00");
            expect(formatTime(0.9)).toBe("0:00");
        });

        it("should handle exact minute boundaries", () => {
            expect(formatTime(119)).toBe("1:59"); // 1 minute 59 seconds
            expect(formatTime(120)).toBe("2:00"); // 2 minutes exactly
        });

        it("should handle exact hour boundaries", () => {
            expect(formatTime(3599)).toBe("59:59"); // 59:59
            expect(formatTime(3600)).toBe("1:00:00"); // 1:00:00
            expect(formatTime(3601)).toBe("1:00:01"); // 1:00:01
        });

        it("should handle extreme values gracefully", () => {
            const result = formatTime(Number.MAX_SAFE_INTEGER);
            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("Padding and Format Consistency", () => {
        it("should pad single digit minutes and seconds with zeros", () => {
            expect(formatTime(65)).toBe("1:05"); // 1 minute 5 seconds
            expect(formatTime(605)).toBe("10:05"); // 10 minutes 5 seconds
        });

        it("should pad single digit hours, minutes, and seconds", () => {
            expect(formatTime(3665)).toBe("1:01:05"); // 1:01:05
        });

        it("should not pad hours (can be any number of digits)", () => {
            expect(formatTime(360000)).toBe("100:00:00"); // 100 hours
        });

        it("should maintain consistent format structure", () => {
            const results = [
                30,
                90,
                3661,
                36000,
            ].map((s) => formatTime(s));
            results.forEach((result) => {
                expect(result).toMatch(/^\d+:\d{2}(:\d{2})?$/);
            });
        });
    });

    describe("Real-world Time Scenarios", () => {
        it("should format common workout durations", () => {
            expect(formatTime(300)).toBe("5:00"); // 5-minute warm-up
            expect(formatTime(1800)).toBe("30:00"); // 30-minute run
            expect(formatTime(2700)).toBe("45:00"); // 45-minute cycling
        });

        it("should format race times", () => {
            expect(formatTime(1234)).toBe("20:34"); // 5K race time
            expect(formatTime(2580)).toBe("43:00"); // 10K race time
            expect(formatTime(9180)).toBe("2:33:00"); // Marathon time
        });

        it("should format interval training times", () => {
            expect(formatTime(30)).toBe("0:30"); // Sprint interval
            expect(formatTime(120)).toBe("2:00"); // Recovery interval
            expect(formatTime(240)).toBe("4:00"); // Work interval
        });

        it("should format ultra-endurance times", () => {
            expect(formatTime(18000)).toBe("5:00:00"); // 5-hour ride
            expect(formatTime(43200)).toBe("12:00:00"); // 12-hour event
        });
    });

    describe("Error Handling", () => {
        it("should catch and handle formatting errors gracefully", () => {
            // Mock Math.floor to throw an error
            const originalFloor = Math.floor;
            Math.floor = vi.fn().mockImplementation(() => {
                throw new Error("Math error");
            });

            const result = formatTime(3661);
            expect(result).toBe("0:00");
            expect(consoleSpy.error).toHaveBeenCalledWith(
                "[formatTime] Time formatting failed:",
                expect.any(Error)
            );

            // Restore original function
            Math.floor = originalFloor;
        });

        it("should handle settings errors in user units mode", () => {
            mockGetChartSetting.mockImplementation(() => {
                throw new Error("settings error");
            });

            const result = formatTime(90, true);
            expect(result).toBe("0:00");
            expect(consoleSpy.error).toHaveBeenCalled();
        });

        it("should handle convertTimeUnits errors gracefully", () => {
            mockGetChartSetting.mockReturnValue("minutes");
            (convertTimeUnits as any).mockImplementation(() => {
                throw new Error("Conversion error");
            });

            const result = formatTime(90, true);
            expect(result).toBe("0:00");
            expect(consoleSpy.error).toHaveBeenCalled();
        });
    });

    describe("Performance and Consistency", () => {
        it("should handle rapid successive calls", () => {
            const times = [
                30,
                90,
                3661,
                7200,
                10000,
            ];
            const results = times.map((t) => formatTime(t));

            expect(results).toHaveLength(5);
            expect(results[0]).toBe("0:30");
            expect(results[1]).toBe("1:30");
            expect(results[2]).toBe("1:01:01");
            expect(results[3]).toBe("2:00:00");
            expect(results[4]).toBe("2:46:40");
        });

        it("should be consistent across multiple calls", () => {
            const time = 3661;
            const result1 = formatTime(time);
            const result2 = formatTime(time);
            const result3 = formatTime(time);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it("should handle batch processing efficiently", () => {
            const times = Array.from({ length: 100 }, (_, i) => i * 60);
            const results = times.map((t) => formatTime(t));

            expect(results).toHaveLength(100);
            expect(results.every((r) => typeof r === "string")).toBe(true);
        });

        it("should handle mixed mode calls efficiently", () => {
            const time = 3661;
            const defaultResult = formatTime(time);
            const userUnitsResult = formatTime(time, true);

            expect(defaultResult).toBe("1:01:01");
            expect(typeof userUnitsResult).toBe("string");
        });
    });

    describe("Settings Integration", () => {
        it("should call getChartSetting with correct key", () => {
            formatTime(90, true);
            expect(mockGetChartSetting).toHaveBeenCalledWith("timeUnits");
        });

        it("should handle settings returning different unit types", () => {
            const testCases = [
                { units: "seconds", expected: "1:30" },
                { units: "minutes", expected: "1.5m" },
                { units: "hours", expected: "1.50h" },
            ];

            testCases.forEach(({ units, expected }) => {
                mockGetChartSetting.mockReturnValue(units);
                if (units === "minutes") {
                    (convertTimeUnits as any).mockReturnValue(1.5);
                } else if (units === "hours") {
                    (convertTimeUnits as any).mockReturnValue(1.5);
                }

                const result = formatTime(90, true);
                expect(result).toBe(expected);
            });
        });

        it("should only call getChartSetting when useUserUnits is true", () => {
            formatTime(90, false);
            expect(mockGetChartSetting).not.toHaveBeenCalled();

            formatTime(90, true);
            expect(mockGetChartSetting).toHaveBeenCalled();
        });
    });
});

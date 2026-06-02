import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDistance } from "../../../electron-app/utils/formatting/formatters/formatDistance.js";
import { formatHeight } from "../../../electron-app/utils/formatting/formatters/formatHeight.js";
import { formatTime } from "../../../electron-app/utils/formatting/formatters/formatTime.js";
import { formatWeight } from "../../../electron-app/utils/formatting/formatters/formatWeight.js";

type FormatterCase = {
    readonly expected: string;
    readonly input: unknown;
    readonly label: string;
};

describe("formatter boundary behavior", () => {
    beforeEach(() => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe(formatDistance, () => {
        it("formats representative positive meter values as metric and imperial distance", () => {
            expect.hasAssertions();

            const cases: FormatterCase[] = [
                {
                    expected: "1.00 km / 0.62 mi",
                    input: 1000,
                    label: "one kilometer",
                },
                {
                    expected: "0.50 km / 0.31 mi",
                    input: 500,
                    label: "small distance",
                },
                {
                    expected: "1.23 km / 0.77 mi",
                    input: 1234,
                    label: "decimal kilometer rounding",
                },
                {
                    expected: "100.00 km / 62.14 mi",
                    input: 100_000,
                    label: "large distance",
                },
                {
                    expected: "1.61 km / 1.00 mi",
                    input: 1609.34,
                    label: "mile equivalent",
                },
                {
                    expected: "0.00 km / 0.00 mi",
                    input: 0.1,
                    label: "sub-meter positive distance",
                },
            ];
            for (const { expected, input } of cases) {
                expect(formatDistance(input)).toBe(expected);
            }
        });

        it("returns an empty string for invalid or non-positive distances", () => {
            expect.hasAssertions();

            const cases: FormatterCase[] = [
                { expected: "", input: "invalid", label: "string input" },
                { expected: "", input: -100, label: "negative distance" },
                { expected: "", input: Number.NaN, label: "NaN" },
                { expected: "", input: Infinity, label: "Infinity" },
                { expected: "", input: null, label: "null" },
                { expected: "", input: undefined, label: "undefined" },
                { expected: "", input: 0, label: "zero" },
            ];
            for (const { expected, input } of cases) {
                expect(formatDistance(input)).toBe(expected);
            }
        });
    });

    describe(formatTime, () => {
        it("formats seconds as MM:SS or HH:MM:SS", () => {
            expect.hasAssertions();

            const cases: FormatterCase[] = [
                { expected: "2:05", input: 125, label: "under an hour" },
                { expected: "1:01:05", input: 3665, label: "over an hour" },
                { expected: "1:05", input: 65, label: "zero padded" },
                { expected: "2:00", input: 120, label: "minute boundary" },
                { expected: "1:00:00", input: 3600, label: "hour boundary" },
                { expected: "0:00", input: 0, label: "zero" },
                {
                    expected: "2:05",
                    input: 125.7,
                    label: "floor decimal seconds",
                },
                {
                    expected: "99:59:59",
                    input: 359_999,
                    label: "large duration",
                },
            ];
            for (const { expected, input } of cases) {
                expect(formatTime(input)).toBe(expected);
            }
        });

        it("uses user time units when requested and falls back to time strings for unset units", () => {
            expect.assertions(2);

            const localStorageMock = {
                getItem: vi.fn<Storage["getItem"]>(),
                setItem: vi.fn<Storage["setItem"]>(),
            };
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
                writable: true,
            });

            localStorageMock.getItem.mockReturnValue("hours");
            expect(formatTime(3600, true)).toContain("h");

            localStorageMock.getItem.mockReturnValue(null);
            expect(formatTime(125, true)).toBe("2:05");
        });

        it("returns the fallback time string and warns for invalid time values", () => {
            expect.hasAssertions();

            const cases: Array<
                FormatterCase & { readonly warning: unknown[] }
            > = [
                {
                    expected: "0:00",
                    input: "invalid",
                    label: "string input",
                    warning: ["[formatTime] Invalid seconds value:", "invalid"],
                },
                {
                    expected: "0:00",
                    input: Number.NaN,
                    label: "NaN",
                    warning: [
                        "[formatTime] Invalid seconds value:",
                        Number.NaN,
                    ],
                },
                {
                    expected: "0:00",
                    input: -30,
                    label: "negative value",
                    warning: ["[formatTime] Negative time value:", -30],
                },
                {
                    expected: "0:00",
                    input: Infinity,
                    label: "Infinity",
                    warning: ["[formatTime] Invalid seconds value:", Infinity],
                },
                {
                    expected: "0:00",
                    input: -Infinity,
                    label: "negative Infinity",
                    warning: ["[formatTime] Invalid seconds value:", -Infinity],
                },
                {
                    expected: "0:00",
                    input: null,
                    label: "null",
                    warning: ["[formatTime] Invalid seconds value:", null],
                },
                {
                    expected: "0:00",
                    input: undefined,
                    label: "undefined",
                    warning: ["[formatTime] Invalid seconds value:", undefined],
                },
            ];
            for (const { expected, input, warning } of cases) {
                vi.mocked(console.warn).mockClear();
                expect(formatTime(input)).toBe(expected);
                expect(console.warn).toHaveBeenCalledWith(...warning);
            }
        });
    });

    describe(formatWeight, () => {
        it("formats kilograms with rounded pounds", () => {
            expect.hasAssertions();

            const cases: FormatterCase[] = [
                { expected: "70 kg (154 lbs)", input: 70, label: "integer kg" },
                {
                    expected: "70.5 kg (155 lbs)",
                    input: 70.5,
                    label: "decimal kg",
                },
                {
                    expected: "68.2 kg (150 lbs)",
                    input: 68.2,
                    label: "rounded pounds",
                },
                { expected: "0 kg (0 lbs)", input: 0, label: "zero" },
                { expected: "0.1 kg (0 lbs)", input: 0.1, label: "small kg" },
                {
                    expected: "1000 kg (2205 lbs)",
                    input: 1000,
                    label: "large kg",
                },
            ];
            for (const { expected, input } of cases) {
                expect(formatWeight(input)).toBe(expected);
            }
        });

        it("returns an empty string for invalid weights and warns when appropriate", () => {
            expect.hasAssertions();

            const cases: Array<
                FormatterCase & { readonly warning?: unknown[] }
            > = [
                {
                    expected: "",
                    input: "invalid",
                    label: "string input",
                    warning: [
                        "[formatWeight] Invalid weight value:",
                        "invalid",
                    ],
                },
                {
                    expected: "",
                    input: Number.NaN,
                    label: "NaN",
                    warning: [
                        "[formatWeight] Invalid weight value:",
                        Number.NaN,
                    ],
                },
                {
                    expected: "",
                    input: Infinity,
                    label: "Infinity",
                    warning: ["[formatWeight] Invalid weight value:", Infinity],
                },
                {
                    expected: "",
                    input: -10,
                    label: "negative value",
                    warning: ["[formatWeight] Negative weight value:", -10],
                },
                {
                    expected: "",
                    input: null,
                    label: "null",
                    warning: ["[formatWeight] Invalid weight value:", null],
                },
                {
                    expected: "",
                    input: undefined,
                    label: "undefined",
                    warning: [
                        "[formatWeight] Invalid weight value:",
                        undefined,
                    ],
                },
            ];
            for (const { expected, input, warning } of cases) {
                vi.mocked(console.warn).mockClear();
                expect(formatWeight(input)).toBe(expected);
                expect(console.warn).toHaveBeenCalledWith(...(warning ?? []));
            }
        });
    });

    describe(formatHeight, () => {
        it("formats meters as meters and feet/inches", () => {
            expect.hasAssertions();

            const cases: FormatterCase[] = [
                {
                    expected: "1.75 m (5'9\")",
                    input: 1.75,
                    label: "average height",
                },
                {
                    expected: "2.10 m (6'11\")",
                    input: 2.1,
                    label: "tall height",
                },
                {
                    expected: "1.50 m (4'11\")",
                    input: 1.5,
                    label: "short height",
                },
                { expected: "0.00 m (0'0\")", input: 0, label: "zero" },
                {
                    expected: "0.50 m (1'8\")",
                    input: 0.5,
                    label: "very short height",
                },
                {
                    expected: "10.00 m (32'10\")",
                    input: 10,
                    label: "very tall height",
                },
            ];
            for (const { expected, input } of cases) {
                expect(formatHeight(input)).toBe(expected);
            }
        });

        it("returns an empty string for invalid heights and warns when appropriate", () => {
            expect.hasAssertions();

            const cases: Array<
                FormatterCase & { readonly warning: unknown[] }
            > = [
                {
                    expected: "",
                    input: "invalid",
                    label: "string input",
                    warning: [
                        "[formatHeight] Invalid height value:",
                        "invalid",
                    ],
                },
                {
                    expected: "",
                    input: -1.5,
                    label: "negative value",
                    warning: ["[formatHeight] Negative height value:", -1.5],
                },
                {
                    expected: "",
                    input: Number.NaN,
                    label: "NaN",
                    warning: [
                        "[formatHeight] Invalid height value:",
                        Number.NaN,
                    ],
                },
                {
                    expected: "",
                    input: null,
                    label: "null",
                    warning: ["[formatHeight] Invalid height value:", null],
                },
                {
                    expected: "",
                    input: undefined,
                    label: "undefined",
                    warning: [
                        "[formatHeight] Invalid height value:",
                        undefined,
                    ],
                },
            ];
            for (const { expected, input, warning } of cases) {
                vi.mocked(console.warn).mockClear();
                expect(formatHeight(input)).toBe(expected);
                expect(console.warn).toHaveBeenCalledWith(...warning);
            }
        });

        it("keeps typical human-height outputs in the expected display shape", () => {
            expect.hasAssertions();

            const heights = [
                1.5,
                1.65,
                1.8,
                1.95,
            ];
            for (const height of heights) {
                expect(formatHeight(height)).toMatch(
                    /^\d+\.\d{2} m \(\d+'\d+"\)$/u
                );
            }
        });
    });

    it("keeps representative formatter outputs consistent across domains", () => {
        expect.assertions(4);

        expect(formatDistance(5000)).toBe("5.00 km / 3.11 mi");
        expect(formatTime(1800)).toBe("30:00");
        expect(formatWeight(75)).toBe("75 kg (165 lbs)");
        expect(formatHeight(1.8)).toBe("1.80 m (5'11\")");
    });

    it("handles shared null and undefined boundaries consistently", () => {
        expect.assertions(2);

        expect({
            distance: formatDistance(null),
            height: formatHeight(null),
            time: formatTime(null),
            weight: formatWeight(null),
        }).toStrictEqual({
            distance: "",
            height: "",
            time: "0:00",
            weight: "",
        });
        expect({
            distance: formatDistance(undefined),
            height: formatHeight(undefined),
            time: formatTime(undefined),
            weight: formatWeight(undefined),
        }).toStrictEqual({
            distance: "",
            height: "",
            time: "0:00",
            weight: "",
        });
    });
});

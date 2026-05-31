import { describe, expect, it } from "vitest";
import { formatDuration } from "../../../electron-app/utils/formatting/formatters/formatDuration.js";

describe(formatDuration, () => {
    it("formats seconds, minutes, and hours", () => {
        expect.hasAssertions();

        expect(formatDuration(null)).toBe("");
        expect(formatDuration(undefined)).toBe("");
        expect(formatDuration(0)).toBe("0 sec");
        expect(formatDuration(59)).toBe("59 sec");
        expect(formatDuration(60)).toBe("1 min 0 sec");
        expect(formatDuration(90)).toBe("1 min 30 sec");
        expect(formatDuration(3599)).toBe("59 min 59 sec");
        expect(formatDuration(3600)).toBe("1 hr 0 min");
        expect(formatDuration(7320)).toBe("2 hrs 2 min");
    });

    it("normalizes numeric strings and rounded decimals", () => {
        expect.hasAssertions();

        expect(formatDuration(" 45 ")).toBe("45 sec");
        expect(formatDuration("1e2")).toBe("1 min 40 sec");
        expect(formatDuration(30.4)).toBe("30 sec");
        expect(formatDuration(30.6)).toBe("31 sec");
    });

    it("handles invalid-input durations by throwing clear errors", () => {
        expect.hasAssertions();

        expect(() => formatDuration("")).toThrow(
            "Invalid duration input: Empty string input"
        );
        expect(() => formatDuration("invalid")).toThrow(
            "Invalid duration input: Input must be a finite number"
        );
        expect(() => formatDuration(Number.NaN)).toThrow(
            "Invalid duration input: Input must be a finite number"
        );
        expect(() => formatDuration(-1)).toThrow(
            "Invalid duration input: Duration cannot be negative"
        );
    });
});

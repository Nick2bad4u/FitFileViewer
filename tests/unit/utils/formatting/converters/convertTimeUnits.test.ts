import { afterEach, describe, expect, it, vi } from "vitest";
import {
    convertTimeUnits,
    TIME_UNITS,
} from "../../../../../electron-app/utils/formatting/converters/convertTimeUnits.js";

describe("convertTimeUnits", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("converts seconds to each supported time unit", () => {
        expect(convertTimeUnits(3600, TIME_UNITS.SECONDS)).toBe(3600);
        expect(convertTimeUnits(90, TIME_UNITS.MINUTES)).toBe(1.5);
        expect(convertTimeUnits(5400, TIME_UNITS.HOURS)).toBe(1.5);
        expect(convertTimeUnits(0, TIME_UNITS.MINUTES)).toBe(0);
    });

    it("preserves signed and infinite numeric values", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertTimeUnits(-3600, TIME_UNITS.HOURS)).toBe(-1);
        expect(convertTimeUnits(Infinity, TIME_UNITS.MINUTES)).toBe(Infinity);

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertTimeUnits] Negative time value:",
            -3600
        );
    });

    it("handles invalid-input seconds by throwing TypeError", () => {
        for (const value of [
            null,
            undefined,
            "60",
            true,
            {},
            [],
            Number.NaN,
        ]) {
            expect(() => convertTimeUnits(value, TIME_UNITS.MINUTES)).toThrow(
                TypeError
            );
        }
    });

    it("warns and returns seconds unchanged for unknown units", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertTimeUnits(3600, "days")).toBe(3600);

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertTimeUnits] Unknown unit 'days', defaulting to seconds"
        );
    });
});

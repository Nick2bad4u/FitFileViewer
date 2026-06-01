import { afterEach, describe, expect, it, vi } from "vitest";
import {
    convertDistanceUnits,
    DISTANCE_UNITS,
} from "../../../../../electron-app/utils/formatting/converters/convertDistanceUnits.js";

describe(convertDistanceUnits, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("converts meters to each supported distance unit", () => {
        expect.assertions(4);

        expect(convertDistanceUnits(1000, DISTANCE_UNITS.METERS)).toBe(1000);
        expect(convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS)).toBe(1);
        expect(convertDistanceUnits(1, DISTANCE_UNITS.FEET)).toBeCloseTo(
            3.28084,
            5
        );
        expect(
            convertDistanceUnits(1609.344, DISTANCE_UNITS.MILES)
        ).toBeCloseTo(1, 10);
    });

    it("preserves signed and infinite numeric values", () => {
        expect.assertions(3);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertDistanceUnits(-2500, DISTANCE_UNITS.KILOMETERS)).toBe(
            -2.5
        );
        expect(convertDistanceUnits(Infinity, DISTANCE_UNITS.MILES)).toBe(
            Infinity
        );

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertDistanceUnits] Negative distance value:",
            -2500
        );
    });

    it("handles invalid-input meters by throwing TypeError", () => {
        expect.assertions(7);

        for (const value of [
            null,
            undefined,
            "1000",
            true,
            {},
            [],
            Number.NaN,
        ]) {
            expect(() =>
                convertDistanceUnits(value, DISTANCE_UNITS.KILOMETERS)
            ).toThrow(TypeError);
        }
    });

    it("warns and returns meters unchanged for unknown units", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertDistanceUnits(1000, "yards")).toBe(1000);

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertDistanceUnits] Unknown unit 'yards', defaulting to meters"
        );
    });
});

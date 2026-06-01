import { afterEach, describe, expect, it, vi } from "vitest";
import {
    convertTemperatureUnits,
    TEMPERATURE_UNITS,
} from "../../../../../electron-app/utils/formatting/converters/convertTemperatureUnits.js";

describe(convertTemperatureUnits, () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("converts Celsius to the requested temperature unit", () => {
        expect.assertions(5);

        expect(convertTemperatureUnits(25, TEMPERATURE_UNITS.CELSIUS)).toBe(25);
        expect(convertTemperatureUnits(0, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(
            32
        );
        expect(convertTemperatureUnits(100, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(
            212
        );
        expect(convertTemperatureUnits(-40, TEMPERATURE_UNITS.FAHRENHEIT)).toBe(
            -40
        );
        expect(
            convertTemperatureUnits(36.5, TEMPERATURE_UNITS.FAHRENHEIT)
        ).toBeCloseTo(97.7, 1);
    });

    it("handles invalid-input temperatures by throwing TypeError", () => {
        expect.assertions(7);

        for (const value of [
            null,
            undefined,
            "25",
            true,
            {},
            [],
            Number.NaN,
        ]) {
            expect(() =>
                convertTemperatureUnits(value, TEMPERATURE_UNITS.FAHRENHEIT)
            ).toThrow(TypeError);
        }
    });

    it("warns and returns Celsius unchanged for unknown units", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(convertTemperatureUnits(25, "kelvin")).toBe(25);

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertTemperatureUnits] Unknown unit 'kelvin', defaulting to celsius"
        );
    });
});

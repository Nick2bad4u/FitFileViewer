import { describe, expect, it } from "vitest";
import * as converters from "../../../../../electron-app/utils/formatting/converters/index.js";

describe("converter barrel exports", () => {
    it("re-exports only the public converter API", () => {
        expect(Object.keys(converters).sort()).toStrictEqual(
            [
                "DISTANCE_UNITS",
                "TEMPERATURE_UNITS",
                "TIME_UNITS",
                "convertArrayBufferToBase64",
                "convertDistanceUnits",
                "convertMpsToKmh",
                "convertMpsToMph",
                "convertTemperatureUnits",
                "convertTimeUnits",
                "convertValueToUserUnits",
            ].sort()
        );

        expect(converters.DISTANCE_UNITS).toStrictEqual({
            FEET: "feet",
            KILOMETERS: "kilometers",
            METERS: "meters",
            MILES: "miles",
        });
        expect(converters.TEMPERATURE_UNITS).toStrictEqual({
            CELSIUS: "celsius",
            FAHRENHEIT: "fahrenheit",
        });
        expect(converters.TIME_UNITS).toStrictEqual({
            HOURS: "hours",
            MINUTES: "minutes",
            SECONDS: "seconds",
        });
    });

    it("routes representative conversions through the barrel exports", () => {
        expect(
            converters.convertDistanceUnits(
                1609.344,
                converters.DISTANCE_UNITS.MILES
            )
        ).toBe(1);
        expect(converters.convertMpsToKmh(10)).toBe(36);
        expect(converters.convertMpsToMph(10)).toBeCloseTo(22.369_36);
        expect(
            converters.convertTemperatureUnits(
                25,
                converters.TEMPERATURE_UNITS.FAHRENHEIT
            )
        ).toBe(77);
        expect(
            converters.convertTimeUnits(3600, converters.TIME_UNITS.HOURS)
        ).toBe(1);
        expect(
            converters.convertArrayBufferToBase64(
                new Uint8Array([
                    70,
                    70,
                    86,
                ]).buffer
            )
        ).toBe("RkZW");
    });

    it("preserves converter validation through the barrel exports", () => {
        expect(() => converters.convertMpsToKmh("10")).toThrow(TypeError);
    });
});

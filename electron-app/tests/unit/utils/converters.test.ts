import { describe, expect, it } from "vitest";
import * as converters from "../../../utils/formatting/converters/index.js";

describe("converter barrel exports", () => {
    it("re-exports the public converter API", () => {
        expect(converters).toEqual(
            expect.objectContaining({
                convertArrayBufferToBase64: expect.any(Function),
                convertDistanceUnits: expect.any(Function),
                convertMpsToKmh: expect.any(Function),
                convertMpsToMph: expect.any(Function),
                convertTemperatureUnits: expect.any(Function),
                convertTimeUnits: expect.any(Function),
                convertValueToUserUnits: expect.any(Function),
                DISTANCE_UNITS: expect.objectContaining({
                    KILOMETERS: "kilometers",
                    METERS: "meters",
                }),
                TEMPERATURE_UNITS: expect.objectContaining({
                    CELSIUS: "celsius",
                    FAHRENHEIT: "fahrenheit",
                }),
                TIME_UNITS: expect.objectContaining({
                    HOURS: "hours",
                    MINUTES: "minutes",
                    SECONDS: "seconds",
                }),
            })
        );
        expect(converters).not.toHaveProperty("convertMpsToKnots");
    });
});

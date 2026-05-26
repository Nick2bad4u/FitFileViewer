import { describe, expect, it, vi } from "vitest";

import { formatTooltipWithUnits } from "../../../utils/formatting/display/formatTooltipWithUnits.js";

const mocks = vi.hoisted(() => ({
    convertDistanceUnits: vi.fn<(value: number, unit: string) => number>(),
    convertTemperatureUnits: vi.fn<(value: number, unit: string) => number>(),
    convertValueToUserUnits: vi.fn<(value: number, field: string) => number>(),
    getChartSetting: vi.fn<(key: string) => unknown>(),
    getUnitSymbol: vi.fn<(field: string) => null | string | undefined>(),
}));

vi.mock(
    import("../../../utils/formatting/converters/convertDistanceUnits.js"),
    () => ({
        DISTANCE_UNITS: {
            FEET: "feet",
            KILOMETERS: "kilometers",
            METERS: "meters",
            MILES: "miles",
        },
        convertDistanceUnits: mocks.convertDistanceUnits,
    })
);

vi.mock(
    import("../../../utils/formatting/converters/convertTemperatureUnits.js"),
    () => ({
        TEMPERATURE_UNITS: {
            CELSIUS: "celsius",
            FAHRENHEIT: "fahrenheit",
        },
        convertTemperatureUnits: mocks.convertTemperatureUnits,
    })
);

vi.mock(
    import("../../../utils/formatting/converters/convertValueToUserUnits.js"),
    () => ({
        convertValueToUserUnits: mocks.convertValueToUserUnits,
    })
);

vi.mock(import("../../../utils/data/lookups/getUnitSymbol.js"), () => ({
    getUnitSymbol: mocks.getUnitSymbol,
}));

vi.mock(import("../../../utils/state/domain/settingsStateManager.js"), () => ({
    getChartSetting: mocks.getChartSetting,
}));

type ChartSettings = {
    readonly distanceUnits?: unknown;
    readonly temperatureUnits?: unknown;
};

function resetFormattingHarness(settings: ChartSettings = {}): void {
    vi.clearAllMocks();
    mocks.getChartSetting.mockImplementation(
        (key) => settings[key as keyof ChartSettings]
    );
}

describe("format tooltip with units", () => {
    it("formats distance in metric order when user settings prefer kilometers", () => {
        expect.assertions(6);

        resetFormattingHarness({ distanceUnits: "kilometers" });
        mocks.convertDistanceUnits
            .mockReturnValueOnce(5)
            .mockReturnValueOnce(3.11);

        const result = formatTooltipWithUnits(5000, "distance");

        expect(result).toBe("5.00 km (3.11 mi)");
        expect(mocks.convertDistanceUnits).toHaveBeenCalledTimes(2);
        expect(mocks.convertDistanceUnits).toHaveBeenNthCalledWith(
            1,
            5000,
            "kilometers"
        );
        expect(mocks.convertDistanceUnits).toHaveBeenNthCalledWith(
            2,
            5000,
            "miles"
        );
        expect(mocks.convertValueToUserUnits).not.toHaveBeenCalled();
        expect(mocks.getUnitSymbol).not.toHaveBeenCalled();
    });

    it("formats distance in imperial order when user settings prefer miles or feet", () => {
        expect.assertions(4);

        resetFormattingHarness({ distanceUnits: "feet" });
        mocks.convertDistanceUnits
            .mockReturnValueOnce(1.8)
            .mockReturnValueOnce(1.12);

        const result = formatTooltipWithUnits(1800, "enhancedAltitude");

        expect(result).toBe("1.12 mi (1.80 km)");
        expect(mocks.convertDistanceUnits).toHaveBeenCalledTimes(2);
        expect(mocks.convertDistanceUnits).toHaveBeenNthCalledWith(
            1,
            1800,
            "kilometers"
        );
        expect(mocks.convertDistanceUnits).toHaveBeenNthCalledWith(
            2,
            1800,
            "miles"
        );
    });

    it("uses metric distance order when settings contain an unsupported distance unit", () => {
        expect.assertions(3);

        resetFormattingHarness({ distanceUnits: "yards" });
        mocks.convertDistanceUnits
            .mockReturnValueOnce(-0.1)
            .mockReturnValueOnce(-0.06);

        const result = formatTooltipWithUnits(-100, "altitude");

        expect(result).toBe("-0.10 km (-0.06 mi)");
        expect(mocks.getChartSetting).toHaveBeenCalledWith("distanceUnits");
        expect(mocks.getChartSetting).not.toHaveBeenCalledWith(
            "temperatureUnits"
        );
    });

    it("formats temperature in Celsius order by default", () => {
        expect.assertions(4);

        resetFormattingHarness();
        mocks.convertTemperatureUnits.mockReturnValue(77);

        const result = formatTooltipWithUnits(25, "temperature");

        expect(result).toBe("25.0\u00b0C (77.0\u00b0F)");
        expect(mocks.convertTemperatureUnits).toHaveBeenCalledExactlyOnceWith(
            25,
            "fahrenheit"
        );
        expect(mocks.convertDistanceUnits).not.toHaveBeenCalled();
        expect(mocks.getUnitSymbol).not.toHaveBeenCalled();
    });

    it("formats temperature in Fahrenheit order when settings prefer Fahrenheit", () => {
        expect.assertions(3);

        resetFormattingHarness({ temperatureUnits: "fahrenheit" });
        mocks.convertTemperatureUnits.mockReturnValue(32);

        const result = formatTooltipWithUnits(0, "temperature");

        expect(result).toBe("32.0\u00b0F (0.0\u00b0C)");
        expect(mocks.getChartSetting).toHaveBeenCalledWith("temperatureUnits");
        expect(mocks.convertValueToUserUnits).not.toHaveBeenCalled();
    });

    it("uses Celsius order when settings contain an unsupported temperature unit", () => {
        expect.assertions(3);

        resetFormattingHarness({ temperatureUnits: "kelvin" });
        mocks.convertTemperatureUnits.mockReturnValue(14);

        const result = formatTooltipWithUnits(-10, "temperature");

        expect(result).toBe("-10.0\u00b0C (14.0\u00b0F)");
        expect(mocks.getChartSetting).toHaveBeenCalledWith("temperatureUnits");
        expect(mocks.convertDistanceUnits).not.toHaveBeenCalled();
    });

    it("formats regular fields with converted values and unit symbols", () => {
        expect.assertions(4);

        resetFormattingHarness();
        mocks.convertValueToUserUnits.mockReturnValue(25);
        mocks.getUnitSymbol.mockReturnValue("km/h");

        const result = formatTooltipWithUnits(6.94, "speed");

        expect(result).toBe("25.00 km/h");
        expect(mocks.convertValueToUserUnits).toHaveBeenCalledExactlyOnceWith(
            6.94,
            "speed"
        );
        expect(mocks.getUnitSymbol).toHaveBeenCalledWith("speed");
        expect(mocks.convertDistanceUnits).not.toHaveBeenCalled();
    });

    it("omits the trailing unit spacer when no unit symbol is available", () => {
        expect.assertions(5);

        resetFormattingHarness();
        mocks.convertValueToUserUnits.mockReturnValueOnce(42);
        mocks.getUnitSymbol.mockReturnValueOnce(null);
        mocks.convertValueToUserUnits.mockReturnValueOnce(99.99);
        mocks.getUnitSymbol.mockReturnValueOnce("");

        const resultWithoutUnit = formatTooltipWithUnits(42, "customField");
        const resultWithEmptyUnit = formatTooltipWithUnits(99.99, "otherField");

        expect(resultWithoutUnit).toBe("42.00");
        expect(resultWithEmptyUnit).toBe("99.99");
        expect(resultWithoutUnit).not.toContain(" ");
        expect(resultWithEmptyUnit).not.toContain(" ");
        expect(mocks.getUnitSymbol).toHaveBeenCalledTimes(2);
    });

    it("routes invalid runtime values through the matching formatter path", () => {
        expect.assertions(6);

        resetFormattingHarness();
        mocks.convertDistanceUnits
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(0);
        mocks.convertTemperatureUnits.mockReturnValue(Number.NaN);
        mocks.convertValueToUserUnits.mockReturnValue(0);
        mocks.getUnitSymbol.mockReturnValue("units");

        const nullDistance = formatTooltipWithUnits(
            null as unknown as number,
            "distance"
        );
        const nanTemperature = formatTooltipWithUnits(
            Number.NaN,
            "temperature"
        );
        const stringDefault = formatTooltipWithUnits(
            "bad" as unknown as number,
            "custom"
        );

        expect(nullDistance).toBe("0.00 km (0.00 mi)");
        expect(nanTemperature).toBe("NaN\u00b0C (NaN\u00b0F)");
        expect(stringDefault).toBe("0.00 units");
        expect(mocks.convertDistanceUnits).toHaveBeenCalledWith(
            null,
            "kilometers"
        );
        expect(mocks.convertTemperatureUnits).toHaveBeenCalledWith(
            Number.NaN,
            "fahrenheit"
        );
        expect(mocks.convertValueToUserUnits).toHaveBeenCalledWith(
            "bad",
            "custom"
        );
    });

    it("keeps output stable across repeated calls with the same converted value", () => {
        expect.assertions(4);

        resetFormattingHarness();
        mocks.convertValueToUserUnits.mockReturnValue(75);
        mocks.getUnitSymbol.mockReturnValue("bpm");

        const firstResult = formatTooltipWithUnits(75, "heartRate");
        const secondResult = formatTooltipWithUnits(75, "heartRate");
        const thirdResult = formatTooltipWithUnits(75, "heartRate");

        expect(firstResult).toBe("75.00 bpm");
        expect(secondResult).toBe(firstResult);
        expect(thirdResult).toBe(secondResult);
        expect(mocks.convertTemperatureUnits).not.toHaveBeenCalled();
    });
});

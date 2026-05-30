import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertValueToUserUnits } from "../../../electron-app/utils/formatting/converters/convertValueToUserUnits.js";
import { getChartSetting } from "../../../electron-app/utils/state/domain/settingsStateManager.js";

vi.mock(
    import("../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: vi.fn<(key: string) => unknown>(),
    })
);

const mockGetChartSetting = vi.mocked(getChartSetting);

describe(convertValueToUserUnits, () => {
    let errorSpy: ReturnType<typeof vi.spyOn>,
        warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        mockGetChartSetting.mockReturnValue(undefined);
    });

    afterEach(() => {
        errorSpy.mockRestore();
        warnSpy.mockRestore();
    });

    it("returns invalid values unchanged and warns", () => {
        expect.hasAssertions();

        expect(convertValueToUserUnits("1000", "distance")).toBe("1000");
        expect(convertValueToUserUnits(Number.NaN, "distance")).toBeNaN();

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertValueToUserUnits] Invalid value for field 'distance':",
            "1000"
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[convertValueToUserUnits] Invalid value for field 'distance':",
            Number.NaN
        );
        expect(mockGetChartSetting).not.toHaveBeenCalled();
    });

    it("returns numeric values unchanged for invalid field names", () => {
        expect.hasAssertions();

        expect({
            emptyField: convertValueToUserUnits(1000, ""),
            nullField: convertValueToUserUnits(1000, null),
        }).toEqual({
            emptyField: 1000,
            nullField: 1000,
        });

        expect(warnSpy).toHaveBeenCalledWith(
            "[convertValueToUserUnits] Invalid field name:",
            ""
        );
        expect(warnSpy).toHaveBeenCalledWith(
            "[convertValueToUserUnits] Invalid field name:",
            null
        );
        expect(mockGetChartSetting).not.toHaveBeenCalled();
    });

    it("converts distance and altitude fields with the distance setting", () => {
        expect.hasAssertions();

        mockGetChartSetting.mockReturnValue("miles");

        expect(convertValueToUserUnits(1609.344, "distance")).toBeCloseTo(1);
        expect(convertValueToUserUnits(1609.344, "altitude")).toBeCloseTo(1);
        expect(
            convertValueToUserUnits(1609.344, "enhancedAltitude")
        ).toBeCloseTo(1);
        expect(mockGetChartSetting).toHaveBeenCalledTimes(3);
        expect(mockGetChartSetting).toHaveBeenCalledWith("distanceUnits");
    });

    it("falls back to kilometers for unknown distance settings", () => {
        expect.hasAssertions();

        mockGetChartSetting.mockReturnValue("yards");

        expect({
            distance: convertValueToUserUnits(1000, "distance"),
        }).toEqual({
            distance: 1,
        });
    });

    it("converts speed using metric or imperial distance settings", () => {
        expect.hasAssertions();

        mockGetChartSetting.mockReturnValue("kilometers");
        expect({
            metricSpeed: convertValueToUserUnits(10, "speed"),
        }).toEqual({
            metricSpeed: 36,
        });

        mockGetChartSetting.mockReturnValue("feet");
        expect(convertValueToUserUnits(10, "enhancedSpeed")).toBeCloseTo(
            22.369_36
        );
    });

    it("converts temperature with the temperature setting", () => {
        expect.hasAssertions();

        mockGetChartSetting.mockReturnValue("fahrenheit");

        expect({
            temperature: convertValueToUserUnits(25, "temperature"),
        }).toEqual({
            temperature: 77,
        });
        expect(mockGetChartSetting).toHaveBeenCalledWith("temperatureUnits");
    });

    it("returns unhandled fields unchanged without reading settings", () => {
        expect.hasAssertions();

        expect({
            heartRate: convertValueToUserUnits(150, "heartRate"),
            power: convertValueToUserUnits(250, "power"),
        }).toEqual({
            heartRate: 150,
            power: 250,
        });

        expect(mockGetChartSetting).not.toHaveBeenCalled();
    });

    it("returns the original value when settings access throws", () => {
        expect.hasAssertions();

        const settingsError = new Error("Settings unavailable");
        mockGetChartSetting.mockImplementation(() => {
            throw settingsError;
        });

        expect({
            distance: convertValueToUserUnits(1000, "distance"),
        }).toEqual({
            distance: 1000,
        });
        expect(errorSpy).toHaveBeenCalledWith(
            "[convertValueToUserUnits] Conversion failed for field 'distance':",
            settingsError
        );
    });
});

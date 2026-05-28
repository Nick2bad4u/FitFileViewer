import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convertValueToUserUnits } from "../../../electron-app/utils/formatting/converters/convertValueToUserUnits.js";
import { getChartSetting } from "../../../electron-app/utils/state/domain/settingsStateManager.js";

vi.mock(
    "../../../electron-app/utils/state/domain/settingsStateManager.js",
    () => ({
        getChartSetting: vi.fn(),
    })
);

const mockGetChartSetting = vi.mocked(getChartSetting);

describe("convertValueToUserUnits", () => {
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
        expect(convertValueToUserUnits(1000, "")).toBe(1000);
        expect(convertValueToUserUnits(1000, null)).toBe(1000);

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
        mockGetChartSetting.mockReturnValue("yards");

        expect(convertValueToUserUnits(1000, "distance")).toBe(1);
    });

    it("converts speed using metric or imperial distance settings", () => {
        mockGetChartSetting.mockReturnValue("kilometers");
        expect(convertValueToUserUnits(10, "speed")).toBe(36);

        mockGetChartSetting.mockReturnValue("feet");
        expect(convertValueToUserUnits(10, "enhancedSpeed")).toBeCloseTo(
            22.369_36
        );
    });

    it("converts temperature with the temperature setting", () => {
        mockGetChartSetting.mockReturnValue("fahrenheit");

        expect(convertValueToUserUnits(25, "temperature")).toBe(77);
        expect(mockGetChartSetting).toHaveBeenCalledWith("temperatureUnits");
    });

    it("returns unhandled fields unchanged without reading settings", () => {
        expect(convertValueToUserUnits(250, "power")).toBe(250);
        expect(convertValueToUserUnits(150, "heartRate")).toBe(150);

        expect(mockGetChartSetting).not.toHaveBeenCalled();
    });

    it("returns the original value when settings access throws", () => {
        const settingsError = new Error("Settings unavailable");
        mockGetChartSetting.mockImplementation(() => {
            throw settingsError;
        });

        expect(convertValueToUserUnits(1000, "distance")).toBe(1000);
        expect(errorSpy).toHaveBeenCalledWith(
            "[convertValueToUserUnits] Conversion failed for field 'distance':",
            settingsError
        );
    });
});

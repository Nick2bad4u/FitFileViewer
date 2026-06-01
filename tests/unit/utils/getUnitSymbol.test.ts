import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUnitSymbol } from "../../../electron-app/utils/data/lookups/getUnitSymbol.js";
import { getChartSetting } from "../../../electron-app/utils/state/domain/settingsStateManager.js";

vi.mock(
    import("../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartSetting: vi.fn<(key: string) => unknown>(),
    })
);

const mockedGetChartSetting = vi.mocked(getChartSetting);

describe(getUnitSymbol, () => {
    beforeEach(() => {
        mockedGetChartSetting.mockReset();
        vi.restoreAllMocks();
    });

    it("returns configured symbols for distance, temperature, speed, and time units", () => {
        expect.assertions(5);

        mockedGetChartSetting.mockImplementation((key) => {
            if (key === "distanceUnits") {
                return "miles";
            }
            if (key === "temperatureUnits") {
                return "fahrenheit";
            }
            if (key === "timeUnits") {
                return "hours";
            }
            return undefined;
        });

        expect(getUnitSymbol("distance")).toBe("mi");
        expect(getUnitSymbol("altitude")).toBe("mi");
        expect(getUnitSymbol("temperature")).toBe("°F");
        expect(getUnitSymbol("speed")).toBe("mph");
        expect(getUnitSymbol("distance", "time")).toBe("h");
    });

    it("uses defaults when settings are missing", () => {
        expect.assertions(4);

        mockedGetChartSetting.mockReturnValue(undefined);

        expect(getUnitSymbol("distance")).toBe("km");
        expect(getUnitSymbol("temperature")).toBe("°C");
        expect(getUnitSymbol("speed")).toBe("km/h");
        expect(getUnitSymbol("elapsedTime", "time")).toBe("s");
    });

    it("falls back for unknown configured unit values", () => {
        expect.assertions(3);

        mockedGetChartSetting.mockImplementation((key) => {
            if (key === "distanceUnits") {
                return "lightyears";
            }
            if (key === "temperatureUnits") {
                return "kelvin";
            }
            if (key === "timeUnits") {
                return "days";
            }
            return undefined;
        });

        expect(getUnitSymbol("distance")).toBe("m");
        expect(getUnitSymbol("temperature")).toBe("°C");
        expect(getUnitSymbol("elapsedTime", "time")).toBe("s");
    });

    it("returns fixed labels for known fitness fields", () => {
        expect.assertions(1);

        expect(
            new Map([
                ["auxHeartRate", getUnitSymbol("auxHeartRate")],
                ["cadence", getUnitSymbol("cadence")],
                ["flow", getUnitSymbol("flow")],
                ["grit", getUnitSymbol("grit")],
                ["heartRate", getUnitSymbol("heartRate")],
                ["positionLat", getUnitSymbol("positionLat")],
                ["positionLong", getUnitSymbol("positionLong")],
                ["power", getUnitSymbol("power")],
                ["resistance", getUnitSymbol("resistance")],
            ])
        ).toEqual(
            new Map([
                ["auxHeartRate", "bpm"],
                ["cadence", "rpm"],
                ["flow", "#"],
                ["grit", "#"],
                ["heartRate", "bpm"],
                ["positionLat", "°"],
                ["positionLong", "°"],
                ["power", "W"],
                ["resistance", ""],
            ])
        );
    });

    it("returns an empty symbol and warns for invalid fields", () => {
        expect.assertions(6);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(getUnitSymbol(null as never)).toBe("");
        expect(getUnitSymbol(undefined as never)).toBe("");
        expect(getUnitSymbol(123 as never)).toBe("");
        expect(getUnitSymbol("unknownField")).toBe("");

        expect(warnSpy).toHaveBeenCalledTimes(3);
        expect(warnSpy).toHaveBeenCalledWith(
            "[UnitSymbol] Invalid field parameter:",
            null
        );
    });

    it("warns and uses defaults when settings lookup throws", () => {
        expect.assertions(2);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        mockedGetChartSetting.mockImplementation(() => {
            throw new Error("settings unavailable");
        });

        expect(getUnitSymbol("temperature")).toBe("°C");

        expect(warnSpy).toHaveBeenCalledWith(
            '[UnitSymbol] Error reading setting "temperatureUnits":',
            expect.any(Error)
        );
    });

    it("logs and returns an empty symbol when validation logging fails", () => {
        expect.assertions(2);

        vi.spyOn(console, "warn").mockImplementationOnce(() => {
            throw new Error("console.warn failed");
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(getUnitSymbol(null as never)).toBe("");

        expect(errorSpy).toHaveBeenCalledWith(
            '[UnitSymbol] Error getting unit symbol for field "null":',
            expect.any(Error)
        );
    });
});

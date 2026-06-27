import { describe, expect, it, vi } from "vitest";
import {
    CONFIG,
    CONVERSION_FACTORS,
    FILE_CONSTANTS,
    TIME_UNITS,
    UI_CONSTANTS,
    getConfig,
    initializeConfig,
    validateConfig,
} from "../../../electron-app/utils/config/index.js";

describe("config/index.js", () => {
    it("exports shared constants as named values", () => {
        expect.assertions(3);

        expect({
            METERS_PER_KILOMETER: CONVERSION_FACTORS.METERS_PER_KILOMETER,
            METERS_PER_MILE: CONVERSION_FACTORS.METERS_PER_MILE,
        }).toStrictEqual({
            METERS_PER_KILOMETER: 1000,
            METERS_PER_MILE: 1609.344,
        });
        expect(TIME_UNITS.SECONDS).toBe("seconds");
        expect(FILE_CONSTANTS.SUPPORTED_EXTENSIONS).toStrictEqual([".fit"]);
    });

    it("exports former namespace values as named values", () => {
        expect.assertions(3);

        expect(CONVERSION_FACTORS.METERS_TO_INCHES).toBe(39.3701);
        expect(TIME_UNITS.HOURS).toBe("hours");
        expect(CONFIG.CONVERSION.KG_TO_POUNDS).toBe(2.204_62);
    });

    it("supports grouped CONFIG access", () => {
        expect.assertions(3);

        expect(CONFIG.UI.DEFAULT_THEME).toBe(UI_CONSTANTS.DEFAULT_THEME);
        expect(CONFIG.FILE.DEFAULT_EXPORT_FORMAT).toBe("gpx");
        expect(CONFIG.TIME_UNITS.MINUTES).toBe("minutes");
    });

    it("does not expose a duplicated app metadata constants group", () => {
        expect.assertions(1);

        expect(Object.keys(CONFIG).sort()).toStrictEqual([
            "CHART",
            "CONVERSION",
            "DEBUG",
            "DISTANCE_UNITS",
            "ERROR",
            "FILE",
            "MAP",
            "PERFORMANCE",
            "TEMPERATURE_UNITS",
            "TIME_UNITS",
            "UI",
            "VALIDATION",
        ]);
    });

    it("reads values by dot-notation path", () => {
        expect.assertions(2);

        expect(getConfig("UI_CONSTANTS.DEFAULT_THEME")).toBe("dark");
        expect(getConfig("CONVERSION_FACTORS.METERS_PER_MILE")).toBe(1609.344);
    });

    it("returns the provided default for missing config paths", () => {
        expect.assertions(1);

        expect({
            missingGroup: getConfig("MISSING_GROUP.VALUE", 42),
            missingValue: getConfig("UI_CONSTANTS.DOES_NOT_EXIST", "fallback"),
        }).toStrictEqual({
            missingGroup: 42,
            missingValue: "fallback",
        });
    });

    it("validates the current configuration", () => {
        expect.assertions(1);

        expect(validateConfig()).toStrictEqual({
            errors: [],
            isValid: true,
            warnings: [],
        });
    });

    it("initializes config and logs success when validation passes", () => {
        expect.assertions(2);

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            expect(initializeConfig()).toBeUndefined();
            expect(logSpy.mock.calls).toStrictEqual([
                ["[Config] Configuration system initialized successfully"],
            ]);
        } finally {
            logSpy.mockRestore();
        }
    });
});

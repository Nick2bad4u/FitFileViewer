import { describe, expect, it } from "vitest";
import {
    fieldColors,
    fieldLabels,
    formatChartFields,
} from "../../../utils/formatting/display/formatChartFields.js";

const expectedChartFields = [
    "speed",
    "heartRate",
    "auxHeartRate",
    "altitude",
    "power",
    "estimatedPower",
    "cadence",
    "temperature",
    "distance",
    "enhancedSpeed",
    "enhancedAltitude",
    "resistance",
    "flow",
    "grit",
    "positionLat",
    "positionLong",
] as const;

const derivedChartTypes = [
    "gps_track",
    "speed_vs_distance",
    "power_vs_hr",
    "altitude_profile",
    "hr_zone_doughnut",
    "power_zone_doughnut",
    "event_messages",
] as const;

describe("formatChartFields", () => {
    it("keeps the chartable FIT field order stable", () => {
        expect(formatChartFields).toEqual(expectedChartFields);
        expect(new Set(formatChartFields)).toHaveLength(
            expectedChartFields.length
        );
    });

    it("provides labels and colors for every chartable field", () => {
        for (const field of formatChartFields) {
            expect(fieldLabels[field]).toBeTypeOf("string");
            expect(fieldLabels[field]).not.toBe("");
            expect(fieldColors[field]).toMatch(/^#[\da-f]{6}$/i);
        }

        expect(fieldLabels.speed).toBe("Speed");
        expect(fieldColors.speed).toBe("#1976d2");
        expect(fieldLabels.positionLat).toBe("Latitude");
        expect(fieldColors.positionLong).toBe("#3f51b5");
    });

    it("keeps derived chart metadata out of raw FIT field ordering", () => {
        for (const chartType of derivedChartTypes) {
            expect(formatChartFields).not.toContain(chartType);
            expect(fieldLabels[chartType]).toBeTypeOf("string");
            expect(fieldColors[chartType]).toMatch(/^#[\da-f]{6}$/i);
        }

        expect(fieldLabels.power_vs_hr).toBe("Power vs Heart Rate");
        expect(fieldLabels.hr_zone_doughnut).toBe(
            "HR Zone Distribution (Doughnut)"
        );
    });

    it("keeps label and color keys aligned", () => {
        expect(Object.keys(fieldLabels).sort()).toEqual(
            Object.keys(fieldColors).sort()
        );
    });
});

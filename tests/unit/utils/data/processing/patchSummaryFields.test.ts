import { describe, expect, it, vi } from "vitest";

import {
    patchSummaryFields,
    type SummaryRecord,
} from "../../../../../electron-app/utils/data/processing/patchSummaryFields.js";

describe(patchSummaryFields, () => {
    it("formats common summary metrics in place", () => {
        expect.assertions(13);

        const summary: SummaryRecord = {
            avg_cadence: 91.7,
            avg_heart_rate: 142.2,
            avg_left_power_phase: [1.234, 5.678],
            avg_speed: 2.5,
            avg_temperature: 18.56,
            normalized_power: 243.7,
            start_time: 1_700_000_000,
            total_calories: 456.8,
            total_distance: 5000,
            total_timer_time: 3661,
            training_stress_score: 88.123,
            unlisted_decimal: 1.234,
        };

        const result = patchSummaryFields(summary);

        expect(result).toBe(summary);
        expect(summary.total_distance).toBe("5.00 km / 3.11 mi");
        expect(summary.total_timer_time).toBe("1 hr 1 min");
        expect(summary.avg_speed).toBe("9.00 km/h / 5.59 mph");
        expect(summary.normalized_power).toBe(244);
        expect(summary.avg_heart_rate).toBe(142);
        expect(summary.avg_cadence).toBe(92);
        expect(summary.total_calories).toBe(457);
        expect(summary.avg_temperature).toBe("18.60");
        expect(summary.training_stress_score).toBe("88.12");
        expect(summary.avg_left_power_phase).toBe("1.23, 5.68");
        expect(summary.start_time).toBeTypeOf("string");
        expect(summary.unlisted_decimal).toBe("1.23");
    });

    it("throws and logs for invalid input", () => {
        expect.assertions(2);

        const consoleError = vi
            .spyOn(console, "error")
            .mockReturnValue(undefined);

        expect(() =>
            patchSummaryFields(null as never)
        ).toThrowErrorMatchingInlineSnapshot(
            `[Error: Invalid input: expected object]`
        );
        expect(consoleError).toHaveBeenCalledWith(
            "[SummaryPatcher] Error patching summary fields: Invalid input: expected object"
        );

        consoleError.mockRestore();
    });
});

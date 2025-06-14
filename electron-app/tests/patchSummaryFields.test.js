import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { patchSummaryFields } from "../utils/patchSummaryFields";

describe("patchSummaryFields", () => {
    it("should format distance, time, speed, power, calories, heart rate, cadence, and more", () => {
        const obj = {
            total_distance: 1000,
            totalTimerTime: 3600,
            avg_speed: 5,
            max_power: 250.7,
            total_calories: 123.7,
            avg_heart_rate: 150.2,
            avg_cadence: 80.6,
            enhanced_avg_respiration_rate: 15.123,
            avg_temperature: 22.345,
            total_grit: 1.2345,
            training_load_peak: 100.9,
            total_strokes: 33.7,
            avg_fractional_cadence: 0.12345,
            avg_left_torque_effectiveness: 80.123,
            avg_left_pco: 2.7,
            avg_left_power_phase: [1.234, 2.345],
            timestamp: 1715100000,
            floatVal: 1.2345,
        };
        patchSummaryFields(obj);
        expect(typeof obj.total_distance).toBe("string");
        expect(typeof obj.totalTimerTime).toBe("string");
        expect(obj.avg_speed).toContain("km/h");
        expect(obj.max_power).toBe(251);
        expect(obj.total_calories).toBe(124);
        expect(obj.avg_heart_rate).toBe(150);
        expect(obj.avg_cadence).toBe(81);
        expect(obj.enhanced_avg_respiration_rate).toBe("15.1");
        expect(obj.avg_temperature).toBe("22.3");
        expect(obj.total_grit).toBe("1.23");
        expect(obj.training_load_peak).toBe(101);
        expect(obj.total_strokes).toBe(34);
        expect(obj.avg_fractional_cadence).toBe("0.12");
        expect(obj.avg_left_torque_effectiveness).toBe("80.1");
        expect(obj.avg_left_pco).toBe(3);
        expect(obj.avg_left_power_phase).toBe("1.23, 2.35");
        expect(typeof obj.timestamp).toBe("string");
        expect(obj.floatVal).toBe("1.23");
    });
});

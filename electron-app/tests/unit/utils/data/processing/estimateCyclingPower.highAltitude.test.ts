import { describe, expect, it } from "vitest";

describe("estimateCyclingPower.js - High Altitude", () => {
    type FitMesgValue = number | string | boolean | Date | null | undefined;
    type FitMesg = Record<string, FitMesgValue>;

    it("should produce lower estimated power at high altitude compared to sea level for same speed/grade", async () => {
        console.log("Running High Altitude Test - Verifying Fix...");
        const mod =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");
        const { applyEstimatedPowerToRecords } = mod;

        const commonSettings = {
            enabled: true,
            riderWeightKg: 75,
            bikeWeightKg: 10,
            crr: 0.004,
            cda: 0.32,
            drivetrainEfficiency: 1.0, // 100% efficient for simpler calc
            windSpeedMps: 0,
            gradeWindowMeters: 35,
            maxPowerW: 2000,
        };

        // Sea level scenario (altitude 0)
        const seaLevelRecords: Array<FitMesg> = [
            { timestamp: 1000, speed: 10.0, altitude: 0, distance: 0 },
            { timestamp: 1001, speed: 10.0, altitude: 0, distance: 10 },
            { timestamp: 1002, speed: 10.0, altitude: 0, distance: 20 },
        ];

        applyEstimatedPowerToRecords({
            recordMesgs: seaLevelRecords,
            sessionMesgs: [{ sport: "cycling" }],
            settings: commonSettings,
        });

        // High altitude scenario (altitude 3000m)
        const highAltitudeRecords: Array<FitMesg> = [
            { timestamp: 1000, speed: 10.0, altitude: 3000, distance: 0 },
            { timestamp: 1001, speed: 10.0, altitude: 3000, distance: 10 },
            { timestamp: 1002, speed: 10.0, altitude: 3000, distance: 20 },
        ];

        applyEstimatedPowerToRecords({
            recordMesgs: highAltitudeRecords,
            sessionMesgs: [{ sport: "cycling" }],
            settings: commonSettings,
        });

        const seaLevelPower = seaLevelRecords[1].estimatedPower as number;
        const highAltPower = highAltitudeRecords[1].estimatedPower as number;

        // At 3000m, air density is lower, so aero drag is lower, so power required should be LOWER.
        expect(highAltPower).toBeLessThan(seaLevelPower);

        const extremeAltitudeRecords: Array<FitMesg> = [
            { timestamp: 1000, speed: 10.0, altitude: 5000, distance: 0 },
            { timestamp: 1001, speed: 10.0, altitude: 5000, distance: 10 },
            { timestamp: 1002, speed: 10.0, altitude: 5000, distance: 20 },
        ];

        applyEstimatedPowerToRecords({
            recordMesgs: extremeAltitudeRecords,
            sessionMesgs: [{ sport: "cycling" }],
            settings: commonSettings,
        });

        const extremeAltPower = extremeAltitudeRecords[1]
            .estimatedPower as number;

        // Ensure no clamping at 0.9 prevents extreme altitude differentiation
        expect(extremeAltPower).toBeLessThan(highAltPower);
    });
});

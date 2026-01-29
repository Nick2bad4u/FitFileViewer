import { describe, expect, it } from "vitest";

/**
 * These tests target the Estimated Power feature ("virtual power") implementation.
 *
 * Coverage goals:
 * - cover disable/empty/real-power/sport-skip guards
 * - cover distance sources (distance field, GPS haversine, speed integration)
 * - cover timestamp parsing (Date/string/seconds/ms)
 * - ensure estimatedPower is attached and clamped
 */

describe("estimateCyclingPower.js", () => {
    type FitMesgValue = number | string | boolean | Date | null | undefined;
    type FitMesg = Record<string, FitMesgValue>;

    it("hasPowerData should detect real power and enhanced_power", async () => {
        const mod = await import("../../../../../utils/data/processing/estimateCyclingPower.js");
        const { hasPowerData } = mod;

        expect(hasPowerData([{ power: 0 }])).toBe(false);
        expect(hasPowerData([{ enhanced_power: 0 }])).toBe(false);
        expect(hasPowerData([{ power: 123 }])).toBe(true);
        expect(hasPowerData([{ enhanced_power: 234 }])).toBe(true);
        expect(hasPowerData([{ power: "250" }])).toBe(true);
    });

    it("applyEstimatedPowerToRecords should no-op when disabled", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            { timestamp: new Date("2024-01-01T00:00:00Z"), enhanced_speed: 5, enhanced_altitude: 10, distance: 0 },
            { timestamp: new Date("2024-01-01T00:00:01Z"), enhanced_speed: 5, enhanced_altitude: 10, distance: 5 },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: false,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(false);
        expect(res.estimatedPowerW).toEqual([]);
        expect(records[0].estimatedPower).toBeUndefined();
    });

    it("applyEstimatedPowerToRecords should no-op when recordMesgs empty", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const res = applyEstimatedPowerToRecords({
            recordMesgs: [],
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(false);
        expect(res.estimatedPowerW).toEqual([]);
    });

    it("applyEstimatedPowerToRecords should not overwrite real power", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            { timestamp: 1_700_000_000, speed: 5, altitude: 10, distance: 0, power: 200 },
            { timestamp: 1_700_000_001, speed: 5, altitude: 10, distance: 5, power: 210 },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(false);
        expect(res.estimatedPowerW).toEqual([]);
        expect(records[0].estimatedPower).toBeUndefined();
    });

    it("applyEstimatedPowerToRecords should skip non-cycling sport when sport is known", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            { timestamp: 1_700_000_000_000, speed: 3.0, altitude: 10, distance: 0 },
            { timestamp: 1_700_000_001_000, speed: 3.0, altitude: 10, distance: 3 },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "running" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(false);
        expect(res.estimatedPowerW).toEqual([]);
    });

    it("applyEstimatedPowerToRecords should compute and attach estimatedPower using distance field", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            {
                timestamp: new Date("2024-01-01T00:00:00Z"),
                enhanced_speed: 7.0,
                enhanced_altitude: 100,
                distance: 0,
            },
            {
                timestamp: "2024-01-01T00:00:01Z",
                enhanced_speed: 7.0,
                enhanced_altitude: 101,
                distance: 7,
            },
            {
                // seconds timestamp branch
                timestamp: 1_700_000_002,
                enhanced_speed: "7.0",
                enhanced_altitude: "102",
                distance: 14,
            },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 5,
                maxPowerW: 500,
            },
        });

        expect(res.applied).toBe(true);
        expect(res.estimatedPowerW).toHaveLength(3);

        for (const [idx, r] of records.entries()) {
            const p = r.estimatedPower;
            expect(typeof p).toBe("number");
            expect(Number.isFinite(p as number)).toBe(true);
            expect((p as number) >= 0).toBe(true);
            expect((p as number) <= 500).toBe(true);
            expect(res.estimatedPowerW[idx]).toBe(p);
        }
    });

    it("produces plausible power for flat road at 36 km/h (sanity check)", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        // Flat, steady speed, sea level.
        const records: Array<FitMesg> = [
            { timestamp: 1000, speed: 10.0, altitude: 0, distance: 0 },
            { timestamp: 1001, speed: 10.0, altitude: 0, distance: 10 },
            { timestamp: 1002, speed: 10.0, altitude: 0, distance: 20 },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(true);
        const p = records[1].estimatedPower as number;
        expect(Number.isFinite(p)).toBe(true);

        // Expected ballpark is ~200-300 W for these parameters.
        // Keep the bounds wide to avoid false failures if constants are tweaked.
        expect(p).toBeGreaterThan(120);
        expect(p).toBeLessThan(450);
    });

    it("uphill (positive grade) should require more power than flat at same speed", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        // Construct an approximate 5% grade by increasing altitude proportional to distance.
        const flat: Array<FitMesg> = [
            { timestamp: 1000, speed: 5.0, altitude: 0, distance: 0 },
            { timestamp: 1001, speed: 5.0, altitude: 0, distance: 5 },
            { timestamp: 1002, speed: 5.0, altitude: 0, distance: 10 },
        ];

        const uphill: Array<FitMesg> = [
            { timestamp: 1000, speed: 5.0, altitude: 0, distance: 0 },
            { timestamp: 1001, speed: 5.0, altitude: 0.25, distance: 5 }, // 0.25m / 5m = 5%
            { timestamp: 1002, speed: 5.0, altitude: 0.5, distance: 10 },
        ];

        const settings = {
            enabled: true,
            riderWeightKg: 75,
            bikeWeightKg: 10,
            crr: 0.004,
            cda: 0.32,
            drivetrainEfficiency: 0.97,
            windSpeedMps: 0,
            gradeWindowMeters: 5,
            maxPowerW: 2000,
        };

        applyEstimatedPowerToRecords({ recordMesgs: flat, sessionMesgs: [{ sport: "cycling" }], settings });
        applyEstimatedPowerToRecords({ recordMesgs: uphill, sessionMesgs: [{ sport: "cycling" }], settings });

        const pFlat = flat[1].estimatedPower as number;
        const pUp = uphill[1].estimatedPower as number;
        expect(Number.isFinite(pFlat)).toBe(true);
        expect(Number.isFinite(pUp)).toBe(true);
        expect(pUp).toBeGreaterThan(pFlat);
    });

    it("zero speed should yield ~0 estimated power", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            { timestamp: 1000, speed: 0, altitude: 0, distance: 0 },
            { timestamp: 1001, speed: 0, altitude: 0, distance: 0 },
        ];

        applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(records[0].estimatedPower).toBe(0);
        expect(records[1].estimatedPower).toBe(0);
    });

    it("applyEstimatedPowerToRecords should fall back to GPS haversine when distance is missing", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        // ~small movement in degrees; pass as semicircles to hit the conversion branch.
        const semicircle = (deg: number) => Math.round((deg / 180) * 2 ** 31);

        const records: Array<FitMesg> = [
            {
                timestamp: 1_700_000_000,
                speed: 4.0,
                altitude: 100,
                position_lat: semicircle(42.0),
                position_long: semicircle(-83.0),
            },
            {
                timestamp: 1_700_000_001,
                speed: 4.0,
                altitude: 100,
                position_lat: semicircle(42.0001),
                position_long: semicircle(-83.0001),
            },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "bike" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(true);
        expect(res.estimatedPowerW).toHaveLength(2);
        expect(typeof records[0].estimatedPower).toBe("number");
    });

    it("should handle non-date timestamps and degree-based GPS values", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            // timestamp boolean hits toDateOrNull default return null
            { timestamp: true, speed: 4.0, altitude: 100, position_lat: 42.0, position_long: -83.0 },
            // degrees (abs <= 180) hits toDegreesOrNull return n branch
            { timestamp: 1_700_000_001, speed: 4.0, altitude: 100, position_lat: 42.0001, position_long: -83.0001 },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: 0,
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(true);
        expect(res.estimatedPowerW).toHaveLength(2);
        expect(Number.isFinite(res.estimatedPowerW[0])).toBe(true);
    });

    it("applyEstimatedPowerToRecords should fall back to speed integration when distance and GPS are missing", async () => {
        const { applyEstimatedPowerToRecords } =
            await import("../../../../../utils/data/processing/estimateCyclingPower.js");

        const records: Array<FitMesg> = [
            { timestamp: 1_700_000_000, speed: 5.0, altitude: 100 },
            { timestamp: 1_700_000_001, speed: 5.0, altitude: 100 },
            { timestamp: 1_700_000_002, speed: 5.0, altitude: 100 },
        ];

        const res = applyEstimatedPowerToRecords({
            recordMesgs: records,
            sessionMesgs: [{ sport: "cycling" }],
            settings: {
                enabled: true,
                riderWeightKg: 75,
                bikeWeightKg: 10,
                crr: 0.004,
                cda: 0.32,
                drivetrainEfficiency: 0.97,
                windSpeedMps: -2, // tailwind branch (vRel clamps to >= 0)
                gradeWindowMeters: 35,
                maxPowerW: 2000,
            },
        });

        expect(res.applied).toBe(true);
        expect(res.estimatedPowerW).toHaveLength(3);
        // Ensure values are finite and non-negative
        for (const p of res.estimatedPowerW) {
            expect(Number.isFinite(p)).toBe(true);
            expect(p >= 0).toBe(true);
        }
    });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockSet = vi.fn();

type StoredValue = boolean | number;

vi.mock("../../../../../utils/state/domain/settingsStateManager.js", () => ({
    getPowerEstimationSetting: (key: string) => mockGet(key),
    setPowerEstimationSetting: (key: string, value: StoredValue) => mockSet(key, value),
}));

describe("powerEstimationSettings.js", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getPowerEstimationSettings should return defaults when storage is empty", async () => {
        mockGet.mockReturnValue(undefined);

        const { getPowerEstimationSettings } =
            await import("../../../../../utils/data/processing/powerEstimationSettings.js");

        const s = getPowerEstimationSettings();

        expect(s.enabled).toBe(true);
        expect(s.riderWeightKg).toBe(75);
        expect(s.bikeWeightKg).toBe(10);
        expect(s.crr).toBe(0.004);
        expect(s.cda).toBe(0.32);
        expect(s.drivetrainEfficiency).toBe(0.97);
        expect(s.windSpeedMps).toBe(0);
        expect(s.gradeWindowMeters).toBe(35);
        expect(s.maxPowerW).toBe(2000);
    });

    it("getPowerEstimationSettings should respect stored values and handle invalid types", async () => {
        mockGet.mockImplementation((key: string) => {
            if (key === "enabled") return false;
            if (key === "riderWeightKg") return 82;
            if (key === "bikeWeightKg") return "bad";
            if (key === "crr") return 0.006;
            if (key === "cda") return 0.29;
            if (key === "drivetrainEfficiency") return 0.95;
            if (key === "windSpeedMps") return 1.5;
            if (key === "gradeWindowMeters") return 50;
            if (key === "maxPowerW") return 1800;
            return undefined;
        });

        const { getPowerEstimationSettings } =
            await import("../../../../../utils/data/processing/powerEstimationSettings.js");

        const s = getPowerEstimationSettings();

        expect(s.enabled).toBe(false);
        expect(s.riderWeightKg).toBe(82);
        // invalid type -> fallback
        expect(s.bikeWeightKg).toBe(10);
        expect(s.crr).toBe(0.006);
        expect(s.cda).toBe(0.29);
        expect(s.drivetrainEfficiency).toBe(0.95);
        expect(s.windSpeedMps).toBe(1.5);
        expect(s.gradeWindowMeters).toBe(50);
        expect(s.maxPowerW).toBe(1800);
    });

    it("setPowerEstimationSettings should persist all keys", async () => {
        const { setPowerEstimationSettings } =
            await import("../../../../../utils/data/processing/powerEstimationSettings.js");

        setPowerEstimationSettings({
            enabled: true,
            riderWeightKg: 90,
            bikeWeightKg: 12,
            crr: 0.005,
            cda: 0.31,
            drivetrainEfficiency: 0.96,
            windSpeedMps: 2,
            gradeWindowMeters: 40,
            maxPowerW: 1500,
        });

        expect(mockSet).toHaveBeenCalledWith("enabled", true);
        expect(mockSet).toHaveBeenCalledWith("riderWeightKg", 90);
        expect(mockSet).toHaveBeenCalledWith("bikeWeightKg", 12);
        expect(mockSet).toHaveBeenCalledWith("crr", 0.005);
        expect(mockSet).toHaveBeenCalledWith("cda", 0.31);
        expect(mockSet).toHaveBeenCalledWith("drivetrainEfficiency", 0.96);
        expect(mockSet).toHaveBeenCalledWith("windSpeedMps", 2);
        expect(mockSet).toHaveBeenCalledWith("gradeWindowMeters", 40);
        expect(mockSet).toHaveBeenCalledWith("maxPowerW", 1500);

        // Ensure exactly these keys were written.
        expect(mockSet.mock.calls.length).toBe(9);
    });
});

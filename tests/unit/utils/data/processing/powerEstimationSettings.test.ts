import { beforeEach, describe, expect, it, vi } from "vitest";

type StoredValue = boolean | number;

const mockGet = vi.fn<(key: string) => StoredValue | undefined>(),
    mockSet = vi.fn<(key: string, value: StoredValue) => void>();

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getPowerEstimationSetting: (key: string) => mockGet(key),
        setPowerEstimationSetting: (key: string, value: StoredValue) =>
            mockSet(key, value),
    })
);

describe("powerEstimationSettings.js", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getPowerEstimationSettings should return defaults when storage is empty", async () => {
        expect.assertions(1);

        mockGet.mockReturnValue(undefined);

        const { getPowerEstimationSettings } =
            await import("../../../../../electron-app/utils/data/processing/powerEstimationSettings.js");

        const s = getPowerEstimationSettings();

        expect(s).toEqual({
            bikeWeightKg: 10,
            cda: 0.32,
            crr: 0.004,
            drivetrainEfficiency: 0.97,
            enabled: true,
            gradeWindowMeters: 35,
            maxPowerW: 2000,
            riderWeightKg: 75,
            windSpeedMps: 0,
        });
    });

    it("getPowerEstimationSettings should respect stored values and handle invalid types", async () => {
        expect.assertions(1);

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
            await import("../../../../../electron-app/utils/data/processing/powerEstimationSettings.js");

        const s = getPowerEstimationSettings();

        expect(s).toEqual({
            bikeWeightKg: 10,
            cda: 0.29,
            crr: 0.006,
            drivetrainEfficiency: 0.95,
            enabled: false,
            gradeWindowMeters: 50,
            maxPowerW: 1800,
            riderWeightKg: 82,
            windSpeedMps: 1.5,
        });
    });

    it("setPowerEstimationSettings should persist all keys", async () => {
        expect.assertions(11);

        const storedSettings = new Map<string, StoredValue>();
        mockSet.mockImplementation((key, value) => {
            storedSettings.set(key, value);
        });
        mockGet.mockImplementation((key) => storedSettings.get(key));

        const { getPowerEstimationSettings, setPowerEstimationSettings } =
            await import("../../../../../electron-app/utils/data/processing/powerEstimationSettings.js");

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

        expect(getPowerEstimationSettings()).toEqual({
            bikeWeightKg: 12,
            cda: 0.31,
            crr: 0.005,
            drivetrainEfficiency: 0.96,
            enabled: true,
            gradeWindowMeters: 40,
            maxPowerW: 1500,
            riderWeightKg: 90,
            windSpeedMps: 2,
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
        expect(mockSet).toHaveBeenCalledTimes(9);
    });
});

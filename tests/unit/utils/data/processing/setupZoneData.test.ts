import { describe, expect, it, vi } from "vitest";

interface ZoneTestEntry {
    color?: string;
    label: string;
    time: number;
    zone: number;
}

interface ZoneTestGlobals {
    __FFV_debugCharts?: unknown;
    __FFV_debugChartsVerbose?: unknown;
    heartRateZones?: ZoneTestEntry[];
    powerZones?: ZoneTestEntry[];
}

const testGlobal = globalThis as typeof globalThis & ZoneTestGlobals;

const zoneDataMocks = vi.hoisted(() => ({
    applyZoneColors: vi.fn<
        (zones: ZoneTestEntry[], zoneType: "hr" | "power") => ZoneTestEntry[]
    >((zones, zoneType) =>
        zones.map((zone) => ({
            ...zone,
            color: `${zoneType}-${zone.zone}`,
        }))
    ),
    updateHRZoneControlsVisibility: vi.fn<(hasZoneData: boolean) => void>(),
    updatePowerZoneControlsVisibility: vi.fn<(hasZoneData: boolean) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createHRZoneControls.js"),
    () => ({
        updateHRZoneControlsVisibility:
            zoneDataMocks.updateHRZoneControlsVisibility,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createPowerZoneControls.js"),
    () => ({
        updatePowerZoneControlsVisibility:
            zoneDataMocks.updatePowerZoneControlsVisibility,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        applyZoneColors: zoneDataMocks.applyZoneColors,
    })
);

const loadModule = async () => {
    vi.resetModules();
    return await import("../../../../../electron-app/utils/data/processing/setupZoneData.js");
};

function resetTestState(): void {
    vi.clearAllMocks();
    delete testGlobal.heartRateZones;
    delete testGlobal.powerZones;
    delete testGlobal.__FFV_debugCharts;
    delete testGlobal.__FFV_debugChartsVerbose;
}

describe("setupZoneData", () => {
    it("returns existing global zones when global data is unavailable", async () => {
        expect.assertions(3);

        resetTestState();
        const existingHrZones = [{ label: "Existing HR", time: 10, zone: 1 }];
        const existingPowerZones = [
            { label: "Existing Power", time: 20, zone: 1 },
        ];
        testGlobal.heartRateZones = existingHrZones;
        testGlobal.powerZones = existingPowerZones;

        const { setupZoneData } = await loadModule();
        const result = setupZoneData(null);

        expect(result).toStrictEqual({
            hasHRZoneData: true,
            hasPowerZoneData: true,
            heartRateZones: existingHrZones,
            powerZones: existingPowerZones,
        });
        expect(
            zoneDataMocks.updateHRZoneControlsVisibility
        ).not.toHaveBeenCalled();
        expect(
            zoneDataMocks.updatePowerZoneControlsVisibility
        ).not.toHaveBeenCalled();
    });

    it("builds session time-in-zone HR and power globals", async () => {
        expect.assertions(7);

        resetTestState();
        const { setupZoneData } = await loadModule();

        const result = setupZoneData({
            timeInZoneMesgs: [
                {
                    referenceMesg: "session",
                    timeInHrZone: [
                        0,
                        30,
                        null,
                        45,
                    ],
                    timeInPowerZone: [
                        0,
                        50,
                        0,
                        75,
                    ],
                },
            ],
        });

        expect(result.heartRateZones).toStrictEqual([
            { color: "hr-1", label: "Zone 1", time: 30, zone: 1 },
            { color: "hr-3", label: "Zone 3", time: 45, zone: 3 },
        ]);
        expect(result.powerZones).toStrictEqual([
            { color: "power-1", label: "Zone 1", time: 50, zone: 1 },
            { color: "power-3", label: "Zone 3", time: 75, zone: 3 },
        ]);
        expect(testGlobal.heartRateZones).toBe(result.heartRateZones);
        expect(testGlobal.powerZones).toBe(result.powerZones);
        expect(
            zoneDataMocks.updateHRZoneControlsVisibility
        ).toHaveBeenCalledWith(true);
        expect(
            zoneDataMocks.updatePowerZoneControlsVisibility
        ).toHaveBeenCalledWith(true);
        expect(zoneDataMocks.applyZoneColors).toHaveBeenCalledWith(
            [
                { label: "Zone 1", time: 30, zone: 1 },
                { label: "Zone 3", time: 45, zone: 3 },
            ],
            "hr"
        );
    });

    it("falls back to legacy session message zone arrays", async () => {
        expect.assertions(2);

        resetTestState();
        const { setupZoneData } = await loadModule();

        const result = setupZoneData({
            sessionMesgs: [
                {
                    time_in_hr_zone: [
                        0,
                        10,
                        20,
                    ],
                    time_in_power_zone: [0, 15],
                },
            ],
            timeInZoneMesgs: [],
        });

        expect(result.heartRateZones).toStrictEqual([
            { color: "hr-1", label: "Zone 1", time: 10, zone: 1 },
            { color: "hr-2", label: "Zone 2", time: 20, zone: 2 },
        ]);
        expect(result.powerZones).toStrictEqual([
            { color: "power-1", label: "Zone 1", time: 15, zone: 1 },
        ]);
    });

    it("aggregates lap zone arrays when session data is absent", async () => {
        expect.assertions(2);

        resetTestState();
        const { setupZoneData } = await loadModule();

        const result = setupZoneData({
            lapMesgs: [
                {
                    time_in_hr_zone: [
                        0,
                        10,
                        5,
                    ],
                    time_in_power_zone: [0, 7],
                },
                {
                    time_in_hr_zone: [
                        0,
                        30,
                        0,
                    ],
                    time_in_power_zone: [0, 3],
                },
            ],
            sessionMesgs: [],
            timeInZoneMesgs: [],
        });

        expect(result.heartRateZones).toStrictEqual([
            { color: "hr-1", label: "Zone 1", time: 40, zone: 1 },
            { color: "hr-2", label: "Zone 2", time: 5, zone: 2 },
        ]);
        expect(result.powerZones).toStrictEqual([
            { color: "power-1", label: "Zone 1", time: 10, zone: 1 },
        ]);
    });
});

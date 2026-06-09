import { beforeEach, describe, expect, it, vi } from "vitest";

interface TestZone {
    color?: string;
    label?: string;
    time?: number;
    zone?: number;
}

type ZoneKind = "hr" | "power";

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createPowerZoneControls.js"),
    () => ({
        updatePowerZoneControlsVisibility: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/controls/createHRZoneControls.js"),
    () => ({
        updateHRZoneControlsVisibility: vi.fn<() => void>(),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        applyZoneColors: (zones: TestZone[], kind: ZoneKind) =>
            zones.map((z) => ({
                ...z,
                color: kind === "hr" ? "#f00" : "#00f",
            })),
    })
);

type SetupZoneDataModule =
    typeof import("../../../../../electron-app/utils/data/processing/setupZoneData.js");
type ZoneDataStateModule =
    typeof import("../../../../../electron-app/utils/data/zones/zoneDataState.js");

async function importSetupZoneData(): Promise<
    SetupZoneDataModule & ZoneDataStateModule
> {
    const setupZoneDataModule =
        await import("../../../../../electron-app/utils/data/processing/setupZoneData.js");
    const zoneDataStateModule =
        await import("../../../../../electron-app/utils/data/zones/zoneDataState.js");
    return {
        ...setupZoneDataModule,
        ...zoneDataStateModule,
    };
}

describe("setupZoneData", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("returns existing stored zones when no data", async () => {
        expect.assertions(3);

        const { setZoneDataByType, setupZoneData } =
            await importSetupZoneData();
        setZoneDataByType("hr", [{ zone: 1, time: 10 }]);
        const res = setupZoneData(null);
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(false);
        expect(res.heartRateZones).toHaveLength(1);
    });

    it("uses timeInZoneMesgs session aggregate", async () => {
        expect.assertions(5);

        const { getHeartRateZones, setupZoneData } =
            await importSetupZoneData();
        const res = setupZoneData({
            timeInZoneMesgs: [
                {
                    referenceMesg: "session",
                    timeInHrZone: [
                        0,
                        5,
                        0,
                        3,
                    ],
                    timeInPowerZone: [
                        0,
                        0,
                        4,
                    ],
                },
            ],
        });
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(true);
        expect(res.heartRateZones.map((z) => z.zone)).toEqual([1, 3]);
        expect(res.powerZones.map((z) => z.zone)).toEqual([2]);
        expect(getHeartRateZones().length).toBeGreaterThan(0);
    });

    it("falls back to sessionMesgs when no timeInZoneMesgs", async () => {
        expect.assertions(4);

        const { setupZoneData } = await importSetupZoneData();
        const res = setupZoneData({
            sessionMesgs: [
                { time_in_hr_zone: [0, 2], time_in_power_zone: [0, 7] },
            ],
        });
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(true);
        expect(res.heartRateZones[0]).toMatchObject({ zone: 1, time: 2 });
        expect(res.powerZones[0]).toMatchObject({ zone: 1, time: 7 });
    });

    it("aggregates from lapMesgs as last resort", async () => {
        expect.assertions(4);

        const { setupZoneData } = await importSetupZoneData();
        const res = setupZoneData({
            lapMesgs: [
                {
                    time_in_hr_zone: [
                        0,
                        1,
                        0,
                    ],
                    time_in_power_zone: [
                        0,
                        0,
                        2,
                    ],
                },
                {
                    time_in_hr_zone: [
                        0,
                        3,
                        0,
                    ],
                    time_in_power_zone: [
                        0,
                        5,
                        0,
                    ],
                },
            ],
        });
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(true);
        expect(res.heartRateZones.map((z) => z.time)).toEqual([4]);
        expect(res.powerZones.map((z) => z.zone)).toEqual([1, 2]);
    });
});

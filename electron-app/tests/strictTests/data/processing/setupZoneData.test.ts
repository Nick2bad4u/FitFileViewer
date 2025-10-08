import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../utils/ui/controls/createPowerZoneControls.js", () => ({
    updatePowerZoneControlsVisibility: vi.fn(),
}));
vi.mock("../../../utils/ui/controls/createHRZoneControls.js", () => ({
    updateHRZoneControlsVisibility: vi.fn(),
}));
vi.mock("../../../utils/data/zones/chartZoneColorUtils.js", () => ({
    applyZoneColors: (zones: any[], kind: string) =>
        zones.map((z) => ({ ...z, color: kind === "hr" ? "#f00" : "#00f" })),
}));

const modPath = "../../../../utils/data/processing/setupZoneData.js";

describe("setupZoneData", () => {
    beforeEach(() => {
        if (!(globalThis as any).window) {
            (globalThis as any).window = globalThis;
        }
        if (typeof (globalThis as any).window.addEventListener !== "function") {
            (globalThis as any).window.addEventListener = vi.fn();
        }
        (globalThis as any).window.heartRateZones = [];
        (globalThis as any).window.powerZones = [];
        vi.resetModules();
    });

    it("returns existing globals when no data", async () => {
        (globalThis as any).window.heartRateZones = [{ zone: 1, time: 10 }];
        const { setupZoneData } = await import(modPath);
        const res = setupZoneData(null as any);
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(false);
        expect(res.heartRateZones.length).toBe(1);
    });

    it("uses timeInZoneMesgs session aggregate", async () => {
        const { setupZoneData } = await import(modPath);
        const res = setupZoneData({
            timeInZoneMesgs: [{ referenceMesg: "session", timeInHrZone: [0, 5, 0, 3], timeInPowerZone: [0, 0, 4] }],
        } as any);
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(true);
        expect(res.heartRateZones.map((z: any) => z.zone)).toEqual([1, 3]);
        expect(res.powerZones.map((z: any) => z.zone)).toEqual([2]);
        expect((globalThis as any).window.heartRateZones.length).toBeGreaterThan(0);
    });

    it("falls back to sessionMesgs when no timeInZoneMesgs", async () => {
        const { setupZoneData } = await import(modPath);
        const res = setupZoneData({ sessionMesgs: [{ time_in_hr_zone: [0, 2], time_in_power_zone: [0, 7] }] } as any);
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(true);
        expect(res.heartRateZones[0]).toMatchObject({ zone: 1, time: 2 });
        expect(res.powerZones[0]).toMatchObject({ zone: 1, time: 7 });
    });

    it("aggregates from lapMesgs as last resort", async () => {
        const { setupZoneData } = await import(modPath);
        const res = setupZoneData({
            lapMesgs: [
                { time_in_hr_zone: [0, 1, 0], time_in_power_zone: [0, 0, 2] },
                { time_in_hr_zone: [0, 3, 0], time_in_power_zone: [0, 5, 0] },
            ],
        } as any);
        expect(res.hasHRZoneData).toBe(true);
        expect(res.hasPowerZoneData).toBe(true);
        expect(res.heartRateZones.map((z: any) => z.time)).toEqual([4]); // zone1: 1+3
        expect(res.powerZones.map((z: any) => z.zone)).toEqual([1, 2]);
    });
});

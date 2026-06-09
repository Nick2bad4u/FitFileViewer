import type { ZoneData } from "./chartZoneColorUtils.js";

type ZoneType = "hr" | "power";

let heartRateZones: ZoneData[] = [];
let powerZones: ZoneData[] = [];

/** Clears all cached zone data. Primarily used by tests and full file resets. */
export function clearZoneDataState(): void {
    heartRateZones = [];
    powerZones = [];
}

/** Returns the latest heart-rate zone data extracted from the active FIT file. */
export function getHeartRateZones(): ZoneData[] {
    return heartRateZones;
}

/** Returns the latest power zone data extracted from the active FIT file. */
export function getPowerZones(): ZoneData[] {
    return powerZones;
}

/** Returns the latest zone data for the requested zone family. */
export function getZoneDataByType(zoneType: ZoneType): ZoneData[] {
    return zoneType === "hr" ? heartRateZones : powerZones;
}

/** Stores zone data for the requested zone family. */
export function setZoneDataByType(
    zoneType: ZoneType,
    zones: readonly ZoneData[]
): ZoneData[] {
    const nextZones = [...zones];
    if (zoneType === "hr") {
        heartRateZones = nextZones;
        return heartRateZones;
    }

    powerZones = nextZones;
    return powerZones;
}

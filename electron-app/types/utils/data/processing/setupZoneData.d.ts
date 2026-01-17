/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 * @typedef {{zone?:number; time?:number; label?:string; color?:string}} ZoneEntry
 * @typedef {{referenceMesg?:string; timeInHrZone?: (number|null)[]; timeInPowerZone?: (number|null)[]}} TimeInZoneMesg
 * @typedef {{time_in_hr_zone?: (number|null)[]; time_in_power_zone?: (number|null)[]}} SessionMesg
 * @typedef {{time_in_hr_zone?: (number|null)[]; time_in_power_zone?: (number|null)[]}} LapMesg
 * @typedef {Object} GlobalData
 * @property {TimeInZoneMesg[]=} timeInZoneMesgs
 * @property {SessionMesg[]=} sessionMesgs
 * @property {LapMesg[]=} lapMesgs
 */
/**
 * Extracts and sets up heart rate and power zone data from FIT file
 * (Populates window.heartRateZones / window.powerZones side-effectfully)
 * @param {GlobalData | null | undefined} globalData
 * @returns {{ heartRateZones: ZoneEntry[]; powerZones: ZoneEntry[]; hasHRZoneData: boolean; hasPowerZoneData: boolean }}
 */
export function setupZoneData(globalData: GlobalData | null | undefined): {
    heartRateZones: ZoneEntry[];
    powerZones: ZoneEntry[];
    hasHRZoneData: boolean;
    hasPowerZoneData: boolean;
};
/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 */
export type ZoneEntry = {
    zone?: number;
    time?: number;
    label?: string;
    color?: string;
};
/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 */
export type TimeInZoneMesg = {
    referenceMesg?: string;
    timeInHrZone?: (number | null)[];
    timeInPowerZone?: (number | null)[];
};
/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 */
export type SessionMesg = {
    time_in_hr_zone?: (number | null)[];
    time_in_power_zone?: (number | null)[];
};
/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 */
export type LapMesg = {
    time_in_hr_zone?: (number | null)[];
    time_in_power_zone?: (number | null)[];
};
/**
 * NOTE: Existing global window.heartRateZones / powerZones may contain objects with optional properties;
 * to stay compatible we mark fields optional, while generation below always supplies them.
 */
export type GlobalData = {
    timeInZoneMesgs?: TimeInZoneMesg[] | undefined;
    sessionMesgs?: SessionMesg[] | undefined;
    lapMesgs?: LapMesg[] | undefined;
};

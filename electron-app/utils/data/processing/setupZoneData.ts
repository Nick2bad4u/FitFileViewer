import { updateHRZoneControlsVisibility } from "../../ui/controls/createHRZoneControls.js";
import { updatePowerZoneControlsVisibility } from "../../ui/controls/createPowerZoneControls.js";
import { isDevelopmentEnvironment } from "../../runtime/processEnvironment.js";
import {
    applyZoneColors,
    type ZoneData,
} from "../zones/chartZoneColorUtils.js";
import {
    getZoneDataByType,
    setZoneDataByType,
} from "../zones/zoneDataState.js";

interface ZoneEntry extends ZoneData {
    color?: string;
    label: string;
    time: number;
    zone: number;
}

interface TimeInZoneMesg {
    readonly referenceMesg?: string;
    readonly timeInHrZone?: readonly NullishNumber[];
    readonly timeInPowerZone?: readonly NullishNumber[];
}

interface SessionMesg {
    readonly time_in_hr_zone?: readonly NullishNumber[];
    readonly time_in_power_zone?: readonly NullishNumber[];
}

interface LapMesg {
    readonly time_in_hr_zone?: readonly NullishNumber[];
    readonly time_in_power_zone?: readonly NullishNumber[];
}

interface FitZoneActivityData {
    readonly lapMesgs?: readonly LapMesg[];
    readonly sessionMesgs?: readonly SessionMesg[];
    readonly timeInZoneMesgs?: readonly TimeInZoneMesg[];
}

interface ZoneGlobals {
    readonly __FFV_debugCharts?: unknown;
    readonly __FFV_debugChartsVerbose?: unknown;
}

interface SetupZoneDataResult {
    readonly hasHRZoneData: boolean;
    readonly hasPowerZoneData: boolean;
    readonly heartRateZones: ZoneEntry[];
    readonly powerZones: ZoneEntry[];
}

type LooseRecord = Record<string, unknown>;
type NullishNumber = null | number | undefined;
type ZoneType = "hr" | "power";

interface ZoneDataState {
    hasHRZoneData: boolean;
    hasPowerZoneData: boolean;
    heartRateZones: ZoneEntry[];
    powerZones: ZoneEntry[];
}

const zoneGlobal = globalThis as typeof globalThis & ZoneGlobals;

function isDebugLoggingEnabled(): boolean {
    return isDevelopmentEnvironment() && Boolean(zoneGlobal.__FFV_debugCharts);
}

function shouldLogVerboseZoneData(): boolean {
    return (
        isDebugLoggingEnabled() && Boolean(zoneGlobal.__FFV_debugChartsVerbose)
    );
}

function buildZones(zoneTimes: readonly NullishNumber[]): ZoneEntry[] {
    return zoneTimes
        .slice(1)
        .map((time, index) => ({
            label: `Zone ${index + 1}`,
            time: Number(time) || 0,
            zone: index + 1,
        }))
        .filter((zone) => zone.time > 0);
}

function colorizeZones(zones: ZoneEntry[], zoneType: ZoneType): ZoneEntry[] {
    return applyZoneColors(zones, zoneType).map((zone, index) => ({
        label: zone.label ?? `Zone ${index + 1}`,
        time: zone.time ?? 0,
        zone: zone.zone ?? index + 1,
        ...(zone.color ? { color: zone.color } : {}),
    }));
}

function sumLapZoneTimes(
    laps: readonly LapMesg[],
    fieldName: "time_in_hr_zone" | "time_in_power_zone"
): number[] {
    const zoneTimes: number[] = [];

    for (const lap of laps) {
        const lapZoneTimes = lap[fieldName];
        if (!lapZoneTimes) {
            continue;
        }

        for (const [index, time] of lapZoneTimes.entries()) {
            const currentTime = typeof time === "number" ? time : 0;
            zoneTimes[index] = (zoneTimes[index] ?? 0) + currentTime;
        }
    }

    return zoneTimes;
}

function hasPositiveZoneTimes(zoneTimes: readonly number[]): boolean {
    return zoneTimes.length > 1 && zoneTimes.slice(1).some((time) => time > 0);
}

function getExistingZones(zoneType: ZoneType): ZoneEntry[] {
    const zones = getZoneDataByType(zoneType);
    return Array.isArray(zones) ? (zones as ZoneEntry[]) : [];
}

function setZones(zoneType: ZoneType, zones: ZoneEntry[]): ZoneEntry[] {
    return setZoneDataByType(zoneType, zones) as ZoneEntry[];
}

function logZoneData(message: string, data?: unknown): void {
    if (isDebugLoggingEnabled()) {
        console.log(message, data);
    }
}

function isLooseRecord(value: unknown): value is LooseRecord {
    return typeof value === "object" && value !== null;
}

function getRecordArray(value: unknown): readonly LooseRecord[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value.filter(isLooseRecord);
}

function getZoneTimeArray(
    value: unknown
): readonly NullishNumber[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value.map((time) => (typeof time === "number" ? time : null));
}

function normalizeTimeInZoneMesg(record: LooseRecord): TimeInZoneMesg {
    const timeInHrZone = getZoneTimeArray(record["timeInHrZone"]);
    const timeInPowerZone = getZoneTimeArray(record["timeInPowerZone"]);

    return {
        ...(typeof record["referenceMesg"] === "string"
            ? { referenceMesg: record["referenceMesg"] }
            : {}),
        ...(timeInHrZone ? { timeInHrZone } : {}),
        ...(timeInPowerZone ? { timeInPowerZone } : {}),
    };
}

function normalizeSessionMesg(record: LooseRecord): SessionMesg {
    const timeInHrZone = getZoneTimeArray(record["time_in_hr_zone"]);
    const timeInPowerZone = getZoneTimeArray(record["time_in_power_zone"]);

    return {
        ...(timeInHrZone ? { time_in_hr_zone: timeInHrZone } : {}),
        ...(timeInPowerZone ? { time_in_power_zone: timeInPowerZone } : {}),
    };
}

function normalizeFitZoneActivityData(
    activityData: unknown
): FitZoneActivityData | null {
    if (!isLooseRecord(activityData)) {
        return null;
    }

    const lapMesgs = getRecordArray(activityData["lapMesgs"]);
    const sessionMesgs = getRecordArray(activityData["sessionMesgs"]);
    const timeInZoneMesgs = getRecordArray(activityData["timeInZoneMesgs"]);

    return {
        ...(lapMesgs
            ? {
                  lapMesgs: lapMesgs.map((lapMesg) =>
                      normalizeSessionMesg(lapMesg)
                  ),
              }
            : {}),
        ...(sessionMesgs
            ? {
                  sessionMesgs: sessionMesgs.map((sessionMesg) =>
                      normalizeSessionMesg(sessionMesg)
                  ),
              }
            : {}),
        ...(timeInZoneMesgs
            ? {
                  timeInZoneMesgs: timeInZoneMesgs.map((timeInZoneMesg) =>
                      normalizeTimeInZoneMesg(timeInZoneMesg)
                  ),
              }
            : {}),
    };
}

function createInitialZoneState(): ZoneDataState {
    const heartRateZones = getExistingZones("hr");
    const powerZones = getExistingZones("power");
    return {
        hasHRZoneData: heartRateZones.length > 0,
        hasPowerZoneData: powerZones.length > 0,
        heartRateZones,
        powerZones,
    };
}

function applyZoneTimes(
    state: ZoneDataState,
    zoneType: ZoneType,
    zoneTimes: readonly NullishNumber[] | undefined,
    logMessage: string
): void {
    if (!zoneTimes) {
        return;
    }

    const zones = colorizeZones(buildZones(zoneTimes), zoneType);
    if (zones.length === 0) {
        return;
    }

    const storedZones = setZones(zoneType, zones);
    if (zoneType === "hr") {
        state.heartRateZones = storedZones;
        state.hasHRZoneData = true;
        logZoneData(logMessage, state.heartRateZones);
        return;
    }

    state.powerZones = storedZones;
    state.hasPowerZoneData = true;
    logZoneData(logMessage, state.powerZones);
}

function logTimeInZoneMessages(
    timeInZoneMesgs: readonly TimeInZoneMesg[]
): void {
    if (!isDebugLoggingEnabled()) {
        return;
    }

    for (const [index, zoneMessage] of timeInZoneMesgs.entries()) {
        console.log(
            `[ChartJS] TimeInZone ${index} fields:`,
            Object.keys(zoneMessage)
        );

        if (shouldLogVerboseZoneData()) {
            console.log(`[ChartJS] TimeInZone ${index} data:`, zoneMessage);
        }
    }
}

function applyTimeInZoneMesgs(
    state: ZoneDataState,
    timeInZoneMesgs: readonly TimeInZoneMesg[] | undefined
): void {
    if (!timeInZoneMesgs) {
        return;
    }

    logZoneData("[ChartJS] Found timeInZoneMesgs:", timeInZoneMesgs.length);
    logTimeInZoneMessages(timeInZoneMesgs);

    const sessionZoneData = timeInZoneMesgs.find(
        (zoneMessage) => zoneMessage.referenceMesg === "session"
    );
    applyZoneTimes(
        state,
        "hr",
        sessionZoneData?.timeInHrZone,
        "[ChartJS] Heart rate zones data set:"
    );
    applyZoneTimes(
        state,
        "power",
        sessionZoneData?.timeInPowerZone,
        "[ChartJS] Power zones data set:"
    );
}

function applySessionZoneMesgs(
    state: ZoneDataState,
    sessionMesgs: readonly SessionMesg[] | undefined
): void {
    if (!sessionMesgs) {
        return;
    }

    if (state.heartRateZones.length === 0) {
        const sessionWithHrZones = sessionMesgs.find(
            (session) => session.time_in_hr_zone
        );
        applyZoneTimes(
            state,
            "hr",
            sessionWithHrZones?.time_in_hr_zone,
            "[ChartJS] HR zones from sessionMesgs:"
        );
    }

    if (state.powerZones.length === 0) {
        const sessionWithPowerZones = sessionMesgs.find(
            (session) => session.time_in_power_zone
        );
        applyZoneTimes(
            state,
            "power",
            sessionWithPowerZones?.time_in_power_zone,
            "[ChartJS] Power zones from sessionMesgs:"
        );
    }
}

function applyLapZoneMesgs(
    state: ZoneDataState,
    lapMesgs: readonly LapMesg[] | undefined
): void {
    if (
        state.heartRateZones.length > 0 ||
        state.powerZones.length > 0 ||
        !lapMesgs ||
        lapMesgs.length === 0
    ) {
        return;
    }

    logZoneData("[ChartJS] Aggregating zone data from lapMesgs");

    const hrZoneTimes = sumLapZoneTimes(lapMesgs, "time_in_hr_zone");
    if (hasPositiveZoneTimes(hrZoneTimes)) {
        applyZoneTimes(
            state,
            "hr",
            hrZoneTimes,
            "[ChartJS] HR zones from laps:"
        );
    }

    const powerZoneTimes = sumLapZoneTimes(lapMesgs, "time_in_power_zone");
    if (hasPositiveZoneTimes(powerZoneTimes)) {
        applyZoneTimes(
            state,
            "power",
            powerZoneTimes,
            "[ChartJS] Power zones from laps:"
        );
    }
}

function toSetupZoneDataResult(state: ZoneDataState): SetupZoneDataResult {
    return {
        hasHRZoneData: state.hasHRZoneData,
        hasPowerZoneData: state.hasPowerZoneData,
        heartRateZones: state.heartRateZones,
        powerZones: state.powerZones,
    };
}

/**
 * Extracts zone data from FIT activity data and stores it for chart modules.
 */
export function setupZoneData(activityData: unknown): SetupZoneDataResult {
    const state = createInitialZoneState();
    const zoneData = normalizeFitZoneActivityData(activityData);

    try {
        if (!zoneData) {
            return toSetupZoneDataResult(state);
        }

        logZoneData(
            "[ChartJS] Setting up zone data from FIT activity data:",
            zoneData
        );

        applyTimeInZoneMesgs(state, zoneData.timeInZoneMesgs);
        applySessionZoneMesgs(state, zoneData.sessionMesgs);
        applyLapZoneMesgs(state, zoneData.lapMesgs);

        updatePowerZoneControlsVisibility(state.hasPowerZoneData);
        updateHRZoneControlsVisibility(state.hasHRZoneData);
    } catch (error) {
        console.error(
            "[ChartJS] Error setting up zone data:",
            error instanceof Error ? error.message : error
        );
    }

    return toSetupZoneDataResult(state);
}

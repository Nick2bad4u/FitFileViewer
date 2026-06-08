import {
    getAuxHeartRateValue,
    resolveFieldDescriptionMessages,
} from "../../data/processing/auxHeartRateUtils.js";
import { getState } from "../../state/core/stateManager.js";

interface RecordMessage extends Record<string, unknown> {
    altitude?: number;
    auxHeartRate?: number;
    cadence?: number;
    distance?: number;
    estimatedPower?: number;
    heartRate?: number;
    positionLat?: number;
    positionLong?: number;
    power?: number;
    speed?: number;
    timestamp?: Date | number | string;
}

const FORMATTING_CONSTANTS = {
    CONVERSION_FACTORS: {
        KM_TO_MILES: 0.621_371,
        METERS_TO_FEET: 3.280_84,
        METERS_TO_KM: 1000,
        MPS_TO_KMH: 3.6,
        MPS_TO_MPH: 2.236_94,
    },
    DECIMAL_PLACES: {
        ALTITUDE_FEET: 0,
        ALTITUDE_METERS: 1,
        CADENCE: 1,
        DISTANCE_KM: 2,
        DISTANCE_MI: 2,
        HEART_RATE: 1,
        POWER: 1,
        SPEED: 1,
    },
    LOG_PREFIX: "[TooltipFormatter]",
    TIME_UNITS: {
        SECONDS_PER_HOUR: 3600,
        SECONDS_PER_MINUTE: 60,
    },
} as const;

/**
 * Formats a record message into tooltip HTML for map and chart overlays.
 */
export function formatTooltipData(
    idx: unknown,
    row: unknown,
    lapNum: unknown,
    recordMesgsOverride?: RecordMessage[]
): string {
    try {
        if (!isRecordMessage(row)) {
            logWithContext("Invalid row data provided", "warn");
            return "No data available";
        }

        const record = row;
        const recordMesgs =
            recordMesgsOverride ??
            getRecordMessagesFromState() ??
            getRecordMessagesFromManagedGlobalData();
        const globalData = getTooltipGlobalData();
        const fieldDescriptionMesgs =
            resolveFieldDescriptionMessages(globalData);
        const tooltipParts = [`<b>Lap:</b> ${lapNum}`, `<b>Index:</b> ${idx}`];

        const dateStr = record.timestamp
            ? new Date(record.timestamp).toLocaleString()
            : "";
        const rideTime = formatRideTime(record.timestamp ?? "", recordMesgs);
        const distance = formatDistance(record.distance ?? null);
        const altitude = formatAltitude(record.altitude ?? null);
        const heartRate = formatHeartRate(record.heartRate ?? null);
        const auxHeartRateOptions: {
            fieldDescriptionMesgs: unknown[];
            recordMesgs?: RecordMessage[];
        } = { fieldDescriptionMesgs };
        if (recordMesgs) {
            auxHeartRateOptions.recordMesgs = recordMesgs;
        }
        const auxHeartRate = formatHeartRate(
            getAuxHeartRateValue(record, auxHeartRateOptions)
        );
        const speed = formatSpeed(record.speed ?? null);
        const power = formatPower(record.power ?? null);
        const cadence = formatCadence(record.cadence ?? null);

        if (dateStr) {
            tooltipParts.push(`<b>Time:</b> ${dateStr}`);
        }
        if (rideTime) {
            tooltipParts.push(`<b>Elapsed Time:</b> ${rideTime}`);
        }
        if (distance) {
            tooltipParts.push(
                `<b>Distance:</b> ${distance.replace("<br>", "")}`
            );
        }
        if (altitude) {
            tooltipParts.push(`<b>Alt:</b> ${altitude}`);
        }
        if (heartRate) {
            tooltipParts.push(`<b>HR:</b> ${heartRate}`);
        }
        if (auxHeartRate) {
            tooltipParts.push(`<b>Aux HR:</b> ${auxHeartRate}`);
        }
        if (speed) {
            tooltipParts.push(`<b>Speed:</b> ${speed}`);
        }
        if (isFiniteNumber(record.power)) {
            tooltipParts.push(`<b>Power:</b> ${power}`);
        } else if (isFiniteNumber(record.estimatedPower)) {
            tooltipParts.push(
                `<b>Est. Power:</b> ${record.estimatedPower.toFixed(0)} W`
            );
        }
        if (cadence) {
            tooltipParts.push(`<b>Cadence:</b> ${cadence}`);
        }

        return tooltipParts.join("<br>");
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logWithContext(`Error formatting tooltip data: ${errorMsg}`, "error");
        return `Error loading data (Index: ${idx || "unknown"})`;
    }
}

function formatAltitude(altitude: unknown): string {
    const altMeters = safeToNumber(altitude, "altitude");
    if (altMeters === null) {
        return "";
    }

    const { ALTITUDE_FEET, ALTITUDE_METERS } =
        FORMATTING_CONSTANTS.DECIMAL_PLACES;
    const { METERS_TO_FEET } = FORMATTING_CONSTANTS.CONVERSION_FACTORS;
    const altFeet = altMeters * METERS_TO_FEET;
    return `${altMeters.toFixed(ALTITUDE_METERS)} m / ${altFeet.toFixed(ALTITUDE_FEET)} ft`;
}

function formatCadence(cadence: unknown): string {
    const rpm = safeToNumber(cadence, "cadence");
    if (rpm === null) {
        return "";
    }

    return `${rpm.toFixed(FORMATTING_CONSTANTS.DECIMAL_PLACES.CADENCE)} rpm`;
}

function formatDistance(distance: unknown): string {
    const meters = safeToNumber(distance, "distance");
    if (meters === null) {
        return "";
    }

    const { DISTANCE_KM, DISTANCE_MI } = FORMATTING_CONSTANTS.DECIMAL_PLACES;
    const { KM_TO_MILES, METERS_TO_KM } =
        FORMATTING_CONSTANTS.CONVERSION_FACTORS;
    const km = meters / METERS_TO_KM;
    const mi = km * KM_TO_MILES;

    return `${km.toFixed(DISTANCE_KM)} km / ${mi.toFixed(DISTANCE_MI)} mi<br>`;
}

function formatHeartRate(heartRate: unknown): string {
    const hr = safeToNumber(heartRate, "heart rate");
    if (hr === null) {
        return "";
    }

    return `${hr.toFixed(FORMATTING_CONSTANTS.DECIMAL_PLACES.HEART_RATE)} bpm`;
}

function formatPower(power: unknown): string {
    const watts = safeToNumber(power, "power");
    if (watts === null) {
        return "";
    }

    return `${watts.toFixed(FORMATTING_CONSTANTS.DECIMAL_PLACES.POWER)} W`;
}

function formatRideTime(
    timestamp: Date | number | string,
    recordMesgs: RecordMessage[] | undefined
): string {
    if (!timestamp || !recordMesgs || recordMesgs.length === 0) {
        return "";
    }

    try {
        const first = recordMesgs.find((record) => record.timestamp != null);
        if (!first?.timestamp) {
            return "";
        }

        const currTime = new Date(timestamp).getTime();
        const firstTime = new Date(first.timestamp).getTime();

        if (Number.isNaN(firstTime) || Number.isNaN(currTime)) {
            logWithContext(
                "Invalid timestamp in ride time calculation",
                "warn"
            );
            return "";
        }

        const { SECONDS_PER_HOUR, SECONDS_PER_MINUTE } =
            FORMATTING_CONSTANTS.TIME_UNITS;
        const diff = Math.max(0, Math.floor((currTime - firstTime) / 1000));
        const hours = Math.floor(diff / SECONDS_PER_HOUR);
        const minutes = Math.floor(
            (diff % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE
        );
        const seconds = Math.floor(diff % SECONDS_PER_MINUTE);
        const parts: string[] = [];

        if (hours > 0) {
            parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
        }
        if (minutes > 0) {
            parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
        }
        if (seconds > 0 || parts.length === 0) {
            parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
        }

        return parts.join(", ");
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logWithContext(`Error calculating ride time: ${errorMsg}`, "error");
        return "";
    }
}

function formatSpeed(speed: unknown): string {
    const speedMps = safeToNumber(speed, "speed");
    if (speedMps === null) {
        return "";
    }

    const { MPS_TO_KMH, MPS_TO_MPH } = FORMATTING_CONSTANTS.CONVERSION_FACTORS;
    const { SPEED } = FORMATTING_CONSTANTS.DECIMAL_PLACES;
    const speedKmh = speedMps * MPS_TO_KMH;
    const speedMph = speedMps * MPS_TO_MPH;

    return `${speedKmh.toFixed(SPEED)} km/h / ${speedMph.toFixed(SPEED)} mph`;
}

function getRecordMessagesFromManagedGlobalData(): RecordMessage[] | undefined {
    const globalData = getManagedGlobalData();
    if (!isRecord(globalData)) {
        return undefined;
    }

    return asRecordMessageArray(globalData["recordMesgs"]);
}

function getRecordMessagesFromState(): RecordMessage[] | undefined {
    return asRecordMessageArray(getState("globalData.recordMesgs"));
}

function getTooltipGlobalData(): Record<string, unknown> | undefined {
    const globalData = getManagedGlobalData();
    return isRecord(globalData) ? globalData : undefined;
}

function getManagedGlobalData(): unknown {
    return getState("globalData");
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordMessage(value: unknown): value is RecordMessage {
    return isRecord(value);
}

function asRecordMessageArray(value: unknown): RecordMessage[] | undefined {
    return Array.isArray(value) ? value.filter(isRecordMessage) : undefined;
}

function logWithContext(message: string, level = "info"): void {
    try {
        const prefix = FORMATTING_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch {
        // Ignore logging failures.
    }
}

function safeToNumber(value: unknown, fieldName = "value"): number | null {
    if (value == null) {
        return null;
    }

    const num = Number(value);
    if (!Number.isFinite(num)) {
        logWithContext(`Invalid ${fieldName}: ${value}`, "warn");
        return null;
    }

    return num;
}

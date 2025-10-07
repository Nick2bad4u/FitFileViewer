/**
 * Tooltip data formatting utility for FitFileViewer
 * Provides consistent formatting for data displayed in map tooltips and chart overlays
 */

import { getState } from "../../state/core/stateManager.js";
import { safeToNumber } from "../helpers/numberHelpers.js";

/**
 * @typedef {Object} RecordMessage
 * @property {string|number|Date|null} [timestamp] - Message timestamp
 * @property {number} [altitude] - Altitude in meters
 * @property {number} [heartRate] - Heart rate in bpm
 * @property {number} [speed] - Speed in m/s
 * @property {number} [power] - Power in watts
 * @property {number} [cadence] - Cadence in rpm
 * @property {number} [distance] - Distance in meters
 * @property {number} [positionLat] - Latitude
 * @property {number} [positionLong] - Longitude
 */

// Constants for better maintainability
const FORMATTING_CONSTANTS = {
    CONVERSION_FACTORS: {
        METERS_TO_FEET: 3.280_84,
        MPS_TO_KMH: 3.6,
        MPS_TO_MPH: 2.236_94,
    },
    DECIMAL_PLACES: {
        ALTITUDE_FEET: 0,
        ALTITUDE_METERS: 1,
        CADENCE: 1,
        HEART_RATE: 1,
        POWER: 1,
        SPEED: 1,
    },
    LOG_PREFIX: "[TooltipFormatter]",
    TIME_UNITS: {
        SECONDS_PER_HOUR: 3600,
        SECONDS_PER_MINUTE: 60,
    },
};

const FIELD_ALIASES = {
    altitude: ["altitude", "altitudeMeters", "altitude_m", "enhancedAltitude", "enhanced_altitude"],
    cadence: ["cadence", "cadence_rpm"],
    distance: ["distance", "total_distance", "cum_distance"],
    heartRate: ["heartRate", "heart_rate", "hr"],
    power: ["power", "power_watts"],
    speed: ["speed", "enhancedSpeed", "enhanced_speed", "speed_mps"],
    timestamp: ["timestamp", "time_stamp", "time", "date_time", "timestamp_ms"],
};

/**
 * Formats tooltip data for display on maps and charts
 * Creates a comprehensive data summary for a specific data point
 *
 * @param {number} idx - Index of the data point
 * @param {RecordMessage} row - Data row containing measurement values
 * @param {number} lapNum - Lap number for this data point
 * @param {RecordMessage[]} [recordMesgsOverride] - Optional override for record messages array
 * @returns {string} Formatted HTML string for tooltip display
 *
 * @example
 * // Format tooltip for a data point
 * const tooltipHtml = formatTooltipData(
 *   100,
 *   { timestamp: new Date(), altitude: 123.4, heartRate: 150 },
 *   1
 * );
 *
 * @public
 */
export function formatTooltipData(idx, row, lapNum, recordMesgsOverride) {
    try {
        if (!row || typeof row !== "object") {
            logWithContext("Invalid row data provided", "warn");
            return "No data available";
        }

        const recordMesgs =
            recordMesgsOverride ||
            getState("globalData.recordMesgs") ||
            /** @type {any} */ (globalThis.globalData && /** @type {any} */ (globalThis).globalData.recordMesgs);

        const fallbackRow = Array.isArray(recordMesgs) ? recordMesgs[idx] : undefined;
        const resolvedRow = mergeRecordSources(row, fallbackRow);
        const normalizedRow = createNormalizedLookup(resolvedRow);

        const altitudeValue = pickFieldValue(resolvedRow, FIELD_ALIASES.altitude, normalizedRow);
        const cadenceValue = pickFieldValue(resolvedRow, FIELD_ALIASES.cadence, normalizedRow);
        const distanceValue = pickFieldValue(resolvedRow, FIELD_ALIASES.distance, normalizedRow);
        const heartRateValue = pickFieldValue(resolvedRow, FIELD_ALIASES.heartRate, normalizedRow);
        const powerValue = pickFieldValue(resolvedRow, FIELD_ALIASES.power, normalizedRow);
        const speedValue = pickFieldValue(resolvedRow, FIELD_ALIASES.speed, normalizedRow);
        const timestampValue = pickFieldValue(resolvedRow, FIELD_ALIASES.timestamp, normalizedRow);

        const altitude = formatAltitude(altitudeValue ?? null);
        const cadence = formatCadence(cadenceValue ?? null);
        const timestampDate = parseTimestamp(timestampValue);
        const dateStr = timestampDate ? timestampDate.toLocaleString() : "";
        const distance = formatDistance(distanceValue ?? null);
        const heartRate = formatHeartRate(heartRateValue ?? null);
        const power = formatPower(powerValue ?? null);
        const speed = formatSpeed(speedValue ?? null);
        const rideTime = formatRideTime(timestampValue ?? null, recordMesgs);

        // Build the tooltip HTML
        const tooltipParts = [`<b>Lap:</b> ${lapNum}`, `<b>Index:</b> ${idx}`];
        const metricsStartCount = tooltipParts.length;

        if (dateStr) {
            tooltipParts.push(`<b>Time:</b> ${dateStr}`);
        }
        if (rideTime) {
            tooltipParts.push(`<b>Ride Time:</b> ${rideTime}`);
        }
        if (distance) {
            tooltipParts.push(`<b>Distance:</b> ${distance.replace("<br>", "")}`);
        }
        if (altitude) {
            tooltipParts.push(`<b>Alt:</b> ${altitude}`);
        }
        if (heartRate) {
            tooltipParts.push(`<b>HR:</b> ${heartRate}`);
        }
        if (speed) {
            tooltipParts.push(`<b>Speed:</b> ${speed}`);
        }
        if (power) {
            tooltipParts.push(`<b>Power:</b> ${power}`);
        }
        if (cadence) {
            tooltipParts.push(`<b>Cadence:</b> ${cadence}`);
        }

        if (tooltipParts.length === metricsStartCount) {
            tooltipParts.push("<b>Data:</b> Not available");
        }

        return tooltipParts.join("<br>");
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logWithContext(`Error formatting tooltip data: ${errorMsg}`, "error");
        return `Error loading data (Index: ${idx || "unknown"})`;
    }
}

/**
 * Build a lookup map of normalized keys for the provided source object.
 * @param {Record<string, any>} source
 * @returns {Map<string, any>}
 */
function createNormalizedLookup(source) {
    const map = new Map();
    if (!source || typeof source !== "object") {
        return map;
    }
    for (const [key, value] of Object.entries(source)) {
        if (value == null) {
            continue;
        }
        const normalized = normalizeFieldKey(key);
        if (!normalized || map.has(normalized)) {
            continue;
        }
        map.set(normalized, value);
    }
    return map;
}

/**
 * Locate the earliest valid timestamp across record messages.
 * @param {RecordMessage[]=} recordMesgs
 * @returns {Date|null}
 */
function findFirstTimestamp(recordMesgs) {
    if (!Array.isArray(recordMesgs)) {
        return null;
    }
    for (const entry of recordMesgs) {
        if (!entry || typeof entry !== "object") {
            continue;
        }
        const normalized = createNormalizedLookup(entry);
        const candidate = pickFieldValue(entry, FIELD_ALIASES.timestamp, normalized);
        const parsed = parseTimestamp(candidate);
        if (parsed) {
            return parsed;
        }
    }
    return null;
}

/**
 * Formats altitude value with metric and imperial units
 * @param {number|null} altitude - Altitude in meters
 * @returns {string} Formatted altitude string or empty string
 * @private
 */
function formatAltitude(altitude) {
    const altMeters = safeToNumber(altitude, "altitude");
    if (altMeters === null) {
        return "";
    }

    const { ALTITUDE_FEET, ALTITUDE_METERS } = FORMATTING_CONSTANTS.DECIMAL_PLACES,
        { METERS_TO_FEET } = FORMATTING_CONSTANTS.CONVERSION_FACTORS,
        altFeet = altMeters * METERS_TO_FEET,
        feetRounded = Number.parseFloat(altFeet.toFixed(ALTITUDE_FEET));

    const metersText = altMeters.toFixed(ALTITUDE_METERS);
    const feetText = Number.isFinite(feetRounded)
        ? feetRounded.toLocaleString(undefined, {
            maximumFractionDigits: ALTITUDE_FEET,
            minimumFractionDigits: ALTITUDE_FEET,
        })
        : altFeet.toFixed(ALTITUDE_FEET);

    return `${metersText} m / ${feetText} ft`;
}

/**
 * Formats cadence value
 * @param {number|null} cadence - Cadence in rpm
 * @returns {string} Formatted cadence string or empty string
 * @private
 */
function formatCadence(cadence) {
    const rpm = safeToNumber(cadence, "cadence");
    if (rpm === null) {
        return "";
    }

    return `${rpm.toFixed(FORMATTING_CONSTANTS.DECIMAL_PLACES.CADENCE)} rpm`;
}

/**
 * Formats distance value with metric and imperial units
 * Uses tooltip-specific formatting (1 decimal place) and adds HTML line break for tooltips
 * Special handling for zero distance (allowed in tooltips)
 * @param {number|null} distance - Distance in meters
 * @returns {string} Formatted distance string with HTML line break or empty string
 * @private
 */
function formatDistance(distance) {
    const meters = safeToNumber(distance, "distance");
    if (meters === null) {
        return "";
    }

    // Allow zero distance for tooltips (start position)
    if (meters === 0) {
        return "0.00 km / 0.00 mi<br>";
    }

    const kilometers = meters / 1000;
    const miles = meters / 1609.344;
    const formatted = `${kilometers.toFixed(1)} km / ${miles.toFixed(1)} mi`;
    return `${formatted}<br>`;
}

/**
 * Formats heart rate value
 * @param {number|null} heartRate - Heart rate in bpm
 * @returns {string} Formatted heart rate string or empty string
 * @private
 */
function formatHeartRate(heartRate) {
    const hr = safeToNumber(heartRate, "heart rate");
    if (hr === null) {
        return "";
    }

    return `${hr.toFixed(FORMATTING_CONSTANTS.DECIMAL_PLACES.HEART_RATE)} bpm`;
}

/**
 * Formats power value
 * @param {number|null} power - Power in watts
 * @returns {string} Formatted power string or empty string
 * @private
 */
function formatPower(power) {
    const watts = safeToNumber(power, "power");
    if (watts === null) {
        return "";
    }

    return `${watts.toFixed(FORMATTING_CONSTANTS.DECIMAL_PLACES.POWER)} W`;
}

/**
 * Calculates and formats ride time from start to current point
 * @param {string|Date} timestamp - Current point timestamp
 * @param {RecordMessage[]} recordMesgs - Array of record messages for reference
 * @returns {string} Formatted ride time string or empty string
 * @private
 */
function formatRideTime(timestamp, recordMesgs) {
    if (!recordMesgs || recordMesgs.length === 0) {
        return "";
    }

    try {
        const current = parseTimestamp(timestamp);
        if (!current) {
            return "";
        }

        const first = findFirstTimestamp(recordMesgs);
        if (!first) {
            return "";
        }

        const currTime = current.getTime();
        const firstTime = first.getTime();

        if (!Number.isFinite(firstTime) || !Number.isFinite(currTime)) {
            logWithContext("Invalid timestamp in ride time calculation", "warn");
            return "";
        }

        const { SECONDS_PER_HOUR, SECONDS_PER_MINUTE } = FORMATTING_CONSTANTS.TIME_UNITS,
            diff = Math.max(0, Math.floor((currTime - firstTime) / 1000)),
            hours = Math.floor(diff / SECONDS_PER_HOUR),
            minutes = Math.floor((diff % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
            parts = [],
            seconds = Math.floor(diff % SECONDS_PER_MINUTE);
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

/**
 * Formats speed value with metric and imperial units
 * @param {number|null} speed - Speed in m/s
 * @returns {string} Formatted speed string or empty string
 * @private
 */
function formatSpeed(speed) {
    const speedMps = safeToNumber(speed, "speed");
    if (speedMps === null) {
        return "";
    }

    const { MPS_TO_KMH, MPS_TO_MPH } = FORMATTING_CONSTANTS.CONVERSION_FACTORS,
        { SPEED } = FORMATTING_CONSTANTS.DECIMAL_PLACES,
        speedKmh = speedMps * MPS_TO_KMH,
        speedMph = speedMps * MPS_TO_MPH;

    return `${speedKmh.toFixed(SPEED)} km/h / ${speedMph.toFixed(SPEED)} mph`;
}

/**
 * Logs messages with context for tooltip operations.
 * @param {string} message
 * @param {"info"|"warn"|"error"} [level="info"]
 */
function logWithContext(message, level = "info") {
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
        // Silently fail if logging encounters an error
    }
}

/**
 * Merge primary and fallback record data, preferring properties from the primary row.
 * @param {Record<string, any>} primary
 * @param {Record<string, any>|undefined} fallback
 * @returns {Record<string, any>}
 */
function mergeRecordSources(primary, fallback) {
    if (fallback && typeof fallback === "object") {
        return { ...fallback, ...primary };
    }
    return { ...primary };
}

/**
 * Normalize a field key for relaxed alias matching.
 * @param {string} key
 * @returns {string}
 */
function normalizeFieldKey(key) {
    return typeof key === "string" ? key.replaceAll(/[^a-z0-9]+/giu, "").toLowerCase() : "";
}

/**
 * Attempt to coerce various timestamp representations into a Date instance.
 * @param {unknown} value
 * @returns {Date|null}
 */
function parseTimestamp(value) {
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return Number.isFinite(value.getTime()) ? value : null;
    }
    if (typeof value === "number") {
        const millis = value > 1_000_000_000_000 ? value : value * 1000;
        const date = new Date(millis);
        return Number.isFinite(date.getTime()) ? date : null;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return new Date(parsed);
        }
    }
    return null;
}

/**
 * Retrieve the first available value for the provided aliases.
 * @param {Record<string, any>} source
 * @param {string[]} aliases
 * @param {Map<string, any>} [normalizedSource]
 * @returns {*}
 */
function pickFieldValue(source, aliases, normalizedSource) {
    if (!source || typeof source !== "object") {
        return null;
    }
    for (const key of aliases) {
        if (Object.hasOwn(source, key) && source[key] != null) {
            return source[key];
        }
    }

    const lookup = normalizedSource || createNormalizedLookup(source);
    for (const alias of aliases) {
        const normalizedAlias = normalizeFieldKey(alias);
        if (!normalizedAlias || !lookup.has(normalizedAlias)) {
            continue;
        }
        const value = lookup.get(normalizedAlias);
        if (value != null) {
            return value;
        }
    }
    return null;
}

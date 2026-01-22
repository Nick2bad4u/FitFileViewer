/**
 * Tooltip data formatting utility for FitFileViewer
 * Provides consistent formatting for data displayed in map tooltips and chart overlays
 */

import { getState } from "../../state/core/stateManager.js";

/**
 * @typedef {Object} RecordMessage
 * @property {string|Date} [timestamp] - Message timestamp
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

        // Get record messages from state or override
        const // Format individual metrics
            altitude = formatAltitude(row.altitude ?? null),
            cadence = formatCadence(row.cadence ?? null),
            // Format timestamp
            dateStr = row.timestamp ? new Date(row.timestamp).toLocaleString() : "",
            distance = formatDistance(row.distance ?? null),
            heartRate = formatHeartRate(row.heartRate ?? null),
            power = formatPower(row.power ?? null),
            recordMesgs =
                recordMesgsOverride ||
                getState("globalData.recordMesgs") ||
                /** @type {any} */ (globalThis.globalData && /** @type {any} */ (globalThis).globalData.recordMesgs),
            rideTime = formatRideTime(row.timestamp || "", recordMesgs),
            speed = formatSpeed(row.speed ?? null),
            // Build the tooltip HTML
            tooltipParts = [`<b>Lap:</b> ${lapNum}`, `<b>Index:</b> ${idx}`];

        if (dateStr) {
            tooltipParts.push(`<b>Time:</b> ${dateStr}`);
        }
        if (rideTime) {
            tooltipParts.push(`<b>Elapsed Time:</b> ${rideTime}`);
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
        if (isFiniteNumber(row.power)) {
            tooltipParts.push(`<b>Power:</b> ${power}`);
        } else if (isFiniteNumber(row.estimatedPower)) {
            tooltipParts.push(`<b>Est. Power:</b> ${row.estimatedPower.toFixed(0)} W`);
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
        altFeet = altMeters * METERS_TO_FEET;
    return `${altMeters.toFixed(ALTITUDE_METERS)} m / ${altFeet.toFixed(ALTITUDE_FEET)} ft`;
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
 * @param {number|null} distance - Distance in meters
 * @returns {string} Formatted distance string with HTML line break or empty string
 * @private
 */
function formatDistance(distance) {
    const meters = safeToNumber(distance, "distance");
    if (meters === null) {
        return "";
    }

    const { DISTANCE_KM, DISTANCE_MI } = FORMATTING_CONSTANTS.DECIMAL_PLACES,
        { KM_TO_MILES, METERS_TO_KM } = FORMATTING_CONSTANTS.CONVERSION_FACTORS,
        km = meters / METERS_TO_KM,
        mi = km * KM_TO_MILES;

    return `${km.toFixed(DISTANCE_KM)} km / ${mi.toFixed(DISTANCE_MI)} mi<br>`;
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
    if (!timestamp || !recordMesgs || recordMesgs.length === 0) {
        return "";
    }

    try {
        const first = recordMesgs.find((r) => r.timestamp != null);
        if (!first || !first.timestamp) {
            return "";
        }

        const currTime = new Date(timestamp).getTime(),
            firstTime = new Date(first.timestamp).getTime();

        if (isNaN(firstTime) || isNaN(currTime)) {
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
 * @param {unknown} v
 * @returns {v is number}
 */
function isFiniteNumber(v) {
    return typeof v === "number" && Number.isFinite(v);
}

/**
 * Logs messages with context for tooltip operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
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
 * Safely converts a value to a number with validation
 * @param {any} value - Value to convert
 * @param {string} fieldName - Name of the field for error reporting
 * @returns {number|null} Converted number or null if invalid
 * @private
 */
function safeToNumber(value, fieldName = "value") {
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

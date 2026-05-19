import { convertMpsToKmh } from "../converters/convertMpsToKmh.js";
import { convertMpsToMph } from "../converters/convertMpsToMph.js";

const SPEED_FORMAT_CONFIG = {
    DECIMAL_PLACES: 2,
    ERROR_MESSAGES: {
        CONVERSION_ERROR: "Error formatting speed tooltip:",
        INVALID_SPEED: "Invalid speed value for tooltip formatting:",
    },
    UNITS: {
        KMH: "km/h",
        MPH: "mph",
        MPS: "m/s",
    },
} as const;

const FALLBACK_SPEED_TOOLTIP = "0.00 m/s (0.00 km/h, 0.00 mph)";

/**
 * Formats speed with meters per second, kilometers per hour, and miles per hour.
 *
 * Invalid inputs preserve legacy display behavior by warning and returning a
 * zeroed tooltip string.
 *
 * @example
 *     const speedTooltip = formatSpeedTooltip(5.5);
 *     // "5.50 m/s (19.80 km/h, 12.30 mph)"
 *
 * @param mps - Speed in meters per second.
 * @returns Formatted speed string with all units.
 */
export function formatSpeedTooltip(mps: unknown): string {
    if (typeof mps !== "number" || Number.isNaN(mps)) {
        console.warn(
            `[formatSpeedTooltip] ${SPEED_FORMAT_CONFIG.ERROR_MESSAGES.INVALID_SPEED}`,
            mps
        );
        return FALLBACK_SPEED_TOOLTIP;
    }

    if (mps < 0) {
        console.warn(`[formatSpeedTooltip] Negative speed value: ${mps}`);
    }

    try {
        const kmh = convertMpsToKmh(mps);
        const mph = convertMpsToMph(mps);

        return `${formatSpeedNumber(mps)} ${SPEED_FORMAT_CONFIG.UNITS.MPS} (${formatSpeedNumber(kmh)} ${SPEED_FORMAT_CONFIG.UNITS.KMH}, ${formatSpeedNumber(mph)} ${SPEED_FORMAT_CONFIG.UNITS.MPH})`;
    } catch (error) {
        console.error(
            `[formatSpeedTooltip] ${SPEED_FORMAT_CONFIG.ERROR_MESSAGES.CONVERSION_ERROR}`,
            error
        );
        return FALLBACK_SPEED_TOOLTIP;
    }
}

function formatSpeedNumber(value: number): string {
    return value.toFixed(SPEED_FORMAT_CONFIG.DECIMAL_PLACES);
}

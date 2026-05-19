import {
    CONVERSION_FACTORS,
    DISTANCE_UNITS as CONFIG_DISTANCE_UNITS,
} from "../../config/index.js";

/**
 * Distance unit constants exported for converter consumers.
 */
export const DISTANCE_UNITS = CONFIG_DISTANCE_UNITS;

/**
 * Supported distance unit string values.
 */
export type DistanceUnit =
    (typeof DISTANCE_UNITS)[keyof typeof DISTANCE_UNITS];

/**
 * Converts distance from meters to the requested unit.
 *
 * Unknown target units preserve legacy behavior by warning and returning the
 * input meters value unchanged.
 *
 * @example
 *     const kilometers = convertDistanceUnits(1000, DISTANCE_UNITS.KILOMETERS); // 1
 *
 * @param meters - Distance in meters.
 * @param targetUnit - Target unit: meters, kilometers, feet, or miles.
 * @returns Converted distance value.
 * @throws TypeError If meters is not a number or is NaN.
 */
export function convertDistanceUnits(
    meters: unknown,
    targetUnit: unknown
): number {
    if (typeof meters !== "number") {
        const receivedType = meters === null ? "object" : typeof meters;
        throw new TypeError(
            `Expected meters to be a number, received ${receivedType}`
        );
    }

    if (Number.isNaN(meters)) {
        throw new TypeError("Expected meters to be a number, received number");
    }

    if (meters < 0) {
        console.warn("[convertDistanceUnits] Negative distance value:", meters);
    }

    if (!isDistanceUnit(targetUnit)) {
        console.warn(
            `[convertDistanceUnits] Unknown unit '${targetUnit}', defaulting to meters`
        );
        return meters;
    }

    switch (targetUnit) {
        case DISTANCE_UNITS.FEET: {
            return meters * CONVERSION_FACTORS.METERS_TO_FEET;
        }
        case DISTANCE_UNITS.KILOMETERS: {
            return meters / CONVERSION_FACTORS.METERS_PER_KILOMETER;
        }
        case DISTANCE_UNITS.METERS: {
            return meters;
        }
        case DISTANCE_UNITS.MILES: {
            return meters / CONVERSION_FACTORS.METERS_PER_MILE;
        }
    }
}

function isDistanceUnit(value: unknown): value is DistanceUnit {
    return Object.values(DISTANCE_UNITS).includes(value as DistanceUnit);
}

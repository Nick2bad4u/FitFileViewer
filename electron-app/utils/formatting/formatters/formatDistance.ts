const DISTANCE_CONVERSION_FACTORS = {
    DECIMAL_PLACES: 2,
    METERS_PER_KILOMETER: 1000,
    METERS_PER_MILE: 1609.344,
} as const;

/**
 * Formats a distance in meters to a string showing both kilometers and miles.
 *
 * Invalid inputs (negative, zero, NaN, or non-finite numbers) return an empty
 * string for compatibility with existing display code.
 *
 * @example
 *     formatDistance(1000); // "1.00 km / 0.62 mi"
 *     formatDistance(5000); // "5.00 km / 3.11 mi"
 *
 * @param meters - The distance in meters to format.
 * @returns The formatted distance as "X.XX km / Y.YY mi", or an empty string.
 */
export function formatDistance(meters: unknown): string {
    if (
        typeof meters !== "number" ||
        !Number.isFinite(meters) ||
        meters <= 0
    ) {
        return "";
    }

    const kilometers = metersToKilometers(meters),
        miles = metersToMiles(meters);

    return `${kilometers.toFixed(DISTANCE_CONVERSION_FACTORS.DECIMAL_PLACES)} km / ${miles.toFixed(DISTANCE_CONVERSION_FACTORS.DECIMAL_PLACES)} mi`;
}

function metersToKilometers(meters: number): number {
    return meters / DISTANCE_CONVERSION_FACTORS.METERS_PER_KILOMETER;
}

function metersToMiles(meters: number): number {
    return meters / DISTANCE_CONVERSION_FACTORS.METERS_PER_MILE;
}

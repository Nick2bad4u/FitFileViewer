/**
 * Converts distance to user's preferred units
 * @param {number} meters - Distance in meters
 * @param {string} targetUnit - Target unit (meters, kilometers, feet, miles)
 * @returns {number} Converted distance value
 */
export function convertDistanceUnits(meters, targetUnit) {
    switch (targetUnit) {
        case "kilometers":
            return meters / 1000;
        case "feet":
            return meters * 3.28084;
        case "miles":
            return meters / 1609.344;
        case "meters":
        default:
            return meters;
    }
}

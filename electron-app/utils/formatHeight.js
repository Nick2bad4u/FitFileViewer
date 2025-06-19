/**
 * Converts height from meters to feet and inches
 * @param {number} meters - Height in meters
 * @returns {string} Formatted height string with both metric and imperial
 */
export function formatHeight(meters) {
    if (!Number.isFinite(meters) || meters < 0) return "";
    const totalInches = meters * 39.3701;
    const feet = Math.floor(totalInches / 12);
    let inches = Math.round(totalInches % 12);

    // Handle rounding up to 12 inches (e.g., 5'12" -> 6'0")
    let adjFeet = feet;
    if (inches === 12) {
        adjFeet += 1;
        inches = 0;
    }

    // Always format meters to two decimal places for consistency
    const metersStr = meters.toFixed(2);

    return `${metersStr} m (${adjFeet}'${inches}")`;
}

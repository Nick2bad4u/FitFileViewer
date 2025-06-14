/**
 * Converts height from meters to feet and inches
 * @param {number} meters - Height in meters
 * @returns {string} Formatted height string with both metric and imperial
 */
export function formatHeight(meters) {
    if (!meters || typeof meters !== "number") return "";
    const totalInches = meters * 39.3701;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${meters} m (${feet}'${inches}")`;
}

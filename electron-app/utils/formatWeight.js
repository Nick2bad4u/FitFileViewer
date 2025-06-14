/**
 * Converts weight from kilograms to pounds
 * @param {number} kg - Weight in kilograms
 * @returns {string} Formatted weight string with both metric and imperial
 */
export function formatWeight(kg) {
    if (!kg || typeof kg !== "number") return "";
    const pounds = Math.round(kg * 2.20462);
    return `${kg} kg (${pounds} lbs)`;
}

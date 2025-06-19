/**
 * Weight conversion constants
 * @readonly
 */
const WEIGHT_CONVERSIONS = {
    KG_TO_POUNDS: 2.20462,
};

/**
 * Converts weight from kilograms to pounds with both metric and imperial display
 * @param {number} kg - Weight in kilograms
 * @returns {string} Formatted weight string with both metric and imperial
 * @throws {TypeError} If kg is not a number
 * @example
 * // Convert 70kg to imperial format
 * const weight = formatWeight(70); // "70 kg (154 lbs)"
 */
export function formatWeight(kg) {
    // Input validation
    if (typeof kg !== "number" || !Number.isFinite(kg)) {
        return "";
    }

    if (kg < 0) {
        console.warn("[formatWeight] Negative weight value:", kg);
        return "";
    }

    try {
        const pounds = Math.round(kg * WEIGHT_CONVERSIONS.KG_TO_POUNDS);
        return `${kg} kg (${pounds} lbs)`;
    } catch (error) {
        console.error("[formatWeight] Weight formatting failed:", error);
        return kg.toString();
    }
}

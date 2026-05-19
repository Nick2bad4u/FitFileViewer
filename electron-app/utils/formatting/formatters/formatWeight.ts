import { CONVERSION_FACTORS } from "../../config/index.js";

/**
 * Converts kilograms to a metric and imperial display string.
 *
 * Invalid inputs return an empty string and log a warning, matching the legacy
 * renderer behavior.
 *
 * @example
 *     formatWeight(70); // "70 kg (154 lbs)"
 *
 * @param kg - Weight in kilograms.
 * @returns Formatted weight string, or an empty string for invalid input.
 */
export function formatWeight(kg: unknown): string {
    if (typeof kg !== "number" || !Number.isFinite(kg)) {
        console.warn("[formatWeight] Invalid weight value:", kg);
        return "";
    }

    if (kg < 0) {
        console.warn("[formatWeight] Negative weight value:", kg);
        return "";
    }

    try {
        const pounds = Math.round(kg * CONVERSION_FACTORS.KG_TO_POUNDS);
        return `${kg} kg (${pounds} lbs)`;
    } catch (error) {
        console.error("[formatWeight] Weight formatting failed:", error);
        return kg.toString();
    }
}

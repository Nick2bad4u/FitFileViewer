/**
 * @fileoverview Weight formatting utility for FitFileViewer
 *
 * Provides functions for converting and formatting weights from kilograms
 * to human-readable strings with both metric and imperial units.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 * @version 2.0.0 - Updated to use centralized configuration and unified error handling
 */

import { CONVERSION_FACTORS } from "../../config/index.js";

/**
 * Converts weight from kilograms to pounds with both metric and imperial display
 * @param {number} kg - Weight in kilograms
 * @returns {string} Formatted weight string with both metric and imperial
 * @example
 * // Convert 70kg to imperial format
 * const weight = formatWeight(70); // "70 kg (154 lbs)"
 */
export function formatWeight(kg) {
    // Handle invalid inputs with warnings
    if (kg === null || kg === undefined || typeof kg !== "number" || !Number.isFinite(kg)) {
        console.warn("[formatWeight] Invalid weight value:", kg);
        return "";
    }

    // Handle negative values with warning
    if (kg < 0) {
        console.warn("[formatWeight] Negative weight value:", kg);
        return "";
    }

    try {
        const pounds = Math.round(kg * CONVERSION_FACTORS.KG_TO_POUNDS);
        return `${kg} kg (${pounds} lbs)`;
    } catch (error) {
        console.error("[formatWeight] Weight formatting failed:", error);
        return kg.toString(); // Return fallback as expected by tests
    }
}

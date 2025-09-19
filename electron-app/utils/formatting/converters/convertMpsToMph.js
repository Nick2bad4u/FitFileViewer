/**
 * Speed conversion constants
 * @readonly
 */
const SPEED_CONVERSIONS = {
    MPS_TO_MPH: 2.236_936, // Meters/second to miles/hour conversion factor
};

/**
 * Converts speed from meters per second to miles per hour
 * @param {number} mps - Speed in meters per second
 * @returns {number} Speed in miles per hour
 * @throws {TypeError} If mps is not a number
 * @example
 * // Convert 10 meters per second to miles per hour
 * const speedMph = convertMpsToMph(10); // ~22.37
 */
export function convertMpsToMph(mps) {
    // Input validation
    if (typeof mps !== "number" || isNaN(mps)) {
        throw new TypeError(`Expected mps to be a number, received ${typeof mps}`);
    }

    if (mps < 0) {
        console.warn("[convertMpsToMph] Negative speed value:", mps);
    }

    try {
        return mps * SPEED_CONVERSIONS.MPS_TO_MPH;
    } catch (error) {
        console.error("[convertMpsToMph] Conversion failed:", error);
        const anyErr = /** @type {any} */ (error);
        throw new Error(`Failed to convert speed: ${anyErr?.message}`);
    }
}

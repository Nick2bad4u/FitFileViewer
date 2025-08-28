/**
 * Speed conversion constants
 * @readonly
 */
const SPEED_CONVERSIONS = {
    MPS_TO_KMH: 3.6, // meters/second to kilometers/hour conversion factor
};

/**
 * Converts speed from meters per second to kilometers per hour
 * @param {number} mps - Speed in meters per second
 * @returns {number} Speed in kilometers per hour
 * @throws {TypeError} If mps is not a number
 * @example
 * // Convert 5 meters per second to kilometers per hour
 * const speedKmh = convertMpsToKmh(5); // 18
 */
export function convertMpsToKmh(mps) {
    // Input validation
    if (typeof mps !== "number" || isNaN(mps)) {
        throw new TypeError(`Expected mps to be a number, received ${typeof mps}`);
    }

    if (mps < 0) {
        console.warn("[convertMpsToKmh] Negative speed value:", mps);
    }

    try {
        return mps * SPEED_CONVERSIONS.MPS_TO_KMH;
    } catch (error) {
        console.error("[convertMpsToKmh] Conversion failed:", error);
        const anyErr = /** @type {any} */ (error);
        throw new Error(`Failed to convert speed: ${anyErr?.message}`);
    }
}

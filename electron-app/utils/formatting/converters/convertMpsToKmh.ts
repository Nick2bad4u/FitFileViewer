const SPEED_CONVERSIONS = {
    MPS_TO_KMH: 3.6,
} as const;

/**
 * Converts speed from meters per second to kilometers per hour.
 *
 * @example Const speedKmh = convertMpsToKmh(5); // 18
 *
 * @param mps - Speed in meters per second.
 *
 * @returns Speed in kilometers per hour.
 *
 * @throws TypeError If mps is not a number or is NaN.
 */
export function convertMpsToKmh(mps: unknown): number {
    if (typeof mps !== "number" || Number.isNaN(mps)) {
        throw new TypeError(
            `Expected mps to be a number, received ${typeof mps}`
        );
    }

    if (mps < 0) {
        console.warn("[convertMpsToKmh] Negative speed value:", mps);
    }

    try {
        return mps * SPEED_CONVERSIONS.MPS_TO_KMH;
    } catch (error) {
        console.error("[convertMpsToKmh] Conversion failed:", error);
        throw new Error(`Failed to convert speed: ${getErrorMessage(error)}`);
    }
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

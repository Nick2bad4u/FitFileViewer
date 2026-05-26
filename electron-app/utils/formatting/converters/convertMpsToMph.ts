const SPEED_CONVERSIONS = {
    MPS_TO_MPH: 2.236_936,
} as const;

/**
 * Converts speed from meters per second to miles per hour.
 *
 * @example Const speedMph = convertMpsToMph(10); // ~22.37
 *
 * @param mps - Speed in meters per second.
 *
 * @returns Speed in miles per hour.
 *
 * @throws TypeError If mps is not a number or is NaN.
 */
export function convertMpsToMph(mps: unknown): number {
    if (typeof mps !== "number" || Number.isNaN(mps)) {
        throw new TypeError(
            `Expected mps to be a number, received ${typeof mps}`
        );
    }

    if (mps < 0) {
        console.warn("[convertMpsToMph] Negative speed value:", mps);
    }

    return mps * SPEED_CONVERSIONS.MPS_TO_MPH;
}

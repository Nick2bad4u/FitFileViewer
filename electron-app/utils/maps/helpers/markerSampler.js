/**
 * Marker sampling utilities for Leaflet map rendering.
 * Provides deterministic downsampling of large coordinate sets while
 * guaranteeing that the first and last points are always included.
 */

/**
 * Compute a sorted list of coordinate indices that should be rendered based on
 * the requested marker count. When the requested count is zero or greater than
 * the available points, all indices are returned.
 *
 * @param {number} totalPoints - Total number of available coordinate points.
 * @param {number} requestedCount - Desired number of markers to render (0 for all).
 * @returns {number[]} Sorted array of indices that should be rendered.
 */
export function computeSampledIndices(totalPoints, requestedCount) {
    const safeTotal = Number.isFinite(totalPoints) && totalPoints > 0 ? Math.floor(totalPoints) : 0;
    const safeRequested = Number.isFinite(requestedCount) && requestedCount > 0 ? Math.floor(requestedCount) : 0;

    if (safeTotal === 0) {
        return [];
    }
    if (safeRequested === 0 || safeRequested >= safeTotal) {
        return createSequence(safeTotal);
    }

    // Evenly distribute requested markers across the available range.
    const indices = new Set();
    const span = safeTotal - 1;
    const divisor = Math.max(safeRequested - 1, 1);
    const step = span / divisor;

    for (let sample = 0; sample < safeRequested; sample += 1) {
        const index = Math.round(sample * step);
        indices.add(Math.min(index, safeTotal - 1));
    }

    // Always include first and last indices for visual continuity.
    indices.add(0);
    indices.add(safeTotal - 1);

    return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Build an object that can efficiently answer whether a given index should be
 * rendered, while keeping track of sampling statistics for UI summaries.
 *
 * @param {number} totalPoints - Total number of available coordinate points.
 * @param {number} requestedCount - Desired number of markers to render (0 for all).
 * @returns {{
 *   readonly indices: number[],
 *   readonly totalPoints: number,
 *   readonly requestedCount: number,
 *   readonly sampledCount: number,
 *   shouldInclude(index: number): boolean
 * }} Marker sampler description.
 */
export function createMarkerSampler(totalPoints, requestedCount) {
    const indices = computeSampledIndices(totalPoints, requestedCount);
    const indexSet = new Set(indices);

    console.log(`[MarkerSampler] Created sampler: total=${totalPoints}, requested=${requestedCount}, sampled=${indices.length}`);

    return {
        get indices() {
            return indices;
        },
        get totalPoints() {
            return Number.isFinite(totalPoints) && totalPoints > 0 ? Math.floor(totalPoints) : 0;
        },
        get requestedCount() {
            return Number.isFinite(requestedCount) ? Math.max(0, Math.floor(requestedCount)) : 0;
        },
        get sampledCount() {
            return indices.length;
        },
        /**
         * Determine if the coordinate at the provided index should be rendered.
         *
         * @param {number} index - Coordinate index.
         * @returns {boolean} True when the index must be rendered.
         */
        shouldInclude(index) {
            return indexSet.has(index);
        },
    };
}

/**
 * Create an array with values `[0, 1, ..., n - 1]`.
 * @param {number} length - Desired sequence length.
 * @returns {number[]} Sequence array.
 */
function createSequence(length) {
    /** @type {number[]} */
    const sequence = [];
    for (let idx = 0; idx < length; idx += 1) {
        sequence.push(idx);
    }
    return sequence;
}

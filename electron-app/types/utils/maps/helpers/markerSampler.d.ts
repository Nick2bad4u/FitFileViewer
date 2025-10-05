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
export function computeSampledIndices(totalPoints: number, requestedCount: number): number[];
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
export function createMarkerSampler(totalPoints: number, requestedCount: number): {
    readonly indices: number[];
    readonly totalPoints: number;
    readonly requestedCount: number;
    readonly sampledCount: number;
    shouldInclude(index: number): boolean;
};
//# sourceMappingURL=markerSampler.d.ts.map
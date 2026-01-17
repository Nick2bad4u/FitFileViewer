/**
 * Create the Elevation Profile action button (Map toolbar) which opens a new
 * window rendering elevation charts for each currently loaded FIT file (or the
 * active file if none explicitly loaded as overlays).
 *
 * Implementation notes / typing strategy:
 * - getThemeColors() returns an index-signature based object; due to
 *   noPropertyAccessFromIndexSignature we must use bracket notation.
 * - Many dynamic data objects (window.loadedFitFiles / window.globalData) are
 *   loosely typed; we defensively treat them as any while keeping local
 *   structures documented via JSDoc typedefs.
 * - Guard the popup window (can be blocked and be null) before dereferencing.
 *
 * @returns {HTMLButtonElement}
 */
export function createElevationProfileButton(): HTMLButtonElement;

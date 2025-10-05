/**
 * Utilities for tracking and presenting map marker sampling summaries.
 */

/**
 * Create a tracker that records the number of available and rendered markers,
 * then notifies the UI via the global `updateMapMarkerSummary` helper.
 *
 * @returns {{record(total:number, rendered:number):void, flush():void}}
 */
export function createMarkerSummary() {
    let totalPoints = 0;
    let renderedPoints = 0;

    return {
        record(total, rendered) {
            totalPoints = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
            renderedPoints = Number.isFinite(rendered) && rendered > 0 ? Math.floor(rendered) : 0;
        },
        flush() {
            try {
                const updater = getWindow()?.updateMapMarkerSummary;
                if (typeof updater === "function") {
                    updater({
                        rendered: renderedPoints,
                        total: totalPoints,
                    });
                }
            } catch {
                /* Ignore summary update errors */
            }
        },
    };
}

/**
 * Read the preferred marker count from the global window context. A value of 0
 * indicates that all markers should be rendered.
 *
 * @returns {number} Requested marker count.
 */
export function getMarkerPreference() {
    const rawValue = Number(getWindow()?.mapMarkerCount);
    if (!Number.isFinite(rawValue) || rawValue <= 0) {
        return 0;
    }
    return Math.floor(rawValue);
}

/**
 * Resolve the active window-like global for both browser and test environments.
 * @returns {any}
 */
function getWindow() {
    const candidate = typeof globalThis === "object" ? /** @type {any} */ (globalThis) : undefined;
    if (!candidate) {
        return null;
    }
    if (candidate.window && typeof candidate.window === "object") {
        return candidate.window;
    }
    return candidate;
}

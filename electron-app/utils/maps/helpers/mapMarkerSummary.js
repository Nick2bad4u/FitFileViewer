/**
 * Utilities for tracking and presenting map marker sampling summaries.
 */

/**
 * Create a tracker that records the number of available and rendered markers,
 * then notifies the UI via the global `updateMapMarkerSummary` helper.
 *
 * @returns {{record(total:number, rendered:number):void, reset():void, flush():void}}
 */
export function createMarkerSummary() {
    let totalPoints = 0;
    let renderedPoints = 0;

    const clampCount = (value) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
    const notify = () => {
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
    };

    return {
        record(total, rendered) {
            const sanitizedTotal = clampCount(total);
            const sanitizedRendered = clampCount(rendered);
            totalPoints += sanitizedTotal;
            renderedPoints += sanitizedRendered;

            if (sanitizedRendered === 0 && sanitizedTotal > 0 && rendered === 0) {
                renderedPoints += sanitizedTotal;
            }

            if (renderedPoints > totalPoints) {
                renderedPoints = totalPoints;
            }

            notify();
        },
        reset() {
            totalPoints = 0;
            renderedPoints = 0;
            notify();
        },
        flush() {
            notify();
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
    const result = !Number.isFinite(rawValue) || rawValue <= 0 ? 0 : Math.floor(rawValue);
    console.log(`[MapMarkerSummary] getMarkerPreference: raw=${rawValue}, result=${result}`);
    return result;
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

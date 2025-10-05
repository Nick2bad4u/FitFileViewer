/**
 * Utilities for tracking and presenting map marker sampling summaries.
 */
/**
 * Create a tracker that records the number of available and rendered markers,
 * then notifies the UI via the global `updateMapMarkerSummary` helper.
 *
 * @returns {{record(total:number, rendered:number):void, reset():void, flush():void}}
 */
export function createMarkerSummary(): {
    record(total: number, rendered: number): void;
    reset(): void;
    flush(): void;
};
/**
 * Read the preferred marker count from the global window context. A value of 0
 * indicates that all markers should be rendered.
 *
 * @returns {number} Requested marker count.
 */
export function getMarkerPreference(): number;
//# sourceMappingURL=mapMarkerSummary.d.ts.map
/**
 * @typedef {Object} LeafletMap
 * @property {() => void} invalidateSize - Invalidates map size
 * @property {HTMLElement} [_container] - Map container element
 */
/**
 * Utility to add a custom fullscreen control to a Leaflet map
 * @param {LeafletMap} map - The Leaflet map instance
 */
export function addFullscreenControl(map: LeafletMap): void;
export type LeafletMap = {
    /**
     * - Invalidates map size
     */
    invalidateSize: () => void;
    /**
     * - Map container element
     */
    _container?: HTMLElement;
};
//# sourceMappingURL=mapFullscreenControl.d.ts.map

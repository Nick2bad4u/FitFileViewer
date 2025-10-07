/**
 * Add a simple point-to-point measurement tool (two clicks) to a Leaflet map.
 * Creates a button in the provided controls container; when activated, the next
 * two clicks on the map will display straight-line distance (meters/km + miles).
 * Subsequent clicks clear the prior measurement and allow a new one.
 *
 * Typing approach: Leaflet types are treated as any to avoid pulling in type
 * definitions in this JS file. Internal collections are explicitly typed to
 * remove implicit-any errors under checkJs.
 *
 * @param {any} map - Leaflet map instance (L.Map)
 * @param {HTMLElement} controlsDiv - Container element for map action buttons
 */
export function addSimpleMeasureTool(map: any, controlsDiv: HTMLElement): HTMLButtonElement;
//# sourceMappingURL=mapMeasureTool.d.ts.map
/**
 * Map document-level listeners.
 *
 * This module centralizes document event listeners used by the Leaflet map UI.
 * The map UI is frequently re-rendered (e.g. overlay changes), so listeners must
 * be installed once and use global references that are updated per render.
 */
/**
 * Install document-level map listeners once to avoid leaks when renderMap() is invoked repeatedly.
 *
 * The handlers rely on global references that are updated on each render:
 * - globalThis.__ffvMapTypeButton: HTMLElement
 * - globalThis.__ffvMapZoomDraggingRef: { current: boolean }
 *
 * @returns {void}
 */
export function ensureMapDocumentListenersInstalled(): void;
//# sourceMappingURL=mapDocumentListeners.d.ts.map

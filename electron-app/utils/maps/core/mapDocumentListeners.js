/**
 * Map document-level listeners.
 *
 * This module centralizes document event listeners used by the Leaflet map UI.
 * The map UI is frequently re-rendered (e.g. overlay changes), so listeners
 * must be installed once and use global references that are updated per
 * render.
 */
function getMapDocumentGlobal() {
    return globalThis;
}
function isMapZoomDraggingRef(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return typeof candidate["current"] === "boolean";
}
function collapseLayersPanelIfClickOutside(event) {
    try {
        const appGlobal = getMapDocumentGlobal();
        const mapTypeBtn = appGlobal.__ffvMapTypeButton;
        if (!(mapTypeBtn instanceof HTMLElement)) {
            return;
        }
        const layersControlEl = document.querySelector(
            ".leaflet-control-layers"
        );
        if (
            !layersControlEl ||
            !layersControlEl.classList.contains(
                "leaflet-control-layers-expanded"
            )
        ) {
            return;
        }
        const node = event.target instanceof Node ? event.target : null;
        if (!node) {
            return;
        }
        if (!layersControlEl.contains(node) && !mapTypeBtn.contains(node)) {
            layersControlEl.classList.remove("leaflet-control-layers-expanded");
            const layersControlElStyled = layersControlEl;
            const layersListEl = layersControlElStyled.querySelector(
                ".leaflet-control-layers-list"
            );
            layersControlElStyled.style.zIndex = "";
            layersControlElStyled.style.maxHeight = "";
            layersControlElStyled.style.marginTop = "";
            layersControlElStyled.style.overflowY = "";
            layersControlElStyled.style.overflowX = "";
            if (layersListEl) {
                layersListEl.style.maxHeight = "";
                layersListEl.style.overflowY = "";
            }
        }
    } catch {
        /* ignore */
    }
}
function layoutLayersPanelOnResize() {
    try {
        const layersControlEl = document.querySelector(
            ".leaflet-control-layers"
        );
        if (
            !layersControlEl ||
            !layersControlEl.classList.contains(
                "leaflet-control-layers-expanded"
            )
        ) {
            return;
        }
        const layoutFn = getMapDocumentGlobal().__ffvLayoutLayersControl;
        if (typeof layoutFn === "function") {
            layoutFn();
        }
    } catch {
        /* ignore */
    }
}
function resetMapZoomDraggingRef() {
    try {
        const ref = getMapDocumentGlobal().__ffvMapZoomDraggingRef;
        if (isMapZoomDraggingRef(ref)) {
            ref.current = false;
        }
    } catch {
        /* ignore */
    }
}
/**
 * Install document-level map listeners once to avoid leaks when renderMap() is
 * invoked repeatedly.
 *
 * The handlers rely on global references that are updated on each render:
 *
 * - GlobalThis.__ffvMapTypeButton: HTMLElement
 * - GlobalThis.__ffvMapZoomDraggingRef: object with a boolean current flag
 */
export function ensureMapDocumentListenersInstalled() {
    const appGlobal = getMapDocumentGlobal();
    if (appGlobal.__ffvMapDocumentListenersInstalled === true) {
        return;
    }
    appGlobal.__ffvMapDocumentListenersInstalled = true;
    const listenerController = new AbortController();
    appGlobal.__ffvMapDocumentListenersController = listenerController;
    const { signal } = listenerController;
    // Collapse the Leaflet layers panel when clicking outside.
    document.addEventListener("mousedown", collapseLayersPanelIfClickOutside, {
        signal,
    });
    // Keep the expanded layers panel within the viewport/minimap bounds on resize.
    const w = globalThis.window;
    if (w && typeof w.addEventListener === "function") {
        w.addEventListener("resize", layoutLayersPanelOnResize, { signal });
    }
    // Reset the zoom-slider dragging flag when the interaction ends.
    document.addEventListener("mouseup", resetMapZoomDraggingRef, { signal });
    document.addEventListener("touchend", resetMapZoomDraggingRef, {
        passive: true,
        signal,
    });
}

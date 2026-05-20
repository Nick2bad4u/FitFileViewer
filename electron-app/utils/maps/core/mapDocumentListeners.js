/**
 * Map document-level listeners.
 *
 * This module centralizes document event listeners used by the Leaflet map UI.
 * The map UI is frequently re-rendered (e.g. overlay changes), so listeners
 * must be installed once and use global references that are updated per
 * render.
 */

/** @typedef {{ current: boolean }} MapZoomDraggingRef */
/**
 * @typedef {typeof globalThis & {
 *     __ffvLayoutLayersControl?: () => void;
 *     __ffvMapDocumentListenersInstalled?: boolean;
 *     __ffvMapTypeButton?: unknown;
 *     __ffvMapZoomDraggingRef?: unknown;
 * }} MapDocumentGlobal
 */

/**
 * @returns {MapDocumentGlobal}
 */
function getMapDocumentGlobal() {
    return /** @type {MapDocumentGlobal} */ (globalThis);
}

/**
 * @param {unknown} value
 * @returns {value is MapZoomDraggingRef}
 */
function isMapZoomDraggingRef(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = /** @type {Record<string, unknown>} */ (value);
    return typeof candidate.current === "boolean";
}

/**
 * Install document-level map listeners once to avoid leaks when renderMap() is
 * invoked repeatedly.
 *
 * The handlers rely on global references that are updated on each render:
 *
 * - GlobalThis.__ffvMapTypeButton: HTMLElement
 * - GlobalThis.__ffvMapZoomDraggingRef: { current: boolean }
 *
 * @returns {void}
 */
export function ensureMapDocumentListenersInstalled() {
    const appGlobal = getMapDocumentGlobal();

    if (appGlobal.__ffvMapDocumentListenersInstalled === true) {
        return;
    }
    appGlobal.__ffvMapDocumentListenersInstalled = true;

    // Collapse the Leaflet layers panel when clicking outside.
    document.addEventListener("mousedown", (/** @type {MouseEvent} */ e) => {
        try {
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

            const { target } = e;
            const node = target instanceof Node ? target : null;
            if (!node) {
                return;
            }

            if (!layersControlEl.contains(node) && !mapTypeBtn.contains(node)) {
                layersControlEl.classList.remove(
                    "leaflet-control-layers-expanded"
                );
                const layersControlElStyled = /** @type {HTMLElement} */ (
                    layersControlEl
                );
                const layersListEl = /** @type {HTMLElement | null} */ (
                    layersControlElStyled.querySelector(
                        ".leaflet-control-layers-list"
                    )
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
    });

    // Keep the expanded layers panel within the viewport/minimap bounds on resize.
    const w = globalThis.window;
    if (w && typeof w.addEventListener === "function") {
        w.addEventListener("resize", () => {
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

                const layoutFn = appGlobal.__ffvLayoutLayersControl;
                if (typeof layoutFn === "function") {
                    layoutFn();
                }
            } catch {
                /* ignore */
            }
        });
    }

    // Reset the zoom-slider dragging flag when the interaction ends.
    const resetDragging = () => {
        try {
            const ref = appGlobal.__ffvMapZoomDraggingRef;
            if (isMapZoomDraggingRef(ref)) {
                ref.current = false;
            }
        } catch {
            /* ignore */
        }
    };

    document.addEventListener("mouseup", resetDragging);
    document.addEventListener("touchend", resetDragging, { passive: true });
}

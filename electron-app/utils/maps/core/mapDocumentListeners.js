/**
 * Map document-level listeners.
 *
 * This module centralizes document event listeners used by the Leaflet map UI.
 * The map UI is frequently re-rendered (e.g. overlay changes), so listeners
 * must be installed once and use global references that are updated per
 * render.
 */

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
    /** @type {any} */
    const g = globalThis;

    if (g.__ffvMapDocumentListenersInstalled === true) {
        return;
    }
    g.__ffvMapDocumentListenersInstalled = true;

    // Collapse the Leaflet layers panel when clicking outside.
    document.addEventListener("mousedown", (/** @type {MouseEvent} */ e) => {
        try {
            const mapTypeBtn = g.__ffvMapTypeButton;
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

                const layoutFn = g.__ffvLayoutLayersControl;
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
            const ref = g.__ffvMapZoomDraggingRef;
            if (ref && typeof ref === "object") {
                ref.current = false;
            }
        } catch {
            /* ignore */
        }
    };

    document.addEventListener("mouseup", resetDragging);
    document.addEventListener("touchend", resetDragging, { passive: true });
}

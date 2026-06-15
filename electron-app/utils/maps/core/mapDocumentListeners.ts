/**
 * Map document-level listeners.
 *
 * This module centralizes document event listeners used by the Leaflet map UI.
 * The map UI is frequently re-rendered (e.g. overlay changes), so listeners
 * must be installed once and use module-owned references that are updated per
 * render.
 */

import { getMapDocumentListenersRuntime } from "./mapDocumentListenersRuntime.js";

type MapZoomDraggingRef = { current: boolean };

type MapDocumentControlRefs = {
    layoutLayersControl: (() => void) | null;
    mapTypeButton: HTMLElement | null;
    zoomDraggingRef: MapZoomDraggingRef | null;
};

let mapDocumentListenerController: AbortController | null = null;

let mapDocumentListenersInstalled = false;

let mapDocumentControlRefs: MapDocumentControlRefs = {
    layoutLayersControl: null,
    mapTypeButton: null,
    zoomDraggingRef: null,
};
const mapDocumentListenersRuntime = getMapDocumentListenersRuntime();

function isMapZoomDraggingRef(value: unknown): value is MapZoomDraggingRef {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return "current" in value && typeof value.current === "boolean";
}

function collapseLayersPanelIfClickOutside(event: MouseEvent): void {
    try {
        const mapTypeBtn = mapDocumentControlRefs.mapTypeButton;
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
            const layersControlElStyled = layersControlEl as HTMLElement;
            const layersListEl =
                layersControlElStyled.querySelector<HTMLElement>(
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

function layoutLayersPanelOnResize(): void {
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

        const layoutFn = mapDocumentControlRefs.layoutLayersControl;
        if (typeof layoutFn === "function") {
            layoutFn();
        }
    } catch {
        /* ignore */
    }
}

function resetMapZoomDraggingRef(): void {
    try {
        const ref = mapDocumentControlRefs.zoomDraggingRef;
        if (isMapZoomDraggingRef(ref)) {
            ref.current = false;
        }
    } catch {
        /* ignore */
    }
}

/**
 * Updates the current render-owned map controls consumed by document-level map
 * listeners.
 *
 * @param refs - Current control refs from renderMap().
 */
export function setMapDocumentControlRefs(
    refs: Partial<MapDocumentControlRefs>
): void {
    mapDocumentControlRefs = {
        ...mapDocumentControlRefs,
        ...refs,
    };
}

/**
 * Install document-level map listeners once to avoid leaks when renderMap() is
 * invoked repeatedly.
 */
export function ensureMapDocumentListenersInstalled(): void {
    if (mapDocumentListenersInstalled) {
        return;
    }
    mapDocumentListenersInstalled = true;
    const listenerController =
        mapDocumentListenersRuntime.createAbortController();
    mapDocumentListenerController = listenerController;
    const { signal } = listenerController;

    // Collapse the Leaflet layers panel when clicking outside.
    mapDocumentListenersRuntime.addDocumentMousedownListener(
        collapseLayersPanelIfClickOutside,
        { signal }
    );

    // Keep the expanded layers panel within the viewport/minimap bounds on resize.
    mapDocumentListenersRuntime.addWindowResizeListener(
        layoutLayersPanelOnResize,
        { signal }
    );

    // Reset the zoom-slider dragging flag when the interaction ends.
    mapDocumentListenersRuntime.addDocumentMouseupListener(
        resetMapZoomDraggingRef,
        { signal }
    );
    mapDocumentListenersRuntime.addDocumentTouchendListener(
        resetMapZoomDraggingRef,
        {
            passive: true,
            signal,
        }
    );
}

/**
 * Reset module state for isolated tests.
 */
export function resetMapDocumentListenersForTests(): void {
    mapDocumentListenerController?.abort();
    mapDocumentListenerController = null;
    mapDocumentListenersInstalled = false;
    mapDocumentControlRefs = {
        layoutLayersControl: null,
        mapTypeButton: null,
        zoomDraggingRef: null,
    };
}

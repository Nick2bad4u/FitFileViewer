import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { MapViewRoot } from "../components/MapViewRoot/MapViewRoot.jsx";

/**
 * Mount the React-powered map view into the map container. Ensures we reuse the
 * same React root between subsequent invocations to avoid tearing down the map unnecessarily.
 * @returns {void}
 */
export function renderMap() {
    const windowExt = /** @type {any} */ (globalThis);
    const container = /** @type {HTMLElement | null} */ (document.querySelector("#content-map"));
    if (!container) {
        return;
    }

    if (windowExt.__mapViewRoot && windowExt.__mapViewRootContainer !== container) {
        try {
            windowExt.__mapViewRoot.unmount();
        } catch {
            /* ignore */
        }
        windowExt.__mapViewRoot = undefined;
        windowExt.__mapViewRootContainer = undefined;
    }

    if (!windowExt.__mapViewRoot) {
        windowExt.__mapViewRoot = createRoot(container);
        windowExt.__mapViewRootContainer = container;
    }

    container.classList.add("map-view-root-host");
    windowExt.__mapViewRoot.render(createElement(MapViewRoot));
}

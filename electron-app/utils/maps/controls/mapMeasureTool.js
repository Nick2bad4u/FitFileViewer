/* global L */
// Simple point-to-point measurement tool for Leaflet

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
export function addSimpleMeasureTool(map, controlsDiv) {
    /** @type {Array<{lat:number,lng:number}>} */
    let /** @type {any} */
        measureLabel = null,
        /** @type {any} */
        measureLine = null,
        /** @type {any[]} */
        measureMarkers = [],
        measurePoints = [],
        /** @type {boolean} */
        measuring = false;
    // Button reference will be the created element below

    // Create the measure button up front so it's available to handlers
    const measureBtn = document.createElement("button");
    measureBtn.className = "map-action-btn";
    measureBtn.innerHTML = `
        <iconify-icon icon="flat-color-icons:ruler" width="18" height="18"></iconify-icon>
        <span>Measure</span>`;
    measureBtn.title = "Click, then click two points on the map to measure distance";

    function clearMeasure() {
        measurePoints = [];
        if (measureLine) {
            map.removeLayer(measureLine);
            measureLine = null;
        }
        for (const m of measureMarkers) map.removeLayer(m);
        measureMarkers = [];
        if (measureLabel) {
            map.removeLayer(measureLabel);
            measureLabel = null;
        }
    }

    /**
     * Disable measurement mode, restore button icon/text.
     * @param {HTMLButtonElement | null | undefined} measureBtn
     */
    function disableMeasure(btn) {
        measuring = false;
        map.off("click", onMapClickMeasure);
        if (btn) {
            btn.innerHTML =
                '<iconify-icon icon="flat-color-icons:ruler" width="18" height="18"></iconify-icon> <span>Measure</span>';
            btn.title = "Click, then click two points on the map to measure distance";
        }
    }

    // Add Escape key handler to clear measurement
    document.addEventListener("keydown", (e) => {
        const { key } = e;
        if (key === "Escape") {
            clearMeasure();
            // Also disable measurement mode if active
            if (measuring) {
                disableMeasure(measureBtn);
            }
        }
    });

    function createExitButton() {
        return `<button class="measure-exit-btn" title="Remove measurement">&times;</button>`;
    }

    /**
     * Handle click on the measurement label (exit button).
     * @param {MouseEvent} e
     */
    function onLabelExitClick(e) {
        const { target } = /** @type {{target: HTMLElement|null}} */ (e);
        if (target && target.classList.contains("measure-exit-btn")) {
            clearMeasure();
        }
    }

    /**
     * Handle map clicks while in measurement mode.
     * @param {any} e - Leaflet mouse event (contains latlng)
     */
    function onMapClickMeasure(e) {
        if (measurePoints.length >= 2) {
            clearMeasure();
        }
        measurePoints.push(e.latlng);
        const marker = L.marker(e.latlng, { draggable: false }); // Leaflet marker (any)
        marker.addTo(map);
        measureMarkers.push(marker);
        if (measurePoints.length === 2) {
            measureLine = L.polyline(measurePoints, { color: "#222", dashArray: "4,6", weight: 3 }).addTo(map);
            const [p0, p1] = measurePoints;
            // Defensive: ensure both points exist (should by length check)
            if (!p0 || !p1) {
                return;
            }
            const dist = map.distance(p0, p1),
                distKm = dist / 1000,
                distMi = dist / 1609.344,
                mid = L.latLng((p0.lat + p1.lat) / 2, (p0.lng + p1.lng) / 2);
            measureLabel = L.marker(mid, {
                icon: L.divIcon({
                    className: "measure-label",
                    html: `<div class="measure-label-content">${createExitButton()}${dist >= 1000 ? `${distKm.toFixed(2)} km` : `${dist.toFixed(1)} m`}<br>${distMi.toFixed(2)} mi</div>`,
                }),
                iconAnchor: [60, 19],
                iconSize: [120, 38],
                interactive: true,
            }).addTo(map);
            // Add click handler for exit button
            const labelEl = measureLabel.getElement();
            if (labelEl) {
                labelEl.addEventListener("click", onLabelExitClick);
            }
            // Auto-disable after measurement
            disableMeasure(measureBtn);
        }
    }

    /**
     * Enable measurement mode and update button appearance.
     * @param {HTMLButtonElement | null | undefined} measureBtn
     */
    function enableSimpleMeasure(btn) {
        if (measuring) {
            return;
        }
        measuring = true;
        map.on("click", onMapClickMeasure);
        if (btn) {
            btn.innerHTML =
                '<iconify-icon icon="flat-color-icons:cancel" width="18" height="18"></iconify-icon> <span>Cancel</span>';
            btn.title = "Cancel measurement mode";
        }
    }

    measureBtn.addEventListener("click", () => {
        if (measuring) {
            clearMeasure();
            disableMeasure(measureBtn);
        } else {
            clearMeasure();
            enableSimpleMeasure(measureBtn);
            measureBtn.disabled = true;
            setTimeout(() => {
                measureBtn.disabled = false;
            }, 2000);
        }
    });
    controlsDiv.append(measureBtn);
}

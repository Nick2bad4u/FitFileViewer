/* global L */
// Simple point-to-point measurement tool for Leaflet
import { getThemeColors } from "../../charts/theming/getThemeColors.js";

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
    function disableMeasure(measureBtn) {
        measuring = false;
        map.off("click", onMapClickMeasure);
        if (measureBtn) {
            measureBtn.innerHTML =
                '<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><rect x="2" y="9" width="16" height="2" rx="1" fill="#1976d2"/><rect x="2" y="5" width="2" height="10" rx="1" fill="#1976d2"/><rect x="16" y="5" width="2" height="10" rx="1" fill="#1976d2"/></svg> <span>Measure</span>';
            measureBtn.title = "Click, then click two points on the map to measure distance";
        }
    }

    // Add Escape key handler to clear measurement
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            clearMeasure();
            // Also disable measurement mode if active
            if (measuring) {
                disableMeasure(measureBtnRef);
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
        const target = /** @type {HTMLElement|null} */ (e.target);
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
            const p0 = measurePoints[0],
                p1 = measurePoints[1];
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
            disableMeasure(measureBtnRef);
        }
    }

    /**
     * Enable measurement mode and update button appearance.
     * @param {HTMLButtonElement | null | undefined} measureBtn
     */
    function enableSimpleMeasure(measureBtn) {
        if (measuring) {
            return;
        }
        measuring = true;
        map.on("click", onMapClickMeasure);
        if (measureBtn) {
            measureBtn.innerHTML =
                '<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="8" fill="none" stroke="#b71c1c" stroke-width="2"/><line x1="6" y1="6" x2="14" y2="14" stroke="#b71c1c" stroke-width="2"/><line x1="14" y1="6" x2="6" y2="14" stroke="#b71c1c" stroke-width="2"/></svg> <span>Cancel</span>';
            measureBtn.title = "Cancel measurement mode";
        }
    }

    // Get theme colors for button styling
    const measureBtn = document.createElement("button"),
        themeColors = getThemeColors();
    measureBtn.className = "map-action-btn";
    measureBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <line x1="5" y1="19" x2="19" y2="5" stroke="${themeColors.primary}" stroke-width="2"/>
            <circle cx="5" cy="19" r="2.5" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="2"/>
            <circle cx="19" cy="5" r="2.5" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="2"/>
            <text x="12" y="15" text-anchor="middle" font-size="7" fill="${themeColors.primary}">↔</text>
        </svg>
        <span>Measure</span>`;
    measureBtn.title = "Click, then click two points on the map to measure distance";
    /** @type {HTMLButtonElement} */
    const measureBtnRef = measureBtn;
    measureBtn.addEventListener('click', () => {
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

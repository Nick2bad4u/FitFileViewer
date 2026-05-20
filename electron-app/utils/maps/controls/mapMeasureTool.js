/* global L */
// Simple point-to-point measurement tool for Leaflet
import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @param {string} primary
 * @param {string} surface
 *
 * @returns {SVGSVGElement}
 */
function createMeasureIcon(primary, surface) {
    const icon = document.createElementNS(SVG_NS, "svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", "5");
    line.setAttribute("y1", "19");
    line.setAttribute("x2", "19");
    line.setAttribute("y2", "5");
    line.setAttribute("stroke", primary);
    line.setAttribute("stroke-width", "2");
    icon.append(line);

    for (const [cx, cy] of [
        ["5", "19"],
        ["19", "5"],
    ]) {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", "2.5");
        circle.setAttribute("fill", surface);
        circle.setAttribute("stroke", primary);
        circle.setAttribute("stroke-width", "2");
        icon.append(circle);
    }

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "12");
    text.setAttribute("y", "15");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "7");
    text.setAttribute("fill", primary);
    text.textContent = "↔";
    icon.append(text);

    return icon;
}

/**
 * @returns {SVGSVGElement}
 */
function createCancelIcon() {
    const icon = document.createElementNS(SVG_NS, "svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", "10");
    circle.setAttribute("cy", "10");
    circle.setAttribute("r", "8");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#b71c1c");
    circle.setAttribute("stroke-width", "2");
    icon.append(circle);

    for (const [x1, y1, x2, y2] of [
        ["6", "6", "14", "14"],
        ["14", "6", "6", "14"],
    ]) {
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "#b71c1c");
        line.setAttribute("stroke-width", "2");
        icon.append(line);
    }

    return icon;
}

/**
 * @param {HTMLButtonElement} button
 * @param {"cancel" | "measure"} state
 * @param {{ primary: string; surface: string }} colors
 */
function setMeasureButtonContent(button, state, colors) {
    const label = document.createElement("span");
    label.textContent = state === "cancel" ? "Cancel" : "Measure";
    button.replaceChildren(
        state === "cancel"
            ? createCancelIcon()
            : createMeasureIcon(colors.primary, colors.surface),
        label
    );
}

/**
 * @param {Document} doc
 *
 * @returns {HTMLButtonElement}
 */
function createExitButton(doc) {
    const button = doc.createElement("button");
    button.className = "measure-exit-btn";
    button.type = "button";
    button.title = "Remove measurement";
    button.textContent = "×";

    return button;
}

/**
 * @param {Document} doc
 * @param {string} value
 * @param {string} unit
 *
 * @returns {HTMLDivElement}
 */
function createMeasureLabelLine(doc, value, unit) {
    const line = doc.createElement("div");
    line.className = "measure-label-line";

    const valueEl = doc.createElement("span");
    valueEl.className = "measure-label-value";
    valueEl.textContent = value;

    const unitEl = doc.createElement("span");
    unitEl.className = "measure-label-unit";
    unitEl.textContent = unit;

    line.append(valueEl, doc.createTextNode(" "), unitEl);

    return line;
}

/**
 * @param {Document} doc
 * @param {string} primaryValue
 * @param {string} primaryUnit
 * @param {string} secondaryValue
 * @param {string} secondaryUnit
 *
 * @returns {HTMLDivElement}
 */
function createMeasureLabelContent(
    doc,
    primaryValue,
    primaryUnit,
    secondaryValue,
    secondaryUnit
) {
    const content = doc.createElement("div");
    content.className = "measure-label-content";
    content.append(
        createExitButton(doc),
        createMeasureLabelLine(doc, primaryValue, primaryUnit),
        createMeasureLabelLine(doc, secondaryValue, secondaryUnit)
    );

    return content;
}

/**
 * Add a simple point-to-point measurement tool (two clicks) to a Leaflet map.
 * Creates a button in the provided controls container; when activated, the next
 * two clicks on the map will display straight-line distance (meters/km +
 * miles). Subsequent clicks clear the prior measurement and allow a new one.
 *
 * Typing approach: Leaflet types are treated as any to avoid pulling in type
 * definitions in this JS file. Internal collections are explicitly typed to
 * remove implicit-any errors under checkJs.
 *
 * @param {any} map - Leaflet map instance (L.Map)
 * @param {HTMLElement} controlsDiv - Container element for map action buttons
 */
export function addSimpleMeasureTool(map, controlsDiv) {
    /** @type {{ lat: number; lng: number }[]} */
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
    const measureBtn = document.createElement("button"),
        themeColors = getThemeColors();
    measureBtn.className = "map-action-btn";

    const safePrimary = sanitizeCssColorToken(
        /** @type {any} */ (themeColors).primary,
        "#3b82f6"
    );
    const safeSurface = sanitizeCssColorToken(
        /** @type {any} */ (themeColors).surface,
        "#ffffff"
    );
    const buttonColors = { primary: safePrimary, surface: safeSurface };
    setMeasureButtonContent(measureBtn, "measure", buttonColors);
    measureBtn.title =
        "Click, then click two points on the map to measure distance";

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
     *
     * @param {HTMLButtonElement | null | undefined} measureBtn
     */
    function disableMeasure(btn) {
        measuring = false;
        map.off("click", onMapClickMeasure);
        if (btn) {
            setMeasureButtonContent(btn, "measure", buttonColors);
            btn.title =
                "Click, then click two points on the map to measure distance";
        }
    }

    // Add Escape key handler to clear measurement.
    // Idempotent: avoid leaking duplicate handlers if the map is re-rendered.
    /** @type {any} */
    const g = globalThis;
    const escapeKey = "__ffvMapMeasureEscapeHandler";
    if (typeof g[escapeKey] === "function") {
        document.removeEventListener("keydown", g[escapeKey]);
    }
    g[escapeKey] = (e) => {
        const { key } = e;
        if (key === "Escape") {
            clearMeasure();
            // Also disable measurement mode if active
            if (measuring) {
                disableMeasure(measureBtn);
            }
        }
    };
    document.addEventListener("keydown", g[escapeKey]);

    /**
     * Handle click on the measurement label (exit button).
     *
     * @param {MouseEvent} e
     */
    function onLabelExitClick(e) {
        const { target } = /** @type {{ target: HTMLElement | null }} */ (e);
        if (target && target.classList.contains("measure-exit-btn")) {
            clearMeasure();
        }
    }

    /**
     * Handle map clicks while in measurement mode.
     *
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
            measureLine = L.polyline(measurePoints, {
                color: "#222",
                dashArray: "4,6",
                weight: 3,
            }).addTo(map);
            const [p0, p1] = measurePoints;
            // Defensive: ensure both points exist (should by length check)
            if (!p0 || !p1) {
                return;
            }
            const dist = map.distance(p0, p1),
                distKm = dist / 1000,
                distMi = dist / 1609.344,
                mid = L.latLng((p0.lat + p1.lat) / 2, (p0.lng + p1.lng) / 2),
                primaryValue =
                    dist >= 1000 ? distKm.toFixed(2) : dist.toFixed(1),
                primaryUnit = dist >= 1000 ? "km" : "m",
                secondaryValue = distMi.toFixed(2),
                secondaryUnit = "mi";
            measureLabel = L.marker(mid, {
                icon: L.divIcon({
                    className: "measure-label",
                    html: createMeasureLabelContent(
                        document,
                        primaryValue,
                        primaryUnit,
                        secondaryValue,
                        secondaryUnit
                    ),
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
     *
     * @param {HTMLButtonElement | null | undefined} measureBtn
     */
    function enableSimpleMeasure(btn) {
        if (measuring) {
            return;
        }
        measuring = true;
        map.on("click", onMapClickMeasure);
        if (btn) {
            setMeasureButtonContent(btn, "cancel", buttonColors);
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

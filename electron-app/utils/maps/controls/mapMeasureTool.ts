// Simple point-to-point measurement tool for Leaflet
import type * as Leaflet from "leaflet";

import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import { resolveLeafletRuntime } from "../core/leafletRuntime.js";
import {
    getMapMeasureToolRuntime,
    type MapMeasureToolRuntime,
    type MapMeasureToolTimer,
} from "./mapMeasureToolRuntime.js";

type LatLngPoint = Leaflet.LatLng;

type MeasureClickEvent = Leaflet.LeafletMouseEvent;

type MeasureMap = Leaflet.Map;

type MeasureMarker = Leaflet.Marker;

type MeasurePolyline = Leaflet.Polyline;

type MeasureLeaflet = Pick<
    typeof Leaflet,
    "divIcon" | "latLng" | "marker" | "polyline"
>;

type ThemeColors = {
    primary?: unknown;
    surface?: unknown;
};

type MapMeasureEscapeRegistration = {
    readonly handler: (event: KeyboardEvent) => void;
    readonly runtime: MapMeasureToolRuntime;
};

let mapMeasureEscapeHandler: MapMeasureEscapeRegistration | null = null;

function isMeasureLeaflet(value: unknown): value is MeasureLeaflet {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return (
        hasFunctionProperty(value, "divIcon") &&
        hasFunctionProperty(value, "latLng") &&
        hasFunctionProperty(value, "marker") &&
        hasFunctionProperty(value, "polyline")
    );
}

function hasFunctionProperty(
    value: object,
    key: keyof MeasureLeaflet
): boolean {
    if (!(key in value)) {
        return false;
    }

    return typeof value[key as keyof typeof value] === "function";
}

function replaceMapMeasureEscapeHandler(
    handler: (event: KeyboardEvent) => void,
    runtime: MapMeasureToolRuntime
): void {
    const currentHandler = mapMeasureEscapeHandler;
    if (currentHandler) {
        currentHandler.runtime.removeDocumentKeydownListener(
            currentHandler.handler
        );
    }
    mapMeasureEscapeHandler = { handler, runtime };
}

function clearMapMeasureEscapeHandler(
    handler: (event: KeyboardEvent) => void
): void {
    const currentHandler = mapMeasureEscapeHandler;
    if (!currentHandler || currentHandler.handler !== handler) {
        return;
    }
    currentHandler.runtime.removeDocumentKeydownListener(handler);
    mapMeasureEscapeHandler = null;
}

export function resetMapMeasureToolStateForTests(): void {
    const currentHandler = mapMeasureEscapeHandler;
    if (currentHandler) {
        currentHandler.runtime.removeDocumentKeydownListener(
            currentHandler.handler
        );
    }
    mapMeasureEscapeHandler = null;
}

function getLeaflet(): MeasureLeaflet | null {
    return resolveLeafletRuntime(isMeasureLeaflet);
}

function createMeasureIcon(
    primary: string,
    surface: string,
    runtime: MapMeasureToolRuntime
): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const line = runtime.createSvgElement("line");
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
    ] as const) {
        const circle = runtime.createSvgElement("circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", "2.5");
        circle.setAttribute("fill", surface);
        circle.setAttribute("stroke", primary);
        circle.setAttribute("stroke-width", "2");
        icon.append(circle);
    }

    const text = runtime.createSvgElement("text");
    text.setAttribute("x", "12");
    text.setAttribute("y", "15");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "7");
    text.setAttribute("fill", primary);
    text.textContent = "↔";
    icon.append(text);

    return icon;
}

function createCancelIcon(runtime: MapMeasureToolRuntime): SVGSVGElement {
    const icon = runtime.createSvgElement("svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");

    const circle = runtime.createSvgElement("circle");
    circle.setAttribute("cx", "10");
    circle.setAttribute("cy", "10");
    circle.setAttribute("r", "8");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#b71c1c");
    circle.setAttribute("stroke-width", "2");
    icon.append(circle);

    for (const [
        x1,
        y1,
        x2,
        y2,
    ] of [
        [
            "6",
            "6",
            "14",
            "14",
        ],
        [
            "14",
            "6",
            "6",
            "14",
        ],
    ] as const) {
        const line = runtime.createSvgElement("line");
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

function setMeasureButtonContent(
    button: HTMLButtonElement,
    state: "cancel" | "measure",
    colors: { primary: string; surface: string },
    runtime: MapMeasureToolRuntime
): void {
    const label = runtime.createElement("span");
    label.textContent = state === "cancel" ? "Cancel" : "Measure";
    button.replaceChildren(
        state === "cancel"
            ? createCancelIcon(runtime)
            : createMeasureIcon(colors.primary, colors.surface, runtime),
        label
    );
}

function createExitButton(runtime: MapMeasureToolRuntime): HTMLButtonElement {
    const button = runtime.createElement("button");
    button.className = "measure-exit-btn";
    button.type = "button";
    button.title = "Remove measurement";
    button.textContent = "×";

    return button;
}

function createMeasureLabelLine(
    value: string,
    unit: string,
    runtime: MapMeasureToolRuntime
): HTMLDivElement {
    const line = runtime.createElement("div");
    line.className = "measure-label-line";

    const valueEl = runtime.createElement("span");
    valueEl.className = "measure-label-value";
    valueEl.textContent = value;

    const unitEl = runtime.createElement("span");
    unitEl.className = "measure-label-unit";
    unitEl.textContent = unit;

    line.append(valueEl, runtime.createTextNode(" "), unitEl);

    return line;
}

function createMeasureLabelContent(
    primaryValue: string,
    primaryUnit: string,
    secondaryValue: string,
    secondaryUnit: string,
    runtime: MapMeasureToolRuntime
): HTMLDivElement {
    const content = runtime.createElement("div");
    content.className = "measure-label-content";
    content.append(
        createExitButton(runtime),
        createMeasureLabelLine(primaryValue, primaryUnit, runtime),
        createMeasureLabelLine(secondaryValue, secondaryUnit, runtime)
    );

    return content;
}

/**
 * Add a simple point-to-point measurement tool (two clicks) to a Leaflet map.
 * Creates a button in the provided controls container; when activated, the next
 * two clicks on the map will display straight-line distance (meters/km +
 * miles). Subsequent clicks clear the prior measurement and allow a new one.
 *
 * @param map - Leaflet map instance.
 * @param controlsDiv - Container element for map action buttons.
 */
export function addSimpleMeasureTool(
    map: MeasureMap,
    controlsDiv: HTMLElement,
    runtime: MapMeasureToolRuntime = getMapMeasureToolRuntime()
): void {
    let measureLabel: MeasureMarker | null = null,
        measureLine: MeasurePolyline | null = null,
        measureMarkers: MeasureMarker[] = [],
        measurePoints: LatLngPoint[] = [],
        measuring = false;
    // Button reference will be the created element below

    // Create the measure button up front so it's available to handlers
    const eventController = runtime.createAbortController();
    const { signal } = eventController;
    let disableTimer: MapMeasureToolTimer | null = null;
    const measureBtn = runtime.createElement("button"),
        themeColors = getThemeColors();
    measureBtn.className = "map-action-btn";

    const typedThemeColors = themeColors as ThemeColors;
    const safePrimary = sanitizeCssColorToken(
        typedThemeColors.primary,
        "#3b82f6"
    );
    const safeSurface = sanitizeCssColorToken(
        typedThemeColors.surface,
        "#ffffff"
    );
    const buttonColors = { primary: safePrimary, surface: safeSurface };
    setMeasureButtonContent(measureBtn, "measure", buttonColors, runtime);
    measureBtn.title =
        "Click, then click two points on the map to measure distance";

    function clearMeasure() {
        measurePoints = [];
        if (measureLine) {
            map.removeLayer(measureLine);
            measureLine = null;
        }
        for (const marker of measureMarkers) {
            map.removeLayer(marker);
        }
        measureMarkers = [];
        if (measureLabel) {
            map.removeLayer(measureLabel);
            measureLabel = null;
        }
    }

    /**
     * Disable measurement mode, restore button icon/text.
     */
    function disableMeasure(btn: HTMLButtonElement | null | undefined): void {
        measuring = false;
        map.off("click", onMapClickMeasure);
        if (btn) {
            setMeasureButtonContent(btn, "measure", buttonColors, runtime);
            btn.title =
                "Click, then click two points on the map to measure distance";
        }
    }

    // Add Escape key handler to clear measurement.
    // Idempotent: avoid leaking duplicate handlers if the map is re-rendered.
    const escapeHandler = (event: KeyboardEvent) => {
        const { key } = event;
        if (key === "Escape") {
            clearMeasure();
            // Also disable measurement mode if active
            if (measuring) {
                disableMeasure(measureBtn);
            }
        }
    };
    replaceMapMeasureEscapeHandler(escapeHandler, runtime);
    runtime.addDocumentKeydownListener(escapeHandler, { signal });
    signal.addEventListener(
        "abort",
        () => {
            if (disableTimer) {
                runtime.clearTimeout(disableTimer);
                disableTimer = null;
            }
            clearMapMeasureEscapeHandler(escapeHandler);
        },
        { once: true, signal }
    );

    function onLabelExitClick(event: MouseEvent): void {
        const { target } = event;
        if (
            runtime.isHTMLElement(target) &&
            target.classList.contains("measure-exit-btn")
        ) {
            clearMeasure();
        }
    }

    function onMapClickMeasure(event: MeasureClickEvent): void {
        const leaflet = getLeaflet();
        if (!leaflet) {
            return;
        }

        if (measurePoints.length >= 2) {
            clearMeasure();
        }
        measurePoints.push(event.latlng);
        const marker = leaflet.marker(event.latlng, { draggable: false });
        marker.addTo(map);
        measureMarkers.push(marker);
        if (measurePoints.length === 2) {
            measureLine = leaflet
                .polyline(measurePoints, {
                    color: "#222",
                    dashArray: "4,6",
                    weight: 3,
                })
                .addTo(map);
            const [p0, p1] = measurePoints;
            // Defensive: ensure both points exist (should by length check)
            if (!p0 || !p1) {
                return;
            }
            const dist = map.distance(p0, p1),
                distKm = dist / 1000,
                distMi = dist / 1609.344,
                mid = leaflet.latLng(
                    (p0.lat + p1.lat) / 2,
                    (p0.lng + p1.lng) / 2
                ),
                primaryValue =
                    dist >= 1000 ? distKm.toFixed(2) : dist.toFixed(1),
                primaryUnit = dist >= 1000 ? "km" : "m",
                secondaryValue = distMi.toFixed(2),
                secondaryUnit = "mi";
            measureLabel = leaflet
                .marker(mid, {
                    icon: leaflet.divIcon({
                        className: "measure-label",
                        html: createMeasureLabelContent(
                            primaryValue,
                            primaryUnit,
                            secondaryValue,
                            secondaryUnit,
                            runtime
                        ),
                        iconAnchor: [60, 19],
                        iconSize: [120, 38],
                    }),
                    interactive: true,
                })
                .addTo(map);
            // Add click handler for exit button
            const labelEl = measureLabel.getElement?.();
            if (labelEl) {
                labelEl.addEventListener("click", onLabelExitClick, {
                    signal,
                });
            }
            // Auto-disable after measurement
            disableMeasure(measureBtn);
        }
    }

    function enableSimpleMeasure(btn: HTMLButtonElement | null | undefined) {
        if (measuring) {
            return;
        }
        measuring = true;
        map.on("click", onMapClickMeasure);
        if (btn) {
            setMeasureButtonContent(btn, "cancel", buttonColors, runtime);
            btn.title = "Cancel measurement mode";
        }
    }

    measureBtn.addEventListener(
        "click",
        () => {
            if (measuring) {
                clearMeasure();
                disableMeasure(measureBtn);
            } else {
                clearMeasure();
                enableSimpleMeasure(measureBtn);
                measureBtn.disabled = true;
                if (disableTimer) {
                    runtime.clearTimeout(disableTimer);
                }
                disableTimer = runtime.setTimeout(() => {
                    measureBtn.disabled = false;
                    disableTimer = null;
                }, 2000);
            }
        },
        { signal }
    );
    controlsDiv.addEventListener(
        "ffv:map-measure-tool:dispose",
        () => eventController.abort(),
        { once: true, signal }
    );
    controlsDiv.append(measureBtn);
}

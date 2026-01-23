/* global */

/**
 * @typedef {Object} RecordMessage
 * @property {number} positionLat - Latitude position (semicircles)
 * @property {number} positionLong - Longitude position (semicircles)
 * @property {number} [altitude] - Altitude in meters
 * @property {number} [timestamp] - Unix timestamp
 * @property {number} [speed] - Speed value
 * @property {number} [heartRate] - Heart rate value
 * @property {number} [power] - Power value
 * @property {number} [cadence] - Cadence value
 * @property {number} [distance] - Distance value
 */

/**
 * @typedef {Object} GlobalData
 * @property {RecordMessage[]} recordMesgs - Array of record messages
 * @property {any[]} [lapMesgs] - Array of lap messages
 * @property {string} [cachedFilePath] - Cached file path
 */

/**
 * @typedef {Object} WindowExtensions
 * @property {GlobalData} globalData - Global data object
 * @property {any} _overlayPolylines - Overlay polylines object
 * @property {any} _leafletMapInstance - Leaflet map instance
 * @property {any} _mainPolylineOriginalBounds - Original bounds for main polyline
 * @property {number} _highlightedOverlayIdx - Currently highlighted overlay index
 * @property {any[]} loadedFitFiles - Array of loaded FIT files
 * @property {Function} updateOverlayHighlights - Function to update overlay highlights
 * @property {Function} updateShownFilesList - Function to update shown files list
 * @property {Function} renderMap - Function to render map
 * @property {Function} [setupOverlayFileNameMapActions] - Function to setup overlay file name map actions
 * @property {Function} [setupActiveFileNameMapActions] - Function to setup active file name map actions
 * @property {any} [_measureControl] - Leaflet measure control (plugin)
 * @property {any} [_drawControl] - Leaflet draw control (plugin)
 * @property {any} [_drawnItems] - FeatureGroup containing user-drawn items
 * @property {any} [_miniMapControl] - Leaflet minimap control (plugin)
 * @property {any} L - Leaflet library object
 */

/**
 * @typedef {Object} LatLng
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 */

import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import { applyEstimatedPowerToRecords, hasPowerData } from "../../data/processing/estimateCyclingPower.js";
import { getLapNumForIdx } from "../../data/processing/getLapNumForIdx.js";
import { getPowerEstimationSettings } from "../../data/processing/powerEstimationSettings.js";
import { createExportGPXButton } from "../../files/export/createExportGPXButton.js";
import { createPrintButton } from "../../files/export/createPrintButton.js";
import { sanitizeFilenameComponent } from "../../files/sanitizeFilename.js";
import { formatTooltipData } from "../../formatting/display/formatTooltipData.js";
import { createShownFilesList } from "../../rendering/components/createShownFilesList.js";
import { getState, setState } from "../../state/core/stateManager.js";
import { installUpdateMapThemeListeners, updateMapTheme } from "../../theming/specific/updateMapTheme.js";
import { createAddFitFileToMapButton } from "../../ui/controls/createAddFitFileToMapButton.js";
import { createDataPointFilterControl } from "../../ui/controls/createDataPointFilterControl.js";
import { createElevationProfileButton } from "../../ui/controls/createElevationProfileButton.js";
import { createMarkerCountSelector } from "../../ui/controls/createMarkerCountSelector.js";
import { createPowerEstimationButton } from "../../ui/controls/createPowerEstimationButton.js";
import { createMapThemeToggle } from "../controls/mapActionButtons.js";
import { addFullscreenControl } from "../controls/mapFullscreenControl.js";
import { addLapSelector } from "../controls/mapLapSelector.js";
/**
 * Renders a Leaflet map inside the element with id 'content-map'.
 * If `window.globalData.recordMesgs` exists and contains valid latitude and longitude data,
 * it plots the coordinates as a polyline on the map and fits the map bounds to the polyline.
 * If no valid location data is available, displays a message instead of the map.
 *
 * Assumes that `window.globalData.recordMesgs` is an array of objects with `positionLat` and `positionLong` properties,
 * where the coordinates are encoded as signed 32-bit integers and need to be converted to degrees.
 *
 * Dependencies:
 * - Leaflet.js library must be loaded and available as global `L`.
 */
import { addSimpleMeasureTool } from "../controls/mapMeasureTool.js";
import { baseLayers } from "../layers/mapBaseLayers.js";
import { drawOverlayForFitFile, mapDrawLaps } from "../layers/mapDrawLaps.js";
import { createEndIcon, createStartIcon } from "../layers/mapIcons.js";
import { getLapColor } from "./mapColors.js";
import { ensureMapDocumentListenersInstalled } from "./mapDocumentListeners.js";

export function renderMap() {
    // Reset overlay polylines to prevent stale references and memory leaks
    const windowExt = /** @type {WindowExtensions} */ (/** @type {any} */ (globalThis));
    const LeafletLib = /** @type {any} */ (windowExt).L;
    if (!LeafletLib) {
        console.warn("[renderMap] Leaflet library unavailable; skipping map render.");
        return;
    }
    const L = LeafletLib;
    windowExt._overlayPolylines = {};

    const scheduleMicrotask =
        typeof queueMicrotask === "function" ? queueMicrotask : (callback) => Promise.resolve().then(callback);

    const mapContainer = document.querySelector("#content-map");
    if (!mapContainer) {
        return;
    }

    // Defensive cleanup: overlay filename tooltips are appended to document.body and can become orphaned
    // if the overlay list or map is re-rendered while a tooltip is visible.
    try {
        for (const el of document.querySelectorAll(".overlay-filename-tooltip")) {
            if (el instanceof HTMLElement) {
                el.remove();
            }
        }
    } catch {
        /* ignore tooltip cleanup errors */
    }

    // Save drawn items before destroying map
    let savedDrawnLayers = [];
    if (windowExt._drawnItems && windowExt._drawnItems.getLayers) {
        try {
            savedDrawnLayers = windowExt._drawnItems
                .getLayers()
                .map((/** @type {any} */ layer) => ({
                    geoJSON: layer.toGeoJSON ? layer.toGeoJSON() : null,
                    options: layer.options,
                    type:
                        layer instanceof L.Circle
                            ? "circle"
                            : layer instanceof L.Marker
                              ? "marker"
                              : layer instanceof L.Polygon
                                ? "polygon"
                                : layer instanceof L.Polyline
                                  ? "polyline"
                                  : layer instanceof L.Rectangle
                                    ? "rectangle"
                                    : "unknown",
                }))
                .filter((item) => item.geoJSON !== null);
            console.log("[renderMap] Saved", savedDrawnLayers.length, "drawn items");
        } catch (error) {
            console.warn("[renderMap] Failed to save drawn items:", error);
        }
    }

    // Cleanup old plugin controls/references to avoid retaining old map instances via control closures.
    // Leaflet's map.remove() should handle most cleanup, but plugins occasionally attach document listeners.
    try {
        if (windowExt._measureControl && typeof windowExt._measureControl.remove === "function") {
            windowExt._measureControl.remove();
        }
    } catch {
        /* ignore */
    }
    windowExt._measureControl = null;

    try {
        if (windowExt._drawControl && typeof windowExt._drawControl.remove === "function") {
            windowExt._drawControl.remove();
        }
    } catch {
        /* ignore */
    }
    windowExt._drawControl = null;

    // Clear old drawnItems reference now that we've snapshot the geoJSON.
    windowExt._drawnItems = null;

    try {
        if (windowExt._miniMapControl && typeof windowExt._miniMapControl.remove === "function") {
            windowExt._miniMapControl.remove();
        }
    } catch {
        /* ignore */
    }
    windowExt._miniMapControl = null;

    // Fix: Remove any previous Leaflet map instance to avoid grey background bug
    if (windowExt._leafletMapInstance && windowExt._leafletMapInstance.remove) {
        windowExt._leafletMapInstance.remove();
        windowExt._leafletMapInstance = null;
    }

    // If an old shown-files list exists, invoke its cleanup hook before removing DOM.
    try {
        const oldShownFilesList = mapContainer.querySelector(".shown-files-list");
        // @ts-expect-error - custom property for lifecycle management
        if (oldShownFilesList && typeof oldShownFilesList._dispose === "function") {
            // @ts-expect-error - custom property for lifecycle management
            oldShownFilesList._dispose();
        }
    } catch {
        /* ignore */
    }
    const oldMapDiv = document.querySelector("#leaflet-map");
    if (oldMapDiv) {
        oldMapDiv.remove();
    }
    while (mapContainer.firstChild) {
        mapContainer.firstChild.remove();
    }

    const leafletMapDiv = document.createElement("div");
    leafletMapDiv.id = "leaflet-map";
    mapContainer.append(leafletMapDiv);

    const mapControlsDiv = document.createElement("div");
    mapControlsDiv.id = "map-controls";
    mapControlsDiv.className = "map-controls-panel";
    const primaryControlsContainer = document.createElement("div");
    primaryControlsContainer.className = "map-controls-panel__primary";
    mapControlsDiv.append(primaryControlsContainer);
    mapContainer.append(mapControlsDiv);

    /**
     * Full basemap catalogue with friendly display labels.
     *
     * We keep persistence values as internal baseLayers keys, but display better labels.
     *
     * @param {string} key
     * @returns {string}
     */
    const formatBaseLayerLabel = (key) => {
        /** @type {Record<string, string>} */
        const overrides = {
            CartoDB_DarkMatter: "CARTO Dark Matter (Dark)",
            CartoDB_Positron: "CARTO Positron (Light)",
            CartoDB_Voyager: "CARTO Voyager",
            CyclOSM: "CyclOSM (Bicycle)",
            Esri_NatGeo: "Esri National Geographic",
            Esri_Topo: "Esri Topographic",
            Esri_WorldGrayCanvas: "Esri Light Gray",
            Esri_WorldImagery: "Satellite (Esri World Imagery)",
            Esri_WorldImagery_Labels: "Satellite + Labels (Esri)",
            Esri_WorldPhysical: "Esri World Physical",
            Esri_WorldShadedRelief: "Esri Shaded Relief",
            Esri_WorldStreetMap: "Esri Street Map",
            Esri_WorldStreetMap_Labels: "Esri Street Map + Labels",
            Esri_WorldTerrain: "Esri World Terrain",
            Esri_WorldTopo_Labels: "Esri Topographic + Labels",
            Humanitarian: "OpenStreetMap (Humanitarian / HOT)",
            OpenRailwayMap: "OpenRailwayMap",
            OpenSeaMap: "OpenSeaMap (Nautical)",
            OpenStreetMap: "OpenStreetMap (Standard)",
            OpenTopoMap: "OpenTopoMap (Terrain)",
            OSM_DE: "OpenStreetMap.de (Germany mirror)",
            OSM_France: "OpenStreetMap France",
            Satellite: "Satellite (Esri)",
            Thunderforest_Cycle: "Thunderforest Cycle (Key required)",
            Thunderforest_Transport: "Thunderforest Transport (Key required)",
            WaymarkedTrails_Cycling: "Waymarked Trails (Cycling)",
            WaymarkedTrails_Hiking: "Waymarked Trails (Hiking)",
            WaymarkedTrails_Slopes: "Waymarked Trails (Slopes)",
        };
        const overridden = overrides[key];
        if (overridden) return overridden;

        // Fallback: split on underscores, and insert spaces in CamelCase.
        const parts = key
            .split("_")
            .filter(Boolean)
            .map((p) => p.replaceAll(/([a-z])([A-Z])/gu, "$1 $2"));
        return parts.join(" ");
    };

    // Prefer common layers at the top, then show the rest alphabetically by label.
    /** @type {Array<keyof typeof baseLayers>} */
    const preferredOrder = [
        "OpenStreetMap",
        "OpenTopoMap",
        "CyclOSM",
        "Humanitarian",
        "OSM_France",
        "OSM_DE",
        "CartoDB_Positron",
        "CartoDB_Voyager",
        "CartoDB_DarkMatter",
        "Esri_WorldImagery",
        "Esri_Topo",
        "Esri_WorldStreetMap",
    ];

    /** @type {Array<{ key: keyof typeof baseLayers, label: string }>} */
    const layerEntries = Object.keys(baseLayers)
        .filter((k) => Object.hasOwn(baseLayers, k))
        .map((k) => ({ key: /** @type {keyof typeof baseLayers} */ (k), label: formatBaseLayerLabel(k) }));

    // Ensure labels are unique for the Leaflet layers control.
    /** @type {Set<string>} */
    const usedLabels = new Set();
    for (const entry of layerEntries) {
        const { key } = entry;
        let { label } = entry;
        if (usedLabels.has(label)) {
            label = `${label} (${key})`;
        }
        usedLabels.add(label);
        entry.label = label;
    }

    layerEntries.sort((a, b) => {
        const ai = preferredOrder.indexOf(a.key);
        const bi = preferredOrder.indexOf(b.key);
        const aPinned = ai !== -1;
        const bPinned = bi !== -1;
        if (aPinned && bPinned) return ai - bi;
        if (aPinned) return -1;
        if (bPinned) return 1;
        return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" });
    });

    /** @type {Map<string, keyof typeof baseLayers>} */
    const labelToKey = new Map(layerEntries.map((e) => [e.label, e.key]));

    /**
     * Resolve persisted values to a valid baseLayers key.
     * Supports:
     * - new persistence values (internal keys)
     * - old values (lower-cased ids)
     * - UI labels (if the user upgraded from a build that stored display names)
     *
     * @param {string} value
     * @returns {keyof typeof baseLayers}
     */
    const resolveBaseLayerKey = (value) => {
        const trimmed = typeof value === "string" ? value.trim() : "";
        if (!trimmed) return "OpenStreetMap";

        const byLabel = labelToKey.get(trimmed);
        if (byLabel) return byLabel;

        if (Object.hasOwn(baseLayers, trimmed)) {
            return /** @type {keyof typeof baseLayers} */ (trimmed);
        }

        const lower = trimmed.toLowerCase();
        if (lower === "openstreetmap" || lower === "osm" || lower === "mapnik") return "OpenStreetMap";
        if (lower === "topo" || lower === "opentopo" || lower === "opentopomap") return "OpenTopoMap";
        if (lower === "satellite" || lower === "worldimagery") return "Esri_WorldImagery";
        if (lower === "osm_de" || lower === "osmde" || lower === "openstreetmap.de") return "OSM_DE";

        const found = Object.keys(baseLayers).find((k) => k.toLowerCase() === lower);
        return /** @type {keyof typeof baseLayers} */ (found ?? "OpenStreetMap");
    };

    // Build the final list for the Leaflet layers control.
    // This intentionally includes the full catalogue; layoutLayersControl() will constrain it.
    const baseLayersForControl = Object.fromEntries(layerEntries.map((entry) => [entry.label, baseLayers[entry.key]]));

    const persistedBaseLayerKey = resolveBaseLayerKey(getState("map.baseLayer"));
    const initialBaseLayer = baseLayers[persistedBaseLayerKey] ?? baseLayers.OpenStreetMap;

    const map = LeafletLib.map("leaflet-map", {
        center: [0, 0],
        fullscreenControl: true,
        layers: [initialBaseLayer],
        zoom: 2,
    });
    windowExt._leafletMapInstance = map;

    LeafletLib.control.layers(baseLayersForControl, null, { collapsed: true, position: "topright" }).addTo(map);

    // Persist basemap selection so it is restored next launch.
    map.on("baselayerchange", (event) => {
        try {
            const name = event && typeof event === "object" && typeof event.name === "string" ? event.name.trim() : "";
            if (!name) return;

            const resolvedKey = labelToKey.get(name);
            if (!resolvedKey) {
                return;
            }
            setState("map.baseLayer", resolvedKey, { source: "renderMap.baselayerchange" });
        } catch {
            /* ignore */
        }
    });

    // Add a custom floating label/button to indicate map type selection
    const mapTypeBtn = document.createElement("div");
    mapTypeBtn.className = "custom-maptype-btn leaflet-bar";
    mapTypeBtn.style.position = "absolute";
    mapTypeBtn.style.top = "16px";
    mapTypeBtn.style.right = "16px";
    mapTypeBtn.style.zIndex = "10030"; // Ensure above minimap + layer picker
    mapTypeBtn.textContent = "🗺️ Map style";
    mapTypeBtn.title = "Choose a basemap style";
    mapTypeBtn.addEventListener("click", handleMapTypeButtonClick);
    const leafletMapDiv2 = document.querySelector("#leaflet-map");
    if (leafletMapDiv2) {
        leafletMapDiv2.append(mapTypeBtn);
    }

    // Update global reference for the map type button used by the shared document listener.
    /** @type {any} */ (globalThis).__ffvMapTypeButton = mapTypeBtn;
    /** @type {any} */ (globalThis).__ffvLayoutLayersControl = () => layoutLayersControl({ layersControlEl: null });
    ensureMapDocumentListenersInstalled();

    /**
     * Handle map type button click
     * @param {Event} e - Click event
     * @returns {void}
     */
    /**
     * @returns {HTMLElement | null}
     */
    function getLayersControlEl() {
        const el = document.querySelector(".leaflet-control-layers");
        return el instanceof HTMLElement ? el : null;
    }

    /**
     * @param {{ focusFirst?: boolean }} [options]
     */
    function openLayersControl(options = {}) {
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        layersControlEl.classList.add("leaflet-control-layers-expanded");
        layersControlEl.style.zIndex = "10025"; // Just below the button
        layoutLayersControl({ layersControlEl });

        if (options.focusFirst) {
            const firstInput = layersControlEl.querySelector('input[type="radio"]');
            if (firstInput) {
                const inputElement = /** @type {HTMLInputElement} */ (firstInput);
                inputElement.focus();
            }
        }
    }

    function closeLayersControl() {
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        const layersListEl = /** @type {HTMLElement | null} */ (
            layersControlEl.querySelector(".leaflet-control-layers-list")
        );
        layersControlEl.classList.remove("leaflet-control-layers-expanded");
        layersControlEl.style.zIndex = "";
        layersControlEl.style.maxHeight = "";
        layersControlEl.style.marginTop = "";
        layersControlEl.style.overflowY = "";
        layersControlEl.style.overflowX = "";
        if (layersListEl) {
            layersListEl.style.maxHeight = "";
            layersListEl.style.overflowY = "";
        }
    }

    function handleMapTypeButtonClick(e) {
        e.stopPropagation();
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        const isExpanded = layersControlEl.classList.contains("leaflet-control-layers-expanded");
        if (isExpanded) {
            closeLayersControl();
        } else {
            openLayersControl({ focusFirst: true });
        }
    }

    // Hover-open behavior (requested): open when hovering the Map style button,
    // keep open while hovering the panel, and close shortly after leaving.
    {
        const HOVER_OPEN_DELAY_MS = 90;
        const HOVER_CLOSE_DELAY_MS = 220;
        /** @type {ReturnType<typeof setTimeout> | null} */
        let openTimer = null;
        /** @type {ReturnType<typeof setTimeout> | null} */
        let closeTimer = null;

        const clearOpenTimer = () => {
            if (openTimer) {
                clearTimeout(openTimer);
                openTimer = null;
            }
        };
        const clearCloseTimer = () => {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
        };

        const scheduleOpen = () => {
            clearCloseTimer();
            clearOpenTimer();
            openTimer = setTimeout(() => {
                openLayersControl();
                openTimer = null;
            }, HOVER_OPEN_DELAY_MS);
        };
        const scheduleClose = () => {
            clearOpenTimer();
            clearCloseTimer();
            closeTimer = setTimeout(() => {
                closeLayersControl();
                closeTimer = null;
            }, HOVER_CLOSE_DELAY_MS);
        };
        const cancelClose = () => {
            clearCloseTimer();
        };

        mapTypeBtn.addEventListener("mouseenter", scheduleOpen);
        mapTypeBtn.addEventListener("mouseleave", scheduleClose);
        mapTypeBtn.addEventListener("focus", () => openLayersControl({ focusFirst: true }));
        mapTypeBtn.addEventListener("blur", scheduleClose);

        // Keep open while hovering the expanded panel.
        const layersControlEl = getLayersControlEl();
        if (layersControlEl) {
            layersControlEl.addEventListener("mouseenter", cancelClose);
            layersControlEl.addEventListener("mouseleave", scheduleClose);
        }
    }

    /**
     * Constrain the expanded basemap selector so it never overlaps critical UI.
     *
     * We avoid relying on z-index battles (Leaflet plugins may set extreme values) by:
     * - pushing the control down so it starts below the Map style button
     * - limiting maxHeight so it ends above the minimap (when present)
     * - enabling scrolling within the panel
     *
     * @param {{ layersControlEl: HTMLElement | null }} params
     */
    function layoutLayersControl({ layersControlEl }) {
        const layersEl =
            layersControlEl || /** @type {HTMLElement | null} */ (document.querySelector(".leaflet-control-layers"));
        const mapEl = document.getElementById("leaflet-map");
        if (!layersEl || !(layersEl instanceof HTMLElement) || !mapEl) {
            return;
        }

        const layersListEl = /** @type {HTMLElement | null} */ (layersEl.querySelector(".leaflet-control-layers-list"));

        // Keep a global ref so the shared document listeners can re-run layout on resize.
        /** @type {any} */ (globalThis).__ffvLayoutLayersControl = () =>
            layoutLayersControl({ layersControlEl: layersEl });

        // Only apply layout rules when the panel is expanded.
        if (!layersEl.classList.contains("leaflet-control-layers-expanded")) {
            return;
        }

        const mapTypeRect = mapTypeBtn.getBoundingClientRect();
        const mapRect = mapEl.getBoundingClientRect();
        const minimapEl = document.querySelector(".leaflet-control-minimap");
        const minimapRect = minimapEl instanceof HTMLElement ? minimapEl.getBoundingClientRect() : null;

        // Reset styles before measurement.
        layersEl.style.maxHeight = "";
        layersEl.style.overflowY = "hidden";
        layersEl.style.marginTop = "";

        if (layersListEl) {
            layersListEl.style.maxHeight = "";
            layersListEl.style.overflowY = "";
        }

        const raf =
            typeof requestAnimationFrame === "function"
                ? requestAnimationFrame
                : /** @param {FrameRequestCallback} cb */ (cb) => setTimeout(cb, 0);

        // Use RAF so we measure after Leaflet expanded class applies.
        raf(() => {
            const layersRect = layersEl.getBoundingClientRect();

            // Compute a conservative bottom bound (extra padding prevents scrollbar being clipped
            // by the Leaflet container's overflow + border radius).
            const EDGE_PADDING_PX = 28;
            const mapBottomLimit = mapRect.bottom - EDGE_PADDING_PX;
            const minimapTopLimit = minimapRect ? minimapRect.top - EDGE_PADDING_PX : mapBottomLimit;
            const bottomLimit = Math.min(mapBottomLimit, minimapTopLimit);

            // Push down to avoid overlapping the map-type button, but never push so far down
            // that the panel cannot fit within the available space.
            const desiredPushDown = Math.max(0, Math.round(mapTypeRect.bottom - layersRect.top + EDGE_PADDING_PX));
            const minUsableHeight = 160;
            const maxAllowedPushDown = Math.max(0, Math.floor(bottomLimit - layersRect.top - minUsableHeight));
            const pushDownPx = Math.min(desiredPushDown, maxAllowedPushDown);

            if (pushDownPx > 0) {
                layersEl.style.marginTop = `${pushDownPx}px`;
            }

            raf(() => {
                const updatedRect = layersEl.getBoundingClientRect();
                const available = Math.floor(bottomLimit - updatedRect.top);
                const maxHeight = Math.max(0, available);

                // Avoid nested scrollbars: constrain and scroll the inner list, not the outer control.
                if (layersListEl) {
                    const listRect = layersListEl.getBoundingClientRect();
                    const chromeHeight = Math.max(0, Math.floor(updatedRect.height - listRect.height));
                    const listMax = Math.max(0, maxHeight - chromeHeight);
                    layersListEl.style.maxHeight = `${listMax}px`;
                    layersListEl.style.overflowY = "auto";
                    layersEl.style.maxHeight = "";
                } else {
                    // Fallback: if Leaflet markup changes, keep the old behavior.
                    layersEl.style.maxHeight = `${maxHeight}px`;
                    layersEl.style.overflowY = "auto";
                }
            });
        });
    }

    // (Outside-click collapse is handled by a shared document listener)

    // --- Add a custom zoom slider bar (normalized 0-100%) ---
    const zoomSliderBar = document.createElement("div");
    zoomSliderBar.className = "custom-zoom-slider-bar";
    const maxZoom = map.getMaxZoom(),
        minZoom = map.getMinZoom(),
        /** @param {number} percent */
        percentToZoom = (percent) => minZoom + ((maxZoom - minZoom) * percent) / 100,
        /** @param {number} zoom */
        zoomToPercent = (zoom) => ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
    const zoomLabel = document.createElement("div");
    zoomLabel.className = "custom-zoom-slider-label";
    zoomLabel.textContent = "Zoom";

    const zoomSlider = document.createElement("input");
    zoomSlider.id = "zoom-slider-input";
    zoomSlider.type = "range";
    zoomSlider.min = "0";
    zoomSlider.max = "100";
    zoomSlider.step = "1";
    zoomSlider.value = String(Math.round(zoomToPercent(map.getZoom())));

    const values = document.createElement("div");
    values.className = "custom-zoom-slider-values";

    const minSpan = document.createElement("span");
    minSpan.id = "zoom-slider-min";
    minSpan.textContent = "0%";

    const maxSpan = document.createElement("span");
    maxSpan.id = "zoom-slider-max";
    maxSpan.textContent = "100%";

    const currentSpan = document.createElement("span");
    currentSpan.id = "zoom-slider-current";
    currentSpan.textContent = `${Math.round(zoomToPercent(map.getZoom()))}%`;

    const sep1 = document.createElement("span");
    sep1.className = "margin-horizontal";
    sep1.textContent = "|";

    const sep2 = document.createElement("span");
    sep2.className = "margin-horizontal";
    sep2.textContent = "|";

    values.append(minSpan, sep1, currentSpan, sep2, maxSpan);
    zoomSliderBar.append(zoomLabel, zoomSlider, values);

    const zoomSliderCurrent = /** @type {HTMLElement} */ (currentSpan);
    zoomSliderBar.style.pointerEvents = "auto";
    if (zoomSlider) {
        zoomSlider.style.pointerEvents = "auto";
        zoomSlider.addEventListener("mousedown", (e) => e.stopPropagation());
        zoomSlider.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    }

    // Fix jank: Only update map zoom on change, and update slider on zoomend.
    // Use a shared ref so document-level end events can reset dragging without leaking listeners.
    const zoomDraggingRef = { current: false };
    /** @type {any} */ (globalThis).__ffvMapZoomDraggingRef = zoomDraggingRef;
    // Debounce function to limit the frequency of updates
    /**
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    function debounce(func, wait) {
        /** @type {ReturnType<typeof setTimeout>} */
        let timeout;
        return /** @type {any} */ (
            function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            }
        );
    }
    if (zoomSlider && zoomSliderCurrent) {
        zoomSlider.addEventListener(
            "input",
            /** @type {EventListener} */ (
                debounce(
                    /** @param {Event} e */ (e) => {
                        zoomDraggingRef.current = true;
                        const { target } = /** @type {{ target: HTMLInputElement }} */ (e),
                            percent = Number(target.value);
                        zoomSliderCurrent.textContent = `${percent}%`;
                    },
                    100
                )
            ) // Adjust debounce delay as needed
        );
        zoomSlider.addEventListener("change", (e) => {
            const { target } = /** @type {{ target: HTMLInputElement }} */ (e),
                percent = Number(target.value),
                newZoom = percentToZoom(percent);
            map.setZoom(Math.round(newZoom));
            zoomDraggingRef.current = false;
        });
    }
    const updateZoomSlider = () => {
        if (!zoomDraggingRef.current && zoomSlider && zoomSliderCurrent) {
            const percent = Math.round(zoomToPercent(map.getZoom()));
            zoomSlider.value = String(percent);
            zoomSliderCurrent.textContent = `${percent}%`;
        }
    };
    map.on("zoomend zoomlevelschange", updateZoomSlider);
    updateZoomSlider();
    const leafletMapContainer = document.querySelector("#leaflet-map");
    if (leafletMapContainer) {
        leafletMapContainer.append(zoomSliderBar);
    }

    L.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(map);

    // --- Fullscreen control (if plugin loaded) ---
    if (L.control.fullscreen) {
        L.control.fullscreen({ position: "topleft" }).addTo(map);
    }

    // --- Locate user button ---
    if (L.control.locate) {
        L.control.locate({ flyTo: true, keepCurrentZoomLevel: true, position: "topleft" }).addTo(map);
    }

    // --- Print/export button ---
    const controlsDiv = document.querySelector("#map-controls");
    const primaryControls = controlsDiv?.querySelector(".map-controls-panel__primary") ?? controlsDiv;
    const ensureSecondaryControls = () => {
        if (!controlsDiv) {
            return null;
        }
        let secondary = controlsDiv.querySelector(".map-controls-panel__secondary");
        if (!secondary) {
            secondary = document.createElement("div");
            secondary.className = "map-controls-panel__secondary";
            controlsDiv.append(secondary);
        }
        return secondary;
    };

    /** @type {(HTMLElement & { refreshSummary?: () => void }) | undefined} */
    let filterControl;

    if (controlsDiv && primaryControls) {
        primaryControls.append(createPrintButton());
        primaryControls.append(createMapThemeToggle());
        primaryControls.append(createExportGPXButton());
        primaryControls.append(createElevationProfileButton());
        filterControl = createDataPointFilterControl(({ action }) => {
            if (windowExt.globalData && windowExt.globalData.recordMesgs) {
                mapDrawLapsWrapper("all");
            }
            if (typeof windowExt.updateShownFilesList === "function") {
                windowExt.updateShownFilesList();
            }
            console.log(`[renderMap] Map metric filter change handled, action=${action}`);
            if (filterControl && typeof filterControl.refreshSummary === "function") {
                scheduleMicrotask(() => {
                    try {
                        filterControl?.refreshSummary?.();
                    } catch {
                        /* ignore */
                    }
                });
            }
        });
        primaryControls.append(filterControl);

        // Estimated power (virtual power) settings
        const estPowerBtn = createPowerEstimationButton({
            getData: () => {
                const g = /** @type {any} */ (globalThis);
                const data = g.globalData && typeof g.globalData === "object" ? g.globalData : null;
                return {
                    loadedFitFiles: Array.isArray(g.loadedFitFiles) ? g.loadedFitFiles : [],
                    recordMesgs: Array.isArray(data?.recordMesgs) ? data.recordMesgs : [],
                    sessionMesgs: Array.isArray(data?.sessionMesgs) ? data.sessionMesgs : undefined,
                };
            },
            onAfterApply: () => {
                // Redraw map so tooltips/points pick up the updated estimated power values.
                mapDrawLapsWrapper("all");
                if (typeof windowExt.updateShownFilesList === "function") {
                    windowExt.updateShownFilesList();
                }
            },
        });

        try {
            const recs =
                windowExt.globalData && Array.isArray(windowExt.globalData.recordMesgs)
                    ? windowExt.globalData.recordMesgs
                    : [];
            if (hasPowerData(recs)) {
                estPowerBtn.title = "This file has real power data. Configure estimation defaults for other files.";
            }
        } catch {
            /* ignore */
        }

        primaryControls.append(estPowerBtn);
        primaryControls.append(
            createMarkerCountSelector(() => {
                // Redraw map with new marker count
                if (windowExt.globalData && windowExt.globalData.recordMesgs) {
                    mapDrawLapsWrapper("all");
                }
                if (windowExt.updateShownFilesList) {
                    windowExt.updateShownFilesList();
                }
            })
        );

        // Avoid duplicate measurement controls.
        // Prefer the Leaflet control (leaflet-measure-lite) when present; fall back to the simple
        // 2-click measure button only when the control plugin is unavailable.
        if (!(windowExt.L && L.control && L.control.measure)) {
            addSimpleMeasureTool(map, primaryControls);
        }
        primaryControls.append(createAddFitFileToMapButton());
        if (windowExt.loadedFitFiles && windowExt.loadedFitFiles.length > 1) {
            const shownFilesList = createShownFilesList();
            const secondaryControls = ensureSecondaryControls();
            if (secondaryControls) {
                secondaryControls.append(shownFilesList);
            }
            if (windowExt.updateShownFilesList) {
                windowExt.updateShownFilesList();
            }
        }
    }

    // --- Fullscreen button (custom, styled, top left) ---
    addFullscreenControl(map);

    // --- Custom icons for start/end ---
    const endIcon = createEndIcon(),
        startIcon = createStartIcon();

    // --- Marker cluster group (if available) ---
    /** @type {any} */
    const markerClusterGroup = null;
    // TEMPORARILY DISABLED FOR DEBUGGING - markers not showing
    // if (windowExt.L && L.markerClusterGroup) {
    //     markerClusterGroup = L.markerClusterGroup();
    //     map.addLayer(markerClusterGroup);
    // }

    // --- Lap selection UI (moved to mapLapSelector.js) ---
    /**
     * @param {any} lapIdx
     */
    function mapDrawLapsWrapper(lapIdx) {
        mapDrawLaps(lapIdx, {
            baseLayers,
            endIcon,
            formatTooltipData,
            getLapColor,
            getLapNumForIdx,
            map,
            mapContainer: /** @type {HTMLElement} */ (
                mapContainer || document.querySelector("#leaflet-map") || document.body
            ),
            markerClusterGroup,
            startIcon,
        });
        if (filterControl && typeof filterControl.refreshSummary === "function") {
            scheduleMicrotask(() => {
                try {
                    filterControl?.refreshSummary?.();
                } catch {
                    /* ignore */
                }
            });
        }
    }
    const leafletMapElement = document.querySelector("#leaflet-map");
    if (leafletMapElement) {
        addLapSelector(map, leafletMapElement, mapDrawLapsWrapper);
    }

    // --- Minimap (if plugin available) ---
    if (windowExt.L && L.Control && L.Control.MiniMap) {
        // Always use a standard tile layer for the minimap
        const miniMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "",
            maxZoom: 18,
            minZoom: 0,
        });
        const miniMap = new L.Control.MiniMap(miniMapLayer, {
            aimingRectOptions: {
                clickable: false,
                color: "#ff7800",
                fillColor: "#ff7800",
                fillOpacity: 0.1,
                opacity: 1,
                weight: 2,
            },
            autoToggleDisplay: false,
            centerFixed: false,
            height: 150,
            mapOptions: {
                attributionControl: false,
                zoomControl: false,
            },
            minimized: false,
            position: "bottomright",
            shadowRectOptions: {
                clickable: true,
                color: "#000000",
                fillColor: "#000000",
                fillOpacity: 0.2,
                opacity: 0.4,
                weight: 1,
            },
            toggleDisplay: true,
            width: 150,
            zoomAnimation: false,
            zoomLevelFixed: false,
            zoomLevelOffset: -5,
        });
        miniMap.addTo(map);
        windowExt._miniMapControl = miniMap;

        // Force minimap to update after a short delay to ensure proper rendering
        setTimeout(() => {
            if (miniMap._miniMap) {
                miniMap._miniMap.invalidateSize();
            }
        }, 100);

        // Keep minimap in sync when main map moves or zooms to prevent grey tiles
        map.on("moveend", () => {
            if (miniMap._miniMap) {
                miniMap._miniMap.invalidateSize();
            }
        });

        map.on("zoomend", () => {
            if (miniMap._miniMap) {
                miniMap._miniMap.invalidateSize();
            }
        });
    }

    // --- Measurement tool (if plugin available) ---
    if (windowExt.L && L.control && L.control.measure) {
        const measureControl = L.control.measure({
            activeColor: "#ff7800",
            captureZIndex: 10_000,
            clearMeasurementsOnStop: false,
            completedColor: "#1976d2",
            decPoint: ".",
            popupOptions: {
                autoPanPadding: [10, 10],
                className: "leaflet-measure-resultpopup",
            },
            position: "topleft",
            primaryAreaUnit: "sqmeters",
            primaryLengthUnit: "meters",
            secondaryAreaUnit: "acres",
            secondaryLengthUnit: "miles",
            thousandsSep: ",",
        });
        measureControl.addTo(map);
        windowExt._measureControl = measureControl;

        // Clear measurements when starting a new measurement
        map.on("measurestart", () => {
            // Clear previous completed measurements when starting new one
            if (measureControl._measurementRunningTotal) {
                measureControl._measurementRunningTotal = 0;
            }
        });
    }

    // --- Drawing/editing tool (if plugin available) ---
    if (windowExt.L && L.Control && L.Control.Draw) {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        const drawControl = new L.Control.Draw({
            draw: {
                circle: {
                    shapeOptions: {
                        clickable: true,
                        color: "#1976d2",
                    },
                },
                marker: true,
                polygon: {
                    allowIntersection: false,
                    shapeOptions: {
                        clickable: true,
                        color: "#1976d2",
                    },
                },
                polyline: {
                    shapeOptions: {
                        clickable: true,
                        color: "#1976d2",
                    },
                },
                rectangle: {
                    shapeOptions: {
                        clickable: true,
                        color: "#1976d2",
                    },
                },
            },
            edit: {
                edit: true,
                featureGroup: drawnItems,
                remove: true,
            },
        });
        map.addControl(drawControl);
        windowExt._drawControl = drawControl;

        // Add drawn shapes to the layer so they persist
        map.on(L.Draw.Event.CREATED, (/** @type {any} */ e) => {
            const { layer } = e;
            drawnItems.addLayer(layer);
        });

        // Store reference to drawn items for persistence
        windowExt._drawnItems = drawnItems;

        // Restore previously drawn items
        if (savedDrawnLayers && savedDrawnLayers.length > 0) {
            console.log("[renderMap] Restoring", savedDrawnLayers.length, "drawn items");
            for (const item of savedDrawnLayers) {
                try {
                    if (item.geoJSON) {
                        L.geoJSON(item.geoJSON, {
                            onEachFeature: (/** @type {any} */ _feature, /** @type {any} */ createdLayer) => {
                                drawnItems.addLayer(createdLayer);
                            },
                            pointToLayer: (/** @type {any} */ _feature, /** @type {any} */ latlng) => L.marker(latlng),
                            style: item.options,
                        });
                    }
                } catch (error) {
                    console.warn("[renderMap] Failed to restore drawn item:", error);
                }
            }
        }
    }

    // --- Overlay logic ---
    // Apply estimated power before drawing any tracks/markers so tooltips have access.
    // Only applies to files without real power.
    try {
        if (windowExt.globalData && Array.isArray(windowExt.globalData.recordMesgs)) {
            applyEstimatedPowerToRecords({
                recordMesgs: /** @type {Array<Record<string, unknown>>} */ (windowExt.globalData.recordMesgs),
                sessionMesgs: Array.isArray(windowExt.globalData.sessionMesgs)
                    ? /** @type {Array<Record<string, unknown>>} */ (windowExt.globalData.sessionMesgs)
                    : undefined,
                settings: getPowerEstimationSettings(),
            });
        }
        if (Array.isArray(windowExt.loadedFitFiles)) {
            for (const fitFile of windowExt.loadedFitFiles) {
                const recs =
                    fitFile && fitFile.data && Array.isArray(fitFile.data.recordMesgs)
                        ? fitFile.data.recordMesgs
                        : null;
                if (recs) {
                    applyEstimatedPowerToRecords({
                        recordMesgs: /** @type {Array<Record<string, unknown>>} */ (recs),
                        sessionMesgs:
                            fitFile && fitFile.data && Array.isArray(fitFile.data.sessionMesgs)
                                ? /** @type {Array<Record<string, unknown>>} */ (fitFile.data.sessionMesgs)
                                : undefined,
                        settings: getPowerEstimationSettings(),
                    });
                }
            }
        }
    } catch {
        /* ignore */
    }

    if (windowExt.loadedFitFiles && Array.isArray(windowExt.loadedFitFiles) && windowExt.loadedFitFiles.length > 0) {
        console.log("[renderMap] Overlay logic: loadedFitFiles.length =", windowExt.loadedFitFiles.length);
        // Clear overlay polylines tracking before drawing
        windowExt._overlayPolylines = {};
        for (const [idx, fitFile] of windowExt.loadedFitFiles.entries()) {
            // Skip index 0 (main file) here to avoid duplicating the main track as an overlay
            if (idx === 0) {
                continue;
            }
            console.log(`[renderMap] Drawing overlay idx=${idx}, fileName=`, fitFile.filePath);
            const color = /** @type {string} */ (
                chartOverlayColorPalette[idx % chartOverlayColorPalette.length] || "#ff0000"
            );
            const rawOverlayName = (fitFile.filePath || "").split(/[/\\]/).pop() ?? "";
            const fileName = sanitizeFilenameComponent(rawOverlayName, `overlay_${idx + 1}`);
            const bounds = drawOverlayForFitFile({
                color,
                endIcon,
                fileName,
                fitData: fitFile.data,
                formatTooltipData: (/** @type {any} */ pointIdx, /** @type {any} */ row, /** @type {any} */ lapNum) =>
                    formatTooltipData(pointIdx, row, lapNum, fitFile.data && fitFile.data.recordMesgs),
                getLapNumForIdx,
                map,
                markerClusterGroup,
                overlayIdx: idx,
                startIcon,
            });
            console.log(`[renderMap] Overlay idx=${idx} bounds:`, bounds);
        }
        // --- Bring overlay markers to front so they appear above all polylines ---
        setTimeout(() => {
            if (windowExt._overlayPolylines) {
                for (const [idx, polyline] of Object.entries(windowExt._overlayPolylines)) {
                    console.log(`[renderMap] Bring to front: overlay idx=${idx}, polyline=`, polyline);
                    if (polyline && polyline._map && polyline._map && polyline._map._layers) {
                        for (const layer of Object.values(polyline._map._layers)) {
                            if (
                                layer instanceof L.CircleMarker &&
                                layer.options &&
                                polyline.options &&
                                layer.options.color === polyline.options.color &&
                                layer.bringToFront
                            ) {
                                layer.bringToFront();
                            }
                        }
                    }
                }
            }
        }, 10);
        console.log("[renderMap] Overlay logic complete. No fitBounds/zoom called here.");
        // --- Always call mapDrawLapsWrapper('all') to ensure correct zoom/fitBounds logic ---
        mapDrawLapsWrapper("all");
    } else if (windowExt.globalData && windowExt.globalData.recordMesgs) {
        console.log('[renderMap] No overlays, calling mapDrawLapsWrapper("all")');
        mapDrawLapsWrapper("all");
    }

    // Restore highlight after overlays are drawn, if any
    if (windowExt.updateOverlayHighlights) {
        console.log(
            "[FFV] [renderMap] Calling updateOverlayHighlights, highlightedOverlayIdx:",
            windowExt._highlightedOverlayIdx
        );
        windowExt.updateOverlayHighlights();
    }
    if (windowExt.updateShownFilesList) {
        console.log("[FFV] [renderMap] Calling updateShownFilesList after overlays drawn");
        windowExt.updateShownFilesList();
        if (windowExt.setupOverlayFileNameMapActions) {
            console.log("[FFV] [renderMap] Calling setupOverlayFileNameMapActions after updateShownFilesList");
            windowExt.setupOverlayFileNameMapActions();
            if (windowExt.setupActiveFileNameMapActions) {
                console.log("[FFV] [renderMap] Calling setupActiveFileNameMapActions after overlays drawn");
                windowExt.setupActiveFileNameMapActions();
            }
        }
    }
    // Enable/disable lap selector based on number of loaded files
    function updateLapSelectorEnabledState() {
        const lapSelect = /** @type {HTMLSelectElement} */ (document.querySelector("#lap-select"));
        if (!lapSelect) return;
        // Keep lap selector enabled. Optionally disable only if there are no laps available.
        try {
            const laps = /** @type {any} */ (windowExt.globalData && windowExt.globalData.lapMesgs);
            lapSelect.disabled = !laps || !Array.isArray(laps) || laps.length === 0 ? false : false;
        } catch {
            lapSelect.disabled = false;
        }
    }
    updateLapSelectorEnabledState();

    // --- Theme support (dark/light) ---
    if (document.querySelector("#leaflet-map")) {
        installUpdateMapThemeListeners();
        updateMapTheme();
    }
}

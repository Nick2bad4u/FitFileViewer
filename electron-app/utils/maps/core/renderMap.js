import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import {
    applyEstimatedPowerToRecords,
    hasPowerData,
} from "../../data/processing/estimateCyclingPower.js";
import { getLapNumForIdx } from "../../data/processing/getLapNumForIdx.js";
import { getPowerEstimationSettings } from "../../data/processing/powerEstimationSettings.js";
import { createExportGPXButton } from "../../files/export/createExportGPXButton.js";
import { createPrintButton } from "../../files/export/createPrintButton.js";
import { sanitizeFilenameComponent } from "../../files/sanitizeFilename.js";
import { formatTooltipData } from "../../formatting/display/formatTooltipData.js";
import { createShownFilesList } from "../../rendering/components/createShownFilesList.js";
import { getState, setState } from "../../state/core/stateManager.js";
import {
    installUpdateMapThemeListeners,
    updateMapTheme,
} from "../../theming/specific/updateMapTheme.js";
import { createAddFitFileToMapButton } from "../../ui/controls/createAddFitFileToMapButton.js";
import { createDataPointFilterControl } from "../../ui/controls/createDataPointFilterControl.js";
import { createElevationProfileButton } from "../../ui/controls/createElevationProfileButton.js";
import { createMarkerCountSelector } from "../../ui/controls/createMarkerCountSelector.js";
import { createPowerEstimationButton } from "../../ui/controls/createPowerEstimationButton.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { createMapThemeToggle } from "../controls/mapActionButtons.js";
import { addFullscreenControl } from "../controls/mapFullscreenControl.js";
import { addLapSelector } from "../controls/mapLapSelector.js";
import { addSimpleMeasureTool } from "../controls/mapMeasureTool.js";
import { baseLayers } from "../layers/mapBaseLayers.js";
import { drawOverlayForFitFile, mapDrawLaps } from "../layers/mapDrawLaps.js";
import { createEndIcon, createStartIcon } from "../layers/mapIcons.js";
import { getLapColor } from "./mapColors.js";
import { ensureMapDocumentListenersInstalled } from "./mapDocumentListeners.js";
function isDrawnLayer(layer) {
    return typeof layer === "object" && layer !== null;
}
/**
 * Render the activity map, controls, overlays, and Leaflet plugin integrations.
 */
export function renderMap() {
    // Reset overlay polylines to prevent stale references and memory leaks
    const windowExt = globalThis;
    const LeafletLib = windowExt.L;
    if (!LeafletLib) {
        console.warn(
            "[renderMap] Leaflet library unavailable; skipping map render."
        );
        return;
    }
    const L = LeafletLib;
    windowExt._overlayPolylines = {};
    windowExt.__ffvRenderMapAbortController?.abort();
    const renderAbortController = new AbortController();
    windowExt.__ffvRenderMapAbortController = renderAbortController;
    const listenerOptions = {
        signal: renderAbortController.signal,
    };
    const cleanupTimers = new Set();
    const setCleanupTimeout = (callback, delay) => {
        const timeout = setTimeout(() => {
            cleanupTimers.delete(timeout);
            callback();
        }, delay);
        cleanupTimers.add(timeout);
        return timeout;
    };
    renderAbortController.signal.onabort = () => {
        for (const timeout of cleanupTimers) {
            clearTimeout(timeout);
        }
        cleanupTimers.clear();
    };
    const scheduleMicrotask =
        typeof queueMicrotask === "function"
            ? queueMicrotask
            : (callback) => Promise.resolve().then(callback);
    const mapContainer = querySelectorByIdFlexible(document, "#content_map");
    if (!mapContainer) {
        return;
    }
    // Defensive cleanup: overlay filename tooltips are appended to document.body and can become orphaned
    // if the overlay list or map is re-rendered while a tooltip is visible.
    try {
        for (const el of document.querySelectorAll(
            ".overlay-filename-tooltip"
        )) {
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
            const drawnLayers = windowExt._drawnItems
                .getLayers()
                .filter(isDrawnLayer);
            savedDrawnLayers = drawnLayers
                .map((layer) => {
                    const geoJSON =
                        typeof layer.toGeoJSON === "function"
                            ? layer.toGeoJSON()
                            : null;
                    return {
                        geoJSON,
                        options: layer.options ?? {},
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
                    };
                })
                .filter((item) => item.geoJSON !== null);
            console.log(
                "[renderMap] Saved",
                savedDrawnLayers.length,
                "drawn items"
            );
        } catch (error) {
            console.warn("[renderMap] Failed to save drawn items:", error);
        }
    }
    // Cleanup old plugin controls/references to avoid retaining old map instances via control closures.
    // Leaflet's map.remove() should handle most cleanup, but plugins occasionally attach document listeners.
    try {
        if (
            windowExt._measureControl &&
            typeof windowExt._measureControl.remove === "function"
        ) {
            windowExt._measureControl.remove();
        }
    } catch {
        /* ignore */
    }
    windowExt._measureControl = null;
    try {
        if (
            windowExt._drawControl &&
            typeof windowExt._drawControl.remove === "function"
        ) {
            windowExt._drawControl.remove();
        }
    } catch {
        /* ignore */
    }
    windowExt._drawControl = null;
    // Clear old drawnItems reference now that we've snapshot the geoJSON.
    windowExt._drawnItems = null;
    try {
        if (
            windowExt._miniMapControl &&
            typeof windowExt._miniMapControl.remove === "function"
        ) {
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
        const oldShownFilesList =
            mapContainer.querySelector(".shown-files-list");
        if (
            oldShownFilesList &&
            typeof oldShownFilesList._dispose === "function"
        ) {
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
    // Full basemap catalogue with friendly display labels.
    // We keep persistence values as internal baseLayers keys, but display better labels.
    const formatBaseLayerLabel = (key) => {
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
    const layerEntries = Object.keys(baseLayers)
        .filter((k) => Object.hasOwn(baseLayers, k))
        .map((k) => ({
            key: k,
            label: formatBaseLayerLabel(k),
        }));
    // Ensure labels are unique for the Leaflet layers control.
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
        return a.label.localeCompare(b.label, undefined, {
            numeric: true,
            sensitivity: "base",
        });
    });
    const labelToKey = new Map(layerEntries.map((e) => [e.label, e.key]));
    // Resolve persisted values to a valid baseLayers key. Supports current keys,
    // legacy lower-cased ids, and UI labels from older persisted settings.
    const resolveBaseLayerKey = (value) => {
        const trimmed = typeof value === "string" ? value.trim() : "";
        if (!trimmed) return "OpenStreetMap";
        const byLabel = labelToKey.get(trimmed);
        if (byLabel) return byLabel;
        if (Object.hasOwn(baseLayers, trimmed)) {
            return trimmed;
        }
        const lower = trimmed.toLowerCase();
        if (lower === "openstreetmap" || lower === "osm" || lower === "mapnik")
            return "OpenStreetMap";
        if (lower === "topo" || lower === "opentopo" || lower === "opentopomap")
            return "OpenTopoMap";
        if (lower === "satellite" || lower === "worldimagery")
            return "Esri_WorldImagery";
        if (
            lower === "osm_de" ||
            lower === "osmde" ||
            lower === "openstreetmap.de"
        )
            return "OSM_DE";
        const found = Object.keys(baseLayers).find(
            (k) => k.toLowerCase() === lower
        );
        return found ?? "OpenStreetMap";
    };
    // Build the final list for the Leaflet layers control.
    // This intentionally includes the full catalogue; layoutLayersControl() will constrain it.
    const baseLayersForControl = Object.fromEntries(
        layerEntries
            .map((entry) => [entry.label, baseLayers[entry.key]])
            .filter((entry) => Boolean(entry[1]))
    );
    const persistedBaseLayerKey = resolveBaseLayerKey(
        getState("map.baseLayer")
    );
    const initialBaseLayer =
        baseLayers[persistedBaseLayerKey] ?? baseLayers["OpenStreetMap"];
    if (!initialBaseLayer) {
        console.warn("[renderMap] No valid Leaflet base layer available.");
        return;
    }
    const map = LeafletLib.map("leaflet-map", {
        center: [0, 0],
        fullscreenControl: true,
        layers: [initialBaseLayer],
        zoom: 2,
    });
    windowExt._leafletMapInstance = map;
    LeafletLib.control
        .layers(baseLayersForControl, undefined, {
            collapsed: true,
            position: "topright",
        })
        .addTo(map);
    // Persist basemap selection so it is restored next launch.
    map.on("baselayerchange", (event) => {
        try {
            const name =
                event &&
                typeof event === "object" &&
                typeof event.name === "string"
                    ? event.name.trim()
                    : "";
            if (!name) return;
            const resolvedKey = labelToKey.get(name);
            if (!resolvedKey) {
                return;
            }
            setState("map.baseLayer", resolvedKey, {
                source: "renderMap.baselayerchange",
            });
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
    mapTypeBtn.addEventListener(
        "click",
        handleMapTypeButtonClick,
        listenerOptions
    );
    const leafletMapDiv2 = document.querySelector("#leaflet-map");
    if (leafletMapDiv2) {
        leafletMapDiv2.append(mapTypeBtn);
    }
    // Update global reference for the map type button used by the shared document listener.
    windowExt.__ffvMapTypeButton = mapTypeBtn;
    windowExt.__ffvLayoutLayersControl = () =>
        layoutLayersControl({ layersControlEl: null });
    ensureMapDocumentListenersInstalled();
    function getLayersControlEl() {
        const el = document.querySelector(".leaflet-control-layers");
        return el instanceof HTMLElement ? el : null;
    }
    function openLayersControl(options = {}) {
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        layersControlEl.classList.add("leaflet-control-layers-expanded");
        layersControlEl.style.zIndex = "10025"; // Just below the button
        layoutLayersControl({ layersControlEl });
        if (options.focusFirst) {
            const firstInput = layersControlEl.querySelector(
                'input[type="radio"]'
            );
            if (firstInput) {
                firstInput.focus();
            }
        }
    }
    function closeLayersControl() {
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        const layersListEl = layersControlEl.querySelector(
            ".leaflet-control-layers-list"
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
        const isExpanded = layersControlEl.classList.contains(
            "leaflet-control-layers-expanded"
        );
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
        let openTimer = null;
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
            openTimer = setCleanupTimeout(() => {
                openLayersControl();
                openTimer = null;
            }, HOVER_OPEN_DELAY_MS);
        };
        const scheduleClose = () => {
            clearOpenTimer();
            clearCloseTimer();
            closeTimer = setCleanupTimeout(() => {
                closeLayersControl();
                closeTimer = null;
            }, HOVER_CLOSE_DELAY_MS);
        };
        const cancelClose = () => {
            clearCloseTimer();
        };
        mapTypeBtn.addEventListener(
            "mouseenter",
            scheduleOpen,
            listenerOptions
        );
        mapTypeBtn.addEventListener(
            "mouseleave",
            scheduleClose,
            listenerOptions
        );
        mapTypeBtn.addEventListener(
            "focus",
            () => openLayersControl({ focusFirst: true }),
            listenerOptions
        );
        mapTypeBtn.addEventListener("blur", scheduleClose, listenerOptions);
        // Keep open while hovering the expanded panel.
        const layersControlEl = getLayersControlEl();
        if (layersControlEl) {
            layersControlEl.addEventListener(
                "mouseenter",
                cancelClose,
                listenerOptions
            );
            layersControlEl.addEventListener(
                "mouseleave",
                scheduleClose,
                listenerOptions
            );
        }
    }
    // Constrain the expanded basemap selector so it never overlaps critical UI.
    // The control is pushed below the Map style button and constrained above
    // the minimap when present.
    function layoutLayersControl({ layersControlEl }) {
        const layersEl =
            layersControlEl ||
            document.querySelector(".leaflet-control-layers");
        const mapEl = document.getElementById("leaflet-map");
        if (!layersEl || !(layersEl instanceof HTMLElement) || !mapEl) {
            return;
        }
        const layersListEl = layersEl.querySelector(
            ".leaflet-control-layers-list"
        );
        // Keep a global ref so the shared document listeners can re-run layout on resize.
        windowExt.__ffvLayoutLayersControl = () =>
            layoutLayersControl({ layersControlEl: layersEl });
        // Only apply layout rules when the panel is expanded.
        if (!layersEl.classList.contains("leaflet-control-layers-expanded")) {
            return;
        }
        const mapTypeRect = mapTypeBtn.getBoundingClientRect();
        const mapRect = mapEl.getBoundingClientRect();
        const minimapEl = document.querySelector(".leaflet-control-minimap");
        const minimapRect =
            minimapEl instanceof HTMLElement
                ? minimapEl.getBoundingClientRect()
                : null;
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
                : (cb) => setTimeout(cb, 0);
        // Use RAF so we measure after Leaflet expanded class applies.
        raf(() => {
            const layersRect = layersEl.getBoundingClientRect();
            // Compute a conservative bottom bound (extra padding prevents scrollbar being clipped
            // by the Leaflet container's overflow + border radius).
            const EDGE_PADDING_PX = 28;
            const mapBottomLimit = mapRect.bottom - EDGE_PADDING_PX;
            const minimapTopLimit = minimapRect
                ? minimapRect.top - EDGE_PADDING_PX
                : mapBottomLimit;
            const bottomLimit = Math.min(mapBottomLimit, minimapTopLimit);
            // Push down to avoid overlapping the map-type button, but never push so far down
            // that the panel cannot fit within the available space.
            const desiredPushDown = Math.max(
                0,
                Math.round(
                    mapTypeRect.bottom - layersRect.top + EDGE_PADDING_PX
                )
            );
            const minUsableHeight = 160;
            const maxAllowedPushDown = Math.max(
                0,
                Math.floor(bottomLimit - layersRect.top - minUsableHeight)
            );
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
                    const chromeHeight = Math.max(
                        0,
                        Math.floor(updatedRect.height - listRect.height)
                    );
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
        percentToZoom = (percent) =>
            minZoom + ((maxZoom - minZoom) * percent) / 100,
        zoomToPercent = (zoom) =>
            ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
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
    const zoomSliderCurrent = currentSpan;
    zoomSliderBar.style.pointerEvents = "auto";
    if (zoomSlider) {
        zoomSlider.style.pointerEvents = "auto";
        zoomSlider.addEventListener(
            "mousedown",
            (e) => e.stopPropagation(),
            listenerOptions
        );
        zoomSlider.addEventListener("touchstart", (e) => e.stopPropagation(), {
            passive: true,
            signal: renderAbortController.signal,
        });
    }
    // Fix jank: Only update map zoom on change, and update slider on zoomend.
    // Use a shared ref so document-level end events can reset dragging without leaking listeners.
    const zoomDraggingRef = { current: false };
    windowExt.__ffvMapZoomDraggingRef = zoomDraggingRef;
    // Debounce function to limit the frequency of updates
    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    if (zoomSlider && zoomSliderCurrent) {
        zoomSlider.addEventListener(
            "input",
            debounce((e) => {
                zoomDraggingRef.current = true;
                const target = e.target;
                if (!(target instanceof HTMLInputElement)) {
                    return;
                }
                const percent = Number(target.value);
                zoomSliderCurrent.textContent = `${percent}%`;
            }, 100), // Adjust debounce delay as needed
            listenerOptions
        );
        zoomSlider.addEventListener(
            "change",
            (e) => {
                const target = e.target;
                if (!(target instanceof HTMLInputElement)) {
                    return;
                }
                const percent = Number(target.value),
                    newZoom = percentToZoom(percent);
                map.setZoom(Math.round(newZoom));
                zoomDraggingRef.current = false;
            },
            listenerOptions
        );
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
    const leafletMapContainer = querySelectorByIdFlexible(
        document,
        "#leaflet-map"
    );
    if (leafletMapContainer) {
        leafletMapContainer.append(zoomSliderBar);
    }
    L.control
        .scale({ imperial: true, metric: true, position: "bottomleft" })
        .addTo(map);
    // --- Fullscreen control (if plugin loaded) ---
    if (L.control.fullscreen) {
        L.control.fullscreen({ position: "topleft" }).addTo?.(map);
    }
    // --- Locate user button ---
    if (L.control.locate) {
        L.control
            .locate({
                flyTo: true,
                keepCurrentZoomLevel: true,
                position: "topleft",
            })
            .addTo?.(map);
    }
    // --- Print/export button ---
    const controlsDiv = document.querySelector("#map-controls");
    const primaryControls =
        controlsDiv?.querySelector(".map-controls-panel__primary") ??
        controlsDiv;
    const ensureSecondaryControls = () => {
        if (!controlsDiv) {
            return null;
        }
        let secondary = controlsDiv.querySelector(
            ".map-controls-panel__secondary"
        );
        if (!secondary) {
            secondary = document.createElement("div");
            secondary.className = "map-controls-panel__secondary";
            controlsDiv.append(secondary);
        }
        return secondary;
    };
    let filterControl;
    const resetLapSelectorSelection = () => {
        const lapSelect = document.querySelector("#lap-select");
        if (!(lapSelect instanceof HTMLSelectElement)) {
            return false;
        }
        if (lapSelect.value === "all") {
            return false;
        }
        lapSelect.selectedIndex = 0;
        lapSelect.dispatchEvent(new Event("change"));
        return true;
    };
    if (controlsDiv && primaryControls) {
        primaryControls.append(createPrintButton());
        primaryControls.append(createMapThemeToggle());
        primaryControls.append(createExportGPXButton());
        primaryControls.append(createElevationProfileButton());
        filterControl = createDataPointFilterControl(({ action }) => {
            const didReset = resetLapSelectorSelection();
            if (
                !didReset &&
                windowExt.globalData &&
                windowExt.globalData.recordMesgs
            ) {
                mapDrawLapsWrapper("all");
            }
            if (typeof windowExt.updateShownFilesList === "function") {
                windowExt.updateShownFilesList();
            }
            console.log(
                `[renderMap] Map metric filter change handled, action=${action}`
            );
            if (
                filterControl &&
                typeof filterControl.refreshSummary === "function"
            ) {
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
                const data =
                    windowExt.globalData &&
                    typeof windowExt.globalData === "object"
                        ? windowExt.globalData
                        : null;
                const fitData = {
                    loadedFitFiles: Array.isArray(windowExt.loadedFitFiles)
                        ? windowExt.loadedFitFiles
                        : [],
                    recordMesgs: Array.isArray(data?.recordMesgs)
                        ? data.recordMesgs
                        : [],
                };
                return Array.isArray(data?.sessionMesgs)
                    ? { ...fitData, sessionMesgs: data.sessionMesgs }
                    : fitData;
            },
            onAfterApply: () => {
                // Redraw map so tooltips/points pick up the updated estimated power values.
                mapDrawLapsWrapper("all");
                if (typeof windowExt.updateShownFilesList === "function") {
                    windowExt.updateShownFilesList();
                }
                // Estimated power changes are data-changing for charts/summary/tables.
                // Invalidate chart caches so the new series is recalculated.
                try {
                    if (
                        typeof windowExt["invalidateChartRenderCache"] ===
                        "function"
                    ) {
                        windowExt["invalidateChartRenderCache"](
                            "estimated-power-updated"
                        );
                    }
                } catch {
                    /* ignore */
                }
                try {
                    if (typeof windowExt.renderChartJS === "function") {
                        windowExt.renderChartJS();
                    }
                } catch {
                    /* ignore */
                }
                try {
                    if (
                        typeof windowExt.renderSummary === "function" &&
                        windowExt.globalData
                    ) {
                        windowExt.renderSummary(windowExt.globalData);
                    }
                } catch {
                    /* ignore */
                }
                try {
                    if (
                        typeof windowExt.createTables === "function" &&
                        windowExt.globalData
                    ) {
                        windowExt.createTables(windowExt.globalData);
                    }
                } catch {
                    /* ignore */
                }
            },
        });
        try {
            const recs =
                windowExt.globalData &&
                Array.isArray(windowExt.globalData.recordMesgs)
                    ? windowExt.globalData.recordMesgs
                    : [];
            if (hasPowerData(recs)) {
                estPowerBtn.title =
                    "This file has real power data. Configure estimation defaults for other files.";
            }
        } catch {
            /* ignore */
        }
        primaryControls.append(estPowerBtn);
        primaryControls.append(
            createMarkerCountSelector(() => {
                // Redraw map with new marker count
                const didReset = resetLapSelectorSelection();
                if (
                    !didReset &&
                    windowExt.globalData &&
                    windowExt.globalData.recordMesgs
                ) {
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
        if (!windowExt.L || !L.control || !L.control.measure) {
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
    const markerClusterGroup = null;
    // TEMPORARILY DISABLED FOR DEBUGGING - markers not showing
    // if (windowExt.L && L.markerClusterGroup) {
    //     markerClusterGroup = L.markerClusterGroup();
    //     map.addLayer(markerClusterGroup);
    // }
    // --- Lap selection UI (moved to mapLapSelector.js) ---
    function mapDrawLapsWrapper(lapIdx) {
        mapDrawLaps(lapIdx, {
            baseLayers,
            endIcon,
            formatTooltipData,
            getLapColor,
            getLapNumForIdx,
            map,
            mapContainer:
                mapContainer ||
                document.querySelector("#leaflet-map") ||
                document.body,
            markerClusterGroup,
            startIcon,
        });
        if (
            filterControl &&
            typeof filterControl.refreshSummary === "function"
        ) {
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
        const miniMapLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "",
                maxZoom: 18,
                minZoom: 0,
            }
        );
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
        miniMap.addTo?.(map);
        windowExt._miniMapControl = miniMap;
        // Force minimap to update after a short delay to ensure proper rendering
        setCleanupTimeout(() => {
            if (miniMap._miniMap?.invalidateSize) {
                miniMap._miniMap.invalidateSize();
            }
        }, 100);
        // Keep minimap in sync when main map moves or zooms to prevent grey tiles
        map.on("moveend", () => {
            if (miniMap._miniMap?.invalidateSize) {
                miniMap._miniMap.invalidateSize();
            }
        });
        map.on("zoomend", () => {
            if (miniMap._miniMap?.invalidateSize) {
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
        measureControl.addTo?.(map);
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
                    // Prefer imperial units so distances match the rest of the app (miles).
                    // Leaflet.draw will still display metric when appropriate internally.
                    feet: true,
                    metric: false,
                    shapeOptions: {
                        clickable: true,
                        color: "#1976d2",
                    },
                },
                polyline: {
                    // Prefer imperial units so distances match the rest of the app (miles).
                    feet: true,
                    metric: false,
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
        // Add drawn shapes to the layer so they persist.
        // Register exactly once (L.Draw.Event.CREATED is typically "draw:created").
        const onDrawCreated = (event) => {
            const layer = event.layer;
            if (layer) {
                drawnItems.addLayer(layer);
            }
        };
        {
            const createdEventName =
                L.Draw &&
                L.Draw.Event &&
                typeof L.Draw.Event.CREATED === "string"
                    ? L.Draw.Event.CREATED
                    : "draw:created";
            map.on(createdEventName, onDrawCreated);
        }
        // UX fix: Leaflet.draw's tooltip says "Click last point to finish line", but in practice
        // the click target (vertex marker) is tiny. If the user clicks *near* the last point, we
        // proactively finish the line so the workflow matches the tooltip.
        {
            let activeHandler = null;
            let preclickListener;
            const detach = () => {
                try {
                    if (preclickListener) {
                        map.off("preclick", preclickListener);
                    }
                } catch {
                    /* ignore */
                }
                activeHandler = null;
                preclickListener = undefined;
            };
            map.on("draw:drawstart", (evt) => {
                try {
                    const type =
                        evt && typeof evt === "object" ? evt.layerType : null;
                    if (type !== "polyline") {
                        detach();
                        return;
                    }
                    // Leaflet.draw stores the active mode handler here.
                    activeHandler =
                        drawControl?._toolbars?.draw?._activeMode?.handler ??
                        null;
                    preclickListener = (event) => {
                        try {
                            const e = event;
                            if (
                                !activeHandler ||
                                typeof activeHandler["_finishShape"] !==
                                    "function"
                            ) {
                                return;
                            }
                            const markers = Array.isArray(
                                activeHandler["_markers"]
                            )
                                ? activeHandler["_markers"]
                                : [];
                            if (markers.length < 2) {
                                return;
                            }
                            const lastMarker = markers.at(-1);
                            if (
                                !lastMarker ||
                                typeof lastMarker.getLatLng !== "function" ||
                                !e.latlng
                            ) {
                                return;
                            }
                            // Pixel tolerance around the vertex marker.
                            const tolPx = 14;
                            const lastPt = map.latLngToContainerPoint(
                                lastMarker.getLatLng()
                            );
                            const clickPt = map.latLngToContainerPoint(
                                e.latlng
                            );
                            const dist =
                                lastPt &&
                                clickPt &&
                                typeof lastPt.distanceTo === "function"
                                    ? lastPt.distanceTo(clickPt)
                                    : null;
                            if (
                                typeof dist === "number" &&
                                dist >= 0 &&
                                dist <= tolPx
                            ) {
                                // Finish and stop the underlying click from adding another vertex.
                                try {
                                    if (e.originalEvent) {
                                        e.originalEvent.preventDefault?.();
                                        e.originalEvent.stopPropagation?.();
                                    }
                                } catch {
                                    /* ignore */
                                }
                                activeHandler["_finishShape"]();
                            }
                        } catch {
                            /* ignore */
                        }
                    };
                    map.off("preclick", preclickListener);
                    map.on("preclick", preclickListener);
                } catch {
                    /* ignore */
                }
            });
            map.on("draw:drawstop", detach);
        }
        // Store reference to drawn items for persistence
        windowExt._drawnItems = drawnItems;
        // Restore previously drawn items
        if (savedDrawnLayers && savedDrawnLayers.length > 0) {
            console.log(
                "[renderMap] Restoring",
                savedDrawnLayers.length,
                "drawn items"
            );
            for (const item of savedDrawnLayers) {
                try {
                    if (item.geoJSON) {
                        L.geoJSON(item.geoJSON, {
                            onEachFeature: (_feature, createdLayer) => {
                                drawnItems.addLayer(createdLayer);
                            },
                            pointToLayer: (_feature, latlng) =>
                                L.marker(latlng),
                            style: item.options,
                        });
                    }
                } catch (error) {
                    console.warn(
                        "[renderMap] Failed to restore drawn item:",
                        error
                    );
                }
            }
        }
    }
    // --- Overlay logic ---
    // Apply estimated power before drawing any tracks/markers so tooltips have access.
    // Only applies to files without real power.
    try {
        if (
            windowExt.globalData &&
            Array.isArray(windowExt.globalData.recordMesgs)
        ) {
            const sessionMesgs = Array.isArray(
                windowExt.globalData.sessionMesgs
            )
                ? windowExt.globalData.sessionMesgs
                : undefined;
            applyEstimatedPowerToRecords(
                sessionMesgs === undefined
                    ? {
                          recordMesgs: windowExt.globalData.recordMesgs,
                          settings: getPowerEstimationSettings(),
                      }
                    : {
                          recordMesgs: windowExt.globalData.recordMesgs,
                          sessionMesgs,
                          settings: getPowerEstimationSettings(),
                      }
            );
        }
        if (Array.isArray(windowExt.loadedFitFiles)) {
            for (const fitFile of windowExt.loadedFitFiles) {
                const recs =
                    fitFile &&
                    fitFile.data &&
                    Array.isArray(fitFile.data.recordMesgs)
                        ? fitFile.data.recordMesgs
                        : null;
                if (recs) {
                    const sessionMesgs =
                        fitFile &&
                        fitFile.data &&
                        Array.isArray(fitFile.data.sessionMesgs)
                            ? fitFile.data.sessionMesgs
                            : undefined;
                    applyEstimatedPowerToRecords(
                        sessionMesgs === undefined
                            ? {
                                  recordMesgs: recs,
                                  settings: getPowerEstimationSettings(),
                              }
                            : {
                                  recordMesgs: recs,
                                  sessionMesgs,
                                  settings: getPowerEstimationSettings(),
                              }
                    );
                }
            }
        }
    } catch {
        /* ignore */
    }
    if (
        windowExt.loadedFitFiles &&
        Array.isArray(windowExt.loadedFitFiles) &&
        windowExt.loadedFitFiles.length > 0
    ) {
        console.log(
            "[renderMap] Overlay logic: loadedFitFiles.length =",
            windowExt.loadedFitFiles.length
        );
        // Clear overlay polylines tracking before drawing
        windowExt._overlayPolylines = {};
        for (const [idx, fitFile] of windowExt.loadedFitFiles.entries()) {
            // Skip index 0 (main file) here to avoid duplicating the main track as an overlay
            if (idx === 0) {
                continue;
            }
            console.log(
                `[renderMap] Drawing overlay idx=${idx}, fileName=`,
                fitFile.filePath
            );
            const color =
                chartOverlayColorPalette[
                    idx % chartOverlayColorPalette.length
                ] || "#ff0000";
            const rawOverlayName =
                (fitFile.filePath || "").split(/[/\\]/).pop() ?? "";
            const fileName = sanitizeFilenameComponent(
                rawOverlayName,
                `overlay_${idx + 1}`
            );
            const bounds = drawOverlayForFitFile({
                color,
                endIcon,
                fileName,
                fitData: fitFile.data,
                formatTooltipData: (pointIdx, row, lapNum) =>
                    formatTooltipData(
                        pointIdx,
                        row,
                        lapNum,
                        fitFile.data && fitFile.data.recordMesgs
                    ),
                getLapNumForIdx,
                map,
                markerClusterGroup,
                overlayIdx: idx,
                startIcon,
            });
            console.log(`[renderMap] Overlay idx=${idx} bounds:`, bounds);
        }
        // --- Bring overlay markers to front so they appear above all polylines ---
        setCleanupTimeout(() => {
            if (windowExt._overlayPolylines) {
                for (const [idx, polyline] of Object.entries(
                    windowExt._overlayPolylines
                )) {
                    console.log(
                        `[renderMap] Bring to front: overlay idx=${idx}, polyline=`,
                        polyline
                    );
                    if (
                        polyline &&
                        polyline._map &&
                        polyline._map &&
                        polyline._map._layers
                    ) {
                        for (const layer of Object.values(
                            polyline._map._layers
                        )) {
                            if (
                                layer instanceof L.CircleMarker &&
                                layer.options &&
                                polyline.options &&
                                layer.options.color ===
                                    polyline.options.color &&
                                layer.bringToFront
                            ) {
                                layer.bringToFront();
                            }
                        }
                    }
                }
            }
        }, 10);
        console.log(
            "[renderMap] Overlay logic complete. No fitBounds/zoom called here."
        );
        // --- Always call mapDrawLapsWrapper('all') to ensure correct zoom/fitBounds logic ---
        mapDrawLapsWrapper("all");
    } else if (windowExt.globalData && windowExt.globalData.recordMesgs) {
        console.log(
            '[renderMap] No overlays, calling mapDrawLapsWrapper("all")'
        );
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
        console.log(
            "[FFV] [renderMap] Calling updateShownFilesList after overlays drawn"
        );
        windowExt.updateShownFilesList();
        if (windowExt.setupOverlayFileNameMapActions) {
            console.log(
                "[FFV] [renderMap] Calling setupOverlayFileNameMapActions after updateShownFilesList"
            );
            windowExt.setupOverlayFileNameMapActions();
            if (windowExt.setupActiveFileNameMapActions) {
                console.log(
                    "[FFV] [renderMap] Calling setupActiveFileNameMapActions after overlays drawn"
                );
                windowExt.setupActiveFileNameMapActions();
            }
        }
    }
    // Enable/disable lap selector based on number of loaded files
    function updateLapSelectorEnabledState() {
        const lapSelect = document.querySelector("#lap-select");
        if (!lapSelect) return;
        // Keep lap selector enabled. Optionally disable only if there are no laps available.
        try {
            const laps = windowExt.globalData && windowExt.globalData.lapMesgs;
            lapSelect.disabled =
                !laps || !Array.isArray(laps) || laps.length === 0
                    ? false
                    : false;
        } catch {
            lapSelect.disabled = false;
        }
    }
    updateLapSelectorEnabledState();
    const refreshMapLayout = () => {
        try {
            map.invalidateSize({ animate: false, pan: false });
        } catch {
            /* ignore */
        }
        try {
            const miniMapInstance = windowExt._miniMapControl?._miniMap;
            if (
                miniMapInstance &&
                typeof miniMapInstance.invalidateSize === "function"
            ) {
                miniMapInstance.invalidateSize();
            }
        } catch {
            /* ignore */
        }
    };
    const raf =
        typeof globalThis.requestAnimationFrame === "function"
            ? globalThis.requestAnimationFrame
            : (cb) => setTimeout(cb, 0);
    refreshMapLayout();
    raf(() => refreshMapLayout());
    setCleanupTimeout(refreshMapLayout, 90);
    setCleanupTimeout(refreshMapLayout, 240);
    // --- Theme support (dark/light) ---
    if (document.querySelector("#leaflet-map")) {
        installUpdateMapThemeListeners();
        updateMapTheme();
    }
}

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
import { getLapNumForIdx } from "../../data/processing/getLapNumForIdx.js";
import { createExportGPXButton } from "../../files/export/createExportGPXButton.js";
import { createPrintButton } from "../../files/export/createPrintButton.js";
import { sanitizeFilenameComponent } from "../../files/sanitizeFilename.js";
import { formatTooltipData } from "../../formatting/display/formatTooltipData.js";
import { createShownFilesList } from "../../rendering/components/createShownFilesList.js";
import { updateMapTheme } from "../../theming/specific/updateMapTheme.js";
import { createAddFitFileToMapButton } from "../../ui/controls/createAddFitFileToMapButton.js";
import { createDataPointFilterControl } from "../../ui/controls/createDataPointFilterControl.js";
import { createElevationProfileButton } from "../../ui/controls/createElevationProfileButton.js";
import { createMarkerCountSelector } from "../../ui/controls/createMarkerCountSelector.js";
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

    const map = LeafletLib.map("leaflet-map", {
        center: [0, 0],
        fullscreenControl: true,
        layers: [baseLayers.OpenStreetMap],
        zoom: 2,
    });
    windowExt._leafletMapInstance = map;

    LeafletLib.control.layers(baseLayers, null, { collapsed: true, position: "topright" }).addTo(map);

    // Add a custom floating label/button to indicate map type selection
    const mapTypeBtn = document.createElement("div");
    mapTypeBtn.className = "custom-maptype-btn leaflet-bar";
    mapTypeBtn.style.position = "absolute";
    mapTypeBtn.style.top = "16px";
    mapTypeBtn.style.right = "60px";
    mapTypeBtn.style.zIndex = "900"; // Ensure above layers control
    mapTypeBtn.textContent = "🗺️ Change Map Type";
    mapTypeBtn.title = "Click to change the map type";
    mapTypeBtn.addEventListener("click", handleMapTypeButtonClick);
    const leafletMapDiv2 = document.querySelector("#leaflet-map");
    if (leafletMapDiv2) {
        leafletMapDiv2.append(mapTypeBtn);
    }

    // Update global reference for the map type button used by the shared document listener.
    /** @type {any} */ (globalThis).__ffvMapTypeButton = mapTypeBtn;
    ensureMapDocumentListenersInstalled();

    /**
     * Handle map type button click
     * @param {Event} e - Click event
     * @returns {void}
     */
    function handleMapTypeButtonClick(e) {
        e.stopPropagation();
        const layersControlEl = document.querySelector(".leaflet-control-layers");
        if (layersControlEl) {
            layersControlEl.classList.add("leaflet-control-layers-expanded");
            const layersControlElStyled = /** @type {HTMLElement} */ (layersControlEl);
            layersControlElStyled.style.zIndex = "1201"; // Just below the button
            // Focus the first input for accessibility
            const firstInput = layersControlEl.querySelector('input[type="radio"]');
            if (firstInput) {
                const inputElement = /** @type {HTMLInputElement} */ (firstInput);
                inputElement.focus();
            }
        }
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
    zoomSliderBar.innerHTML = `
		<div class="custom-zoom-slider-label">Zoom</div>
		<input type="range" min="0" max="100" value="${zoomToPercent(map.getZoom())}" step="1" id="zoom-slider-input">
		<div class="custom-zoom-slider-values">
			<span id="zoom-slider-min">0%</span>
				<span class="margin-horizontal">|</span>
			<span id="zoom-slider-current">${Math.round(zoomToPercent(map.getZoom()))}%</span>
				<span class="margin-horizontal">|</span>
			<span id="zoom-slider-max">100%</span>
		</div>
	`;
    const zoomSlider = /** @type {HTMLInputElement} */ (zoomSliderBar.querySelector("#zoom-slider-input")),
        zoomSliderCurrent = /** @type {HTMLElement} */ (zoomSliderBar.querySelector("#zoom-slider-current"));
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
        addSimpleMeasureTool(map, primaryControls);
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
        updateMapTheme();
    }
}

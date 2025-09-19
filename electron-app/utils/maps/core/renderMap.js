/*global */

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
 * @property {Function} [_mapThemeListener] - Map theme change listener
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
import { formatTooltipData } from "../../formatting/display/formatTooltipData.js";
import { createShownFilesList } from "../../rendering/components/createShownFilesList.js";
import { updateMapTheme } from "../../theming/specific/updateMapTheme.js";
import { createAddFitFileToMapButton } from "../../ui/controls/createAddFitFileToMapButton.js";
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
import { mapDrawLaps } from "../layers/mapDrawLaps.js";
import { drawOverlayForFitFile } from "../layers/mapDrawLaps.js";
import { createEndIcon, createStartIcon } from "../layers/mapIcons.js";
import { getLapColor } from "./mapColors.js";

export function renderMap() {
    // Reset overlay polylines to prevent stale references and memory leaks
    const windowExt = /** @type {WindowExtensions} */ (/** @type {any} */ (globalThis));
    windowExt._overlayPolylines = {};

    const mapContainer = document.querySelector("#content-map");
    if (!mapContainer) {
        return;
    }

    // Fix: Remove any previous Leaflet map instance to avoid grey background bug
    if (windowExt._leafletMapInstance && windowExt._leafletMapInstance.remove) {
        windowExt._leafletMapInstance.remove();
        windowExt._leafletMapInstance = null;
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
    mapContainer.append(mapControlsDiv);

    const LeafletLib = /** @type {any} */ (windowExt).L,
        map = LeafletLib.map("leaflet-map", {
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
    mapTypeBtn.innerHTML = "🗺️ Change Map Type";
    mapTypeBtn.title = "Click to change the map type";
    mapTypeBtn.addEventListener("click", handleMapTypeButtonClick);
    const leafletMapDiv2 = document.querySelector("#leaflet-map");
    if (leafletMapDiv2) {
        leafletMapDiv2.append(mapTypeBtn);
    }

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

    // When the user clicks outside the control, collapse it
    document.addEventListener("mousedown", (/** @type {MouseEvent} */ e) => {
        const layersControlEl = document.querySelector(".leaflet-control-layers");
        if (layersControlEl && layersControlEl.classList.contains("leaflet-control-layers-expanded")) {
            const target = /** @type {Node} */ (e.target);
            if (!layersControlEl.contains(target) && !mapTypeBtn.contains(target)) {
                layersControlEl.classList.remove("leaflet-control-layers-expanded");
                const layersControlElStyled = /** @type {HTMLElement} */ (layersControlEl);
                layersControlElStyled.style.zIndex = "";
            }
        }
    });

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

    // Fix jank: Only update map zoom on change, and update slider on zoomend
    let isDragging = false;
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
            function () {
                // @ts-ignore: arguments is available in function context
                const args = Array.prototype.slice.call(arguments);
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(null, args), wait);
            }
        );
    }
    if (zoomSlider && zoomSliderCurrent) {
        zoomSlider.addEventListener(
            "input",
            /** @type {EventListener} */ (
                debounce(
                    /** @param {Event} e */ (e) => {
                        isDragging = true;
                        const target = /** @type {HTMLInputElement} */ (e.target),
                            percent = Number(target.value);
                        zoomSliderCurrent.textContent = `${percent}%`;
                    },
                    100
                )
            ) // Adjust debounce delay as needed
        );
        zoomSlider.addEventListener("change", (e) => {
            const target = /** @type {HTMLInputElement} */ (e.target),
                percent = Number(target.value),
                newZoom = percentToZoom(percent);
            map.setZoom(Math.round(newZoom));
            isDragging = false;
        });
    }

    // Reset isDragging flag if interaction is canceled
    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
    document.addEventListener("touchend", () => {
        isDragging = false;
    });
    const updateZoomSlider = () => {
        if (!isDragging && zoomSlider && zoomSliderCurrent) {
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

    /** @type {any} */
    const L = LeafletLib;
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

    if (controlsDiv) {
        controlsDiv.append(createPrintButton());
        controlsDiv.append(createMapThemeToggle());
        controlsDiv.append(createExportGPXButton());
        controlsDiv.append(createElevationProfileButton());
        controlsDiv.append(
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
        addSimpleMeasureTool(map, controlsDiv);
        controlsDiv.append(createAddFitFileToMapButton());
        if (windowExt.loadedFitFiles && windowExt.loadedFitFiles.length > 1) {
            const shownFilesList = createShownFilesList();
            controlsDiv.append(shownFilesList);
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
    let markerClusterGroup = null;
    if (windowExt.L && L.markerClusterGroup) {
        markerClusterGroup = L.markerClusterGroup();
        map.addLayer(markerClusterGroup);
    }

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
        });
        new L.Control.MiniMap(miniMapLayer, {
            toggleDisplay: true,
        }).addTo(map);
    }

    // --- Measurement tool (if plugin available) ---
    if (windowExt.L && L.control && L.control.measure) {
        L.control.measure({ position: "topleft" }).addTo(map);
    }

    // --- Drawing/editing tool (if plugin available) ---
    if (windowExt.L && L.Control && L.Control.Draw) {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        const drawControl = new L.Control.Draw({
            draw: {
                circle: true,
                marker: true,
                polygon: true,
                polyline: true,
                rectangle: true,
            },
            edt: false,
        });
        map.addControl(drawControl);
        map.on(L.Draw.Event.CREATED, (/** @type {any} */ e) => {
            drawnItems.addLayer(e.layer);
        });
    }

    // --- Overlay logic ---
    if (windowExt.loadedFitFiles && Array.isArray(windowExt.loadedFitFiles) && windowExt.loadedFitFiles.length > 0) {
        console.log("[renderMap] Overlay logic: loadedFitFiles.length =", windowExt.loadedFitFiles.length);
        // Clear overlay polylines tracking before drawing
        windowExt._overlayPolylines = {};
        for (const [idx, fitFile] of windowExt.loadedFitFiles.entries()) {
            console.log(`[renderMap] Drawing overlay idx=${idx}, fileName=`, fitFile.filePath);
            const color = /** @type {string} */ (
                    chartOverlayColorPalette[idx % chartOverlayColorPalette.length] || "#ff0000"
                ),
                fileName = (fitFile.filePath || "").split(/[/\\]/).pop(),
                bounds = drawOverlayForFitFile({
                    color,
                    endIcon,
                    fileName,
                    fitData: fitFile.data,
                    formatTooltipData: (/** @type {any} */ idx, /** @type {any} */ row, /** @type {any} */ lapNum) =>
                        formatTooltipData(idx, row, lapNum, fitFile.data && fitFile.data.recordMesgs),
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
        const lapSelect = /** @type {HTMLInputElement} */ (document.querySelector("#lap-select"));
        if (lapSelect) {
            lapSelect.disabled = Boolean(windowExt.loadedFitFiles && windowExt.loadedFitFiles.length > 1);
        }
    }
    updateLapSelectorEnabledState();

    // --- Theme support (dark/light) ---
    if (document.querySelector("#leaflet-map")) {
        updateMapTheme();
        if (!windowExt._mapThemeListener) {
            windowExt._mapThemeListener = () => updateMapTheme();
            document.body.addEventListener("themechange", /** @type {EventListener} */ (windowExt._mapThemeListener));
        }
    }
}

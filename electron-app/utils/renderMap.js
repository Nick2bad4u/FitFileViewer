/*global L */
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
import { addSimpleMeasureTool } from "./mapMeasureTool.js";
import { addLapSelector } from "./mapLapSelector.js";
import { getLapColor } from "./mapColors.js";
import { formatTooltipData } from "./formatTooltipData.js";
import { getLapNumForIdx } from "./getLapNumForIdx.js";
import { drawMapForLap } from "./drawMapForLap.js";
import { updateMapTheme } from "./updateMapTheme.js";
import { createStartIcon, createEndIcon } from "./mapIcons.js";
import { baseLayers } from "./mapBaseLayers.js";
import {
    createPrintButton,
    createExportGPXButton,
    createElevationProfileButton,
    createMarkerCountSelector,
    createAddFitFileToMapButton,
    createShownFilesList,
    overlayColorPalette,
} from "./mapActionButtons.js";
import { addFullscreenControl } from "./mapFullscreenControl.js";
import { drawOverlayForFitFile } from "./drawMapForLap.js";

export function renderMap() {
    // Reset overlay polylines to prevent stale references and memory leaks
    window._overlayPolylines = {};

    const mapContainer = document.getElementById("content-map");
    // Fix: Remove any previous Leaflet map instance to avoid grey background bug
    if (window._leafletMapInstance && window._leafletMapInstance.remove) {
        window._leafletMapInstance.remove();
        window._leafletMapInstance = null;
    }
    const oldMapDiv = document.getElementById("leaflet-map");
    if (oldMapDiv) {
        oldMapDiv.remove();
    }
    while (mapContainer.firstChild) {
        mapContainer.removeChild(mapContainer.firstChild);
    }

    const leafletMapDiv = document.createElement("div");
    leafletMapDiv.id = "leaflet-map";
    mapContainer.appendChild(leafletMapDiv);

    const mapControlsDiv = document.createElement("div");
    mapControlsDiv.id = "map-controls";
    mapContainer.appendChild(mapControlsDiv);

    const map = L.map("leaflet-map", {
        center: [0, 0],
        zoom: 2,
        layers: [baseLayers["OpenStreetMap"]],
        fullscreenControl: true,
    });
    window._leafletMapInstance = map;

    // eslint-disable-next-line no-unused-vars
    const layersControl = L.control.layers(baseLayers, null, { position: "topright", collapsed: true }).addTo(map);

    // Add a custom floating label/button to indicate map type selection
    const mapTypeBtn = document.createElement("div");
    mapTypeBtn.className = "custom-maptype-btn leaflet-bar";
    mapTypeBtn.style.position = "absolute";
    mapTypeBtn.style.top = "16px";
    mapTypeBtn.style.right = "60px";
    mapTypeBtn.style.zIndex = 900; // ensure above layers control
    mapTypeBtn.innerHTML = "🗺️ Change Map Type";
    mapTypeBtn.title = "Click to change the map type";
    mapTypeBtn.onclick = handleMapTypeButtonClick;
    document.getElementById("leaflet-map").appendChild(mapTypeBtn);

    function handleMapTypeButtonClick(e) {
        e.stopPropagation();
        const layersControlEl = document.querySelector(".leaflet-control-layers");
        if (layersControlEl) {
            layersControlEl.classList.add("leaflet-control-layers-expanded");
            layersControlEl.style.zIndex = 1201; // just below the button
            // Focus the first input for accessibility
            const firstInput = layersControlEl.querySelector('input[type="radio"]');
            if (firstInput) firstInput.focus();
        }
    }

    // When the user clicks outside the control, collapse it
    document.addEventListener("mousedown", (e) => {
        const layersControlEl = document.querySelector(".leaflet-control-layers");
        if (layersControlEl && layersControlEl.classList.contains("leaflet-control-layers-expanded")) {
            if (!layersControlEl.contains(e.target) && !mapTypeBtn.contains(e.target)) {
                layersControlEl.classList.remove("leaflet-control-layers-expanded");
                layersControlEl.style.zIndex = "";
            }
        }
    });

    // --- Add a custom zoom slider bar (normalized 0-100%) ---
    const zoomSliderBar = document.createElement("div");
    zoomSliderBar.className = "custom-zoom-slider-bar";
    const minZoom = map.getMinZoom();
    const maxZoom = map.getMaxZoom();
    const zoomToPercent = (zoom) => ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
    const percentToZoom = (percent) => minZoom + ((maxZoom - minZoom) * percent) / 100;
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
    const zoomSlider = zoomSliderBar.querySelector("#zoom-slider-input");
    const zoomSliderCurrent = zoomSliderBar.querySelector("#zoom-slider-current");
    zoomSliderBar.style.pointerEvents = "auto";
    zoomSlider.style.pointerEvents = "auto";
    zoomSlider.addEventListener("mousedown", (e) => e.stopPropagation());
    zoomSlider.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });

    // Fix jank: Only update map zoom on change, and update slider on zoomend
    let isDragging = false;
    // Debounce function to limit the frequency of updates
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    zoomSlider.addEventListener(
        "input",
        debounce((e) => {
            isDragging = true;
            const percent = Number(e.target.value);
            zoomSliderCurrent.textContent = `${percent}%`;
        }, 100) // Adjust debounce delay as needed
    );
    zoomSlider.addEventListener("change", (e) => {
        const percent = Number(e.target.value);
        const newZoom = percentToZoom(percent);
        map.setZoom(Math.round(newZoom));
        isDragging = false;
    });

    // Reset isDragging flag if interaction is canceled
    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
    document.addEventListener("touchend", () => {
        isDragging = false;
    });
    const updateZoomSlider = () => {
        if (!isDragging) {
            const percent = Math.round(zoomToPercent(map.getZoom()));
            zoomSlider.value = percent;
            zoomSliderCurrent.textContent = `${percent}%`;
        }
    };
    map.on("zoomend zoomlevelschange", updateZoomSlider);
    updateZoomSlider();
    document.getElementById("leaflet-map").appendChild(zoomSliderBar);

    L.control.scale({ position: "bottomleft", metric: true, imperial: true }).addTo(map);

    // --- Fullscreen control (if plugin loaded) ---
    if (L.control.fullscreen) {
        L.control.fullscreen({ position: "topleft" }).addTo(map);
    }

    // --- Locate user button ---
    if (L.control.locate) {
        L.control.locate({ position: "topleft", flyTo: true, keepCurrentZoomLevel: true }).addTo(map);
    }

    // --- Print/export button ---
    const controlsDiv = document.getElementById("map-controls");
    controlsDiv.appendChild(createPrintButton());
    controlsDiv.appendChild(createExportGPXButton());
    controlsDiv.appendChild(createElevationProfileButton());
    controlsDiv.appendChild(
        createMarkerCountSelector(() => {
            // Redraw map with new marker count
            if (window.globalData && window.globalData.recordMesgs) {
                drawMapForLapWrapper("all");
            }
            if (window.updateShownFilesList) window.updateShownFilesList();
        })
    );
    addSimpleMeasureTool(map, controlsDiv);
    controlsDiv.appendChild(createAddFitFileToMapButton());
    if (window.loadedFitFiles && window.loadedFitFiles.length > 1) {
        const shownFilesList = createShownFilesList();
        controlsDiv.appendChild(shownFilesList);
        if (window.updateShownFilesList) window.updateShownFilesList();
    }

    // --- Fullscreen button (custom, styled, top left) ---
    addFullscreenControl(map);

    // --- Custom icons for start/end ---
    const startIcon = createStartIcon();
    const endIcon = createEndIcon();

    // --- Marker cluster group (if available) ---
    let markerClusterGroup = null;
    if (window.L && L.markerClusterGroup) {
        markerClusterGroup = L.markerClusterGroup();
        map.addLayer(markerClusterGroup);
    }

    // --- Lap selection UI (moved to mapLapSelector.js) ---
    function drawMapForLapWrapper(lapIdx) {
        drawMapForLap(lapIdx, {
            map,
            baseLayers,
            markerClusterGroup,
            startIcon,
            endIcon,
            mapContainer,
            getLapColor,
            formatTooltipData,
            getLapNumForIdx,
        });
    }
    addLapSelector(map, document.getElementById("leaflet-map"), drawMapForLapWrapper);

    // --- Minimap (if plugin available) ---
    if (window.L && L.Control && L.Control.MiniMap) {
        // Always use a standard tile layer for the minimap
        const miniMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "",
        });
        new L.Control.MiniMap(miniMapLayer, {
            toggleDisplay: true,
        }).addTo(map);
    }

    // --- Measurement tool (if plugin available) ---
    if (window.L && L.control && L.control.measure) {
        L.control.measure({ position: "topleft" }).addTo(map);
    }

    // --- Drawing/editing tool (if plugin available) ---
    if (window.L && L.Control && L.Control.Draw) {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        const drawControl = new L.Control.Draw({
            edt: false,
            draw: {
                polygon: true,
                polyline: true,
                rectangle: true,
                circle: true,
                marker: true,
            },
        });
        map.addControl(drawControl);
        map.on(L.Draw.Event.CREATED, function (e) {
            drawnItems.addLayer(e.layer);
        });
    }

    // --- Overlay logic ---
    if (window.loadedFitFiles && Array.isArray(window.loadedFitFiles) && window.loadedFitFiles.length > 0) {
        console.log("[renderMap] Overlay logic: loadedFitFiles.length =", window.loadedFitFiles.length);
        // Clear overlay polylines tracking before drawing
        window._overlayPolylines = {};
        window.loadedFitFiles.forEach((fitFile, idx) => {
            console.log(`[renderMap] Drawing overlay idx=${idx}, fileName=`, fitFile.filePath);
            const color = overlayColorPalette[idx % overlayColorPalette.length];
            const fileName = (fitFile.filePath || "").split(/[\\/]/).pop();
            const bounds = drawOverlayForFitFile({
                fitData: fitFile.data,
                map,
                color,
                markerClusterGroup,
                startIcon,
                endIcon,
                formatTooltipData: (idx, row, lapNum) => formatTooltipData(idx, row, lapNum, fitFile.data && fitFile.data.recordMesgs),
                getLapNumForIdx,
                fileName,
                overlayIdx: idx,
            });
            console.log(`[renderMap] Overlay idx=${idx} bounds:`, bounds);
        });
        // --- Bring overlay markers to front so they appear above all polylines ---
        setTimeout(() => {
            if (window._overlayPolylines) {
                Object.entries(window._overlayPolylines).forEach(([idx, polyline]) => {
                    console.log(`[renderMap] Bring to front: overlay idx=${idx}, polyline=`, polyline);
                    if (polyline && polyline._map) {
                        if (polyline._map && polyline._map._layers) {
                            Object.values(polyline._map._layers).forEach((layer) => {
                                if (
                                    layer instanceof L.CircleMarker &&
                                    layer.options &&
                                    polyline.options &&
                                    layer.options.color === polyline.options.color
                                ) {
                                    if (layer.bringToFront) layer.bringToFront();
                                }
                            });
                        }
                    }
                });
            }
        }, 10);
        console.log("[renderMap] Overlay logic complete. No fitBounds/zoom called here.");
        // --- Always call drawMapForLapWrapper('all') to ensure correct zoom/fitBounds logic ---
        drawMapForLapWrapper("all");
    } else if (window.globalData && window.globalData.recordMesgs) {
        console.log('[renderMap] No overlays, calling drawMapForLapWrapper("all")');
        drawMapForLapWrapper("all");
    }

    // Restore highlight after overlays are drawn, if any
    if (window.updateOverlayHighlights) {
        console.log("[FFV] [renderMap] Calling updateOverlayHighlights, highlightedOverlayIdx:", window._highlightedOverlayIdx);
        window.updateOverlayHighlights();
    }
    if (window.updateShownFilesList) {
        console.log("[FFV] [renderMap] Calling updateShownFilesList after overlays drawn");
        window.updateShownFilesList();
        if (window.setupOverlayFileNameMapActions) {
            console.log("[FFV] [renderMap] Calling setupOverlayFileNameMapActions after updateShownFilesList");
            window.setupOverlayFileNameMapActions();
            if (window.setupActiveFileNameMapActions) {
                console.log("[FFV] [renderMap] Calling setupActiveFileNameMapActions after overlays drawn");
                window.setupActiveFileNameMapActions();
            }
        }
    }
    // Enable/disable lap selector based on number of loaded files
    function updateLapSelectorEnabledState() {
        const lapSelect = document.getElementById("lap-select");
        if (lapSelect) {
            if (window.loadedFitFiles && window.loadedFitFiles.length > 1) {
                lapSelect.disabled = true;
            } else {
                lapSelect.disabled = false;
            }
        }
    }
    updateLapSelectorEnabledState();

    // --- Theme support (dark/light) ---
    if (document.getElementById("leaflet-map")) {
        updateMapTheme();
        if (!window._mapThemeListener) {
            window._mapThemeListener = () => updateMapTheme();
            document.body.addEventListener("themechange", window._mapThemeListener);
        }
    }
}

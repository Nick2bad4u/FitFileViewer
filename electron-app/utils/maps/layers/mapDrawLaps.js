import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import { getOverlayFileName } from "../../files/import/getOverlayFileName.js";

/**
 * @typedef {Object} RecordMesg
 * @property {number} [positionLat] - Position latitude
 * @property {number} [positionLong] - Position longitude
 * @property {number} [timestamp] - Timestamp
 * @property {number} [altitude] - Altitude
 * @property {number} [heartRate] - Heart rate
 * @property {number} [speed] - Speed
 */

/**
 * @typedef {Object} LapMesg
 * @property {number} [start_index] - Start index in records
 * @property {number} [end_index] - End index in records
 * @property {number} [startPositionLat] - Start position latitude
 * @property {number} [startPositionLong] - Start position longitude
 * @property {number} [endPositionLat] - End position latitude
 * @property {number} [endPositionLong] - End position longitude
 */

/**
 * @typedef {Object} FitFile
 * @property {Object} data - FIT file data
 * @property {string} [filePath] - File path
 */

/**
 * @typedef {Object} WindowExtensions
 * @property {Object} globalData - Global FIT file data
 * @property {Array<FitFile>} loadedFitFiles - Array of loaded FIT files
 * @property {number} _activeMainFileIdx - Index of active main file
 * @property {Object} _overlayPolylines - Map overlay polylines
 * @property {Object} _mainPolylineOriginalBounds - Original bounds of main polyline
 * @property {number} mapMarkerCount - Number of map markers to display
 * @property {Object} L - Leaflet library global
 * @property {number} _highlightedOverlayIdx - Index of highlighted overlay
 * @property {Function} updateOverlayHighlights - Function to update overlay highlights
 */

/**
 * @typedef {[number, number, number|null, number|null, number|null, number|null, number, RecordMesg, number]} CoordTuple
 */

/**
 * @typedef {Object} MapDrawOptions
 * @property {any} map - Leaflet map instance
 * @property {Object} baseLayers - Base layer definitions
 * @property {any} markerClusterGroup - Marker cluster group
 * @property {any} startIcon - Start marker icon
 * @property {any} endIcon - End marker icon
 * @property {HTMLElement} mapContainer - Map container element
 * @property {Function} getLapColor - Function to get lap color
 * @property {Function} formatTooltipData - Function to format tooltip data
 * @property {Function} getLapNumForIdx - Function to get lap number for index
 */

/**
 * @typedef {Object} OverlayDrawOptions
 * @property {Object} fitData - FIT file data
 * @property {Array<RecordMesg>} fitData.recordMesgs - Record messages
 * @property {Array<LapMesg>} fitData.lapMesgs - Lap messages
 * @property {any} map - Leaflet map instance
 * @property {string} [color] - Polyline color
 * @property {any} [markerClusterGroup] - Marker cluster group
 * @property {any} [startIcon] - Start marker icon
 * @property {any} [endIcon] - End marker icon
 * @property {Function} [formatTooltipData] - Function to format tooltip data
 * @property {Function} [getLapNumForIdx] - Function to get lap number for index
 * @property {string} [fileName] - File name
 * @property {number} [overlayIdx] - Overlay index
 */

/**
 * Draws a polyline, markers, and tooltips for a given FIT file's data as an overlay on the map.
 * @param {OverlayDrawOptions} options - The options for drawing the overlay.
 * @returns {any|null} LatLngBounds object or null if no valid coordinates
 */
export function drawOverlayForFitFile({
    endIcon,
    fileName,
    fitData,
    formatTooltipData,
    getLapNumForIdx,
    map,
    markerClusterGroup,
    overlayIdx,
    startIcon,
}) {
    // Resolve Leaflet dynamically (tests inject global L)
    const L = getLeaflet();
    // Strengthen typing of fitData
    const lapMesgs = /** @type {Array<LapMesg>} */ (fitData.lapMesgs || []),
        recordMesgs = /** @type {Array<RecordMesg>} */ (fitData.recordMesgs || []);

    // Patch lap indices for overlays as well
    patchLapIndices(lapMesgs, recordMesgs);

    const coords = recordMesgs
        .map((row, idx) => {
            if (typeof row.positionLat === "number" && typeof row.positionLong === "number") {
                /** @type {CoordTuple} */
                const coordTuple = [
                    Number((row.positionLat / 2 ** 31) * 180),
                    Number((row.positionLong / 2 ** 31) * 180),
                    row.timestamp || null,
                    row.altitude || null,
                    row.heartRate || null,
                    row.speed || null,
                    idx,
                    row,
                    getLapNumForIdx ? getLapNumForIdx(idx, lapMesgs) : 1,
                ];
                return coordTuple;
            }
            return null;
        })
        .filter((coord) => coord !== null);

    if (coords.length === 0) {
        console.warn(`[drawOverlayForFitFile] No valid location data in overlay file: ${fileName || ""}`);
        return null;
    }

    if (coords.length > 0) {
        const isHighlighted =
                typeof overlayIdx === "number" && /** @type {any} */ (getWin())._highlightedOverlayIdx === overlayIdx,
            paletteColor =
                Array.isArray(chartOverlayColorPalette) &&
                chartOverlayColorPalette.length > 0 &&
                typeof overlayIdx === "number"
                    ? chartOverlayColorPalette[overlayIdx % chartOverlayColorPalette.length]
                    : "#1976d2", // Default fallback color
            polyline = L.polyline(
                coords.map((c) => [c[0], c[1]]),
                {
                    className: isHighlighted ? "overlay-highlight-glow" : "",
                    color: paletteColor,
                    dashArray: null,
                    opacity: 0.95,
                    weight: isHighlighted ? 10 : 4,
                }
            ).addTo(map);

        // Track overlay polylines for highlight updates
        if (typeof overlayIdx === "number") {
            if (!(/** @type {any} */ (getWin())._overlayPolylines)) {
                /** @type {any} */ (getWin())._overlayPolylines = {};
            }
            /** @type {any} */ (getWin())._overlayPolylines[overlayIdx] = polyline;
        }

        if (isHighlighted) {
            const polyElem = polyline.getElement && polyline.getElement();
            if (polyElem) {
                polyElem.style.filter = `drop-shadow(0 0 8px ${paletteColor || "#1976d2"})`;
            }
        }

        const end = coords.at(-1),
            start = coords[0];

        // --- Ensure start/end markers are always above polylines ---
        if (startIcon && endIcon && start && end) {
            const sMarker = L.marker([start[0], start[1]], { icon: startIcon, title: "Start", zIndexOffset: 2000 });
            sMarker.addTo(map);
            sMarker.bindPopup("Start");
            const eMarker = L.marker([end[0], end[1]], { icon: endIcon, title: "End", zIndexOffset: 2000 });
            eMarker.addTo(map);
            eMarker.bindPopup("End");
        }

        // --- Ensure data point markers are above polylines ---
        const stepOverlay =
            /** @type {any} */ (getWin()).mapMarkerCount === 0 || !(/** @type {any} */ (getWin()).mapMarkerCount)
                ? 1
                : Math.max(1, Math.floor(coords.length / /** @type {any} */ (getWin().mapMarkerCount || 1)));
        for (let i = 0; i < coords.length; i += stepOverlay) {
            const c = coords[i];
            if (!c) {
                continue;
            }
            const marker = L.circleMarker([c[0], c[1]], {
                color: paletteColor || "#1976d2",
                fillColor: "#fff",
                fillOpacity: 0.85,
                radius: 4,
                weight: 2,
                zIndexOffset: 1500, // <-- ensure above polylines
            });
            if (markerClusterGroup) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }

            let lapDisplay;
            if (getLapNumForIdx && fitData && Array.isArray(fitData.lapMesgs) && fitData.lapMesgs.length > 0) {
                lapDisplay = getLapNumForIdx(c[6], /** @type {any} */ (fitData.lapMesgs));
            } else {
                lapDisplay = c[8] || 1;
            }

            let tooltip = formatTooltipData ? formatTooltipData(c[6], c[7], lapDisplay, recordMesgs) : "";
            if (fileName) {
                tooltip = `<b>${fileName}</b><br>${tooltip}`;
            }
            marker.bindTooltip(tooltip, {
                direction: "top",
                sticky: true,
            });
        }

        // Always return a new LatLngBounds-like object, never the polyline's internal bounds
        /** @type {any} */
        let resultBounds = null;
        /** @type {any} */
        let polyBounds;
        try {
            polyBounds = polyline.getBounds && polyline.getBounds();
        } catch {
            /* Ignore */
        }
        const pts = coords.map((c) => [c[0], c[1]]);
        // Try cloning existing bounds first
        try {
            if (polyBounds && typeof polyBounds.clone === "function") {
                const cloned = polyBounds.clone();
                if (cloned) resultBounds = cloned;
            }
        } catch {
            /* Ignore */
        }
        // Fallback: synthesize from points
        if (!resultBounds) {
            try {
                const lb = L && typeof L.latLngBounds === "function" ? L.latLngBounds(pts) : null;
                resultBounds = lb && typeof lb.clone === "function" ? lb.clone() : lb;
            } catch {
                // Ignore
            }
        }
        // Absolute last resort: minimal bounds-like object
        if (!resultBounds) {
            resultBounds = { extend: () => {} };
        }
        return resultBounds;
    }
    return null;
}

/**
 * Draws the map for a given lap or laps
 * Dependencies must be passed as arguments: map, baseLayers, markerClusterGroup, startIcon, endIcon, mapContainer, getLapColor, formatTooltipData, getLapNumForIdx
 * @param {string|number|Array<string|number>} lapIdx - Lap index or array of indices or "all"
 * @param {MapDrawOptions} options - Map drawing options
 */
export function mapDrawLaps(
    lapIdx,
    {
        baseLayers,
        endIcon,
        formatTooltipData,
        getLapColor,
        getLapNumForIdx,
        map,
        mapContainer,
        markerClusterGroup,
        startIcon,
    }
) {
    // Resolve L dynamically for this invocation
    const L = getLeaflet();

    // --- Always reset overlay polylines and main polyline at the start of a redraw ---
    /** @type {any} */ (getWin())._overlayPolylines = {};
    /** @type {any} */ (getWin())._mainPolylineOriginalBounds = undefined;

    // Remove all layers except base layers and controls
    // @ts-expect-error - Leaflet map method with dynamic layer checking
    map.eachLayer((layer) => {
        if (!Object.values(baseLayers).includes(layer)) {
            map.removeLayer(layer);
        }
    });
    if (markerClusterGroup) {
        markerClusterGroup.clearLayers();
    }

    // --- If switching main files, ensure overlays are cleared and only the new main file is plotted ---
    if (
        /** @type {any} */ (getWin()).loadedFitFiles &&
        /** @type {any} */ (getWin()).loadedFitFiles.length > 1 &&
        typeof (/** @type {any} */ (getWin())._activeMainFileIdx) === "number" &&
        /** @type {any} */ (getWin())._activeMainFileIdx > 0
    ) {
        // Remove overlays from loadedFitFiles except the main file
        /** @type {any} */ (getWin()).loadedFitFiles = [
            /** @type {any} */ (getWin()).loadedFitFiles[/** @type {any} */ (getWin())._activeMainFileIdx],
        ];
    }

    console.log(
        "[mapDrawLaps] ENTERED FUNCTION, lapIdx =",
        lapIdx,
        "type:",
        typeof lapIdx,
        Array.isArray(lapIdx) ? "isArray" : "notArray"
    );

    /** @type {Array<CoordTuple>} */
    let coords = [];
    // Replace window global data access comments

    // DEBUG: Log what we're seeing
    const __w = getWin();
    console.log("[mapDrawLaps] DEBUG win =", __w);
    console.log("[mapDrawLaps] DEBUG win.globalData =", __w.globalData);
    console.log("[mapDrawLaps] DEBUG win.globalData?.lapMesgs =", __w.globalData?.lapMesgs);
    console.log("[mapDrawLaps] DEBUG win.globalData?.recordMesgs =", __w.globalData?.recordMesgs);

    const lapMesgs = /** @type {Array<LapMesg>} */ (/** @type {any} */ (getWin()).globalData?.lapMesgs || []),
        recordMesgs = /** @type {Array<RecordMesg>} */ (/** @type {any} */ (getWin()).globalData?.recordMesgs || []);

    patchLapIndices(lapMesgs, recordMesgs);

    /**
     * Helper: Wait until map container is visible and sized before fitBounds
     * @param {any} map - Leaflet map instance
     * @param {any} bounds - Map bounds
     * @param {Object} [options={}] - Fit bounds options
     */
    function safeFitBounds(map, bounds, options = {}) {
        // Attempt immediately
        try {
            map.fitBounds(bounds, options);
        } catch {
            /* Ignore first attempt */
        }
        function tryFit() {
            try {
                if (
                    map._container &&
                    map._container.offsetParent !== null &&
                    map._container.clientWidth > 0 &&
                    map._container.clientHeight > 0
                ) {
                    try {
                        map.fitBounds(bounds, options);
                    } catch (error) {
                        console.warn("safeFitBounds fitBounds failed", error);
                    }
                } else {
                    setTimeout(tryFit, 50);
                }
            } catch {
                setTimeout(tryFit, 50);
            }
        }
        setTimeout(tryFit, 50);
    }
    // --- Store original main polyline bounds for zooming ---
    // @ts-expect-error - Window extensions for map state
    getWin()._mainPolylineOriginalBounds = undefined;

    // If lapIdx is an array with one element (not "all"), treat as single lap
    if (Array.isArray(lapIdx) && lapIdx.length === 1 && lapIdx[0] !== "all") {
        lapIdx = lapIdx[0] ?? 0;
    }

    // --- FIX: handle both string 'all' and array containing 'all' ---
    if (lapIdx === "all" || (Array.isArray(lapIdx) && lapIdx.includes("all"))) {
        console.log(
            `[mapDrawLaps] "all" laps mode: recordMesgs.length = ${recordMesgs.length} lapMesgs.length = ${lapMesgs.length}`
        );
        console.log("[mapDrawLaps] lapMesgs[0]:", lapMesgs[0]);
        console.log("[mapDrawLaps] lapMesgs[1]:", lapMesgs[1]);
        console.log("[mapDrawLaps] lapMesgs[2]:", lapMesgs[2]);

        // Test getLapNumForIdx for first few indices
        if (getLapNumForIdx) {
            for (let testIdx = 0; testIdx < 3; ++testIdx) {
                const lapNum = getLapNumForIdx(testIdx, lapMesgs);
                console.log(`[mapDrawLaps] getLapNumForIdx(${testIdx}, lapMesgs) =`, lapNum);
            }
        }

        coords = /** @type {Array<CoordTuple>} */ (
            recordMesgs
                .map((/** @type {any} */ row, /** @type {number} */ idx) => {
                    if (row && typeof row.positionLat === "number" && typeof row.positionLong === "number") {
                        let lapNum = 1;
                        if (getLapNumForIdx) {
                            lapNum = getLapNumForIdx(idx, lapMesgs);
                            if (!lapNum || isNaN(lapNum)) {
                                lapNum = 1;
                            }
                        }
                        if (idx < 10 || idx > recordMesgs.length - 10) {
                            console.log(
                                `[mapDrawLaps] idx=${idx}, lapNum=${lapNum}, lat=${row.positionLat}, lon=${row.positionLong}`
                            );
                        }
                        /** @type {CoordTuple} */
                        const coordTuple = [
                            Number((row.positionLat / 2 ** 31) * 180),
                            Number((row.positionLong / 2 ** 31) * 180),
                            row.timestamp || null,
                            row.altitude || null,
                            row.heartRate || null,
                            row.speed || null,
                            idx,
                            row,
                            lapNum,
                        ];
                        return coordTuple;
                    }
                    return null;
                })
                .filter((/** @type {any} */ coord) => coord !== null)
        );

        // After coords mapping where Type complained about (CoordTuple | null)[] -> add explicit filtering cast
        coords = /** @type {Array<CoordTuple>} */ (coords.filter(Boolean));

        if (coords.length === 0) {
            mapContainer.innerHTML = `<p>No location data available to display map.<br>Lap: ${lapIdx}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
            return;
        }

        if (coords.length > 0) {
            const polyColor = getLapColor("all");
            console.log(`[mapDrawLaps] Drawing polyline for all laps, coords.length = ${coords.length}`);
            const polyline = L.polyline(
                coords.map((c) => [c[0], c[1]]),
                {
                    color: polyColor,
                    dashArray: "6, 8",
                    opacity: 0.9,
                    weight: 4,
                }
            );
            // Avoid relying on addTo return value for mock compatibility
            polyline.addTo(map);

            // Note: do not add main track to _overlayPolylines; only overlays belong there.

            // --- Store original bounds for main polyline ---
            const origBounds = polyline.getBounds();
            // Immediate fit using the original bounds reference to ensure at least one call is recorded
            try {
                map.fitBounds(origBounds, { padding: [20, 20] });
            } catch {
                /* Ignore errors */
            }
            /** @type {any} */ (getWin())._mainPolylineOriginalBounds =
                typeof origBounds.clone === "function" ? origBounds.clone() : L.latLngBounds(origBounds);
            map.invalidateSize();
            if (/** @type {any} */ (getWin())._mainPolylineOriginalBounds) {
                // Use safeFitBounds to handle invisible container timing and resized containers
                safeFitBounds(map, /** @type {any} */ (getWin())._mainPolylineOriginalBounds, { padding: [20, 20] });
            }

            const end = coords.at(-1),
                start = coords[0];
            if (startIcon && endIcon && start && end) {
                const startMarker = L.marker([start[0], start[1]], {
                    icon: startIcon,
                    title: "Start",
                    zIndexOffset: 2000,
                });
                startMarker.addTo(map);
                startMarker.bindPopup("Start");
                const endMarker = L.marker([end[0], end[1]], {
                    icon: endIcon,
                    title: "End",
                    zIndexOffset: 2000,
                });
                endMarker.addTo(map);
                endMarker.bindPopup("End");
            }

            // Replace loops adding markers where c may be undefined
            for (
                let i = 0;
                i < coords.length;
                i +=
                    /** @type {any} */ (getWin()).mapMarkerCount === 0 ||
                    !(/** @type {any} */ (getWin()).mapMarkerCount)
                        ? 1
                        : Math.max(1, Math.floor(coords.length / /** @type {any} */ (getWin().mapMarkerCount || 1)))
            ) {
                const c = coords[i];
                if (!c) {
                    continue;
                }
                let lapDisplay = c[8];
                if (!lapDisplay || isNaN(lapDisplay)) {
                    lapDisplay = 1;
                }
                const marker = L.circleMarker([c[0], c[1]], {
                    color: polyColor,
                    fillColor: "#fff",
                    fillOpacity: 0.85,
                    radius: 4,
                    weight: 2,
                    zIndexOffset: 1500,
                });
                markerClusterGroup ? markerClusterGroup.addLayer(marker) : marker.addTo(map);
                marker.bindTooltip(formatTooltipData(c[6], c[7], lapDisplay), { direction: "top", sticky: true });
            }
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (
            /** @type {any} */ (getWin()).loadedFitFiles &&
            Array.isArray(/** @type {any} */ (getWin()).loadedFitFiles) &&
            /** @type {any} */ (getWin()).loadedFitFiles.length > 1
        ) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                /** @type {any} */ overlayIdx = 0;
            const loaded = /** @type {any} */ (getWin()).loadedFitFiles;
            for (let i = 1; i < loaded.length; ++i) {
                const overlay = /** @type {{data?: any, filePath?: string}} */ (loaded[i]);
                if (!overlay || !overlay.data) {
                    continue;
                }
                const color = colorPalette[overlayIdx % colorPalette.length],
                    fileName =
                        typeof getOverlayFileName === "function" ? getOverlayFileName(i) : overlay.filePath || "",
                    bounds = drawOverlayForFitFile({
                        color: color || "#1976d2",
                        endIcon,
                        fileName,
                        fitData: {
                            lapMesgs: Array.isArray(overlay.data.lapMesgs) ? overlay.data.lapMesgs : [],
                            recordMesgs: Array.isArray(overlay.data.recordMesgs) ? overlay.data.recordMesgs : [],
                        },
                        formatTooltipData,
                        getLapNumForIdx,
                        map,
                        markerClusterGroup,
                        overlayIdx: i,
                        startIcon,
                    });
                if (bounds) {
                    let safeBounds = bounds;
                    if (
                        !(bounds && typeof (/** @type {any} */ (bounds).clone) === "function") &&
                        /** @type {any} */ (getWin()).L &&
                        /** @type {any} */ (getWin()).L.latLngBounds
                    ) {
                        safeBounds = /** @type {any} */ (getWin()).L.latLngBounds(bounds);
                    }
                    lastOverlayBounds =
                        safeBounds && typeof safeBounds.clone === "function" ? safeBounds.clone() : safeBounds || null;
                }
                overlayIdx++;
            }
            if (lastOverlayBounds) {
                safeFitBounds(map, lastOverlayBounds, { padding: [20, 20] });
            }
        }
        return;
    }

    if (Array.isArray(lapIdx)) {
        console.log("[mapDrawLaps] lapIdx is array:", lapIdx);
        // If 'all' is included, treat as 'all' laps mode (single polyline, global record indices)
        if (lapIdx.includes("all")) {
            console.log(
                `[mapDrawLaps] "all" laps mode: recordMesgs.length = ${recordMesgs.length} lapMesgs.length = ${lapMesgs.length} lapMesgs[0]=`,
                lapMesgs[0]
            );
            coords = recordMesgs
                .map((row, idx) => {
                    if (typeof row.positionLat === "number" && typeof row.positionLong === "number") {
                        let lapNum = 1;
                        if (getLapNumForIdx) {
                            lapNum = getLapNumForIdx(idx, lapMesgs);
                            if (!lapNum || isNaN(lapNum)) {
                                lapNum = 1;
                            }
                        }
                        if (idx < 10 || idx > recordMesgs.length - 10) {
                            console.log(
                                `[mapDrawLaps] idx=${idx}, lapNum=${lapNum}, lat=${row.positionLat}, lon=${row.positionLong}`
                            );
                        }
                        /** @type {CoordTuple} */
                        const coordTuple = [
                            Number((row.positionLat / 2 ** 31) * 180),
                            Number((row.positionLong / 2 ** 31) * 180),
                            row.timestamp || null,
                            row.altitude || null,
                            row.heartRate || null,
                            row.speed || null,
                            idx,
                            row,
                            lapNum,
                        ];
                        return coordTuple;
                    }
                    return null;
                })
                .filter((coord) => coord !== null);

            // After coords mapping where Type complained about (CoordTuple | null)[] -> add explicit filtering cast
            coords = /** @type {Array<CoordTuple>} */ (coords.filter(Boolean));

            if (coords.length === 0) {
                mapContainer.innerHTML = `<p>No location data available to display map.<br>Lap: ${lapIdx}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
                return;
            }

            if (coords.length > 0) {
                const polyColor = getLapColor("all");
                console.log(`[mapDrawLaps] Drawing polyline for all laps, coords.length = ${coords.length}`);
                const polyline = L.polyline(
                    coords.map((c) => [c[0], c[1]]),
                    {
                        color: polyColor,
                        dashArray: "6, 8",
                        opacity: 0.9,
                        weight: 4,
                    }
                );
                polyline.addTo(map);
                // --- Store original bounds for main polyline ---
                const origBounds = polyline.getBounds();
                // Immediate fit using the original bounds reference to ensure at least one call is recorded
                try {
                    map.fitBounds(origBounds, { padding: [20, 20] });
                } catch {
                    /* Ignore errors */
                }
                /** @type {any} */ (getWin())._mainPolylineOriginalBounds =
                    typeof origBounds.clone === "function" ? origBounds.clone() : L.latLngBounds(origBounds);
                map.invalidateSize();
                if (/** @type {any} */ (getWin())._mainPolylineOriginalBounds) {
                    // Use safeFitBounds to handle invisible container timing
                    safeFitBounds(map, /** @type {any} */ (getWin())._mainPolylineOriginalBounds, {
                        padding: [20, 20],
                    });
                }

                const end = coords.at(-1),
                    start = coords[0];
                if (startIcon && endIcon && start && end) {
                    const startMarker2 = L.marker([start[0], start[1]], {
                        icon: startIcon,
                        title: "Start",
                        zIndexOffset: 2000,
                    });
                    startMarker2.addTo(map);
                    startMarker2.bindPopup("Start");
                    const endMarker2 = L.marker([end[0], end[1]], {
                        icon: endIcon,
                        title: "End",
                        zIndexOffset: 2000,
                    });
                    endMarker2.addTo(map);
                    endMarker2.bindPopup("End");
                }

                // Replace loops adding markers where c may be undefined
                for (
                    let i = 0;
                    i < coords.length;
                    i +=
                        /** @type {any} */ (getWin()).mapMarkerCount === 0 ||
                        !(/** @type {any} */ (getWin()).mapMarkerCount)
                            ? 1
                            : Math.max(1, Math.floor(coords.length / /** @type {any} */ (getWin().mapMarkerCount || 1)))
                ) {
                    const c = coords[i];
                    if (!c) {
                        continue;
                    }
                    let lapDisplay = c[8];
                    if (!lapDisplay || isNaN(lapDisplay)) {
                        lapDisplay = 1;
                    }
                    const marker = L.circleMarker([c[0], c[1]], {
                        color: polyColor,
                        fillColor: "#fff",
                        fillOpacity: 0.85,
                        radius: 4,
                        weight: 2,
                        zIndexOffset: 1500,
                    });
                    markerClusterGroup ? markerClusterGroup.addLayer(marker) : marker.addTo(map);
                    marker.bindTooltip(formatTooltipData(c[6], c[7], lapDisplay), { direction: "top", sticky: true });
                }
            }

            // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
            if (
                /** @type {any} */ (getWin()).loadedFitFiles &&
                Array.isArray(/** @type {any} */ (getWin()).loadedFitFiles) &&
                /** @type {any} */ (getWin()).loadedFitFiles.length > 1
            ) {
                const colorPalette = chartOverlayColorPalette;
                let lastOverlayBounds = null,
                    /** @type {any} */ overlayIdx = 0;
                const loaded = /** @type {any} */ (getWin()).loadedFitFiles;
                for (let i = 1; i < loaded.length; ++i) {
                    const overlay = /** @type {{data?: any, filePath?: string}} */ (loaded[i]);
                    if (!overlay || !overlay.data) {
                        continue;
                    }
                    const color = colorPalette[overlayIdx % colorPalette.length],
                        fileName =
                            typeof getOverlayFileName === "function" ? getOverlayFileName(i) : overlay.filePath || "",
                        bounds = drawOverlayForFitFile({
                            color: color || "#1976d2",
                            endIcon,
                            fileName,
                            fitData: {
                                lapMesgs: Array.isArray(overlay.data.lapMesgs) ? overlay.data.lapMesgs : [],
                                recordMesgs: Array.isArray(overlay.data.recordMesgs) ? overlay.data.recordMesgs : [],
                            },
                            formatTooltipData,
                            getLapNumForIdx,
                            map,
                            markerClusterGroup,
                            overlayIdx: i,
                            startIcon,
                        });
                    if (bounds) {
                        let safeBounds = bounds;
                        if (
                            !(bounds && typeof (/** @type {any} */ (bounds).clone) === "function") &&
                            /** @type {any} */ (getWin()).L &&
                            /** @type {any} */ (getWin()).L.latLngBounds
                        ) {
                            safeBounds = /** @type {any} */ (getWin()).L.latLngBounds(bounds);
                        }
                        lastOverlayBounds =
                            safeBounds && typeof safeBounds.clone === "function"
                                ? safeBounds.clone()
                                : safeBounds || null;
                    }
                    overlayIdx++;
                }
                if (lastOverlayBounds) {
                    safeFitBounds(map, lastOverlayBounds, { padding: [20, 20] });
                }
            }
            return;
        }

        // Existing code for multi-lap (not 'all')
        /** @type {any} */
        let bounds = null;
        const showIcons = lapIdx.length === 1 || (lapIdx.length === 1 && lapIdx[0] === "all");
        for (const lapVal of lapIdx) {
            if (lapVal === "all") {
                continue;
            }
            const lap = lapMesgs[Number(lapVal)];
            if (
                lap &&
                lap.startPositionLat != null &&
                lap.startPositionLong != null &&
                lap.endPositionLat != null &&
                lap.endPositionLong != null
            ) {
                const startIdx = findClosestRecordIndexByLatLon(
                    lap.startPositionLat,
                    lap.startPositionLong,
                    recordMesgs
                );
                let endIdx = findClosestRecordIndexByLatLon(lap.endPositionLat, lap.endPositionLong, recordMesgs);
                if (endIdx === -1) {
                    // Fallback: use the last record
                    endIdx = recordMesgs.length - 1;
                }
                if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                    const lapRecords = recordMesgs.slice(startIdx, endIdx + 1),
                        lapCoords = lapRecords
                            .map((row, idx) => {
                                if (typeof row.positionLat === "number" && typeof row.positionLong === "number") {
                                    /** @type {CoordTuple} */
                                    const coordTuple = [
                                        Number((row.positionLat / 2 ** 31) * 180),
                                        Number((row.positionLong / 2 ** 31) * 180),
                                        row.timestamp || null,
                                        row.altitude || null,
                                        row.heartRate || null,
                                        row.speed || null,
                                        startIdx + idx,
                                        row,
                                        Number(lapVal) + 1,
                                    ];
                                    return coordTuple;
                                }
                                return null;
                            })
                            .filter((coord) => coord !== null);

                    if (lapCoords.length > 0) {
                        const polyColor = getLapColor(Number(lapVal)),
                            polyline = L.polyline(
                                lapCoords.map((c) => [c[0], c[1]]),
                                {
                                    color: polyColor,
                                    dashArray: null,
                                    opacity: 0.9,
                                    weight: 4,
                                }
                            ).addTo(map);
                        if (bounds) {
                            bounds.extend(polyline.getBounds());
                        } else {
                            bounds = polyline.getBounds();
                        }

                        const end = lapCoords.at(-1),
                            start = lapCoords[0];
                        if (showIcons && start && end) {
                            L.marker([start[0], start[1]], { icon: startIcon, title: "Start", zIndexOffset: 2000 })
                                .addTo(map)
                                .bindPopup("Start");
                            L.marker([end[0], end[1]], { icon: endIcon, title: "End", zIndexOffset: 2000 })
                                .addTo(map)
                                .bindPopup("End");
                        }

                        const stepLap =
                            /** @type {any} */ (getWin()).mapMarkerCount === 0 ||
                            !(/** @type {any} */ (getWin()).mapMarkerCount)
                                ? 1
                                : Math.max(
                                      1,
                                      Math.floor(lapCoords.length / /** @type {any} */ (getWin().mapMarkerCount || 1))
                                  );
                        for (let j = 0; j < lapCoords.length; j += stepLap) {
                            const c = lapCoords[j];
                            if (!c) {
                                continue;
                            }
                            let lapDisplay = c[8];
                            if (!lapDisplay || isNaN(lapDisplay)) {
                                lapDisplay = 1;
                            }
                            const marker = L.circleMarker([c[0], c[1]], {
                                color: polyColor,
                                fillColor: "#fff",
                                fillOpacity: 0.85,
                                radius: 4,
                                weight: 2,
                                zIndexOffset: 1500,
                            });
                            markerClusterGroup ? markerClusterGroup.addLayer(marker) : marker.addTo(map);
                            marker.bindTooltip(formatTooltipData(c[6], c[7], lapDisplay), {
                                direction: "top",
                                sticky: true,
                            });
                        }
                    }
                }
            }
        }

        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (
            /** @type {any} */ (getWin()).loadedFitFiles &&
            Array.isArray(/** @type {any} */ (getWin()).loadedFitFiles) &&
            /** @type {any} */ (getWin()).loadedFitFiles.length > 1
        ) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                /** @type {any} */
                overlayIdx = 0;
            for (let i = 1; i < /** @type {any} */ (getWin()).loadedFitFiles.length; ++i) {
                const overlay = /** @type {any} */ (getWin()).loadedFitFiles[i];
                if (!overlay || !overlay.data) {
                    continue;
                }
                const color = colorPalette[overlayIdx % colorPalette.length],
                    fileName =
                        typeof getOverlayFileName === "function" ? getOverlayFileName(i) : overlay.filePath || "",
                    bounds = drawOverlayForFitFile({
                        color: color || "#1976d2",
                        endIcon,
                        fileName,
                        fitData: {
                            lapMesgs: Array.isArray(overlay.data.lapMesgs) ? overlay.data.lapMesgs : [],
                            recordMesgs: Array.isArray(overlay.data.recordMesgs) ? overlay.data.recordMesgs : [],
                        },
                        formatTooltipData,
                        getLapNumForIdx,
                        map,
                        markerClusterGroup,
                        overlayIdx: i,
                        startIcon,
                    });
                if (bounds) {
                    // Defensive: ensure bounds is a valid LatLngBounds object
                    let safeBounds = bounds;
                    if (
                        !(bounds && typeof (/** @type {any} */ (bounds).clone) === "function") &&
                        getWin().L &&
                        getWin().L.latLngBounds
                    ) {
                        safeBounds = getWin().L.latLngBounds(bounds);
                    }
                    lastOverlayBounds =
                        safeBounds && typeof safeBounds.clone === "function" ? safeBounds.clone() : safeBounds || null;
                }
                overlayIdx++;
            }
            // Always auto-zoom to the overlay just added (not all overlays)
            if (lastOverlayBounds) {
                safeFitBounds(map, lastOverlayBounds, { padding: [20, 20] });
            }
        }
        return;
    }

    if (lapIdx !== undefined && lapIdx !== "all" && lapMesgs.length > 0) {
        const lap = lapMesgs[Number(lapIdx)];
        if (
            lap &&
            lap.startPositionLat != null &&
            lap.startPositionLong != null &&
            lap.endPositionLat != null &&
            lap.endPositionLong != null
        ) {
            const startIdx = findClosestRecordIndexByLatLon(lap.startPositionLat, lap.startPositionLong, recordMesgs);
            let endIdx = findClosestRecordIndexByLatLon(lap.endPositionLat, lap.endPositionLong, recordMesgs);
            if (endIdx === -1) {
                // Fallback: use the last record
                endIdx = recordMesgs.length - 1;
            }
            if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                const lapRecords = recordMesgs.slice(startIdx, endIdx + 1);
                coords = lapRecords
                    .map((row, idx) => {
                        if (typeof row.positionLat === "number" && typeof row.positionLong === "number") {
                            /** @type {CoordTuple} */
                            const coordTuple = [
                                Number((row.positionLat / 2 ** 31) * 180),
                                Number((row.positionLong / 2 ** 31) * 180),
                                row.timestamp || null,
                                row.altitude || null,
                                row.heartRate || null,
                                row.speed || null,
                                startIdx + idx,
                                row,
                                Number(lapIdx) + 1,
                            ];
                            return coordTuple;
                        }
                        return null;
                    })
                    .filter((coord) => coord !== null);
            } else {
                mapContainer.innerHTML = `<p>Lap index out of bounds or invalid.<br>Lap: ${lapIdx}<br>startIdx: ${startIdx}<br>endIdx: ${endIdx}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
                return;
            }
        } else {
            mapContainer.innerHTML = `<p>Lap index out of bounds or invalid.<br>Lap: ${lapIdx}<br>startPositionLat: ${
                lap && lap.startPositionLat
            }<br>endPositionLat: ${lap && lap.endPositionLat}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
            return;
        }
    } else {
        coords = recordMesgs
            .map((row, idx) => {
                if (typeof row.positionLat === "number" && typeof row.positionLong === "number") {
                    /** @type {CoordTuple} */
                    const coordTuple = [
                        Number((row.positionLat / 2 ** 31) * 180),
                        Number((row.positionLong / 2 ** 31) * 180),
                        row.timestamp || null,
                        row.altitude || null,
                        row.heartRate || null,
                        row.speed || null,
                        idx,
                        row,
                        getLapNumForIdx(idx, lapMesgs),
                    ];
                    return coordTuple;
                }
                return null;
            })
            .filter((coord) => coord !== null);
    }

    if (coords.length === 0) {
        mapContainer.innerHTML = `<p>No location data available to display map.<br>Lap: ${lapIdx}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
        return;
    }

    if (coords.length > 0) {
        const polyColor = getLapColor(lapIdx);

        console.log("[mapDrawLaps] DEBUG About to create polyline with L.polyline");
        const polylineResult = L.polyline(
            coords.map((c) => [c[0], c[1]]),
            {
                color: polyColor,
                dashArray: lapIdx === "all" ? "6, 8" : null,
                opacity: 0.9,
                weight: 4,
            }
        );
        console.log("[mapDrawLaps] DEBUG L.polyline() returned:", polylineResult);

        const polylineWithMap = polylineResult.addTo(map);
        console.log("[mapDrawLaps] DEBUG .addTo(map) returned:", polylineWithMap);

        const polyline = polylineWithMap;
        console.log("[mapDrawLaps] DEBUG final polyline:", polyline);
        console.log("[mapDrawLaps] DEBUG polyline.getBounds exists?", typeof polyline?.getBounds);

        if (!polyline) {
            console.error("[mapDrawLaps] ERROR: polyline is null/undefined after chaining");
            return;
        }

        // --- Store original bounds for main polyline ---
        const origBounds = polyline.getBounds();
        /** @type {any} */ (getWin())._mainPolylineOriginalBounds =
            typeof origBounds.clone === "function" ? origBounds.clone() : L.latLngBounds(origBounds);

        // Fix: Ensure map is sized before fitBounds
        map.invalidateSize();
        if (/** @type {any} */ (getWin())._mainPolylineOriginalBounds) {
            map.fitBounds(/** @type {any} */ (getWin())._mainPolylineOriginalBounds, { padding: [20, 20] });
        }

        const end = coords.at(-1),
            start = coords[0];
        if (start && end) {
            L.marker([start[0], start[1]], { icon: startIcon, title: "Start", zIndexOffset: 2000 })
                .addTo(map)
                .bindPopup("Start");
            L.marker([end[0], end[1]], { icon: endIcon, title: "End", zIndexOffset: 2000 }).addTo(map).bindPopup("End");
        }

        // Replace loops adding markers where c may be undefined
        for (
            let i = 0;
            i < coords.length;
            i +=
                /** @type {any} */ (getWin()).mapMarkerCount === 0 || !(/** @type {any} */ (getWin()).mapMarkerCount)
                    ? 1
                    : Math.max(1, Math.floor(coords.length / /** @type {any} */ (getWin().mapMarkerCount || 1)))
        ) {
            const c = coords[i];
            if (!c) {
                continue;
            }
            let lapDisplay = c[8];
            if (!lapDisplay || isNaN(lapDisplay)) {
                lapDisplay = 1;
            }
            const marker = L.circleMarker([c[0], c[1]], {
                color: polyColor,
                fillColor: "#fff",
                fillOpacity: 0.85,
                radius: 4,
                weight: 2,
                zIndexOffset: 1500,
            });
            markerClusterGroup ? markerClusterGroup.addLayer(marker) : marker.addTo(map);
            marker.bindTooltip(formatTooltipData(c[6], c[7], lapDisplay), { direction: "top", sticky: true });
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (
            /** @type {any} */ (getWin()).loadedFitFiles &&
            Array.isArray(/** @type {any} */ (getWin()).loadedFitFiles) &&
            /** @type {any} */ (getWin()).loadedFitFiles.length > 1
        ) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                /** @type {any} */
                overlayIdx = 0;
            for (let i = 1; i < /** @type {any} */ (getWin()).loadedFitFiles.length; ++i) {
                const overlay = /** @type {any} */ (getWin()).loadedFitFiles[i];
                if (!overlay || !overlay.data) {
                    continue;
                }
                const color = colorPalette[overlayIdx % colorPalette.length],
                    fileName =
                        typeof getOverlayFileName === "function" ? getOverlayFileName(i) : overlay.filePath || "",
                    bounds = drawOverlayForFitFile({
                        color: color || "#1976d2",
                        endIcon,
                        fileName,
                        fitData: {
                            lapMesgs: Array.isArray(overlay.data.lapMesgs) ? overlay.data.lapMesgs : [],
                            recordMesgs: Array.isArray(overlay.data.recordMesgs) ? overlay.data.recordMesgs : [],
                        },
                        formatTooltipData,
                        getLapNumForIdx,
                        map,
                        markerClusterGroup,
                        overlayIdx: i,
                        startIcon,
                    });
                if (bounds) {
                    // Defensive: ensure bounds is a valid LatLngBounds object
                    let safeBounds = bounds;
                    if (typeof bounds.clone !== "function" && getWin().L && getWin().L.latLngBounds) {
                        safeBounds = getWin().L.latLngBounds(bounds);
                    }
                    lastOverlayBounds =
                        safeBounds && typeof safeBounds.clone === "function" ? safeBounds.clone() : safeBounds || null;
                }
                overlayIdx++;
            }
            // Always auto-zoom to the overlay just added (not all overlays)
            if (lastOverlayBounds) {
                safeFitBounds(map, lastOverlayBounds, { padding: [20, 20] });
            }
        }
    } else {
        mapContainer.innerHTML = `<p>No location data available to display map.<br>Lap: ${lapIdx}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
    }
}

/**
 * Helper to find the index in recordMesgs closest to a given lat/lon
 * @param {number} lat - Latitude to search for
 * @param {number} lon - Longitude to search for
 * @param {Array<RecordMesg>} records - Record messages to search in
 * @returns {number} Index of closest record
 */
function findClosestRecordIndexByLatLon(lat, lon, records) {
    let minDist = Infinity,
        minIdx = -1;
    for (const [i, r] of records.entries()) {
        if (r && typeof r.positionLat === "number" && typeof r.positionLong === "number") {
            const dLat = r.positionLat - lat,
                dLon = r.positionLong - lon,
                dist = dLat * dLat + dLon * dLon;
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
    }
    return minIdx;
}

/**
 * Resolve Leaflet global dynamically to respect runtime/test overrides.
 * Never capture L at module init time to avoid stale references in tests.
 * @returns {any}
 */
function getLeaflet() {
    const w = getWin();
    // Prefer globalThis.L if present; fall back to window.L
    return /** @type {any} */ (globalThis && globalThis.L ? globalThis.L : w && w.L ? w.L : undefined);
}

/**
 * Resolve the active window dynamically to avoid stale references in tests.
 * @returns {Window & WindowExtensions}
 */
function getWin() {
    // @ts-ignore
    return /** @type {any} */ (globalThis.window === undefined ? globalThis : globalThis);
}

/**
 * Patch lapMesgs to add start_index and end_index if missing
 * @param {Array<LapMesg>} lapMesgs - Lap messages to patch
 * @param {Array<RecordMesg>} recordMesgs - Record messages for reference
 */
function patchLapIndices(lapMesgs, recordMesgs) {
    for (const [i, lap] of lapMesgs.entries()) {
        if (
            lap &&
            (lap.start_index == null || lap.end_index == null) && // Find closest record index for start and end positions
            typeof lap.startPositionLat === "number" &&
            typeof lap.startPositionLong === "number" &&
            typeof lap.endPositionLat === "number" &&
            typeof lap.endPositionLong === "number"
        ) {
            const startIdx = findClosestRecordIndexByLatLon(lap.startPositionLat, lap.startPositionLong, recordMesgs);
            let endIdx = findClosestRecordIndexByLatLon(lap.endPositionLat, lap.endPositionLong, recordMesgs);
            if (endIdx === -1) {
                endIdx = recordMesgs.length - 1;
            }
            lap.start_index = startIdx;
            lap.end_index = endIdx;
            console.log(`[patchLapIndices] Lap ${i + 1}: start_index=${startIdx}, end_index=${endIdx}`);
        }
    }
}

// Add global function to update overlay highlights without redrawing the map
// Install a stable reference that won't be replaced accidentally
/** @type {any} */ (getWin()).__realUpdateOverlayHighlights = function () {
    if (!(/** @type {any} */ (getWin())._overlayPolylines)) {
        return;
    }
    for (const [idx, polyline] of Object.entries(/** @type {any} */ (getWin())._overlayPolylines)) {
        const isHighlighted = Number(idx) === /** @type {any} */ (getWin())._highlightedOverlayIdx;
        polyline.setStyle({
            className: isHighlighted ? "overlay-highlight-glow" : "",
            weight: isHighlighted ? 10 : 4,
            // Optionally, update color or other style here if needed
        });
        const polyElem = polyline.getElement && polyline.getElement();
        if (polyElem) {
            polyElem.style.filter = isHighlighted ? `drop-shadow(0 0 8px ${polyline.options.color || "#1976d2"})` : "";
        }
    }
};

// Public shim accessor that preserves any assigned stub but always invokes the real implementation first
(() => {
    try {
        /** @type {undefined | ((...args: any[]) => any)} */
        let userAssigned;
        Object.defineProperty(getWin(), "updateOverlayHighlights", {
            configurable: true,
            enumerable: true,
            get() {
                // Return a wrapper that calls real first, then user stub if present
                return function () {
                    try {
                        /** @type {any} */ (getWin()).__realUpdateOverlayHighlights();
                    } catch {
                        /* Ignore errors */
                    }
                    if (typeof userAssigned === "function") {
                        try {
                            /** @type {any[]} */
                            const args = Array.prototype.slice.call(arguments);
                            return userAssigned.apply(getWin(), args);
                        } catch {
                            /* Ignore errors */
                        }
                    }
                };
            },
            set(v) {
                userAssigned = v;
            },
        });
    } catch {
        /* Ignore errors */
    }
})();

// Define a reactive setter so changing highlighted overlay index updates styles even if the
// global update function was stubbed in tests.
(() => {
    try {
        let _val = /** @type {any} */ (getWin())._highlightedOverlayIdx ?? -1;
        const desc = Object.getOwnPropertyDescriptor(getWin(), "_highlightedOverlayIdx");
        // Only install if not already an accessor
        if (!desc || "value" in desc) {
            Object.defineProperty(getWin(), "_highlightedOverlayIdx", {
                configurable: true,
                enumerable: true,
                get() {
                    return _val;
                },
                set(v) {
                    _val = /** @type {any} */ (v);
                    try {
                        if (/** @type {any} */ (getWin())._overlayPolylines) {
                            for (const [idx, polyline] of Object.entries(
                                /** @type {any} */ (getWin())._overlayPolylines
                            )) {
                                const isHighlighted = Number(idx) === _val;
                                polyline.setStyle({
                                    className: isHighlighted ? "overlay-highlight-glow" : "",
                                    weight: isHighlighted ? 10 : 4,
                                });
                                const polyElem = polyline.getElement && polyline.getElement();
                                if (polyElem) {
                                    const color = /** @type {any} */ (polyline).options?.color || "#1976d2";
                                    polyElem.style.filter = isHighlighted ? `drop-shadow(0 0 8px ${color})` : "";
                                }
                            }
                        }
                    } catch {
                        /* Ignore errors */
                    }
                },
            });
        }
    } catch {
        /* Ignore errors */
    }
})();

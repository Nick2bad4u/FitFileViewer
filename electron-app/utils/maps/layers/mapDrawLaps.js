import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import { getOverlayFileName } from "../../files/import/getOverlayFileName.js";
import { getGlobalData } from "../../state/domain/globalDataState.js";
import { getOverlayFiles, setOverlayFiles } from "../../state/domain/overlayState.js";
import { createMarkerSummary, getMarkerPreference } from "../helpers/mapMarkerSummary.js";
import { createMarkerSampler } from "../helpers/markerSampler.js";

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
export function drawOverlayForFitFile({
    endIcon,
    fileName,
    fitData,
    formatTooltipData,
    getLapNumForIdx,
    map,
    markerClusterGroup,
    markerSummary,
    overlayIdx,
    startIcon,
}) {
    const L = getLeaflet();
    const lapMesgs = /** @type {Array<LapMesg>} */ (fitData.lapMesgs || []);
    const recordMesgs = /** @type {Array<RecordMesg>} */ (fitData.recordMesgs || []);

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
        const sampler = createMarkerSampler(coords.length, getMarkerPreference());
        let renderedCount = 0;
        const isHighlighted =
            typeof overlayIdx === "number" && /** @type {any} */ (getWin())._highlightedOverlayIdx === overlayIdx;
        const paletteColor =
            Array.isArray(chartOverlayColorPalette) &&
                chartOverlayColorPalette.length > 0 &&
                typeof overlayIdx === "number"
                ? chartOverlayColorPalette[overlayIdx % chartOverlayColorPalette.length]
                : "#1976d2";
        // Filter coords to match marker filtering
        const filteredPolylineCoords = coords
            .map((c, idx) => (sampler.shouldInclude(idx) ? [c[0], c[1]] : null))
            .filter(Boolean);
        const polyline = L.polyline(
            filteredPolylineCoords,
            {
                className: isHighlighted ? "overlay-highlight-glow" : "",
                color: paletteColor,
                dashArray: null,
                opacity: 0.95,
                weight: isHighlighted ? 10 : 4,
            }
        ).addTo(map);

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

        const end = coords.at(-1);
        const [start] = coords;

        if (startIcon && endIcon && start && end) {
            const sMarker = L.marker([start[0], start[1]], { icon: startIcon, title: "Start", zIndexOffset: 2000 });
            sMarker.addTo(map);
            sMarker.bindPopup("Start");
            const eMarker = L.marker([end[0], end[1]], { icon: endIcon, title: "End", zIndexOffset: 2000 });
            eMarker.addTo(map);
            eMarker.bindPopup("End");
        }

        for (const [coordinateIdx, c] of coords.entries()) {
            if (!c || !sampler.shouldInclude(coordinateIdx)) {
                continue;
            }
            const marker = L.circleMarker([c[0], c[1]], {
                color: paletteColor || "#1976d2",
                fillColor: "#fff",
                fillOpacity: 0.9,
                radius: 6,
                weight: 3,
                zIndexOffset: 1500,
            });
            if (markerClusterGroup) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }

            let lapDisplay;
            if (getLapNumForIdx && fitData && Array.isArray(fitData.lapMesgs) && fitData.lapMesgs.length > 0) {
                lapDisplay = getLapNumForIdx(c[6], /** @type {any} */(fitData.lapMesgs));
            } else {
                lapDisplay = c[8] || 1;
            }

            let tooltip = formatTooltipData ? formatTooltipData(c[6], c[7], lapDisplay, recordMesgs) : "";
            if (fileName) {
                tooltip = `<b>${fileName}</b><br>${tooltip}`;
            }
            marker.bindTooltip(tooltip, { direction: "top", sticky: true });
            renderedCount += 1;
        }

        if (markerSummary) {
            markerSummary.record(coords.length, renderedCount);
        }

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
        try {
            if (polyBounds && typeof polyBounds.clone === "function") {
                const cloned = polyBounds.clone();
                if (cloned) resultBounds = cloned;
            }
        } catch {
            /* Ignore */
        }
        if (!resultBounds) {
            try {
                const lb = L && typeof L.latLngBounds === "function" ? L.latLngBounds(pts) : null;
                resultBounds = lb && typeof lb.clone === "function" ? lb.clone() : lb;
            } catch {
                // Ignore
            }
        }
        if (!resultBounds) {
            resultBounds = { extend: () => { } };
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

    const markerSummary = createMarkerSummary();
    markerSummary.reset();

    const recordMarkerSummary = (totalPoints, renderedPoints) => {
        markerSummary.record(totalPoints, renderedPoints);
    };

    const flushMarkerSummary = () => {
        markerSummary.flush();
    };

    // --- Always reset overlay polylines and main polyline at the start of a redraw ---
    /** @type {any} */ (getWin())._overlayPolylines = {};
    /** @type {any} */ (getWin())._mainPolylineOriginalBounds = undefined;
    /** @type {any} */ (getWin())._mainPolyline = undefined;

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

    const activeWindow = getWin();
    const activeMainIdx = typeof activeWindow._activeMainFileIdx === "number" ? activeWindow._activeMainFileIdx : null;
    let overlayFiles = getOverlayFilesWithFallback();
    if (overlayFiles.length > 1 && typeof activeMainIdx === "number" && activeMainIdx > 0) {
        const normalizedIdx = Math.min(Math.max(activeMainIdx, 0), overlayFiles.length - 1);
        const mainEntry = overlayFiles[normalizedIdx];
        const filesToKeep = mainEntry ? [mainEntry] : overlayFiles.slice(0, 1);
        try {
            setOverlayFiles(filesToKeep, "mapDrawLaps.syncLoadedFitFiles");
            overlayFiles = getOverlayFilesWithFallback();
        } catch (error) {
            console.warn("[mapDrawLaps] Failed to sync loadedFitFiles state:", error);
        }
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
    const globalData = getGlobalDataWithFallback() || {};
    console.log("[mapDrawLaps] DEBUG globalData keys:", Object.keys(globalData || {}));

    const lapMesgsSource = Array.isArray(globalData?.lapMesgs) ? globalData.lapMesgs : [];
    const lapMesgs = /** @type {Array<LapMesg>} */ (
        lapMesgsSource.map((lap) => (lap && typeof lap === "object" ? { ...lap } : {}))
    );
    const recordMesgs = /** @type {Array<RecordMesg>} */ (
        Array.isArray(globalData?.recordMesgs) ? globalData.recordMesgs : []
    );

    patchLapIndices(lapMesgs, recordMesgs);

    const rawMarkerPreference = getMarkerPreference();
    const sanitizedPreference = Number.isFinite(rawMarkerPreference)
        ? Math.max(0, Math.floor(rawMarkerPreference))
        : 0;

    const renderableRecordIndices = recordMesgs.reduce((indices, row, idx) => {
        if (row && typeof row.positionLat === "number" && typeof row.positionLong === "number") {
            indices.push(idx);
        }
        return indices;
    }, /** @type {number[]} */([]));

    const totalRenderablePoints = renderableRecordIndices.length;
    const shouldRenderGlobalIndex = (() => {
        if (totalRenderablePoints <= 0) {
            return () => false;
        }
        if (sanitizedPreference === 0 || sanitizedPreference >= totalRenderablePoints) {
            return () => true;
        }
        const sampler = createMarkerSampler(totalRenderablePoints, sanitizedPreference);
        const sampledRecordIndices = new Set(
            sampler.indices
                .map((positionIdx) => renderableRecordIndices[positionIdx])
                .filter((val) => Number.isInteger(val))
        );
        return (index) => sampledRecordIndices.has(index);
    })();

    /**
     * Helper: Wait until map container is visible and sized before fitBounds
     * @param {any} map - Leaflet map instance
     * @param {any} bounds - Map bounds
     * @param {Object} [options={}] - Fit bounds options
     */
    function safeFitBounds(lmap, lBounds, options = {}) {
        // Attempt immediately
        try {
            lmap.fitBounds(lBounds, options);
        } catch {
            /* Ignore first attempt */
        }
        function tryFit() {
            try {
                if (
                    lmap._container &&
                    lmap._container.offsetParent !== null &&
                    lmap._container.clientWidth > 0 &&
                    lmap._container.clientHeight > 0
                ) {
                    try {
                        lmap.fitBounds(lBounds, options);
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
            flushMarkerSummary();
            return;
        }

        if (coords.length > 0) {
            const polyColor = getLapColor("all");
            console.log(`[mapDrawLaps] Drawing polyline for all laps, coords.length = ${coords.length}`);
            // Filter coords to match marker filtering
            const filteredPolylineCoords = coords
                .filter((c) => c && shouldRenderGlobalIndex(c[6]))
                .map((c) => [c[0], c[1]]);
            const polyline = L.polyline(
                filteredPolylineCoords,
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
            /** @type {any} */ (getWin())._mainPolyline = polyline;

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
                safeFitBounds(map, /** @type {any} */(getWin())._mainPolylineOriginalBounds, { padding: [20, 20] });
            }

            const end = coords.at(-1);
            const [start] = coords;
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

            let renderedAll = 0;
            for (const c of coords) {
                if (!c) {
                    continue;
                }
                const [lat, lng, _timestamp, _altitude, _heartRate, _speed, globalIdx, row, lapValRaw] = c;
                if (!shouldRenderGlobalIndex(globalIdx)) {
                    continue;
                }
                let lapDisplay = lapValRaw;
                if (!lapDisplay || Number.isNaN(lapDisplay)) {
                    lapDisplay = 1;
                }
                const marker = L.circleMarker([lat, lng], {
                    color: polyColor,
                    fillColor: "#fff",
                    fillOpacity: 0.95,
                    radius: 4,
                    weight: 3,
                    zIndexOffset: 1500,
                });
                // Always add directly to map (bypass clustering) for better visibility
                marker.addTo(map);
                marker.bindTooltip(formatTooltipData(globalIdx, row, lapDisplay), {
                    direction: "top",
                    sticky: true,
                });
                renderedAll += 1;
            }
            recordMarkerSummary(coords.length, renderedAll);
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        overlayFiles = getOverlayFilesWithFallback();
        if (overlayFiles.length > 1) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                overlayIdx = 0;
            for (let i = 1; i < overlayFiles.length; ++i) {
                const overlay = /** @type {{data?: any, filePath?: string}} */ (overlayFiles[i]);
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
                        markerSummary,
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
        flushMarkerSummary();
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
                flushMarkerSummary();
                return;
            }

            if (coords.length > 0) {
                const polyColor = getLapColor("all");
                console.log(`[mapDrawLaps] Drawing polyline for all laps, coords.length = ${coords.length}`);
                // Filter coords to match marker filtering
                const filteredPolylineCoords = coords
                    .filter((c) => c && shouldRenderGlobalIndex(c[6]))
                    .map((c) => [c[0], c[1]]);
                const polyline = L.polyline(
                    filteredPolylineCoords,
                    {
                        color: polyColor,
                        dashArray: "6, 8",
                        opacity: 0.9,
                        weight: 4,
                    }
                );
                polyline.addTo(map);
                /** @type {any} */ (getWin())._mainPolyline = polyline;
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
                    safeFitBounds(map, /** @type {any} */(getWin())._mainPolylineOriginalBounds, {
                        padding: [20, 20],
                    });
                }

                const end = coords.at(-1);
                const [start] = coords;
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

                let renderedAllArray = 0;
                for (const c of coords) {
                    if (!c) {
                        continue;
                    }
                    const [lat, lng, _timestamp, _altitude, _heartRate, _speed, globalIdx, row2, lapValRaw] = c;
                    if (!shouldRenderGlobalIndex(globalIdx)) {
                        continue;
                    }
                    let lapDisplay = lapValRaw;
                    if (!lapDisplay || Number.isNaN(lapDisplay)) {
                        lapDisplay = 1;
                    }
                    const marker = L.circleMarker([lat, lng], {
                        color: polyColor,
                        fillColor: "#fff",
                        fillOpacity: 0.95,
                        radius: 8,
                        weight: 3,
                        zIndexOffset: 1500,
                    });
                    // Always add directly to map (bypass clustering) for better visibility
                    marker.addTo(map);
                    marker.bindTooltip(formatTooltipData(globalIdx, row2, lapDisplay), {
                        direction: "top",
                        sticky: true,
                    });
                    renderedAllArray += 1;
                }
                recordMarkerSummary(coords.length, renderedAllArray);
            }

            // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
            overlayFiles = getOverlayFilesWithFallback();
            if (overlayFiles.length > 1) {
                const colorPalette = chartOverlayColorPalette;
                let lastOverlayBounds = null,
                    overlayIdx = 0;
                for (let i = 1; i < overlayFiles.length; ++i) {
                    const overlay = /** @type {{data?: any, filePath?: string}} */ (overlayFiles[i]);
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
                            markerSummary,
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
                        const polyColor = getLapColor(Number(lapVal));
                        // Filter coords to match marker filtering
                        const filteredPolylineCoords = lapCoords
                            .filter((c) => c && shouldRenderGlobalIndex(c[6]))
                            .map((c) => [c[0], c[1]]);
                        const polyline = L.polyline(
                            filteredPolylineCoords,
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

                        const end = lapCoords.at(-1);
                        const [start] = lapCoords;
                        if (showIcons && start && end) {
                            L.marker([start[0], start[1]], { icon: startIcon, title: "Start", zIndexOffset: 2000 })
                                .addTo(map)
                                .bindPopup("Start");
                            L.marker([end[0], end[1]], { icon: endIcon, title: "End", zIndexOffset: 2000 })
                                .addTo(map)
                                .bindPopup("End");
                        }

                        let renderedLap = 0;
                        for (const c of lapCoords) {
                            if (!c) {
                                continue;
                            }
                            const [lat, lng, _timestamp, _altitude, _heartRate, _speed, globalIdx, row3, lapValRaw] = c;
                            if (!shouldRenderGlobalIndex(globalIdx)) {
                                continue;
                            }
                            let lapDisplay = lapValRaw;
                            if (!lapDisplay || Number.isNaN(lapDisplay)) {
                                lapDisplay = 1;
                            }
                            const marker = L.circleMarker([lat, lng], {
                                color: polyColor,
                                fillColor: "#fff",
                                fillOpacity: 0.95,
                                radius: 8,
                                weight: 3,
                                zIndexOffset: 1500,
                            });
                            // Always add directly to map (bypass clustering) for better visibility
                            marker.addTo(map);
                            marker.bindTooltip(formatTooltipData(globalIdx, row3, lapDisplay), {
                                direction: "top",
                                sticky: true,
                            });
                            renderedLap += 1;
                        }
                        recordMarkerSummary(lapCoords.length, renderedLap);
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
            Array.isArray(/** @type {any} */(getWin()).loadedFitFiles) &&
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
                        typeof getOverlayFileName === "function" ? getOverlayFileName(i) : overlay.filePath || "";
                const overlayBounds = drawOverlayForFitFile({
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
                    markerSummary,
                    overlayIdx: i,
                    startIcon,
                });
                if (overlayBounds) {
                    // Defensive: ensure bounds is a valid LatLngBounds object
                    let safeBounds = overlayBounds;
                    if (
                        !(overlayBounds && typeof (/** @type {any} */ (overlayBounds).clone) === "function") &&
                        getWin().L &&
                        getWin().L.latLngBounds
                    ) {
                        safeBounds = getWin().L.latLngBounds(overlayBounds);
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
        flushMarkerSummary();
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
                flushMarkerSummary();
                return;
            }
        } else {
            mapContainer.innerHTML = `<p>Lap index out of bounds or invalid.<br>Lap: ${lapIdx}<br>startPositionLat: ${lap && lap.startPositionLat
                }<br>endPositionLat: ${lap && lap.endPositionLat}<br>recordMesgs: ${recordMesgs.length}<br>lapMesgs: ${lapMesgs.length}</p>`;
            flushMarkerSummary();
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
        flushMarkerSummary();
        return;
    }

    if (coords.length > 0) {
        const polyColor = getLapColor(lapIdx);

        console.log("[mapDrawLaps] DEBUG About to create polyline with L.polyline");
        // Filter coords to match marker filtering
        const filteredPolylineCoords = coords
            .filter((c) => c && shouldRenderGlobalIndex(c[6]))
            .map((c) => [c[0], c[1]]);
        const polylineResult = L.polyline(
            filteredPolylineCoords,
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
        /** @type {any} */ (getWin())._mainPolyline = polyline;
        console.log("[mapDrawLaps] DEBUG final polyline:", polyline);
        console.log("[mapDrawLaps] DEBUG polyline.getBounds exists?", typeof polyline?.getBounds);

        if (!polyline) {
            console.error("[mapDrawLaps] ERROR: polyline is null/undefined after chaining");
            flushMarkerSummary();
            return;
        }

        // --- Store original bounds for main polyline ---
        const origBounds = polyline.getBounds();
        /** @type {any} */ (getWin())._mainPolylineOriginalBounds =
            typeof origBounds.clone === "function" ? origBounds.clone() : L.latLngBounds(origBounds);

        // Fix: Ensure map is sized before fitBounds
        map.invalidateSize();
        if (/** @type {any} */ (getWin())._mainPolylineOriginalBounds) {
            map.fitBounds(/** @type {any} */(getWin())._mainPolylineOriginalBounds, { padding: [20, 20] });
        }

        const end = coords.at(-1);
        const [start] = coords;
        if (start && end) {
            L.marker([start[0], start[1]], { icon: startIcon, title: "Start", zIndexOffset: 2000 })
                .addTo(map)
                .bindPopup("Start");
            L.marker([end[0], end[1]], { icon: endIcon, title: "End", zIndexOffset: 2000 }).addTo(map).bindPopup("End");
        }

        let renderedSingle = 0;
        for (const c of coords) {
            if (!c) {
                continue;
            }
            const [lat, lng, _timestamp, _altitude, _heartRate, _speed, globalIdx, row4, lapValRaw] = c;
            if (!shouldRenderGlobalIndex(globalIdx)) {
                continue;
            }
            let lapDisplay = lapValRaw;
            if (!lapDisplay || Number.isNaN(lapDisplay)) {
                lapDisplay = 1;
            }
            const marker = L.circleMarker([lat, lng], {
                color: polyColor,
                fillColor: "#fff",
                fillOpacity: 0.95,
                radius: 8,
                weight: 3,
                zIndexOffset: 1500,
            });
            // Always add directly to map (bypass clustering) for better visibility
            marker.addTo(map);
            marker.bindTooltip(formatTooltipData(globalIdx, row4, lapDisplay), { direction: "top", sticky: true });
            renderedSingle += 1;
        }
        recordMarkerSummary(coords.length, renderedSingle);

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (
            /** @type {any} */ (getWin()).loadedFitFiles &&
            Array.isArray(/** @type {any} */(getWin()).loadedFitFiles) &&
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
function getGlobalDataWithFallback() {
    const stateData = getGlobalData();
    if (stateData && typeof stateData === "object") {
        return stateData;
    }
    const win = getWin();
    return win && typeof win === "object" ? win.globalData || null : null;
}

function getLeaflet() {
    const w = getWin();
    // Prefer globalThis.L if present; fall back to window.L
    return /** @type {any} */ (globalThis && globalThis.L ? globalThis.L : w && w.L ? w.L : undefined);
}

function getOverlayFilesWithFallback() {
    const stateFiles = getOverlayFiles();
    if (Array.isArray(stateFiles) && stateFiles.length > 0) {
        return stateFiles;
    }
    const win = getWin();
    if (win && Array.isArray(win.loadedFitFiles)) {
        return win.loadedFitFiles;
    }
    return Array.isArray(stateFiles) ? stateFiles : [];
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
    for (const [idx, polyline] of Object.entries(/** @type {any} */(getWin())._overlayPolylines)) {
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

    // Apply the same highlight styling to the main polyline when index 0 is selected
    try {
        const idx = /** @type {any} */ (getWin())._highlightedOverlayIdx;
        const main = /** @type {any} */ (getWin())._mainPolyline;
        if (main) {
            const isMainHighlighted = idx === 0;
            // Slightly subtler than overlays for main track
            if (typeof main.setStyle === "function") {
                main.setStyle({
                    className: isMainHighlighted ? "overlay-highlight-glow" : "",
                    weight: isMainHighlighted ? 9 : 4,
                    opacity: isMainHighlighted ? 0.92 : (main.options?.opacity ?? 0.9),
                });
            }
            if (isMainHighlighted && typeof main.bringToFront === "function") {
                try {
                    main.bringToFront();
                } catch {
                    /* ignore */
                }
            }
            const elem = main.getElement && main.getElement();
            if (elem) {
                const color = /** @type {any} */ (main).options?.color || "#1976d2";
                elem.style.filter = isMainHighlighted ? `drop-shadow(0 0 6px ${color})` : "";
            }
        }
    } catch {
        /* Ignore errors */
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
                return function (...args) {
                    try {
                        /** @type {any} */ (getWin()).__realUpdateOverlayHighlights();
                    } catch {
                        /* Ignore errors */
                    }
                    if (typeof userAssigned === "function") {
                        try {
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
                                /** @type {any} */(getWin())._overlayPolylines
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
                        // Also update main polyline brightness when highlighting index 0
                        try {
                            const main = /** @type {any} */ (getWin())._mainPolyline;
                            if (main) {
                                const isMainHighlighted = _val === 0;
                                if (typeof main.setStyle === "function") {
                                    main.setStyle({
                                        className: isMainHighlighted ? "overlay-highlight-glow" : "",
                                        weight: isMainHighlighted ? 9 : 4,
                                        opacity: isMainHighlighted ? 0.92 : (main.options?.opacity ?? 0.9),
                                    });
                                }
                                if (isMainHighlighted && typeof main.bringToFront === "function") {
                                    try {
                                        main.bringToFront();
                                    } catch {
                                        /* ignore */
                                    }
                                }
                                const elem = main.getElement && main.getElement();
                                if (elem) {
                                    const color = /** @type {any} */ (main).options?.color || "#1976d2";
                                    elem.style.filter = isMainHighlighted ? `drop-shadow(0 0 6px ${color})` : "";
                                }
                            }
                        } catch {
                            /* Ignore */
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

import { chartOverlayColorPalette } from "../../charts/theming/chartOverlayColorPalette.js";
import type * as Leaflet from "leaflet";
import { escapeHtml } from "../../dom/index.js";
import { getOverlayFileName } from "../../files/import/getOverlayFileName.js";
import { getGlobalData } from "../../state/core/globalDataStore.js";
import { setState } from "../../state/core/stateManager.js";
import {
    createMetricFilter,
    getMetricDefinition,
    type MapDataPointFilterConfig,
    type MetricRecord,
} from "../filters/mapMetricFilter.js";

type FitValue = unknown;

type LatLngTuple = [number, number];

type LeafletBoundsLike = Leaflet.LatLngBoundsExpression & {
    clone?: () => LeafletBoundsLike;
    extend: (bounds: unknown) => unknown;
};

type LeafletLayerLike = {
    addTo: (target: unknown) => LeafletLayerLike;
    bindPopup: (content: string) => LeafletLayerLike;
    bindTooltip: (
        content: string,
        options?: Record<string, unknown>
    ) => LeafletLayerLike;
    bringToFront?: () => unknown;
    getBounds: () => LeafletBoundsLike;
    getElement?: () => HTMLElement | SVGElement | null;
    on?: (eventName: string, listener: () => void) => unknown;
    options: {
        color?: string;
        opacity?: number;
        [key: string]: unknown;
    };
    setStyle: (options: Record<string, unknown>) => unknown;
};

type LayerTargetLike = Leaflet.Layer & {
    clearLayers?: () => unknown;
};

type MarkerClusterLike = {
    addLayer: (layer: unknown) => unknown;
    clearLayers?: () => unknown;
};

type MapLike = Leaflet.Map & {
    _container?: HTMLElement;
};

type LeafletRuntimeLike = {
    circleMarker: (
        latLng: LatLngTuple,
        options?: Record<string, unknown>
    ) => LeafletLayerLike;
    featureGroup?: () => LayerTargetLike;
    latLngBounds: (latLngs: unknown) => LeafletBoundsLike;
    layerGroup?: () => LayerTargetLike;
    marker: (
        latLng: LatLngTuple,
        options?: Record<string, unknown>
    ) => LeafletLayerLike;
    polyline: (
        latLngs: LatLngTuple[],
        options?: Record<string, unknown>
    ) => LeafletLayerLike;
};

type FitDataLike = {
    lapMesgs?: LapMesg[];
    recordMesgs?: RecordMesg[];
};

type LoadedFitFileLike = {
    data?: FitDataLike;
    filePath?: string;
};

type MapDrawWindowLike = typeof globalThis & {
    __realUpdateOverlayHighlights?: () => unknown;
    _activeMainFileIdx?: number;
    _ffvActivityLayerGroup?: LayerTargetLike | null;
    _ffvDataPointMarkers?: LeafletLayerLike[];
    _highlightedOverlayIdx?: number;
    _mainPolyline?: LeafletLayerLike | undefined;
    _mainPolylineOriginalBounds?: LeafletBoundsLike | undefined;
    _overlayPolylines?: Record<string, LeafletLayerLike>;
    L?: LeafletRuntimeLike;
    loadedFitFiles?: LoadedFitFileLike[];
    mapDataPointFilter?: MapDataPointFilterConfig | null;
    mapDataPointFilterLastResult?: MetricFilterSummary | null;
    mapMarkerCount?: number;
    updateOverlayHighlights?: (...args: unknown[]) => unknown;
};

type MetricFilterSummary = {
    applied: boolean;
    appliedMax?: number | null;
    appliedMin?: number | null;
    coverage?: number;
    maxCandidate?: number | null;
    metric?: string | null;
    metricLabel?: string | null;
    minCandidate?: number | null;
    mode?: string;
    percent?: number;
    reason?: string | null;
    selectedCount?: number;
    threshold?: number | null;
    totalCandidates?: number;
};

type CoordTuple = [
    number,
    number,
    number | null,
    number | null,
    number | null,
    number | null,
    number,
    RecordMesg,
    number,
];

type RecordMesg = MetricRecord & {
    altitude?: number;
    heartRate?: number;
    positionLat?: number;
    positionLong?: number;
    speed?: number;
    timestamp?: number;
    [key: string]: FitValue;
};

type LapMesg = {
    end_index?: number;
    endPositionLat?: number;
    endPositionLong?: number;
    start_index?: number;
    startPositionLat?: number;
    startPositionLong?: number;
    [key: string]: FitValue;
};

type DrawOverlayForFitFileOptions = {
    color?: string | undefined;
    endIcon?: unknown;
    fileName?: string | undefined;
    fitData?: FitDataLike | undefined;
    formatTooltipData?:
        | ((
              pointIndex: number,
              row: RecordMesg,
              lapNumber: number,
              records?: RecordMesg[]
          ) => string)
        | undefined;
    getLapNumForIdx?: (
        pointIndex: number,
        lapMesgs: LapMesg[]
    ) => null | number | undefined;
    map: MapLike;
    markerClusterGroup?: MarkerClusterLike | null | undefined;
    overlayIdx?: number | undefined;
    startIcon?: unknown;
};

type MapDrawLapsIndex = number | string | Array<number | string>;

type MapDrawLapsOptions = {
    baseLayers?: unknown;
    endIcon?: unknown;
    formatTooltipData: (
        pointIndex: number,
        row: RecordMesg,
        lapNumber: number,
        records?: RecordMesg[]
    ) => string;
    getLapColor: (lapIndex: number | string) => string;
    getLapNumForIdx: (
        pointIndex: number,
        lapMesgs: LapMesg[]
    ) => null | number | undefined;
    map: MapLike;
    mapContainer: HTMLElement;
    markerClusterGroup?: MarkerClusterLike | null | undefined;
    startIcon?: unknown;
    [key: string]: unknown;
};

type AddLapDataPointMarkerOptions = {
    activityLayerTarget: unknown;
    coord: CoordTuple;
    formatTooltipData: MapDrawLapsOptions["formatTooltipData"];
    leaflet: LeafletRuntimeLike;
    markerClusterGroup?: MarkerClusterLike | null | undefined;
    polyColor: string;
    recordMesgs: RecordMesg[];
    registerDataPointMarker: (marker: LeafletLayerLike) => void;
};

/**
 * Draw an overlay activity track for a loaded FIT file.
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
}: DrawOverlayForFitFileOptions): LeafletBoundsLike | null {
    const L = getLeaflet();
    const sourceFitData = fitData ?? {};
    const lapMesgs = asLapMesgs(sourceFitData.lapMesgs);
    const recordMesgs = asRecordMesgs(sourceFitData.recordMesgs);

    patchLapIndices(lapMesgs, recordMesgs);

    const coords = recordMesgs
        .map((row: RecordMesg, idx: number) => {
            if (
                typeof row.positionLat === "number" &&
                typeof row.positionLong === "number"
            ) {
                return [
                    Number((row.positionLat / 2 ** 31) * 180),
                    Number((row.positionLong / 2 ** 31) * 180),
                    row.timestamp || null,
                    row.altitude || null,
                    row.heartRate || null,
                    row.speed || null,
                    idx,
                    row,
                    (getLapNumForIdx ? getLapNumForIdx(idx, lapMesgs) : 1) ?? 1,
                ] as CoordTuple;
            }
            return null;
        })
        .filter((coord): coord is CoordTuple => coord !== null);

    if (coords.length === 0) {
        console.warn(
            `[drawOverlayForFitFile] No valid location data in overlay file: ${fileName || ""}`
        );
        return null;
    }

    if (coords.length > 0) {
        const isHighlighted =
            typeof overlayIdx === "number" &&
            getWin()._highlightedOverlayIdx === overlayIdx;
        const paletteColor =
            Array.isArray(chartOverlayColorPalette) &&
            chartOverlayColorPalette.length > 0 &&
            typeof overlayIdx === "number"
                ? chartOverlayColorPalette[
                      overlayIdx % chartOverlayColorPalette.length
                  ]
                : "#1976d2";
        const polyline = L.polyline(
            coords.map((c: CoordTuple) => [c[0], c[1]]),
            buildPolylineOptions({
                className: isHighlighted ? "overlay-highlight-glow" : "",
                color: paletteColor,
                dashArray: null,
                opacity: 0.95,
                weight: isHighlighted ? 10 : 4,
            })
        ).addTo(map);

        if (typeof overlayIdx === "number") {
            const overlayPolylines = getWin()._overlayPolylines ?? {};
            getWin()._overlayPolylines = overlayPolylines;
            overlayPolylines[String(overlayIdx)] = polyline;
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
            const sMarker = L.marker([start[0], start[1]], {
                icon: startIcon,
                title: "Start",
                zIndexOffset: 2000,
            });
            sMarker.addTo(map);
            sMarker.bindPopup("Start");
            const eMarker = L.marker([end[0], end[1]], {
                icon: endIcon,
                title: "End",
                zIndexOffset: 2000,
            });
            eMarker.addTo(map);
            eMarker.bindPopup("End");
        }

        const markerCoords = selectMarkerCoordinatesForDataset(coords, false);
        for (const c of markerCoords) {
            const marker = L.circleMarker([c[0], c[1]], {
                // High-contrast breadcrumb style: white ring + colored fill.
                color: "#ffffff",
                opacity: 0.95,
                fillColor: paletteColor || "#1976d2",
                fillOpacity: 0.9,
                radius: 3.5,
                weight: 2,
                zIndexOffset: 1500,
            });
            // Improve visual quality of the breadcrumb points: subtle outer glow.
            if (marker && typeof marker.on === "function") {
                marker.on("add", () => {
                    try {
                        const el = marker.getElement && marker.getElement();
                        if (el instanceof SVGElement) {
                            el.style.filter = `drop-shadow(0 0 4px ${paletteColor || "#1976d2"})`;
                        }
                    } catch {
                        /* ignore */
                    }
                });
            }
            if (markerClusterGroup) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }

            const lapDisplay =
                getLapNumForIdx &&
                sourceFitData &&
                Array.isArray(sourceFitData.lapMesgs) &&
                sourceFitData.lapMesgs.length > 0
                    ? (getLapNumForIdx(c[6], sourceFitData.lapMesgs) ?? 1)
                    : c[8] || 1;

            let tooltip = formatTooltipData
                ? formatTooltipData(c[6], c[7], lapDisplay, recordMesgs)
                : "";
            if (fileName) {
                const safeFileName = escapeHtml(fileName);
                tooltip = `<b>${safeFileName}</b><br>${tooltip}`;
            }
            marker.bindTooltip(tooltip, { direction: "top", sticky: true });
        }

        let resultBounds = null;
        let polyBounds;
        try {
            polyBounds = polyline.getBounds();
        } catch {
            /* Ignore */
        }
        const pts = coords.map((c: CoordTuple) => [c[0], c[1]]);
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
                const lb =
                    L && typeof L.latLngBounds === "function"
                        ? L.latLngBounds(pts)
                        : null;
                resultBounds =
                    lb && typeof lb.clone === "function" ? lb.clone() : lb;
            } catch {
                // Ignore
            }
        }
        return resultBounds;
    }
    return null;
}

/**
 * Draw one lap, multiple laps, or the full activity track on the Leaflet map.
 */
export function mapDrawLaps(
    requestedLapIdx: MapDrawLapsIndex,
    {
        endIcon,
        formatTooltipData,
        getLapColor,
        getLapNumForIdx,
        map,
        mapContainer,
        markerClusterGroup,
        startIcon,
    }: MapDrawLapsOptions
): void {
    // Resolve L dynamically for this invocation
    const L = getLeaflet();
    let lapIdx = requestedLapIdx;

    const win = getWin();
    let activityGroup = win._ffvActivityLayerGroup;

    if (!activityGroup || typeof activityGroup.clearLayers !== "function") {
        try {
            if (typeof L.featureGroup === "function") {
                activityGroup = L.featureGroup();
            } else if (typeof L.layerGroup === "function") {
                activityGroup = L.layerGroup();
            } else {
                activityGroup = null;
            }
        } catch {
            activityGroup = null;
        }

        if (activityGroup) {
            win._ffvActivityLayerGroup = activityGroup;
        }
    }

    // Ensure the group is attached to this map instance and clear previous activity layers.
    if (activityGroup) {
        try {
            if (typeof map.hasLayer === "function") {
                if (
                    !map.hasLayer(activityGroup) &&
                    typeof activityGroup.addTo === "function"
                ) {
                    activityGroup.addTo(map);
                }
            } else if (typeof activityGroup.addTo === "function") {
                // Best-effort for tests/mocks.
                activityGroup.addTo(map);
            }
        } catch {
            /* ignore */
        }

        try {
            activityGroup.clearLayers?.();
        } catch {
            /* ignore */
        }
    }

    // Use the activity group when available; fall back to map for defensive behavior in mocks.
    const activityLayerTarget: unknown = activityGroup || map;

    // --- Always reset main polyline state at the start of a redraw ---
    getWin()._mainPolylineOriginalBounds = undefined;
    getWin()._mainPolyline = undefined;
    getWin()._ffvDataPointMarkers = [];

    const registerDataPointMarker = (marker: LeafletLayerLike): void => {
        try {
            const reg = getWin()._ffvDataPointMarkers;
            if (Array.isArray(reg)) {
                reg.push(marker);
            }
        } catch {
            /* ignore */
        }
    };

    const bringDataPointMarkersToFront = () => {
        try {
            const reg = getWin()._ffvDataPointMarkers;
            if (!Array.isArray(reg)) {
                return;
            }
            for (const m of reg) {
                try {
                    m?.bringToFront?.();
                } catch {
                    /* ignore */
                }
            }
        } catch {
            /* ignore */
        }
    };

    // Clear clustered markers if used (the cluster layer itself should remain on the map).
    if (
        markerClusterGroup &&
        typeof markerClusterGroup.clearLayers === "function"
    ) {
        markerClusterGroup.clearLayers();
    }

    // --- If switching main files, ensure overlays are cleared and only the new main file is plotted ---
    if (
        Array.isArray(win.loadedFitFiles) &&
        win.loadedFitFiles.length > 1 &&
        typeof win._activeMainFileIdx === "number" &&
        win._activeMainFileIdx > 0
    ) {
        // Remove overlays from loadedFitFiles except the main file
        const activeMainFile = win.loadedFitFiles[win._activeMainFileIdx];
        win.loadedFitFiles = activeMainFile ? [activeMainFile] : [];
        try {
            const files = [...win.loadedFitFiles];
            setState("globalData.loadedFitFiles", files, {
                source: "mapDrawLaps",
            });
        } catch (error) {
            console.warn(
                "[mapDrawLaps] Failed to sync loadedFitFiles state:",
                error
            );
        }
    }

    console.log(
        "[mapDrawLaps] ENTERED FUNCTION, lapIdx =",
        lapIdx,
        "type:",
        typeof lapIdx,
        Array.isArray(lapIdx) ? "isArray" : "notArray"
    );

    let coords: CoordTuple[];
    const currentFitData = getGlobalData<FitDataLike>();
    const lapMesgs = asLapMesgs(currentFitData?.lapMesgs),
        recordMesgs = asRecordMesgs(currentFitData?.recordMesgs);

    patchLapIndices(lapMesgs, recordMesgs);

    function safeFitBounds(
        lmap: MapLike,
        lBounds: LeafletBoundsLike,
        options: Leaflet.FitBoundsOptions = {}
    ): void {
        // Attempt immediately
        try {
            lmap.fitBounds(lBounds, options);
        } catch {
            /* Ignore first attempt */
        }
        let fitBoundsRetryTimer: ReturnType<typeof setTimeout> | undefined;
        const scheduleFitRetry = (): void => {
            if (fitBoundsRetryTimer !== undefined) {
                clearTimeout(fitBoundsRetryTimer);
            }
            fitBoundsRetryTimer = setTimeout(() => {
                fitBoundsRetryTimer = undefined;
                tryFit();
            }, 50);
        };

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
                    scheduleFitRetry();
                }
            } catch {
                scheduleFitRetry();
            }
        }
        scheduleFitRetry();
    }
    // --- Store original main polyline bounds for zooming ---
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
            for (let testIdx = 0; testIdx < 3; testIdx += 1) {
                const lapNum = getLapNumForIdx(testIdx, lapMesgs) ?? 1;
                console.log(
                    `[mapDrawLaps] getLapNumForIdx(${testIdx}, lapMesgs) =`,
                    lapNum
                );
            }
        }

        coords = recordMesgs
            .map((row, idx) => {
                if (
                    row &&
                    typeof row.positionLat === "number" &&
                    typeof row.positionLong === "number"
                ) {
                    let lapNum = 1;
                    if (getLapNumForIdx) {
                        lapNum = getLapNumForIdx(idx, lapMesgs) ?? 1;
                        if (!lapNum || Number.isNaN(lapNum)) {
                            lapNum = 1;
                        }
                    }
                    if (idx < 10 || idx > recordMesgs.length - 10) {
                        console.log(
                            `[mapDrawLaps] idx=${idx}, lapNum=${lapNum}, lat=${row.positionLat}, lon=${row.positionLong}`
                        );
                    }
                    return [
                        Number((row.positionLat / 2 ** 31) * 180),
                        Number((row.positionLong / 2 ** 31) * 180),
                        row.timestamp || null,
                        row.altitude || null,
                        row.heartRate || null,
                        row.speed || null,
                        idx,
                        row,
                        lapNum,
                    ] as CoordTuple;
                }
                return null;
            })
            .filter((coord): coord is CoordTuple => coord !== null);

        if (coords.length === 0) {
            renderMapInfoMessage(
                mapContainer,
                "No location data available to display map.",
                [
                    ["Lap", String(lapIdx)],
                    ["recordMesgs", String(recordMesgs.length)],
                    ["lapMesgs", String(lapMesgs.length)],
                ]
            );
            return;
        }

        if (coords.length > 0) {
            const polyColor = getLapColor("all");
            console.log(
                `[mapDrawLaps] Drawing polyline for all laps, coords.length = ${coords.length}`
            );
            const polyline = L.polyline(
                coords.map((c: CoordTuple) => [c[0], c[1]]),
                buildPolylineOptions({
                    color: polyColor,
                    dashArray: "6, 8",
                    opacity: 0.9,
                    weight: 4,
                })
            );
            // Avoid relying on addTo return value for mock compatibility
            polyline.addTo(activityLayerTarget);

            // Note: do not add main track to _overlayPolylines; only overlays belong there.
            getWin()._mainPolyline = polyline;

            // --- Store original bounds for main polyline ---
            const origBounds = polyline.getBounds();
            // Immediate fit using the original bounds reference to ensure at least one call is recorded
            try {
                map.fitBounds(origBounds, {
                    padding: [20, 20],
                });
            } catch {
                /* Ignore errors */
            }
            getWin()._mainPolylineOriginalBounds =
                typeof origBounds.clone === "function"
                    ? origBounds.clone()
                    : L.latLngBounds(origBounds);
            map.invalidateSize();
            const originalBounds = getWin()._mainPolylineOriginalBounds;
            if (originalBounds) {
                // Use safeFitBounds to handle invisible container timing and resized containers
                safeFitBounds(map, originalBounds, { padding: [20, 20] });
            }

            const end = coords.at(-1);
            const [start] = coords;
            if (startIcon && endIcon && start && end) {
                const startMarker = L.marker([start[0], start[1]], {
                    icon: startIcon,
                    title: "Start",
                    zIndexOffset: 2000,
                });
                startMarker.addTo(activityLayerTarget);
                startMarker.bindPopup("Start");
                const endMarker = L.marker([end[0], end[1]], {
                    icon: endIcon,
                    title: "End",
                    zIndexOffset: 2000,
                });
                endMarker.addTo(activityLayerTarget);
                endMarker.bindPopup("End");
            }

            // Replace loops adding markers where c may be undefined
            const markerCoords = selectMarkerCoordinatesForDataset(coords);
            console.log(
                `[mapDrawLaps] Creating markers: requested=${getWin().mapMarkerCount ?? ""} actual=${markerCoords.length}, coords.length=${coords.length}`
            );

            let markersCreated = 0;
            for (const c of markerCoords) {
                if (!c) {
                    continue;
                }
                const idx = c[6],
                    lapVal = c[8],
                    row = c[7];
                let lapDisplay = lapVal;
                if (!lapDisplay || Number.isNaN(lapDisplay)) {
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
                if (markerClusterGroup) {
                    markerClusterGroup.addLayer(marker);
                } else {
                    marker.addTo(activityLayerTarget);
                }
                // Always keep points above the track.
                try {
                    marker.bringToFront?.();
                } catch {
                    /* ignore */
                }
                registerDataPointMarker(marker);
                marker.bindTooltip(
                    formatTooltipData(idx, row, lapDisplay, recordMesgs),
                    {
                        direction: "top",
                        sticky: true,
                    }
                );
                markersCreated += 1;
            }
            console.log(
                `[mapDrawLaps] Created ${markersCreated} markers total`
            );

            // If any later code brings the polyline forward (e.g. highlights), re-assert marker z-order.
            bringDataPointMarkersToFront();
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (getLoadedFitFiles().length > 1) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                overlayIdx = 0;
            const loaded = getLoadedFitFiles();
            for (let i = 1; i < loaded.length; i += 1) {
                const overlay = loaded[i];
                if (!overlay || !overlay.data) {
                    continue;
                }
                const color = colorPalette[overlayIdx % colorPalette.length],
                    fileName =
                        typeof getOverlayFileName === "function"
                            ? getOverlayFileName(i)
                            : overlay.filePath || "",
                    bounds = drawOverlayForFitFile({
                        color: color || "#1976d2",
                        endIcon,
                        fileName,
                        fitData: {
                            lapMesgs: Array.isArray(overlay.data.lapMesgs)
                                ? overlay.data.lapMesgs
                                : [],
                            recordMesgs: Array.isArray(overlay.data.recordMesgs)
                                ? overlay.data.recordMesgs
                                : [],
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
                    const winLeaflet = getWin().L;
                    if (
                        (!bounds || typeof bounds.clone !== "function") &&
                        winLeaflet
                    ) {
                        safeBounds = winLeaflet.latLngBounds(bounds);
                    }
                    lastOverlayBounds =
                        safeBounds && typeof safeBounds.clone === "function"
                            ? safeBounds.clone()
                            : safeBounds || null;
                }
                overlayIdx += 1;
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
                .map((row: RecordMesg, idx: number) => {
                    if (
                        typeof row.positionLat === "number" &&
                        typeof row.positionLong === "number"
                    ) {
                        let lapNum = 1;
                        if (getLapNumForIdx) {
                            lapNum = getLapNumForIdx(idx, lapMesgs) ?? 1;
                            if (!lapNum || Number.isNaN(lapNum)) {
                                lapNum = 1;
                            }
                        }
                        if (idx < 10 || idx > recordMesgs.length - 10) {
                            console.log(
                                `[mapDrawLaps] idx=${idx}, lapNum=${lapNum}, lat=${row.positionLat}, lon=${row.positionLong}`
                            );
                        }
                        return [
                            Number((row.positionLat / 2 ** 31) * 180),
                            Number((row.positionLong / 2 ** 31) * 180),
                            row.timestamp || null,
                            row.altitude || null,
                            row.heartRate || null,
                            row.speed || null,
                            idx,
                            row,
                            lapNum,
                        ] as CoordTuple;
                    }
                    return null;
                })
                .filter((coord): coord is CoordTuple => coord !== null);

            if (coords.length === 0) {
                renderMapInfoMessage(
                    mapContainer,
                    "No location data available to display map.",
                    [
                        ["Lap", String(lapIdx)],
                        ["recordMesgs", String(recordMesgs.length)],
                        ["lapMesgs", String(lapMesgs.length)],
                    ]
                );
                return;
            }

            if (coords.length > 0) {
                const polyColor = getLapColor("all");
                console.log(
                    `[mapDrawLaps] Drawing polyline for all laps, coords.length = ${coords.length}`
                );
                const polyline = L.polyline(
                    coords.map((c: CoordTuple) => [c[0], c[1]]),
                    buildPolylineOptions({
                        color: polyColor,
                        dashArray: "6, 8",
                        opacity: 0.9,
                        weight: 4,
                    })
                );
                polyline.addTo(activityLayerTarget);
                getWin()._mainPolyline = polyline;
                // --- Store original bounds for main polyline ---
                const origBounds = polyline.getBounds();
                // Immediate fit using the original bounds reference to ensure at least one call is recorded
                try {
                    map.fitBounds(origBounds, { padding: [20, 20] });
                } catch {
                    /* Ignore errors */
                }
                getWin()._mainPolylineOriginalBounds =
                    typeof origBounds.clone === "function"
                        ? origBounds.clone()
                        : L.latLngBounds(origBounds);
                map.invalidateSize();
                const originalBounds = getWin()._mainPolylineOriginalBounds;
                if (originalBounds) {
                    // Use safeFitBounds to handle invisible container timing
                    safeFitBounds(map, originalBounds, { padding: [20, 20] });
                }

                const end = coords.at(-1);
                const [start] = coords;
                if (startIcon && endIcon && start && end) {
                    const startMarker2 = L.marker([start[0], start[1]], {
                        icon: startIcon,
                        title: "Start",
                        zIndexOffset: 2000,
                    });
                    startMarker2.addTo(activityLayerTarget);
                    startMarker2.bindPopup("Start");
                    const endMarker2 = L.marker([end[0], end[1]], {
                        icon: endIcon,
                        title: "End",
                        zIndexOffset: 2000,
                    });
                    endMarker2.addTo(activityLayerTarget);
                    endMarker2.bindPopup("End");
                }

                const markerCoords = selectMarkerCoordinatesForDataset(coords);
                for (const c of markerCoords) {
                    if (!c) {
                        continue;
                    }
                    const idx2 = c[6],
                        lapVal2 = c[8],
                        row2 = c[7];
                    let lapDisplay = lapVal2;
                    if (!lapDisplay || Number.isNaN(lapDisplay)) {
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
                    if (markerClusterGroup) {
                        markerClusterGroup.addLayer(marker);
                    } else {
                        marker.addTo(activityLayerTarget);
                    }
                    try {
                        marker.bringToFront?.();
                    } catch {
                        /* ignore */
                    }
                    registerDataPointMarker(marker);
                    marker.bindTooltip(
                        formatTooltipData(idx2, row2, lapDisplay, recordMesgs),
                        {
                            direction: "top",
                            sticky: true,
                        }
                    );
                }
            }

            // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
            if (getLoadedFitFiles().length > 1) {
                const colorPalette = chartOverlayColorPalette;
                let lastOverlayBounds = null,
                    overlayIdx = 0;
                const loaded = getLoadedFitFiles();
                for (let i = 1; i < loaded.length; i += 1) {
                    const overlay = loaded[i];
                    if (!overlay || !overlay.data) {
                        continue;
                    }
                    const color =
                            colorPalette[overlayIdx % colorPalette.length],
                        fileName =
                            typeof getOverlayFileName === "function"
                                ? getOverlayFileName(i)
                                : overlay.filePath || "",
                        bounds = drawOverlayForFitFile({
                            color: color || "#1976d2",
                            endIcon,
                            fileName,
                            fitData: {
                                lapMesgs: Array.isArray(overlay.data.lapMesgs)
                                    ? overlay.data.lapMesgs
                                    : [],
                                recordMesgs: Array.isArray(
                                    overlay.data.recordMesgs
                                )
                                    ? overlay.data.recordMesgs
                                    : [],
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
                        const winLeaflet = getWin().L;
                        if (
                            (!bounds || typeof bounds.clone !== "function") &&
                            winLeaflet
                        ) {
                            safeBounds = winLeaflet.latLngBounds(bounds);
                        }
                        lastOverlayBounds =
                            safeBounds && typeof safeBounds.clone === "function"
                                ? safeBounds.clone()
                                : safeBounds || null;
                    }
                    overlayIdx += 1;
                }
                if (lastOverlayBounds) {
                    safeFitBounds(map, lastOverlayBounds, {
                        padding: [20, 20],
                    });
                }
            }
            return;
        }

        // Existing code for multi-lap (not 'all')
        let bounds = null;
        const showIcons =
            lapIdx.length === 1 || (lapIdx.length === 1 && lapIdx[0] === "all");
        for (const lapVal of lapIdx) {
            if (lapVal === "all") {
                continue;
            }
            const lap = lapMesgs[Number(lapVal)];
            if (
                hasLapCoordinates(lap)
            ) {
                const startIdx = findClosestRecordIndexByLatLon(
                    lap.startPositionLat,
                    lap.startPositionLong,
                    recordMesgs
                );
                let endIdx = findClosestRecordIndexByLatLon(
                    lap.endPositionLat,
                    lap.endPositionLong,
                    recordMesgs
                );
                if (endIdx === -1) {
                    // Fallback: use the last record
                    endIdx = recordMesgs.length - 1;
                }
                if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                    const lapRecords = recordMesgs.slice(startIdx, endIdx + 1),
                        lapCoords = lapRecords
                            .map((row: RecordMesg, idx: number) => {
                                if (
                                    typeof row.positionLat === "number" &&
                                    typeof row.positionLong === "number"
                                ) {
                                    return [
                                        Number(
                                            (row.positionLat / 2 ** 31) * 180
                                        ),
                                        Number(
                                            (row.positionLong / 2 ** 31) * 180
                                        ),
                                        row.timestamp || null,
                                        row.altitude || null,
                                        row.heartRate || null,
                                        row.speed || null,
                                        startIdx + idx,
                                        row,
                                        Number(lapVal) + 1,
                                    ] as CoordTuple;
                                }
                                return null;
                            })
                            .filter(
                                (coord): coord is CoordTuple => coord !== null
                            );

                    if (lapCoords.length > 0) {
                        const polyColor = getLapColor(Number(lapVal)),
                            polyline = L.polyline(
                                lapCoords.map((c: CoordTuple) => [c[0], c[1]]),
                                buildPolylineOptions({
                                    color: polyColor,
                                    dashArray: null,
                                    opacity: 0.9,
                                    weight: 4,
                                })
                            ).addTo(activityLayerTarget);
                        if (bounds) {
                            bounds.extend(polyline.getBounds());
                        } else {
                            bounds = polyline.getBounds();
                        }

                        const end = lapCoords.at(-1);
                        const [start] = lapCoords;
                        if (showIcons && start && end) {
                            L.marker([start[0], start[1]], {
                                icon: startIcon,
                                title: "Start",
                                zIndexOffset: 2000,
                            })
                                .addTo(activityLayerTarget)
                                .bindPopup("Start");
                            L.marker([end[0], end[1]], {
                                icon: endIcon,
                                title: "End",
                                zIndexOffset: 2000,
                            })
                                .addTo(activityLayerTarget)
                                .bindPopup("End");
                        }

                        const markerCoords =
                            selectMarkerCoordinatesForDataset(lapCoords);
                        for (const c of markerCoords) {
                            addLapDataPointMarker({
                                activityLayerTarget,
                                coord: c,
                                formatTooltipData,
                                leaflet: L,
                                markerClusterGroup,
                                polyColor,
                                recordMesgs,
                                registerDataPointMarker,
                            });
                        }
                    }
                }
            }
        }

        if (bounds) {
            map.fitBounds(bounds, {
                padding: [20, 20],
            });
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (getLoadedFitFiles().length > 1) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                overlayIdx = 0;
            const loaded = getLoadedFitFiles();
            for (let i = 1; i < loaded.length; i += 1) {
                const overlay = loaded[i];
                if (!overlay || !overlay.data) {
                    continue;
                }
                const color = colorPalette[overlayIdx % colorPalette.length],
                    fileName =
                        typeof getOverlayFileName === "function"
                            ? getOverlayFileName(i)
                            : overlay.filePath || "";
                const overlayBounds = drawOverlayForFitFile({
                    color: color || "#1976d2",
                    endIcon,
                    fileName,
                    fitData: {
                        lapMesgs: Array.isArray(overlay.data.lapMesgs)
                            ? overlay.data.lapMesgs
                            : [],
                        recordMesgs: Array.isArray(overlay.data.recordMesgs)
                            ? overlay.data.recordMesgs
                            : [],
                    },
                    formatTooltipData,
                    getLapNumForIdx,
                    map,
                    markerClusterGroup,
                    overlayIdx: i,
                    startIcon,
                });
                if (overlayBounds) {
                    // Defensive: ensure bounds is a valid LatLngBounds object
                    let safeBounds = overlayBounds;
                    const winLeaflet = getWin().L;
                    if (
                        (!overlayBounds ||
                            typeof overlayBounds.clone !== "function") &&
                        winLeaflet
                    ) {
                        safeBounds = winLeaflet.latLngBounds(overlayBounds);
                    }
                    lastOverlayBounds =
                        safeBounds && typeof safeBounds.clone === "function"
                            ? safeBounds.clone()
                            : safeBounds || null;
                }
                overlayIdx += 1;
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
            hasLapCoordinates(lap)
        ) {
            const startIdx = findClosestRecordIndexByLatLon(
                lap.startPositionLat,
                lap.startPositionLong,
                recordMesgs
            );
            let endIdx = findClosestRecordIndexByLatLon(
                lap.endPositionLat,
                lap.endPositionLong,
                recordMesgs
            );
            if (endIdx === -1) {
                // Fallback: use the last record
                endIdx = recordMesgs.length - 1;
            }
            if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                const lapRecords = recordMesgs.slice(startIdx, endIdx + 1);
                coords = lapRecords
                    .map((row: RecordMesg, idx: number) => {
                        if (
                            typeof row.positionLat === "number" &&
                            typeof row.positionLong === "number"
                        ) {
                            return [
                                Number((row.positionLat / 2 ** 31) * 180),
                                Number((row.positionLong / 2 ** 31) * 180),
                                row.timestamp || null,
                                row.altitude || null,
                                row.heartRate || null,
                                row.speed || null,
                                startIdx + idx,
                                row,
                                Number(lapIdx) + 1,
                            ] as CoordTuple;
                        }
                        return null;
                    })
                    .filter((coord): coord is CoordTuple => coord !== null);
            } else {
                renderMapInfoMessage(
                    mapContainer,
                    "Lap index out of bounds or invalid.",
                    [
                        ["Lap", String(lapIdx)],
                        ["startIdx", String(startIdx)],
                        ["endIdx", String(endIdx)],
                        ["recordMesgs", String(recordMesgs.length)],
                        ["lapMesgs", String(lapMesgs.length)],
                    ]
                );
                return;
            }
        } else {
            renderMapInfoMessage(
                mapContainer,
                "Lap index out of bounds or invalid.",
                [
                    ["Lap", String(lapIdx)],
                    ["startPositionLat", String(lap && lap.startPositionLat)],
                    ["endPositionLat", String(lap && lap.endPositionLat)],
                    ["recordMesgs", String(recordMesgs.length)],
                    ["lapMesgs", String(lapMesgs.length)],
                ]
            );
            return;
        }
    } else {
        coords = recordMesgs
            .map((row: RecordMesg, idx: number) => {
                if (
                    typeof row.positionLat === "number" &&
                    typeof row.positionLong === "number"
                ) {
                    return [
                        Number((row.positionLat / 2 ** 31) * 180),
                        Number((row.positionLong / 2 ** 31) * 180),
                        row.timestamp || null,
                        row.altitude || null,
                        row.heartRate || null,
                        row.speed || null,
                        idx,
                        row,
                        getLapNumForIdx(idx, lapMesgs) ?? 1,
                    ] as CoordTuple;
                }
                return null;
            })
            .filter((coord): coord is CoordTuple => coord !== null);
    }

    if (coords.length === 0) {
        renderMapInfoMessage(
            mapContainer,
            "No location data available to display map.",
            [
                ["Lap", String(lapIdx)],
                ["recordMesgs", String(recordMesgs.length)],
                ["lapMesgs", String(lapMesgs.length)],
            ]
        );
        return;
    }

    if (coords.length > 0) {
        const polyColor = getLapColor(lapIdx);

        console.log(
            "[mapDrawLaps] DEBUG About to create polyline with L.polyline"
        );
        const polylineResult = L.polyline(
            coords.map((c: CoordTuple) => [c[0], c[1]]),
            buildPolylineOptions({
                color: polyColor,
                dashArray: lapIdx === "all" ? "6, 8" : null,
                opacity: 0.9,
                weight: 4,
            })
        );
        console.log(
            "[mapDrawLaps] DEBUG L.polyline() returned:",
            polylineResult
        );

        const polylineWithTarget = polylineResult.addTo(activityLayerTarget);
        console.log(
            "[mapDrawLaps] DEBUG .addTo(activityLayerTarget) returned:",
            polylineWithTarget
        );

        const polyline = polylineWithTarget;
        getWin()._mainPolyline = polyline;
        console.log("[mapDrawLaps] DEBUG final polyline:", polyline);
        console.log(
            "[mapDrawLaps] DEBUG polyline.getBounds exists?",
            typeof polyline?.getBounds
        );

        if (!polyline) {
            console.error(
                "[mapDrawLaps] ERROR: polyline is null/undefined after chaining"
            );
            return;
        }

        // --- Store original bounds for main polyline ---
        const origBounds = polyline.getBounds();
        getWin()._mainPolylineOriginalBounds =
            typeof origBounds.clone === "function"
                ? origBounds.clone()
                : L.latLngBounds(origBounds);

        // Fix: Ensure map is sized before fitBounds
        map.invalidateSize();
        const originalBounds = getWin()._mainPolylineOriginalBounds;
        if (originalBounds) {
            map.fitBounds(originalBounds, { padding: [20, 20] });
        }

        const end = coords.at(-1);
        const [start] = coords;
        if (start && end) {
            L.marker([start[0], start[1]], {
                icon: startIcon,
                title: "Start",
                zIndexOffset: 2000,
            })
                .addTo(activityLayerTarget)
                .bindPopup("Start");
            L.marker([end[0], end[1]], {
                icon: endIcon,
                title: "End",
                zIndexOffset: 2000,
            })
                .addTo(activityLayerTarget)
                .bindPopup("End");
        }

        const markerCoords = selectMarkerCoordinatesForDataset(coords);
        for (const c of markerCoords) {
            if (!c) {
                continue;
            }
            const idx4 = c[6],
                lapVal4 = c[8],
                row4 = c[7];
            let lapDisplay = lapVal4;
            if (!lapDisplay || Number.isNaN(lapDisplay)) {
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
            if (markerClusterGroup) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(activityLayerTarget);
            }
            try {
                marker.bringToFront?.();
            } catch {
                /* ignore */
            }
            registerDataPointMarker(marker);
            marker.bindTooltip(
                formatTooltipData(idx4, row4, lapDisplay, recordMesgs),
                {
                    direction: "top",
                    sticky: true,
                }
            );
        }

        // --- When adding overlays, only zoom to the overlay just added, not all overlays ---
        if (getLoadedFitFiles().length > 1) {
            const colorPalette = chartOverlayColorPalette;
            let lastOverlayBounds = null,
                overlayIdx = 0;
            const loaded = getLoadedFitFiles();
            for (let i = 1; i < loaded.length; i += 1) {
                const overlay = loaded[i];
                if (!overlay || !overlay.data) {
                    continue;
                }
                const color = colorPalette[overlayIdx % colorPalette.length],
                    fileName =
                        typeof getOverlayFileName === "function"
                            ? getOverlayFileName(i)
                            : overlay.filePath || "",
                    bounds = drawOverlayForFitFile({
                        color: color || "#1976d2",
                        endIcon,
                        fileName,
                        fitData: {
                            lapMesgs: Array.isArray(overlay.data.lapMesgs)
                                ? overlay.data.lapMesgs
                                : [],
                            recordMesgs: Array.isArray(overlay.data.recordMesgs)
                                ? overlay.data.recordMesgs
                                : [],
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
                    const winLeaflet = getWin().L;
                    if (typeof bounds.clone !== "function" && winLeaflet) {
                        safeBounds = winLeaflet.latLngBounds(bounds);
                    }
                    lastOverlayBounds =
                        safeBounds && typeof safeBounds.clone === "function"
                            ? safeBounds.clone()
                            : safeBounds || null;
                }
                overlayIdx += 1;
            }
            // Always auto-zoom to the overlay just added (not all overlays)
            if (lastOverlayBounds) {
                safeFitBounds(map, lastOverlayBounds, { padding: [20, 20] });
            }
        }
    } else {
        renderMapInfoMessage(
            mapContainer,
            "No location data available to display map.",
            [
                ["Lap", String(lapIdx)],
                ["recordMesgs", String(recordMesgs.length)],
                ["lapMesgs", String(lapMesgs.length)],
            ]
        );
    }
}

function buildPolylineOptions(
    options: Record<string, unknown>
): Record<string, unknown> {
    return {
        ...options,
        smoothFactor: getPolylineSmoothFactor(),
    };
}

function addLapDataPointMarker({
    activityLayerTarget,
    coord,
    formatTooltipData,
    leaflet,
    markerClusterGroup,
    polyColor,
    recordMesgs,
    registerDataPointMarker,
}: AddLapDataPointMarkerOptions): void {
    const idx = coord[6],
        lapVal = coord[8],
        row = coord[7],
        lapDisplay = !lapVal || Number.isNaN(lapVal) ? 1 : lapVal;

    const marker = leaflet.circleMarker([coord[0], coord[1]], {
        color: polyColor,
        fillColor: "#fff",
        fillOpacity: 0.85,
        radius: 4,
        weight: 2,
        zIndexOffset: 1500,
    });

    if (markerClusterGroup) {
        markerClusterGroup.addLayer(marker);
    } else {
        marker.addTo(activityLayerTarget);
    }

    safelyBringLayerToFront(marker);
    registerDataPointMarker(marker);
    marker.bindTooltip(formatTooltipData(idx, row, lapDisplay, recordMesgs), {
        direction: "top",
        sticky: true,
    });
}

function asLapMesgs(value: unknown): LapMesg[] {
    return Array.isArray(value) ? value.filter(isLapMesg) : [];
}

function asRecordMesgs(value: unknown): RecordMesg[] {
    return Array.isArray(value) ? value.filter(isRecordMesg) : [];
}

function isFitObject(value: unknown): value is Record<string, FitValue> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isLeafletRuntimeLike(value: unknown): value is LeafletRuntimeLike {
    return (
        isFitObject(value) &&
        typeof value["circleMarker"] === "function" &&
        typeof value["latLngBounds"] === "function" &&
        typeof value["marker"] === "function" &&
        typeof value["polyline"] === "function"
    );
}

function isLapMesg(value: unknown): value is LapMesg {
    return isFitObject(value);
}

function hasLapCoordinates(value: unknown): value is LapMesg &
    Required<
        Pick<
            LapMesg,
            | "endPositionLat"
            | "endPositionLong"
            | "startPositionLat"
            | "startPositionLong"
        >
    > {
    return (
        isLapMesg(value) &&
        typeof value.startPositionLat === "number" &&
        typeof value.startPositionLong === "number" &&
        typeof value.endPositionLat === "number" &&
        typeof value.endPositionLong === "number"
    );
}

function isMissingLapIndex(lap: LapMesg): boolean {
    return (
        lap.start_index === undefined ||
        lap.start_index === null ||
        lap.end_index === undefined ||
        lap.end_index === null
    );
}

function isRecordMesg(value: unknown): value is RecordMesg {
    return isFitObject(value);
}

function findClosestRecordIndexByLatLon(
    lat: number,
    lon: number,
    records: RecordMesg[]
): number {
    let minDist = Infinity,
        minIdx = -1;
    for (const [i, r] of records.entries()) {
        if (
            r &&
            typeof r.positionLat === "number" &&
            typeof r.positionLong === "number"
        ) {
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

function getLeaflet(): LeafletRuntimeLike {
    const w = getWin();
    const globalLeaflet: unknown = Reflect.get(globalThis, "L");
    const candidate = isLeafletRuntimeLike(globalLeaflet) ? globalLeaflet : w.L;
    if (isLeafletRuntimeLike(candidate)) {
        return candidate;
    }

    throw new Error("Leaflet runtime is unavailable");
}

function getLoadedFitFiles(): LoadedFitFileLike[] {
    const loadedFitFiles = getWin().loadedFitFiles;
    return Array.isArray(loadedFitFiles) ? loadedFitFiles : [];
}

function getMarkerLimit(): number {
    const win = getWin();
    const value = Number(win.mapMarkerCount);
    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }
    return value;
}

function getPolylineSmoothFactor(): number {
    const markerLimit = getMarkerLimit();
    return markerLimit === 0 ? 0 : 1;
}

function getWin(): MapDrawWindowLike {
    return (
        globalThis.window === undefined ? globalThis : globalThis.window
    ) as MapDrawWindowLike;
}

function patchLapIndices(lapMesgs: LapMesg[], recordMesgs: RecordMesg[]): void {
    for (const [i, lap] of lapMesgs.entries()) {
        if (
            hasLapCoordinates(lap) &&
            isMissingLapIndex(lap) // Find closest record index for start and end positions
        ) {
            const startIdx = findClosestRecordIndexByLatLon(
                lap.startPositionLat,
                lap.startPositionLong,
                recordMesgs
            );
            let endIdx = findClosestRecordIndexByLatLon(
                lap.endPositionLat,
                lap.endPositionLong,
                recordMesgs
            );
            if (endIdx === -1) {
                endIdx = recordMesgs.length - 1;
            }
            lap.start_index = startIdx;
            lap.end_index = endIdx;
            console.log(
                `[patchLapIndices] Lap ${i + 1}: start_index=${startIdx}, end_index=${endIdx}`
            );
        }
    }
}

function renderMapInfoMessage(
    mapContainer: HTMLElement,
    title: string,
    lines: Array<[string, string]>
): void {
    const p = document.createElement("p");
    p.append(document.createTextNode(title));
    for (const [label, value] of lines) {
        p.append(document.createElement("br"));
        p.append(document.createTextNode(`${label}: ${value}`));
    }
    mapContainer.replaceChildren(p);
}

function selectDefaultMarkerCoordinates(
    coordsArray: CoordTuple[],
    markerLimit: number
): CoordTuple[] {
    if (!Array.isArray(coordsArray) || coordsArray.length === 0) {
        return [];
    }
    if (markerLimit === 0 || markerLimit >= coordsArray.length) {
        return [...coordsArray];
    }
    const effectiveStep =
        markerLimit === 0
            ? 1
            : Math.max(1, Math.floor(coordsArray.length / markerLimit));
    const selected = [];
    for (let i = 0; i < coordsArray.length; i += effectiveStep) {
        const [coord] = coordsArray.slice(i, i + 1);
        if (coord) {
            selected.push(coord);
        }
    }
    const last = coordsArray.at(-1);
    if (last && selected.at(-1) !== last) {
        selected.push(last);
    }
    if (selected.length === 0) {
        const [first] = coordsArray;
        if (first) {
            selected.push(first);
        }
    }
    return selected;
}

function selectMarkerCoordinatesForDataset(
    coordsArray: CoordTuple[],
    shouldUpdateSummary = true
): CoordTuple[] {
    const markerLimit = getMarkerLimit();
    const win = getWin();
    const filterConfig = win.mapDataPointFilter;

    const updateSummary = (summary: MetricFilterSummary | null): void => {
        if (!shouldUpdateSummary) {
            return;
        }
        try {
            win.mapDataPointFilterLastResult = summary;
        } catch {
            /* ignore summary persistence errors */
        }
    };

    if (!filterConfig || !filterConfig.enabled) {
        updateSummary(null);
        return selectDefaultMarkerCoordinates(coordsArray, markerLimit);
    }

    const metricDef = getMetricDefinition(filterConfig.metric);
    if (!metricDef) {
        updateSummary({
            applied: false,
            reason: `Unknown metric: ${filterConfig.metric}`,
        });
        return selectDefaultMarkerCoordinates(coordsArray, markerLimit);
    }

    const filterResult = createMetricFilter(
        coordsArray.map((coord) => coord[7]),
        filterConfig,
        {
            valueExtractor: (row: MetricRecord) => metricDef.resolver(row),
        }
    );

    if (
        !filterResult.isActive ||
        filterResult.reason ||
        filterResult.selectedCount === 0
    ) {
        updateSummary({
            applied: false,
            reason: filterResult.reason ?? "No qualifying data",
        });
        return selectDefaultMarkerCoordinates(coordsArray, markerLimit);
    }

    const {
        appliedMax,
        appliedMin,
        maxCandidate,
        metric,
        metricLabel,
        minCandidate,
        mode,
        orderedIndices,
        percent,
        threshold,
    } = filterResult;
    const selected: CoordTuple[] = [];
    for (const index of orderedIndices) {
        const [coord] = coordsArray.slice(index, index + 1);
        if (coord) {
            selected.push(coord);
        }
    }

    if (selected.length === 0) {
        updateSummary({
            applied: false,
            reason: "Filter produced no coordinates",
        });
        return selectDefaultMarkerCoordinates(coordsArray, markerLimit);
    }

    const limit =
        markerLimit > 0
            ? Math.min(markerLimit, selected.length)
            : selected.length;
    const finalSelection = selected.slice(0, limit);
    updateSummary({
        applied: true,
        appliedMax,
        appliedMin,
        coverage: percent,
        maxCandidate,
        metric,
        metricLabel,
        minCandidate,
        mode,
        percent:
            mode === "topPercent" ? (filterConfig.percent ?? percent) : percent,
        selectedCount: finalSelection.length,
        threshold,
        totalCandidates: coordsArray.length,
    });
    return finalSelection;
}

function applyMainPolylineHighlight(highlightedIdx?: number): void {
    const main = getWin()._mainPolyline;
    if (!main) {
        return;
    }

    const isMainHighlighted = highlightedIdx === 0;
    main.setStyle({
        className: isMainHighlighted ? "overlay-highlight-glow" : "",
        weight: isMainHighlighted ? 9 : 4,
        opacity: isMainHighlighted ? 0.92 : (main.options?.opacity ?? 0.9),
    });

    if (isMainHighlighted) {
        safelyBringLayerToFront(main);
        bringRegisteredDataPointMarkersToFront();
    }

    const elem = main.getElement?.();
    if (elem) {
        elem.style.filter = isMainHighlighted
            ? `drop-shadow(0 0 6px ${getLayerColor(main)})`
            : "";
    }
}

function applyOverlayPolylineHighlight(
    polyline: LeafletLayerLike,
    isHighlighted: boolean
): void {
    polyline.setStyle({
        className: isHighlighted ? "overlay-highlight-glow" : "",
        weight: isHighlighted ? 10 : 4,
    });

    const polyElem = polyline.getElement?.();
    if (polyElem) {
        polyElem.style.filter = isHighlighted
            ? `drop-shadow(0 0 8px ${getLayerColor(polyline)})`
            : "";
    }
}

function applyOverlayPolylineHighlights(highlightedIdx?: number): void {
    const overlayPolylines = getWin()._overlayPolylines;
    if (!overlayPolylines) {
        return;
    }

    for (const [idx, polyline] of Object.entries(overlayPolylines)) {
        applyOverlayPolylineHighlight(polyline, Number(idx) === highlightedIdx);
    }
}

function bringRegisteredDataPointMarkersToFront(): void {
    const markers = getWin()._ffvDataPointMarkers;
    if (!Array.isArray(markers)) {
        return;
    }

    for (const marker of markers) {
        safelyBringLayerToFront(marker);
    }
}

function callOverlayHighlightStub(
    userAssigned: ((...args: unknown[]) => unknown) | undefined,
    args: unknown[]
): unknown {
    if (typeof userAssigned !== "function") {
        return undefined;
    }

    try {
        return userAssigned.apply(getWin(), args);
    } catch {
        return undefined;
    }
}

function getLayerColor(layer: LeafletLayerLike): string {
    return layer.options.color || "#1976d2";
}

function safelyBringLayerToFront(layer: LeafletLayerLike): void {
    try {
        layer.bringToFront?.();
    } catch {
        /* ignore */
    }
}

function updateTrackHighlights(highlightedIdx = getWin()._highlightedOverlayIdx): void {
    applyOverlayPolylineHighlights(highlightedIdx);
    applyMainPolylineHighlight(highlightedIdx);
}

let userAssignedOverlayHighlightStub:
    | ((...args: unknown[]) => unknown)
    | undefined;

// Add global function to update overlay highlights without redrawing the map.
function __realUpdateOverlayHighlights(): void {
    updateTrackHighlights();
}

export function updateOverlayHighlights(...args: unknown[]): unknown {
    getWin().__realUpdateOverlayHighlights?.();

    return callOverlayHighlightStub(userAssignedOverlayHighlightStub, args);
}

// Install a stable reference that won't be replaced accidentally.
getWin().__realUpdateOverlayHighlights = __realUpdateOverlayHighlights;

// Public shim accessor that preserves any assigned stub but always invokes the real implementation first
(() => {
    try {
        Object.defineProperty(getWin(), "updateOverlayHighlights", {
            configurable: true,
            enumerable: true,
            get() {
                return updateOverlayHighlights;
            },
            set(v: ((...args: unknown[]) => unknown) | undefined) {
                userAssignedOverlayHighlightStub = v;
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
        let _val = getWin()._highlightedOverlayIdx ?? -1;
        const desc = Object.getOwnPropertyDescriptor(
            getWin(),
            "_highlightedOverlayIdx"
        );
        // Only install if not already an accessor
        if (!desc || "value" in desc) {
            Object.defineProperty(getWin(), "_highlightedOverlayIdx", {
                configurable: true,
                enumerable: true,
                get() {
                    return _val;
                },
                set(v: number | undefined) {
                    _val = v ?? -1;
                    updateTrackHighlights(_val);
                },
            });
        }
    } catch {
        /* Ignore errors */
    }
})();

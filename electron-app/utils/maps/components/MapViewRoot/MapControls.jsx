import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { chartOverlayColorPalette } from "../../../charts/theming/chartOverlayColorPalette.js";
import { getThemeColors } from "../../../charts/theming/getThemeColors.js";
import { openFileSelector } from "../../../files/import/openFileSelector.js";
import {
    getOverlayMarkerCount,
    setHighlightedOverlayIndex,
    setOverlayFiles,
    setOverlayMarkerCount,
} from "../../../state/domain/overlayState.js";
import { useAppState } from "../../../state/hooks/useAppState.js";
import { getMapThemeInverted, setMapThemeInverted } from "../../../theming/specific/createMapThemeToggle.js";
import { showNotification } from "../../../ui/notifications/showNotification.js";
import { formatDistanceSummary } from "../../helpers/measurementFormatting.js";

const SEMICIRCLE_TO_DEGREES = 180 / 2_147_483_647;

export function MapControls({ mapInstance }) {
    const overlayFiles = useAppState((state) => state?.overlays?.loadedFitFiles ?? []);
    const globalData = useAppState((state) => state?.globalData ?? null);

    const [markerSummary, setMarkerSummary] = useState({ rendered: 0, total: 0 });
    const [measurementActive, setMeasurementActive] = useState(false);
    const [markerCountChoice, setMarkerCountChoice] = useState(() => {
        const preference = getOverlayMarkerCount();
        return preference === 0 ? "all" : String(preference);
    });
    const [mapThemeInverted, setMapThemeInvertedState] = useState(() => getMapThemeInverted());

    const buildElevationHtml = useCallback((dataSets, theme, isDark) => {
        const serializedPayload = JSON.stringify(dataSets);
        const primaryShadow = theme.primaryShadow ?? theme.shadowMedium ?? "rgba(0,0,0,0.15)";
        return `<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Elevation Profiles</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="./node_modules/chart.js/dist/chart.umd.js"></script>
    <link rel="stylesheet" href="./elevProfile.css" />
    <style>
        :root {
            --background: ${theme.background};
            --surface: ${theme.surface};
            --text: ${theme.text};
            --text-secondary: ${theme.textSecondary};
            --border: ${theme.border};
            --border-light: ${theme.borderLight};
            --shadow-light: ${theme.shadowLight};
            --shadow-medium: ${theme.shadowMedium};
            --primary-shadow: ${primaryShadow};
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            font-family: "Segoe UI", "Roboto", "Arial", sans-serif;
            background: var(--background);
            color: var(--text);
        }
        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 28px 12px;
            background: var(--surface);
            box-shadow: 0 2px 14px var(--shadow-light);
            border-radius: 0 0 18px 18px;
        }
        header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 700;
        }
        #elevChartsContainer {
            display: flex;
            flex-direction: column;
            gap: 28px;
            max-height: 90vh;
            overflow: auto;
            padding: 28px;
        }
        .elev-profile-block {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 4px 26px var(--shadow-medium);
            padding: 22px 22px 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .elev-profile-block:hover {
            box-shadow: 0 8px 32px var(--primary-shadow);
            border-color: var(--border-light);
        }
        .elev-profile-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 1.05rem;
        }
        .elev-profile-label .dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid var(--surface);
            box-shadow: 0 0 0 2px var(--border-light), 0 1px 4px var(--shadow-medium);
        }
        .elev-profile-canvas {
            width: 100%;
            height: 220px;
        }
        .no-altitude-data {
            color: var(--text-secondary);
            text-align: center;
            margin: 12px 0 0;
        }
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 6px;
        }
        @media (max-width: 720px) {
            header, #elevChartsContainer { padding: 12px; }
            .elev-profile-block { padding: 16px 12px; }
        }
    </style>
</head>
<body class="${isDark ? "theme-dark" : "theme-light"}">
    <header>
        <h2>Elevation Profiles</h2>
        <span>${dataSets.length} file${dataSets.length === 1 ? "" : "s"}</span>
    </header>
    <div id="elevChartsContainer"></div>
    <script>
        const fitFiles = ${serializedPayload};
        const container = document.getElementById("elevChartsContainer");
        if (!Array.isArray(fitFiles) || fitFiles.length === 0) {
            container.innerHTML = '<p class="no-altitude-data">No altitude data available.</p>';
        } else {
            fitFiles.forEach((file, idx) => {
                const block = document.createElement("div");
                block.className = "elev-profile-block";
                const label = document.createElement("div");
                label.className = "elev-profile-label";
                const dot = document.createElement("span");
                dot.className = "dot";
                dot.style.background = file.color;
                label.appendChild(dot);
                const text = document.createElement("span");
                text.textContent = file.filePath;
                text.style.color = file.color;
                label.appendChild(text);
                block.appendChild(label);
                const canvas = document.createElement("canvas");
                canvas.className = "elev-profile-canvas";
                canvas.id = "elevChart_" + idx;
                block.appendChild(canvas);
                container.appendChild(block);
                if (Array.isArray(file.altitudes) && file.altitudes.length > 0 && window.Chart) {
                    const ctx = canvas.getContext("2d");
                    new window.Chart(ctx, {
                        type: "line",
                        data: {
                            labels: file.altitudes.map((point) => point.x),
                            datasets: [{
                                data: file.altitudes,
                                borderColor: file.color,
                                borderWidth: 2,
                                fill: false,
                                label: file.filePath,
                                pointRadius: 0,
                                tension: 0.3,
                            }],
                        },
                        options: {
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: true, title: { display: true, text: "Point Index" } },
                                y: { display: true, title: { display: true, text: "Altitude (m)" } },
                            },
                        },
                    });
                } else {
                    const warning = document.createElement("p");
                    warning.className = "no-altitude-data";
                    warning.textContent = "No altitude data available.";
                    block.appendChild(warning);
                }
            });
        }
    </script>
</body>
</html>`;
    }, []);

    const layerToggleRef = useRef(null);
    const measurementResourcesRef = useRef({ label: null, line: null, markers: [], points: [] });
    const [, forceOverlayRefresh] = useState(0);

    useEffect(() => {
        const handler = (stats) => {
            const rendered = Math.max(0, Number.parseInt(String(stats?.rendered ?? 0), 10) || 0);
            const total = Math.max(0, Number.parseInt(String(stats?.total ?? 0), 10) || 0);
            setMarkerSummary({ rendered, total });
        };
        const w = globalThis;
        w.updateMapMarkerSummary = handler;
        w.__mapMarkerSummaryHandler = handler;
        return () => {
            if (w.updateMapMarkerSummary === handler) {
                delete w.updateMapMarkerSummary;
            }
            if (w.__mapMarkerSummaryHandler === handler) {
                delete w.__mapMarkerSummaryHandler;
            }
        };
    }, []);

    useEffect(() => {
        const w = globalThis;
        const refresh = () => {
            forceOverlayRefresh((value) => value + 1);
        };
        w.updateShownFilesList = refresh;
        return () => {
            if (w.updateShownFilesList === refresh) {
                delete w.updateShownFilesList;
            }
        };
    }, []);

    useEffect(() => {
        const updateState = () => setMapThemeInvertedState(getMapThemeInverted());
        document.addEventListener("mapThemeChanged", updateState);
        document.body.addEventListener("themechange", updateState);
        return () => {
            document.removeEventListener("mapThemeChanged", updateState);
            document.body.removeEventListener("themechange", updateState);
        };
    }, []);

    useEffect(() => {
        const numericPreference = markerCountChoice === "all" ? 0 : Number.parseInt(markerCountChoice, 10) || 0;
        const w = globalThis;
        w.mapMarkerCount = numericPreference;
    }, [markerCountChoice]);

    useEffect(() => {
        const handleDocumentMouseDown = (event) => {
            const w = globalThis;
            const layersControl = w.__leafletLayerControlEl;
            if (!layersControl || !layersControl.classList.contains("leaflet-control-layers-expanded")) {
                return;
            }
            const button = layerToggleRef.current;
            const target = event.target instanceof Node ? event.target : null;
            const clickedToggle = Boolean(button && target && button.contains(target));
            if (!clickedToggle && !layersControl.contains(target)) {
                layersControl.classList.remove("leaflet-control-layers-expanded");
                layersControl.style.zIndex = "";
            }
        };
        document.addEventListener("mousedown", handleDocumentMouseDown);
        return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
    }, []);

    const clearMeasurement = useCallback(() => {
        if (!mapInstance) {
            return;
        }
        const resources = measurementResourcesRef.current;
        if (Array.isArray(resources.markers)) {
            for (const marker of resources.markers) {
                if (marker && typeof mapInstance.removeLayer === "function") {
                    try {
                        mapInstance.removeLayer(marker);
                    } catch {
                        // ignore cleanup errors
                    }
                }
            }
        }
        resources.markers = [];
        if (resources.line && typeof mapInstance.removeLayer === "function") {
            try {
                mapInstance.removeLayer(resources.line);
            } catch {
                // ignore cleanup errors
            }
        }
        resources.line = null;
        if (resources.label && typeof mapInstance.removeLayer === "function") {
            try {
                mapInstance.removeLayer(resources.label);
            } catch {
                // ignore cleanup errors
            }
        }
        resources.label = null;
        resources.points = [];
    }, [mapInstance]);

    const describeLatLng = useCallback((latLng) => {
        if (!latLng) {
            return { lat: "0.00000", lng: "0.00000" };
        }
        return {
            lat: Number.parseFloat(String(latLng.lat ?? 0)).toFixed(5),
            lng: Number.parseFloat(String(latLng.lng ?? 0)).toFixed(5),
        };
    }, []);

    const handleMeasurementMapClick = useCallback(
        (event) => {
            if (!mapInstance || !event?.latlng) {
                return;
            }
            const LeafletLib = globalThis.L;
            if (!LeafletLib) {
                return;
            }
            const resources = measurementResourcesRef.current;
            if (resources.points.length >= 2) {
                clearMeasurement();
            }
            resources.points.push(event.latlng);
            const marker = LeafletLib.marker(event.latlng, { draggable: false });
            marker.addTo(mapInstance);
            const pointDescriptor = describeLatLng(event.latlng);
            const isStartMarker = resources.points.length === 1;
            marker.bindTooltip(
                `${isStartMarker ? "Start point" : "Point"}<br>Lat: ${pointDescriptor.lat}<br>Lng: ${pointDescriptor.lng}`,
                {
                    className: "map-draw-tooltip",
                    direction: "top",
                    offset: [0, -8],
                    permanent: true,
                    sticky: false,
                }
            );
            marker.openTooltip();
            resources.markers.push(marker);
            if (resources.points.length === 2) {
                const [start, end] = resources.points;
                if (!start || !end) {
                    return;
                }
                const polyline = LeafletLib.polyline(resources.points, {
                    color: "#222",
                    dashArray: "4,6",
                    weight: 3,
                });
                polyline.addTo(mapInstance);
                resources.line = polyline;
                const distanceMeters = mapInstance.distance(start, end);
                const distanceSummary = formatDistanceSummary(distanceMeters);
                const segmentCount = Math.max(1, resources.points.length - 1);
                const secondarySummary = `Segments: ${segmentCount}`;
                const midpoint = LeafletLib.latLng((start.lat + end.lat) / 2, (start.lng + end.lng) / 2);
                const label = LeafletLib.marker(midpoint, {
                    icon: LeafletLib.divIcon({
                        className: "measure-label",
                        html: `<div class="measure-label-content"><button class="measure-exit-btn" title="Remove measurement">&times;</button>${distanceSummary}</div>`,
                    }),
                    iconAnchor: [60, 19],
                    iconSize: [120, 38],
                    interactive: true,
                });
                label.addTo(mapInstance);
                resources.label = label;
                const summaryTooltip = `${distanceSummary}<br>${secondarySummary}`;
                polyline.bindTooltip(summaryTooltip, {
                    className: "map-draw-tooltip",
                    direction: "auto",
                    permanent: true,
                    sticky: false,
                });
                polyline.openTooltip();
                const endDescriptor = describeLatLng(end);
                if (typeof marker.setTooltipContent === "function") {
                    marker.setTooltipContent(
                        `End point<br>${distanceSummary}<br>Lat: ${endDescriptor.lat}<br>Lng: ${endDescriptor.lng}`
                    );
                }
                const [startMarker] = resources.markers;
                if (startMarker && typeof startMarker.setTooltipContent === "function") {
                    const startDescriptor = describeLatLng(start);
                    startMarker.setTooltipContent(
                        `Start point<br>${distanceSummary}<br>Lat: ${startDescriptor.lat}<br>Lng: ${startDescriptor.lng}`
                    );
                }
                const labelElement = label.getElement();
                if (labelElement) {
                    labelElement.addEventListener(
                        "click",
                        (clickEvent) => {
                            const { target } = clickEvent;
                            if (target instanceof HTMLElement && target.classList.contains("measure-exit-btn")) {
                                clearMeasurement();
                                setMeasurementActive(false);
                            }
                        },
                        { once: true }
                    );
                }
                setMeasurementActive(false);
            }
        },
        [clearMeasurement, describeLatLng, mapInstance]
    );

    useEffect(() => {
        if (!mapInstance) {
            return;
        }
        if (!measurementActive) {
            mapInstance.off?.("click", handleMeasurementMapClick);
            return;
        }
        mapInstance.on?.("click", handleMeasurementMapClick);
        return () => mapInstance.off?.("click", handleMeasurementMapClick);
    }, [handleMeasurementMapClick, mapInstance, measurementActive]);

    useEffect(() => {
        if (!measurementActive) {
            return;
        }
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                clearMeasurement();
                setMeasurementActive(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [clearMeasurement, measurementActive]);

    const handlePrint = useCallback(() => {
        globalThis.print?.();
    }, []);

    const handleExportGPX = useCallback(() => {
        const records = Array.isArray(globalData?.recordMesgs) ? globalData.recordMesgs : [];
        if (records.length === 0) {
            showNotification("No data available for GPX export.", "info", 2500);
            return;
        }
        const coordinates = records
            .filter((row) => row && row.positionLat != null && row.positionLong != null)
            .map((row) => [Number(row.positionLat) * SEMICIRCLE_TO_DEGREES, Number(row.positionLong) * SEMICIRCLE_TO_DEGREES]);
        if (coordinates.length === 0) {
            showNotification("No valid coordinates found for GPX export.", "info", 2500);
            return;
        }
        const gpxLines = [
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            "<gpx version=\"1.1\" creator=\"FitFileViewer\">",
            "<trk><name>Exported Track</name><trkseg>",
            ...coordinates.map(([lat, lon]) => `<trkpt lat="${lat}" lon="${lon}" />`),
            "</trkseg></trk>",
            "</gpx>",
        ];
        const blob = new Blob([gpxLines.join("\n")], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "track.gpx";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [globalData]);

    const handleAddOverlay = useCallback(async () => {
        const records = Array.isArray(globalData?.recordMesgs) ? globalData.recordMesgs : [];
        if (records.length === 0) {
            showNotification("Open a primary FIT file before adding overlays.", "info", 2000);
            return;
        }
        try {
            await openFileSelector();
        } catch (error) {
            console.error("[MapControls] Failed to open overlay selector", error);
            showNotification("Failed to open file selector.", "error", 3000);
        }
    }, [globalData]);

    const handleLayerToggle = useCallback(() => {
        const w = globalThis;
        const layersControl = w.__leafletLayerControlEl;
        if (!layersControl) {
            return;
        }
        layersControl.classList.add("leaflet-control-layers-expanded");
        layersControl.style.zIndex = "1201";
        const firstInput = layersControl.querySelector('input[type="radio"]');
        if (firstInput instanceof HTMLElement) {
            firstInput.focus();
        }
    }, []);

    const buildElevationPayload = useCallback(() => {
        const effectiveFiles = overlayFiles.length > 0
            ? overlayFiles
            : Array.isArray(globalData?.recordMesgs) && globalData.recordMesgs.length > 0
                ? [{ data: globalData, filePath: globalData?.cachedFilePath ?? "Primary file" }]
                : [];
        return effectiveFiles.map((file, index) => {
            const recordMesgs = Array.isArray(file?.data?.recordMesgs) ? file.data.recordMesgs : [];
            const altitudes = recordMesgs
                .filter((row) => row && row.positionLat != null && row.positionLong != null && row.altitude != null)
                .map((row, rowIndex) => ({ x: rowIndex, y: Number(row.altitude) }));
            return {
                altitudes,
                color: chartOverlayColorPalette[(index + 1) % chartOverlayColorPalette.length] ?? "#1976d2",
                filePath: file?.filePath ?? file?.originalPath ?? `Overlay ${index + 1}`,
            };
        });
    }, [globalData, overlayFiles]);

    const handleElevationProfile = useCallback(() => {
        const dataSets = buildElevationPayload();
        if (dataSets.length === 0) {
            showNotification("No altitude data available.", "info", 2500);
            return;
        }
        const chartWindow = globalThis.open("", "Elevation Profile", "width=900,height=600");
        if (!chartWindow) {
            showNotification("Popup blocked. Allow popups to view the elevation profile.", "warning", 2500);
            return;
        }
        const theme = getThemeColors();
        const isDark = document.body.classList.contains("theme-dark");
        chartWindow.document.write(buildElevationHtml(dataSets, theme, isDark));
        chartWindow.document.close();
    }, [buildElevationHtml, buildElevationPayload]);

    const handleMapThemeToggle = useCallback(() => {
        const next = !mapThemeInverted;
        setMapThemeInverted(next);
        setMapThemeInvertedState(next);
        const w = globalThis;
        w.updateMapTheme?.();
        showNotification(`Map theme set to ${next ? "dark" : "light"}.`, "success", 2000);
    }, [mapThemeInverted]);

    const handleMeasurementToggle = useCallback(() => {
        if (!mapInstance) {
            showNotification("Map is not available for measurement.", "info", 2000);
            return;
        }
        setMeasurementActive((active) => {
            if (active) {
                clearMeasurement();
                return false;
            }
            clearMeasurement();
            return true;
        });
    }, [clearMeasurement, mapInstance]);

    const handleMarkerCountChange = useCallback((event) => {
        const { value } = event.target;
        setMarkerCountChoice(value);
        const numericPreference = value === "all" ? 0 : Number.parseInt(value, 10) || 0;
        setOverlayMarkerCount(numericPreference, "MapControls.markerCountChange");
        const w = globalThis;
        w.updateShownFilesList?.();
        w.__reactMapRedraw?.("all");
    }, []);

    const handleClearDrawings = useCallback(() => {
        const w = globalThis;
        clearMeasurement();
        setMeasurementActive(false);
        if (mapInstance && typeof mapInstance.off === "function") {
            mapInstance.off("click", handleMeasurementMapClick);
        }
        try {
            if (typeof w.__clearDrawnItems === "function") {
                w.__clearDrawnItems();
            } else if (w.__mapDrawnItems && typeof w.__mapDrawnItems.clearLayers === "function") {
                w.__mapDrawnItems.clearLayers();
            }
        } catch (error) {
            console.warn("[MapControls] Failed to clear drawn items", error);
        }
        showNotification("Cleared drawn markers and measurements.", "success", 2000);
    }, [clearMeasurement, handleMeasurementMapClick, mapInstance]);

    const handleOverlayRemove = useCallback(
        (overlayIndex) => {
            if (overlayIndex < 1 || overlayIndex >= overlayFiles.length) {
                return;
            }
            const next = overlayFiles.filter((_, index) => index !== overlayIndex);
            setOverlayFiles(next, "MapControls.removeOverlay");
            const w = globalThis;
            w.__reactMapRedraw?.("all");
        },
        [overlayFiles]
    );

    const handleOverlayHighlight = useCallback((overlayIndex) => {
        setHighlightedOverlayIndex(overlayIndex, "MapControls.highlightOverlay");
        const w = globalThis;
        w.updateOverlayHighlights?.();
    }, []);

    const extraOverlays = useMemo(() => overlayFiles.slice(1), [overlayFiles]);
    const overlayTheme = getThemeColors();
    const markerCountOptions = useMemo(() => ["10", "25", "50", "100", "200", "500", "1000", "all"], []);

    return (
        <>
            <div className="map-controls-bar">
                <div className="map-controls-group map-controls-group--primary">
                    <button
                        className="map-action-btn"
                        onClick={handlePrint}
                        title="Print or export the current map view"
                        type="button"
                    >
                        <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:print" width="18" />
                        <span>Print</span>
                    </button>
                    <button
                        className="map-action-btn"
                        onClick={handleExportGPX}
                        title="Export the current track as a GPX file"
                        type="button"
                    >
                        <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:export" width="18" />
                        <span>Export GPX</span>
                    </button>
                    <button
                        className="map-action-btn"
                        onClick={handleAddOverlay}
                        title="Overlay FIT files on the map"
                        type="button"
                    >
                        <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:plus" width="18" />
                        <span>Add FIT File(s) to Map</span>
                    </button>
                    <button
                        className="map-action-btn"
                        onClick={handleElevationProfile}
                        title="Show elevation profiles"
                        type="button"
                    >
                        <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:area-chart" width="18" />
                        <span>Elevation</span>
                    </button>
                </div>
                <div className="map-controls-group map-controls-group--utility">
                    <button
                        className="map-action-btn map-layer-toggle"
                        onClick={handleLayerToggle}
                        ref={layerToggleRef}
                        title="Choose a different map base layer"
                        type="button"
                    >
                        <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:globe" width="18" />
                        <span>Change Map</span>
                    </button>
                    <button
                        aria-pressed={measurementActive}
                        className="map-action-btn"
                        data-active={String(measurementActive)}
                        onClick={handleMeasurementToggle}
                        title={measurementActive ? "Cancel measurement" : "Measure distance between two points"}
                        type="button"
                    >
                        <iconify-icon
                            aria-hidden="true"
                            height="18"
                            icon={measurementActive ? "flat-color-icons:cancel" : "flat-color-icons:ruler"}
                            width="18"
                        />
                        <span>{measurementActive ? "Cancel" : "Measure"}</span>
                    </button>
                    <button
                        className="map-action-btn"
                        onClick={handleClearDrawings}
                        title="Remove drawn markers and current measurement"
                        type="button"
                    >
                        <iconify-icon aria-hidden="true" height="18" icon="mdi:eraser-variant" width="18" />
                        <span>Clear Marks</span>
                    </button>
                    <button
                        aria-pressed={mapThemeInverted}
                        className={`map-action-btn map-theme-toggle${mapThemeInverted ? " active" : ""}`}
                        onClick={handleMapThemeToggle}
                        title={mapThemeInverted ? "Map: Dark theme (click for light)" : "Map: Light theme (click for dark)"}
                        type="button"
                    >
                        <iconify-icon
                            aria-hidden="true"
                            className="map-theme-toggle-icon"
                            height="18"
                            icon={mapThemeInverted ? "mdi:moon-waning-crescent" : "mdi:weather-sunny"}
                            width="18"
                        />
                        <span>Map Theme</span>
                    </button>
                </div>
                <div className="map-controls-group map-controls-group--metrics">
                    <label className="map-action-btn marker-count-container">
                        <span className="marker-count-label">
                            <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:bar-chart" width="18" />
                            <span>Data Points:</span>
                        </span>
                        <select className="marker-count-select" onChange={handleMarkerCountChange} value={markerCountChoice}>
                            {markerCountOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "All" : option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div
                        className="map-marker-summary"
                        data-rendered={markerSummary.rendered}
                        data-total={markerSummary.total}
                        id="map-marker-summary"
                    >
                        Data Points: {markerSummary.total > 0
                            ? `${markerSummary.rendered.toLocaleString()} / ${markerSummary.total.toLocaleString()}`
                            : markerSummary.rendered.toLocaleString()}
                    </div>
                </div>
            </div>
            {extraOverlays.length > 0 ? (
                <div
                    aria-label="Map overlay files"
                    className="shown-files-list map-overlays-panel"
                    role="region"
                    style={{
                        background: overlayTheme.surface,
                        border: `1px solid ${overlayTheme.border}`,
                        color: overlayTheme.text,
                    }}
                >
                    <b>Extra Files shown on map:</b>
                    <ul className="shown-files-list-items" id="shown-files-ul" role="listbox">
                        {extraOverlays.map((file, index) => {
                            const overlayIndex = index + 1;
                            const label = file?.filePath ?? file?.originalPath ?? `Overlay ${overlayIndex}`;
                            const color = chartOverlayColorPalette[(index + 1) % chartOverlayColorPalette.length] ?? "#1976d2";
                            return (
                                <li
                                    className="overlay-list-item"
                                    data-overlay-index={overlayIndex}
                                    key={`${label}-${overlayIndex}`}
                                    onClick={() => handleOverlayHighlight(overlayIndex)}
                                    role="option"
                                    style={{ color, cursor: "pointer" }}
                                    tabIndex={-1}
                                >
                                    <span>{label}</span>
                                    <button
                                        className="overlay-remove-btn"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handleOverlayRemove(overlayIndex);
                                        }}
                                        title="Remove this overlay"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </>
    );
}

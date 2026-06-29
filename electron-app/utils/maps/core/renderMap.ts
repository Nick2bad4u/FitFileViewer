import type * as Leaflet from "leaflet";

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
import { createTables } from "../../rendering/components/createTables.js";
import { createShownFilesList } from "../../rendering/components/createShownFilesList.js";
import { updateShownFilesList } from "../../rendering/components/shownFilesListUpdater.js";
import { renderSummary } from "../../rendering/core/renderSummary.js";
import {
    getActiveFitActivityData,
    getActiveFitPowerInput,
    hasActiveFitRecords,
} from "../../state/domain/fitActivityDataState.js";
import { getLoadedFitFiles } from "../../state/domain/loadedFitFilesState.js";
import {
    getMapBaseLayer,
    setMapBaseLayer,
} from "../../state/domain/mapBaseLayerState.js";
import { normalizeMapBaseLayer } from "../../state/domain/mapBaseLayerContract.js";
import {
    installUpdateMapThemeListeners,
    updateMapTheme,
} from "../../theming/specific/updateMapTheme.js";
import {
    removeRegisteredLeafletMapInstance,
    setRegisteredLeafletMapInstance,
} from "../state/mapLeafletInstanceState.js";
import {
    removeRegisteredMapMeasureControl,
    setRegisteredMapMeasureControl,
} from "../state/mapMeasureControlState.js";
import {
    getRegisteredMapDrawnItems,
    getRegisteredMapMiniMapControl,
    removeRegisteredMapDrawControl,
    removeRegisteredMapMiniMapControl,
    setRegisteredMapDrawControl,
    setRegisteredMapDrawnItems,
    setRegisteredMapMiniMapControl,
} from "../state/mapPluginControlState.js";
import {
    getOverlayMapPolylines,
    resetOverlayMapPolylines,
} from "../state/mapPolylineRegistryState.js";
import { createAddFitFileToMapButton } from "../../ui/controls/createAddFitFileToMapButton.js";
import { createDataPointFilterControl } from "../../ui/controls/createDataPointFilterControl.js";
import { createElevationProfileButton } from "../../ui/controls/createElevationProfileButton.js";
import { createMarkerCountSelector } from "../../ui/controls/createMarkerCountSelector.js";
import { createPowerEstimationButton } from "../../ui/controls/createPowerEstimationButton.js";
import {
    createMapThemeToggle,
    initializeActiveFileNameMapActions,
} from "../controls/mapActionButtons.js";
import {
    addLeafletDrawPluginControl,
    addLeafletFullscreenPluginControl,
    addLeafletLocatePluginControl,
    addLeafletMeasurePluginControl,
    addLeafletMiniMapPluginControl,
    hasLeafletMeasurePluginControl,
    type LeafletDrawnItemsLayerGroup as DrawnItemsLayerGroup,
} from "../controls/leafletPluginControls.js";
import { addFullscreenControl } from "../controls/mapFullscreenControl.js";
import { addLapSelector } from "../controls/mapLapSelector.js";
import { addSimpleMeasureTool } from "../controls/mapMeasureTool.js";
import { baseLayers, createBaseLayers } from "../layers/mapBaseLayers.js";
import {
    drawOverlayForFitFile,
    getHighlightedOverlayIndex,
    mapDrawLaps,
    updateOverlayHighlights,
} from "../layers/mapDrawLaps.js";
import { createEndIcon, createStartIcon } from "../layers/mapIcons.js";
import { getLapColor } from "./mapColors.js";
import {
    ensureMapDocumentListenersInstalled,
    setMapDocumentControlRefs,
} from "./mapDocumentListeners.js";
import {
    resolveLeafletRuntime,
    waitForLeafletRuntime,
} from "./leafletRuntime.js";
import {
    getRenderMapRuntime,
    type RenderMapTimer,
} from "./renderMapRuntime.js";

type LooseRecord = Record<string, unknown>;

type RecordMessage = LooseRecord & {
    altitude?: number;
    cadence?: number;
    distance?: number;
    enhancedAltitude?: number;
    enhancedSpeed?: number;
    heartRate?: number;
    positionLat?: number;
    positionLong?: number;
    power?: number;
    speed?: number;
    timestamp?: number;
};

type FitMapActivityData = LooseRecord & {
    cachedFilePath?: string;
    lapMesgs?: LooseRecord[];
    recordMesgs?: RecordMessage[];
    sessionMesgs?: LooseRecord[];
};

type DrawActiveHandler = {
    _finishShape?: () => void;
    _markers?: { getLatLng?: () => Leaflet.LatLngExpression }[];
};

type DrawControlToolbars = {
    draw?: {
        _activeMode?: {
            handler?: DrawActiveHandler;
        };
    };
};

type DisposableControl = {
    _measurementRunningTotal?: number;
    remove?: () => void;
    addTo?: (map: Leaflet.Map) => unknown;
    _miniMap?: { invalidateSize?: () => void };
    _toolbars?: DrawControlToolbars;
};

type LeafletPluginControl = DisposableControl & Leaflet.Control;

type LeafletRuntime = typeof Leaflet & {
    Control: typeof Leaflet.Control & {
        Draw?: new (...args: unknown[]) => LeafletPluginControl;
        MiniMap?: new (...args: unknown[]) => LeafletPluginControl;
    };
    Draw?: { Event?: { CREATED?: string } };
    control: typeof Leaflet.control & {
        fullscreen?: (...args: unknown[]) => DisposableControl;
        locate?: (...args: unknown[]) => DisposableControl;
        measure?: (...args: unknown[]) => DisposableControl;
    };
};

type DrawnLayerSnapshot = {
    geoJSON: LeafletGeoJsonInput;
    options: Leaflet.PathOptions;
    type:
        | "circle"
        | "marker"
        | "polygon"
        | "polyline"
        | "rectangle"
        | "unknown";
};

type DrawnLayer = Leaflet.Layer & {
    options?: Leaflet.PathOptions;
    toGeoJSON?: () => LeafletGeoJsonInput | null;
};

type LeafletGeoJsonInput = Parameters<typeof Leaflet.geoJSON>[0];

type OverlayPolyline = Leaflet.Polyline & {
    _map?: Leaflet.Map & {
        _layers?: Record<string, Leaflet.Layer>;
    };
    options: Leaflet.PolylineOptions & {
        color?: string;
    };
};

type ShownFilesListElement = Element & {
    _dispose?: () => void;
};

type BaseLayerKey = keyof typeof baseLayers;

const BASE_LAYER_LABEL_OVERRIDES: Record<string, string> = {
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

const PREFERRED_BASE_LAYER_ORDER: BaseLayerKey[] = [
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

let renderMapAbortController: AbortController | null = null;

function formatBaseLayerLabel(key: string): string {
    const overridden = BASE_LAYER_LABEL_OVERRIDES[key];
    if (overridden) return overridden;

    return key
        .split("_")
        .filter(Boolean)
        .map((part) => part.replaceAll(/(?<=[a-z])(?=[A-Z])/gu, " "))
        .join(" ");
}

function isDrawnLayer(layer: Leaflet.Layer): layer is DrawnLayer {
    return typeof layer === "object" && layer !== null;
}

function isLooseRecord(value: unknown): value is LooseRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLeafletRuntime(value: unknown): value is LeafletRuntime {
    if (!isLooseRecord(value)) {
        return false;
    }

    return (
        typeof value["Layer"] === "function" &&
        typeof value["map"] === "function" &&
        typeof value["tileLayer"] === "function" &&
        (typeof value["control"] === "function" ||
            typeof value["control"] === "object") &&
        value["control"] !== null
    );
}

export async function waitForMapLeafletRuntime(): Promise<boolean> {
    return (await waitForLeafletRuntime(isLeafletRuntime)) !== null;
}

function getActiveFitMapActivityData(): FitMapActivityData | null {
    const data = getActiveFitActivityData().rawData;
    return data !== null && typeof data === "object" ? data : null;
}

function isLeafletLayer(
    L: LeafletRuntime,
    value: unknown
): value is Leaflet.Layer {
    return value instanceof L.Layer;
}

function bringMatchingCircleMarkersToFront(
    L: LeafletRuntime,
    polyline: OverlayPolyline
): void {
    const layers = polyline._map?._layers;
    if (!layers) {
        return;
    }

    for (const layer of Object.values(layers)) {
        if (
            layer instanceof L.CircleMarker &&
            layer.options.color === polyline.options.color &&
            typeof layer.bringToFront === "function"
        ) {
            layer.bringToFront();
        }
    }
}

function bringOverlayMarkersToFront(
    L: LeafletRuntime,
    overlayPolylines: null | Record<string, OverlayPolyline> | undefined
): void {
    if (!overlayPolylines) {
        return;
    }

    for (const [idx, polyline] of Object.entries(overlayPolylines)) {
        console.log(
            `[renderMap] Bring to front: overlay idx=${idx}, polyline=`,
            polyline
        );
        bringMatchingCircleMarkersToFront(L, polyline);
    }
}

function restoreDrawnLayer({
    L,
    drawnItems,
    item,
}: {
    L: LeafletRuntime;
    drawnItems: DrawnItemsLayerGroup;
    item: DrawnLayerSnapshot;
}): void {
    try {
        L.geoJSON(item.geoJSON, {
            onEachFeature: (_feature: unknown, createdLayer: Leaflet.Layer) => {
                drawnItems.addLayer(createdLayer);
            },
            pointToLayer: (
                _feature: unknown,
                latlng: Leaflet.LatLngExpression
            ) => L.marker(latlng),
            style: item.options,
        });
    } catch (error) {
        console.warn("[renderMap] Failed to restore drawn item:", error);
    }
}

/**
 * Render the activity map, controls, overlays, and Leaflet plugin integrations.
 */
export function renderMap(): void {
    // Reset overlay polylines to prevent stale references and memory leaks
    const LeafletLib = resolveLeafletRuntime(isLeafletRuntime);
    if (!LeafletLib) {
        console.warn(
            "[renderMap] Leaflet library unavailable; skipping map render."
        );
        return;
    }
    const L = LeafletLib;
    const runtimeBaseLayers = createBaseLayers(LeafletLib);
    resetOverlayMapPolylines();
    renderMapAbortController?.abort();
    const runtime = getRenderMapRuntime();
    const renderAbortController = runtime.createAbortController();
    renderMapAbortController = renderAbortController;
    const listenerOptions: AddEventListenerOptions = {
        signal: renderAbortController.signal,
    };
    const cleanupTimers = new Set<RenderMapTimer>();
    const setCleanupTimeout = (
        callback: () => void,
        delay: number
    ): RenderMapTimer => {
        const timeout = runtime.setTimeout(() => {
            cleanupTimers.delete(timeout);
            callback();
        }, delay);
        cleanupTimers.add(timeout);
        return timeout;
    };
    renderAbortController.signal.addEventListener(
        "abort",
        () => {
            for (const timeout of cleanupTimers) {
                runtime.clearTimeout(timeout);
            }
            cleanupTimers.clear();
        },
        { once: true, signal: renderAbortController.signal }
    );

    const scheduleMicrotask =
        typeof queueMicrotask === "function"
            ? queueMicrotask
            : (callback: () => void) => Promise.resolve().then(callback);

    const mapContainer = runtime.querySelectorByIdFlexible("#content_map");
    if (!mapContainer) {
        return;
    }

    // Defensive cleanup: overlay filename tooltips can become orphaned if the
    // overlay list or map is re-rendered while a tooltip is visible.
    try {
        for (const el of runtime.querySelectorAll(
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
    let savedDrawnLayers: DrawnLayerSnapshot[] = [];
    const registeredDrawnItems =
        getRegisteredMapDrawnItems<DrawnItemsLayerGroup>();
    if (registeredDrawnItems?.getLayers) {
        try {
            const drawnLayers = registeredDrawnItems
                .getLayers()
                .filter(isDrawnLayer);
            savedDrawnLayers = drawnLayers
                .map(
                    (
                        layer
                    ): DrawnLayerSnapshot & {
                        geoJSON: LeafletGeoJsonInput | null;
                    } => {
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
                    }
                )
                .filter(
                    (item): item is DrawnLayerSnapshot => item.geoJSON !== null
                );
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
        removeRegisteredMapMeasureControl();
    } catch {
        /* ignore */
    }

    try {
        removeRegisteredMapDrawControl();
    } catch {
        /* ignore */
    }

    // Clear old drawnItems reference now that we've snapshot the geoJSON.
    setRegisteredMapDrawnItems(null);

    try {
        removeRegisteredMapMiniMapControl();
    } catch {
        /* ignore */
    }

    // Fix: Remove any previous Leaflet map instance to avoid grey background bug
    removeRegisteredLeafletMapInstance();

    // If an old shown-files list exists, invoke its cleanup hook before removing DOM.
    try {
        const oldShownFilesList =
            mapContainer.querySelector<ShownFilesListElement>(
                ".shown-files-list"
            );
        if (
            oldShownFilesList &&
            typeof oldShownFilesList._dispose === "function"
        ) {
            oldShownFilesList._dispose();
        }
    } catch {
        /* ignore */
    }
    const oldMapDiv = runtime.querySelector("#leaflet-map");
    if (oldMapDiv) {
        oldMapDiv.remove();
    }
    while (mapContainer.firstChild) {
        mapContainer.firstChild.remove();
    }

    const leafletMapDiv = runtime.createElement("div");
    leafletMapDiv.id = "leaflet-map";
    mapContainer.append(leafletMapDiv);

    const mapControlsDiv = runtime.createElement("div");
    mapControlsDiv.id = "map-controls";
    mapControlsDiv.className = "map-controls-panel";
    const primaryControlsContainer = runtime.createElement("div");
    primaryControlsContainer.className = "map-controls-panel__primary";
    mapControlsDiv.append(primaryControlsContainer);
    mapContainer.append(mapControlsDiv);

    const layerEntries = Object.keys(runtimeBaseLayers)
        .filter((k) => Object.hasOwn(runtimeBaseLayers, k))
        .map((k) => ({
            key: k,
            label: formatBaseLayerLabel(k),
        }));

    // Ensure labels are unique for the Leaflet layers control.
    const usedLabels = new Set<string>();
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
        const ai = PREFERRED_BASE_LAYER_ORDER.indexOf(a.key);
        const bi = PREFERRED_BASE_LAYER_ORDER.indexOf(b.key);
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

    const labelToKey = new Map<string, BaseLayerKey>(
        layerEntries.map((e) => [e.label, e.key])
    );

    // Resolve persisted values to a valid baseLayers key. Supports current keys,
    // legacy lower-cased ids, and UI labels from older persisted settings.
    const resolveBaseLayerKey = (value: unknown): BaseLayerKey => {
        const trimmed = typeof value === "string" ? value.trim() : "";
        if (!trimmed) return "OpenStreetMap";

        const byLabel = labelToKey.get(trimmed);
        if (byLabel) return byLabel;

        if (Object.hasOwn(runtimeBaseLayers, trimmed)) {
            return trimmed;
        }

        const normalizedKey = normalizeMapBaseLayer(trimmed);
        return Object.hasOwn(runtimeBaseLayers, normalizedKey)
            ? normalizedKey
            : "OpenStreetMap";
    };

    // Build the final list for the Leaflet layers control.
    // This intentionally includes the full catalogue; layoutLayersControl() will constrain it.
    const baseLayersForControl = Object.fromEntries(
        layerEntries
            .map(
                (entry) => [entry.label, runtimeBaseLayers[entry.key]] as const
            )
            .filter((entry): entry is readonly [string, Leaflet.Layer] =>
                isLeafletLayer(LeafletLib, entry[1])
            )
    );

    const persistedBaseLayerKey = resolveBaseLayerKey(getMapBaseLayer());
    const persistedBaseLayer = runtimeBaseLayers[persistedBaseLayerKey];
    const openStreetMapLayer = runtimeBaseLayers["OpenStreetMap"];
    const initialBaseLayer = isLeafletLayer(LeafletLib, persistedBaseLayer)
        ? persistedBaseLayer
        : openStreetMapLayer;
    if (!isLeafletLayer(LeafletLib, initialBaseLayer)) {
        console.warn("[renderMap] No valid Leaflet base layer available.");
        return;
    }

    const mapOptions: Leaflet.MapOptions & { fullscreenControl: boolean } = {
        center: [0, 0],
        fullscreenControl: true,
        layers: [initialBaseLayer],
        zoom: 2,
    };

    const map = LeafletLib.map("leaflet-map", mapOptions);
    setRegisteredLeafletMapInstance(map);

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
            setMapBaseLayer(resolvedKey, {
                source: "renderMap.baselayerchange",
            });
        } catch {
            /* ignore */
        }
    });

    // Add a custom floating label/button to indicate map type selection
    const mapTypeBtn = runtime.createElement("button");
    mapTypeBtn.type = "button";
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
    const leafletMapDiv2 = runtime.querySelector("#leaflet-map");
    if (leafletMapDiv2) {
        leafletMapDiv2.append(mapTypeBtn);
    }

    setMapDocumentControlRefs({
        layoutLayersControl: () =>
            layoutLayersControl({ layersControlEl: null }),
        mapTypeButton: mapTypeBtn,
    });
    ensureMapDocumentListenersInstalled();

    function getLayersControlEl(): HTMLElement | null {
        const el = runtime.querySelector(".leaflet-control-layers");
        return el instanceof HTMLElement ? el : null;
    }

    function openLayersControl(options: { focusFirst?: boolean } = {}): void {
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        layersControlEl.classList.add("leaflet-control-layers-expanded");
        layersControlEl.style.zIndex = "10025"; // Just below the button
        layoutLayersControl({ layersControlEl });

        if (options.focusFirst) {
            const firstInput = layersControlEl.querySelector<HTMLInputElement>(
                'input[type="radio"]'
            );
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    function closeLayersControl(): void {
        const layersControlEl = getLayersControlEl();
        if (!layersControlEl) return;
        const layersListEl = layersControlEl.querySelector<HTMLElement>(
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

    function handleMapTypeButtonClick(e: Event): void {
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
        let openTimer: RenderMapTimer | null = null;
        let closeTimer: RenderMapTimer | null = null;

        const clearOpenTimer = () => {
            if (openTimer) {
                runtime.clearTimeout(openTimer);
                openTimer = null;
            }
        };
        const clearCloseTimer = () => {
            if (closeTimer) {
                runtime.clearTimeout(closeTimer);
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
    function layoutLayersControl({
        layersControlEl,
    }: {
        layersControlEl: HTMLElement | null;
    }): void {
        const layersEl =
            layersControlEl ||
            runtime.querySelector<HTMLElement>(".leaflet-control-layers");
        const mapEl = runtime.querySelector("#leaflet-map");
        if (!layersEl || !(layersEl instanceof HTMLElement) || !mapEl) {
            return;
        }

        const layersListEl = layersEl.querySelector<HTMLElement>(
            ".leaflet-control-layers-list"
        );

        setMapDocumentControlRefs({
            layoutLayersControl: () =>
                layoutLayersControl({ layersControlEl: layersEl }),
        });

        // Only apply layout rules when the panel is expanded.
        if (!layersEl.classList.contains("leaflet-control-layers-expanded")) {
            return;
        }

        const mapTypeRect = mapTypeBtn.getBoundingClientRect();
        const mapRect = mapEl.getBoundingClientRect();
        const minimapEl = runtime.querySelector(".leaflet-control-minimap");
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

        // Use RAF so we measure after Leaflet expanded class applies.
        runtime.requestAnimationFrame(() => {
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

            runtime.requestAnimationFrame(() => {
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
    const zoomSliderBar = runtime.createElement("div");
    zoomSliderBar.className = "custom-zoom-slider-bar";
    const maxZoom = map.getMaxZoom(),
        minZoom = map.getMinZoom(),
        percentToZoom = (percent: number) =>
            minZoom + ((maxZoom - minZoom) * percent) / 100,
        zoomToPercent = (zoom: number) =>
            ((zoom - minZoom) / (maxZoom - minZoom)) * 100;
    const zoomLabel = runtime.createElement("div");
    zoomLabel.className = "custom-zoom-slider-label";
    zoomLabel.textContent = "Zoom";

    const zoomSlider = runtime.createElement("input");
    zoomSlider.id = "zoom-slider-input";
    zoomSlider.type = "range";
    zoomSlider.min = "0";
    zoomSlider.max = "100";
    zoomSlider.step = "1";
    zoomSlider.value = String(Math.round(zoomToPercent(map.getZoom())));

    const values = runtime.createElement("div");
    values.className = "custom-zoom-slider-values";

    const minSpan = runtime.createElement("span");
    minSpan.id = "zoom-slider-min";
    minSpan.textContent = "0%";

    const maxSpan = runtime.createElement("span");
    maxSpan.id = "zoom-slider-max";
    maxSpan.textContent = "100%";

    const currentSpan = runtime.createElement("span");
    currentSpan.id = "zoom-slider-current";
    currentSpan.textContent = `${Math.round(zoomToPercent(map.getZoom()))}%`;

    const sep1 = runtime.createElement("span");
    sep1.className = "margin-horizontal";
    sep1.textContent = "|";

    const sep2 = runtime.createElement("span");
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
    setMapDocumentControlRefs({ zoomDraggingRef });
    // Debounce function to limit the frequency of updates
    function debounce<Args extends unknown[]>(
        func: (...args: Args) => void,
        wait: number
    ): (...args: Args) => void {
        let timeout: RenderMapTimer | undefined;
        return (...args: Args) => {
            if (timeout) {
                runtime.clearTimeout(timeout);
            }
            timeout = runtime.setTimeout(() => func(...args), wait);
        };
    }
    if (zoomSlider && zoomSliderCurrent) {
        zoomSlider.addEventListener(
            "input",
            debounce((e: Event) => {
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
    const leafletMapContainer =
        runtime.querySelectorByIdFlexible("#leaflet-map");
    if (leafletMapContainer) {
        leafletMapContainer.append(zoomSliderBar);
    }

    L.control
        .scale({ imperial: true, metric: true, position: "bottomleft" })
        .addTo(map);

    addLeafletFullscreenPluginControl(L, map);
    addLeafletLocatePluginControl(L, map);

    // --- Print/export button ---
    const controlsDiv = runtime.querySelector<HTMLElement>("#map-controls");
    const primaryControls =
        controlsDiv?.querySelector<HTMLElement>(
            ".map-controls-panel__primary"
        ) ?? controlsDiv;
    const ensureSecondaryControls = (): HTMLElement | null => {
        if (!controlsDiv) {
            return null;
        }
        let secondary = controlsDiv.querySelector<HTMLElement>(
            ".map-controls-panel__secondary"
        );
        if (!secondary) {
            secondary = runtime.createElement("div");
            secondary.className = "map-controls-panel__secondary";
            controlsDiv.append(secondary);
        }
        return secondary;
    };

    let filterControl:
        | (HTMLElement & { refreshSummary?: () => void })
        | undefined;

    const resetLapSelectorSelection = () => {
        const lapSelect = runtime.querySelector("#lap-select");
        if (!(lapSelect instanceof HTMLSelectElement)) {
            return false;
        }
        if (lapSelect.value === "all") {
            return false;
        }
        lapSelect.selectedIndex = 0;
        lapSelect.dispatchEvent(runtime.createChangeEvent());
        return true;
    };

    if (controlsDiv && primaryControls) {
        primaryControls.append(createPrintButton());
        primaryControls.append(createMapThemeToggle());
        primaryControls.append(createExportGPXButton());
        primaryControls.append(createElevationProfileButton());
        filterControl = createDataPointFilterControl(({ action }) => {
            const didReset = resetLapSelectorSelection();
            if (!didReset && hasActiveFitRecords()) {
                mapDrawLapsWrapper("all");
            }
            updateShownFilesList();
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
            getData: getActiveFitPowerInput,
            onAfterApply: () => {
                // Redraw map so tooltips/points pick up the updated estimated power values.
                mapDrawLapsWrapper("all");
                updateShownFilesList();

                void refreshChartsAfterEstimatedPowerUpdate();

                try {
                    const currentActivityData = getActiveFitMapActivityData();
                    if (currentActivityData) {
                        renderSummary(currentActivityData);
                    }
                } catch {
                    /* ignore */
                }

                try {
                    const currentActivityData = getActiveFitMapActivityData();
                    if (currentActivityData) {
                        createTables(currentActivityData);
                    }
                } catch {
                    /* ignore */
                }
            },
        });

        try {
            if (hasPowerData(getActiveFitActivityData().recordMesgs)) {
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
                if (!didReset && hasActiveFitRecords()) {
                    mapDrawLapsWrapper("all");
                }
                updateShownFilesList();
            })
        );

        // Avoid duplicate measurement controls.
        // Prefer the Leaflet control (leaflet-measure-lite) when present; fall back to the simple
        // 2-click measure button only when the control plugin is unavailable.
        if (!hasLeafletMeasurePluginControl(L)) {
            addSimpleMeasureTool(map, primaryControls);
        }
        primaryControls.append(createAddFitFileToMapButton());
        if (getLoadedFitFiles().length > 1) {
            const shownFilesList = createShownFilesList();
            const secondaryControls = ensureSecondaryControls();
            if (secondaryControls) {
                secondaryControls.append(shownFilesList);
            }
            updateShownFilesList();
        }

        initializeActiveFileNameMapActions();
    }

    // --- Fullscreen button (custom, styled, top left) ---
    addFullscreenControl(map);

    // --- Custom icons for start/end ---
    const endIcon = createEndIcon(),
        startIcon = createStartIcon();

    // --- Lap selection UI (moved to mapLapSelector.js) ---
    function mapDrawLapsWrapper(lapIdx: number | string | string[]): void {
        mapDrawLaps(lapIdx, {
            baseLayers,
            endIcon,
            formatTooltipData,
            getLapColor,
            getLapNumForIdx,
            map,
            mapContainer:
                mapContainer || runtime.getMapContainerFallback("#leaflet-map"),
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
    const leafletMapElement = runtime.querySelector<HTMLElement>("#leaflet-map");
    if (leafletMapElement) {
        addLapSelector(map, leafletMapElement, mapDrawLapsWrapper);
    }

    const miniMap = addLeafletMiniMapPluginControl(L, map, setCleanupTimeout);
    if (miniMap) {
        setRegisteredMapMiniMapControl(miniMap);
    }

    const measureControl = addLeafletMeasurePluginControl(L, map);
    if (measureControl) {
        setRegisteredMapMeasureControl(measureControl);
    }

    const drawPluginSetup = addLeafletDrawPluginControl({
        leaflet: L,
        map,
        onLayerCreated: (layer, drawnItems) => {
            if (isLeafletLayer(L, layer)) {
                drawnItems.addLayer(layer);
            }
        },
    });
    if (drawPluginSetup) {
        const { drawnItems } = drawPluginSetup;
        const drawControl = drawPluginSetup.drawControl as DisposableControl;
        setRegisteredMapDrawControl(drawControl);

        // UX fix: Leaflet.draw's tooltip says "Click last point to finish line", but in practice
        // the click target (vertex marker) is tiny. If the user clicks *near* the last point, we
        // proactively finish the line so the workflow matches the tooltip.
        {
            let activeHandler: DrawActiveHandler | null = null;
            let preclickListener: Leaflet.LeafletEventHandlerFn | undefined;

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

            map.on(
                "draw:drawstart",
                (evt: Leaflet.LeafletEvent & { layerType?: string }) => {
                    try {
                        const type =
                            evt && typeof evt === "object"
                                ? evt.layerType
                                : null;
                        if (type !== "polyline") {
                            detach();
                            return;
                        }

                        // Leaflet.draw stores the active mode handler here.
                        activeHandler =
                            drawControl?._toolbars?.draw?._activeMode
                                ?.handler ?? null;

                        preclickListener = (event) => {
                            try {
                                const e = event as Leaflet.LeafletMouseEvent;
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
                                    typeof lastMarker.getLatLng !==
                                        "function" ||
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
                }
            );

            map.on("draw:drawstop", detach);
        }

        // Store reference to drawn items for persistence
        setRegisteredMapDrawnItems(drawnItems);

        // Restore previously drawn items
        if (savedDrawnLayers && savedDrawnLayers.length > 0) {
            console.log(
                "[renderMap] Restoring",
                savedDrawnLayers.length,
                "drawn items"
            );
            for (const item of savedDrawnLayers) {
                restoreDrawnLayer({ L, drawnItems, item });
            }
        }
    }

    // --- Overlay logic ---
    // Apply estimated power before drawing any tracks/markers so tooltips have access.
    // Only applies to files without real power.
    try {
        const activityData = getActiveFitPowerInput();
        if (activityData.recordMesgs.length > 0) {
            applyEstimatedPowerToRecords({
                ...activityData,
                settings: getPowerEstimationSettings(),
            });
        }
        for (const fitFile of getLoadedFitFiles()) {
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
    } catch {
        /* ignore */
    }

    const loadedFitFiles = getLoadedFitFiles();
    if (loadedFitFiles.length > 0) {
        console.log(
            "[renderMap] Overlay logic: loadedFitFiles.length =",
            loadedFitFiles.length
        );
        // Clear overlay polylines tracking before drawing
        resetOverlayMapPolylines();
        for (const [idx, fitFile] of loadedFitFiles.entries()) {
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
                formatTooltipData: (
                    pointIdx: number,
                    row: LooseRecord,
                    lapNum: number
                ) =>
                    formatTooltipData(
                        pointIdx,
                        row,
                        lapNum,
                        fitFile.data && fitFile.data.recordMesgs
                    ),
                getLapNumForIdx,
                map,
                overlayIdx: idx,
                startIcon,
            });
            console.log(`[renderMap] Overlay idx=${idx} bounds:`, bounds);
        }
        // --- Bring overlay markers to front so they appear above all polylines ---
        setCleanupTimeout(() => {
            bringOverlayMarkersToFront(
                L,
                getOverlayMapPolylines<OverlayPolyline>()
            );
        }, 10);
        console.log(
            "[renderMap] Overlay logic complete. No fitBounds/zoom called here."
        );
        // --- Always call mapDrawLapsWrapper('all') to ensure correct zoom/fitBounds logic ---
        mapDrawLapsWrapper("all");
    } else if (hasActiveFitRecords()) {
        console.log(
            '[renderMap] No overlays, calling mapDrawLapsWrapper("all")'
        );
        mapDrawLapsWrapper("all");
    }

    // Restore highlight after overlays are drawn, if any
    console.log(
        "[FFV] [renderMap] Calling updateOverlayHighlights, highlightedOverlayIdx:",
        getHighlightedOverlayIndex()
    );
    updateOverlayHighlights();
    console.log(
        "[FFV] [renderMap] Calling updateShownFilesList after overlays drawn"
    );
    updateShownFilesList();
    // Enable/disable lap selector based on number of loaded files
    function updateLapSelectorEnabledState(): void {
        const lapSelect =
            runtime.querySelector<HTMLSelectElement>("#lap-select");
        if (lapSelect) {
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
            const miniMapInstance =
                getRegisteredMapMiniMapControl<DisposableControl>()?._miniMap;
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

    refreshMapLayout();
    runtime.requestAnimationFrame(() => refreshMapLayout());
    setCleanupTimeout(refreshMapLayout, 90);
    setCleanupTimeout(refreshMapLayout, 240);

    // --- Theme support (dark/light) ---
    if (runtime.querySelector("#leaflet-map")) {
        installUpdateMapThemeListeners();
        updateMapTheme();
    }
}

async function refreshChartsAfterEstimatedPowerUpdate(): Promise<void> {
    try {
        const { invalidateChartRenderCache, renderChartJS } =
            await import("../../charts/core/renderChartJS.js");
        invalidateChartRenderCache("estimated-power-updated");
        await renderChartJS();
    } catch {
        /* ignore */
    }
}

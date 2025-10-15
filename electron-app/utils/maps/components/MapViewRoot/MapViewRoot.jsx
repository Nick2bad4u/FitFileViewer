import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getLapNumForIdx } from "../../../data/processing/getLapNumForIdx.js";
import { formatTooltipData } from "../../../formatting/display/formatTooltipData.js";
import { getGlobalData } from "../../../state/domain/globalDataState.js";
import { useAppState } from "../../../state/hooks/useAppState.js";
import { getMapThemeInverted } from "../../../theming/specific/createMapThemeToggle.js";
import { updateMapTheme } from "../../../theming/specific/updateMapTheme.js";
import { getEffectiveTheme } from "../../../theming/core/theme.js";
import { showNotification } from "../../../ui/notifications/showNotification.js";
import { addFullscreenControl } from "../../controls/mapFullscreenControl.js";
import { addLapSelector } from "../../controls/mapLapSelector.js";
import { addZoomSlider } from "../../controls/mapZoomSlider.js";
import { getLapColor } from "../../core/mapColors.js";
import {
    calculatePolygonArea,
    calculatePolylineLength,
    flattenLatLngs,
    formatArea,
    formatCircleSummary,
    formatDistanceSummary,
    formatMetricDistance,
} from "../../helpers/measurementFormatting.js";
import { baseLayers } from "../../layers/mapBaseLayers.js";
import { mapDrawLaps } from "../../layers/mapDrawLaps.js";
import { createEndIcon, createStartIcon } from "../../layers/mapIcons.js";
import { MapControls } from "./MapControls.jsx";

const MAP_THEME_BASE_LAYER_CONFIG = Object.freeze({
    dark: "CartoDB_DarkMatter",
    fallback: "OpenStreetMap",
    light: "CartoDB_Positron",
});

const MINI_MAP_LAYER_SPECS = Object.freeze({
    dark: {
        options: { attribution: "", subdomains: "abcd" },
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    },
    fallback: {
        options: { attribution: "" },
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
    light: {
        options: { attribution: "", subdomains: "abcd" },
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    },
});


/**
 * @typedef {{ startIcon: any; endIcon: any }} MarkerIconPair
 */

/**
 * @typedef {ReturnType<typeof getGlobalData>} GlobalDataSnapshot
 */

/**
 * React host for the Leaflet map and control surface.
 * Handles initializing Leaflet, bridging legacy globals, and redrawing overlays
 * whenever application state changes.
 *
 * @returns {import("react").ReactNode}
 */
export function MapViewRoot() {
    const mapContainerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    const lapControlRef = useRef(/** @type {HTMLElement | null} */ (null));
    const layersControlContainerRef = useRef(/** @type {HTMLElement | null} */ (null));
    const markerClusterGroupRef = useRef(/** @type {any} */ (null));
    const dynamicLayerGroupRef = useRef(/** @type {any} */ (null));
    const miniMapControlRef = useRef(/** @type {any} */ (null));
    const drawnItemsRef = useRef(/** @type {any} */ (null));
    const resizeObserverRef = useRef(/** @type {ResizeObserver | null} */ (null));
    const mapResizeHandlerRef = useRef(/** @type {(event?: Event) => void} */ (() => {}));
    const mapInstanceRef = useRef(/** @type {any} */ (null));
    const markerIconsRef = useRef(/** @type {MarkerIconPair} */ ({ startIcon: null, endIcon: null }));

    const [mapInstance, setMapInstance] = useState(/** @type {any} */ (null));
    const [mapError, setMapError] = useState(/** @type {string | null} */ (null));

    const mapControlsTheme = getMapThemeInverted() ? "dark" : "light";
    const uiTheme = getEffectiveTheme();

    const overlayFiles = useAppState((state) => state?.overlays?.loadedFitFiles ?? []);
    const highlightedOverlayIndex = useAppState((state) => state?.overlays?.highlightedOverlayIndex ?? null);
    const globalData = useAppState((state) => state?.globalData ?? null);

    const overlaySignature = useMemo(() => {
        if (!overlayFiles || overlayFiles.length === 0) {
            return "__EMPTY__";
        }
        return overlayFiles
            .map((
                /** @type {{ filePath?: string; data?: { recordMesgs?: unknown[] } }} */ entry,
                /** @type {number} */ idx
            ) => {
                const path = typeof entry?.filePath === "string" ? entry.filePath : `overlay-${idx}`;
                const recordCount = Array.isArray(entry?.data?.recordMesgs) ? entry.data.recordMesgs.length : 0;
                return `${idx}:${path}:${recordCount}`;
            })
            .join("|");
    }, [overlayFiles]);

    const lapCount = Array.isArray(globalData?.lapMesgs) ? globalData.lapMesgs.length : 0;
    const recordCount = Array.isArray(globalData?.recordMesgs) ? globalData.recordMesgs.length : 0;

    const updateLapSelectorEnabledState = useCallback(() => {
        const lapSelect = /** @type {HTMLSelectElement | null} */ (document.querySelector("#lap-select"));
        if (!lapSelect) {
            return;
        }
        try {
            getGlobalData();
            lapSelect.disabled = false;
        } catch {
            lapSelect.disabled = false;
        }
    }, []);

    const mapDrawLapsWrapper = useCallback(
        /**
         * @param {string | number | Array<string | number>} lapSelection
         */
        (lapSelection) => {
            const map = mapInstanceRef.current;
            const mapContainer = mapContainerRef.current;
            if (!map || !mapContainer) {
                return;
            }
            let { startIcon, endIcon } = markerIconsRef.current;
            if (!startIcon || !endIcon) {
                startIcon = createStartIcon();
                endIcon = createEndIcon();
                markerIconsRef.current = { startIcon, endIcon };
            }
            mapDrawLaps(lapSelection ?? "all", {
                baseLayers,
                dynamicLayerGroup: dynamicLayerGroupRef.current,
                endIcon,
                formatTooltipData,
                getLapColor,
                getLapNumForIdx,
                map,
                mapContainer,
                markerClusterGroup: markerClusterGroupRef.current,
                startIcon,
            });
        },
        []
    );

    useEffect(() => {
        const windowExt = /** @type {any} */ (globalThis);
        const mapContainer = mapContainerRef.current;
        if (!mapContainer) {
            return;
        }

        windowExt._overlayPolylines = {};
        if (windowExt._mapResizeObserver && typeof windowExt._mapResizeObserver.disconnect === "function") {
            try {
                windowExt._mapResizeObserver.disconnect();
            } catch {
                /* ignore */
            }
        }
        windowExt._mapResizeObserver = null;
        if (windowExt._mapResizeHandler) {
            try {
                window.removeEventListener("resize", windowExt._mapResizeHandler);
            } catch {
                /* ignore */
            }
            delete windowExt._mapResizeHandler;
        }
        if (windowExt._miniMapControl && typeof windowExt._miniMapControl.remove === "function") {
            try {
                windowExt._miniMapControl.remove();
            } catch {
                /* ignore */
            }
        }
        delete windowExt._miniMapControl;
        windowExt.__reactMapRedraw = mapDrawLapsWrapper;
        delete windowExt.__mapMarkerSummaryHandler;
        windowExt.updateShownFilesList ||= () => {};
        windowExt.updateMapMarkerSummary ||= () => {};
        windowExt.updateMapTheme = updateMapTheme;

        if (windowExt._leafletMapInstance && typeof windowExt._leafletMapInstance.remove === "function") {
            try {
                windowExt._leafletMapInstance.remove();
            } catch {
                /* ignore */
            }
            windowExt._leafletMapInstance = null;
        }

        mapContainer.innerHTML = "";
        const LeafletLib = /** @type {any} */ (windowExt).L;
        if (!LeafletLib) {
            setMapError("Map library not loaded. Please check your connection.");
            return;
        }
        setMapError(null);

        const mapPrefersDark = getMapThemeInverted();

        const managedLayerConfig = { ...MAP_THEME_BASE_LAYER_CONFIG };
        const managedLayerIds = new Set(
            Object.values(managedLayerConfig).filter((value) => typeof value === "string" && value.length > 0)
        );
        const baseLayerRegistry = {};
        const baseLayerIdLookup = new WeakMap();

        for (const [layerId, layer] of Object.entries(baseLayers)) {
            if (layer && typeof layer.addTo === "function") {
                baseLayerRegistry[layerId] = layer;
                baseLayerIdLookup.set(layer, layerId);
            }
        }

        windowExt.__mapLayerRegistry = baseLayerRegistry;
        windowExt.__mapManagedLayerConfig = managedLayerConfig;
        windowExt.__mapBaseLayerIdLookup = baseLayerIdLookup;
        windowExt.__mapManagedLayerIds = managedLayerIds;
        windowExt.__mapBaseLayerManual = false;
        windowExt.__mapCurrentBaseLayer = null;
        windowExt.__mapCurrentBaseLayerId = null;

        const resolveManagedLayer = (themeKey) => {
            const candidateId = themeKey === "dark" ? managedLayerConfig.dark : managedLayerConfig.light;
            const fallbackId = managedLayerConfig.fallback;
            const resolvedId = candidateId && baseLayerRegistry[candidateId] ? candidateId : fallbackId;
            const layer = resolvedId ? baseLayerRegistry[resolvedId] : undefined;
            return { id: resolvedId ?? null, layer: layer ?? null };
        };

        // Leaflet exposes its map factory as `L.map`, which trips unicorn's array map heuristics.
        // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
        const map = LeafletLib.map(mapContainer, {
            center: [0, 0],
            fullscreenControl: false,
            layers: [],
            zoom: 2,
        });
        windowExt._leafletMapInstance = map;
        mapInstanceRef.current = map;
        setMapInstance(map);

        const dynamicLayerGroup = typeof LeafletLib.layerGroup === "function" ? LeafletLib.layerGroup() : null;
        if (dynamicLayerGroup) {
            dynamicLayerGroup.addTo(map);
            dynamicLayerGroupRef.current = dynamicLayerGroup;
            windowExt.__mapDynamicLayerGroup = dynamicLayerGroup;
        } else {
            dynamicLayerGroupRef.current = null;
            delete windowExt.__mapDynamicLayerGroup;
        }

        const initialLayer = resolveManagedLayer(mapPrefersDark ? "dark" : "light");
        if (initialLayer.layer && typeof initialLayer.layer.addTo === "function") {
            initialLayer.layer.addTo(map);
            windowExt.__mapCurrentBaseLayer = initialLayer.layer;
            windowExt.__mapCurrentBaseLayerId = initialLayer.id;
            windowExt.__mapBaseLayerManual = false;
        } else if (baseLayerRegistry.OpenStreetMap && typeof baseLayerRegistry.OpenStreetMap.addTo === "function") {
            baseLayerRegistry.OpenStreetMap.addTo(map);
            windowExt.__mapCurrentBaseLayer = baseLayerRegistry.OpenStreetMap;
            windowExt.__mapCurrentBaseLayerId = "OpenStreetMap";
        }

        const forceInvalidateSize = () => {
            try {
                map.invalidateSize();
            } catch {
                /* ignore */
            }
        };

        let lastLocationErrorTs = 0;
        const handleLocationError = (errorEvent) => {
            const now = Date.now();
            if (now - lastLocationErrorTs < 1500) {
                return;
            }
            lastLocationErrorTs = now;
            const reason = typeof errorEvent?.message === "string" && errorEvent.message.length > 0
                ? errorEvent.message
                : "Location access denied or unavailable.";
            showNotification(`Unable to determine position: ${reason}`, "warning");
        };
        map.on("locationerror", handleLocationError);

        if (typeof map.whenReady === "function") {
            map.whenReady(() => {
                forceInvalidateSize();
                setTimeout(forceInvalidateSize, 200);
            });
        } else {
            forceInvalidateSize();
            setTimeout(forceInvalidateSize, 200);
        }

        if (typeof ResizeObserver === "function") {
            const resizeObserver = new ResizeObserver(() => {
                forceInvalidateSize();
            });
            resizeObserver.observe(mapContainer);
            resizeObserverRef.current = resizeObserver;
            windowExt._mapResizeObserver = resizeObserver;
        }

        const mapResizeHandler = () => {
            forceInvalidateSize();
        };
        window.addEventListener("resize", mapResizeHandler, { passive: true });
        mapResizeHandlerRef.current = mapResizeHandler;
        windowExt._mapResizeHandler = mapResizeHandler;

        const layersControl = LeafletLib.control.layers(baseLayers, null, { collapsed: true, position: "topright" });
        layersControl.addTo(map);
        map.on("baselayerchange", (event) => {
            try {
                const selectedLayer = /** @type {any} */ (event?.layer ?? null);
                const layerId = selectedLayer ? baseLayerIdLookup.get(selectedLayer) ?? null : null;
                windowExt.__mapCurrentBaseLayer = selectedLayer ?? null;
                windowExt.__mapCurrentBaseLayerId = layerId;
                windowExt.__mapBaseLayerManual = !(layerId && managedLayerIds.has(layerId));
            } catch (error) {
                console.warn("[MapViewRoot] Failed to sync base layer change", error);
            }
        });
        const layersControlContainer =
            typeof layersControl.getContainer === "function"
                ? layersControl.getContainer()
                : document.querySelector(".leaflet-control-layers");
        decorateLayerControlIcons(/** @type {HTMLElement | null | undefined} */ (layersControlContainer));
        layersControlContainerRef.current = /** @type {HTMLElement | null} */ (
            layersControlContainer instanceof HTMLElement ? layersControlContainer : null
        );
        windowExt.__leafletLayerControlEl = layersControlContainerRef.current;

        LeafletLib.control.scale({ imperial: true, metric: true, position: "bottomleft" }).addTo(map);

        if (LeafletLib.control.locate) {
            const locateControlOptions = {
                flyTo: true,
                keepCurrentZoomLevel: true,
                position: "topleft",
                icon: "map-locate-icon--idle",
                iconLoading: "map-locate-icon--loading",
                iconElementTag: "span",
                strings: {
                    title: "Center map on your current location",
                },
                createButtonCallback(container, options) {
                    const link = LeafletLib.DomUtil.create(
                        "a",
                        "leaflet-bar-part leaflet-bar-part-single map-locate-button",
                        container
                    );
                    link.href = "#";
                    link.title = options.strings.title;
                    link.setAttribute("role", "button");
                    link.setAttribute("aria-label", options.strings.title);

                    const iconWrapper = document.createElement(options.iconElementTag ?? "span");
                    iconWrapper.classList.add("map-locate-icon", "map-locate-icon--idle");
                    iconWrapper.setAttribute("aria-hidden", "true");

                    const glyph = document.createElement("iconify-icon");
                    glyph.setAttribute("icon", "mdi:crosshairs-gps");
                    glyph.setAttribute("width", "18");
                    glyph.setAttribute("height", "18");
                    glyph.setAttribute("aria-hidden", "true");
                    glyph.classList.add("map-locate-icon__glyph");

                    const spinner = document.createElement("span");
                    spinner.classList.add("map-locate-icon__spinner");
                    spinner.setAttribute("aria-hidden", "true");

                    iconWrapper.append(glyph, spinner);
                    link.append(iconWrapper);

                    return { link, icon: iconWrapper };
                },
            };

            LeafletLib.control.locate(locateControlOptions).addTo(map);
        }

        addFullscreenControl(map);

        const startIcon = createStartIcon();
        const endIcon = createEndIcon();
        markerIconsRef.current = { startIcon, endIcon };

        let markerClusterGroup = null;
        if (windowExt.L && LeafletLib.markerClusterGroup) {
            markerClusterGroup = LeafletLib.markerClusterGroup();
            map.addLayer(markerClusterGroup);
        }
        markerClusterGroupRef.current = markerClusterGroup;

        if (windowExt.L && LeafletLib.Control && LeafletLib.Control.MiniMap) {
            const buildMiniMapLayer = (themeKey) => {
                const spec = MINI_MAP_LAYER_SPECS[themeKey] ?? MINI_MAP_LAYER_SPECS.fallback;
                if (!spec || typeof LeafletLib.tileLayer !== "function") {
                    return null;
                }
                return LeafletLib.tileLayer(spec.url, { ...spec.options });
            };

            const miniMapLayers = {
                dark: buildMiniMapLayer("dark"),
                fallback: buildMiniMapLayer("fallback"),
                light: buildMiniMapLayer("light"),
            };

            const pickMiniMapLayer = (themeKey) => {
                const candidate = themeKey === "dark" ? miniMapLayers.dark : miniMapLayers.light;
                return candidate ?? miniMapLayers.fallback ?? miniMapLayers.light ?? miniMapLayers.dark ?? null;
            };

            const initialMiniMapLayer = pickMiniMapLayer(mapPrefersDark ? "dark" : "light");
            if (initialMiniMapLayer) {
                const miniMapControl = new LeafletLib.Control.MiniMap(initialMiniMapLayer, {
                    aimingRectOptions: { color: "#2563eb", interactive: false, weight: 2 },
                    height: 180,
                    position: "bottomright",
                    shadowRectOptions: {
                        color: "#2563eb",
                        fillOpacity: 0.1,
                        interactive: false,
                        opacity: 0.35,
                        weight: 1,
                    },
                    toggleDisplay: true,
                    width: 180,
                    zoomAnimation: true,
                    zoomLevelOffset: -5,
                });
                miniMapControl.addTo(map);
                miniMapControlRef.current = miniMapControl;
                windowExt._miniMapControl = miniMapControl;
                windowExt.__miniMapLayers = miniMapLayers;
                if (miniMapControl?._miniMap && typeof miniMapControl._miniMap.invalidateSize === "function") {
                    setTimeout(() => {
                        try {
                            miniMapControl._miniMap.invalidateSize();
                        } catch {
                            /* ignore */
                        }
                    }, 250);
                }
            } else {
                miniMapControlRef.current = null;
                delete windowExt._miniMapControl;
                delete windowExt.__miniMapLayers;
            }
        } else {
            miniMapControlRef.current = null;
            delete windowExt._miniMapControl;
            delete windowExt.__miniMapLayers;
        }

        if (windowExt.L && LeafletLib.control && LeafletLib.control.measure) {
            LeafletLib.control.measure({ position: "topleft" }).addTo(map);
        }

        if (windowExt.L && LeafletLib.Control && LeafletLib.Control.Draw) {
            const drawnItems = new LeafletLib.FeatureGroup();
            map.addLayer(drawnItems);
            drawnItemsRef.current = drawnItems;
            windowExt.__mapDrawnItems = drawnItems;

            const attachTooltipToLayer = (layer, layerType) => {
                if (!layer || typeof layer.bindTooltip !== "function") {
                    return;
                }
                const tooltipOptions = {
                    className: "map-draw-tooltip",
                    permanent: true,
                    sticky: false,
                };
                try {
                    if (layerType === "circle" && typeof layer.getRadius === "function") {
                        const radius = layer.getRadius();
                        layer.bindTooltip(formatCircleSummary(radius), {
                            ...tooltipOptions,
                            direction: "center",
                        });
                        layer.openTooltip();
                        return;
                    }
                    if ((layerType === "polyline" || layerType === "polygon" || layerType === "rectangle") && typeof layer.getLatLngs === "function") {
                        const latLngs = flattenLatLngs(layer.getLatLngs());
                        if (latLngs.length === 0) {
                            return;
                        }
                        if (layerType === "polyline") {
                            const length = calculatePolylineLength(map, latLngs);
                            layer.bindTooltip(formatDistanceSummary(length), {
                                ...tooltipOptions,
                                direction: "auto",
                            });
                            layer.openTooltip();
                            return;
                        }
                        const area = calculatePolygonArea(LeafletLib, latLngs);
                        const [firstPoint] = latLngs;
                        const lastPoint = latLngs.at(-1);
                        const isClosed =
                            firstPoint &&
                            lastPoint &&
                            Math.abs((firstPoint.lat ?? 0) - (lastPoint.lat ?? 0)) < 1e-9 &&
                            Math.abs((firstPoint.lng ?? 0) - (lastPoint.lng ?? 0)) < 1e-9;
                        const perimeter = calculatePolylineLength(map, isClosed ? latLngs : [...latLngs, firstPoint]);
                        const summary = `${formatArea(area)}${perimeter > 0 ? `<br>Perimeter: ${formatMetricDistance(perimeter)}` : ""}`;
                        layer.bindTooltip(summary, {
                            ...tooltipOptions,
                            direction: "center",
                        });
                        layer.openTooltip();
                        return;
                    }
                    if (layerType === "marker" || layerType === "circlemarker") {
                        const latLng = typeof layer.getLatLng === "function" ? layer.getLatLng() : null;
                        if (!latLng) {
                            return;
                        }
                        const latText = latLng.lat.toFixed(5);
                        const lngText = latLng.lng.toFixed(5);
                        layer.bindTooltip(`Lat: ${latText}<br>Lng: ${lngText}`, {
                            ...tooltipOptions,
                            direction: "top",
                            offset: [0, -8],
                        });
                        layer.openTooltip();
                    }
                } catch {
                    /* ignore tooltip failures */
                }
            };

            const drawControl = new LeafletLib.Control.Draw({
                draw: {
                    circle: true,
                    marker: true,
                    polygon: true,
                    polyline: true,
                    rectangle: true,
                },
                edit: false,
            });
            map.addControl(drawControl);

            const handleDrawCreated = (/** @type {any} */ event) => {
                if (!event?.layer) {
                    return;
                }
                attachTooltipToLayer(event.layer, event.layerType);
                drawnItems.addLayer(event.layer);
            };
            map.on(LeafletLib.Draw.Event.CREATED, handleDrawCreated);
            windowExt.__mapDrawCreatedHandler = handleDrawCreated;
            windowExt.__clearDrawnItems = () => {
                try {
                    drawnItems.clearLayers();
                } catch {
                    /* ignore */
                }
            };
        } else {
            drawnItemsRef.current = null;
            delete windowExt.__mapDrawnItems;
            delete windowExt.__clearDrawnItems;
        }

        updateMapTheme();
        if (!windowExt._mapThemeListener) {
            const listener = () => updateMapTheme();
            windowExt._mapThemeListener = listener;
            document.body.addEventListener("themechange", /** @type {EventListener} */ (listener));
        }

        mapDrawLapsWrapper("all");
        updateLapSelectorEnabledState();

        return () => {
            if (resizeObserverRef.current) {
                try {
                    resizeObserverRef.current.disconnect();
                } catch {
                    /* ignore */
                }
            }
            resizeObserverRef.current = null;

            if (mapResizeHandlerRef.current) {
                try {
                    window.removeEventListener("resize", mapResizeHandlerRef.current);
                } catch {
                    /* ignore */
                }
                if (windowExt._mapResizeHandler === mapResizeHandlerRef.current) {
                    delete windowExt._mapResizeHandler;
                }
            }
            mapResizeHandlerRef.current = () => {};

            try {
                map.off("locationerror", handleLocationError);
            } catch {
                /* ignore */
            }

            if (LeafletLib?.Draw?.Event?.CREATED && typeof map.off === "function") {
                try {
                    map.off(LeafletLib.Draw.Event.CREATED, windowExt.__mapDrawCreatedHandler);
                } catch {
                    /* ignore */
                }
            }

            const drawnItems = drawnItemsRef.current;
            if (drawnItems) {
                try {
                    drawnItems.clearLayers();
                    map.removeLayer(drawnItems);
                } catch {
                    /* ignore */
                }
            }
            drawnItemsRef.current = null;
            delete windowExt.__mapDrawnItems;
            delete windowExt.__clearDrawnItems;
            delete windowExt.__mapDrawCreatedHandler;

            const currentDynamicLayerGroup = dynamicLayerGroupRef.current;
            if (currentDynamicLayerGroup) {
                try {
                    currentDynamicLayerGroup.clearLayers();
                    if (mapInstanceRef.current && typeof mapInstanceRef.current.removeLayer === "function") {
                        mapInstanceRef.current.removeLayer(currentDynamicLayerGroup);
                    }
                } catch {
                    /* ignore */
                }
            }
            dynamicLayerGroupRef.current = null;
            if (windowExt.__mapDynamicLayerGroup === currentDynamicLayerGroup) {
                delete windowExt.__mapDynamicLayerGroup;
            }

            if (lapControlRef.current) {
                lapControlRef.current.remove();
                lapControlRef.current = null;
            }

            if (miniMapControlRef.current && typeof miniMapControlRef.current.remove === "function") {
                try {
                    miniMapControlRef.current.remove();
                } catch {
                    /* ignore */
                }
            }
            if (windowExt._miniMapControl === miniMapControlRef.current) {
                delete windowExt._miniMapControl;
            }
            miniMapControlRef.current = null;
            if (windowExt.__miniMapLayers) {
                delete windowExt.__miniMapLayers;
            }

            if (markerClusterGroupRef.current && typeof markerClusterGroupRef.current.clearLayers === "function") {
                try {
                    markerClusterGroupRef.current.clearLayers();
                } catch {
                    /* ignore */
                }
            }
            markerClusterGroupRef.current = null;

            if (mapInstanceRef.current && typeof mapInstanceRef.current.remove === "function") {
                try {
                    mapInstanceRef.current.off();
                    mapInstanceRef.current.remove();
                } catch {
                    /* ignore */
                }
            }
            if (windowExt._leafletMapInstance === mapInstanceRef.current) {
                windowExt._leafletMapInstance = null;
            }
            mapInstanceRef.current = null;
            setMapInstance(null);

            if (layersControlContainerRef.current && layersControlContainerRef.current.parentElement) {
                layersControlContainerRef.current = null;
            }
            if (windowExt.__leafletLayerControlEl) {
                delete windowExt.__leafletLayerControlEl;
            }
            if (windowExt.__reactMapRedraw === mapDrawLapsWrapper) {
                delete windowExt.__reactMapRedraw;
            }
        };
    }, [mapDrawLapsWrapper, updateLapSelectorEnabledState]);

    useEffect(() => {
        const mapContainer = mapContainerRef.current;
        const map = mapInstanceRef.current;
        if (!mapContainer || !map) {
            return;
        }

        const existingControl = mapContainer.querySelector(".custom-lap-control-container");
        if (existingControl) {
            existingControl.remove();
        }

        if (lapCount === 0) {
            lapControlRef.current = null;
            updateLapSelectorEnabledState();
            return;
        }

        addLapSelector(map, mapContainer, mapDrawLapsWrapper);
        lapControlRef.current = mapContainer.querySelector(".custom-lap-control-container");
        updateLapSelectorEnabledState();
    }, [lapCount, mapDrawLapsWrapper, updateLapSelectorEnabledState]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const container = mapContainerRef.current;
        if (!map || !container) {
            return;
        }
        return addZoomSlider(map, container);
    }, [mapInstance]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) {
            return;
        }
        mapDrawLapsWrapper("all");
        const windowExt = /** @type {any} */ (globalThis);
        if (typeof windowExt.updateOverlayHighlights === "function") {
            windowExt.updateOverlayHighlights();
        }
        if (typeof windowExt.updateShownFilesList === "function") {
            windowExt.updateShownFilesList();
        }
        updateLapSelectorEnabledState();
    }, [mapDrawLapsWrapper, overlaySignature, highlightedOverlayIndex, recordCount, updateLapSelectorEnabledState]);

    return createElement(
        "div",
        { className: "map-view-root" },
        createElement("div", {
            id: "leaflet-map",
            ref: mapContainerRef,
            className: "map-view-root__canvas",
            "data-map-theme": mapControlsTheme,
            "data-ui-theme": uiTheme,
        }),
        mapError
            ? createElement(
                "div",
                { className: "map-view-root__error" },
                mapError
            )
            : null,
        createElement(
            "div",
            {
                id: "map-controls",
                className: "map-view-root__controls",
                "data-map-theme": mapControlsTheme,
                "data-ui-theme": uiTheme,
            },
            createElement(MapControls, { mapInstance })
        )
    );
}

/**
 * Enhance Leaflet layer control entries with icons for better scannability.
 * @param {HTMLElement | null | undefined} container
 * @returns {void}
 */
function decorateLayerControlIcons(container) {
    if (!container) {
        return;
    }

    const baseSection = container.querySelector(".leaflet-control-layers-base");
    if (!baseSection) {
        return;
    }

    const MAP_LAYER_ICON_MAP = /** @type {Record<string, string>} */ ({
        CartoDB_DarkMatter: "mdi:weather-night",
        CartoDB_Positron: "mdi:white-balance-sunny",
        CyclOSM: "mdi:bike",
        Esri_NatGeo: "mdi:earth",
        Esri_Topo: "mdi:terrain",
        Esri_WorldGrayCanvas: "mdi:invert-colors",
        Esri_WorldImagery: "mdi:satellite-variant",
        Esri_WorldImagery_Labels: "mdi:label",
        Esri_WorldPhysical: "mdi:earth-box",
        Esri_WorldShadedRelief: "mdi:chart-timeline-variant",
        Esri_WorldStreetMap: "mdi:road",
        Esri_WorldStreetMap_Labels: "mdi:format-letter-case",
        Esri_WorldTerrain: "mdi:image-filter-hdr",
        Esri_WorldTopo_Labels: "mdi:label-outline",
        Humanitarian: "mdi:hand-heart",
        OpenFreeMap_Bright: "mdi:brightness-7",
        OpenFreeMap_Dark: "mdi:brightness-4",
        OpenFreeMap_Fiord: "mdi:water",
        OpenFreeMap_Liberty: "mdi:shield-star",
        OpenFreeMap_Positron: "mdi:palette",
        OpenRailwayMap: "mdi:train",
        OpenSeaMap: "mdi:sail-boat",
        OpenStreetMap: "flat-color-icons:globe",
        OSM_France: "mdi:flag-variant",
        Satellite: "mdi:satellite",
        Thunderforest_Cycle: "mdi:bike-fast",
        Thunderforest_Transport: "mdi:bus-multiple",
        Topo: "mdi:map",
        WaymarkedTrails_Cycling: "mdi:bike",
        WaymarkedTrails_Hiking: "mdi:hiking",
        WaymarkedTrails_Slopes: "mdi:ski-cross-country",
    });

    const labels = baseSection.querySelectorAll("label");
    for (const labelNode of labels) {
        if (!(labelNode instanceof HTMLElement)) {
            continue;
        }

        if (labelNode.dataset.iconified === "true") {
            continue;
        }

        const nameSpan = labelNode.querySelector("span");
        const layerName = (nameSpan?.textContent || labelNode.textContent || "").trim();
        if (!layerName) {
            labelNode.dataset.iconified = "true";
            continue;
        }

        const iconName = MAP_LAYER_ICON_MAP[layerName];
        if (!iconName) {
            labelNode.dataset.iconified = "true";
            continue;
        }

        if (labelNode.querySelector("iconify-icon")) {
            labelNode.dataset.iconified = "true";
            continue;
        }

        const iconEl = document.createElement("iconify-icon");
        iconEl.setAttribute("icon", iconName);
        iconEl.setAttribute("width", "18");
        iconEl.setAttribute("height", "18");
        iconEl.setAttribute("aria-hidden", "true");
        iconEl.classList.add("map-layer-icon");
        iconEl.style.marginRight = "6px";
        iconEl.style.verticalAlign = "middle";
        labelNode.classList.add("map-layer-option");

        const radio = labelNode.querySelector('input[type="radio"]');
        if (radio instanceof HTMLElement) {
            radio.after(iconEl);
        } else {
            labelNode.prepend(iconEl);
        }

        labelNode.dataset.iconified = "true";
    }
}

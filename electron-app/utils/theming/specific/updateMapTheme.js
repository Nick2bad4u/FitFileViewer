/**
 * @fileoverview Map theme utility for FitFileViewer
 *
 * This module handles map theme updates with support for independent map theme control.
 * Users can toggle between dark and light maps independently from the application theme.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { getMapThemeInverted } from "./createMapThemeToggle.js";

const THEME_KEYS = Object.freeze({ dark: "dark", light: "light" });

/**
 * Updates the Leaflet map theme based on user's map theme preference.
 * Selects dedicated dark/light base layers instead of using CSS color inversion.
 */
export function updateMapTheme() {
    try {
        const mapShouldBeDark = getMapThemeInverted();
        const themeKey = mapShouldBeDark ? THEME_KEYS.dark : THEME_KEYS.light;

        const leafletMap = document.querySelector("#leaflet-map");
        if (leafletMap instanceof HTMLElement) {
            leafletMap.style.filter = "none";
            leafletMap.dataset.mapTheme = themeKey;
        }

        const mapControls = document.querySelector("#map-controls, .map-view-root__controls");
        if (mapControls instanceof HTMLElement) {
            mapControls.style.filter = "none";
            mapControls.dataset.mapTheme = themeKey;
        }

        const windowExt = /** @type {any} */ (globalThis);
        syncBaseLayer(windowExt, themeKey);
        syncMiniMap(windowExt, themeKey);

        console.log(`[updateMapTheme] Map theme updated - Map dark: ${mapShouldBeDark}`);
    } catch (error) {
        console.error("[updateMapTheme] Error updating map theme:", error);
    }
}

function syncBaseLayer(windowExt, themeKey) {
    const mapInstance = windowExt._leafletMapInstance;
    const registry = windowExt.__mapLayerRegistry;
    const config = windowExt.__mapManagedLayerConfig;
    if (!mapInstance || !registry || !config) {
        return;
    }

    const desiredId = themeKey === THEME_KEYS.dark ? config.dark : config.light;
    const fallbackId = config.fallback;
    const resolvedId = desiredId && registry[desiredId] ? desiredId : fallbackId;
    const desiredLayer = resolvedId ? registry[resolvedId] : undefined;

    if (!desiredLayer || typeof desiredLayer.addTo !== "function") {
        return;
    }

    const managedIds = windowExt.__mapManagedLayerIds;
    const currentLayer = windowExt.__mapCurrentBaseLayer;
    const currentLayerId = windowExt.__mapCurrentBaseLayerId;
    const manualOverride = Boolean(
        windowExt.__mapBaseLayerManual &&
        currentLayer &&
        managedIds instanceof Set &&
        (!currentLayerId || !managedIds.has(currentLayerId))
    );

    if (manualOverride) {
        return;
    }

    if (currentLayer === desiredLayer) {
        windowExt.__mapCurrentBaseLayerId = resolvedId ?? null;
        windowExt.__mapBaseLayerManual = false;
        return;
    }

    if (currentLayer && typeof mapInstance.removeLayer === "function") {
        try {
            mapInstance.removeLayer(currentLayer);
        } catch (error) {
            console.warn("[updateMapTheme] Failed removing previous base layer", error);
        }
    }

    try {
        desiredLayer.addTo(mapInstance);
        windowExt.__mapCurrentBaseLayer = desiredLayer;
        windowExt.__mapCurrentBaseLayerId = resolvedId ?? null;
        windowExt.__mapBaseLayerManual = false;
    } catch (error) {
        console.warn("[updateMapTheme] Failed applying themed base layer", error);
    }
}

function syncMiniMap(windowExt, themeKey) {
    const miniMapControl = windowExt._miniMapControl;
    const miniMapLayers = windowExt.__miniMapLayers;
    if (!miniMapControl || !miniMapLayers || typeof miniMapControl.changeLayer !== "function") {
        return;
    }

    const desiredLayer =
        miniMapLayers[themeKey] ??
        miniMapLayers.fallback ??
        miniMapLayers.light ??
        miniMapLayers.dark ??
        null;

    if (desiredLayer) {
        try {
            miniMapControl.changeLayer(desiredLayer);
        } catch (error) {
            console.warn("[updateMapTheme] Failed applying minimap layer", error);
        }
    }
}

// Set up theme change listeners if not already done
if (!globalThis._mapThemeListener) {
    globalThis._mapThemeListener = () => {
        updateMapTheme();
    };

    // Listen for both app theme changes and map theme preference changes
    document.body.addEventListener("themechange", globalThis._mapThemeListener);
    document.addEventListener("mapThemeChanged", globalThis._mapThemeListener);

    // Cleanup logic to remove the event listeners
    window.addEventListener("beforeunload", () => {
        document.body.removeEventListener("themechange", globalThis._mapThemeListener);
        document.removeEventListener("mapThemeChanged", globalThis._mapThemeListener);
        delete globalThis._mapThemeListener;
    });
}

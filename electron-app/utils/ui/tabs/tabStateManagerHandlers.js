/**
 * Tab-specific handler utilities for the TabStateManager.
 */

import { tabRenderingManager } from "./tabRenderingManager.js";
import { attachPreRenderedCharts } from "./tabStateManagerCharts.js";
import { getDoc, getStateMgr } from "./tabStateManagerSupport.js";

/**
 * Handle alternative FIT viewer tab activation.
 */
export function handleAltFitTab() {
    const el = getDoc().querySelector("#altfit_iframe");
    // Avoid cross-realm instanceof checks; rely on tagName and presence of src
    if (
        el &&
        typeof (/** @type {any} */ (el).tagName) === "string" &&
        /** @type {any} */ (el).tagName.toUpperCase() === "IFRAME"
    ) {
        const iframe = /** @type {any} */ (el);
        if (
            typeof iframe.src === "string" &&
            !iframe.src.includes("ffv/index.html")
        ) {
            iframe.src = "ffv/index.html";
        }
    }
}

/**
 * Handle Browser tab activation (folder-based activity browser).
 */
export async function handleBrowserTab() {
    try {
        const mod = await import("../browser/fileBrowserTab.js");
        if (mod && typeof mod.renderFileBrowserTab === "function") {
            await mod.renderFileBrowserTab();
        }
    } catch (error) {
        console.error("[TabStateManager] Failed to render Browser tab", error);
    }
}

/**
 * Handle chart tab activation.
 *
 * @param {{ recordMesgs?: any[] } | null | undefined} globalData
 */
export async function handleChartTab(globalData) {
    if (!globalData || !globalData.recordMesgs) {
        console.warn("[TabStateManager] No chart data available");
        return;
    }

    await tabRenderingManager.executeRenderOperation(
        "chart",
        async (token) => {
            if (token.isCancelled) {
                return null;
            }

            const movedPreRendered = attachPreRenderedCharts();
            const chartState = getStateMgr().getState("charts");

            if (chartState?.isRendered) {
                console.log(
                    "[TabStateManager] Chart tab activated - charts already rendered"
                );
                getStateMgr().setState("charts.tabActive", true, {
                    source: "TabStateManager.handleChartTab",
                });
            } else {
                console.log(
                    "[TabStateManager] Chart tab activated - triggering initial render through state system"
                );
                getStateMgr().setState("charts.tabActive", true, {
                    source: "TabStateManager.handleChartTab",
                });
            }

            if (token.isCancelled) {
                console.log("[TabStateManager] Chart tab rendering cancelled");
                return null;
            }

            return movedPreRendered ? "preRendered" : true;
        },
        { debounce: true, skipIfRecent: true }
    );
}

/**
 * Handle data tables tab activation.
 *
 * @param {{ recordMesgs?: any[] } | null | undefined} globalData
 */
export async function handleDataTab(globalData) {
    if (!globalData || !(/** @type {any} */ (globalThis).createTables)) {
        return;
    }

    const bgContainer = getDoc().querySelector("#background_data_container");
    const visibleContainer = getDoc().querySelector("#content_data");

    if (
        bgContainer &&
        bgContainer.childNodes &&
        bgContainer.childNodes.length > 0 &&
        visibleContainer
    ) {
        visibleContainer.innerHTML = "";
        while (bgContainer.firstChild) {
            visibleContainer.append(bgContainer.firstChild);
        }
    } else {
        console.log("[TabStateManager] Creating data tables");
        /** @type {any} */ (globalThis).createTables(globalData);
    }
}

/**
 * Handle map tab activation.
 *
 * @param {{ recordMesgs?: any[] } | null | undefined} globalData
 */
export async function handleMapTab(globalData) {
    if (!globalData || !globalData.recordMesgs) {
        return;
    }

    const mapState = getStateMgr().getState("map");
    if (!mapState?.isRendered && /** @type {any} */ (globalThis).renderMap) {
        console.log("[TabStateManager] Rendering map for first time");
        /** @type {any} */ (globalThis).renderMap();
        getStateMgr().setState("map.isRendered", true, {
            source: "TabStateManager.handleMapTab",
        });
        return;
    }

    const mapInstance = /** @type {any} */ (globalThis)._leafletMapInstance;
    const renderMapFn = /** @type {any} */ (globalThis).renderMap;

    if (!mapInstance || typeof mapInstance.invalidateSize !== "function") {
        return;
    }

    const executeInvalidation = () => {
        const container =
            typeof mapInstance.getContainer === "function"
                ? mapInstance.getContainer()
                : null;

        if (!container || !container.isConnected) {
            console.warn(
                "[TabStateManager] Map container missing; re-rendering map instance"
            );
            if (typeof renderMapFn === "function") {
                renderMapFn();
                getStateMgr().setState("map.isRendered", true, {
                    source: "TabStateManager.handleMapTab.reRender",
                });
            }
            return;
        }

        try {
            mapInstance.invalidateSize({ pan: false });
            console.log(
                "[TabStateManager] Map size invalidated to fix grey tiles"
            );
        } catch (error) {
            console.warn(
                "[TabStateManager] Map invalidation failed; re-rendering map",
                error
            );
            if (typeof renderMapFn === "function") {
                renderMapFn();
                getStateMgr().setState("map.isRendered", true, {
                    source: "TabStateManager.handleMapTab.recover",
                });
            }
        }
    };

    if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => requestAnimationFrame(executeInvalidation));
    } else {
        setTimeout(executeInvalidation, 75);
    }
}

/**
 * Handle summary tab activation.
 *
 * @param {{ recordMesgs?: any[] } | null | undefined} globalData
 */
export async function handleSummaryTab(globalData) {
    if (!globalData || !(/** @type {any} */ (globalThis).renderSummary)) {
        return;
    }

    const currentDataHash = hashData(globalData);
    const previousData = getStateMgr().getState("summary.lastDataHash");

    if (previousData !== currentDataHash) {
        console.log("[TabStateManager] Rendering summary with new data");
        /** @type {any} */ (globalThis).renderSummary(globalData);
        getStateMgr().setState("summary.lastDataHash", currentDataHash, {
            source: "TabStateManager.handleSummaryTab",
        });
    }
}

/**
 * Generate simple hash for data comparison.
 *
 * @param {{ recordMesgs?: any[] } | null | undefined} data
 *
 * @returns {string}
 */
function hashData(data) {
    if (!data) {
        return "";
    }

    const recordMesgs = data.recordMesgs || [];
    const size = recordMesgs.length || 0;
    const firstRecord = recordMesgs[0] || {};
    const lastRecord = recordMesgs[size - 1] || {};

    return `${size}-${firstRecord.timestamp || 0}-${lastRecord.timestamp || 0}`;
}

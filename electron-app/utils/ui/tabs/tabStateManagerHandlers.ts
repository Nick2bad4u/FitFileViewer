/**
 * Tab-specific handler utilities for the TabStateManager.
 */

import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";
import { ensureRendererVendorBundle } from "../../../renderer/vendorBundleLoader.js";
import {
    renderMap,
    waitForMapLeafletRuntime,
} from "../../maps/core/renderMap.js";
import { getRegisteredLeafletMapInstance } from "../../maps/state/mapLeafletInstanceState.js";
import { createTables } from "../../rendering/components/createTables.js";
import { renderSummary } from "../../rendering/core/renderSummary.js";
import { tabRenderingManager } from "./tabRenderingManager.js";
import { attachPreRenderedCharts } from "./tabStateManagerCharts.js";
import {
    getTabStateManagerHandlersRuntime,
    type TabStateManagerHandlersRuntime,
    type TabStateManagerHandlersTimerHandle,
} from "./tabStateManagerHandlersRuntime.js";
import { getDoc, getStateMgr } from "./tabStateManagerSupport.js";

type ActivityRecord = Record<string, unknown> & {
    readonly timestamp?: unknown;
};

type ActivityData = Record<string, unknown> & {
    readonly lapMesgs?: ActivityRecord[];
    readonly recordMesgs?: ActivityRecord[];
    readonly sessionMesgs?: ActivityRecord[];
};

type ConnectedMapContainer = {
    readonly isConnected: boolean;
};

type LeafletMapInstance = {
    getContainer?: () => ConnectedMapContainer | null;
    invalidateSize: (options?: { pan?: boolean }) => void;
};

const ZWIFT_MAP_URL = "https://zwiftmap.com/";
const ZWIFT_MAP_FALLBACK_DELAY_MS = 8000;

let mapInvalidationFrameId: number | undefined;
let mapInvalidationSecondFrameId: number | undefined;
let mapInvalidationTimeoutId:
    | TabStateManagerHandlersTimerHandle
    | undefined;
let zwiftMapFallbackTimeoutId:
    | TabStateManagerHandlersTimerHandle
    | undefined;

function tabStateManagerHandlersRuntime(): TabStateManagerHandlersRuntime {
    return getTabStateManagerHandlersRuntime();
}

function clearPendingMapInvalidation(): void {
    if (mapInvalidationFrameId !== undefined) {
        tabStateManagerHandlersRuntime().cancelAnimationFrame(
            mapInvalidationFrameId
        );
        mapInvalidationFrameId = undefined;
    }
    if (mapInvalidationSecondFrameId !== undefined) {
        tabStateManagerHandlersRuntime().cancelAnimationFrame(
            mapInvalidationSecondFrameId
        );
        mapInvalidationSecondFrameId = undefined;
    }
    if (mapInvalidationTimeoutId !== undefined) {
        tabStateManagerHandlersRuntime().clearTimeout(mapInvalidationTimeoutId);
        mapInvalidationTimeoutId = undefined;
    }
}

function scheduleFallbackMapInvalidation(executeInvalidation: () => void): void {
    mapInvalidationTimeoutId = tabStateManagerHandlersRuntime().setTimeout(() => {
        mapInvalidationTimeoutId = undefined;
        executeInvalidation();
    }, 75);
}

function hasRenderedFlag(value: unknown): value is { isRendered?: boolean } {
    return value !== null && typeof value === "object" && "isRendered" in value;
}

function isIframeLike(
    element: HTMLElement | null
): element is HTMLElement & { src: string } {
    return (
        element !== null &&
        element.tagName.toUpperCase() === "IFRAME" &&
        "src" in element &&
        typeof element.src === "string"
    );
}

function formatTimestampForHash(value: unknown): string {
    if (value === null || value === undefined) {
        return "0";
    }

    if (value instanceof Date) {
        return String(value.valueOf());
    }

    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "bigint") {
        return String(value);
    }

    return "0";
}

function getTimestamp(record: ActivityRecord | undefined): string {
    return formatTimestampForHash(record?.timestamp);
}

/**
 * Handle alternative FIT viewer tab activation.
 */
export function handleAltFitTab(): void {
    const el = querySelectorByIdFlexible(getDoc(), "#altfit_iframe");
    // Avoid cross-realm instanceof checks; rely on tagName and presence of src
    if (isIframeLike(el) && !el.src.includes("ffv/index.html")) {
        el.src = "ffv/index.html";
    }
}

/**
 * Handle Browser tab activation (folder-based activity browser).
 */
export async function handleBrowserTab(): Promise<void> {
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
 * Handle Zwift tab activation.
 */
export function handleZwiftTab(): void {
    const content = querySelectorByIdFlexible(getDoc(), "#content_zwift");
    if (!content) {
        return;
    }

    const existingFrame = content.querySelector<HTMLIFrameElement>(
        'iframe#zwift_iframe[src="https://zwiftmap.com/"]'
    );
    if (existingFrame) {
        return;
    }

    clearPendingZwiftFallback();

    const status = createZwiftStatus();
    const iframe = createZwiftIframe();
    const loadController =
        tabStateManagerHandlersRuntime().createAbortController();
    const settleZwiftFrame = (didLoad: boolean): void => {
        loadController.abort();
        clearPendingZwiftFallback();
        if (didLoad) {
            markZwiftStatusLoaded(status);
        } else {
            markZwiftStatusFailed(status);
        }
    };

    iframe.addEventListener(
        "load",
        () => {
            settleZwiftFrame(true);
        },
        { once: true, signal: loadController.signal }
    );
    iframe.addEventListener(
        "error",
        () => {
            settleZwiftFrame(false);
        },
        { once: true, signal: loadController.signal }
    );

    zwiftMapFallbackTimeoutId = tabStateManagerHandlersRuntime().setTimeout(
        () => {
            zwiftMapFallbackTimeoutId = undefined;
            settleZwiftFrame(false);
        },
        ZWIFT_MAP_FALLBACK_DELAY_MS
    );

    content.replaceChildren(status, iframe);
}

/**
 * Handle chart tab activation.
 */
export async function handleChartTab(
    rawFitData: ActivityData | null | undefined
): Promise<void> {
    if (!rawFitData || !rawFitData.recordMesgs) {
        console.warn("[TabStateManager] No chart data available");
        return;
    }

    await ensureRendererVendorBundle("chart-data");

    await tabRenderingManager.executeRenderOperation(
        "chart",
        (token) => {
            if (token.isCancelled) {
                return null;
            }

            const movedPreRendered = attachPreRenderedCharts();
            const chartState = getStateMgr().getState("charts");

            if (hasRenderedFlag(chartState) && chartState.isRendered) {
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
 */
export async function handleDataTab(
    rawFitData: ActivityData | null | undefined
): Promise<void> {
    if (!rawFitData) {
        return;
    }

    await ensureRendererVendorBundle("chart-data");

    const bgContainer = querySelectorByIdFlexible(
        getDoc(),
        "#background_data_container"
    );
    const visibleContainer = querySelectorByIdFlexible(
        getDoc(),
        "#content_data"
    );

    if (
        bgContainer &&
        bgContainer.childNodes &&
        bgContainer.childNodes.length > 0 &&
        visibleContainer
    ) {
        visibleContainer.replaceChildren();
        while (bgContainer.firstChild) {
            visibleContainer.append(bgContainer.firstChild);
        }
    } else {
        console.log("[TabStateManager] Creating data tables");
        createTables(rawFitData);
    }
}

/**
 * Handle map tab activation.
 */
export async function handleMapTab(
    rawFitData: ActivityData | null | undefined
): Promise<void> {
    if (!rawFitData || !rawFitData.recordMesgs) {
        return;
    }

    await ensureRendererVendorBundle("map");
    if (!(await waitForMapLeafletRuntime())) {
        console.warn("[TabStateManager] Leaflet runtime unavailable");
        return;
    }

    const mapState = getStateMgr().getState("map");
    const isMapRendered =
        hasRenderedFlag(mapState) && mapState.isRendered === true;
    if (!isMapRendered) {
        console.log("[TabStateManager] Rendering map for first time");
        renderMap();
        getStateMgr().setState("map.isRendered", true, {
            source: "TabStateManager.handleMapTab",
        });
        return;
    }

    const mapInstance = getRegisteredLeafletMapInstance<LeafletMapInstance>();

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
            renderMap();
            getStateMgr().setState("map.isRendered", true, {
                source: "TabStateManager.handleMapTab.reRender",
            });
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
            renderMap();
            getStateMgr().setState("map.isRendered", true, {
                source: "TabStateManager.handleMapTab.recover",
            });
        }
    };

    clearPendingMapInvalidation();
    mapInvalidationFrameId =
        tabStateManagerHandlersRuntime().requestAnimationFrame(() => {
            mapInvalidationFrameId = undefined;
            mapInvalidationSecondFrameId =
                tabStateManagerHandlersRuntime().requestAnimationFrame(() => {
                    mapInvalidationSecondFrameId = undefined;
                    executeInvalidation();
                });
            if (mapInvalidationSecondFrameId === undefined) {
                mapInvalidationSecondFrameId = undefined;
                scheduleFallbackMapInvalidation(executeInvalidation);
            }
        });
    if (mapInvalidationFrameId === undefined) {
        scheduleFallbackMapInvalidation(executeInvalidation);
    }
}

/**
 * Handle summary tab activation.
 */
export function handleSummaryTab(
    rawFitData: ActivityData | null | undefined
): void {
    if (!rawFitData) {
        return;
    }

    const currentDataHash = hashData(rawFitData);
    const previousData = getStateMgr().getState("summary.lastDataHash");

    if (previousData !== currentDataHash) {
        console.log("[TabStateManager] Rendering summary with new data");
        renderSummary(rawFitData);
        getStateMgr().setState("summary.lastDataHash", currentDataHash, {
            source: "TabStateManager.handleSummaryTab",
        });
    }
}

/**
 * Generate simple hash for data comparison.
 */
function hashData(data: ActivityData | null | undefined): string {
    if (!data) {
        return "";
    }

    const recordMesgs = data.recordMesgs || [];
    const size = recordMesgs.length || 0;
    const firstRecord = recordMesgs[0];
    const lastRecord = recordMesgs.at(-1);

    return `${size}-${getTimestamp(firstRecord)}-${getTimestamp(lastRecord)}`;
}

function createZwiftIframe(): HTMLIFrameElement {
    const iframe = tabStateManagerHandlersRuntime().createElement("iframe");
    iframe.id = "zwift_iframe";
    iframe.className = "fullsize-container no-border";
    iframe.setAttribute("allow", "geolocation");
    iframe.setAttribute("aria-label", "ZwiftMap");
    iframe.height = "720";
    iframe.loading = "eager";
    iframe.name = "zwift_iframe";
    iframe.setAttribute("referrerpolicy", "no-referrer");
    iframe.setAttribute(
        "sandbox",
        "allow-forms allow-popups allow-same-origin allow-scripts"
    );
    iframe.src = ZWIFT_MAP_URL;
    iframe.title = "ZwiftMap";
    iframe.width = "1280";

    return iframe;
}

function clearPendingZwiftFallback(): void {
    if (zwiftMapFallbackTimeoutId === undefined) {
        return;
    }

    tabStateManagerHandlersRuntime().clearTimeout(zwiftMapFallbackTimeoutId);
    zwiftMapFallbackTimeoutId = undefined;
}

function createZwiftStatus(): HTMLElement {
    const status = tabStateManagerHandlersRuntime().createElement("div");
    status.className = "zwift-map-status zwift-map-status--loading";
    status.id = "zwift_map_status";
    status.setAttribute("aria-live", "polite");
    status.setAttribute("role", "status");
    status.textContent = "Loading ZwiftMap...";

    return status;
}

function markZwiftStatusLoaded(status: HTMLElement): void {
    status.classList.remove("zwift-map-status--loading");
    status.hidden = true;
    status.textContent = "ZwiftMap loaded.";
}

function markZwiftStatusFailed(status: HTMLElement): void {
    status.classList.remove("zwift-map-status--loading");
    status.classList.add("zwift-map-status--error");
    status.hidden = false;
    status.replaceChildren(
        tabStateManagerHandlersRuntime().createTextNode(
            "ZwiftMap did not load. "
        ),
        createZwiftFallbackLink()
    );
}

function createZwiftFallbackLink(): HTMLAnchorElement {
    const link = tabStateManagerHandlersRuntime().createElement("a");
    link.dataset["externalLink"] = "true";
    link.href = ZWIFT_MAP_URL;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    link.textContent = "Open ZwiftMap in your browser.";

    return link;
}

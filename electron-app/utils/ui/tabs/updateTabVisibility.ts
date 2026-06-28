/**
 * Toggles tab content section visibility and synchronizes visible-tab state.
 */

import { getRegisteredLeafletMapInstance } from "../../maps/state/mapLeafletInstanceState.js";
import { getRegisteredMapMiniMapControl } from "../../maps/state/mapPluginControlState.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import { getRendererLoadingFromState } from "../../state/domain/rendererLoadingState.js";
import {
    getRendererCoreStateManager,
    getRequiredRendererCoreStateManager,
    type RendererStateManagerAccess,
} from "../../state/domain/rendererStateManagerAccess.js";
import {
    getRendererActiveTabContentFromState,
    getRendererActiveTabFromState,
    isRendererTabName,
    normalizeRendererActiveTab,
    setRendererActiveTabContentInState,
    setRendererActiveTabInState,
} from "../../state/domain/rendererActiveTabState.js";
import {
    buildIdVariants,
    getElementByIdFlexible,
} from "../dom/elementIdUtils.js";
import {
    extractTabNameFromContentId,
    getContentIdFromTabName,
} from "./tabIdUtils.js";
import { TAB_CONTENT_IDS } from "./tabStateManagerConfig.js";
import {
    getUpdateTabVisibilityRuntime,
    type UpdateTabVisibilityTimerHandle,
} from "./updateTabVisibilityRuntime.js";

type LeafletMiniMap = {
    invalidateSize: () => void;
};

type LeafletMapInstance = {
    invalidateSize: (options?: { animate?: boolean; pan?: boolean }) => void;
};

type StateUnsubscribe = () => void;

const DISPLAY_FLEX = "flex";
const DISPLAY_NONE = "none";

let mapReflowTimerLong: UpdateTabVisibilityTimerHandle | undefined;
let mapReflowTimerShort: UpdateTabVisibilityTimerHandle | undefined;
let noDataSwitchTimer: null | UpdateTabVisibilityTimerHandle = null;
const tabVisibilityUnsubscribes: StateUnsubscribe[] = [];

function canUseDocument(candidate: unknown): candidate is Document {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}

function getDoc(): Document {
    let runtimeDocument: Document | undefined;
    try {
        runtimeDocument = getUpdateTabVisibilityRuntime().getDocument();
    } catch {
        runtimeDocument = undefined;
    }

    if (canUseDocument(runtimeDocument)) {
        return runtimeDocument;
    }

    throw new Error("updateTabVisibility requires a document-like runtime");
}

function getStateMgr(): RendererStateManagerAccess {
    try {
        const stateManager = getRendererCoreStateManager();
        if (stateManager) {
            return stateManager;
        }
    } catch {
        /* Ignore errors */
    }

    return getRequiredRendererCoreStateManager();
}

function getConfiguredContentIdFromTabName(tabName: unknown): null | string {
    const normalizedTabName = normalizeRendererActiveTab(tabName);

    return isRendererTabName(normalizedTabName)
        ? getContentIdFromTabName(normalizedTabName)
        : null;
}

function clearNoDataSwitchTimer(): void {
    if (noDataSwitchTimer === null) {
        return;
    }

    getUpdateTabVisibilityRuntime().clearTimeout(noDataSwitchTimer);
    noDataSwitchTimer = null;
}

function clearMapReflowTimers(): void {
    const runtime = getUpdateTabVisibilityRuntime();

    if (mapReflowTimerShort !== undefined) {
        runtime.clearTimeout(mapReflowTimerShort);
        mapReflowTimerShort = undefined;
    }
    if (mapReflowTimerLong !== undefined) {
        runtime.clearTimeout(mapReflowTimerLong);
        mapReflowTimerLong = undefined;
    }
}

function invokeUnsubscribe(unsubscribe: StateUnsubscribe): void {
    try {
        unsubscribe();
    } catch {
        /* Ignore cleanup errors */
    }
}

function trackSubscription(subscription: unknown): void {
    if (typeof subscription === "function") {
        tabVisibilityUnsubscribes.push(() => {
            subscription();
        });
    }
}

function getContentElementMap(): Record<string, HTMLElement> {
    const elementMap: Record<string, HTMLElement> = {};

    for (const id of TAB_CONTENT_IDS) {
        const element = getElementByIdFlexible(getDoc(), id);
        if (element) {
            elementMap[id] = element;
        } else {
            console.warn(
                `updateTabVisibility: Missing element in the DOM: ${id}. Please check the HTML structure to ensure the element with ID '${id}' exists, or verify that it is dynamically added to the DOM before calling updateTabVisibility.`
            );
        }
    }

    return elementMap;
}

function resolveTargetContentId(
    visibleTabId: null | string | undefined,
    elementMap: Record<string, HTMLElement>
): {
    derivedTabName: null | string;
    targetId: null | string | undefined;
} {
    let targetId = visibleTabId;
    let derivedTabName: null | string = null;

    if (targetId && !(targetId in elementMap)) {
        const variants = buildIdVariants(String(targetId));
        const matchingVariant = variants.find(
            (variant) => variant in elementMap
        );
        if (matchingVariant) {
            targetId = matchingVariant;
        }
    }

    if (targetId && !(targetId in elementMap)) {
        const maybeName = extractTabNameFromContentId(String(targetId));
        if (isRendererTabName(maybeName)) {
            const canonicalId = getContentIdFromTabName(maybeName);
            if (canonicalId in elementMap) {
                targetId = canonicalId;
                derivedTabName = maybeName;
            }
        }
    }

    return { derivedTabName, targetId };
}

/**
 * Get currently visible tab content.
 *
 * @returns Currently visible tab name or null.
 */
export function getVisibleTabContent(): null | string {
    return getRendererActiveTabContentFromState(getStateMgr().getState);
}

/**
 * Hide all tab content.
 */
export function hideAllTabContent(): void {
    updateTabVisibility(null);
}

/**
 * Cleans up tab visibility subscriptions and pending timers.
 */
export function cleanupTabVisibilityState(): void {
    clearNoDataSwitchTimer();
    clearMapReflowTimers();

    for (const unsubscribe of tabVisibilityUnsubscribes.splice(0)) {
        invokeUnsubscribe(unsubscribe);
    }
}

/**
 * Initialize tab visibility state management.
 */
export function initializeTabVisibilityState(): void {
    cleanupTabVisibilityState();

    const runtime = getUpdateTabVisibilityRuntime();
    const stateManager = getStateMgr();

    trackSubscription(
        stateManager.subscribe("ui.activeTab", (activeTab: unknown) => {
            const contentId = getConfiguredContentIdFromTabName(activeTab);
            if (contentId) {
                updateTabVisibility(contentId);
            }
        })
    );

    trackSubscription(
        stateManager.subscribe("fitFile.rawData", (data: unknown) => {
            const hasData = data !== null && data !== undefined;

            if (hasData) {
                clearNoDataSwitchTimer();
                return;
            }

            clearNoDataSwitchTimer();

            noDataSwitchTimer = runtime.setTimeout(() => {
                noDataSwitchTimer = null;

                const latestData = getActiveFitActivityData().rawData;
                const stillNoData =
                    latestData === null || latestData === undefined;
                const isLoading = getRendererLoadingFromState(
                    stateManager.getState
                );
                const latestTab = getRendererActiveTabFromState(
                    stateManager.getState
                );

                if (stillNoData && !isLoading && latestTab !== "summary") {
                    setRendererActiveTabInState(
                        stateManager.setState,
                        "summary",
                        { source: "initializeTabVisibilityState" }
                    );
                }
            }, 250);
        })
    );

    console.log("[TabVisibility] State management initialized");
}

/**
 * Show specific tab content.
 *
 * @param tabName - Name of the tab to show.
 */
export function showTabContent(tabName: string): void {
    updateTabVisibility(getConfiguredContentIdFromTabName(tabName));
}

/**
 * Toggles the visibility of tab content sections by setting the display style.
 *
 * @param visibleTabId - ID of the tab content element to display.
 */
export function updateTabVisibility(
    visibleTabId: null | string | undefined
): void {
    const elementMap = getContentElementMap();
    const { derivedTabName, targetId } = resolveTargetContentId(
        visibleTabId,
        elementMap
    );

    for (const [id, element] of Object.entries(elementMap)) {
        const isVisible = id === targetId;
        element.style.display = isVisible ? DISPLAY_FLEX : DISPLAY_NONE;
        element.setAttribute("aria-hidden", (!isVisible).toString());
        element.classList.toggle("active", isVisible);
    }

    if (targetId && targetId in elementMap) {
        const tabName = derivedTabName ?? extractTabNameFromContentId(targetId);
        if (tabName) {
            setRendererActiveTabContentInState(getStateMgr().setState, tabName, {
                source: "updateTabVisibility",
            });
        }
    }

    if (targetId === "content_map") {
        scheduleMapReflowRefresh();
    }
}

/**
 * Force Leaflet to recompute map layout after tab visibility changes.
 */
function scheduleMapReflowRefresh(): void {
    const map = getRegisteredLeafletMapInstance<LeafletMapInstance>();

    if (!map || typeof map.invalidateSize !== "function") {
        return;
    }

    const runtime = getUpdateTabVisibilityRuntime();
    clearMapReflowTimers();

    const reflow = () => {
        try {
            map.invalidateSize({ animate: false, pan: false });
        } catch {
            /* Ignore errors */
        }

        try {
            const miniMap = getRegisteredMapMiniMapControl<{
                _miniMap?: LeafletMiniMap | null;
            }>()?._miniMap;
            if (miniMap && typeof miniMap.invalidateSize === "function") {
                miniMap.invalidateSize();
            }
        } catch {
            /* Ignore errors */
        }
    };

    const raf = (onFrame: FrameRequestCallback): void => {
        const animationFrameHandle = runtime.requestAnimationFrame(onFrame);
        if (animationFrameHandle === undefined) {
            void runtime.setTimeout(() => {
                onFrame(0);
            }, 0);
        }
    };

    reflow();
    raf(() => reflow());
    mapReflowTimerShort = runtime.setTimeout(() => {
        mapReflowTimerShort = undefined;
        reflow();
    }, 70);
    mapReflowTimerLong = runtime.setTimeout(() => {
        mapReflowTimerLong = undefined;
        reflow();
    }, 180);
}

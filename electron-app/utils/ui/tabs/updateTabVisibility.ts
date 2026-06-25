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
    toRendererStateManagerAccess,
    type RendererStateManagerAccess,
} from "../../state/domain/rendererStateManagerAccess.js";
import {
    buildIdVariants,
    getElementByIdFlexible,
} from "../dom/elementIdUtils.js";
import {
    extractTabNameFromContentId,
    getContentIdFromTabName,
} from "./tabIdUtils.js";
import {
    getTabTestDocumentForTests,
    getTabTestStateManagerForTests,
} from "./tabTestEnvironment.js";
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

const TAB_CONTENT_IDS = [
    "content_data",
    "content_chartjs",
    "content_browser",
    "content_map",
    "content_summary",
    "content_altfit",
    "content_zwift",
] as const;

const DISPLAY_FLEX = "flex";
const DISPLAY_NONE = "none";

let mapReflowTimerLong: UpdateTabVisibilityTimerHandle | undefined;
let mapReflowTimerShort: UpdateTabVisibilityTimerHandle | undefined;

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

function getEffectiveDocument(): Document | undefined {
    return getTabTestDocumentForTests();
}

function getDoc(): Document {
    let runtimeDocument: Document | undefined;
    try {
        runtimeDocument = getUpdateTabVisibilityRuntime().getDocument();
    } catch {
        runtimeDocument = undefined;
    }

    const candidates = [runtimeDocument, getEffectiveDocument()];

    for (const candidate of candidates) {
        if (canUseDocument(candidate)) {
            return candidate;
        }
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

    try {
        const stateManager = toRendererStateManagerAccess(
            getTabTestStateManagerForTests()
        );
        if (stateManager) {
            return stateManager;
        }
    } catch {
        /* Ignore errors */
    }

    return getRequiredRendererCoreStateManager();
}

function getStringState(path: string): null | string {
    const value = getStateMgr().getState(path);

    return typeof value === "string" && value ? value : null;
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
        if (maybeName) {
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
    return getStringState("ui.activeTabContent");
}

/**
 * Hide all tab content.
 */
export function hideAllTabContent(): void {
    updateTabVisibility(null);
}

/**
 * Initialize tab visibility state management.
 */
export function initializeTabVisibilityState(): void {
    const runtime = getUpdateTabVisibilityRuntime();
    let noDataSwitchTimer: null | UpdateTabVisibilityTimerHandle = null;

    getStateMgr().subscribe("ui.activeTab", (activeTab: unknown) => {
        if (typeof activeTab === "string") {
            const contentId = getContentIdFromTabName(activeTab);
            updateTabVisibility(contentId);
        }
    });

    getStateMgr().subscribe("fitFile.rawData", (data: unknown) => {
        const hasData = data !== null && data !== undefined;

        if (hasData) {
            if (noDataSwitchTimer !== null) {
                runtime.clearTimeout(noDataSwitchTimer);
                noDataSwitchTimer = null;
            }
            return;
        }

        if (noDataSwitchTimer !== null) {
            runtime.clearTimeout(noDataSwitchTimer);
        }

        noDataSwitchTimer = runtime.setTimeout(() => {
            noDataSwitchTimer = null;

            const latestData = getActiveFitActivityData().rawData;
            const stillNoData = latestData === null || latestData === undefined;
            const isLoading = getRendererLoadingFromState(
                getStateMgr().getState
            );
            const latestTab = getStringState("ui.activeTab") ?? "summary";

            if (stillNoData && !isLoading && latestTab !== "summary") {
                getStateMgr().setState("ui.activeTab", "summary", {
                    source: "initializeTabVisibilityState",
                });
            }
        }, 250);
    });

    console.log("[TabVisibility] State management initialized");
}

/**
 * Show specific tab content.
 *
 * @param tabName - Name of the tab to show.
 */
export function showTabContent(tabName: string): void {
    const contentId = getContentIdFromTabName(tabName);
    updateTabVisibility(contentId);
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

    if (targetId) {
        const tabName = derivedTabName ?? extractTabNameFromContentId(targetId);
        if (tabName) {
            getStateMgr().setState("ui.activeTabContent", tabName, {
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
    if (mapReflowTimerShort !== undefined) {
        runtime.clearTimeout(mapReflowTimerShort);
        mapReflowTimerShort = undefined;
    }
    if (mapReflowTimerLong !== undefined) {
        runtime.clearTimeout(mapReflowTimerLong);
        mapReflowTimerLong = undefined;
    }

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

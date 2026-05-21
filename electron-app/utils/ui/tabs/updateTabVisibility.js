/**
 * Toggles tab content section visibility and synchronizes visible-tab state.
 */
import * as __StateMgr from "../../state/core/stateManager.js";
import {
    buildIdVariants,
    getElementByIdFlexible,
} from "../dom/elementIdUtils.js";
import {
    extractTabNameFromContentId,
    getContentIdFromTabName,
} from "./tabIdUtils.js";
const TAB_CONTENT_IDS = [
    "content_data",
    "content_chartjs",
    "content_browser",
    "content_map",
    "content_summary",
    "content_altfit",
    "content_zwift",
];
const DISPLAY_FLEX = "flex";
const DISPLAY_NONE = "none";
let mapReflowTimerLong;
let mapReflowTimerShort;
function canUseDocument(candidate) {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "getElementById" in candidate &&
        typeof candidate.getElementById === "function" &&
        "querySelectorAll" in candidate &&
        typeof candidate.querySelectorAll === "function"
    );
}
function getEffectiveGlobals() {
    return globalThis;
}
function getGlobalDocument() {
    try {
        return typeof globalThis.document !== "undefined"
            ? globalThis.document
            : undefined;
    } catch {
        return undefined;
    }
}
function getEffectiveDocument() {
    try {
        return getEffectiveGlobals().__vitest_effective_document__;
    } catch {
        return undefined;
    }
}
function getDoc() {
    const candidates = [
        getGlobalDocument(),
        getGlobalDocument(),
        getEffectiveDocument(),
    ];
    for (const candidate of candidates) {
        if (canUseDocument(candidate)) {
            return candidate;
        }
    }
    return document;
}
function asStateManagerCandidate(value) {
    return value !== null && typeof value === "object" ? value : {};
}
function getGetState(candidate) {
    const value = candidate.getState;
    return typeof value === "function" ? value : undefined;
}
function getSetState(candidate) {
    const value = candidate.setState;
    return typeof value === "function" ? value : undefined;
}
function getSubscribe(candidate) {
    const value = candidate.subscribe;
    return typeof value === "function" ? value : undefined;
}
function getStateMgr() {
    try {
        const moduleStateManager = asStateManagerCandidate(__StateMgr);
        const getState = getGetState(moduleStateManager);
        const setState = getSetState(moduleStateManager);
        const subscribe = getSubscribe(moduleStateManager);
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    try {
        const effectiveStateManager = asStateManagerCandidate(
            getEffectiveGlobals().__vitest_effective_stateManager__
        );
        const fallbackStateManager = asStateManagerCandidate(__StateMgr);
        const getState =
            getGetState(effectiveStateManager) ??
            getGetState(fallbackStateManager);
        const setState =
            getSetState(effectiveStateManager) ??
            getSetState(fallbackStateManager);
        const subscribe =
            getSubscribe(effectiveStateManager) ??
            getSubscribe(fallbackStateManager);
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    return {
        getState: __StateMgr.getState,
        setState: __StateMgr.setState,
        subscribe: __StateMgr.subscribe,
    };
}
function getStringState(path) {
    const value = getStateMgr().getState(path);
    return typeof value === "string" && value ? value : null;
}
function getContentElementMap() {
    const elementMap = {};
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
function resolveTargetContentId(visibleTabId, elementMap) {
    let targetId = visibleTabId;
    let derivedTabName = null;
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
export function getVisibleTabContent() {
    return getStringState("ui.activeTabContent");
}
/**
 * Hide all tab content.
 */
export function hideAllTabContent() {
    updateTabVisibility(null);
}
/**
 * Initialize tab visibility state management.
 */
export function initializeTabVisibilityState() {
    let noDataSwitchTimer = null;
    getStateMgr().subscribe("ui.activeTab", (activeTab) => {
        if (typeof activeTab === "string") {
            const contentId = getContentIdFromTabName(activeTab);
            updateTabVisibility(contentId);
        }
    });
    getStateMgr().subscribe("globalData", (data) => {
        const hasData = data !== null && data !== undefined;
        if (hasData) {
            if (noDataSwitchTimer !== null) {
                clearTimeout(noDataSwitchTimer);
                noDataSwitchTimer = null;
            }
            return;
        }
        if (noDataSwitchTimer !== null) {
            clearTimeout(noDataSwitchTimer);
        }
        noDataSwitchTimer = setTimeout(() => {
            noDataSwitchTimer = null;
            const latestData = getStateMgr().getState("globalData");
            const stillNoData = latestData === null || latestData === undefined;
            const isLoading = Boolean(getStateMgr().getState("isLoading"));
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
export function showTabContent(tabName) {
    const contentId = getContentIdFromTabName(tabName);
    updateTabVisibility(contentId);
}
/**
 * Toggles the visibility of tab content sections by setting the display style.
 *
 * @param visibleTabId - ID of the tab content element to display.
 */
export function updateTabVisibility(visibleTabId) {
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
function scheduleMapReflowRefresh() {
    const globals = getEffectiveGlobals();
    const map = globals._leafletMapInstance;
    if (!map || typeof map.invalidateSize !== "function") {
        return;
    }
    if (mapReflowTimerShort !== undefined) {
        clearTimeout(mapReflowTimerShort);
        mapReflowTimerShort = undefined;
    }
    if (mapReflowTimerLong !== undefined) {
        clearTimeout(mapReflowTimerLong);
        mapReflowTimerLong = undefined;
    }
    const reflow = () => {
        try {
            map.invalidateSize({ animate: false, pan: false });
        } catch {
            /* Ignore errors */
        }
        try {
            const miniMap = globals._miniMapControl?._miniMap;
            if (miniMap && typeof miniMap.invalidateSize === "function") {
                miniMap.invalidateSize();
            }
        } catch {
            /* Ignore errors */
        }
    };
    const raf =
        typeof globalThis.requestAnimationFrame === "function"
            ? globalThis.requestAnimationFrame.bind(globalThis)
            : (callback) => setTimeout(callback, 0);
    reflow();
    raf(() => reflow());
    mapReflowTimerShort = setTimeout(() => {
        mapReflowTimerShort = undefined;
        reflow();
    }, 70);
    mapReflowTimerLong = setTimeout(() => {
        mapReflowTimerLong = undefined;
        reflow();
    }, 180);
}

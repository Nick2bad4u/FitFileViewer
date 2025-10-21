/**
 * @fileoverview Tab State Manager - Centralized tab management with state integration
 * @description Manages tab switching, state synchronization, and content rendering
 * @author FitFileViewer Development Team
 * @version 3.0.0
 */

// Prefer dynamic state manager accessor to avoid stale imports across suites
import * as __StateMgr from "../../state/core/stateManager.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { tabRenderingManager } from "./tabRenderingManager.js";

// Resolve document by preferring the canonical test-provided document
// (`__vitest_effective_document__`) first, then falling back to the
// Active global/window document. This avoids cross-realm mismatches
// Across the full test suite.
/**
 * @returns {Document}
 */
const getDoc = () => {
    /** @type {any} */
    let d;
    // Prefer the current test's document first
    try {
        // @ts-ignore
        if (!d && typeof document !== "undefined" && document && typeof document.getElementById === "function") {
            // @ts-ignore
            d = /** @type {any} */ (document);
        }
    } catch {
        /* Ignore errors */
    }
    try {
        if (!d && globalThis.window !== undefined && globalThis.document) d = /** @type {any} */ (globalThis.document);
    } catch {
        /* Ignore errors */
    }
    try {
        if (!d && typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).document) {
            d = /** @type {any} */ (/** @type {any} */ (globalThis).document);
        }
    } catch {
        /* Ignore errors */
    }
    // Fallback to canonical test harness document
    try {
        // @ts-ignore
        if (!d && typeof __vitest_effective_document__ !== "undefined" && __vitest_effective_document__) {
            // @ts-ignore
            d = /** @type {any} */ (__vitest_effective_document__);
        }
    } catch {
        /* Ignore errors */
    }
    if (!d) {
        // @ts-ignore JSDOM provides document
        d = /** @type {any} */ (document);
    }
    try {
        if (!(d && typeof d.getElementById === "function" && typeof d.querySelectorAll === "function")) {
            // Prefer current doc/window, then global, then canonical
            // @ts-ignore
            if (typeof document !== "undefined" && document && typeof document.getElementById === "function") {
                // @ts-ignore
                d = /** @type {any} */ (document);
            } else if (globalThis.window !== undefined && globalThis.document) {
                d = /** @type {any} */ (globalThis.document);
            } else if (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).document) {
                d = /** @type {any} */ (/** @type {any} */ (globalThis).document);
            } else if (
                typeof __vitest_effective_document__ !== "undefined" &&
                /** @type {any} */ (/** @type {any} */ (__vitest_effective_document__))
            ) {
                // @ts-ignore
                d = /** @type {any} */ (__vitest_effective_document__);
            }
        }
    } catch {
        /* Ignore errors */
    }
    return /** @type {Document} */ (d);
};
import { showNotification } from "../notifications/showNotification.js";

// Retrieve state manager functions. Prefer the module namespace (so Vitest mocks are respected),
// And only fall back to a canonical global mock if module functions are unavailable.
/** @returns {{ getState: any, setState: any, subscribe: any }} */
const getStateMgr = () => {
    try {
        const sm = /** @type {any} */ (__StateMgr);
        const getState = sm && typeof sm.getState === "function" ? sm.getState : undefined;
        const setState = sm && typeof sm.setState === "function" ? sm.setState : undefined;
        const subscribe = sm && typeof sm.subscribe === "function" ? sm.subscribe : undefined;
        if (getState && setState && subscribe) {
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    try {
        // @ts-ignore
        const eff =
            typeof __vitest_effective_stateManager__ !== "undefined" &&
            /** @type {any} */ (__vitest_effective_stateManager__);
        if (eff && typeof eff === "object") {
            const getState = typeof eff.getState === "function" ? eff.getState : __StateMgr.getState;
            const setState = typeof eff.setState === "function" ? eff.setState : __StateMgr.setState;
            const subscribe = typeof eff.subscribe === "function" ? eff.subscribe : __StateMgr.subscribe;
            return { getState, setState, subscribe };
        }
    } catch {
        /* Ignore errors */
    }
    return {
        getState: /** @type {any} */ (__StateMgr.getState),
        setState: /** @type {any} */ (__StateMgr.setState),
        subscribe: /** @type {any} */ (__StateMgr.subscribe),
    };
};

/**
 * Tab configuration defining available tabs and their handlers
 */
/**
 * @typedef {{id:string; contentId:string; label:string; requiresData:boolean; handler:string|null}} TabDef
 */
const TAB_CONFIG = /** @type {Record<string, TabDef>} */ ({
    altfit: {
        contentId: "content-altfit",
        handler: null,
        id: "tab-altfit",
        label: "Alternative View",
        requiresData: false,
    },
    chart: {
        contentId: "content-chart",
        handler: "renderChartJS",
        id: "tab-chart",
        label: "Charts",
        requiresData: true,
    },
    chartjs: {
        contentId: "content-chartjs",
        handler: "renderChartJS",
        id: "tab-chartjs",
        label: "Charts",
        requiresData: true,
    },
    data: {
        contentId: "content-data",
        handler: "createTables",
        id: "tab-data",
        label: "Data Tables",
        requiresData: true,
    },
    map: {
        contentId: "content-map",
        handler: "renderMap",
        id: "tab-map",
        label: "Map",
        requiresData: true,
    },
    summary: {
        contentId: "content-summary",
        handler: "renderSummary",
        id: "tab-summary",
        label: "Summary",
        requiresData: true,
    },
    zwift: {
        contentId: "content-zwift",
        handler: null,
        id: "tab-zwift",
        label: "Zwift",
        requiresData: false,
    },
});

/**
 * Tab State Manager - handles tab switching and content management
 */
class TabStateManager {
    isInitialized = false;

    previousTab = null;

    constructor() {
        // Track unsubscribe functions for state subscriptions
        /** @type {Array<() => void>} */
        this._unsubscribes = [];
        // Stable click handler reference to prevent accumulating listeners
        /** @type {(event: Event) => void} */
        this._buttonClickHandler = (event) => {
            try {
                console.log(
                    `[TabStateManager] Click detected on button: ${/** @type {any} */ (event?.currentTarget)?.id || ""}`,
                    event
                );
            } catch {
                /* Ignore errors */
            }
            this.handleTabButtonClick(event);
        };
        // Reference to DOMContentLoaded setup function so we can remove it in cleanup
        /** @type {(() => void) | null} */
        this._setupHandlersFn = null;

        this.initializeSubscriptions();
        this.setupTabButtonHandlers();

        console.log("[TabStateManager] Initialized");
    }

    /**
     * Cleanup resources (placeholder for future unsubscribe logic)
     */
    cleanup() {
        // Unsubscribe state listeners
        try {
            if (Array.isArray(this._unsubscribes) && this._unsubscribes.length > 0) {
                for (const unsub of this._unsubscribes.splice(0)) {
                    try {
                        typeof unsub === "function" && unsub();
                    } catch {
                        /* Ignore errors */
                    }
                }
            }
        } catch {
            /* Ignore errors */
        }
        // Remove document DOMContentLoaded handler if previously added
        try {
            if (this._setupHandlersFn) {
                getDoc().removeEventListener("DOMContentLoaded", this._setupHandlersFn);
                this._setupHandlersFn = null;
            }
        } catch {
            /* Ignore errors */
        }
        // Detach click handlers from current tab buttons
        try {
            const tabButtons = getDoc().querySelectorAll(".tab-button");
            for (const button of tabButtons) {
                try {
                    button.removeEventListener("click", this._buttonClickHandler);
                } catch {
                    /* Ignore errors */
                }
            }
        } catch {
            /* Ignore errors */
        }
        // Mark uninitialized so tests can re-init if they re-import or call setup explicitly
        this.isInitialized = false;
        console.log("[TabStateManager] cleanup invoked");
    }

    /**
     * Extract tab name from button ID
     * @param {string} buttonId - Button element ID
     * @returns {string|null} Tab name or null
     */
    extractTabName(buttonId) {
        // Try direct lookup in config first
        for (const [tabName, config] of Object.entries(TAB_CONFIG)) {
            if (config.id === buttonId) {
                return tabName;
            }
        }

        // Fallback to pattern matching
        const patterns = [/^tab-(.+)$/, /^(.+)-tab$/, /^btn-(.+)$/, /^(.+)-btn$/];

        for (const pattern of patterns) {
            const match = buttonId.match(pattern);
            if (match && match[1] && TAB_CONFIG[match[1]]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Get current active tab information
     * @returns {Object} Active tab information
     */
    getActiveTabInfo() {
        const activeTab = getStateMgr().getState("ui.activeTab"),
            config = TAB_CONFIG[activeTab];

        return {
            config,
            contentElement: config ? getDoc().getElementById(config.contentId) : null,
            element: config ? getDoc().getElementById(config.id) : null,
            name: activeTab,
            previous: this.previousTab,
        };
    }

    /**
     * Handle alternative FIT viewer tab activation
     */
    handleAltFitTab() {
        const el = getDoc().querySelector("#altfit-iframe");
        // Avoid cross-realm instanceof checks; rely on tagName and presence of src
        if (
            el &&
            typeof (/** @type {any} */ (el).tagName) === "string" &&
            /** @type {any} */ (el).tagName.toUpperCase() === "IFRAME"
        ) {
            const iframe = /** @type {any} */ (el);
            if (typeof iframe.src === "string" && !iframe.src.includes("ffv/index.html")) {
                iframe.src = "ffv/index.html";
            }
        }
    }

    /**
     * Handle chart tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleChartTab(globalData) {
        if (!globalData || !globalData.recordMesgs) {
            console.warn("[TabStateManager] No chart data available");
            return;
        }

        // Use tab rendering manager to handle chart rendering with cancellation support
        await tabRenderingManager.executeRenderOperation(
            "chart",
            async (token) => {
                // Check if cancelled before starting
                if (token.isCancelled) {
                    return null;
                }

                // Let the chart state manager handle the rendering with proper state integration
                const chartState = getStateMgr().getState("charts");

                if (chartState?.isRendered) {
                    console.log("[TabStateManager] Chart tab activated - charts already rendered");
                    getStateMgr().setState("charts.tabActive", true, { source: "TabStateManager.handleChartTab" });
                } else {
                    console.log(
                        "[TabStateManager] Chart tab activated - triggering initial render through state system"
                    );
                    // The chartStateManager will handle rendering through its subscriptions
                    // We just need to ensure the tab is marked as active in state
                    getStateMgr().setState("charts.tabActive", true, { source: "TabStateManager.handleChartTab" });
                }

                // Check if cancelled after state updates
                if (token.isCancelled) {
                    console.log("[TabStateManager] Chart tab rendering cancelled");
                    return null;
                }

                return true;
            },
            { debounce: true, skipIfRecent: true }
        );
    }

    /**
     * Handle data tables tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleDataTab(globalData) {
        if (!globalData || !(/** @type {any} */ (globalThis).createTables)) {
            return;
        }

        // Check for background-rendered data first
        const bgContainer = getDoc().querySelector("#background-data-container"),
            visibleContainer = getDoc().querySelector("#content-data");

        if (bgContainer && bgContainer.childNodes && bgContainer.childNodes.length > 0 && visibleContainer) {
            // Move pre-rendered content
            visibleContainer.innerHTML = "";
            while (bgContainer.firstChild) {
                visibleContainer.append(bgContainer.firstChild);
            }
        } else {
            // Render fresh tables
            console.log("[TabStateManager] Creating data tables");
            /** @type {any} */ (globalThis).createTables(globalData);
        }
    }

    /**
     * Handle map tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleMapTab(globalData) {
        if (!globalData || !globalData.recordMesgs) {
            return;
        }

        // Check if map is already rendered
        const mapState = getStateMgr().getState("map");
        if (!mapState?.isRendered && /** @type {any} */ (globalThis).renderMap) {
            console.log("[TabStateManager] Rendering map for first time");
            /** @type {any} */ (globalThis).renderMap();
            getStateMgr().setState("map.isRendered", true, { source: "TabStateManager.handleMapTab" });
        } else {
            // Map already rendered, just invalidate size to fix grey tiles after tab switch
            const mapInstance = /** @type {any} */ (globalThis)._leafletMapInstance,
                renderMapFn = /** @type {any} */ (globalThis).renderMap;

            if (mapInstance && typeof mapInstance.invalidateSize === "function") {
                /**
                 * Attempt to reflow the map safely. If the underlying container has been detached,
                 * we fall back to a full re-render to avoid Leaflet accessing undefined properties.
                 */
                const executeInvalidation = () => {
                    const container = typeof mapInstance.getContainer === "function" ? mapInstance.getContainer() : null;

                    if (!container || !container.isConnected) {
                        console.warn("[TabStateManager] Map container missing; re-rendering map instance");
                        if (typeof renderMapFn === "function") {
                            renderMapFn();
                            getStateMgr().setState("map.isRendered", true, { source: "TabStateManager.handleMapTab.reRender" });
                        }
                        return;
                    }

                    try {
                        mapInstance.invalidateSize({ pan: false });
                        console.log("[TabStateManager] Map size invalidated to fix grey tiles");
                    } catch (error) {
                        console.warn("[TabStateManager] Map invalidation failed; re-rendering map", error);
                        if (typeof renderMapFn === "function") {
                            renderMapFn();
                            getStateMgr().setState("map.isRendered", true, { source: "TabStateManager.handleMapTab.recover" });
                        }
                    }
                };

                if (typeof requestAnimationFrame === "function") {
                    requestAnimationFrame(() => requestAnimationFrame(executeInvalidation));
                } else {
                    setTimeout(executeInvalidation, 75);
                }
            }
        }
    }

    /**
     * Handle summary tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleSummaryTab(globalData) {
        if (!globalData || !(/** @type {any} */ (globalThis).renderSummary)) {
            return;
        }

        // Check if we need to re-render summary
        const currentDataHash = this.hashData(globalData),
            previousData = getStateMgr().getState("summary.lastDataHash");

        if (previousData !== currentDataHash) {
            console.log("[TabStateManager] Rendering summary with new data");
            /** @type {any} */ (globalThis).renderSummary(globalData);
            getStateMgr().setState("summary.lastDataHash", currentDataHash, {
                source: "TabStateManager.handleSummaryTab",
            });
        }
    }

    /**
     * Handle tab button click events
     * @param {Event} event - Click event
     */
    handleTabButtonClick = (event) => {
        const button = event.currentTarget instanceof HTMLElement ? event.currentTarget : null,
            tabId = button?.id || "";

        // Check if button is disabled
        if (
            !button ||
            ("disabled" in button && /** @type {any} */ (button).disabled) ||
            button.hasAttribute("disabled") ||
            button.classList.contains("tab-disabled")
        ) {
            console.log(`[TabStateManager] Ignoring click on disabled button: ${tabId}`);
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // Extract tab name from button ID
        const tabName = this.extractTabName(tabId);
        if (!tabName) {
            console.warn(`[TabStateManager] Could not extract tab name from ID: ${tabId}`);
            return;
        }

        // Prevent switching if already active
        if (button.classList.contains("active")) {
            return;
        }

        // Check if tab requires data
        const tabConfig = /** @type {TabDef|undefined} */ (TAB_CONFIG[tabName]);
        if (tabConfig?.requiresData) {
            const globalData = getStateMgr().getState("globalData");
            if (!globalData || !globalData.recordMesgs) {
                showNotification("Please load a FIT file first", "info");
                return;
            }
        }

        // Update state - this will trigger the subscription handler
        getStateMgr().setState("ui.activeTab", tabName, { source: "TabStateManager.buttonClick" });
    };

    /**
     * Handle tab change through state management
     * @param {string} newTab - New active tab name
     * @param {string} oldTab - Previous active tab name
     */
    handleTabChange(newTab, oldTab) {
        console.log(`[TabStateManager] Tab change: ${oldTab} -> ${newTab}`);

        this.previousTab = oldTab;

        // Notify tab rendering manager of the switch to cancel old operations
        tabRenderingManager.notifyTabSwitch(oldTab, newTab);

        // Update tab button states
        this.updateTabButtonStates(newTab);

        // Update content visibility
        this.updateContentVisibility(newTab);

        // Handle tab-specific logic
        this.handleTabSpecificLogic(newTab);
    }

    /**
     * Handle tab-specific initialization and rendering logic
     * @param {string} tabName - Name of the active tab
     */
    async handleTabSpecificLogic(tabName) {
        const tabConfig = /** @type {TabDef|undefined} */ (TAB_CONFIG[tabName]);
        if (!tabConfig) {
            return;
        }

        const globalData = getStateMgr().getState("globalData");

        try {
            switch (tabName) {
                case "altfit": {
                    this.handleAltFitTab();
                    break;
                }
                case "chart":
                // falls through to chartjs case
                case "chartjs": {
                    await this.handleChartTab(globalData);
                    break;
                }

                case "data": {
                    await this.handleDataTab(globalData);
                    break;
                }

                case "map": {
                    await this.handleMapTab(globalData);
                    break;
                }

                case "summary": {
                    await this.handleSummaryTab(globalData);
                    break;
                }

                default: {
                    console.log(`[TabStateManager] No specific handler for tab: ${tabName}`);
                }
            }
        } catch (error) {
            console.error(`[TabStateManager] Error handling tab ${tabName}:`, error);
            showNotification(`Error loading ${tabConfig.label} tab`, "error");
        }
    }

    /**
     * Generate simple hash for data comparison
     * @param {Object} data - Data to hash
     * @returns {string} Simple hash string
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} data */
    hashData(data) {
        if (!data) {
            return "";
        }

        // Simple hash based on data size and some key fields
        const recordMesgs = data.recordMesgs || [],
            size = recordMesgs.length || 0,
            firstRecord = recordMesgs[0] || {},
            lastRecord = recordMesgs[size - 1] || {};

        return `${size}-${firstRecord.timestamp || 0}-${lastRecord.timestamp || 0}`;
    }

    /**
     * Initialize state subscriptions for reactive tab management
     */
    initializeSubscriptions() {
        // Subscribe to active tab changes
        const unsubActive = getStateMgr().subscribe(
            "ui.activeTab",
            (/** @type {string} */ newTab, /** @type {string} */ oldTab) => {
                if (newTab !== oldTab) {
                    this.handleTabChange(newTab, oldTab);
                }
            }
        );
        if (typeof unsubActive === "function")
            this._unsubscribes.push(() => {
                try {
                    unsubActive();
                } catch {
                    /* Ignore errors */
                }
            });

        // Subscribe to data changes to enable/disable tabs
        const unsubData = getStateMgr().subscribe("globalData", (/** @type {any} */ newData) => {
            this.updateTabAvailability(newData);
        });
        if (typeof unsubData === "function")
            this._unsubscribes.push(() => {
                try {
                    unsubData();
                } catch {
                    /* Ignore errors */
                }
            });

        this.isInitialized = true;
    }

    /**
     * Set up click handlers for all tab buttons
     */
    setupTabButtonHandlers() {
        // Wait for DOM to be ready
        const setupHandlers = () => {
            const tabButtons = getDoc().querySelectorAll(".tab-button");

            for (const button of tabButtons) {
                // Add stable listener with automatic cleanup tracking
                try {
                    addEventListenerWithCleanup(button, "click", this._buttonClickHandler);
                } catch {
                    /* Ignore errors */
                }
            }

            console.log(`[TabStateManager] Set up handlers for ${tabButtons.length} tab buttons`);
        };

        const doc = getDoc();
        if (doc.readyState === "loading") {
            // Store reference so we can remove it during cleanup
            this._setupHandlersFn = setupHandlers;
            try {
                addEventListenerWithCleanup(doc, "DOMContentLoaded", this._setupHandlersFn);
            } catch {
                /* Ignore errors */
            }
        } else {
            setupHandlers();
        }
    }

    /**
     * Manually switch to a specific tab
     * @param {string} tabName - Name of tab to switch to
     */
    switchToTab(tabName) {
        if (!TAB_CONFIG[tabName]) {
            console.warn(`[TabStateManager] Unknown tab: ${tabName}`);
            return false;
        }

        getStateMgr().setState("ui.activeTab", tabName, { source: "TabStateManager.switchToTab" });
        return true;
    }

    /**
     * Update content area visibility
     * @param {string} activeTab - Currently active tab name
     */
    updateContentVisibility(activeTab) {
        const tabConfig = /** @type {TabDef|undefined} */ (TAB_CONFIG[activeTab]);
        if (!tabConfig) {
            console.warn(`[TabStateManager] Unknown tab: ${activeTab}`);
            return;
        }

        // Hide all content areas
        for (const config of Object.values(TAB_CONFIG)) {
            const contentElement = getDoc().getElementById(config.contentId);
            if (contentElement) {
                contentElement.style.display = "none";
            }
        }

        // Show active content area
        const activeContent = getDoc().getElementById(tabConfig.contentId);
        if (activeContent) {
            activeContent.style.display = "block";
        }
    }
    /**
     * Update tab availability based on data availability
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    updateTabAvailability(globalData) {
        const hasData = Boolean(globalData && globalData.recordMesgs);

        for (const [, config] of Object.entries(TAB_CONFIG)) {
            if (!config.requiresData) {
                continue;
            }
            const el = getDoc().getElementById(config.id);
            if (el) {
                // Avoid cross-realm instanceof by duck-typing
                /** @type {any} */
                const button = /** @type {any} */ (el);
                if (typeof button.classList?.toggle === "function") {
                    if ("disabled" in button) button.disabled = !hasData;
                    try {
                        button.classList.toggle("disabled", !hasData);
                    } catch {
                        /* Ignore errors */
                    }
                }
            }
        }
    }
    /**
     * Update tab button visual states
     * @param {string} activeTab - Currently active tab name
     */
    updateTabButtonStates(activeTab) {
        const tabButtons = getDoc().querySelectorAll(".tab-button");

        for (const button of tabButtons) {
            try {
                const tabName = this.extractTabName(button.id),
                    isActive = tabName === activeTab;

                // Defensive: ensure classList exists
                if (button && button.classList && typeof button.classList.toggle === "function") {
                    button.classList.toggle("active", isActive);
                }
                // Always set aria-selected for both active and inactive to maintain consistency
                if (button && typeof button.setAttribute === "function") {
                    button.setAttribute("aria-selected", isActive ? "true" : "false");
                }
            } catch {
                // Ignore individual button failures to keep others updated
            }
        }
    }
}

// Create and export singleton instance
export const tabStateManager = new TabStateManager();

// Export tab configuration for external use
export { TAB_CONFIG };

// Expose globally for debugging
if (globalThis.window !== undefined) {
    /** @type {any} */ (globalThis).tabStateManager = tabStateManager;
}

export default tabStateManager;

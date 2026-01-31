/**
 * Manages tab switching, state synchronization, and content rendering
 *
 * @version 3.0.0
 *
 * @file Tab State Manager - Centralized tab management with state integration
 *
 * @author FitFileViewer Development Team
 */

import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { showNotification } from "../notifications/showNotification.js";
import { tabRenderingManager } from "./tabRenderingManager.js";
import { TAB_CONFIG } from "./tabStateManagerConfig.js";
import {
    handleAltFitTab,
    handleBrowserTab,
    handleChartTab,
    handleDataTab,
    handleMapTab,
    handleSummaryTab,
} from "./tabStateManagerHandlers.js";
import { getDoc, getStateMgr } from "./tabStateManagerSupport.js";

/** @typedef {import("./tabStateManagerConfig.js").TabDef} TabDef */

/**
 * Tab State Manager - handles tab switching and content management
 */
class TabStateManager {
    isInitialized = false;

    previousTab = null;

    constructor() {
        // Track unsubscribe functions for state subscriptions
        /** @type {(() => void)[]} */
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
            if (
                Array.isArray(this._unsubscribes) &&
                this._unsubscribes.length > 0
            ) {
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
                getDoc().removeEventListener(
                    "DOMContentLoaded",
                    this._setupHandlersFn
                );
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
                    button.removeEventListener(
                        "click",
                        this._buttonClickHandler
                    );
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
     *
     * @param {string} buttonId - Button element ID
     *
     * @returns {string | null} Tab name or null
     */
    extractTabName(buttonId) {
        // Try direct lookup in config first
        for (const [tabName, config] of Object.entries(TAB_CONFIG)) {
            if (config.id === buttonId) {
                return tabName;
            }
        }

        // Fallback to pattern matching
        const patterns = [
            /^tab-(.+)$/,
            /^(.+)-tab$/,
            /^btn-(.+)$/,
            /^(.+)-btn$/,
        ];

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
     *
     * @returns {Object} Active tab information
     */
    getActiveTabInfo() {
        const activeTab = getStateMgr().getState("ui.activeTab"),
            config = TAB_CONFIG[activeTab];

        return {
            config,
            contentElement: config
                ? getDoc().getElementById(config.contentId)
                : null,
            element: config ? getDoc().getElementById(config.id) : null,
            name: activeTab,
            previous: this.previousTab,
        };
    }

    /**
     * Handle tab button click events
     *
     * @param {Event} event - Click event
     */
    handleTabButtonClick = (event) => {
        const button =
                event.currentTarget instanceof HTMLElement
                    ? event.currentTarget
                    : null,
            tabId = button?.id || "";

        // Check if button is disabled
        if (
            !button ||
            ("disabled" in button && /** @type {any} */ (button).disabled) ||
            button.hasAttribute("disabled") ||
            button.classList.contains("tab-disabled")
        ) {
            console.log(
                `[TabStateManager] Ignoring click on disabled button: ${tabId}`
            );
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // Extract tab name from button ID
        const tabName = this.extractTabName(tabId);
        if (!tabName) {
            console.warn(
                `[TabStateManager] Could not extract tab name from ID: ${tabId}`
            );
            return;
        }

        // Prevent switching if already active
        if (button.classList.contains("active")) {
            return;
        }

        // Check if tab requires data
        const tabConfig = /** @type {TabDef | undefined} */ (
            TAB_CONFIG[tabName]
        );
        if (tabConfig?.requiresData) {
            const globalData = getStateMgr().getState("globalData");
            if (!globalData || !globalData.recordMesgs) {
                showNotification("Please load a FIT file first", "info");
                return;
            }
        }

        // Update state - this will trigger the subscription handler
        getStateMgr().setState("ui.activeTab", tabName, {
            source: "TabStateManager.buttonClick",
        });
    };

    /**
     * Handle tab change through state management
     *
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
     *
     * @param {string} tabName - Name of the active tab
     */
    async handleTabSpecificLogic(tabName) {
        const tabConfig = /** @type {TabDef | undefined} */ (
            TAB_CONFIG[tabName]
        );
        if (!tabConfig) {
            return;
        }

        const globalData = getStateMgr().getState("globalData");

        try {
            switch (tabName) {
                case "altfit": {
                    handleAltFitTab();
                    break;
                }
                case "browser": {
                    await handleBrowserTab();
                    break;
                }
                case "chart":
                // falls through to chartjs case
                case "chartjs": {
                    await handleChartTab(globalData);
                    break;
                }

                case "data": {
                    await handleDataTab(globalData);
                    break;
                }

                case "map": {
                    await handleMapTab(globalData);
                    break;
                }

                case "summary": {
                    await handleSummaryTab(globalData);
                    break;
                }

                default: {
                    console.log(
                        `[TabStateManager] No specific handler for tab: ${tabName}`
                    );
                }
            }
        } catch (error) {
            console.error(
                `[TabStateManager] Error handling tab ${tabName}:`,
                error
            );
            showNotification(`Error loading ${tabConfig.label} tab`, "error");
        }
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
        const unsubData = getStateMgr().subscribe(
            "globalData",
            (/** @type {any} */ newData) => {
                this.updateTabAvailability(newData);
            }
        );
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
                    addEventListenerWithCleanup(
                        button,
                        "click",
                        this._buttonClickHandler
                    );
                } catch {
                    /* Ignore errors */
                }
            }

            console.log(
                `[TabStateManager] Set up handlers for ${tabButtons.length} tab buttons`
            );
        };

        const doc = getDoc();
        if (doc.readyState === "loading") {
            // Store reference so we can remove it during cleanup
            this._setupHandlersFn = setupHandlers;
            try {
                addEventListenerWithCleanup(
                    doc,
                    "DOMContentLoaded",
                    this._setupHandlersFn
                );
            } catch {
                /* Ignore errors */
            }
        } else {
            setupHandlers();
        }
    }

    /**
     * Manually switch to a specific tab
     *
     * @param {string} tabName - Name of tab to switch to
     */
    switchToTab(tabName) {
        if (!TAB_CONFIG[tabName]) {
            console.warn(`[TabStateManager] Unknown tab: ${tabName}`);
            return false;
        }

        getStateMgr().setState("ui.activeTab", tabName, {
            source: "TabStateManager.switchToTab",
        });
        return true;
    }

    /**
     * Update content area visibility
     *
     * @param {string} activeTab - Currently active tab name
     */
    updateContentVisibility(activeTab) {
        const tabConfig = /** @type {TabDef | undefined} */ (
            TAB_CONFIG[activeTab]
        );
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
     *
     * @param {Object} globalData - Current global data
     */
    /** @param {{ recordMesgs?: any[] } | null | undefined} globalData */
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
     *
     * @param {string} activeTab - Currently active tab name
     */
    updateTabButtonStates(activeTab) {
        const tabButtons = getDoc().querySelectorAll(".tab-button");

        for (const button of tabButtons) {
            try {
                const tabName = this.extractTabName(button.id),
                    isActive = tabName === activeTab;

                // Defensive: ensure classList exists
                if (
                    button &&
                    button.classList &&
                    typeof button.classList.toggle === "function"
                ) {
                    button.classList.toggle("active", isActive);
                }
                // Always set aria-selected for both active and inactive to maintain consistency
                if (button && typeof button.setAttribute === "function") {
                    button.setAttribute(
                        "aria-selected",
                        isActive ? "true" : "false"
                    );
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

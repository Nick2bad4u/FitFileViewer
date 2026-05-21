/**
 * Manages tab switching, state synchronization, and content rendering
 */
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { showNotification } from "../notifications/showNotification.js";
import { resolveTabNameFromButtonId } from "./tabIdUtils.js";
import { tabRenderingManager } from "./tabRenderingManager.js";
import { TAB_CONFIG as TAB_CONFIG_DEFINITIONS } from "./tabStateManagerConfig.js";
import {
    handleAltFitTab as handleAltFitTabImpl,
    handleBrowserTab as handleBrowserTabImpl,
    handleChartTab as handleChartTabImpl,
    handleDataTab as handleDataTabImpl,
    handleMapTab as handleMapTabImpl,
    handleSummaryTab as handleSummaryTabImpl,
} from "./tabStateManagerHandlers.js";
import { getDoc, getStateMgr } from "./tabStateManagerSupport.js";
const TAB_CONFIG = TAB_CONFIG_DEFINITIONS;
function asActivityData(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return typeof value === "object" ? value : undefined;
}
function getTabConfig(tabName) {
    return TAB_CONFIG[tabName];
}
function isDisableableElement(element) {
    return "disabled" in element;
}
/**
 * Tab State Manager - handles tab switching and content management
 */
export class TabStateManager {
    isInitialized = false;
    previousTab = null;
    _setupHandlersFn = null;
    _buttonClickHandler;
    _unsubscribes = [];
    constructor() {
        // Stable click handler reference to prevent accumulating listeners
        this._buttonClickHandler = (event) => {
            try {
                const target =
                    event.currentTarget instanceof Element
                        ? event.currentTarget
                        : null;
                console.log(
                    `[TabStateManager] Click detected on button: ${target?.id || ""}`,
                    event
                );
            } catch {
                /* Ignore errors */
            }
            this.handleTabButtonClick(event);
        };
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
                        if (typeof unsub === "function") {
                            unsub();
                        }
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
     * @param buttonId - Button element ID.
     *
     * @returns Tab name or null.
     */
    extractTabName(buttonId) {
        return resolveTabNameFromButtonId(buttonId, TAB_CONFIG);
    }
    /**
     * Get current active tab information
     *
     * @returns Active tab information.
     */
    getActiveTabInfo() {
        const activeTab = getStateMgr().getState("ui.activeTab");
        const config =
            typeof activeTab === "string" ? getTabConfig(activeTab) : undefined;
        return {
            config,
            contentElement: config
                ? getElementByIdFlexible(getDoc(), config.contentId)
                : null,
            element: config
                ? getElementByIdFlexible(getDoc(), config.id)
                : null,
            name: activeTab,
            previous: this.previousTab,
        };
    }
    /**
     * Handle Alt Fit tab activation.
     */
    handleAltFitTab() {
        return handleAltFitTabImpl();
    }
    /**
     * Handle browser tab activation.
     */
    handleBrowserTab() {
        return handleBrowserTabImpl();
    }
    /**
     * Handle chart tab activation.
     *
     * @param globalData - Current activity data.
     */
    handleChartTab(globalData) {
        return handleChartTabImpl(globalData);
    }
    /**
     * Handle data tab activation.
     *
     * @param globalData - Current activity data.
     */
    handleDataTab(globalData) {
        return handleDataTabImpl(globalData);
    }
    /**
     * Handle map tab activation.
     *
     * @param globalData - Current activity data.
     */
    handleMapTab(globalData) {
        return handleMapTabImpl(globalData);
    }
    /**
     * Handle summary tab activation.
     *
     * @param globalData - Current activity data.
     */
    handleSummaryTab(globalData) {
        return handleSummaryTabImpl(globalData);
    }
    /**
     * Handle tab button click events
     *
     * @param event - Click event.
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
            (isDisableableElement(button) && button.disabled === true) ||
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
        const tabConfig = getTabConfig(tabName);
        if (tabConfig?.requiresData) {
            const globalData = asActivityData(
                getStateMgr().getState("globalData")
            );
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
     * @param newTab - New active tab name.
     * @param oldTab - Previous active tab name.
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
     * @param tabName - Name of the active tab.
     */
    async handleTabSpecificLogic(tabName) {
        const tabConfig = getTabConfig(tabName);
        if (!tabConfig) {
            return;
        }
        const globalData = asActivityData(getStateMgr().getState("globalData"));
        try {
            switch (tabName) {
                case "altfit": {
                    this.handleAltFitTab();
                    break;
                }
                case "browser": {
                    await this.handleBrowserTab();
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
     * Generate a simple hash for data comparison.
     *
     * @param data - Activity data to summarize.
     *
     * @returns Stable summary hash.
     */
    hashData(data) {
        if (!data) {
            return "";
        }
        const recordMesgs = data.recordMesgs || [];
        const size = recordMesgs.length || 0;
        const firstRecord = recordMesgs[0] || {};
        const lastRecord = recordMesgs[size - 1] || {};
        return `${size}-${firstRecord.timestamp || 0}-${lastRecord.timestamp || 0}`;
    }
    /**
     * Initialize state subscriptions for reactive tab management
     */
    initializeSubscriptions() {
        // Subscribe to active tab changes
        const unsubActive = getStateMgr().subscribe(
            "ui.activeTab",
            (newTab, oldTab) => {
                if (typeof newTab === "string" && newTab !== oldTab) {
                    this.handleTabChange(
                        newTab,
                        typeof oldTab === "string" ? oldTab : null
                    );
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
        const unsubData = getStateMgr().subscribe("globalData", (newData) => {
            this.updateTabAvailability(asActivityData(newData));
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
     * @param tabName - Name of tab to switch to.
     */
    switchToTab(tabName) {
        if (!getTabConfig(tabName)) {
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
     * @param activeTab - Currently active tab name.
     */
    updateContentVisibility(activeTab) {
        const tabConfig = getTabConfig(activeTab);
        if (!tabConfig) {
            console.warn(`[TabStateManager] Unknown tab: ${activeTab}`);
            return;
        }
        // Hide all content areas
        for (const config of Object.values(TAB_CONFIG)) {
            const contentElement = getElementByIdFlexible(
                getDoc(),
                config.contentId
            );
            if (contentElement) {
                contentElement.style.display = "none";
            }
        }
        // Show active content area
        const activeContent = getElementByIdFlexible(
            getDoc(),
            tabConfig.contentId
        );
        if (activeContent) {
            activeContent.style.display = "block";
        }
    }
    /**
     * Update tab availability based on data availability
     *
     * @param globalData - Current global data.
     */
    updateTabAvailability(globalData) {
        const hasData = Boolean(globalData && globalData.recordMesgs);
        for (const [, config] of Object.entries(TAB_CONFIG)) {
            if (!config.requiresData) {
                continue;
            }
            const el = getElementByIdFlexible(getDoc(), config.id);
            if (el) {
                // Avoid cross-realm instanceof by duck-typing
                const button = el;
                if (typeof button.classList?.toggle === "function") {
                    if (isDisableableElement(button)) {
                        button.disabled = !hasData;
                    }
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
     * @param activeTab - Currently active tab name.
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
/** Singleton tab state manager instance. */
export const tabStateManager = new TabStateManager();
/** Tab configuration metadata keyed by tab name. */
export { TAB_CONFIG };
// Expose globally for debugging
if (globalThis.window !== undefined) {
    globalThis.tabStateManager = tabStateManager;
}
export default tabStateManager;

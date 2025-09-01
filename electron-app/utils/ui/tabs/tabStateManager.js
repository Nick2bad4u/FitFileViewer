/**
 * @fileoverview Tab State Manager - Centralized tab management with state integration
 * @description Manages tab switching, state synchronization, and content rendering
 * @author FitFileViewer Development Team
 * @version 3.0.0
 */

import { getState, setState, subscribe } from "../../state/core/stateManager.js";
import { showNotification } from "../notifications/showNotification.js";

/**
 * Tab configuration defining available tabs and their handlers
 */
/**
 * @typedef {{id:string; contentId:string; label:string; requiresData:boolean; handler:string|null}} TabDef
 */
const TAB_CONFIG = /** @type {Record<string, TabDef>} */ ({
    summary: {
        id: "tab-summary",
        contentId: "content-summary",
        label: "Summary",
        requiresData: true,
        handler: "renderSummary",
    },
    map: {
        id: "tab-map",
        contentId: "content-map",
        label: "Map",
        requiresData: true,
        handler: "renderMap",
    },
    chartjs: {
        id: "tab-chartjs",
        contentId: "content-chartjs",
        label: "Charts",
        requiresData: true,
        handler: "renderChartJS",
    },
    chart: {
        id: "tab-chart",
        contentId: "content-chart",
        label: "Charts",
        requiresData: true,
        handler: "renderChartJS",
    },
    data: {
        id: "tab-data",
        contentId: "content-data",
        label: "Data Tables",
        requiresData: true,
        handler: "createTables",
    },
    altfit: {
        id: "tab-altfit",
        contentId: "content-altfit",
        label: "Alternative View",
        requiresData: false,
        handler: null,
    },
    zwift: {
        id: "tab-zwift",
        contentId: "content-zwift",
        label: "Zwift",
        requiresData: false,
        handler: null,
    },
});

/**
 * Tab State Manager - handles tab switching and content management
 */
class TabStateManager {
    constructor() {
        this.isInitialized = false;
        this.previousTab = null;

        this.initializeSubscriptions();
        this.setupTabButtonHandlers();

        console.log("[TabStateManager] Initialized");
    }

    /**
     * Initialize state subscriptions for reactive tab management
     */
    initializeSubscriptions() {
        // Subscribe to active tab changes
        subscribe("ui.activeTab", (/** @type {string} */ newTab, /** @type {string} */ oldTab) => {
            if (newTab !== oldTab) {
                this.handleTabChange(newTab, oldTab);
            }
        });

        // Subscribe to data changes to enable/disable tabs
        subscribe("globalData", (/** @type {any} */ newData) => {
            this.updateTabAvailability(newData);
        });

        this.isInitialized = true;
    }

    /**
     * Set up click handlers for all tab buttons
     */
    setupTabButtonHandlers() {
        // Wait for DOM to be ready
        const setupHandlers = () => {
            const tabButtons = document.querySelectorAll(".tab-button");

            tabButtons.forEach((button) => {
                // Remove existing listeners to prevent duplicates
                button.removeEventListener("click", this.handleTabButtonClick);

                // Add new listener
                button.addEventListener("click", (event) => {
                    console.log(`[TabStateManager] Click detected on button: ${button.id}`, event);
                    this.handleTabButtonClick(event);
                });
            });

            console.log(`[TabStateManager] Set up handlers for ${tabButtons.length} tab buttons`);
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", setupHandlers);
        } else {
            setupHandlers();
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
            const globalData = getState("globalData");
            if (!globalData || !globalData.recordMesgs) {
                showNotification("Please load a FIT file first", "info");
                return;
            }
        }

        // Update state - this will trigger the subscription handler
        setState("ui.activeTab", tabName, { source: "TabStateManager.buttonClick" });
    };

    /**
     * Handle tab change through state management
     * @param {string} newTab - New active tab name
     * @param {string} oldTab - Previous active tab name
     */
    handleTabChange(newTab, oldTab) {
        console.log(`[TabStateManager] Tab change: ${oldTab} -> ${newTab}`);

        this.previousTab = oldTab;

        // Update tab button states
        this.updateTabButtonStates(newTab);

        // Update content visibility
        this.updateContentVisibility(newTab);

        // Handle tab-specific logic
        this.handleTabSpecificLogic(newTab);
    }

    /**
     * Update tab button visual states
     * @param {string} activeTab - Currently active tab name
     */
    updateTabButtonStates(activeTab) {
        const tabButtons = document.querySelectorAll(".tab-button");

        tabButtons.forEach((button) => {
            const tabName = this.extractTabName(button.id),
             isActive = tabName === activeTab;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", isActive.toString());
        });
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
        Object.values(TAB_CONFIG).forEach((config) => {
            const contentElement = document.getElementById(config.contentId);
            if (contentElement) {
                contentElement.style.display = "none";
            }
        });

        // Show active content area
        const activeContent = document.getElementById(tabConfig.contentId);
        if (activeContent) {
            activeContent.style.display = "block";
        }
    }

    /**
     * Handle tab-specific initialization and rendering logic
     * @param {string} tabName - Name of the active tab
     */
    async handleTabSpecificLogic(tabName) {
        const tabConfig = /** @type {TabDef|undefined} */ (TAB_CONFIG[tabName]);
        if (!tabConfig) {return;}

        const globalData = getState("globalData");

        try {
            switch (tabName) {
                case "chartjs":
                case "chart":
                    await this.handleChartTab(globalData);
                    break;

                case "map":
                    await this.handleMapTab(globalData);
                    break;

                case "summary":
                    await this.handleSummaryTab(globalData);
                    break;

                case "data":
                    await this.handleDataTab(globalData);
                    break;

                case "altfit":
                    this.handleAltFitTab();
                    break;

                default:
                    console.log(`[TabStateManager] No specific handler for tab: ${tabName}`);
            }
        } catch (error) {
            console.error(`[TabStateManager] Error handling tab ${tabName}:`, error);
            showNotification(`Error loading ${tabConfig.label} tab`, "error");
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

        // Let the chart state manager handle the rendering with proper state integration
        const chartState = getState("charts");

        if (!chartState?.isRendered) {
            console.log("[TabStateManager] Chart tab activated - triggering initial render through state system");
            // The chartStateManager will handle rendering through its subscriptions
            // We just need to ensure the tab is marked as active in state
            setState("charts.tabActive", true, { source: "TabStateManager.handleChartTab" });
        } else {
            console.log("[TabStateManager] Chart tab activated - charts already rendered");
            setState("charts.tabActive", true, { source: "TabStateManager.handleChartTab" });
        }
    }

    /**
     * Handle map tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleMapTab(globalData) {
        if (!globalData || !globalData.recordMesgs) {return;}

        // Check if map is already rendered
        const mapState = getState("map");
        if (!mapState?.isRendered && /** @type {any} */ (window).renderMap) {
            console.log("[TabStateManager] Rendering map for first time");
            /** @type {any} */ (window).renderMap();
            setState("map.isRendered", true, { source: "TabStateManager.handleMapTab" });
        }
    }

    /**
     * Handle summary tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleSummaryTab(globalData) {
        if (!globalData || !(/** @type {any} */ (window).renderSummary)) {return;}

        // Check if we need to re-render summary
        const previousData = getState("summary.lastDataHash"),
         currentDataHash = this.hashData(globalData);

        if (previousData !== currentDataHash) {
            console.log("[TabStateManager] Rendering summary with new data");
            /** @type {any} */ (window).renderSummary(globalData);
            setState("summary.lastDataHash", currentDataHash, { source: "TabStateManager.handleSummaryTab" });
        }
    }

    /**
     * Handle data tables tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    async handleDataTab(globalData) {
        if (!globalData || !(/** @type {any} */ (window).createTables)) {return;}

        // Check for background-rendered data first
        const bgContainer = document.getElementById("background-data-container"),
         visibleContainer = document.getElementById("content-data");

        if (bgContainer && bgContainer.childNodes && bgContainer.childNodes.length > 0 && visibleContainer) {
            // Move pre-rendered content
            visibleContainer.innerHTML = "";
            while (bgContainer.firstChild) {
                visibleContainer.appendChild(bgContainer.firstChild);
            }
        } else {
            // Render fresh tables
            console.log("[TabStateManager] Creating data tables");
            /** @type {any} */ (window).createTables(globalData);
        }
    }

    /**
     * Handle alternative FIT viewer tab activation
     */
    handleAltFitTab() {
        const iframe = document.getElementById("altfit-iframe");
        if (iframe instanceof HTMLIFrameElement && !iframe.src.includes("libs/ffv/index.html")) {
            iframe.src = "libs/ffv/index.html";
        }
    }

    /**
     * Update tab availability based on data availability
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    updateTabAvailability(globalData) {
        const hasData = Boolean(globalData && globalData.recordMesgs);

        Object.entries(TAB_CONFIG).forEach(([, config]) => {
            if (!config.requiresData) {return;}
            const el = document.getElementById(config.id);
            if (el && el instanceof HTMLElement) {
                const button = /** @type {HTMLButtonElement} */ (el);
                button.disabled = !hasData;
                button.classList.toggle("disabled", !hasData);
            }
        });
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
     * Generate simple hash for data comparison
     * @param {Object} data - Data to hash
     * @returns {string} Simple hash string
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} data */
    hashData(data) {
        if (!data) {return "";}

        // Simple hash based on data size and some key fields
        const recordMesgs = data.recordMesgs || [],
         size = recordMesgs.length || 0,
         firstRecord = recordMesgs[0] || {},
         lastRecord = recordMesgs[size - 1] || {};

        return `${size}-${firstRecord.timestamp || 0}-${lastRecord.timestamp || 0}`;
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

        setState("ui.activeTab", tabName, { source: "TabStateManager.switchToTab" });
        return true;
    }

    /**
     * Cleanup resources (placeholder for future unsubscribe logic)
     */
    cleanup() {
        // If we later store unsubscribe handles, invoke them here.
        if (this.isInitialized) {
            this.isInitialized = false; // Allows re-init if ever needed
        }
        console.log("[TabStateManager] cleanup invoked");
    }

    /**
     * Get current active tab information
     * @returns {Object} Active tab information
     */
    getActiveTabInfo() {
        const activeTab = getState("ui.activeTab"),
         config = TAB_CONFIG[activeTab];

        return {
            name: activeTab,
            config,
            previous: this.previousTab,
            element: config ? document.getElementById(config.id) : null,
            contentElement: config ? document.getElementById(config.contentId) : null,
        };
    }
}

// Create and export singleton instance
export const tabStateManager = new TabStateManager();

// Export tab configuration for external use
export { TAB_CONFIG };

// Expose globally for debugging
if (typeof window !== "undefined") {
    /** @type {any} */ (window).tabStateManager = tabStateManager;
}

export default tabStateManager;

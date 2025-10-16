/**
 * Example integration of the new state system into renderer.js
 * This shows how to modify your existing renderer.js to use the new centralized state management
 */

import { AppActions, AppSelectors, normalizeTabName } from "../../app/lifecycle/appActions.js";
// Corrected path: state manager utilities live in ../core directory
import { getState, setState, subscribe } from "../core/stateManager.js";
import { UIActions } from "../domain/uiStateManager.js";
// At the top of renderer.js, add these imports:
import { initializeCompleteStateSystem } from "./stateIntegration.js";
/** @typedef {{ silent: boolean; source: string }} StateMeta */

/**
 * Example of how to use the state system in your existing functions
 */
export function exampleStateUsage() {
    // Getting state
    const activeTab = getState("ui.activeTab"),
        currentTheme = getState("ui.theme"),
        isLoading = getState("isLoading");

    console.log("Current state:", { activeTab, currentTheme, isLoading });

    // Setting state
    setState("ui.theme", "dark", { silent: false, source: "exampleFunction" });
    setState("isLoading", true, { silent: false, source: "exampleFunction" });

    // Using actions
    AppActions.switchTab("chartjs");
    AppActions.loadFile({ records: [] }, "path/to/file.fit");
    UIActions.toggleChartControls();

    // Using selectors
    if (AppSelectors.hasData()) {
        console.log("Data is available");
    }

    if (AppSelectors.isTabActive("chartjs")) {
        console.log("Chart tab is active");
    }

    // Subscribing to changes
    const unsubscribe = subscribe("ui.activeTab", (/** @type {string} */ newTab) => {
        console.log(`Tab changed to: ${newTab}`);
    });

    // Later, clean up the subscription
    setTimeout(() => unsubscribe(), 5000);
}

/**
 * Example of how to modify your existing renderer initialization
 */
export function initializeRendererWithNewStateSystem() {
    console.log("[Renderer] Starting initialization with new state system...");

    // Initialize the complete state system first
    initializeCompleteStateSystem();

    // Set up state-aware event handlers
    setupStateAwareEventHandlers();

    // Initialize components with state awareness
    initializeComponentsWithState();

    // Set up state-based UI updates
    setupReactiveUI();

    console.log("[Renderer] Initialization completed with state system");
}

/**
 * Migration helper for existing renderer.js
 * Replace your existing initialization with this pattern
 */
export function migrateExistingRenderer() {
    // 1. Replace direct global variable assignments with setState
    // OLD: window.globalData = newData;
    // NEW: setState('globalData', newData, { source: 'fileLoad' });

    // 2. Replace direct property access with getState
    // OLD: if (window.globalData) { ... }
    // NEW: if (getState('globalData')) { ... }

    // 3. Replace manual DOM updates with state subscriptions
    // OLD: Directly updating DOM in multiple places
    // NEW: subscribe('ui.activeTab', (tab) => updateTabUI(tab));

    // 4. Use actions instead of direct function calls
    // OLD: switchTab('chart'); showChart();
    // NEW: AppActions.switchTab('chart');

    // 5. Use selectors for computed values
    // OLD: Checking multiple conditions manually
    // NEW: if (AppSelectors.hasData() && AppSelectors.isTabActive('chart')) { ... }

    console.log("[Renderer] Migration patterns documented");
}

/**
 * Handle tab changes with state awareness
 */
/** @param {string} activeTab */
function handleTabChange(activeTab) {
    const canonicalTab = normalizeTabName(activeTab);
    const hasData = AppSelectors.hasData();

    if (!hasData && canonicalTab !== "summary") {
        // If no data is loaded, switch back to summary
        AppActions.switchTab("summary");
        return;
    }

    // Load tab content based on current state
    switch (canonicalTab) {
        case "chart":
        case "chartjs": {
            if (!AppSelectors.areChartsRendered()) {
                loadChartTab();
            }
            break;
        }
        case "map": {
            if (!AppSelectors.isMapRendered()) {
                loadMapTab();
            }
            break;
        }
        case "data":
        case "table": {
            if (!AppSelectors.areTablesRendered()) {
                loadTableTab();
            }
            break;
        }
    }
}

/**
 * Initialize components with state awareness
 */
function initializeComponentsWithState() {
    // Subscribe to data loading events
    subscribe("globalData", (/** @type {any} */ newData) => {
        if (newData) {
            console.log("[Renderer] New data loaded, updating components...");
            updateAllComponents(newData);
        }
    });

    // Subscribe to active tab changes
    subscribe("ui.activeTab", (/** @type {string} */ activeTab) => {
        console.log(`[Renderer] Active tab changed to: ${activeTab}`);
        handleTabChange(activeTab);
    });

    // Subscribe to chart rendering state
    subscribe("charts.isRendered", (/** @type {boolean} */ isRendered) => {
        if (isRendered) {
            console.log("[Renderer] Charts have been rendered");
        }
    });

    // Subscribe to loading state
    subscribe("isLoading", (/** @type {boolean} */ isLoading) => {
        console.log(`[Renderer] Loading state: ${isLoading}`);
        // Update UI loading indicators
    });
}

/**
 * Load chart tab with state awareness
 */
async function loadChartTab() {
    const globalData = getState("globalData");
    if (!globalData) {
        return;
    }

    try {
        setState("isLoading", true, { silent: false, source: "loadChartTab" });

        // Your existing chart rendering logic here
        // Const chartData = await processChartData(globalData);
        // Const chartOptions = getChartOptions();

        // AppActions.renderChart(chartData, chartOptions);

        console.log("[Renderer] Chart tab loaded");
    } catch (error) {
        console.error("[Renderer] Error loading chart tab:", error);
    } finally {
        setState("isLoading", false, { silent: false, source: "loadChartTab" });
    }
}

/**
 * Load map tab with state awareness
 */
async function loadMapTab() {
    const globalData = getState("globalData");
    if (!globalData) {
        return;
    }

    try {
        setState("isLoading", true, { silent: false, source: "loadMapTab" });

        // Your existing map rendering logic here
        // Const mapCenter = calculateMapCenter(globalData);
        // Const mapZoom = getOptimalZoom(globalData);

        // AppActions.renderMap(mapCenter, mapZoom);

        console.log("[Renderer] Map tab loaded");
    } catch (error) {
        console.error("[Renderer] Error loading map tab:", error);
    } finally {
        setState("isLoading", false, { silent: false, source: "loadMapTab" });
    }
}

/**
 * Load table tab with state awareness
 */
async function loadTableTab() {
    const globalData = getState("globalData");
    if (!globalData) {
        return;
    }

    try {
        setState("isLoading", true, { silent: false, source: "loadTableTab" });

        // Your existing table rendering logic here
        // Const tableConfig = {
        //     PageSize: getState('tables.pageSize'),
        //     SortColumn: getState('tables.sortColumn')
        // };

        // AppActions.renderTable(tableConfig);

        console.log("[Renderer] Table tab loaded");
    } catch (error) {
        console.error("[Renderer] Error loading table tab:", error);
    } finally {
        setState("isLoading", false, { silent: false, source: "loadTableTab" });
    }
}

/**
 * Set up reactive UI that responds to state changes
 */
function setupReactiveUI() {
    // Update tab visibility when active tab changes
    subscribe("ui.activeTab", (/** @type {string} */ activeTab) => {
        const canonicalActive = normalizeTabName(activeTab);
        const tabContents = document.querySelectorAll(".tab-content");
        for (const content of tabContents) {
            const tabName = content.dataset.tabContent;
            if (content instanceof HTMLElement) {
                const canonicalContentTab = normalizeTabName(tabName);
                const isActive = canonicalActive && canonicalContentTab
                    ? canonicalContentTab === canonicalActive
                    : tabName === activeTab;
                content.style.display = isActive ? "block" : "none";
                content.setAttribute("aria-hidden", (!isActive).toString());
            }
        }
    });

    // Update theme when it changes
    subscribe("ui.theme", (/** @type {string} */ theme) => {
        if (theme) {
            document.documentElement.dataset.theme = theme;
        }
    });

    // Update chart controls visibility
    subscribe("charts.controlsVisible", (/** @type {boolean} */ isVisible) => {
        const wrapper = document.querySelector("#chartjs-settings-wrapper");
        if (wrapper) {
            wrapper.style.display = isVisible ? "block" : "none";
        }
    });
}

/**
 * Set up event handlers that work with the state system
 */
function setupStateAwareEventHandlers() {
    /**
     * Safely derive the logical tab name from a tab button element.
     * @param {HTMLElement} element
     * @returns {string|null}
     */
    const deriveTabName = (element) => {
        if (!(element instanceof HTMLElement)) {
            return null;
        }

        const dataTab = element.dataset?.tab;
        if (typeof dataTab === "string" && dataTab.trim().length > 0) {
            return dataTab.trim();
        }

        const identifier = typeof element.id === "string" ? element.id.trim() : "";
        if (!identifier) {
            return null;
        }

        const patterns = [/^tab-(.+)$/i, /^(.+?)-tab$/i];
        for (const pattern of patterns) {
            const match = identifier.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    };

    // File open handler (optional in preload API)
    if (globalThis.electronAPI?.onFileOpened) {
        globalThis.electronAPI.onFileOpened((fileData, filePath) => {
            AppActions.loadFile(fileData, filePath);
        });
    }

    // Tab switching (if not handled by UIStateManager)
    document.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) {
            return;
        }
        const tabButton = target.closest(".tab-button");
        if (!(tabButton instanceof HTMLElement)) {
            return;
        }

        const tabName = deriveTabName(tabButton);
        const canonicalTarget = normalizeTabName(tabName);
        if (!canonicalTarget) {
            return;
        }

        const activeCanonical = normalizeTabName(/** @type {string | null | undefined} */(getState("ui.activeTab")));
        if (activeCanonical === canonicalTarget) {
            return;
        }

        AppActions.switchTab(canonicalTarget);
    });

    // Theme switching
    document.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) {
            return;
        }
        // Only match buttons with data-theme attribute, not parent elements like body/html
        const themeButton = target.closest("button[data-theme], .theme-toggle-btn[data-theme]");
        if (themeButton) {
            const { theme } = themeButton.dataset;
            if (theme) {
                AppActions.switchTheme(theme);
            }
        }
    });
}

/**
 * Update all components when new data is loaded
 */
/** @param {any} newData */
function updateAllComponents(newData) {
    // Reset all component render states
    setState("charts.isRendered", false, { silent: true, source: "updateAllComponents" });
    setState("map.isRendered", false, { silent: true, source: "updateAllComponents" });
    setState("tables.isRendered", false, { silent: true, source: "updateAllComponents" });

    // Update summary immediately
    updateSummaryTab(newData);

    // Other tabs will be loaded when switched to
    const activeTab = getState("ui.activeTab");
    if (activeTab !== "summary") {
        handleTabChange(activeTab);
    }
}

/**
 * Update summary tab
 */
/** @param {any} data */
function updateSummaryTab(data) {
    // Your existing summary update logic here
    console.log("[Renderer] Summary updated with new data", data);
}

/**
 * Example integration of the new state system into renderer.js This shows how
 * to modify your existing renderer.js to use the new centralized state
 * management
 */

import { AppActions, AppSelectors } from "../../app/lifecycle/appActions.js";
import { getChartSettingsWrapper } from "../../charts/dom/chartDomUtils.js";
// Corrected path: state manager utilities live in ../core directory
import { subscribe } from "../core/stateManager.js";
import { subscribeToActiveFitRawData } from "../domain/activeFitRawDataState.js";
import { getActiveFitChartData } from "../domain/fitChartDataState.js";
import { getActiveFitRouteData } from "../domain/fitRouteDataState.js";
import { getActiveFitTableData } from "../domain/fitTableDataState.js";
import {
    getRendererActiveTab,
    normalizeRendererActiveTab,
    subscribeToRendererActiveTab,
} from "../domain/rendererActiveTabState.js";
import { subscribeToRendererChartsRendered } from "../domain/rendererChartRenderState.js";
import {
    isRendererLoading,
    setRendererLoading,
    subscribeToRendererLoading,
} from "../domain/rendererLoadingState.js";
import { resetRendererRenderLifecycle } from "../domain/rendererRenderLifecycleState.js";
import {
    getRendererTheme,
    setRendererTheme,
    subscribeToRendererTheme,
} from "../domain/rendererThemeState.js";
import { UIActions } from "../domain/uiStateManager.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
// At the top of renderer.js, add these imports:
import { initializeCompleteStateSystem } from "./stateIntegration.js";
import {
    getRendererStateIntegrationRuntime,
    type RendererStateIntegrationRuntime,
    type RendererStateIntegrationTimer,
} from "./rendererStateIntegrationRuntime.js";
import type { ElectronPreloadEventApi } from "../../../shared/preloadApi.js";

type Unsubscribe = () => void;

type RendererElectronAPI = {
    readonly onFileOpened?: ElectronPreloadEventApi["onFileOpened"];
};

type RendererStateIntegrationOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
};

let stateAwareEventHandlersAbortController: AbortController | undefined;
const rendererStateIntegrationUnsubscribes: Unsubscribe[] = [];

function rendererStateIntegrationRuntime(): RendererStateIntegrationRuntime {
    return getRendererStateIntegrationRuntime();
}

function isRendererElectronAPI(value: unknown): value is RendererElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    if (!("onFileOpened" in value)) {
        return true;
    }

    return typeof value.onFileOpened === "function";
}

function getRendererStateElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): RendererElectronAPI | null {
    return getRendererElectronApi(isRendererElectronAPI, electronApiScope);
}

function invokeUnsubscribe(unsubscribe: Unsubscribe): void {
    try {
        unsubscribe();
    } catch {
        /* Ignore cleanup errors */
    }
}

function cleanupRendererStateIntegrationSubscriptions(): void {
    for (const unsubscribe of rendererStateIntegrationUnsubscribes.splice(0)) {
        invokeUnsubscribe(unsubscribe);
    }
}

function cleanupStateAwareEventHandlers(): void {
    stateAwareEventHandlersAbortController?.abort();
    stateAwareEventHandlersAbortController = undefined;
}

function trackRendererStateSubscription(unsubscribe: Unsubscribe): Unsubscribe {
    rendererStateIntegrationUnsubscribes.push(unsubscribe);
    return unsubscribe;
}

function subscribeRendererState(
    path: string,
    handler: Parameters<typeof subscribe>[1]
): Unsubscribe {
    return trackRendererStateSubscription(subscribe(path, handler));
}

export function cleanupRendererStateIntegration(): void {
    cleanupStateAwareEventHandlers();
    cleanupRendererStateIntegrationSubscriptions();
}

/**
 * Example of how to use the state system in your existing functions
 */
export function exampleStateUsage(): Unsubscribe {
    // Getting state
    const activeTab = getRendererActiveTab(),
        currentTheme = getRendererTheme(),
        isLoading = isRendererLoading();

    console.log("Current state:", { activeTab, currentTheme, isLoading });

    // Setting state
    setRendererTheme("dark", { silent: false, source: "exampleFunction" });
    setRendererLoading(true, {
        silent: false,
        source: "exampleFunction",
    });

    // Using actions
    AppActions.switchTab("chart");
    void AppActions.loadFile({ records: [] }, "path/to/file.fit");
    UIActions.toggleChartControls();

    // Using selectors
    if (AppSelectors.hasData()) {
        console.log("Data is available");
    }

    if (AppSelectors.isTabActive("chart")) {
        console.log("Chart tab is active");
    }

    // Subscribing to changes
    const unsubscribe = subscribeToRendererActiveTab((newTab) => {
        console.log(`Tab changed to: ${normalizeRendererActiveTab(newTab)}`);
    });

    // Later, clean up the subscription
    const cleanupTimeout: RendererStateIntegrationTimer =
        rendererStateIntegrationRuntime().setTimeout(() => unsubscribe(), 5000);

    return () => {
        rendererStateIntegrationRuntime().clearTimeout(cleanupTimeout);
        unsubscribe();
    };
}

/**
 * Example of how to modify your existing renderer initialization
 */
export function initializeRendererWithNewStateSystem({
    electronApiScope,
}: RendererStateIntegrationOptions = {}): void {
    console.log("[Renderer] Starting initialization with new state system...");
    cleanupRendererStateIntegration();

    // Initialize the complete state system first
    initializeCompleteStateSystem();

    // Set up state-aware event handlers
    setupStateAwareEventHandlers({ electronApiScope });

    // Initialize components with state awareness
    initializeComponentsWithState();

    // Set up state-based UI updates
    setupReactiveUI();

    console.log("[Renderer] Initialization completed with state system");
}

/**
 * Migration helper for existing renderer.js Replace your existing
 * initialization with this pattern
 */
export function migrateExistingRenderer(): void {
    // 1. Replace direct global FIT-data assignments with setState
    // OLD: direct renderer-level FIT-data assignment
    // NEW: setState('fitFile.rawData', newData, { source: 'fileLoad' });

    // 2. Replace direct property access with getState
    // OLD: direct renderer-level FIT-data access
    // NEW: if (AppSelectors.hasData()) { ... }

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
function handleTabChange(activeTab: unknown): void {
    const normalizedActiveTab = normalizeRendererActiveTab(activeTab);
    const hasData = AppSelectors.hasData();

    if (!hasData && normalizedActiveTab !== "summary") {
        // If no data is loaded, switch back to summary
        AppActions.switchTab("summary");
        return;
    }

    // Load tab content based on current state
    switch (normalizedActiveTab) {
        case "chart": {
            if (!AppSelectors.areChartsRendered()) {
                void loadChartTab();
            }
            break;
        }
        case "data": {
            if (!AppSelectors.areTablesRendered()) {
                void loadTableTab();
            }
            break;
        }
        case "map": {
            if (!AppSelectors.isMapRendered()) {
                void loadMapTab();
            }
            break;
        }
    }
}

/**
 * Initialize components with state awareness
 */
function initializeComponentsWithState(): void {
    // Subscribe to data loading events
    trackRendererStateSubscription(
        subscribeToActiveFitRawData((newData) => {
            if (newData) {
                console.log(
                    "[Renderer] New data loaded, updating components..."
                );
                updateAllComponents(newData);
            }
        })
    );

    // Subscribe to active tab changes
    trackRendererStateSubscription(
        subscribeToRendererActiveTab((activeTab) => {
            const normalizedActiveTab = normalizeRendererActiveTab(activeTab);

            console.log(
                `[Renderer] Active tab changed to: ${normalizedActiveTab}`
            );
            handleTabChange(normalizedActiveTab);
        })
    );

    // Subscribe to chart rendering state
    trackRendererStateSubscription(
        subscribeToRendererChartsRendered((isRendered) => {
            if (!isRendered) {
                return;
            }

            console.log("[Renderer] Charts have been rendered");
        })
    );

    // Subscribe to loading state
    trackRendererStateSubscription(
        subscribeToRendererLoading((isLoading) => {
            console.log(`[Renderer] Loading state: ${isLoading}`);
            // Update UI loading indicators
        })
    );
}

/**
 * Load chart tab with state awareness
 */
async function loadChartTab(): Promise<void> {
    const chartData = getActiveFitChartData();
    if (!chartData.rawData) {
        return;
    }

    try {
        setRendererLoading(true, { silent: false, source: "loadChartTab" });

        // Your existing chart rendering logic here
        // Const chartData = await processChartData(rawFitData);
        // Const chartOptions = getChartOptions();

        // AppActions.renderChart(chartData, chartOptions);

        console.log("[Renderer] Chart tab loaded");
    } catch (error) {
        console.error("[Renderer] Error loading chart tab:", error);
    } finally {
        setRendererLoading(false, { silent: false, source: "loadChartTab" });
    }
}

/**
 * Load map tab with state awareness
 */
async function loadMapTab(): Promise<void> {
    const routeData = getActiveFitRouteData();
    if (!routeData.rawData) {
        return;
    }

    try {
        setRendererLoading(true, { silent: false, source: "loadMapTab" });

        // Your existing map rendering logic here
        // Const mapCenter = calculateMapCenter(rawFitData);
        // Const mapZoom = getOptimalZoom(rawFitData);

        // AppActions.renderMap(mapCenter, mapZoom);

        console.log("[Renderer] Map tab loaded");
    } catch (error) {
        console.error("[Renderer] Error loading map tab:", error);
    } finally {
        setRendererLoading(false, { silent: false, source: "loadMapTab" });
    }
}

/**
 * Load table tab with state awareness
 */
async function loadTableTab(): Promise<void> {
    const tableData = getActiveFitTableData();
    if (!tableData.rawData) {
        return;
    }

    try {
        setRendererLoading(true, { silent: false, source: "loadTableTab" });

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
        setRendererLoading(false, { silent: false, source: "loadTableTab" });
    }
}

/**
 * Set up reactive UI that responds to state changes
 */
function setupReactiveUI(): void {
    const documentRef = rendererStateIntegrationRuntime().getDocument();

    // Update tab visibility when active tab changes
    trackRendererStateSubscription(
        subscribeToRendererActiveTab((activeTab) => {
            const normalizedActiveTab = normalizeRendererActiveTab(activeTab);

            const tabContents = documentRef.querySelectorAll(".tab-content");
            for (const content of tabContents) {
                if (rendererStateIntegrationRuntime().isHTMLElement(content)) {
                    const tabName = content.dataset["tabContent"];
                    content.style.display =
                        tabName === normalizedActiveTab ? "block" : "none";
                }
            }
        })
    );

    // Update theme when it changes
    trackRendererStateSubscription(
        subscribeToRendererTheme((theme) => {
            if (typeof theme === "string" && theme) {
                documentRef.documentElement.dataset["theme"] = theme;
            }
        })
    );

    // Update chart controls visibility
    subscribeRendererState("charts.controlsVisible", (isVisible) => {
        const wrapper = getChartSettingsWrapper(documentRef);
        if (wrapper) {
            wrapper.style.display = isVisible ? "block" : "none";
        }
    });
}

/**
 * Set up event handlers that work with the state system
 */
function setupStateAwareEventHandlers({
    electronApiScope,
}: RendererStateIntegrationOptions): void {
    const electronAPI = getRendererStateElectronAPI(electronApiScope);

    // File open handler (optional in preload API)
    if (electronAPI?.onFileOpened) {
        electronAPI.onFileOpened((fileData, filePath) => {
            void AppActions.loadFile(fileData, filePath);
        });
    }

    cleanupStateAwareEventHandlers();
    stateAwareEventHandlersAbortController =
        rendererStateIntegrationRuntime().createAbortController();
    const { signal } = stateAwareEventHandlersAbortController;

    // Tab switching (if not handled by UIStateManager)
    rendererStateIntegrationRuntime().addDocumentClickListener(
        (event) => {
            const target = rendererStateIntegrationRuntime().isElement(
                event.target
            )
                ? event.target
                : null;
            if (!target) {
                return;
            }
            const tabButton = target.closest("[data-tab]");
            if (rendererStateIntegrationRuntime().isHTMLElement(tabButton)) {
                const tabName = tabButton.dataset["tab"];
                if (tabName) {
                    AppActions.switchTab(tabName);
                }
            }
        },
        { signal }
    );

    // Theme switching
    rendererStateIntegrationRuntime().addDocumentClickListener(
        (event) => {
            const target = rendererStateIntegrationRuntime().isElement(
                event.target
            )
                ? event.target
                : null;
            if (!target) {
                return;
            }
            const themeButton = target.closest("[data-theme]");
            if (rendererStateIntegrationRuntime().isHTMLElement(themeButton)) {
                const theme = themeButton.dataset["theme"];
                if (theme) {
                    AppActions.switchTheme(theme);
                }
            }
        },
        { signal }
    );
}

/**
 * Update all components when new data is loaded
 */
function updateAllComponents(newData: unknown): void {
    // Reset all component render states
    resetRendererRenderLifecycle({
        silent: true,
        source: "updateAllComponents",
    });

    // Update summary immediately
    updateSummaryTab(newData);

    // Other tabs will be loaded when switched to
    const activeTab = getRendererActiveTab();
    if (activeTab !== "summary") {
        handleTabChange(activeTab);
    }
}

/**
 * Update summary tab
 */
function updateSummaryTab(data: unknown): void {
    // Your existing summary update logic here
    console.log("[Renderer] Summary updated with new data", data);
}

// Export for use in renderer.js
export default initializeRendererWithNewStateSystem;

export const tabStateManager: TabStateManager;
export default tabStateManager;
export type TabDef = {
    id: string;
    contentId: string;
    label: string;
    requiresData: boolean;
    handler: string | null;
};
/**
 * Tab State Manager - handles tab switching and content management
 */
declare class TabStateManager {
    isInitialized: boolean;
    previousTab: null;
    /** @type {Array<() => void>} */
    _unsubscribes: Array<() => void>;
    /** @type {(event: Event) => void} */
    _buttonClickHandler: (event: Event) => void;
    /** @type {(() => void) | null} */
    _setupHandlersFn: (() => void) | null;
    /**
     * Cleanup resources (placeholder for future unsubscribe logic)
     */
    cleanup(): void;
    /**
     * Extract tab name from button ID
     * @param {string} buttonId - Button element ID
     * @returns {string|null} Tab name or null
     */
    extractTabName(buttonId: string): string | null;
    /**
     * Get current active tab information
     * @returns {Object} Active tab information
     */
    getActiveTabInfo(): Object;
    /**
     * Handle alternative FIT viewer tab activation
     */
    handleAltFitTab(): void;
    /**
     * Handle chart tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    handleChartTab(
        globalData:
            | {
                  recordMesgs?: any[];
              }
            | null
            | undefined
    ): Promise<void>;
    /**
     * Handle data tables tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    handleDataTab(
        globalData:
            | {
                  recordMesgs?: any[];
              }
            | null
            | undefined
    ): Promise<void>;
    /**
     * Handle map tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    handleMapTab(
        globalData:
            | {
                  recordMesgs?: any[];
              }
            | null
            | undefined
    ): Promise<void>;
    /**
     * Handle summary tab activation
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    handleSummaryTab(
        globalData:
            | {
                  recordMesgs?: any[];
              }
            | null
            | undefined
    ): Promise<void>;
    /**
     * Handle tab button click events
     * @param {Event} event - Click event
     */
    handleTabButtonClick: (event: Event) => void;
    /**
     * Handle tab change through state management
     * @param {string} newTab - New active tab name
     * @param {string} oldTab - Previous active tab name
     */
    handleTabChange(newTab: string, oldTab: string): void;
    /**
     * Handle tab-specific initialization and rendering logic
     * @param {string} tabName - Name of the active tab
     */
    handleTabSpecificLogic(tabName: string): Promise<void>;
    /**
     * Generate simple hash for data comparison
     * @param {Object} data - Data to hash
     * @returns {string} Simple hash string
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} data */
    hashData(
        data:
            | {
                  recordMesgs?: any[];
              }
            | null
            | undefined
    ): string;
    /**
     * Initialize state subscriptions for reactive tab management
     */
    initializeSubscriptions(): void;
    /**
     * Set up click handlers for all tab buttons
     */
    setupTabButtonHandlers(): void;
    /**
     * Manually switch to a specific tab
     * @param {string} tabName - Name of tab to switch to
     */
    switchToTab(tabName: string): boolean;
    /**
     * Update content area visibility
     * @param {string} activeTab - Currently active tab name
     */
    updateContentVisibility(activeTab: string): void;
    /**
     * Update tab availability based on data availability
     * @param {Object} globalData - Current global data
     */
    /** @param {{recordMesgs?: any[]}|null|undefined} globalData */
    updateTabAvailability(
        globalData:
            | {
                  recordMesgs?: any[];
              }
            | null
            | undefined
    ): void;
    /**
     * Update tab button visual states
     * @param {string} activeTab - Currently active tab name
     */
    updateTabButtonStates(activeTab: string): void;
}
/**
 * Tab configuration defining available tabs and their handlers
 */
/**
 * @typedef {{id:string; contentId:string; label:string; requiresData:boolean; handler:string|null}} TabDef
 */
export const TAB_CONFIG: Record<string, TabDef>;

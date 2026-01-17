/**
 * UI State Manager - handles common UI state operations
 */
export class UIStateManager {
    eventListeners: Map<any, any>;
    /**
     * Apply theme to the UI
     * @param {string} theme - Theme to apply ('light', 'dark', 'system')
     */
    applyTheme(theme: string): void;
    systemThemeListener: ((e: any) => void) | null | undefined;
    /**
     * Cleanup event listeners
     */
    cleanup(): void;
    /**
     * Initialize UI state management
     */
    initialize(): void;
    /**
     * Initialize reactive UI elements that respond to state changes
     */
    initializeReactiveElements(): void;
    /**
     * Set up DOM event listeners that sync with state
     */
    setupEventListeners(): void;
    /**
     * Show a notification to the user
     * @param {*} notification - Notification options or message string
     */
    showNotification(notification: any): void;
    /**
     * Show/hide sidebar
     * @param {*} collapsed - Whether sidebar should be collapsed
     */
    toggleSidebar(collapsed: any): void;
    /**
     * Update chart controls UI
     * @param {boolean} isVisible - Whether controls are visible
     */
    updateChartControlsUI(isVisible: boolean): void;
    /**
     * Update drop overlay visibility and related iframe pointer state
     * @param {boolean} isVisible - Whether the drop overlay should be shown
     */
    updateDropOverlayVisibility(isVisible: boolean): void;
    /**
     * Update active file display elements based on state
     * @param {{displayName?: string, hasFile?: boolean, title?: string}|null} fileInfo - File info state
     */
    updateFileDisplayUI(
        fileInfo: {
            displayName?: string;
            hasFile?: boolean;
            title?: string;
        } | null
    ): void;
    /**
     * Update loading indicator visibility
     * @param {boolean} isLoading - Whether the app is loading
     */
    updateLoadingIndicator(isLoading: boolean): void;
    /**
     * Update loading progress UI based on indicator state
     * @param {{progress?: number, active?: boolean}|null} indicator - Loading indicator state
     */
    updateLoadingProgressUI(
        indicator: {
            progress?: number;
            active?: boolean;
        } | null
    ): void;
    /**
     * Update measurement mode UI
     * @param {*} isActive - Whether measurement mode is active
     */
    updateMeasurementModeUI(isActive: any): void;
    /**
     * Update tab button states
     * @param {string} activeTab - The currently active tab
     */
    updateTabButtons(activeTab: string): void;
    /**
     * Update tab visibility based on active tab
     * @param {string} activeTab - The currently active tab
     */
    updateTabVisibility(activeTab: string): void;
    /**
     * Update unload button visibility
     * @param {boolean} isVisible - Whether unload button should be visible
     */
    updateUnloadButtonVisibility(isVisible: boolean): void;
    /**
     * Update window state from DOM
     */
    updateWindowStateFromDOM(): void;
}
/**
 * Global UI state manager instance
 */
export const uiStateManager: UIStateManager;
export namespace UIActions {
    /**
     * Set theme
     * @param {string} theme - Theme to set
     */
    function setTheme(theme: string): void;
    /**
     * Show a tab
     * @param {string} tabName - Tab to show
     */
    function showTab(tabName: string): void;
    /**
     * Toggle chart controls
     */
    function toggleChartControls(): void;
    /**
     * Toggle measurement mode
     */
    function toggleMeasurementMode(): void;
    /**
     * Toggle sidebar
     * @param {boolean} collapsed - Whether to collapse
     */
    function toggleSidebar(collapsed: boolean): void;
    /**
     * Update window state
     */
    function updateWindowState(): void;
}

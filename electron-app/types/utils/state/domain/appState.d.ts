/**
 * High-level convenience functions following your established patterns
 */
/**
 * Add error to state
 * @param {Error|string} error - Error to add
 * @param {string} context - Error context
 */
export function addError(error: Error | string, context?: string): void;
/**
 * Clear current errors
 */
export function clearErrors(): void;
/**
 * Clear global data
 */
export function clearGlobalData(): void;
/**
 * Get current state value
 * @param {string} path - State path
 * @returns {*} State value
 */
export function getState(path: string): any;
/**
 * Set active tab
 * @param {string} tabId - Active tab identifier
 */
export function setActiveTab(tabId: string): void;
/**
 * Set chart controls visibility
 * @param {boolean} visible - Whether controls are visible
 */
export function setChartControlsVisible(visible: boolean): void;
/**
 * Set file opening state
 * @param {boolean} isOpening - Whether file is currently opening
 * @param {string|null} [filePath] - Path to file being opened
 */
export function setFileOpeningState(isOpening: boolean, filePath?: string | null): void;
/**
 * Set global data (maintains backward compatibility)
 * @param {Object} data - FIT file data
 */
export function setGlobalData(data: Object): void;
/**
 * Set state value
 * @param {string} path - State path
 * @param {*} value - New value
 */
export function setState(path: string, value: any): boolean;
/**
 * Set theme
 * @param {string} theme - Theme name
 */
export function setTheme(theme: string): void;
/**
 * Subscribe to state changes with cleanup
 * @param {string} event - Event name or state path
 * @param {Function} callback - Event handler
 * @returns {Function} Cleanup function
 */
export function subscribe(event: string, callback: Function): Function;
export namespace STATE_EVENTS {
    let CHART_CONTROLS_TOGGLED: string;
    let CHART_RENDERED: string;
    let DATA_CHANGED: string;
    let DATA_CLEARED: string;
    let DATA_LOADED: string;
    let ERROR_OCCURRED: string;
    let FILE_CLOSED: string;
    let FILE_OPENED: string;
    let FILE_OPENING: string;
    let RENDER_COMPLETED: string;
    let RENDER_STARTED: string;
    let TAB_CHANGED: string;
    let THEME_CHANGED: string;
    let WARNING_OCCURRED: string;
}
export default appState;
export type StateUpdateEvent = {
    /**
     * - The state path that changed
     */
    path: string;
    /**
     * - The new value
     */
    newValue: any;
    /**
     * - The previous value
     */
    oldValue: any;
    /**
     * - When the change occurred
     */
    timestamp: number;
};
export type StateValue = {
    /**
     * - Global data state
     */
    data?: any;
    /**
     * - File state information
     */
    file?: any;
    /**
     * - UI state information
     */
    ui?: any;
    /**
     * - Chart state information
     */
    charts?: any;
    /**
     * - Performance metrics
     */
    performance?: any;
    /**
     * - Error state information
     */
    errors?: any;
};
export type StateValidator = (arg0: any, arg1: any) => boolean;
export const appState: AppStateManager;
/**
 * Central application state with reactive properties
 */
declare class AppStateManager {
    state: {
        charts: {
            controlsVisible: boolean;
            instances: Map<any, any>;
            isRendered: boolean;
            lastRenderTime: null;
            visibleFields: Set<any>;
        };
        data: {
            globalData: null;
            isLoaded: boolean;
            lastModified: null;
            recordCount: number;
        };
        errors: {
            current: never[];
            history: never[];
            lastError: null;
        };
        file: {
            isOpening: boolean;
            lastOpened: null;
            name: null;
            path: null;
            size: number;
        };
        performance: {
            enableMonitoring: boolean;
            metrics: Map<any, any>;
            renderTimes: never[];
            startTime: number;
        };
        ui: {
            activeTab: string;
            isInitialized: boolean;
            theme: string;
            windowSize: {
                height: number;
                width: number;
            };
        };
    };
    listeners: Map<any, any>;
    validators: Map<any, any>;
    /**
     * Add state validator
     * @param {string} path - State path to validate
     * @param {Function} validator - Validation function
     */
    addValidator(path: string, validator: Function): void;
    /**
     * Emit event to all listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event: string, data: any): void;
    /**
     * Emits specific events based on state path changes
     * @param {string} path - State path that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Previous value
     */
    emitSpecificEvents(path: string, newValue: any, oldValue: any): void;
    /**
     * Get state value by path
     * @param {string} path - Dot notation path (e.g., "data.globalData")
     * @returns {*} State value
     */
    get(path: string): any;
    /**
     * Get debug information about current state
     * @returns {Object} Debug information
     */
    getDebugInfo(): Object;
    /**
     * Get current state snapshot
     * @returns {Object} Deep copy of current state
     */
    getSnapshot(): Object;
    /**
     * Load persisted state from localStorage
     */
    loadPersistedState(): void;
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event: string, callback: Function): void;
    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Cleanup function
     */
    on(event: string, callback: Function): Function;
    /**
     * Save specific state path to localStorage
     * @param {string} path - State path to persist
     */
    persistState(path: string): void;
    /**
     * Clear all state and reset to defaults
     */
    reset(): void;
    /**
     * Set state value by path
     * @param {string} path - Dot notation path
     * @param {*} value - New value
     * @returns {boolean} Success status
     */
    set(path: string, value: any): boolean;
    /**
     * Setup automatic persistence for persistent keys
     */
    setupAutoPersistence(): void;
    /**
     * Sets up reactive properties with getters/setters that trigger events
     */
    setupReactiveProperties(): void;
    /**
     * Update multiple state values atomically
     * @param {Object} updates - Object with path:value pairs
     */
    update(updates: Object): void;
}
//# sourceMappingURL=appState.d.ts.map
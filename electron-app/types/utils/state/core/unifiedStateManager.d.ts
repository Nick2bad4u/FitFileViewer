/**
 * Initialize unified state management with validation
 * @param {Object} [options={}] - Initialization options
 * @param {boolean} [options.enableDebug=false] - Enable debug mode
 * @param {boolean} [options.enableSync=true] - Enable legacy sync
 */
export function initializeUnifiedState(options?: {
    enableDebug?: boolean | undefined;
    enableSync?: boolean | undefined;
}): UnifiedStateManager;
/**
 * Unified State Manager - Single interface for all state systems
 * Provides consistency during migration from legacy to new state management
 */
export class UnifiedStateManager {
    legacyWarningsShown: Set<any>;
    syncEnabled: boolean;
    debugMode: boolean;
    /**
     * Disable debug mode
     */
    disableDebugMode(): void;
    /**
     * Enable debug mode for state management
     */
    enableDebugMode(): void;
    /**
     * Get state value with unified interface
     * @param {string} path - State path (dot notation)
     * @param {*} [defaultValue] - Default value if not found
     * @returns {*} State value
     */
    get(path: string, defaultValue?: any): any;
    /**
     * Get legacy state with fallback handling
     * @private
     * @param {string} path - State path
     * @param {*} defaultValue - Default value
     * @returns {*} State value
     */
    private getLegacyState;
    /**
     * Get current state snapshot for debugging
     * @returns {Object} State snapshot
     */
    getSnapshot(): Object;
    /**
     * Check if a path belongs to legacy state system
     * @param {string} path - State path to check
     * @returns {boolean} True if legacy path
     */
    isLegacyPath(path: string): boolean;
    /**
     * Set state value with unified interface
     * @param {string} path - State path (dot notation)
     * @param {*} value - Value to set
     * @param {UnifiedStateOptions} [options={}] - Set options
     */
    set(path: string, value: any, options?: UnifiedStateOptions): void;
    /**
     * Set legacy state with fallback handling
     * @private
     * @param {string} path - State path
     * @param {*} value - Value to set
     * @param {UnifiedStateOptions} _options - Set options (currently unused)
     */
    private setLegacyState;
    /**
     * Enable or disable legacy system synchronization
     * @param {boolean} enabled - Whether to enable sync
     */
    setSyncEnabled(enabled: boolean): void;
    /**
     * Subscribe to state changes with unified interface
     * @param {string} path - State path to watch (* for all)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(path: string, callback: Function): Function;
    /**
     * Validate state consistency across systems
     * @returns {Object} Validation results
     */
    validateConsistency(): Object;
}
export const unifiedState: UnifiedStateManager;
/**
 * Get state value with unified interface
 * @param {string} path - State path (dot notation)
 * @param {*} [defaultValue] - Default value if not found
 * @returns {*} State value
 */
export function get(path: string, defaultValue?: any): any;
/**
 * Set state value with unified interface
 * @param {string} path - State path (dot notation)
 * @param {*} value - Value to set
 * @param {UnifiedStateOptions} [options={}] - Set options
 */
export function set(path: string, value: any, options?: UnifiedStateOptions): void;
/**
 * Subscribe to state changes with unified interface
 * @param {string} path - State path to watch (* for all)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribe(path: string, callback: Function): Function;
export default unifiedState;
export type StateSystemRouter = {
    /**
     * - Check if path belongs to legacy system
     */
    isLegacyPath: (path: string) => boolean;
    /**
     * - Get state from legacy system
     */
    getLegacyState: (path: string) => any;
    /**
     * - Set state in legacy system
     */
    setLegacyState: (path: string, value: any) => void;
};
export type UnifiedStateOptions = {
    /**
     * - Whether to sync with legacy systems
     */
    syncLegacy?: boolean;
    /**
     * - Source identifier for changes
     */
    source?: string;
    /**
     * - Whether to suppress change notifications
     */
    silent?: boolean;
};

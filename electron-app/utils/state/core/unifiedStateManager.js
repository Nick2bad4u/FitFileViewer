/**
 * Provides a consistent interface across all state management systems during
 * migration
 *
 * @version 1.0.0
 *
 * @file Unified State Management Facade
 *
 * @author FitFileViewer Development Team
 */

import {
    getState as getNewState,
    setState as setNewState,
    subscribe as subscribeNew,
} from "./stateManager.js";

/**
 * @typedef {Object} StateSystemRouter
 *
 * @property {(path: string) => boolean} isLegacyPath - Check if path belongs to
 *   legacy system
 * @property {(path: string) => any} getLegacyState - Get state from legacy
 *   system
 * @property {(path: string, value: any) => void} setLegacyState - Set state in
 *   legacy system
 */

/**
 * @typedef {Object} UnifiedStateOptions
 *
 * @property {boolean} [syncLegacy=true] - Whether to sync with legacy systems.
 *   Default is `true`
 * @property {string} [source="unified"] - Source identifier for changes.
 *   Default is `"unified"`
 * @property {boolean} [silent=false] - Whether to suppress change
 *   notifications. Default is `false`
 */

/**
 * Legacy state paths that should be routed to old systems
 */
const LEGACY_PATHS = new Set([
    "autoUpdaterInitialized",
    "globalData",
    "loadedFitFilePath",
    "mainWindow",
]);

/**
 * Unified State Manager - Single interface for all state systems Provides
 * consistency during migration from legacy to new state management
 */
export class UnifiedStateManager {
    constructor() {
        this.legacyWarningsShown = new Set();
        this.syncEnabled = true;
        this.debugMode = false;
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.debugMode = false;
    }

    /**
     * Enable debug mode for state management
     */
    enableDebugMode() {
        this.debugMode = true;
        console.log("[UnifiedState] Debug mode enabled");
    }

    /**
     * Get state value with unified interface
     *
     * @param {string} path - State path (dot notation)
     * @param {any} [defaultValue] - Default value if not found
     *
     * @returns {any} State value
     */
    get(path, defaultValue) {
        try {
            if (this.isLegacyPath(path)) {
                return this.getLegacyState(path, defaultValue);
            }
            return getNewState(path) ?? defaultValue;
        } catch (error) {
            if (this.debugMode) {
                console.warn(
                    `[UnifiedState] Failed to get state for path "${path}":`,
                    error
                );
            }
            return defaultValue;
        }
    }

    /**
     * Get legacy state with fallback handling
     *
     * @private
     *
     * @param {string} path - State path
     * @param {any} defaultValue - Default value
     *
     * @returns {any} State value
     */
    getLegacyState(path, defaultValue) {
        // Show deprecation warning once per path
        if (!this.legacyWarningsShown.has(path)) {
            console.warn(
                `[UnifiedState] Accessing legacy state path "${path}". Consider migrating to new state system.`
            );
            this.legacyWarningsShown.add(path);
        }

        // Try to get from global scope or fallback mechanisms
        if (globalThis.globalData !== undefined && path === "globalData") {
            return globalThis.globalData;
        }

        // Try window object for browser context
        if (
            globalThis.window !== undefined &&
            globalThis.window.globalData &&
            path === "globalData"
        ) {
            return globalThis.window.globalData;
        }

        return defaultValue;
    }

    /**
     * Get current state snapshot for debugging
     *
     * @returns {Object} State snapshot
     */
    getSnapshot() {
        return {
            debugMode: this.debugMode,
            legacyPaths: Array.from(LEGACY_PATHS),
            newState: getNewState(""),
            syncEnabled: this.syncEnabled,
            timestamp: Date.now(),
        };
    }

    /**
     * Check if a path belongs to legacy state system
     *
     * @param {string} path - State path to check
     *
     * @returns {boolean} True if legacy path
     */
    isLegacyPath(path) {
        const [rootPath] = path.split(".");
        return LEGACY_PATHS.has(rootPath);
    }

    /**
     * Set state value with unified interface
     *
     * @param {string} path - State path (dot notation)
     * @param {any} value - Value to set
     * @param {UnifiedStateOptions} [options={}] - Set options. Default is `{}`
     */
    set(path, value, options = {}) {
        const opts = {
            silent: false,
            source: "unified",
            syncLegacy: true,
            ...options,
        };

        try {
            if (this.isLegacyPath(path)) {
                this.setLegacyState(path, value, opts);
                // Also sync to new system if enabled
                if (opts.syncLegacy && this.syncEnabled) {
                    setNewState(path, value, {
                        source: `${opts.source}-legacy-sync`,
                        silent: opts.silent,
                    });
                }
            } else {
                setNewState(path, value, {
                    source: opts.source,
                    silent: opts.silent,
                });
            }

            if (this.debugMode) {
                console.log(`[UnifiedState] Set "${path}" =`, value, opts);
            }
        } catch (error) {
            console.error(
                `[UnifiedState] Failed to set state for path "${path}":`,
                error
            );
            throw error;
        }
    }

    /**
     * Set legacy state with fallback handling
     *
     * @private
     *
     * @param {string} path - State path
     * @param {any} value - Value to set
     * @param {UnifiedStateOptions} _options - Set options (currently unused)
     */
    setLegacyState(path, value, _options) {
        // Show deprecation warning once per path
        if (!this.legacyWarningsShown.has(path)) {
            console.warn(
                `[UnifiedState] Setting legacy state path "${path}". Consider migrating to new state system.`
            );
            this.legacyWarningsShown.add(path);
        }

        // Set in global scope
        if (path === "globalData") {
            if (typeof globalThis !== "undefined") {
                globalThis.globalData = value;
            }
            if (globalThis.window !== undefined) {
                globalThis.window.globalData = value;
            }
        }
    }

    /**
     * Enable or disable legacy system synchronization
     *
     * @param {boolean} enabled - Whether to enable sync
     */
    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
        if (this.debugMode) {
            console.log(
                `[UnifiedState] Legacy sync ${enabled ? "enabled" : "disabled"}`
            );
        }
    }

    /**
     * Subscribe to state changes with unified interface
     *
     * @param {string} path - State path to watch (* for all)
     * @param {Function} callback - Callback function
     *
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (this.isLegacyPath(path)) {
            console.warn(
                `[UnifiedState] Legacy path "${path}" subscriptions not fully supported`
            );
            return () => {}; // Return no-op unsubscriber
        }

        return subscribeNew(path, callback);
    }

    /**
     * Validate state consistency across systems
     *
     * @returns {Object} Validation results
     */
    validateConsistency() {
        const issues = [];
        const warnings = [];

        // Check for path conflicts
        for (const legacyPath of LEGACY_PATHS) {
            try {
                const legacyValue = this.getLegacyState(legacyPath);
                const newValue = getNewState(legacyPath);

                if (
                    legacyValue !== undefined &&
                    newValue !== undefined &&
                    legacyValue !== newValue
                ) {
                    issues.push({
                        legacyValue,
                        newValue,
                        path: legacyPath,
                        type: "value_mismatch",
                    });
                }
            } catch (error) {
                warnings.push({
                    error: error.message,
                    path: legacyPath,
                    type: "access_error",
                });
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            timestamp: Date.now(),
            warnings,
        };
    }
}

// Create singleton instance
export const unifiedState = new UnifiedStateManager();

// Convenience exports for common operations
export const { get, set, subscribe } = unifiedState;

/**
 * Initialize unified state management with validation
 *
 * @param {Object} [options={}] - Initialization options. Default is `{}`
 * @param {boolean} [options.enableDebug=false] - Enable debug mode. Default is
 *   `false`
 * @param {boolean} [options.enableSync=true] - Enable legacy sync. Default is
 *   `true`
 */
export function initializeUnifiedState(options = {}) {
    const { enableDebug = false, enableSync = true } = options;

    if (enableDebug) {
        unifiedState.enableDebugMode();
    }

    unifiedState.setSyncEnabled(enableSync);

    // Validate initial consistency
    const validation = unifiedState.validateConsistency();
    if (!validation.isValid) {
        console.warn(
            "[UnifiedState] State consistency issues detected:",
            validation.issues
        );
    }

    if (validation.warnings.length > 0) {
        console.warn(
            "[UnifiedState] State access warnings:",
            validation.warnings
        );
    }

    console.log("[UnifiedState] Unified state management initialized");
    return unifiedState;
}

export default unifiedState;

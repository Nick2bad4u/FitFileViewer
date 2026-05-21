import {
    getState as getNewState,
    setState as setNewState,
    subscribe as subscribeNew,
} from "./stateManager.js";
const LEGACY_PATHS = new Set([
    "autoUpdaterInitialized",
    "globalData",
    "loadedFitFilePath",
    "mainWindow",
]);
/**
 * Single interface for routing state access during the legacy-to-modern state
 * migration.
 */
export class UnifiedStateManager {
    debugMode = false;
    legacyWarningsShown = new Set();
    syncEnabled = true;
    /** Disables verbose state-routing diagnostics. */
    disableDebugMode() {
        this.debugMode = false;
    }
    /** Enables verbose state-routing diagnostics. */
    enableDebugMode() {
        this.debugMode = true;
        console.log("[UnifiedState] Debug mode enabled");
    }
    /** Gets a state value through the unified routing facade. */
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
    /** Gets a snapshot of the current unified state manager routing state. */
    getSnapshot() {
        return {
            debugMode: this.debugMode,
            legacyPaths: Array.from(LEGACY_PATHS),
            newState: getNewState(""),
            syncEnabled: this.syncEnabled,
            timestamp: Date.now(),
        };
    }
    /** Returns whether a path is still routed through a legacy state boundary. */
    isLegacyPath(path) {
        const [rootPath] = path.split(".");
        return typeof rootPath === "string" && LEGACY_PATHS.has(rootPath);
    }
    /**
     * Sets a state value through the unified routing facade.
     *
     * @throws Error when the underlying modern state update fails.
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
                this.setLegacyState(path, value);
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
    /** Enables or disables syncing writes from legacy paths into modern state. */
    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
        if (this.debugMode) {
            console.log(
                `[UnifiedState] Legacy sync ${enabled ? "enabled" : "disabled"}`
            );
        }
    }
    /**
     * Subscribes to modern state changes while guarding unsupported legacy
     * subscriptions.
     */
    subscribe(path, callback) {
        if (this.isLegacyPath(path)) {
            console.warn(
                `[UnifiedState] Legacy path "${path}" subscriptions not fully supported`
            );
            return () => {
                // Legacy subscriptions are intentionally unsupported.
            };
        }
        return subscribeNew(path, callback);
    }
    /** Checks for value mismatches between legacy and modern state boundaries. */
    validateConsistency() {
        const issues = [];
        const warnings = [];
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
                    error:
                        error instanceof Error ? error.message : String(error),
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
    getLegacyState(path, defaultValue) {
        this.warnLegacyPathOnce(path, "Accessing");
        const stateGlobal = getUnifiedStateGlobal();
        if (stateGlobal.globalData !== undefined && path === "globalData") {
            return stateGlobal.globalData;
        }
        const stateWindow = getUnifiedStateWindow(stateGlobal);
        if (stateWindow?.globalData !== undefined && path === "globalData") {
            return stateWindow.globalData;
        }
        return defaultValue;
    }
    setLegacyState(path, value) {
        this.warnLegacyPathOnce(path, "Setting");
        if (path === "globalData") {
            const stateGlobal = getUnifiedStateGlobal();
            stateGlobal.globalData = value;
            const stateWindow = getUnifiedStateWindow(stateGlobal);
            if (stateWindow) {
                stateWindow.globalData = value;
            }
        }
    }
    warnLegacyPathOnce(path, action) {
        if (this.legacyWarningsShown.has(path)) {
            return;
        }
        console.warn(
            `[UnifiedState] ${action} legacy state path "${path}". Consider migrating to new state system.`
        );
        this.legacyWarningsShown.add(path);
    }
}
function getUnifiedStateGlobal() {
    return globalThis;
}
function getUnifiedStateWindow(stateGlobal) {
    return typeof stateGlobal.window === "undefined"
        ? undefined
        : stateGlobal.window;
}
/** Singleton unified state manager used during the state migration. */
export const unifiedState = new UnifiedStateManager();
/** Gets a state value through the singleton unified state manager. */
export function get(path, defaultValue) {
    return unifiedState.get(path, defaultValue);
}
/** Sets a state value through the singleton unified state manager. */
export function set(path, value, options = {}) {
    unifiedState.set(path, value, options);
}
/** Subscribes to state changes through the singleton unified state manager. */
export function subscribe(path, callback) {
    return unifiedState.subscribe(path, callback);
}
/**
 * Initializes unified state management and reports any initial consistency
 * issues.
 */
export function initializeUnifiedState(options = {}) {
    const { enableDebug = false, enableSync = true } = options;
    if (enableDebug) {
        unifiedState.enableDebugMode();
    }
    unifiedState.setSyncEnabled(enableSync);
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

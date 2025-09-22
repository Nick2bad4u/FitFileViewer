/**
 * State Performance Monitor and Debug Utilities
 * Provides debugging tools, performance monitoring, and development utilities for the state system
 */

import { getState, getStateHistory, subscribe } from "../state/core/stateManager.js";

/**
 * @typedef {Object} SlowOperationRecord
 * @property {string} operation
 * @property {number} duration
 * @property {number} timestamp
 * @property {string|undefined} stack
 */
/**
 * @typedef {Object} MemoryUsageRecord
 * @property {number} timestamp
 * @property {number} usedJSHeapSize
 * @property {number} totalJSHeapSize
 * @property {number} jsHeapSizeLimit
 */
/**
 * @typedef {Object} ErrorRecord
 * @property {string} error
 * @property {string|undefined} stack
 * @property {string} context
 * @property {number} timestamp
 */
/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} stateChanges
 * @property {number} subscriptions
 * @property {SlowOperationRecord[]} slowOperations
 * @property {MemoryUsageRecord[]} memoryUsage
 * @property {ErrorRecord[]} errors
 */
/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string[]} errors
 * @property {string[]} warnings
 */
/**
 * @typedef {Object} StateSnapshot
 * @property {number} timestamp
 * @property {any} state
 * @property {any[]} history
 * @property {PerformanceMetrics & { isEnabled: boolean, timestamp: number }} metrics
 * @property {{ used: number, total: number } | null} memory
 */
/**
 * @typedef {Object} SnapshotDiffStateChange
 * @property {string} key
 * @property {any} oldValue
 * @property {any} newValue
 */
/**
 * @typedef {Object} SnapshotComparison
 * @property {number} timestamp
 * @property {number} timeDelta
 * @property {SnapshotDiffStateChange[]} stateChanges
 * @property {{ used: number, total: number } | null} memoryDelta
 */

/**
 * Performance monitoring configuration
 */
const PERFORMANCE_CONFIG = {
    enableMonitoring: false, // Set to true in development
    maxHistorySize: 100,
    memoryCheckInterval: 30_000, // 30 seconds
    slowOperationThreshold: 10, // Ms
};

/**
 * State Debug Utilities Class
 */
class StateDebugUtilities {
    isDebugMode = false;

    logLevel = "info";

    constructor() {
        // 'debug', 'info', 'warn', 'error'
    }

    /**
     * Check for undefined values recursively
     * @param {*} obj - Object to check
     * @param {string} path - Current path
     * @param {Object} validation - Validation results
     */
    /**
     * @param {*} obj
     * @param {string} path
     * @param {ValidationResult} validation
     */
    checkForUndefined(obj, path, validation) {
        if (obj === undefined) {
            validation.warnings.push(`Undefined value at path: ${path}`);
            return;
        }

        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            for (const key of Object.keys(obj)) {
                const newPath = path ? `${path}.${key}` : key;
                this.checkForUndefined(obj[key], newPath, validation);
            }
        }
    }

    /**
     * Compare two state snapshots
     * @param {Object} snapshot1 - First snapshot
     * @param {Object} snapshot2 - Second snapshot
     * @returns {Object} Comparison results
     */
    /**
     * @param {StateSnapshot} snapshot1
     * @param {StateSnapshot} snapshot2
     * @returns {SnapshotComparison}
     */
    compareSnapshots(snapshot1, snapshot2) {
        /** @type {SnapshotComparison} */
        const // Simple state comparison (could be enhanced with deep diff)
            keys1 = Object.keys(snapshot1.state),
            keys2 = Object.keys(snapshot2.state),
            allKeys = new Set([...keys1, ...keys2]),
            diff = {
                memoryDelta: null,
                stateChanges: /** @type {SnapshotDiffStateChange[]} */ ([]),
                timeDelta: snapshot2.timestamp - snapshot1.timestamp,
                timestamp: Date.now(),
            };

        for (const key of allKeys) {
            if (snapshot1.state[key] !== snapshot2.state[key]) {
                diff.stateChanges.push({
                    key: /** @type {string} */ (key),
                    newValue: snapshot2.state[key],
                    oldValue: snapshot1.state[key],
                });
            }
        }

        // Memory comparison
        if (snapshot1.memory && snapshot2.memory) {
            diff.memoryDelta = {
                total: snapshot2.memory.total - snapshot1.memory.total,
                used: snapshot2.memory.used - snapshot1.memory.used,
            };
        }

        return diff;
    }

    /**
     * Create state snapshot for debugging
     * @returns {Object} State snapshot with metadata
     */
    /**
     * @returns {StateSnapshot}
     */
    createSnapshot() {
        return {
            history: getStateHistory().slice(-10), // Last 10 changes
            memory:
                typeof performance !== "undefined" && "memory" in performance && performance.memory
                    ? {
                        total: /** @type {any} */ (performance.memory).totalJSHeapSize,
                        used: /** @type {any} */ (performance.memory).usedJSHeapSize,
                    }
                    : null,
            // eslint-disable-next-line no-use-before-define -- performanceMonitor declared later in file; accessed lazily
            metrics: performanceMonitor.getMetrics(),
            state: structuredClone(getState("")),
            timestamp: Date.now(),
        };
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.isDebugMode = false;
        console.log("[StateDebug] Debug mode disabled");

        if (globalThis.window !== undefined) {
            delete (/** @type {any} */ (globalThis).__stateDebug);
        }
    }

    /**
     * Enable debug mode
     */
    enableDebugMode() {
        this.isDebugMode = true;
        console.log("[StateDebug] Debug mode enabled");

        // Expose debug utilities globally
        if (globalThis.window !== undefined) {
            // Use a distinct property name to minimize clash with existing global typedefs
            /** @type {any} */ (globalThis).__stateDebug = {
                // eslint-disable-next-line no-use-before-define
                disableMonitoring: () => performanceMonitor.disable(),
                // eslint-disable-next-line no-use-before-define
                enableMonitoring: () => performanceMonitor.enable(),
                findSlowSubscribers: () => this.findSlowSubscribers(),
                getHistory: () => getStateHistory(),
                // eslint-disable-next-line no-use-before-define
                getMetrics: () => performanceMonitor.getMetrics(),
                // eslint-disable-next-line no-use-before-define
                getReport: () => performanceMonitor.getReport(),
                getState: () => getState(""),
                logState: () => this.logCurrentState(),
                // eslint-disable-next-line no-use-before-define
                resetMetrics: () => performanceMonitor.resetMetrics(),
                validateState: () => this.validateState(),
            };
        }
    }

    /**
     * Find slow subscribers (mock implementation)
     * @returns {Array<any>} List of potentially slow subscribers
     */
    findSlowSubscribers() {
        // This would need access to internal subscription tracking
        // For now, return a mock result
        console.log("[StateDebug] Slow subscriber detection not fully implemented");
        return [];
    }

    /**
     * Log current state
     */
    logCurrentState() {
        const state = getState("");
        console.group("[StateDebug] Current State");
        console.log("Full State:", state);
        console.log("State Keys:", Object.keys(state));
        console.log("State History Length:", getStateHistory().length);
        console.groupEnd();
    }
    /**
     * Validate state integrity
     * @returns {Object} Validation results
     */
    validateState() {
        const state = getState(""),
            /** @type {ValidationResult} */
            validation = {
                errors: [],
                isValid: true,
                warnings: [],
            };

        try {
            // Check for circular references
            JSON.stringify(state);
        } catch {
            validation.isValid = false;
            validation.errors.push("Circular reference detected in state");
        }

        // Check for undefined values
        this.checkForUndefined(state, "", validation);

        // Check state structure
        this.validateStateStructure(state, validation);

        console.log("[StateDebug] State validation:", validation);
        return validation;
    }
    /**
     * Validate expected state structure
     * @param {Object} state - State to validate
     * @param {Object} validation - Validation results
     */
    /**
     * @param {any} state
     * @param {ValidationResult} validation
     */
    validateStateStructure(state, validation) {
        const expectedKeys = ["app", "ui", "globalData", "system", "settings"];

        for (const key of expectedKeys) {
            if (!(key in state)) {
                validation.warnings.push(`Missing expected state key: ${key}`);
            }
        }

        // Check app state structure
        if (state.app) {
            const expectedAppKeys = ["initialized", "isOpeningFile", "startTime"];
            for (const key of expectedAppKeys) {
                if (!(key in state.app)) {
                    validation.warnings.push(`Missing expected app state key: ${key}`);
                }
            }
        }
    }
}

/**
 * State Performance Monitor Class
 */
class StatePerformanceMonitor {
    constructor() {
        /** @type {PerformanceMetrics} */
        this.metrics = {
            errors: /** @type {ErrorRecord[]} */ ([]),
            memoryUsage: /** @type {MemoryUsageRecord[]} */ ([]),
            slowOperations: /** @type {SlowOperationRecord[]} */ ([]),
            stateChanges: 0,
            subscriptions: 0,
        };
        this.timers = new Map();
        this.intervalId = null;
        this.isEnabled = false;
    }

    /**
     * Disable performance monitoring
     */
    disable() {
        if (!this.isEnabled) {
            return;
        }

        this.isEnabled = false;
        console.log("[StateMonitor] Performance monitoring disabled");

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Enable performance monitoring
     */
    enable() {
        if (this.isEnabled) {
            return;
        }

        this.isEnabled = true;
        console.log("[StateMonitor] Performance monitoring enabled");

        // Set up memory monitoring
        this.intervalId = setInterval(() => {
            this.recordMemoryUsage();
        }, PERFORMANCE_CONFIG.memoryCheckInterval);

        // Monitor state changes
        this.subscribeToStateChanges();
    }

    /**
     * End timing an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    /**
     * @param {string} operationId
     * @returns {number|undefined}
     */
    endTimer(operationId) {
        if (!this.isEnabled) {
            return;
        }
        const startTime = this.timers.get(operationId);
        if (!startTime) {
            return;
        }
        const duration = performance.now() - startTime;
        this.timers.delete(operationId);
        if (duration > PERFORMANCE_CONFIG.slowOperationThreshold) {
            this.recordSlowOperation(operationId, duration);
        }
        return duration;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    /**
     * @returns {PerformanceMetrics & { isEnabled: boolean, timestamp: number }}
     */
    getMetrics() {
        return {
            ...this.metrics,
            isEnabled: this.isEnabled,
            timestamp: Date.now(),
        };
    }

    /**
     * Get performance report
     * @returns {string} Formatted performance report
     */
    /**
     * @returns {string}
     */
    getReport() {
        const metrics = this.getMetrics(),
            latestMemory = metrics.memoryUsage.at(-1);

        return `
State Performance Report
========================
Status: ${metrics.isEnabled ? "Enabled" : "Disabled"}
State Changes: ${metrics.stateChanges}
Slow Operations: ${metrics.slowOperations.length}
Errors: ${metrics.errors.length}

Memory Usage:
${latestMemory
                ? `
  Used JS Heap: ${(latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
  Total JS Heap: ${(latestMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
  Heap Limit: ${(latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
`
                : "  Memory info not available"
            }

Recent Slow Operations:
${metrics.slowOperations
                .slice(-5)
                .map((op) => `  ${op.operation}: ${op.duration.toFixed(2)}ms`)
                .join("\n") || "  None"
            }

Recent Errors:
${metrics.errors
                .slice(-3)
                .map((err) => `  ${err.context}: ${err.error}`)
                .join("\n") || "  None"
            }
        `.trim();
    }

    /**
     * Record an error
     * @param {Error} error - Error to record
     * @param {string} context - Context where error occurred
     */
    /**
     * @param {Error} error
     * @param {string} context
     */
    recordError(error, context) {
        /** @type {ErrorRecord} */
        const record = {
            context,
            error: error.message,
            stack: error.stack,
            timestamp: Date.now(),
        };

        this.metrics.errors.push(record);

        // Keep only recent errors
        if (this.metrics.errors.length > PERFORMANCE_CONFIG.maxHistorySize) {
            this.metrics.errors.shift();
        }
    }

    /**
     * Record memory usage
     */
    recordMemoryUsage() {
        if (!this.isEnabled) {
            return;
        }

        try {
            // Use performance.memory if available (Chrome/Edge)
            if (typeof performance !== "undefined" && "memory" in performance && performance.memory) {
                const mem = /** @type {any} */ (performance.memory),
                    /** @type {MemoryUsageRecord} */
                    record = {
                        jsHeapSizeLimit: mem.jsHeapSizeLimit,
                        timestamp: Date.now(),
                        totalJSHeapSize: mem.totalJSHeapSize,
                        usedJSHeapSize: mem.usedJSHeapSize,
                    };

                this.metrics.memoryUsage.push(record);

                // Keep only recent memory records
                if (this.metrics.memoryUsage.length > PERFORMANCE_CONFIG.maxHistorySize) {
                    this.metrics.memoryUsage.shift();
                }
            }
        } catch (error) {
            console.warn("[StateMonitor] Could not record memory usage:", error);
        }
    }

    /**
     * Record a slow operation
     * @param {string} operationId - Operation identifier
     * @param {number} duration - Duration in milliseconds
     */
    /**
     * @param {string} operationId
     * @param {number} duration
     */
    recordSlowOperation(operationId, duration) {
        /** @type {SlowOperationRecord} */
        const record = {
            duration,
            operation: operationId,
            stack: new Error("Performance tracking stack trace").stack,
            timestamp: Date.now(),
        };

        this.metrics.slowOperations.push(record);

        // Keep only recent slow operations
        if (this.metrics.slowOperations.length > PERFORMANCE_CONFIG.maxHistorySize) {
            this.metrics.slowOperations.shift();
        }

        console.warn(`[StateMonitor] Slow operation detected: ${operationId} took ${duration.toFixed(2)}ms`);
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            errors: [],
            memoryUsage: [],
            slowOperations: [],
            stateChanges: 0,
            subscriptions: 0,
        };
        console.log("[StateMonitor] Metrics reset");
    }

    /**
     * Start timing an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    startTimer(operationId) {
        if (!this.isEnabled) {
            return;
        }
        this.timers.set(operationId, performance.now());
    }

    /**
     * Subscribe to state changes for monitoring
     */
    subscribeToStateChanges() {
        // Monitor all state changes
        subscribe("*", () => {
            this.metrics.stateChanges++;
        });
    }
}

// Create global instances
export const performanceMonitor = new StatePerformanceMonitor();
export const debugUtilities = new StateDebugUtilities();

/**
 * Cleanup development tools
 */
export function cleanupStateDevTools() {
    debugUtilities.disableDebugMode();
    performanceMonitor.disable();
    console.log("[StateDevTools] Development tools cleaned up");
}

/**
 * Initialize debug and monitoring utilities
 * @param {boolean} enableInProduction - Whether to enable in production
 */
export function initializeStateDevTools(enableInProduction = false) {
    const isDevelopment =
        globalThis.window !== undefined &&
        (globalThis.location.hostname === "localhost" ||
            globalThis.location.hostname === "127.0.0.1" ||
            globalThis.location.protocol === "file:");

    if (isDevelopment || enableInProduction) {
        debugUtilities.enableDebugMode();

        if (PERFORMANCE_CONFIG.enableMonitoring) {
            performanceMonitor.enable();
        }

        console.log("[StateDevTools] Development tools initialized");
        console.log("Available commands:");
        console.log("- window.__stateDebug.getState() - Get current state");
        console.log("- window.__stateDebug.getHistory() - Get state history");
        console.log("- window.__stateDebug.getReport() - Get performance report");
        console.log("- window.__stateDebug.enableMonitoring() - Enable performance monitoring");
        console.log("- window.__stateDebug.logState() - Log current state");
        console.log("- window.__stateDebug.validateState() - Validate state integrity");
    }
}

/**
 * Utility function to measure state operation performance
 * @param {string} operationName - Name of the operation
 * @param {Function} operation - Function to measure
 * @returns {Promise<*>} Operation result
 */
export async function measureStateOperation(operationName, operation) {
    performanceMonitor.startTimer(operationName);

    try {
        const duration = performanceMonitor.endTimer(operationName),
            result = await operation();

        if (debugUtilities.isDebugMode) {
            console.log(`[StateDebug] Operation "${operationName}" completed in ${duration?.toFixed(2)}ms`);
        }

        return result;
    } catch (error) {
        performanceMonitor.endTimer(operationName);
        performanceMonitor.recordError(/** @type {Error} */(error), operationName);
        throw error;
    }
}

/**
 * Create a performance-monitored version of a function
 * @param {string} name - Function name for monitoring
 * @param {Function} fn - Function to wrap
 * @returns {Function} Wrapped function
 */
export function withPerformanceMonitoring(name, fn) {
    /**
     * @param {...any} args
     */
    return async (...args) => measureStateOperation(name, () => fn(...args));
}

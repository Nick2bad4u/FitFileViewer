/**
 * State Performance Monitor and Debug Utilities
 * Provides debugging tools, performance monitoring, and development utilities for the state system
 */

import { getState, subscribe, getStateHistory } from "../state/core/stateManager.js";

/**
 * Performance monitoring configuration
 */
const PERFORMANCE_CONFIG = {
    enableMonitoring: false, // Set to true in development
    maxHistorySize: 100,
    slowOperationThreshold: 10, // ms
    memoryCheckInterval: 30000, // 30 seconds
};

/**
 * State Performance Monitor Class
 */
class StatePerformanceMonitor {
    constructor() {
        this.metrics = {
            stateChanges: 0,
            subscriptions: 0,
            slowOperations: [],
            memoryUsage: [],
            errors: [],
        };
        this.timers = new Map();
        this.intervalId = null;
        this.isEnabled = false;
    }

    /**
     * Enable performance monitoring
     */
    enable() {
        if (this.isEnabled) return;

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
     * Disable performance monitoring
     */
    disable() {
        if (!this.isEnabled) return;

        this.isEnabled = false;
        console.log("[StateMonitor] Performance monitoring disabled");

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Start timing an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    startTimer(operationId) {
        if (!this.isEnabled) return;
        this.timers.set(operationId, performance.now());
    }

    /**
     * End timing an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    endTimer(operationId) {
        if (!this.isEnabled) return;

        const startTime = this.timers.get(operationId);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(operationId);

            if (duration > PERFORMANCE_CONFIG.slowOperationThreshold) {
                this.recordSlowOperation(operationId, duration);
            }

            return duration;
        }
    }

    /**
     * Record a slow operation
     * @param {string} operationId - Operation identifier
     * @param {number} duration - Duration in milliseconds
     */
    recordSlowOperation(operationId, duration) {
        const record = {
            operation: operationId,
            duration,
            timestamp: Date.now(),
            stack: new Error().stack,
        };

        this.metrics.slowOperations.push(record);

        // Keep only recent slow operations
        if (this.metrics.slowOperations.length > PERFORMANCE_CONFIG.maxHistorySize) {
            this.metrics.slowOperations.shift();
        }

        console.warn(`[StateMonitor] Slow operation detected: ${operationId} took ${duration.toFixed(2)}ms`);
    }

    /**
     * Record memory usage
     */
    recordMemoryUsage() {
        if (!this.isEnabled) return;

        try {
            // Use performance.memory if available (Chrome/Edge)
            if (performance.memory) {
                const record = {
                    timestamp: Date.now(),
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
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
     * Subscribe to state changes for monitoring
     */
    subscribeToStateChanges() {
        // Monitor all state changes
        subscribe("*", () => {
            this.metrics.stateChanges++;
        });
    }

    /**
     * Record an error
     * @param {Error} error - Error to record
     * @param {string} context - Context where error occurred
     */
    recordError(error, context) {
        const record = {
            error: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now(),
        };

        this.metrics.errors.push(record);

        // Keep only recent errors
        if (this.metrics.errors.length > PERFORMANCE_CONFIG.maxHistorySize) {
            this.metrics.errors.shift();
        }
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            isEnabled: this.isEnabled,
            timestamp: Date.now(),
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            stateChanges: 0,
            subscriptions: 0,
            slowOperations: [],
            memoryUsage: [],
            errors: [],
        };
        console.log("[StateMonitor] Metrics reset");
    }

    /**
     * Get performance report
     * @returns {string} Formatted performance report
     */
    getReport() {
        const metrics = this.getMetrics();
        const latestMemory = metrics.memoryUsage[metrics.memoryUsage.length - 1];

        return `
State Performance Report
========================
Status: ${metrics.isEnabled ? "Enabled" : "Disabled"}
State Changes: ${metrics.stateChanges}
Slow Operations: ${metrics.slowOperations.length}
Errors: ${metrics.errors.length}

Memory Usage:
${
    latestMemory
        ? `
  Used JS Heap: ${(latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
  Total JS Heap: ${(latestMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
  Heap Limit: ${(latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
`
        : "  Memory info not available"
}

Recent Slow Operations:
${
    metrics.slowOperations
        .slice(-5)
        .map((op) => `  ${op.operation}: ${op.duration.toFixed(2)}ms`)
        .join("\n") || "  None"
}

Recent Errors:
${
    metrics.errors
        .slice(-3)
        .map((err) => `  ${err.context}: ${err.error}`)
        .join("\n") || "  None"
}
        `.trim();
    }
}

/**
 * State Debug Utilities Class
 */
class StateDebugUtilities {
    constructor() {
        this.isDebugMode = false;
        this.logLevel = "info"; // 'debug', 'info', 'warn', 'error'
    }

    /**
     * Enable debug mode
     */
    enableDebugMode() {
        this.isDebugMode = true;
        console.log("[StateDebug] Debug mode enabled");

        // Expose debug utilities globally
        if (typeof window !== "undefined") {
            window.__stateDebug = {
                getState: () => getState(),
                getHistory: () => getStateHistory(),
                getMetrics: () => performanceMonitor.getMetrics(),
                getReport: () => performanceMonitor.getReport(),
                resetMetrics: () => performanceMonitor.resetMetrics(),
                enableMonitoring: () => performanceMonitor.enable(),
                disableMonitoring: () => performanceMonitor.disable(),
                logState: () => this.logCurrentState(),
                validateState: () => this.validateState(),
                findSlowSubscribers: () => this.findSlowSubscribers(),
            };
        }
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.isDebugMode = false;
        console.log("[StateDebug] Debug mode disabled");

        if (typeof window !== "undefined") {
            delete window.__stateDebug;
        }
    }

    /**
     * Log current state
     */
    logCurrentState() {
        const state = getState();
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
        const state = getState();
        const validation = {
            isValid: true,
            errors: [],
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
     * Check for undefined values recursively
     * @param {*} obj - Object to check
     * @param {string} path - Current path
     * @param {Object} validation - Validation results
     */
    checkForUndefined(obj, path, validation) {
        if (obj === undefined) {
            validation.warnings.push(`Undefined value at path: ${path}`);
            return;
        }

        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            Object.keys(obj).forEach((key) => {
                const newPath = path ? `${path}.${key}` : key;
                this.checkForUndefined(obj[key], newPath, validation);
            });
        }
    }

    /**
     * Validate expected state structure
     * @param {Object} state - State to validate
     * @param {Object} validation - Validation results
     */
    validateStateStructure(state, validation) {
        const expectedKeys = ["app", "ui", "globalData", "system", "settings"];

        expectedKeys.forEach((key) => {
            if (!(key in state)) {
                validation.warnings.push(`Missing expected state key: ${key}`);
            }
        });

        // Check app state structure
        if (state.app) {
            const expectedAppKeys = ["initialized", "isOpeningFile", "startTime"];
            expectedAppKeys.forEach((key) => {
                if (!(key in state.app)) {
                    validation.warnings.push(`Missing expected app state key: ${key}`);
                }
            });
        }
    }

    /**
     * Find slow subscribers (mock implementation)
     * @returns {Array} List of potentially slow subscribers
     */
    findSlowSubscribers() {
        // This would need access to internal subscription tracking
        // For now, return a mock result
        console.log("[StateDebug] Slow subscriber detection not fully implemented");
        return [];
    }

    /**
     * Create state snapshot for debugging
     * @returns {Object} State snapshot with metadata
     */
    createSnapshot() {
        return {
            timestamp: Date.now(),
            state: structuredClone(getState()),
            history: getStateHistory().slice(-10), // Last 10 changes
            metrics: performanceMonitor.getMetrics(),
            memory:
                typeof performance !== "undefined" && performance.memory
                    ? {
                          used: performance.memory.usedJSHeapSize,
                          total: performance.memory.totalJSHeapSize,
                      }
                    : null,
        };
    }

    /**
     * Compare two state snapshots
     * @param {Object} snapshot1 - First snapshot
     * @param {Object} snapshot2 - Second snapshot
     * @returns {Object} Comparison results
     */
    compareSnapshots(snapshot1, snapshot2) {
        const diff = {
            timestamp: Date.now(),
            timeDelta: snapshot2.timestamp - snapshot1.timestamp,
            stateChanges: [],
            memoryDelta: null,
        };

        // Simple state comparison (could be enhanced with deep diff)
        const keys1 = Object.keys(snapshot1.state);
        const keys2 = Object.keys(snapshot2.state);

        const allKeys = new Set([...keys1, ...keys2]);

        allKeys.forEach((key) => {
            if (snapshot1.state[key] !== snapshot2.state[key]) {
                diff.stateChanges.push({
                    key,
                    oldValue: snapshot1.state[key],
                    newValue: snapshot2.state[key],
                });
            }
        });

        // Memory comparison
        if (snapshot1.memory && snapshot2.memory) {
            diff.memoryDelta = {
                used: snapshot2.memory.used - snapshot1.memory.used,
                total: snapshot2.memory.total - snapshot1.memory.total,
            };
        }

        return diff;
    }
}

// Create global instances
export const performanceMonitor = new StatePerformanceMonitor();
export const debugUtilities = new StateDebugUtilities();

/**
 * Initialize debug and monitoring utilities
 * @param {boolean} enableInProduction - Whether to enable in production
 */
export function initializeStateDevTools(enableInProduction = false) {
    const isDevelopment =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.protocol === "file:");

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
 * Cleanup development tools
 */
export function cleanupStateDevTools() {
    debugUtilities.disableDebugMode();
    performanceMonitor.disable();
    console.log("[StateDevTools] Development tools cleaned up");
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
        const result = await operation();
        const duration = performanceMonitor.endTimer(operationName);

        if (debugUtilities.isDebugMode) {
            console.log(`[StateDebug] Operation "${operationName}" completed in ${duration?.toFixed(2)}ms`);
        }

        return result;
    } catch (error) {
        performanceMonitor.endTimer(operationName);
        performanceMonitor.recordError(error, operationName);
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
    return async (...args) => {
        return measureStateOperation(name, () => fn(...args));
    };
}

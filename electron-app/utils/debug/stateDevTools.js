/**
 * State Performance Monitor and Debug Utilities Provides debugging tools,
 * performance monitoring, and development utilities for the state system
 */
import {
    getState,
    getStateHistory,
    subscribe,
} from "../state/core/stateManager.js";
/**
 * Performance monitoring configuration
 */
const PERFORMANCE_CONFIG = {
    enableMonitoring: false, // Set to true in development
    maxHistorySize: 100,
    memoryCheckInterval: 30_000, // 30 seconds
    slowOperationThreshold: 10, // Ms
};
function getStateDevToolsGlobal() {
    return globalThis;
}
/**
 * Checks whether a value is a plain state record.
 */
function isStateRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isBrowserMemoryInfo(value) {
    return (
        isStateRecord(value) &&
        typeof value["jsHeapSizeLimit"] === "number" &&
        typeof value["totalJSHeapSize"] === "number" &&
        typeof value["usedJSHeapSize"] === "number"
    );
}
function getBrowserMemoryInfo() {
    if (typeof performance === "undefined" || !("memory" in performance)) {
        return null;
    }
    const memory = performance.memory;
    return isBrowserMemoryInfo(memory) ? memory : null;
}
/**
 * State Debug Utilities Class
 */
class StateDebugUtilities {
    isDebugMode = false;
    logLevel = "info";
    /**
     * Check for undefined values recursively
     *
     * @param obj - Object to check.
     * @param path - Current path.
     * @param validation - Validation results.
     */
    checkForUndefined(obj, path, validation) {
        if (obj === undefined) {
            validation.warnings.push(`Undefined value at path: ${path}`);
            return;
        }
        if (isStateRecord(obj)) {
            for (const key of Object.keys(obj)) {
                const newPath = path ? `${path}.${key}` : key;
                this.checkForUndefined(obj[key], newPath, validation);
            }
        }
    }
    /**
     * Compare two state snapshots
     *
     * @param snapshot1 - First snapshot.
     * @param snapshot2 - Second snapshot.
     *
     * @returns Comparison results.
     */
    compareSnapshots(snapshot1, snapshot2) {
        const // Simple state comparison (could be enhanced with deep diff)
            state1 = isStateRecord(snapshot1.state) ? snapshot1.state : {},
            state2 = isStateRecord(snapshot2.state) ? snapshot2.state : {},
            keys1 = Object.keys(state1),
            keys2 = Object.keys(state2),
            allKeys = new Set([...keys1, ...keys2]),
            diff = {
                memoryDelta: null,
                stateChanges: [],
                timeDelta: snapshot2.timestamp - snapshot1.timestamp,
                timestamp: Date.now(),
            };
        for (const key of allKeys) {
            if (state1[key] !== state2[key]) {
                diff.stateChanges.push({
                    key,
                    newValue: state2[key],
                    oldValue: state1[key],
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
     *
     * @returns State snapshot with metadata.
     */
    createSnapshot() {
        const memory = getBrowserMemoryInfo();
        return {
            history: getStateHistory().slice(-10), // Last 10 changes
            memory: memory
                ? {
                      total: memory.totalJSHeapSize,
                      used: memory.usedJSHeapSize,
                  }
                : null,
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
            delete getStateDevToolsGlobal().__stateDebug;
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
            getStateDevToolsGlobal().__stateDebug = {
                disableMonitoring: () => performanceMonitor.disable(),
                enableMonitoring: () => performanceMonitor.enable(),
                findSlowSubscribers: () => this.findSlowSubscribers(),
                getHistory: () => getStateHistory(),
                getMetrics: () => performanceMonitor.getMetrics(),
                getReport: () => performanceMonitor.getReport(),
                getState: () => getState(""),
                logState: () => this.logCurrentState(),
                resetMetrics: () => performanceMonitor.resetMetrics(),
                validateState: () => this.validateState(),
            };
        }
    }
    /**
     * Find slow subscribers (mock implementation)
     *
     * @returns List of potentially slow subscribers.
     */
    findSlowSubscribers() {
        // This would need access to internal subscription tracking
        // For now, return a mock result
        console.log(
            "[StateDebug] Slow subscriber detection not fully implemented"
        );
        return [];
    }
    /**
     * Log current state
     */
    logCurrentState() {
        const state = getState("");
        console.group("[StateDebug] Current State");
        console.log("Full State:", state);
        console.log(
            "State Keys:",
            isStateRecord(state) ? Object.keys(state) : []
        );
        console.log("State History Length:", getStateHistory().length);
        console.groupEnd();
    }
    /**
     * Validate state integrity
     *
     * @returns Validation results.
     */
    validateState() {
        const state = getState(""),
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
     *
     * @param state - State to validate.
     * @param validation - Validation results.
     */
    validateStateStructure(state, validation) {
        if (!isStateRecord(state)) {
            validation.isValid = false;
            validation.errors.push("State root is not an object");
            return;
        }
        const expectedKeys = [
            "app",
            "ui",
            "globalData",
            "system",
            "settings",
        ];
        for (const key of expectedKeys) {
            if (!(key in state)) {
                validation.warnings.push(`Missing expected state key: ${key}`);
            }
        }
        // Check app state structure
        if (isStateRecord(state["app"])) {
            const expectedAppKeys = [
                "initialized",
                "isOpeningFile",
                "startTime",
            ];
            for (const key of expectedAppKeys) {
                if (!(key in state["app"])) {
                    validation.warnings.push(
                        `Missing expected app state key: ${key}`
                    );
                }
            }
        }
    }
}
/**
 * State Performance Monitor Class
 */
class StatePerformanceMonitor {
    intervalId = null;
    isEnabled = false;
    metrics = {
        errors: [],
        memoryUsage: [],
        slowOperations: [],
        stateChanges: 0,
        subscriptions: 0,
    };
    timers = new Map();
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
     *
     * @param operationId - Unique identifier for the operation.
     *
     * @returns Duration in milliseconds when timing was active.
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
     *
     * @returns Performance metrics.
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
     *
     * @returns Formatted performance report.
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
    /**
     * Record an error
     *
     * @param error - Error to record.
     * @param context - Context where error occurred.
     */
    recordError(error, context) {
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
            if (typeof performance !== "undefined" && "memory" in performance) {
                const mem = getBrowserMemoryInfo();
                if (!mem) {
                    return;
                }
                const record = {
                    jsHeapSizeLimit: mem.jsHeapSizeLimit,
                    timestamp: Date.now(),
                    totalJSHeapSize: mem.totalJSHeapSize,
                    usedJSHeapSize: mem.usedJSHeapSize,
                };
                this.metrics.memoryUsage.push(record);
                // Keep only recent memory records
                if (
                    this.metrics.memoryUsage.length >
                    PERFORMANCE_CONFIG.maxHistorySize
                ) {
                    this.metrics.memoryUsage.shift();
                }
            }
        } catch (error) {
            console.warn(
                "[StateMonitor] Could not record memory usage:",
                error
            );
        }
    }
    /**
     * Record a slow operation
     *
     * @param operationId - Operation identifier.
     * @param duration - Duration in milliseconds.
     */
    recordSlowOperation(operationId, duration) {
        const record = {
            duration,
            operation: operationId,
            stack: new Error("Performance tracking stack trace").stack,
            timestamp: Date.now(),
        };
        this.metrics.slowOperations.push(record);
        // Keep only recent slow operations
        if (
            this.metrics.slowOperations.length >
            PERFORMANCE_CONFIG.maxHistorySize
        ) {
            this.metrics.slowOperations.shift();
        }
        console.warn(
            `[StateMonitor] Slow operation detected: ${operationId} took ${duration.toFixed(2)}ms`
        );
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
     *
     * @param operationId - Unique identifier for the operation.
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
/**
 * Shared state performance monitor instance.
 */
export const performanceMonitor = new StatePerformanceMonitor();
/**
 * Shared state debug utility instance.
 */
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
 *
 * @param enableInProduction - Whether to enable in production.
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
        console.log(
            "- window.__stateDebug.getReport() - Get performance report"
        );
        console.log(
            "- window.__stateDebug.enableMonitoring() - Enable performance monitoring"
        );
        console.log("- window.__stateDebug.logState() - Log current state");
        console.log(
            "- window.__stateDebug.validateState() - Validate state integrity"
        );
    }
}
/**
 * Utility function to measure state operation performance
 *
 * @typeParam T - Operation result type.
 *
 * @param operationName - Name of the operation.
 * @param operation - Operation to measure.
 *
 * @returns Operation result.
 *
 * @throws Re-throws any error from the measured operation.
 */
export async function measureStateOperation(operationName, operation) {
    performanceMonitor.startTimer(operationName);
    try {
        return await Promise.resolve(operation()).finally(() => {
            const duration = performanceMonitor.endTimer(operationName);
            if (debugUtilities.isDebugMode) {
                console.log(
                    `[StateDebug] Operation "${operationName}" completed in ${duration?.toFixed(2)}ms`
                );
            }
        });
    } catch (error) {
        if (error instanceof Error) {
            performanceMonitor.recordError(error, operationName);
        } else {
            performanceMonitor.recordError(
                new Error(String(error)),
                operationName
            );
        }
        throw error;
    }
}
/**
 * Create a performance-monitored version of a callable
 *
 * @typeParam Args - Callable argument tuple.
 * @typeParam T - Callable result type.
 *
 * @param name - Callable name for monitoring.
 * @param fn - Callable to wrap.
 *
 * @returns Wrapped callable.
 */
export function withPerformanceMonitoring(name, fn) {
    return async (...args) => measureStateOperation(name, () => fn(...args));
}

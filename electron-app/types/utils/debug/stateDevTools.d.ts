/**
 * Cleanup development tools
 */
export function cleanupStateDevTools(): void;
/**
 * Initialize debug and monitoring utilities
 * @param {boolean} enableInProduction - Whether to enable in production
 */
export function initializeStateDevTools(enableInProduction?: boolean): void;
/**
 * Utility function to measure state operation performance
 * @param {string} operationName - Name of the operation
 * @param {Function} operation - Function to measure
 * @returns {Promise<*>} Operation result
 */
export function measureStateOperation(operationName: string, operation: Function): Promise<any>;
/**
 * Create a performance-monitored version of a function
 * @param {string} name - Function name for monitoring
 * @param {Function} fn - Function to wrap
 * @returns {Function} Wrapped function
 */
export function withPerformanceMonitoring(name: string, fn: Function): Function;
export const performanceMonitor: StatePerformanceMonitor;
export const debugUtilities: StateDebugUtilities;
export type SlowOperationRecord = {
    operation: string;
    duration: number;
    timestamp: number;
    stack: string | undefined;
};
export type MemoryUsageRecord = {
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
};
export type ErrorRecord = {
    error: string;
    stack: string | undefined;
    context: string;
    timestamp: number;
};
export type PerformanceMetrics = {
    stateChanges: number;
    subscriptions: number;
    slowOperations: SlowOperationRecord[];
    memoryUsage: MemoryUsageRecord[];
    errors: ErrorRecord[];
};
export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
export type StateSnapshot = {
    timestamp: number;
    state: any;
    history: any[];
    metrics: PerformanceMetrics & {
        isEnabled: boolean;
        timestamp: number;
    };
    memory: {
        used: number;
        total: number;
    } | null;
};
export type SnapshotDiffStateChange = {
    key: string;
    oldValue: any;
    newValue: any;
};
export type SnapshotComparison = {
    timestamp: number;
    timeDelta: number;
    stateChanges: SnapshotDiffStateChange[];
    memoryDelta: {
        used: number;
        total: number;
    } | null;
};
/**
 * State Performance Monitor Class
 */
declare class StatePerformanceMonitor {
    /** @type {PerformanceMetrics} */
    metrics: PerformanceMetrics;
    timers: Map<any, any>;
    intervalId: NodeJS.Timeout | null;
    isEnabled: boolean;
    /**
     * Disable performance monitoring
     */
    disable(): void;
    /**
     * Enable performance monitoring
     */
    enable(): void;
    /**
     * End timing an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    /**
     * @param {string} operationId
     * @returns {number|undefined}
     */
    endTimer(operationId: string): number | undefined;
    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    /**
     * @returns {PerformanceMetrics & { isEnabled: boolean, timestamp: number }}
     */
    getMetrics(): PerformanceMetrics & {
        isEnabled: boolean;
        timestamp: number;
    };
    /**
     * Get performance report
     * @returns {string} Formatted performance report
     */
    /**
     * @returns {string}
     */
    getReport(): string;
    /**
     * Record an error
     * @param {Error} error - Error to record
     * @param {string} context - Context where error occurred
     */
    /**
     * @param {Error} error
     * @param {string} context
     */
    recordError(error: Error, context: string): void;
    /**
     * Record memory usage
     */
    recordMemoryUsage(): void;
    /**
     * Record a slow operation
     * @param {string} operationId - Operation identifier
     * @param {number} duration - Duration in milliseconds
     */
    /**
     * @param {string} operationId
     * @param {number} duration
     */
    recordSlowOperation(operationId: string, duration: number): void;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Start timing an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    startTimer(operationId: string): void;
    /**
     * Subscribe to state changes for monitoring
     */
    subscribeToStateChanges(): void;
}
/**
 * State Debug Utilities Class
 */
declare class StateDebugUtilities {
    isDebugMode: boolean;
    logLevel: string;
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
    checkForUndefined(obj: any, path: string, validation: ValidationResult): void;
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
    compareSnapshots(snapshot1: StateSnapshot, snapshot2: StateSnapshot): SnapshotComparison;
    /**
     * Create state snapshot for debugging
     * @returns {Object} State snapshot with metadata
     */
    /**
     * @returns {StateSnapshot}
     */
    createSnapshot(): StateSnapshot;
    /**
     * Disable debug mode
     */
    disableDebugMode(): void;
    /**
     * Enable debug mode
     */
    enableDebugMode(): void;
    /**
     * Find slow subscribers (mock implementation)
     * @returns {Array<any>} List of potentially slow subscribers
     */
    findSlowSubscribers(): Array<any>;
    /**
     * Log current state
     */
    logCurrentState(): void;
    /**
     * Validate state integrity
     * @returns {Object} Validation results
     */
    validateState(): Object;
    /**
     * Validate expected state structure
     * @param {Object} state - State to validate
     * @param {Object} validation - Validation results
     */
    /**
     * @param {any} state
     * @param {ValidationResult} validation
     */
    validateStateStructure(state: any, validation: ValidationResult): void;
}
export {};
//# sourceMappingURL=stateDevTools.d.ts.map

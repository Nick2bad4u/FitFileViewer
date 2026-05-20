/** Slow state operation captured by the performance monitor. */
export type SlowOperationRecord = {
    operation: string;
    duration: number;
    timestamp: number;
    stack: string | undefined;
};

/** Browser memory sample captured by the performance monitor. */
export type MemoryUsageRecord = {
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
};

/** Error captured by the state performance monitor. */
export type ErrorRecord = {
    error: string;
    stack: string | undefined;
    context: string;
    timestamp: number;
};

/** State performance metrics snapshot. */
export type PerformanceMetrics = {
    stateChanges: number;
    subscriptions: number;
    slowOperations: SlowOperationRecord[];
    memoryUsage: MemoryUsageRecord[];
    errors: ErrorRecord[];
};

/** State validation result. */
export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};

/** Debug state snapshot. */
export type StateSnapshot = {
    timestamp: number;
    state: unknown;
    history: unknown[];
    metrics: PerformanceMetrics & {
        isEnabled: boolean;
        timestamp: number;
    };
    memory: {
        used: number;
        total: number;
    } | null;
};

/** One changed top-level state key between two debug snapshots. */
export type SnapshotDiffStateChange = {
    key: string;
    oldValue: unknown;
    newValue: unknown;
};

/** Comparison between two debug state snapshots. */
export type SnapshotComparison = {
    timestamp: number;
    timeDelta: number;
    stateChanges: SnapshotDiffStateChange[];
    memoryDelta: {
        used: number;
        total: number;
    } | null;
};

/** State performance monitor instance surface. */
declare class StatePerformanceMonitor {
    metrics: PerformanceMetrics;
    timers: Map<string, number>;
    intervalId: NodeJS.Timeout | null;
    isEnabled: boolean;
    disable(): void;
    enable(): void;
    endTimer(operationId: string): number | undefined;
    getMetrics(): PerformanceMetrics & {
        isEnabled: boolean;
        timestamp: number;
    };
    getReport(): string;
    recordError(error: Error, context: string): void;
    recordMemoryUsage(): void;
    recordSlowOperation(operationId: string, duration: number): void;
    resetMetrics(): void;
    startTimer(operationId: string): void;
    subscribeToStateChanges(): void;
}

/** State debug utility instance surface. */
declare class StateDebugUtilities {
    isDebugMode: boolean;
    logLevel: string;
    checkForUndefined(
        obj: unknown,
        path: string,
        validation: ValidationResult
    ): void;
    compareSnapshots(
        snapshot1: StateSnapshot,
        snapshot2: StateSnapshot
    ): SnapshotComparison;
    createSnapshot(): StateSnapshot;
    disableDebugMode(): void;
    enableDebugMode(): void;
    findSlowSubscribers(): unknown[];
    logCurrentState(): void;
    validateState(): ValidationResult;
    validateStateStructure(
        state: unknown,
        validation: ValidationResult
    ): void;
}

/** Shared state performance monitor. */
export const performanceMonitor: StatePerformanceMonitor;

/** Shared state debug utilities. */
export const debugUtilities: StateDebugUtilities;

/** Cleanup development state tools. */
export function cleanupStateDevTools(): void;

/** Initialize state debug and performance utilities. */
export function initializeStateDevTools(enableInProduction?: boolean): void;

/** Measure an operation with the state performance monitor. */
export function measureStateOperation<T>(
    operationName: string,
    operation: () => Promise<T> | T
): Promise<T>;

/** Create a performance-monitored version of a callable. */
export function withPerformanceMonitoring<Args extends unknown[], T>(
    name: string,
    fn: (...args: Args) => Promise<T> | T
): (...args: Args) => Promise<T>;

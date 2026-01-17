export * from "./debugChartFormatting.js";
export * from "./debugSensorInfo.js";
export * from "./lastAnimLog.js";
export * from "./stateDevTools.js";
declare const _default: {
    cleanupStateDevTools(): void;
    initializeStateDevTools(enableInProduction?: boolean): void;
    measureStateOperation(operationName: string, operation: Function): Promise<any>;
    withPerformanceMonitoring(name: string, fn: Function): Function;
    performanceMonitor: {
        metrics: stateDevTools.PerformanceMetrics;
        timers: Map<any, any>;
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
    };
    debugUtilities: {
        isDebugMode: boolean;
        logLevel: string;
        checkForUndefined(obj: any, path: string, validation: ValidationResult): void;
        compareSnapshots(snapshot1: StateSnapshot, snapshot2: StateSnapshot): SnapshotComparison;
        createSnapshot(): StateSnapshot;
        disableDebugMode(): void;
        enableDebugMode(): void;
        findSlowSubscribers(): Array<any>;
        logCurrentState(): void;
        validateState(): Object;
        validateStateStructure(state: any, validation: ValidationResult): void;
    };
    throttledAnimLog: (message: any) => void;
    criticalAnimLog: (message: string) => void;
    perfAnimLog: (message: any, startTime: any) => void;
    checkDataAvailability(): any;
    debugSensorInfo(): Object | null;
    showDataKeys(): void;
    showSensorNames(): void;
    testManufacturerId(manufacturerId: number | string): {
        formatted: string;
        id: number;
        resolved: string;
    };
    testProductId(
        manufacturerId: number | string,
        productId: number | string
    ): {
        formattedProduct: string;
        manufacturerId: number;
        manufacturerName: string;
        productId: number;
        resolvedProduct: string;
    };
    testFaveroCase(): {
        actual: string;
        expected: string;
        success: boolean;
    };
    testFaveroStringCase(): {
        actual: string;
        expected: string;
        success: boolean;
    };
    testNewFormatting(): (
        | {
              name: string;
              sensor: {
                  manufacturer: number;
                  product: number;
                  garminProduct?: never;
              };
          }
        | {
              name: string;
              sensor: {
                  manufacturer: string;
                  product: string;
                  garminProduct?: never;
              };
          }
        | {
              name: string;
              sensor: {
                  garminProduct: string;
                  manufacturer?: never;
                  product?: never;
              };
          }
    )[];
};
export default _default;
import * as stateDevTools from "./stateDevTools.js";

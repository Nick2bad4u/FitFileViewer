export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";
export type Operation = {
    id: string;
    startTime: number;
    /**
     * - Monotonic start timestamp for duration calculation (ms)
     */
    startTimePerf?: number;
    endTime?: number;
    /**
     * - Monotonic end timestamp for duration calculation (ms)
     */
    endTimePerf?: number;
    duration?: number;
    status: "running" | "completed" | "failed";
    progress: number;
    message: string;
    result?: Object;
    error?:
        | {
              message: string;
              stack?: string;
              name?: string;
          }
        | undefined;
    lastUpdate?: number;
};
export type OperationUpdate = {
    progress?: number;
    message?: string;
    result?: Object;
    error?:
        | {
              message: string;
              stack?: string;
              name?: string;
          }
        | undefined;
};
export type ErrorEntry = {
    id: string;
    timestamp: number;
    message: string;
    stack: string | null;
    context: Object;
    source: string;
};
export type Metrics = {
    startTime: number;
    /**
     * - Monotonic start timestamp for uptime calculation (ms)
     */
    startTimePerf?: number;
    operationTimes: Map<
        string,
        {
            value: number;
            timestamp: number;
            metadata: Object;
        }
    >;
};
export type HandlerInfo = {
    emitter: {
        on: Function;
        removeListener: Function;
    };
    event: string;
    handler: Function;
};
export type MainProcessStateData = {
    loadedFitFilePath: string | null;
    mainWindow: import("electron").BrowserWindow | null;
    gyazoServer: Object | null;
    gyazoServerPort: number | null;
    pendingOAuthResolvers: Map<string, Function>;
    eventHandlers: Map<string, HandlerInfo>;
    operations: Record<string, Operation>;
    errors: ErrorEntry[];
    metrics: Metrics;
};

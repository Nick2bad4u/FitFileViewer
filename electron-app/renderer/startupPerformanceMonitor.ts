import {
    getStartupPerformanceMonitorRuntime,
    type StartupPerformanceMonitorRuntime,
} from "./startupPerformanceMonitorRuntime.js";

export type RendererPerformanceLogLevel = "log" | "warn";

export type RendererPerformanceLogger = (
    level: RendererPerformanceLogLevel,
    ...args: unknown[]
) => void;

export interface RendererPerformanceMonitor {
    end(operation: string): number;
    getMetrics(): Record<string, number>;
    metrics: Map<string, number>;
    start(operation: string): void;
}

interface RendererPerformanceMonitorOptions {
    readonly isDevelopmentMode: () => boolean;
    readonly logRenderer: RendererPerformanceLogger;
    readonly runtime?: StartupPerformanceMonitorRuntime | undefined;
}

export function createRendererPerformanceMonitor({
    isDevelopmentMode,
    logRenderer,
    runtime = getStartupPerformanceMonitorRuntime(),
}: RendererPerformanceMonitorOptions): RendererPerformanceMonitor {
    return {
        end(operation) {
            const startTime = this.metrics.get(`${operation}_start`);
            if (startTime === undefined) {
                logRenderer(
                    "warn",
                    `[Performance] No start time found for operation: ${operation}`
                );
                return 0;
            }

            const duration = runtime.nowPerformance() - startTime;
            this.metrics.set(operation, duration);

            if (isDevelopmentMode()) {
                logRenderer(
                    "log",
                    `[Performance] ${operation}: ${duration.toFixed(2)}ms`
                );
            }

            return duration;
        },

        getMetrics() {
            const result: Record<string, number> = {};
            for (const [key, value] of this.metrics) {
                if (!key.endsWith("_start")) {
                    result[key] = value;
                }
            }
            return result;
        },

        metrics: new Map<string, number>(),

        start(operation) {
            this.metrics.set(`${operation}_start`, runtime.nowPerformance());
        },
    };
}

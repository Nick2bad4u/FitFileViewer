import { isDevelopmentEnvironment } from "./renderChartRuntimeHelpers.js";

let chartDebugLoggingEnabled = false;
let chartVerboseDebugLoggingEnabled = false;
let chartFullscreenTraceEnabled: boolean | null = null;

export function isChartDebugLoggingEnabled(): boolean {
    return isDevelopmentEnvironment() && chartDebugLoggingEnabled;
}

export function isChartFullscreenTraceEnabled(): boolean {
    if (typeof chartFullscreenTraceEnabled === "boolean") {
        return chartFullscreenTraceEnabled;
    }

    return isDevelopmentEnvironment();
}

export function isChartVerboseDebugLoggingEnabled(): boolean {
    return isChartDebugLoggingEnabled() && chartVerboseDebugLoggingEnabled;
}

export function resetChartDebugStateForTests(): void {
    chartDebugLoggingEnabled = false;
    chartVerboseDebugLoggingEnabled = false;
    chartFullscreenTraceEnabled = null;
}

export function setChartDebugLoggingEnabled(enabled: boolean): void {
    chartDebugLoggingEnabled = enabled;
}

export function setChartFullscreenTraceEnabled(enabled: boolean | null): void {
    chartFullscreenTraceEnabled = enabled;
}

export function setChartVerboseDebugLoggingEnabled(enabled: boolean): void {
    chartVerboseDebugLoggingEnabled = enabled;
}

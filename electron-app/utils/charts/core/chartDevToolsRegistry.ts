import type { RegisteredChartInstance } from "./chartInstanceRegistry.js";

export type ChartDevToolsDumpStateSnapshot = Readonly<{
    activeFitChartData: boolean;
    activeTab: unknown;
    chartInstances: number;
    charts: unknown;
    performance: unknown;
    settings: unknown;
}>;

export type ChartDevToolsComputedAccess = Readonly<{
    get: (key: string) => unknown;
    invalidate: (key: string) => unknown;
    list: () => unknown;
}>;

export type ChartDevToolsFieldVisibilityAccess = Readonly<{
    get: (field: string) => unknown;
    getAll: () => Record<string, string>;
    set: (field: string, visibility: unknown) => unknown;
}>;

export type RegisteredChartDevTools = Readonly<{
    actions: unknown;
    clearCharts: unknown;
    computed: ChartDevToolsComputedAccess;
    dumpState: () => ChartDevToolsDumpStateSnapshot;
    exportCharts: unknown;
    fieldVisibility: ChartDevToolsFieldVisibilityAccess;
    getChartInstances: () => RegisteredChartInstance[];
    getChartSettings: () => unknown;
    getChartState: () => unknown;
    getChartStatus: unknown;
    getPerformanceMetrics: () => unknown;
    getPerformanceSummary: () => unknown;
    getStateHistory: () => unknown;
    initializeStateManagement: unknown;
    performance: unknown;
    refreshCharts: unknown;
    requestRerender: unknown;
    resetNotificationState: unknown;
    settings: unknown;
    testDebounce: (delay?: number) => void;
    testStateSynchronization: () => void;
}>;

let registeredChartDevTools: RegisteredChartDevTools | null = null;

export function getRegisteredChartDevTools(): RegisteredChartDevTools | null {
    return registeredChartDevTools;
}

export function registerChartDevTools(devTools: RegisteredChartDevTools): void {
    registeredChartDevTools = devTools;
}

export function resetChartDevToolsRegistryForTests(): void {
    registeredChartDevTools = null;
}

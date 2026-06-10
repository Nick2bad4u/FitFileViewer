export interface RegisteredChartStateManager {
    debouncedRender(reason: string): void;
}

let registeredChartStateManager: RegisteredChartStateManager | null = null;

export function getRegisteredChartStateManager(): RegisteredChartStateManager | null {
    return registeredChartStateManager;
}

export function registerChartStateManager(
    chartStateManager: RegisteredChartStateManager
): void {
    registeredChartStateManager = chartStateManager;
}

export function resetChartStateManagerRegistryForTests(): void {
    registeredChartStateManager = null;
}

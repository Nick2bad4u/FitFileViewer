export interface RegisteredChartStateManager {
    debouncedRender(reason: string): void;
    handleThemeChange?: ((theme?: string) => void) | undefined;
    readonly isInitialized?: boolean | undefined;
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

export interface RegisteredChartStateManager {
    clearChartState?: (() => void) | undefined;
    debouncedRender(reason: string): void;
    destroy?: (() => void) | undefined;
    forceRender?: ((reason?: string) => void) | undefined;
    getChartInfo?: (() => unknown) | undefined;
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

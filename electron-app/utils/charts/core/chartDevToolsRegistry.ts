export type RegisteredChartDevTools = Record<string, unknown>;

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

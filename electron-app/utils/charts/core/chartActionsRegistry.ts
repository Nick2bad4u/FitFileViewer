export interface RegisteredChartActions {
    clearCharts?: () => void;
    completeRendering?: (
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ) => void;
    requestRerender?: (reason?: string) => void;
    startRendering?: () => void;
}

let registeredChartActions: RegisteredChartActions | null = null;

export function getRegisteredChartActions(): RegisteredChartActions | null {
    return registeredChartActions;
}

export function registerChartActions(actions: RegisteredChartActions): void {
    registeredChartActions = actions;
}

export function resetChartActionsRegistryForTests(): void {
    registeredChartActions = null;
}

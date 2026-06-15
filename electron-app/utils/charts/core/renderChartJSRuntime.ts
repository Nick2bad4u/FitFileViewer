export interface RenderChartJSRuntimeScope {
    readonly dateNow?: (() => number) | undefined;
    readonly performance?: Pick<Performance, "now"> | undefined;
    readonly window?: unknown;
}

export interface RenderChartJSRuntime {
    isWindowAvailable: () => boolean;
    now: () => number;
    nowPerformance: () => number;
}

export function getRenderChartJSRuntime(
    scope: RenderChartJSRuntimeScope = globalThis
): RenderChartJSRuntime {
    return {
        isWindowAvailable(): boolean {
            return scope.window !== undefined;
        },

        now(): number {
            return scope.dateNow?.() ?? Date.now();
        },

        nowPerformance(): number {
            return scope.performance?.now() ?? this.now();
        },
    };
}

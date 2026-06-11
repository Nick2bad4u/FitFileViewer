export interface SummaryColModalRuntimeScope {
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
}

export interface SummaryColModalViewport {
    readonly height: number;
    readonly width: number;
}

export interface SummaryColModalRuntime {
    getViewport(): SummaryColModalViewport;
}

export function getSummaryColModalRuntime(
    scope: SummaryColModalRuntimeScope = globalThis
): SummaryColModalRuntime {
    return {
        getViewport(): SummaryColModalViewport {
            return {
                height: scope.innerHeight ?? 0,
                width: scope.innerWidth ?? 0,
            };
        },
    };
}

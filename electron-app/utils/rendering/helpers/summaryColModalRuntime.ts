export interface SummaryColModalRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
}

export interface SummaryColModalViewport {
    readonly height: number;
    readonly width: number;
}

export interface SummaryColModalRuntime {
    createAbortController(): AbortController;
    getViewport(): SummaryColModalViewport;
}

const defaultSummaryColModalRuntimeScope: SummaryColModalRuntimeScope =
    globalThis;

export function getSummaryColModalRuntime(
    scope: SummaryColModalRuntimeScope = defaultSummaryColModalRuntimeScope
): SummaryColModalRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "summaryColModal requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getViewport(): SummaryColModalViewport {
            return {
                height: scope.innerHeight ?? 0,
                width: scope.innerWidth ?? 0,
            };
        },
    };
}

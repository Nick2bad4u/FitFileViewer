export interface SummaryColModalRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getViewport?:
        | (() => SummaryColModalViewport | undefined)
        | undefined;
}

export interface SummaryColModalViewport {
    readonly height: number;
    readonly width: number;
}

export interface SummaryColModalRuntime {
    readonly createAbortController: () => AbortController;
    readonly getViewport: () => SummaryColModalViewport;
}

const defaultSummaryColModalRuntimeScope: SummaryColModalRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getViewport: () => ({
        height: globalThis.innerHeight,
        width: globalThis.innerWidth,
    }),
};

export function getSummaryColModalRuntime(
    scope: SummaryColModalRuntimeScope = defaultSummaryColModalRuntimeScope
): SummaryColModalRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "summaryColModal requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getViewport(): SummaryColModalViewport {
            return scope.getViewport?.() ?? { height: 0, width: 0 };
        },
    };
}

export type ChartHoverEffectsTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface ChartHoverEffectsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout: number
          ) => ChartHoverEffectsTimerHandle)
        | undefined;
}

export interface ChartHoverEffectsRuntime {
    createAbortController(): AbortController;
    requestAnimationFrame(callback: FrameRequestCallback): null | number;
    setTimeout(
        callback: () => void,
        timeout: number
    ): ChartHoverEffectsTimerHandle;
    waitForAnimationFrame(): Promise<void>;
}

const defaultChartHoverEffectsRuntimeScope: ChartHoverEffectsRuntimeScope =
    globalThis;

function getRequiredSetTimeout(
    scope: ChartHoverEffectsRuntimeScope
): (
    callback: () => void,
    timeout: number
) => ChartHoverEffectsTimerHandle {
    const setTimeoutRef = scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError(
            "chart hover effects require a setTimeout runtime"
        );
    }

    return setTimeoutRef;
}

export function getChartHoverEffectsRuntime(
    scope: ChartHoverEffectsRuntimeScope = defaultChartHoverEffectsRuntimeScope
): ChartHoverEffectsRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "chart hover effects require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        requestAnimationFrame(callback): null | number {
            if (typeof scope.requestAnimationFrame !== "function") {
                const fallbackFrameTime = Number("0");
                callback(fallbackFrameTime);
                return null;
            }

            return scope.requestAnimationFrame(callback);
        },
        setTimeout(callback, timeout): ChartHoverEffectsTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, timeout);
        },
        async waitForAnimationFrame(): Promise<void> {
            await new Promise<void>((resolve) => {
                if (typeof scope.requestAnimationFrame === "function") {
                    scope.requestAnimationFrame(() => {
                        resolve();
                    });
                    return;
                }

                const setTimeoutRef = getRequiredSetTimeout(scope);
                const timeoutHandle = setTimeoutRef(resolve, 0);
                void timeoutHandle;
            });
        },
    };
}

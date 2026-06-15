export interface RenderChartStartupRuntimeScope {
    readonly addEventListener?:
        | ((
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
    readonly window?: unknown;
}

export interface RenderChartStartupRuntime {
    addDOMContentLoadedListener: (
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ) => void;
    canRegisterDOMContentLoadedListener: () => boolean;
}

const defaultRenderChartStartupRuntimeScope: RenderChartStartupRuntimeScope =
    globalThis;

export function getRenderChartStartupRuntime(
    scope: RenderChartStartupRuntimeScope = defaultRenderChartStartupRuntimeScope
): RenderChartStartupRuntime {
    return {
        addDOMContentLoadedListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            const addEventListener = scope.addEventListener;
            if (typeof addEventListener !== "function") {
                throw new TypeError(
                    "renderChartStartup requires addEventListener"
                );
            }

            addEventListener("DOMContentLoaded", listener, {
                ...options,
                signal: options.signal,
            });
        },
        canRegisterDOMContentLoadedListener(): boolean {
            return (
                scope.window !== undefined &&
                typeof scope.addEventListener === "function"
            );
        },
    };
}

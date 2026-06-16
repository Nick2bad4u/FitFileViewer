export interface RenderChartStartupRuntimeScope {
    readonly addEventListener?:
        | ((
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
    readonly getAddEventListener?:
        | (() =>
              | ((
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: AddEventListenerOptions | boolean
                ) => void)
              | undefined)
        | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
}

export interface RenderChartStartupRuntime {
    addDOMContentLoadedListener: (
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ) => void;
    canRegisterDOMContentLoadedListener: () => boolean;
}

const defaultRenderChartStartupRuntimeScope: RenderChartStartupRuntimeScope = {
    getAddEventListener: () => globalThis.addEventListener,
    isRendererScope: () => globalThis.document !== undefined,
};

function getAddEventListener(
    scope: RenderChartStartupRuntimeScope
):
    | ((
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: AddEventListenerOptions | boolean
      ) => void)
    | undefined {
    return scope.getAddEventListener?.() ?? scope.addEventListener;
}

function isRendererScope(scope: RenderChartStartupRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

export function getRenderChartStartupRuntime(
    scope: RenderChartStartupRuntimeScope = defaultRenderChartStartupRuntimeScope
): RenderChartStartupRuntime {
    return {
        addDOMContentLoadedListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            const addEventListener = getAddEventListener(scope);
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
                isRendererScope(scope) &&
                typeof getAddEventListener(scope) === "function"
            );
        },
    };
}

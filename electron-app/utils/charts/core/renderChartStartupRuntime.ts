import {
    getBrowserAddEventListener,
    getBrowserDocument,
} from "../../runtime/browserRuntime.js";

type RenderChartStartupAddEventListener = (
    type: string,
    listener: RenderChartStartupListener,
    options?: Readonly<AddEventListenerOptions> | boolean
) => void;

type RenderChartStartupListener = EventListener | Readonly<EventListenerObject>;

type RenderChartStartupListenerOptions = Readonly<
    AddEventListenerOptions & { readonly signal: AbortSignal }
>;

export interface RenderChartStartupRuntimeScope {
    readonly getAddEventListener?:
        | (() => RenderChartStartupAddEventListener | undefined)
        | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
}

export interface RenderChartStartupRuntime {
    addDOMContentLoadedListener: (
        listener: RenderChartStartupListener,
        options: RenderChartStartupListenerOptions
    ) => void;
    canRegisterDOMContentLoadedListener: () => boolean;
}

const defaultRenderChartStartupRuntimeScope: RenderChartStartupRuntimeScope = {
    getAddEventListener: getBrowserAddEventListener,
    isRendererScope: () => getBrowserDocument() !== undefined,
};

function getAddEventListener(
    scope: RenderChartStartupRuntimeScope
): RenderChartStartupAddEventListener | undefined {
    return scope.getAddEventListener?.();
}

function isRendererScope(scope: RenderChartStartupRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

export function getRenderChartStartupRuntime(
    scope: RenderChartStartupRuntimeScope = defaultRenderChartStartupRuntimeScope
): RenderChartStartupRuntime {
    return {
        addDOMContentLoadedListener(
            listener: RenderChartStartupListener,
            options: RenderChartStartupListenerOptions
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

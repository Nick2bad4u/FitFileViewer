export interface RenderSummaryRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
}

export interface RenderSummaryRuntime {
    readonly addResizeListener: (
        listener: Readonly<EventListener>,
        options?: Readonly<AddEventListenerOptions>
    ) => void;
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly createAbortController: () => AbortController;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
}

const defaultRenderSummaryRuntimeScope: RenderSummaryRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getAddEventListener: () => globalThis.addEventListener,
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
};

function getScopeAbortController(
    scope: RenderSummaryRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeAddEventListener(
    scope: RenderSummaryRuntimeScope
): typeof globalThis.addEventListener | undefined {
    return scope.getAddEventListener?.();
}

function getScopeCancelAnimationFrame(
    scope: RenderSummaryRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeRequestAnimationFrame(
    scope: RenderSummaryRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

export function getRenderSummaryRuntime(
    scope: RenderSummaryRuntimeScope = defaultRenderSummaryRuntimeScope
): RenderSummaryRuntime {
    return {
        addResizeListener(
            listener: Readonly<EventListener>,
            options?: Readonly<AddEventListenerOptions>
        ): void {
            const addEventListenerRef = getScopeAddEventListener(scope);
            addEventListenerRef?.call(
                scope,
                "resize",
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM listener registration requires the mutable EventListener shape at this adapter boundary.
                listener as EventListener,
                options
            );
        },
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderSummary requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return null;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
    };
}

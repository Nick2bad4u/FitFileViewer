export interface RenderSummaryRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly addEventListener?:
        | typeof globalThis.addEventListener
        | undefined;
    readonly cancelAnimationFrame?:
        | typeof globalThis.cancelAnimationFrame
        | undefined;
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
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
}

export interface RenderSummaryRuntime {
    addResizeListener(
        listener: EventListener,
        options?: AddEventListenerOptions
    ): void;
    cancelAnimationFrame(handle: number): void;
    createAbortController(): AbortController;
    requestAnimationFrame(callback: FrameRequestCallback): null | number;
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
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeAddEventListener(
    scope: RenderSummaryRuntimeScope
): typeof globalThis.addEventListener | undefined {
    return scope.getAddEventListener?.() ?? scope.addEventListener;
}

function getScopeCancelAnimationFrame(
    scope: RenderSummaryRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.() ?? scope.cancelAnimationFrame;
}

function getScopeRequestAnimationFrame(
    scope: RenderSummaryRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
}

export function getRenderSummaryRuntime(
    scope: RenderSummaryRuntimeScope = defaultRenderSummaryRuntimeScope
): RenderSummaryRuntime {
    return {
        addResizeListener(
            listener: EventListener,
            options?: AddEventListenerOptions
        ): void {
            const addEventListenerRef = getScopeAddEventListener(scope);
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Callers pass an AbortSignal option owned by the virtualized summary lifecycle.
            addEventListenerRef?.call(scope, "resize", listener, options);
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

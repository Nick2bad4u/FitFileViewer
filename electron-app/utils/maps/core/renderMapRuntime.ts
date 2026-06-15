export type RenderMapTimer = ReturnType<typeof globalThis.setTimeout>;

export interface RenderMapRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RenderMapRuntime {
    clearTimeout(timer: RenderMapTimer): void;
    createAbortController(): AbortController;
    requestAnimationFrame(frameCallback: FrameRequestCallback): void;
    setTimeout(callback: () => void, delayMs: number): RenderMapTimer;
}

function getScopeAbortController(
    scope: RenderMapRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getRequiredClearTimeout(
    scope: RenderMapRuntimeScope
): typeof globalThis.clearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.() ?? scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("renderMap requires a clearTimeout runtime");
    }

    return clearTimeoutRef;
}

function getScopeRequestAnimationFrame(
    scope: RenderMapRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
}

function getRequiredSetTimeout(
    scope: RenderMapRuntimeScope
): typeof globalThis.setTimeout {
    const setTimeoutRef = scope.getSetTimeout?.() ?? scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("renderMap requires a setTimeout runtime");
    }

    return setTimeoutRef;
}

const defaultRenderMapRuntimeScope: RenderMapRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getRenderMapRuntime(
    scope: RenderMapRuntimeScope = defaultRenderMapRuntimeScope
): RenderMapRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef.call(scope, timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderMap requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        requestAnimationFrame(frameCallback): void {
            const requestAnimationFrameRef = getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef === "function") {
                requestAnimationFrameRef.call(scope, frameCallback);
                return;
            }

            const setTimeoutRef = getRequiredSetTimeout(scope);
            setTimeoutRef.call(scope, () => frameCallback(0), 0);
        },
        setTimeout(callback, delayMs): RenderMapTimer {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef.call(scope, callback, delayMs);
        },
    };
}

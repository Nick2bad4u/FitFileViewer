export type RenderMapTimer = ReturnType<typeof globalThis.setTimeout>;

export interface RenderMapRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly requestAnimationFrame?:
        | typeof globalThis.requestAnimationFrame
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RenderMapRuntime {
    clearTimeout(timer: RenderMapTimer): void;
    requestAnimationFrame(frameCallback: FrameRequestCallback): void;
    setTimeout(callback: () => void, delayMs: number): RenderMapTimer;
}

export function getRenderMapRuntime(
    scope: RenderMapRuntimeScope = globalThis
): RenderMapRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        requestAnimationFrame(frameCallback): void {
            const requestAnimationFrameRef = scope.requestAnimationFrame;
            if (typeof requestAnimationFrameRef === "function") {
                requestAnimationFrameRef(frameCallback);
                return;
            }

            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            setTimeoutRef(() => frameCallback(0), 0);
        },
        setTimeout(callback, delayMs): RenderMapTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}

export type ChartHoverEffectsTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface ChartHoverEffectsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly document?: Document | undefined;
    readonly documentEventTarget?: Document | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
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
    addDocumentEventListener(
        eventName: string,
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions
    ): void;
    addDocumentKeydownListener(
        listener: (event: KeyboardEvent) => void,
        options: AddEventListenerOptions
    ): void;
    createAbortController(): AbortController;
    removeDocumentKeydownListener(
        listener: (event: KeyboardEvent) => void
    ): void;
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
): (callback: () => void, timeout: number) => ChartHoverEffectsTimerHandle {
    const setTimeoutRef = scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("chart hover effects require a setTimeout runtime");
    }

    return setTimeoutRef;
}

function getDocumentEventTarget(
    scope: ChartHoverEffectsRuntimeScope
): Document | undefined {
    return (
        scope.getDocumentEventTarget?.() ??
        scope.documentEventTarget ??
        scope.document
    );
}

function getRequiredDocumentEventTarget(
    scope: ChartHoverEffectsRuntimeScope
): Document {
    const documentEventTarget = getDocumentEventTarget(scope);
    if (!documentEventTarget) {
        throw new TypeError(
            "chart hover effects require a document event-target runtime"
        );
    }

    return documentEventTarget;
}

export function getChartHoverEffectsRuntime(
    scope: ChartHoverEffectsRuntimeScope = defaultChartHoverEffectsRuntimeScope
): ChartHoverEffectsRuntime {
    return {
        addDocumentEventListener(eventName, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            getRequiredDocumentEventTarget(scope).addEventListener(
                eventName,
                listener,
                options
            );
        },
        addDocumentKeydownListener(listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            getRequiredDocumentEventTarget(scope).addEventListener(
                "keydown",
                listener,
                options
            );
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "chart hover effects require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        removeDocumentKeydownListener(listener): void {
            getRequiredDocumentEventTarget(scope).removeEventListener(
                "keydown",
                listener
            );
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

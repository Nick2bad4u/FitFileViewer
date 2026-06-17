export type ChartHoverEffectsTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type ChartHoverEffectsSetTimeout = (
    callback: () => void,
    timeout: number
) => ChartHoverEffectsTimerHandle;
type ChartHoverEffectsDocumentListener =
    | EventListener
    | Readonly<EventListenerObject>;
type ChartHoverEffectsKeydownListener = (
    event: Readonly<KeyboardEvent>
) => void;

export interface ChartHoverEffectsRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => ChartHoverEffectsSetTimeout | undefined)
        | undefined;
}

export interface ChartHoverEffectsRuntime {
    readonly addDocumentEventListener: (
        eventName: string,
        listener: ChartHoverEffectsDocumentListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly addDocumentKeydownListener: (
        listener: ChartHoverEffectsKeydownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    readonly createAbortController: () => AbortController;
    readonly removeDocumentKeydownListener: (
        listener: ChartHoverEffectsKeydownListener
    ) => void;
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => ChartHoverEffectsTimerHandle;
    readonly waitForAnimationFrame: () => Promise<void>;
}

const defaultChartHoverEffectsRuntimeScope: ChartHoverEffectsRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocumentEventTarget: () => globalThis.document,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getSetTimeout: () => globalThis.setTimeout,
};

function getRequiredSetTimeout(
    scope: ChartHoverEffectsRuntimeScope
): ChartHoverEffectsSetTimeout {
    const setTimeoutRef = scope.getSetTimeout?.();
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError("chart hover effects require a setTimeout runtime");
    }

    return setTimeoutRef;
}

function getDocumentEventTarget(
    scope: ChartHoverEffectsRuntimeScope
): Document | undefined {
    return scope.getDocumentEventTarget?.();
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
            const AbortControllerConstructor = scope.getAbortController?.();
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
            const requestAnimationFrameRef = scope.getRequestAnimationFrame?.();
            if (typeof requestAnimationFrameRef !== "function") {
                const fallbackFrameTime = Number("0");
                callback(fallbackFrameTime);
                return null;
            }

            return requestAnimationFrameRef(callback);
        },
        setTimeout(callback, timeout): ChartHoverEffectsTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, timeout);
        },
        async waitForAnimationFrame(): Promise<void> {
            await new Promise<void>((resolve) => {
                const requestAnimationFrameRef =
                    scope.getRequestAnimationFrame?.();
                if (typeof requestAnimationFrameRef === "function") {
                    requestAnimationFrameRef(() => {
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

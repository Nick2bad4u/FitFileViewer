export interface EventListenerManagerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly window?: EventTarget | undefined;
}

export interface EventListenerManagerRuntime {
    createAbortController(): AbortController;
    getDefaultEventTarget(): EventTarget | undefined;
}

const defaultEventListenerManagerRuntimeScope: EventListenerManagerRuntimeScope =
    globalThis;

export function getEventListenerManagerRuntime(
    scope: EventListenerManagerRuntimeScope = defaultEventListenerManagerRuntimeScope
): EventListenerManagerRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "event listener manager requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getDefaultEventTarget(): EventTarget | undefined {
            return scope.window;
        },
    };
}

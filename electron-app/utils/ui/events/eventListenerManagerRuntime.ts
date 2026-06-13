export interface EventListenerManagerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface EventListenerManagerRuntime {
    createAbortController(): AbortController;
}

export function getEventListenerManagerRuntime(
    scope: EventListenerManagerRuntimeScope = globalThis
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
    };
}

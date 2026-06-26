import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserEventTarget,
} from "../../runtime/browserRuntime.js";

export interface EventListenerManagerRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getEventTarget?: (() => EventTarget | undefined) | undefined;
}

export interface EventListenerManagerRuntime {
    createAbortController: () => AbortController;
    getDefaultEventTarget: () => EventTarget | undefined;
}

const defaultEventListenerManagerRuntimeScope: EventListenerManagerRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getEventTarget: getBrowserEventTarget,
    };

function getAbortController(
    scope: EventListenerManagerRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getEventTarget(
    scope: EventListenerManagerRuntimeScope
): EventTarget | undefined {
    return scope.getEventTarget?.();
}

export function getEventListenerManagerRuntime(
    scope: EventListenerManagerRuntimeScope = defaultEventListenerManagerRuntimeScope
): EventListenerManagerRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "event listener manager requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getDefaultEventTarget(): EventTarget | undefined {
            return getEventTarget(scope);
        },
    };
}

import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserEventTarget,
} from "../../runtime/browserRuntime.js";

export interface EventListenerManagerRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getEventTarget: (() => EventTarget | undefined) | undefined;
}

export interface EventListenerManagerRuntime {
    createAbortController: () => AbortController;
    getDefaultDragDropTarget: () => EventTarget | undefined;
}

const defaultEventListenerManagerRuntimeScope: EventListenerManagerRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getEventTarget: getBrowserEventTarget,
    };

function getAbortController(
    scope: EventListenerManagerRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    const getAbortControllerProvider = scope.getAbortController;
    if (typeof getAbortControllerProvider !== "function") {
        throw new TypeError(
            "event listener manager requires an AbortController provider"
        );
    }

    return getAbortControllerProvider();
}

function getEventTarget(
    scope: EventListenerManagerRuntimeScope
): EventTarget | undefined {
    const getEventTargetProvider = scope.getEventTarget;
    if (typeof getEventTargetProvider !== "function") {
        throw new TypeError(
            "event listener manager requires an event target provider"
        );
    }

    return getEventTargetProvider();
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
        getDefaultDragDropTarget(): EventTarget | undefined {
            return getEventTarget(scope);
        },
    };
}

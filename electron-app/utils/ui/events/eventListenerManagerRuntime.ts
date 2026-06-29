import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserEventTarget,
} from "../../runtime/browserRuntime.js";

export interface EventListenerManagerRuntimeScope {
    readonly getAbortController: EventListenerManagerRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getEventTarget: EventListenerManagerRuntimeProvider<EventTarget>;
}

type EventListenerManagerRuntimeProvider<T> = (() => T | undefined) | undefined;

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
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getEventTarget(
    scope: EventListenerManagerRuntimeScope
): EventTarget | undefined {
    return getRequiredProvider(scope.getEventTarget, "event target")();
}

function getRequiredProvider<T>(
    provider: EventListenerManagerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `event listener manager requires ${article} ${providerName} provider`
        );
    }

    return provider;
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

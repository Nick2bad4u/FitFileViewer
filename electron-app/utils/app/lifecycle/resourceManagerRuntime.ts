import {
    type BrowserAbortControllerConstructor,
    type BrowserClearInterval,
    type BrowserClearTimeout,
    type BrowserIntervalHandle,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearInterval,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserEventTarget,
} from "../../runtime/browserRuntime.js";

type ResourceManagerEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

export interface ResourceManagerRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearInterval?:
        | (() => BrowserClearInterval | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getEventTarget?:
        | (() => ResourceManagerEventTarget | undefined)
        | undefined;
}

export type ResourceManagerInterval = BrowserIntervalHandle;
export type ResourceManagerTimer = BrowserTimerHandle;

const defaultResourceManagerRuntimeScope: ResourceManagerRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearInterval: getBrowserClearInterval,
    getClearTimeout: getBrowserClearTimeout,
    getDateNow: getBrowserDateNow,
    getEventTarget: getBrowserEventTarget,
};

function getAbortController(
    scope: ResourceManagerRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getClearTimeout(
    scope: ResourceManagerRuntimeScope
): BrowserClearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getClearInterval(
    scope: ResourceManagerRuntimeScope
): BrowserClearInterval | undefined {
    return scope.getClearInterval?.();
}

function getRequiredDateNow(scope: ResourceManagerRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("resourceManager requires dateNow");
    }

    return dateNow;
}

function getEventTarget(
    scope: ResourceManagerRuntimeScope
): ResourceManagerEventTarget | undefined {
    return scope.getEventTarget?.();
}

export function clearResourceManagerInterval(
    intervalId: ResourceManagerInterval,
    scope: ResourceManagerRuntimeScope = defaultResourceManagerRuntimeScope
): void {
    const clearIntervalRef = getClearInterval(scope);
    if (typeof clearIntervalRef !== "function") {
        throw new TypeError("resourceManager requires clearInterval");
    }

    clearIntervalRef(intervalId);
}

export function clearResourceManagerTimer(
    timerId: ResourceManagerTimer,
    scope: ResourceManagerRuntimeScope = defaultResourceManagerRuntimeScope
): void {
    const clearTimeoutRef = getClearTimeout(scope);
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("resourceManager requires clearTimeout");
    }

    clearTimeoutRef(timerId);
}

export function getResourceManagerDateNow(
    scope: ResourceManagerRuntimeScope = defaultResourceManagerRuntimeScope
): number {
    return getRequiredDateNow(scope)();
}

export function registerResourceManagerUnloadCleanup(
    cleanup: () => void,
    scope: ResourceManagerRuntimeScope = defaultResourceManagerRuntimeScope
): (() => void) | null {
    const eventTarget = getEventTarget(scope);
    if (typeof eventTarget?.addEventListener !== "function") {
        return null;
    }

    const Controller = getAbortController(scope);
    const abortController =
        typeof Controller === "function" ? new Controller() : null;
    const listener = (): void => {
        cleanup();
        abortController?.abort();
        eventTarget.removeEventListener("beforeunload", listener);
    };

    // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Cleanup is exposed through AbortSignal when available and the returned unregister callback.
    eventTarget.addEventListener(
        "beforeunload",
        listener,
        abortController === null
            ? undefined
            : { signal: abortController.signal }
    );

    return (): void => {
        eventTarget.removeEventListener("beforeunload", listener);
        abortController?.abort();
    };
}

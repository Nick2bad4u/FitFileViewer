type ResourceManagerEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

export interface ResourceManagerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getEventTarget?:
        | (() => ResourceManagerEventTarget | undefined)
        | undefined;
}

export type ResourceManagerTimer = ReturnType<typeof globalThis.setTimeout>;

const defaultResourceManagerRuntimeScope: ResourceManagerRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getEventTarget: () => globalThis,
};

function getAbortController(
    scope: ResourceManagerRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getClearTimeout(
    scope: ResourceManagerRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getEventTarget(
    scope: ResourceManagerRuntimeScope
): ResourceManagerEventTarget | undefined {
    return scope.getEventTarget?.();
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

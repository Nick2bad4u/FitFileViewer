type WindowListenerTarget = {
    readonly addEventListener: Window["addEventListener"];
    readonly removeEventListener?: Window["removeEventListener"];
};

export interface ResourceManagerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly window?: WindowListenerTarget | undefined;
}

export type ResourceManagerTimer = ReturnType<typeof globalThis.setTimeout>;

const defaultResourceManagerRuntimeScope: ResourceManagerRuntimeScope =
    globalThis;

export function clearResourceManagerTimer(
    timerId: ResourceManagerTimer,
    scope: ResourceManagerRuntimeScope = defaultResourceManagerRuntimeScope
): void {
    const clearTimeoutRef = scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError("resourceManager requires clearTimeout");
    }

    clearTimeoutRef(timerId);
}

export function registerResourceManagerUnloadCleanup(
    cleanup: () => void,
    scope: ResourceManagerRuntimeScope = defaultResourceManagerRuntimeScope
): (() => void) | null {
    if (typeof scope.window?.addEventListener !== "function") {
        return null;
    }

    const Controller = scope.AbortController;
    const abortController =
        typeof Controller === "function" ? new Controller() : null;
    const listener = (): void => {
        cleanup();
        abortController?.abort();
        scope.window?.removeEventListener?.("beforeunload", listener);
    };

    // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Cleanup is exposed through AbortSignal when available and the returned unregister callback.
    scope.window.addEventListener(
        "beforeunload",
        listener,
        abortController === null
            ? undefined
            : { signal: abortController.signal }
    );

    return (): void => {
        scope.window?.removeEventListener?.("beforeunload", listener);
        abortController?.abort();
    };
}

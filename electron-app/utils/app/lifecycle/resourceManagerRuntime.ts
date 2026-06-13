type WindowListenerTarget = Pick<Window, "addEventListener">;

export interface ResourceManagerRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly window?: WindowListenerTarget | undefined;
}

export function registerResourceManagerUnloadCleanup(
    cleanup: () => void,
    scope: ResourceManagerRuntimeScope = globalThis
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
    };

    scope.window.addEventListener(
        "beforeunload",
        listener,
        abortController === null
            ? undefined
            : { signal: abortController.signal }
    );

    return (): void => {
        abortController?.abort();
    };
}

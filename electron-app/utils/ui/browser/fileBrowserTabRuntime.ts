export interface FileBrowserTabRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface FileBrowserTabRuntime {
    createAbortController: () => AbortController;
}

const defaultFileBrowserTabRuntimeScope: FileBrowserTabRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
};

function getAbortControllerConstructor(
    scope: FileBrowserTabRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getFileBrowserTabRuntime(
    scope: FileBrowserTabRuntimeScope = defaultFileBrowserTabRuntimeScope
): FileBrowserTabRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
    };
}

export interface FileBrowserTabRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface FileBrowserTabRuntime {
    createAbortController: () => AbortController;
}

const defaultFileBrowserTabRuntimeScope: FileBrowserTabRuntimeScope =
    globalThis;

function getAbortControllerConstructor(
    scope: FileBrowserTabRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
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

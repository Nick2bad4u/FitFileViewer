export interface MainUiDomUtilsRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface MainUiDomUtilsRuntime {
    createAbortController(): AbortController;
}

export function getMainUiDomUtilsRuntime(
    scope: MainUiDomUtilsRuntimeScope = globalThis
): MainUiDomUtilsRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "main UI DOM utilities require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}

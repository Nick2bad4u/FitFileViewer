export interface DomHelpersRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface DomHelpersRuntime {
    createAbortController: () => AbortController;
}

const defaultDomHelpersRuntimeScope: DomHelpersRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
};

function getScopeAbortController(
    scope: DomHelpersRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

export function getDomHelpersRuntime(
    scope: DomHelpersRuntimeScope = defaultDomHelpersRuntimeScope
): DomHelpersRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "dom helpers require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}

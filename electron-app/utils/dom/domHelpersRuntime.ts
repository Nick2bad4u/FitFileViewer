export interface DomHelpersRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface DomHelpersRuntime {
    createAbortController(): AbortController;
}

export function getDomHelpersRuntime(
    scope: DomHelpersRuntimeScope = globalThis
): DomHelpersRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "dom helpers require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}

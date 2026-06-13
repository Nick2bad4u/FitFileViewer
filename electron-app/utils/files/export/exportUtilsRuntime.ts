export interface ExportUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
}

export interface ExportUtilsRuntime {
    createAbortController: () => AbortController;
}

export function getExportUtilsRuntime(
    scope: ExportUtilsRuntimeScope = globalThis
): ExportUtilsRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "exportUtils requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}

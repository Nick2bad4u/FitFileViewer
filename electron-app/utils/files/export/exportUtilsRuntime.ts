export interface ExportUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly window?: Pick<Window, "confirm"> | undefined;
}

export interface ExportUtilsRuntime {
    confirmDangerousAction: (message: string) => boolean;
    createAbortController: () => AbortController;
}

export function getExportUtilsRuntime(
    scope: ExportUtilsRuntimeScope = globalThis
): ExportUtilsRuntime {
    return {
        confirmDangerousAction(message: string): boolean {
            return scope.window?.confirm(message) ?? false;
        },

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

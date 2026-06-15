export interface ExportUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getWindow?:
        | (() => Pick<Window, "confirm" | "open"> | undefined)
        | undefined;
    readonly window?: Pick<Window, "confirm" | "open"> | undefined;
}

export interface ExportUtilsRuntime {
    confirmDangerousAction: (message: string) => boolean;
    createAbortController: () => AbortController;
    openPrintWindow: (
        url?: string | URL,
        target?: string,
        features?: string
    ) => Window | null;
}

const defaultExportUtilsRuntimeScope: ExportUtilsRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getWindow: () => globalThis.window,
};

function getScopeAbortController(
    scope: ExportUtilsRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeWindow(
    scope: ExportUtilsRuntimeScope
): Pick<Window, "confirm" | "open"> | undefined {
    return scope.getWindow?.() ?? scope.window;
}

export function getExportUtilsRuntime(
    scope: ExportUtilsRuntimeScope = defaultExportUtilsRuntimeScope
): ExportUtilsRuntime {
    return {
        confirmDangerousAction(message: string): boolean {
            const runtimeWindow = getScopeWindow(scope);
            return runtimeWindow?.confirm(message) ?? false;
        },

        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "exportUtils requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },

        openPrintWindow(url, target, features): Window | null {
            const runtimeWindow = getScopeWindow(scope);
            return runtimeWindow?.open(url, target, features) ?? null;
        },
    };
}

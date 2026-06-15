type ConfirmDangerousActionFunction = (message?: string) => boolean;

type OpenPrintWindowFunction = (
    url?: string | URL,
    target?: string,
    features?: string
) => Window | null;

export interface ExportUtilsRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly confirmDangerousAction?:
        | ConfirmDangerousActionFunction
        | undefined;
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getConfirmDangerousAction?:
        | (() => ConfirmDangerousActionFunction | undefined)
        | undefined;
    readonly getOpenPrintWindow?:
        | (() => OpenPrintWindowFunction | undefined)
        | undefined;
    readonly openPrintWindow?: OpenPrintWindowFunction | undefined;
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

const browserGlobal = globalThis as typeof globalThis & {
    confirm?: ConfirmDangerousActionFunction | undefined;
    open?: OpenPrintWindowFunction | undefined;
};

const defaultExportUtilsRuntimeScope: ExportUtilsRuntimeScope = {
    getConfirmDangerousAction: () => (message) =>
        browserGlobal.confirm?.(message) ?? false,
    getAbortController: () => globalThis.AbortController,
    getOpenPrintWindow: () => (url, target, features) =>
        browserGlobal.open?.(url, target, features) ?? null,
};

function getScopeAbortController(
    scope: ExportUtilsRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeConfirmDangerousAction(
    scope: ExportUtilsRuntimeScope
): ConfirmDangerousActionFunction | undefined {
    return scope.getConfirmDangerousAction?.() ?? scope.confirmDangerousAction;
}

function getScopeOpenPrintWindow(
    scope: ExportUtilsRuntimeScope
): OpenPrintWindowFunction | undefined {
    return scope.getOpenPrintWindow?.() ?? scope.openPrintWindow;
}

export function getExportUtilsRuntime(
    scope: ExportUtilsRuntimeScope = defaultExportUtilsRuntimeScope
): ExportUtilsRuntime {
    return {
        confirmDangerousAction(message: string): boolean {
            const confirmDangerousAction =
                getScopeConfirmDangerousAction(scope);
            return confirmDangerousAction?.(message) ?? false;
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
            const openPrintWindow = getScopeOpenPrintWindow(scope);
            return openPrintWindow?.(url, target, features) ?? null;
        },
    };
}

export interface LoadOverlayFilesRuntimeScope {
    readonly getNavigator?:
        | (() => Pick<Navigator, "hardwareConcurrency"> | undefined)
        | undefined;
}

export interface LoadOverlayFilesRuntime {
    getHardwareConcurrency: () => number | undefined;
}

const defaultLoadOverlayFilesRuntimeScope: LoadOverlayFilesRuntimeScope = {
    getNavigator: () => globalThis.navigator,
};

export function getLoadOverlayFilesRuntime(
    scope: LoadOverlayFilesRuntimeScope = defaultLoadOverlayFilesRuntimeScope
): LoadOverlayFilesRuntime {
    return {
        getHardwareConcurrency(): number | undefined {
            try {
                return scope.getNavigator?.()?.hardwareConcurrency;
            } catch {
                return undefined;
            }
        },
    };
}

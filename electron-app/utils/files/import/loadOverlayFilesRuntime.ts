export interface LoadOverlayFilesRuntimeScope {
    readonly navigator?: Pick<Navigator, "hardwareConcurrency"> | undefined;
}

export interface LoadOverlayFilesRuntime {
    getHardwareConcurrency: () => number | undefined;
}

const defaultLoadOverlayFilesRuntimeScope: LoadOverlayFilesRuntimeScope =
    globalThis;

export function getLoadOverlayFilesRuntime(
    scope: LoadOverlayFilesRuntimeScope = defaultLoadOverlayFilesRuntimeScope
): LoadOverlayFilesRuntime {
    return {
        getHardwareConcurrency(): number | undefined {
            try {
                return scope.navigator?.hardwareConcurrency;
            } catch {
                return undefined;
            }
        },
    };
}

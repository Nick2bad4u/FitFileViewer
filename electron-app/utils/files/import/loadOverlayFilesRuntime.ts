export interface LoadOverlayFilesRuntimeScope {
    readonly navigator?: Pick<Navigator, "hardwareConcurrency"> | undefined;
}

export interface LoadOverlayFilesRuntime {
    getHardwareConcurrency: () => number | undefined;
}

export function getLoadOverlayFilesRuntime(
    scope: LoadOverlayFilesRuntimeScope = globalThis
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

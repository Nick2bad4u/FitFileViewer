export interface LoadOverlayFilesRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getNavigator?:
        | (() => Pick<Navigator, "hardwareConcurrency"> | undefined)
        | undefined;
}

export interface LoadOverlayFilesRuntime {
    getActiveTabButton: () => HTMLElement | null;
    getHardwareConcurrency: () => number | undefined;
}

const defaultLoadOverlayFilesRuntimeScope: LoadOverlayFilesRuntimeScope = {
    getDocument: () => globalThis.document,
    getNavigator: () => globalThis.navigator,
};

export function getLoadOverlayFilesRuntime(
    scope: LoadOverlayFilesRuntimeScope = defaultLoadOverlayFilesRuntimeScope
): LoadOverlayFilesRuntime {
    return {
        getActiveTabButton(): HTMLElement | null {
            const documentRef = scope.getDocument?.();
            if (!documentRef) {
                return null;
            }
            return documentRef.querySelector<HTMLElement>(
                ".tab-button.active"
            );
        },
        getHardwareConcurrency(): number | undefined {
            try {
                return scope.getNavigator?.()?.hardwareConcurrency;
            } catch {
                return undefined;
            }
        },
    };
}

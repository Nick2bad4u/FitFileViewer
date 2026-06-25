export interface InitStartupRuntimeScope {
    readonly getDocumentTarget?: (() => EventTarget | undefined) | undefined;
}

export interface InitStartupRuntime {
    getDocumentTarget: () => EventTarget | undefined;
}

const defaultInitStartupRuntimeScope: InitStartupRuntimeScope = {
    getDocumentTarget: () => globalThis.document,
};

function getDocumentTarget(
    scope: InitStartupRuntimeScope
): EventTarget | undefined {
    return scope.getDocumentTarget?.();
}

export function getInitStartupRuntime(
    scope: InitStartupRuntimeScope = defaultInitStartupRuntimeScope
): InitStartupRuntime {
    return {
        getDocumentTarget(): EventTarget | undefined {
            return getDocumentTarget(scope);
        },
    };
}

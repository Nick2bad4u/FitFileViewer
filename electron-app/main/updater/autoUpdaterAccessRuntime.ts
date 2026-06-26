export interface AutoUpdaterAccessRuntimeScope {
    readonly getVitestImportMockCandidate?: (() => unknown) | undefined;
}

export interface AutoUpdaterAccessRuntime {
    getVitestImportMockCandidate: () => unknown;
}

const defaultAutoUpdaterAccessRuntimeScope: AutoUpdaterAccessRuntimeScope = {
    getVitestImportMockCandidate: () => getRuntimeProperty(globalThis, "vi"),
};

export function getAutoUpdaterAccessRuntime(
    scope: AutoUpdaterAccessRuntimeScope = defaultAutoUpdaterAccessRuntimeScope
): AutoUpdaterAccessRuntime {
    return {
        getVitestImportMockCandidate(): unknown {
            return scope.getVitestImportMockCandidate?.();
        },
    };
}

function getRuntimeProperty(target: object, propertyKey: string): unknown {
    try {
        return Reflect.get(target, propertyKey);
    } catch {
        return undefined;
    }
}

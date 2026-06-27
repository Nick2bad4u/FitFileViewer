import { getBrowserVitestImportMockCandidate } from "../../utils/runtime/browserRuntime.js";

export interface AutoUpdaterAccessRuntimeScope {
    readonly getVitestImportMockCandidate?: (() => unknown) | undefined;
}

export interface AutoUpdaterAccessRuntime {
    getVitestImportMockCandidate: () => unknown;
}

const defaultAutoUpdaterAccessRuntimeScope: AutoUpdaterAccessRuntimeScope = {
    getVitestImportMockCandidate: getBrowserVitestImportMockCandidate,
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

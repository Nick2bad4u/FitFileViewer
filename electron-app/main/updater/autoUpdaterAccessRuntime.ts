import { getBrowserVitestImportMockCandidate } from "../../utils/runtime/browserRuntime.js";

export interface AutoUpdaterAccessRuntimeScope {
    readonly getVitestImportMockCandidate: AutoUpdaterAccessRuntimeProvider<unknown>;
}

export interface AutoUpdaterAccessRuntime {
    getVitestImportMockCandidate: () => unknown;
}

type AutoUpdaterAccessRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultAutoUpdaterAccessRuntimeScope: AutoUpdaterAccessRuntimeScope = {
    getVitestImportMockCandidate: getBrowserVitestImportMockCandidate,
};

export function getAutoUpdaterAccessRuntime(
    scope: AutoUpdaterAccessRuntimeScope = defaultAutoUpdaterAccessRuntimeScope
): AutoUpdaterAccessRuntime {
    const getVitestImportMockCandidate = getRequiredProvider(
        scope.getVitestImportMockCandidate,
        "Vitest import mock candidate"
    );

    return {
        getVitestImportMockCandidate(): unknown {
            return getVitestImportMockCandidate();
        },
    };
}

function getRequiredProvider<T>(
    provider: AutoUpdaterAccessRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `autoUpdaterAccessRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

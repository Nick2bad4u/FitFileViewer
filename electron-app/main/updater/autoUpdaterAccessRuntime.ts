import { getBrowserVitestImportMockCandidate } from "../../utils/runtime/browserRuntime.js";
import { isTestEnvironment as isRuntimeTestEnvironment } from "../../utils/runtime/processEnvironment.js";

export interface AutoUpdaterAccessRuntimeScope {
    readonly getIsTestEnvironment: AutoUpdaterAccessRuntimeProvider<
        () => boolean
    >;
    readonly getVitestImportMockCandidate: AutoUpdaterAccessRuntimeProvider<unknown>;
}

export interface AutoUpdaterAccessRuntime {
    getVitestImportMockCandidate: () => unknown;
    isTestEnvironment: () => boolean;
}

type AutoUpdaterAccessRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultAutoUpdaterAccessRuntimeScope: AutoUpdaterAccessRuntimeScope = {
    getIsTestEnvironment: () => isRuntimeTestEnvironment,
    getVitestImportMockCandidate: getBrowserVitestImportMockCandidate,
};

export function getAutoUpdaterAccessRuntime(
    scope: AutoUpdaterAccessRuntimeScope = defaultAutoUpdaterAccessRuntimeScope
): AutoUpdaterAccessRuntime {
    const getVitestImportMockCandidate = getRequiredProvider(
        scope.getVitestImportMockCandidate,
        "Vitest import mock candidate"
    );
    const isTestEnvironment = getRequiredProvider(
        scope.getIsTestEnvironment,
        "test environment"
    );

    return {
        getVitestImportMockCandidate(): unknown {
            return getVitestImportMockCandidate();
        },
        isTestEnvironment(): boolean {
            const isTestRuntime = isTestEnvironment();
            if (typeof isTestRuntime !== "function") {
                throw new TypeError(
                    "autoUpdaterAccessRuntime requires a test environment runtime"
                );
            }

            return isTestRuntime();
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

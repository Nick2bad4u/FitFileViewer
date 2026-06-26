import type { ElectronAPI } from "../../shared/preloadApi.js";

import { getBrowserGlobalProperty } from "./browserRuntime.js";

export type RendererElectronApiScope = {
    readonly getElectronAPI?: (() => unknown) | undefined;
};

export type RendererElectronApiCandidate = object;

/**
 * Resolves the preload-exposed Electron API through a single typed boundary.
 */
export function getRendererElectronApi<
    T extends RendererElectronApiCandidate = Partial<ElectronAPI>,
>(
    isExpectedApi: (value: unknown) => value is T,
    scope?: RendererElectronApiScope
): T | null {
    const api = getScopeElectronApi(scope);

    if (api === null || typeof api !== "object") {
        return null;
    }

    return isExpectedApi(api) ? api : null;
}

export function getBrowserElectronApiCandidate(): unknown {
    return getBrowserGlobalProperty("electronAPI");
}

function getScopeElectronApi(
    scope: RendererElectronApiScope | undefined
): unknown {
    return scope?.getElectronAPI?.();
}

import { getBrowserElectronApiCandidate } from "./browserRuntime.js";

export type RendererElectronApiScope = {
    readonly getElectronAPI?: (() => unknown) | undefined;
};

export type RendererElectronApiCandidate = object;
export type RendererElectronApiProvider = () => unknown;

export function createRendererElectronApiScope(
    getElectronAPI: RendererElectronApiProvider
): RendererElectronApiScope {
    return { getElectronAPI };
}

/**
 * Resolves the preload-exposed Electron API through a single typed boundary.
 */
export function getRendererElectronApi<
    T extends RendererElectronApiCandidate = RendererElectronApiCandidate,
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

function getScopeElectronApi(
    scope: RendererElectronApiScope | undefined
): unknown {
    return scope?.getElectronAPI?.() ?? getBrowserElectronApiCandidate();
}

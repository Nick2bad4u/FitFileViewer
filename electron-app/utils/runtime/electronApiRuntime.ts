export type RendererElectronApiScope = {
    readonly getElectronAPI: () => unknown;
};

export type RendererElectronApiProvider = () => unknown;

export function createRendererElectronApiScope(
    getElectronAPI: RendererElectronApiProvider
): RendererElectronApiScope {
    const electronAPI = getElectronAPI();
    return { getElectronAPI: () => electronAPI };
}

/**
 * Resolves the preload-exposed Electron API through a single typed boundary.
 */
export function getRendererElectronApi<T extends object = object>(
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
    return scope?.getElectronAPI();
}

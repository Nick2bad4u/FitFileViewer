import type { ElectronAPI } from "../../shared/preloadApi.js";

export type RendererElectronApiScope = {
    readonly getElectronAPI?: (() => unknown) | undefined;
};

export type RendererElectronApiCandidate = object;

let registeredRendererElectronApi: unknown;
let hasRegisteredRendererElectronApi = false;

const defaultRendererElectronApiScope: RendererElectronApiScope = {
    getElectronAPI: () => Reflect.get(globalThis, "electronAPI"),
};

export function registerRendererElectronApiCandidate(api: unknown): void {
    if (api === undefined) {
        resetRendererElectronApiCandidate();
        return;
    }

    registeredRendererElectronApi = api;
    hasRegisteredRendererElectronApi = true;
}

export function resetRendererElectronApiCandidate(): void {
    registeredRendererElectronApi = undefined;
    hasRegisteredRendererElectronApi = false;
}

/**
 * Resolves the preload-exposed Electron API through a single typed boundary.
 */
export function getRendererElectronApi<
    T extends RendererElectronApiCandidate = Partial<ElectronAPI>,
>(
    isExpectedApi: (value: unknown) => value is T,
    scope: RendererElectronApiScope = defaultRendererElectronApiScope
): T | null {
    const scopedElectronApi = getScopeElectronApi(scope);
    const api = hasRegisteredRendererElectronApi
        ? registeredRendererElectronApi
        : scopedElectronApi;

    if (api === null || typeof api !== "object") {
        return null;
    }

    return isExpectedApi(api) ? api : null;
}

function getScopeElectronApi(scope: RendererElectronApiScope): unknown {
    return scope.getElectronAPI?.();
}

import type { ElectronAPI } from "../../shared/preloadApi.js";

export type RendererElectronApiScope = {
    readonly electronAPI?: unknown;
    readonly window?: unknown;
};

export type RendererElectronApiCandidate = object;

let registeredRendererElectronApi: unknown;
let hasRegisteredRendererElectronApi = false;

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
    scope: RendererElectronApiScope = globalThis
): T | null {
    const api = hasRegisteredRendererElectronApi
        ? registeredRendererElectronApi
        : (scope.electronAPI ?? getWindowElectronApi(scope.window));

    if (api === null || typeof api !== "object") {
        return null;
    }

    return isExpectedApi(api) ? api : null;
}

function getWindowElectronApi(windowValue: unknown): unknown {
    if (windowValue === null || typeof windowValue !== "object") {
        return undefined;
    }

    return (windowValue as { readonly electronAPI?: unknown }).electronAPI;
}

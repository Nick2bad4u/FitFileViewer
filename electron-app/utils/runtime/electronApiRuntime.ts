import type { ElectronAPI } from "../../shared/preloadApi.js";

export type RendererElectronApiScope = {
    readonly electronAPI?: unknown;
    readonly getElectronAPI?: (() => unknown) | undefined;
    readonly getWindow?: (() => unknown) | undefined;
    readonly window?: unknown;
};

export type RendererElectronApiCandidate = object;

let registeredRendererElectronApi: unknown;
let hasRegisteredRendererElectronApi = false;

const defaultRendererElectronApiScope: RendererElectronApiScope = {
    getElectronAPI: () => Reflect.get(globalThis, "electronAPI"),
    getWindow: () => globalThis.window,
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
        : (scopedElectronApi ?? getWindowElectronApi(getScopeWindow(scope)));

    if (api === null || typeof api !== "object") {
        return null;
    }

    return isExpectedApi(api) ? api : null;
}

function getScopeElectronApi(scope: RendererElectronApiScope): unknown {
    return scope.getElectronAPI?.() ?? scope.electronAPI;
}

function getScopeWindow(scope: RendererElectronApiScope): unknown {
    return scope.getWindow?.() ?? scope.window;
}

function getWindowElectronApi(windowValue: unknown): unknown {
    if (windowValue === null || typeof windowValue !== "object") {
        return undefined;
    }

    return (windowValue as { readonly electronAPI?: unknown }).electronAPI;
}

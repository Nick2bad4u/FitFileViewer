import type { RendererRuntimeEnvironmentScope } from "./runtimeEnvironment.js";

type RendererRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

export function getBrowserRendererRuntimeEnvironmentScope(): RendererRuntimeEnvironmentScope {
    return {
        getAddEventListener: () => globalThis.addEventListener.bind(globalThis),
        getClearInterval: () => globalThis.clearInterval.bind(globalThis),
        getConsole: () => globalThis.console,
        getDocument: () => globalThis.document,
        getElectronApiCandidate: () =>
            (globalThis as RendererRuntimeGlobalScope).electronAPI,
        getRemoveEventListener: () =>
            globalThis.removeEventListener.bind(globalThis),
        getRendererEventTarget: () => globalThis,
        getSetInterval: () => globalThis.setInterval.bind(globalThis),
        getSetTimeout: () => globalThis.setTimeout.bind(globalThis),
    };
}

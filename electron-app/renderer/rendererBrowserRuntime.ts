import type {
    RendererRuntimeEnvironmentScope,
    RendererRuntimeEventTarget,
} from "./runtimeEnvironment.js";

type RendererRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

function getDefaultElectronApiCandidate(): unknown {
    const rendererScope = globalThis as RendererRuntimeGlobalScope;

    return rendererScope.electronAPI;
}

function getDefaultRendererEventTarget():
    | RendererRuntimeEventTarget
    | undefined {
    return globalThis;
}

export function getBrowserRendererRuntimeEnvironmentScope(): RendererRuntimeEnvironmentScope {
    return {
        getAddEventListener: () => globalThis.addEventListener.bind(globalThis),
        getClearInterval: () => globalThis.clearInterval.bind(globalThis),
        getConsole: () => globalThis.console,
        getDocument: () => globalThis.document,
        getElectronApiCandidate: getDefaultElectronApiCandidate,
        getRemoveEventListener: () =>
            globalThis.removeEventListener.bind(globalThis),
        getRendererEventTarget: getDefaultRendererEventTarget,
        getSetInterval: () => globalThis.setInterval.bind(globalThis),
        getSetTimeout: () => globalThis.setTimeout.bind(globalThis),
    };
}

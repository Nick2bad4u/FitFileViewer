import type { RendererRuntimeEnvironmentScope } from "./runtimeEnvironment.js";

type RendererRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

export function getBrowserRendererAbortController():
    | typeof globalThis.AbortController
    | undefined {
    return globalThis.AbortController;
}

export function getBrowserRendererAddEventListener():
    | typeof globalThis.addEventListener
    | undefined {
    return globalThis.addEventListener.bind(globalThis);
}

export function getBrowserRendererBoundClearTimeout():
    | typeof globalThis.clearTimeout
    | undefined {
    return globalThis.clearTimeout.bind(globalThis);
}

export function getBrowserRendererBoundSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return globalThis.setTimeout.bind(globalThis);
}

export function getBrowserRendererClearTimeout():
    | typeof globalThis.clearTimeout
    | undefined {
    return globalThis.clearTimeout;
}

export function getBrowserRendererCustomEvent():
    | typeof globalThis.CustomEvent
    | undefined {
    return globalThis.CustomEvent;
}

export function getBrowserRendererDateNow(): (() => number) | undefined {
    return Date.now;
}

export function deleteBrowserRendererGlobalProperty(
    property: PropertyKey
): boolean {
    return Reflect.deleteProperty(globalThis, property);
}

export function getBrowserRendererDocument(): Document | undefined {
    return globalThis.document;
}

export function getBrowserRendererEventTarget(): EventTarget | undefined {
    return globalThis;
}

export function getBrowserRendererHTMLScriptElement():
    | typeof globalThis.HTMLScriptElement
    | undefined {
    return globalThis.HTMLScriptElement;
}

export function getBrowserRendererHTMLElement():
    | typeof globalThis.HTMLElement
    | undefined {
    return globalThis.HTMLElement;
}

export function getBrowserRendererLocation(): Location | undefined {
    return globalThis.location;
}

export function getBrowserRendererNavigator(): Navigator | undefined {
    return globalThis.navigator;
}

export function getBrowserRendererPerformance(): Performance | undefined {
    return globalThis.performance;
}

export function getBrowserRendererRemoveEventListener():
    | typeof globalThis.removeEventListener
    | undefined {
    return globalThis.removeEventListener.bind(globalThis);
}

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

export function getBrowserRendererSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return globalThis.setTimeout;
}

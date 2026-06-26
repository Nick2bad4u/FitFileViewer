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

export function getBrowserRendererConsole(): Console | undefined {
    return globalThis.console;
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

export function getBrowserRendererElectronApiCandidate(): unknown {
    return (globalThis as RendererRuntimeGlobalScope).electronAPI;
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

export function getBrowserRendererBoundClearInterval():
    | typeof globalThis.clearInterval
    | undefined {
    return globalThis.clearInterval.bind(globalThis);
}

export function getBrowserRendererBoundSetInterval():
    | typeof globalThis.setInterval
    | undefined {
    return globalThis.setInterval.bind(globalThis);
}

export function getBrowserRendererRuntimeEnvironmentScope(): RendererRuntimeEnvironmentScope {
    return {
        getAddEventListener: getBrowserRendererAddEventListener,
        getClearInterval: getBrowserRendererBoundClearInterval,
        getConsole: getBrowserRendererConsole,
        getDocument: getBrowserRendererDocument,
        getElectronApiCandidate: getBrowserRendererElectronApiCandidate,
        getRemoveEventListener: getBrowserRendererRemoveEventListener,
        getRendererEventTarget: getBrowserRendererEventTarget,
        getSetInterval: getBrowserRendererBoundSetInterval,
        getSetTimeout: getBrowserRendererBoundSetTimeout,
    };
}

export function getBrowserRendererSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return globalThis.setTimeout;
}

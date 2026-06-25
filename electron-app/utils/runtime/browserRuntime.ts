export function getBrowserAbortController():
    | typeof globalThis.AbortController
    | undefined {
    return globalThis.AbortController;
}

export function getBrowserCancelIdleCallback():
    | typeof globalThis.cancelIdleCallback
    | undefined {
    return typeof globalThis.cancelIdleCallback === "function"
        ? globalThis.cancelIdleCallback.bind(globalThis)
        : undefined;
}

export function getBrowserCancelAnimationFrame():
    | typeof globalThis.cancelAnimationFrame
    | undefined {
    return typeof globalThis.cancelAnimationFrame === "function"
        ? globalThis.cancelAnimationFrame.bind(globalThis)
        : undefined;
}

export function getBrowserClearInterval():
    | typeof globalThis.clearInterval
    | undefined {
    return globalThis.clearInterval;
}

export function getBrowserClearTimeout():
    | typeof globalThis.clearTimeout
    | undefined {
    return globalThis.clearTimeout;
}

export function getBrowserDateNow(): (() => number) | undefined {
    return Date.now;
}

export function getBrowserDocument(): Document | undefined {
    return globalThis.document;
}

export function getBrowserEventTarget(): EventTarget | undefined {
    return globalThis;
}

export function getBrowserFetch(): typeof globalThis.fetch | undefined {
    return globalThis.fetch;
}

export function getBrowserHTMLElement():
    | typeof globalThis.HTMLElement
    | undefined {
    return globalThis.HTMLElement;
}

export function getBrowserLocalStorage(): Storage | undefined {
    return globalThis.localStorage;
}

export function getBrowserLocation(): Location | undefined {
    return globalThis.location;
}

export function getBrowserMatchMedia():
    | typeof globalThis.matchMedia
    | undefined {
    return globalThis.matchMedia;
}

export function getBrowserPerformance(): Performance | undefined {
    return globalThis.performance;
}

export function getBrowserRequestIdleCallback():
    | typeof globalThis.requestIdleCallback
    | undefined {
    return typeof globalThis.requestIdleCallback === "function"
        ? globalThis.requestIdleCallback.bind(globalThis)
        : undefined;
}

export function getBrowserRequestAnimationFrame():
    | typeof globalThis.requestAnimationFrame
    | undefined {
    return typeof globalThis.requestAnimationFrame === "function"
        ? globalThis.requestAnimationFrame.bind(globalThis)
        : undefined;
}

export function getBrowserResizeObserver():
    | typeof globalThis.ResizeObserver
    | undefined {
    return globalThis.ResizeObserver;
}

export function getBrowserMutationObserver():
    | typeof globalThis.MutationObserver
    | undefined {
    return globalThis.MutationObserver;
}

export function getBrowserSetInterval():
    | typeof globalThis.setInterval
    | undefined {
    return globalThis.setInterval;
}

export function getBrowserSetTimeout():
    | typeof globalThis.setTimeout
    | undefined {
    return globalThis.setTimeout;
}

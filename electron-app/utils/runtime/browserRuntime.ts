export function getBrowserAbortController():
    | typeof globalThis.AbortController
    | undefined {
    return globalThis.AbortController;
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

export function getBrowserLocalStorage(): Storage | undefined {
    return globalThis.localStorage;
}

export function getBrowserLocation(): Location | undefined {
    return globalThis.location;
}

export function getBrowserPerformance(): Performance | undefined {
    return globalThis.performance;
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

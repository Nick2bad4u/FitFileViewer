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

export function getBrowserDateNow(): (() => number) | undefined {
    return Date.now;
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

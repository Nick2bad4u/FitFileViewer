export function getBrowserAbortController():
    | typeof globalThis.AbortController
    | undefined {
    return globalThis.AbortController;
}

export function getBrowserDateNow(): (() => number) | undefined {
    return Date.now;
}

export function getBrowserPerformance(): Performance | undefined {
    return globalThis.performance;
}

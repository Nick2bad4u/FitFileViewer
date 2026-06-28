export type MainProcessIntervalHandle = NodeJS.Timeout;
export type MainProcessTimerHandle = NodeJS.Timeout;

export function clearMainProcessInterval(
    handle: MainProcessIntervalHandle
): void {
    clearInterval(handle);
}

export function clearMainProcessTimeout(handle: MainProcessTimerHandle): void {
    clearTimeout(handle);
}

export function setMainProcessInterval(
    callback: () => void,
    delayMs: number
): MainProcessIntervalHandle {
    return setInterval(callback, delayMs);
}

export function setMainProcessTimeout(
    callback: () => void,
    delayMs: number
): MainProcessTimerHandle {
    return setTimeout(callback, delayMs);
}

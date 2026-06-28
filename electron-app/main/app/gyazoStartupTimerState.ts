import type { MainProcessTimerHandle } from "../runtime/mainProcessTimerHandle.js";

let gyazoStartupTimer: MainProcessTimerHandle | undefined;

/**
 * Returns the pending Gyazo startup timer, when one has been registered.
 */
export function getGyazoStartupTimer(): MainProcessTimerHandle | undefined {
    return gyazoStartupTimer;
}

/** Stores the pending Gyazo startup timer. */
export function setGyazoStartupTimer(handle: MainProcessTimerHandle): void {
    clearGyazoStartupTimer();
    gyazoStartupTimer = handle;
}

/** Clears the pending Gyazo startup timer and forgets the handle. */
export function clearGyazoStartupTimer(): void {
    if (gyazoStartupTimer !== undefined) {
        clearTimeout(gyazoStartupTimer);
        gyazoStartupTimer = undefined;
    }
}

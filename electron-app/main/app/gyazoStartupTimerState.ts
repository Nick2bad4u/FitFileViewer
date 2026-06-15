type TimerHandle = ReturnType<typeof setTimeout>;

let gyazoStartupTimer: TimerHandle | undefined;

/**
 * Returns the pending Gyazo startup timer, when one has been registered.
 */
export function getGyazoStartupTimer(): TimerHandle | undefined {
    return gyazoStartupTimer;
}

/** Stores the pending Gyazo startup timer. */
export function setGyazoStartupTimer(handle: TimerHandle): void {
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

export default {
    clearGyazoStartupTimer,
    getGyazoStartupTimer,
    setGyazoStartupTimer,
};

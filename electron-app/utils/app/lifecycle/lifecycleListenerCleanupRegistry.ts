type CleanupCallback = () => void;

const cleanupCallbacksByTarget = new WeakMap<EventTarget, CleanupCallback>();

/**
 * Returns the registered lifecycle cleanup callback for a target.
 */
export function getLifecycleListenerCleanup(
    target: EventTarget
): CleanupCallback | undefined {
    return cleanupCallbacksByTarget.get(target);
}

/**
 * Registers or replaces the lifecycle cleanup callback for a target.
 */
export function setLifecycleListenerCleanup(
    target: EventTarget,
    cleanup: CleanupCallback
): void {
    cleanupCallbacksByTarget.set(target, cleanup);
}

/**
 * Runs and clears the lifecycle cleanup callback for a target.
 */
export function runLifecycleListenerCleanup(target: EventTarget): void {
    const cleanup = getLifecycleListenerCleanup(target);
    if (cleanup === undefined) {
        return;
    }

    try {
        cleanup();
    } catch {
        /* ignore */
    }
}

/**
 * Clears the lifecycle cleanup callback for a target.
 */
export function clearLifecycleListenerCleanup(target: EventTarget): void {
    cleanupCallbacksByTarget.delete(target);
}

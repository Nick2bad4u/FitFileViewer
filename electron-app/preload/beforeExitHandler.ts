type PreloadLog = import("./preloadModuleTypes").PreloadLog;
type RegisterPreloadBeforeExitHandlerOptions =
    import("./preloadModuleTypes").RegisterPreloadBeforeExitHandlerOptions;

type BeforeExitCallback = (
    ...args: import("node:process").ProcessEventMap["beforeExit"]
) => void;

type BeforeExitListener = BeforeExitCallback & {
    listener?: unknown;
    readonly [key: symbol]: unknown;
};

const BEFORE_EXIT_LISTENER_SYMBOL = Symbol("ffv.preload.beforeExitListener");
const beforeExitRegistry = new WeakMap<NodeJS.Process, BeforeExitCallback>();

function getRegisteredBeforeExitWrapper(
    processRef: NodeJS.Process,
    handleBeforeExit: BeforeExitCallback,
    preloadLog: PreloadLog
): BeforeExitCallback {
    try {
        const listeners = processRef.listeners("beforeExit");
        for (const listener of listeners) {
            if (isTrackedBeforeExitListener(listener, handleBeforeExit)) {
                return listener;
            }
        }
    } catch (error) {
        preloadLog(
            "warn",
            "[preload.js] Unable to capture beforeExit listener wrapper:",
            error
        );
    }

    return handleBeforeExit;
}

function isTrackedBeforeExitListener(
    listener: unknown,
    handleBeforeExit: BeforeExitCallback
): listener is BeforeExitListener {
    if (typeof listener !== "function") {
        return false;
    }

    const listenerRecord = listener as BeforeExitListener;
    return (
        listener === handleBeforeExit ||
        listenerRecord.listener === handleBeforeExit ||
        listenerRecord[BEFORE_EXIT_LISTENER_SYMBOL] === true
    );
}

function markBeforeExitWrapper(storedWrapper: BeforeExitCallback): void {
    try {
        Reflect.set(storedWrapper, BEFORE_EXIT_LISTENER_SYMBOL, true);
    } catch {
        // Ignore if wrapper is not extensible.
    }
}

function pruneTrackedBeforeExitListeners(
    processRef: NodeJS.Process,
    handleBeforeExit: BeforeExitCallback,
    preloadLog: PreloadLog
): void {
    try {
        const currentListeners = processRef.listeners("beforeExit");
        for (const listener of currentListeners) {
            if (isTrackedBeforeExitListener(listener, handleBeforeExit)) {
                processRef.removeListener("beforeExit", listener);
            }
        }
    } catch (error) {
        preloadLog(
            "warn",
            "[preload.js] Unable to prune stale beforeExit listeners:",
            error
        );
    }
}

export function registerPreloadBeforeExitHandler({
    isDevelopmentMode,
    preloadLog,
    processRef = process,
}: RegisterPreloadBeforeExitHandlerOptions): void {
    const handleBeforeExit: BeforeExitCallback = () => {
        if (isDevelopmentMode()) {
            preloadLog(
                "info",
                "[preload.js] Process exiting, performing cleanup..."
            );
        }

        const existingWrapper = beforeExitRegistry.get(processRef);
        beforeExitRegistry.delete(processRef);
        if (existingWrapper) {
            removeBeforeExitListener(
                processRef,
                existingWrapper,
                "[preload.js] Unable to remove beforeExit listener during cleanup:",
                preloadLog
            );
        }
    };

    removeRegisteredBeforeExitWrapper(
        processRef,
        beforeExitRegistry,
        preloadLog
    );
    pruneTrackedBeforeExitListeners(processRef, handleBeforeExit, preloadLog);
    processRef.once("beforeExit", handleBeforeExit);

    const storedWrapper = getRegisteredBeforeExitWrapper(
        processRef,
        handleBeforeExit,
        preloadLog
    );
    markBeforeExitWrapper(storedWrapper);
    beforeExitRegistry.set(processRef, storedWrapper);
}

function removeBeforeExitListener(
    processRef: NodeJS.Process,
    listener: BeforeExitCallback,
    failureMessage: string,
    preloadLog: PreloadLog
): void {
    try {
        processRef.removeListener("beforeExit", listener);
    } catch (error) {
        preloadLog("warn", failureMessage, error);
    }
}

function removeRegisteredBeforeExitWrapper(
    processRef: NodeJS.Process,
    registry: WeakMap<NodeJS.Process, BeforeExitCallback>,
    preloadLog: PreloadLog
): void {
    const existingWrapper = registry.get(processRef);
    if (existingWrapper === undefined) {
        return;
    }

    removeBeforeExitListener(
        processRef,
        existingWrapper,
        "[preload.js] Unable to remove stale beforeExit listener:",
        preloadLog
    );
    registry.delete(processRef);
}

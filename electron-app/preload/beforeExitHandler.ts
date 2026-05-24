{
    type PreloadLog = (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;

    type BeforeExitListener = NodeJS.BeforeExitListener & {
        listener?: unknown;
        readonly [key: symbol]: unknown;
    };

    interface BeforeExitGlobalRegistry {
        __ffv_preload_beforeExitRegistry__?:
            | null
            | WeakMap<NodeJS.Process, NodeJS.BeforeExitListener>;
    }

    interface RegisterPreloadBeforeExitHandlerOptions {
        globalScope?: BeforeExitGlobalRegistry;
        isDevelopmentMode: () => boolean;
        preloadLog: PreloadLog;
        processRef?: NodeJS.Process;
    }

    const BEFORE_EXIT_LISTENER_SYMBOL = Symbol.for(
        "ffv.preload.beforeExitListener"
    );
    const BEFORE_EXIT_REGISTRY_KEY = "__ffv_preload_beforeExitRegistry__";

    function getProcessRegistry(
        globalScope: BeforeExitGlobalRegistry,
        preloadLog: PreloadLog
    ): null | WeakMap<NodeJS.Process, NodeJS.BeforeExitListener> {
        const existing = globalScope[BEFORE_EXIT_REGISTRY_KEY];
        if (existing) {
            return existing;
        }

        try {
            const registry = new WeakMap<
                NodeJS.Process,
                NodeJS.BeforeExitListener
            >();
            globalScope[BEFORE_EXIT_REGISTRY_KEY] = registry;
            return registry;
        } catch (error) {
            preloadLog(
                "warn",
                "[preload.js] Unable to initialize beforeExit registry:",
                error
            );
            globalScope[BEFORE_EXIT_REGISTRY_KEY] = null;
            return null;
        }
    }

    function getRegisteredBeforeExitWrapper(
        processRef: NodeJS.Process,
        handleBeforeExit: NodeJS.BeforeExitListener,
        preloadLog: PreloadLog
    ): NodeJS.BeforeExitListener {
        try {
            const listeners = processRef.listeners("beforeExit");
            for (const listener of listeners) {
                if (isTrackedBeforeExitListener(listener, handleBeforeExit)) {
                    return listener as NodeJS.BeforeExitListener;
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
        handleBeforeExit: NodeJS.BeforeExitListener
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

    function markBeforeExitWrapper(
        storedWrapper: NodeJS.BeforeExitListener
    ): void {
        try {
            Reflect.set(storedWrapper, BEFORE_EXIT_LISTENER_SYMBOL, true);
        } catch {
            // Ignore if wrapper is not extensible.
        }
    }

    function pruneTrackedBeforeExitListeners(
        processRef: NodeJS.Process,
        handleBeforeExit: NodeJS.BeforeExitListener,
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

    function registerPreloadBeforeExitHandler({
        globalScope = globalThis as BeforeExitGlobalRegistry,
        isDevelopmentMode,
        preloadLog,
        processRef = process,
    }: RegisterPreloadBeforeExitHandlerOptions): void {
        const registry = getProcessRegistry(globalScope, preloadLog);

        const handleBeforeExit: NodeJS.BeforeExitListener = () => {
            if (isDevelopmentMode()) {
                preloadLog(
                    "info",
                    "[preload.js] Process exiting, performing cleanup..."
                );
            }

            if (!registry) {
                return;
            }

            const existingWrapper = registry.get(processRef);
            registry.delete(processRef);
            if (existingWrapper) {
                removeBeforeExitListener(
                    processRef,
                    existingWrapper,
                    "[preload.js] Unable to remove beforeExit listener during cleanup:",
                    preloadLog
                );
            }
        };

        removeRegisteredBeforeExitWrapper(processRef, registry, preloadLog);
        pruneTrackedBeforeExitListeners(
            processRef,
            handleBeforeExit,
            preloadLog
        );
        processRef.once("beforeExit", handleBeforeExit);

        if (registry) {
            const storedWrapper = getRegisteredBeforeExitWrapper(
                processRef,
                handleBeforeExit,
                preloadLog
            );
            markBeforeExitWrapper(storedWrapper);
            registry.set(processRef, storedWrapper);
        }
    }

    function removeBeforeExitListener(
        processRef: NodeJS.Process,
        listener: NodeJS.BeforeExitListener,
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
        registry: null | WeakMap<NodeJS.Process, NodeJS.BeforeExitListener>,
        preloadLog: PreloadLog
    ): void {
        const existingWrapper = registry?.get(processRef);
        if (existingWrapper === undefined) {
            return;
        }

        removeBeforeExitListener(
            processRef,
            existingWrapper,
            "[preload.js] Unable to remove stale beforeExit listener:",
            preloadLog
        );
        registry?.delete(processRef);
    }

    module.exports = {
        registerPreloadBeforeExitHandler,
    };
}

"use strict";
{
    const BEFORE_EXIT_LISTENER_SYMBOL = Symbol.for(
        "ffv.preload.beforeExitListener"
    );
    const BEFORE_EXIT_REGISTRY_KEY = "__ffv_preload_beforeExitRegistry__";
    function getProcessRegistry(globalScope, preloadLog) {
        const existing = globalScope[BEFORE_EXIT_REGISTRY_KEY];
        if (existing) {
            return existing;
        }
        try {
            const registry = new WeakMap();
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
        processRef,
        handleBeforeExit,
        preloadLog
    ) {
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
    function isTrackedBeforeExitListener(listener, handleBeforeExit) {
        if (typeof listener !== "function") {
            return false;
        }
        const listenerRecord = listener;
        return (
            listener === handleBeforeExit ||
            listenerRecord.listener === handleBeforeExit ||
            listenerRecord[BEFORE_EXIT_LISTENER_SYMBOL] === true
        );
    }
    function markBeforeExitWrapper(storedWrapper) {
        try {
            Reflect.set(storedWrapper, BEFORE_EXIT_LISTENER_SYMBOL, true);
        } catch {
            // Ignore if wrapper is not extensible.
        }
    }
    function pruneTrackedBeforeExitListeners(
        processRef,
        handleBeforeExit,
        preloadLog
    ) {
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
        globalScope = globalThis,
        isDevelopmentMode,
        preloadLog,
        processRef = process,
    }) {
        const registry = getProcessRegistry(globalScope, preloadLog);
        const handleBeforeExit = () => {
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
        processRef,
        listener,
        failureMessage,
        preloadLog
    ) {
        try {
            processRef.removeListener("beforeExit", listener);
        } catch (error) {
            preloadLog("warn", failureMessage, error);
        }
    }
    function removeRegisteredBeforeExitWrapper(
        processRef,
        registry,
        preloadLog
    ) {
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

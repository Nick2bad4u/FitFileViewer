"use strict";
{
    function createMainStateApi({
        ipcRenderer,
        mainStateBridge,
        preloadLog,
        validateCallback,
        validateRequiredNonEmptyString,
    }) {
        async function getErrors(limit = 50) {
            try {
                return await ipcRenderer.invoke("main-state:errors", limit);
            } catch (error) {
                preloadLog("error", "[preload.js] Error in getErrors:", error);
                throw error;
            }
        }
        async function getMainState(path) {
            try {
                return await ipcRenderer.invoke("main-state:get", path);
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in getMainState(${path ?? "all"}):`,
                    error
                );
                throw error;
            }
        }
        async function getMetrics() {
            try {
                return await ipcRenderer.invoke("main-state:metrics");
            } catch (error) {
                preloadLog("error", "[preload.js] Error in getMetrics:", error);
                throw error;
            }
        }
        async function getOperation(operationId) {
            if (
                !validateRequiredNonEmptyString(
                    operationId,
                    "operationId",
                    "getOperation"
                )
            ) {
                return null;
            }
            try {
                return await ipcRenderer.invoke(
                    "main-state:operation",
                    operationId
                );
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in getOperation(${operationId}):`,
                    error
                );
                throw error;
            }
        }
        async function getOperations() {
            try {
                return await ipcRenderer.invoke("main-state:operations");
            } catch (error) {
                preloadLog(
                    "error",
                    "[preload.js] Error in getOperations:",
                    error
                );
                throw error;
            }
        }
        async function listenToMainState(path, callback) {
            if (
                !validateRequiredNonEmptyString(
                    path,
                    "path",
                    "listenToMainState"
                )
            ) {
                return false;
            }
            if (!validateCallback(callback, "listenToMainState")) {
                return false;
            }
            try {
                return await mainStateBridge.listenToMainState(path, callback);
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in listenToMainState(${path}):`,
                    error
                );
                throw error;
            }
        }
        async function setMainState(path, value, options = {}) {
            if (!validateRequiredNonEmptyString(path, "path", "setMainState")) {
                return false;
            }
            try {
                return await ipcRenderer.invoke(
                    "main-state:set",
                    path,
                    value,
                    options
                );
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in setMainState(${path}):`,
                    error
                );
                throw error;
            }
        }
        async function subscribeToMainState(path, callback) {
            const ok = await listenToMainState(path, callback);
            if (!ok) {
                return () => Promise.resolve(false);
            }
            return () => unlistenFromMainState(path, callback);
        }
        async function unlistenFromMainState(path, callback) {
            if (
                !validateRequiredNonEmptyString(
                    path,
                    "path",
                    "unlistenFromMainState"
                )
            ) {
                return false;
            }
            if (!validateCallback(callback, "unlistenFromMainState")) {
                return false;
            }
            try {
                return await mainStateBridge.unlistenFromMainState(
                    path,
                    callback
                );
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in unlistenFromMainState(${path}):`,
                    error
                );
                throw error;
            }
        }
        return {
            getErrors,
            getMainState,
            getMetrics,
            getOperation,
            getOperations,
            listenToMainState,
            setMainState,
            subscribeToMainState,
            unlistenFromMainState,
        };
    }
    module.exports = {
        createMainStateApi,
    };
}

"use strict";
{
    const ELECTRON_MODULE_ID = ["electron"].join("");
    function getModuleLoadError(error) {
        return error instanceof Error
            ? error
            : new Error("Module loading failed");
    }
    function getOverride(globalScope) {
        return Reflect.get(globalScope, "__electronHoistedMock");
    }
    function isPreloadObjectRecord(value) {
        return typeof value === "object" && value !== null;
    }
    function loadElectronBridge(requireModule) {
        const electronModule = requireModule(ELECTRON_MODULE_ID);
        return unwrapElectronBridge(electronModule);
    }
    function resolveBridgePart(override, loadBridge, pick) {
        let lastError;
        try {
            const overridePart = override === null ? undefined : pick(override);
            if (overridePart !== null && overridePart !== undefined) {
                return overridePart;
            }
            const bridge = loadBridge();
            return bridge === null ? undefined : pick(bridge);
        } catch (error) {
            lastError = error;
        }
        if (override === null) {
            throw getModuleLoadError(lastError);
        }
        return null;
    }
    function resolvePreloadElectronBridge({
        globalScope = globalThis,
        requireModule,
    }) {
        const override = getOverride(globalScope) ?? null;
        const loadBridge = () => loadElectronBridge(requireModule);
        return {
            contextBridge: resolveBridgePart(
                override,
                loadBridge,
                (bridge) => bridge.contextBridge
            ),
            ipcRenderer: resolveBridgePart(
                override,
                loadBridge,
                (bridge) => bridge.ipcRenderer
            ),
        };
    }
    function unwrapElectronBridge(value) {
        if (!isPreloadObjectRecord(value)) {
            return null;
        }
        if ("contextBridge" in value || "ipcRenderer" in value) {
            return value;
        }
        if ("default" in value) {
            return unwrapElectronBridge(value["default"]);
        }
        return value;
    }
    module.exports = {
        resolvePreloadElectronBridge,
    };
}

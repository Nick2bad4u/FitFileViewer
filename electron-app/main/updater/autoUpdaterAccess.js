"use strict";
{
    let cachedMockedAutoUpdater;
    async function resolveAutoUpdaterAsync() {
        const vitestMock = await tryResolveVitestMock();
        if (vitestMock) {
            return vitestMock;
        }
        try {
            return resolveAutoUpdaterFromModule(await import("electron-updater"));
        }
        catch {
            return resolveAutoUpdaterSync();
        }
    }
    /**
     * Resolves electron-updater synchronously supporting both CJS and ESM default
     * exports.
     */
    function resolveAutoUpdaterSync() {
        if (cachedMockedAutoUpdater) {
            return cachedMockedAutoUpdater;
        }
        try {
            return resolveAutoUpdaterFromModule(require("electron-updater"));
        }
        catch {
            return null;
        }
    }
    async function tryResolveVitestMock() {
        if (cachedMockedAutoUpdater) {
            return cachedMockedAutoUpdater;
        }
        if (typeof process === "undefined" ||
            process.env["NODE_ENV"] !== "test") {
            return null;
        }
        try {
            const vitestGlobal = asObjectProperty(globalThis, "vi");
            const { vi } = await import("vitest");
            const mockApi = vitestGlobal && typeof vitestGlobal.importMock === "function"
                ? vitestGlobal
                : vi;
            if (mockApi && typeof mockApi.importMock === "function") {
                const resolved = resolveAutoUpdaterFromModule(await mockApi.importMock("electron-updater"));
                if (resolved) {
                    cachedMockedAutoUpdater = resolved;
                    return resolved;
                }
            }
        }
        catch {
            /* Ignore: vitest is not available outside test runs. */
        }
        return null;
    }
    function asAutoUpdater(value) {
        if (!value ||
            (typeof value !== "object" && typeof value !== "function")) {
            return null;
        }
        const candidate = value;
        return typeof candidate.on === "function" ||
            typeof candidate.checkForUpdatesAndNotify === "function" ||
            "autoDownload" in Object(value)
            ? candidate
            : null;
    }
    function resolveAutoUpdaterFromModule(moduleValue) {
        const mod = asModuleLike(moduleValue);
        const defaultExport = asModuleLike(asObjectProperty(mod, "default"));
        const moduleExports = asModuleLike(asObjectProperty(mod, "module.exports"));
        return (asAutoUpdater(asObjectProperty(mod, "autoUpdater")) ||
            asAutoUpdater(asObjectProperty(defaultExport, "autoUpdater")) ||
            asAutoUpdater(asObjectProperty(moduleExports, "autoUpdater")) ||
            asAutoUpdater(defaultExport) ||
            asAutoUpdater(moduleExports) ||
            asAutoUpdater(moduleValue));
    }
    function asModuleLike(value) {
        return value &&
            (typeof value === "object" || typeof value === "function")
            ? value
            : null;
    }
    /**
     * Safely reads module namespace properties. Vitest mock namespaces can throw
     * when probing missing exports, and electron-updater's lazy getters can throw
     * before Electron's app object exists.
     */
    function asObjectProperty(value, property) {
        if (!value ||
            (typeof value !== "object" && typeof value !== "function")) {
            return undefined;
        }
        try {
            return Reflect.get(Object(value), property);
        }
        catch {
            return undefined;
        }
    }
    module.exports = {
        resolveAutoUpdaterAsync,
        resolveAutoUpdaterSync,
    };
}

/**
 * Attempts to import electron-updater using dynamic import first (enabling
 * Vitest mocks) before falling back to synchronous require.
 *
 * @returns {Promise<any>} Resolved autoUpdater instance or null when
 *   unavailable.
 */
/** @type {any | null | undefined} */
let cachedMockedAutoUpdater;

async function resolveAutoUpdaterAsync() {
    const vitestMock = await tryResolveVitestMock();
    if (vitestMock) {
        return vitestMock;
    }

    try {
        const mod = /** @type {any} */ (await import("electron-updater"));
        return (
            (mod && mod.autoUpdater) ||
            (mod && mod.default && mod.default.autoUpdater) ||
            mod
        );
    } catch {
        return resolveAutoUpdaterSync();
    }
}

/**
 * Resolves electron-updater synchronously supporting both CJS and ESM default
 * exports.
 *
 * @returns {any} AutoUpdater instance or null when unavailable.
 */
function resolveAutoUpdaterSync() {
    if (cachedMockedAutoUpdater) {
        return cachedMockedAutoUpdater;
    }

    try {
        const mod = /** @type {any} */ (require("electron-updater"));
        return (
            (mod && mod.autoUpdater) ||
            (mod && mod.default && mod.default.autoUpdater) ||
            mod
        );
    } catch {
        return /** @type {any} */ (null);
    }
}

async function tryResolveVitestMock() {
    if (cachedMockedAutoUpdater) {
        return cachedMockedAutoUpdater;
    }
    if (typeof process === "undefined" || process.env?.NODE_ENV !== "test") {
        return null;
    }

    try {
        const { vi } = await import("vitest");
        if (vi && typeof vi.importMock === "function") {
            const mod = /** @type {any} */ (
                await vi.importMock("electron-updater")
            );
            const resolved =
                (mod && mod.autoUpdater) ||
                (mod && mod.default && mod.default.autoUpdater) ||
                mod ||
                null;
            if (resolved) {
                cachedMockedAutoUpdater = resolved;
                return resolved;
            }
        }
    } catch {
        /* Ignore – vitest not available outside test runs */
    }

    return null;
}

module.exports = {
    resolveAutoUpdaterAsync,
    resolveAutoUpdaterSync,
};

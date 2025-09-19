// Virtual electron shim for Vitest aliasing.
// This module provides a minimal-but-functional Electron surface so tests that don't
// explicitly vi.mock('electron') still get a working contextBridge/ipcRenderer.
// Tests can override this by calling vi.mock('electron', factory) in their own files.

/** @type {{ fn: <T extends Function>(impl?: T) => T & { mock?: { calls: any[] } } }} */
let vi;
try {
    // Prefer Vitest spies when available to keep call assertions consistent
    vi = require("vitest").vi;
} catch {
    vi = {
        fn: (/** @type {any} */ impl) => {
            /** @type {any} */
            const f = (.../** @type {any[]} */ args) => (impl ? impl(...args) : undefined);
            f.mock = { calls: [] };
            return f;
        },
    };
}

const app = {
    /** @param {string} name */
    getPath(name) {
        // Only support 'userData' in tests; return null when not mocked to exercise fallback
        if (name === "userData") {
            const p = process.env["MOCK_ELECTRON_USERDATA"];
            return p && p.length ? p : null;
        }
        return null;
    },
};

const ipcRenderer = {
    invoke: vi.fn(async () => "mock-result"),
    send: vi.fn(() => {}),
    on: vi.fn(() => {}),
    once: vi.fn(() => {}),
    removeListener: vi.fn(() => {}),
    removeAllListeners: vi.fn(() => {}),
};

const contextBridge = {
    /** @type {(name: string, api: any) => void} */
    exposeInMainWorld: vi.fn((name, api) => {
        try {
            // Mirror onto global/window so tests can access it easily
            /** @type {any} */ (globalThis)[name] = api;
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof window !== "undefined") {
                /** @type {any} */ (window)[name] = api;
            }
        } catch {
            /* Ignore errors */
        }
    }),
};

module.exports = { app, ipcRenderer, contextBridge };

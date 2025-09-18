// Virtual electron shim for Vitest aliasing.
// This file's only purpose is to exist so that vi.mock('electron', ...) hooks into a concrete module id.
// At runtime tests will hoist vi.mock('electron', factory) and this alias ensures require('electron') resolves here
// and is replaced by Vitest's mock implementation.
module.exports = {
    app: {
        getPath(name) {
            // Only support 'userData' in tests; return null when not mocked to exercise fallback
            if (name === 'userData') {
                const p = process.env.MOCK_ELECTRON_USERDATA;
                return p && p.length ? p : null;
            }
            return null;
        },
    },
};

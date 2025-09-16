// Virtual electron shim for Vitest aliasing.
// This file's only purpose is to exist so that vi.mock('electron', ...) hooks into a concrete module id.
// At runtime tests will hoist vi.mock('electron', factory) and this alias ensures require('electron') resolves here
// and is replaced by Vitest's mock implementation.
module.exports = {};

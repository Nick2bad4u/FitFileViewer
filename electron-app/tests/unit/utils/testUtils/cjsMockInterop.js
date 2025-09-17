/**
 * Utility to help with mocking CommonJS modules in ESM test files
 *
 * This file provides functions to intercept require() calls in modules
 * being tested, allowing proper mocking in a Vitest/Jest environment.
 */

/**
 * Creates a mock state manager for testing
 * @param {any} vitest - Vitest instance with fn() method for creating mock functions
 * @returns {object} Mock state manager with spy functions
 */
export function createMockStateManager(vitest) {
    return {
        setState: vitest.fn(),
        getState: vitest.fn(),
        subscribe: vitest.fn(),
        unsubscribe: vitest.fn(),
        clearAllListeners: vitest.fn(),
        __clearAllListenersForTests: vitest.fn(),
        __resetStateManagerForTests: vitest.fn()
    };
}

/**
 * Sets up mocking for CommonJS modules in ESM tests by intercepting require calls
 * @param {object} options - Configuration options
 * @param {Record<string, any>} options.mocks - Object mapping module paths to mock implementations
 * @returns {Function} Function to reset the mocking setup
 */
export function setupCommonJSMocks({ mocks = {} }) {
    // Save original require function
    const originalRequire = global.require;

    // Create a proxy to intercept specific module paths
    /** @type {any} */
    const mockRequire = function (/** @type {string} */ path) {
        // Check if we have a mock for this path
        for (const [mockPath, mockImplementation] of Object.entries(mocks)) {
            if (path.includes(mockPath)) {
                console.log(`[CJS Mock Interop] Intercepted require for: ${path}`);
                return mockImplementation;
            }
        }

        // For paths we don't mock, use the original require
        if (originalRequire) {
            return originalRequire(path);
        }

        // If original require is not available, throw error
        throw new Error(`Cannot require module: ${path} - Node.js require is not available in this environment`);
    };

    // Add properties to make it more compatible with the Require type
    mockRequire.cache = {};
    mockRequire.resolve = (/** @type {string} */ id) => id;
    mockRequire.extensions = {};

    // Set the global.require to our mock
    global.require = mockRequire;

    // Return a function to restore the original require
    return function resetMocks() {
        global.require = originalRequire;
    };
}

/**
 * Reset module cache for a specific module to ensure fresh imports
 * @param {string} modulePath - Path to the module to reset
 */
export function resetModuleCache(modulePath) {
    // For CommonJS modules, delete from require.cache if it exists
    if (global.require && global.require.cache) {
        const normalizedPath = modulePath.replace(/\\/g, '/');

        // Find cache keys that include our path
        Object.keys(global.require.cache).forEach(cacheKey => {
            if (cacheKey.includes(normalizedPath)) {
                delete global.require.cache[cacheKey];
                console.log(`[CJS Mock Interop] Cleared cache for: ${cacheKey}`);
            }
        });
    }

    // For dynamic imports, we rely on the test runner to handle module caching
    try {
        // In Vitest environment, use import.meta.hot to reset modules if available
        if (import.meta && typeof globalThis !== 'undefined') {
            // Signal that this module should be reloaded
            console.log(`[CJS Mock Interop] Requested module reload for: ${modulePath}`);
        }
    } catch (/** @type {any} */ err) {
        console.log(`[CJS Mock Interop] Error clearing module cache: ${err.message}`);
    }
}

const path = require("node:path");

/**
 * Attempts to resolve Node's fs module while supporting test environments that mock either "fs" or
 * "node:fs".
 */
const fs = (() => {
    try {
        return require("node:fs");
    } catch {
        try {
            const fsName = "fs";
            return require(fsName);
        } catch {
            return /** @type {any} */ (null);
        }
    }
})();

/**
 * Lazily resolves the http module, preferring the classic specifier so tests can stub it easily.
 *
 * @returns {any} Node http module or null when unavailable.
 */
function httpRef() {
    try {
        const httpName = "http";
        return require(httpName);
    } catch {
        try {
            return require("node:http");
        } catch {
            return /** @type {any} */ (null);
        }
    }
}

module.exports = {
    fs,
    httpRef,
    path,
};

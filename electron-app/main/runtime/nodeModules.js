"use strict";
{
    const path = require("node:path");
    const requireNodeModule = (specifier) => {
        try {
            return require(specifier);
        } catch {
            return null;
        }
    };
    /**
     * Attempts to resolve Node's fs module while supporting test environments
     * that mock either "fs" or "node:fs".
     */
    const fs = requireNodeModule("node:fs") ?? requireNodeModule("fs");
    /**
     * Lazily resolves the http module, preferring the classic specifier so
     * tests can stub it easily.
     *
     * @returns Node http module or null when unavailable.
     */
    function httpRef() {
        return requireNodeModule("http") ?? requireNodeModule("node:http");
    }
    module.exports = {
        fs,
        httpRef,
        path,
    };
}

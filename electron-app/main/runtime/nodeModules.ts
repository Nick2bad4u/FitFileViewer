{
    const path = require("node:path") as typeof import("node:path");

    type FileSystemModule = typeof import("node:fs");
    type HttpModule = typeof import("node:http");

    const requireNodeModule = <ModuleType>(
        specifier: string
    ): ModuleType | null => {
        try {
            return require(specifier) as ModuleType;
        } catch {
            return null;
        }
    };

/**
 * Attempts to resolve Node's fs module while supporting test environments that
 * mock either "fs" or "node:fs".
 */
    const fs =
        requireNodeModule<FileSystemModule>("node:fs") ??
        requireNodeModule<FileSystemModule>("fs");

/**
 * Lazily resolves the http module, preferring the classic specifier so tests
 * can stub it easily.
 *
 * @returns Node http module or null when unavailable.
 */
    function httpRef(): HttpModule | null {
        return (
            requireNodeModule<HttpModule>("http") ??
            requireNodeModule<HttpModule>("node:http")
        );
    }

    module.exports = {
        fs,
        httpRef,
        path,
    };
}

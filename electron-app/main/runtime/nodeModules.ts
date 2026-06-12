import * as pathModule from "node:path";

type FileSystemModule = typeof import("node:fs");
type HttpModule = typeof import("node:http");

const requireNodeModule = (specifier: string): unknown => {
    try {
        return require(specifier);
    } catch {
        return null;
    }
};

export function loadNodeModule<TModule = unknown>(
    specifier: string
): TModule | null {
    return requireNodeModule(specifier) as TModule | null;
}

export const path = pathModule;

/**
 * Attempts to resolve Node's fs module while supporting test environments that
 * mock either "fs" or "node:fs".
 */
export const fs =
    loadNodeModule<FileSystemModule>("node:fs") ??
    loadNodeModule<FileSystemModule>("fs");

/**
 * Lazily resolves the http module, preferring the classic specifier so tests
 * can stub it easily.
 *
 * @returns Node http module or null when unavailable.
 */
export function httpRef(): HttpModule | null {
    return (
        loadNodeModule<HttpModule>("http") ??
        loadNodeModule<HttpModule>("node:http")
    );
}

export default {
    fs,
    httpRef,
    path,
};

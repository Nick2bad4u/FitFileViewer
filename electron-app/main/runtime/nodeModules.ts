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

export const path = pathModule;

/**
 * Attempts to resolve Node's fs module while supporting test environments
 * that mock either "fs" or "node:fs".
 */
export const fs =
    (requireNodeModule("node:fs") as FileSystemModule | null) ??
    (requireNodeModule("fs") as FileSystemModule | null);

/**
 * Lazily resolves the http module, preferring the classic specifier so
 * tests can stub it easily.
 *
 * @returns Node http module or null when unavailable.
 */
export function httpRef(): HttpModule | null {
    return (
        (requireNodeModule("http") as HttpModule | null) ??
        (requireNodeModule("node:http") as HttpModule | null)
    );
}

export default {
    fs,
    httpRef,
    path,
};

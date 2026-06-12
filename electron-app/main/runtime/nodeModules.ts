import * as fsModule from "node:fs";
import * as httpModule from "node:http";
import * as pathModule from "node:path";

type HttpModule = typeof import("node:http");

export function loadNodeModule<TModule = unknown>(
    specifier: string
): TModule | null {
    try {
        return require(specifier) as TModule;
    } catch {
        return null;
    }
}

export const path = pathModule;
export const fs = fsModule;

/**
 * Returns Node's http module through the runtime boundary used by main-process
 * callers.
 *
 * @returns Node http module.
 */
export function httpRef(): HttpModule {
    return httpModule;
}

export default {
    fs,
    httpRef,
    path,
};

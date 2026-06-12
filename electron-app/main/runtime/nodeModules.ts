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

// eslint-disable-next-line unicorn/prefer-export-from -- export-from exposes deprecated Node namespace members to lint.
export const path = pathModule;
// eslint-disable-next-line unicorn/prefer-export-from -- export-from exposes deprecated Node namespace members to lint.
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

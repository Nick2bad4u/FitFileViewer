/**
 * Attempts to resolve Node's fs module while supporting test environments that
 * mock either "fs" or "node:fs".
 */
export const fs: typeof import("node:fs") | null;
/**
 * Lazily resolves the http module, preferring the classic specifier so tests
 * can stub it easily.
 *
 * @returns {typeof import("node:http") | null} Node http module or null when unavailable.
 */
export function httpRef(): typeof import("node:http") | null;
import path = require("node:path");
export { path };

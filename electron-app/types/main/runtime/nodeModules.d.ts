/**
 * Attempts to resolve Node's fs module while supporting test environments that
 * mock either "fs" or "node:fs".
 */
export const fs: any;
/**
 * Lazily resolves the http module, preferring the classic specifier so tests
 * can stub it easily.
 *
 * @returns {any} Node http module or null when unavailable.
 */
export function httpRef(): any;
import path = require("path");
export { path };

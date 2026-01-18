/**
 * @fileoverview Safe accessors for Web Storage (localStorage/sessionStorage).
 *
 * Many parts of the renderer assume localStorage exists. In tests (node/jsdom) or
 * restricted environments it may be missing or throw. These helpers:
 * - centralize try/catch handling
 * - support injection via a storage-provider function
 * - avoid crashing call sites
 */

/**
 * @typedef {{
 *  getItem?: (key: string) => string | null,
 *  setItem?: (key: string, value: string) => void,
 *  removeItem?: (key: string) => void
 * }} StorageLike
 */

/**
 * Resolve a storage instance.
 *
 * @param {undefined | (() => StorageLike | null)} getStorage
 * @returns {StorageLike | null}
 */
export function resolveStorage(getStorage) {
    try {
        /** @type {{ localStorage?: StorageLike }} */
        const scope = globalThis;
        const storage = typeof getStorage === "function" ? getStorage() : (scope.localStorage ?? null);
        if (!storage || typeof storage !== "object") return null;
        return storage;
    } catch {
        return null;
    }
}

/**
 * @param {string} key
 * @param {undefined | (() => StorageLike | null)} getStorage
 * @returns {string | null}
 */
export function safeStorageGetItem(key, getStorage) {
    const storage = resolveStorage(getStorage);
    try {
        return storage?.getItem ? storage.getItem(key) : null;
    } catch {
        return null;
    }
}

/**
 * @param {string} key
 * @param {undefined | (() => StorageLike | null)} getStorage
 */
export function safeStorageRemoveItem(key, getStorage) {
    const storage = resolveStorage(getStorage);
    try {
        storage?.removeItem?.(key);
    } catch {
        /* ignore */
    }
}

/**
 * @param {string} key
 * @param {string} value
 * @param {undefined | (() => StorageLike | null)} getStorage
 */
export function safeStorageSetItem(key, value, getStorage) {
    const storage = resolveStorage(getStorage);
    try {
        storage?.setItem?.(key, value);
    } catch {
        /* ignore */
    }
}

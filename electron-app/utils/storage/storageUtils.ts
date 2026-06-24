/**
 * Safe accessors for Web Storage (`localStorage`/`sessionStorage`).
 *
 * Renderer code often assumes storage exists. Tests, restricted browser
 * contexts, and privacy settings can make storage unavailable or throw. These
 * helpers centralize storage access so callers fail closed.
 */
import {
    getStorageUtilsRuntime,
    type StorageLike,
    type StorageProvider,
    type StorageUtilsRuntime,
} from "./storageUtilsRuntime.js";

export type { StorageLike, StorageProvider } from "./storageUtilsRuntime.js";

/**
 * Create a storage provider from the current runtime scope.
 *
 * @param runtime - Optional runtime dependency bundle.
 *
 * @returns Storage provider that resolves default storage on demand.
 */
export function createDefaultStorageProvider(
    runtime: StorageUtilsRuntime = getStorageUtilsRuntime()
): StorageProvider {
    return () => runtime.getDefaultStorage();
}

/**
 * Resolve an injected storage provider or the current global localStorage.
 *
 * @param getStorage - Optional storage provider.
 *
 * @returns A usable storage object, or null when storage is unavailable.
 */
export function resolveStorage(
    getStorage: StorageProvider = createDefaultStorageProvider()
): null | StorageLike {
    try {
        const storage = getStorage();

        if (typeof storage !== "object" || storage === null) {
            return null;
        }

        return storage;
    } catch {
        return null;
    }
}

/**
 * Read a storage value without letting storage failures escape.
 *
 * @param key - Storage key.
 * @param getStorage - Optional storage provider.
 *
 * @returns Stored value, or null when unavailable.
 */
export function safeStorageGetItem(
    key: string,
    getStorage?: StorageProvider
): null | string {
    const storage = resolveStorage(getStorage);
    try {
        return storage?.getItem === undefined ? null : storage.getItem(key);
    } catch {
        return null;
    }
}

/**
 * Remove a storage value without letting storage failures escape.
 *
 * @param key - Storage key.
 * @param getStorage - Optional storage provider.
 */
export function safeStorageRemoveItem(
    key: string,
    getStorage?: StorageProvider
): void {
    const storage = resolveStorage(getStorage);
    try {
        storage?.removeItem?.(key);
    } catch {
        // Ignore unavailable or restricted storage.
    }
}

/**
 * Write a storage value without letting storage failures escape.
 *
 * @param key - Storage key.
 * @param value - String value to store.
 * @param getStorage - Optional storage provider.
 */
export function safeStorageSetItem(
    key: string,
    value: string,
    getStorage?: StorageProvider
): void {
    const storage = resolveStorage(getStorage);
    try {
        storage?.setItem?.(key, value);
    } catch {
        // Ignore unavailable or restricted storage.
    }
}

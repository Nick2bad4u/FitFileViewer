/**
 * Ensures Node-based Storybook environments expose a minimal Web Storage API so
 * addons (for example, MSW) can rely on `localStorage`/`sessionStorage` during
 * initialization. The implementation intentionally sticks to the subset MSW
 * touches.
 */

type StorageName = "localStorage" | "sessionStorage";
type StorageTarget = typeof globalThis | (Window & typeof globalThis);

type MaybeStorage =
    | null
    | undefined
    | {
          clear?: () => unknown;
          getItem?: (key: string) => unknown;
          key?: (index: number) => unknown;
          readonly length?: number;
          removeItem?: (key: string) => unknown;
          setItem?: (key: string, value: string) => unknown;
      };

interface StorageLike {
    clear: () => void;
    getItem: (key: string) => null | string;
    key: (index: number) => null | string;
    readonly length: number;
    removeItem: (key: string) => void;
    setItem: (key: string, value: string) => void;
}

/**
 * Determines whether a candidate value is a function.
 */
const isFunction = (value: unknown): value is (...args: never[]) => unknown =>
    typeof value === "function";

/**
 * Checks whether an arbitrary value implements the minimal storage contract we
 * rely on.
 */
const isStorageLike = (candidate: MaybeStorage): candidate is StorageLike => {
    if (!candidate || typeof candidate !== "object") {
        return false;
    }

    return (
        typeof candidate.length === "number" &&
        isFunction(candidate.clear) &&
        isFunction(candidate.getItem) &&
        isFunction(candidate.key) &&
        isFunction(candidate.removeItem) &&
        isFunction(candidate.setItem)
    );
};

/**
 * In-memory implementation of the Web Storage API used to backfill Node
 * environments.
 */
class MemoryStorage implements StorageLike {
    readonly #store = new Map<string, string>();

    public get length(): number {
        return this.#store.size;
    }

    public clear(): void {
        this.#store.clear();
    }

    public getItem(key: string): null | string {
        const value = this.#store.get(key);
        return value ?? null;
    }

    /**
     * Retrieves the key at the provided index to mirror the DOM Storage
     * behaviour.
     *
     * The method name intentionally matches the Web Storage API.
     */
    public key(index: number): null | string {
        if (index < 0 || index >= this.#store.size) {
            return null;
        }

        let currentIndex = 0;
        for (const currentKey of this.#store.keys()) {
            if (currentIndex === index) {
                return currentKey;
            }

            currentIndex += 1;
        }

        return null;
    }

    public removeItem(key: string): void {
        this.#store.delete(key);
    }

    public setItem(key: string, value: string): void {
        this.#store.set(key, value);
    }
}

const storageConstructorDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: true,
    value: MemoryStorage,
    writable: true,
};

const safeGet = <T>(target: unknown, property: PropertyKey): T | undefined => {
    if (target === null || target === undefined) {
        return undefined;
    }

    if (typeof target !== "object" && typeof target !== "function") {
        return undefined;
    }

    try {
        return Reflect.get(target as object, property) as T;
    } catch {
        return undefined;
    }
};

const installProperty = (
    target: StorageTarget,
    property: PropertyKey,
    descriptor: PropertyDescriptor
): void => {
    try {
        Reflect.defineProperty(target, property, descriptor);
    } catch {
        // Ignore sealed test globals; callers fall back to whichever storage is
        // already available on the other runtime target.
    }
};

const ensureStorageConstructor = (target: StorageTarget): void => {
    const existingConstructor = safeGet<unknown>(target, "Storage");
    if (typeof existingConstructor === "function") {
        return;
    }

    installProperty(target, "Storage", storageConstructorDescriptor);
};

const installStorageProperty = (
    target: StorageTarget,
    name: StorageName,
    storage: StorageLike
): void => {
    installProperty(target, name, {
        configurable: true,
        enumerable: true,
        value: storage,
        writable: true,
    });
};

/**
 * Installs an in-memory storage shim when the global scope lacks a native
 * implementation.
 */
const installStorage = (name: StorageName): void => {
    if (typeof globalThis === "undefined") {
        return;
    }

    const windowCandidate = safeGet<object>(globalThis, "window");
    const storageTargets: StorageTarget[] = [globalThis];
    if (typeof windowCandidate === "object" && windowCandidate !== null) {
        storageTargets.push(windowCandidate as StorageTarget);
    }

    const existingStorage = storageTargets
        .map((target) => safeGet<MaybeStorage>(target, name))
        .find(isStorageLike);
    const storage = existingStorage ?? new MemoryStorage();

    for (const target of storageTargets) {
        ensureStorageConstructor(target);
        if (!isStorageLike(safeGet<MaybeStorage>(target, name))) {
            installStorageProperty(target, name, storage);
        }
    }
};

installStorage("localStorage");
installStorage("sessionStorage");

export type { StorageLike };

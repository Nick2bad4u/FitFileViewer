import { describe, expect, it, vi } from "vitest";

import {
    createDefaultStorageProvider,
    resolveStorage,
    safeStorageGetItem,
    safeStorageRemoveItem,
    safeStorageSetItem,
    type StorageLike,
} from "../../../electron-app/utils/storage/storageUtils.js";

function createStorage(
    initialValues: Record<string, string> = {}
): StorageLike {
    const values = new Map(Object.entries(initialValues));

    return {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => {
            values.delete(key);
        },
        setItem: (key, value) => {
            values.set(key, value);
        },
    };
}

describe("storage utilities", () => {
    it("resolves ambient localStorage through the default provider", () => {
        expect.assertions(2);

        const storage = createStorage({ existing: "ambient" });
        vi.stubGlobal("localStorage", storage);

        expect(resolveStorage()).toBe(storage);
        expect(safeStorageGetItem("existing")).toBe("ambient");
    });

    it("creates a default provider from an injected runtime", () => {
        expect.assertions(3);

        const storage = createStorage({ existing: "runtime" });
        const getDefaultStorage = vi.fn(() => storage);
        const provider = createDefaultStorageProvider({ getDefaultStorage });

        expect(resolveStorage(provider)).toBe(storage);
        expect(safeStorageGetItem("existing", provider)).toBe("runtime");
        expect(getDefaultStorage).toHaveBeenCalledTimes(2);
    });

    it("resolves injected storage and rejects unusable providers", () => {
        expect.assertions(3);

        const storage = createStorage();

        expect(resolveStorage(() => storage)).toBe(storage);
        expect(resolveStorage(() => null)).toBeNull();
        expect(
            resolveStorage(() => {
                throw new Error("storage unavailable");
            })
        ).toBeNull();
    });

    it("reads, writes, and removes values through injected storage", () => {
        expect.assertions(3);

        const storage = createStorage({ existing: "value" });
        const getStorage = () => storage;

        expect(safeStorageGetItem("existing", getStorage)).toBe("value");

        safeStorageSetItem("newKey", "newValue", getStorage);

        expect(safeStorageGetItem("newKey", getStorage)).toBe("newValue");

        safeStorageRemoveItem("newKey", getStorage);

        expect(safeStorageGetItem("newKey", getStorage)).toBeNull();
    });

    it("returns null when storage read methods are missing or throwing", () => {
        expect.assertions(3);

        expect(safeStorageGetItem("missing", () => ({}))).toBeNull();
        expect(
            safeStorageGetItem("bad", () => ({
                getItem: () => {
                    throw new Error("read denied");
                },
            }))
        ).toBeNull();
        expect(
            resolveStorage(() => "not storage" as unknown as StorageLike)
        ).toBeNull();
    });

    it("ignores write and remove failures", () => {
        expect.assertions(4);

        const setItem = vi.fn<(key: string, value: string) => void>(() => {
            throw new Error("write denied");
        });
        const removeItem = vi.fn<(key: string) => void>(() => {
            throw new Error("remove denied");
        });

        expect(
            safeStorageSetItem("key", "value", () => ({ setItem }))
        ).toBeUndefined();
        expect(
            safeStorageRemoveItem("key", () => ({ removeItem }))
        ).toBeUndefined();
        expect(setItem).toHaveBeenCalledWith("key", "value");
        expect(removeItem).toHaveBeenCalledWith("key");
    });
});

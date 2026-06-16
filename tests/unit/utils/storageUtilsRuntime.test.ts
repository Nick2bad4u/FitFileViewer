import { describe, expect, it } from "vitest";

import {
    getStorageUtilsRuntime,
    type StorageLike,
} from "../../../electron-app/utils/storage/storageUtilsRuntime.js";

describe("storage utilities runtime", () => {
    it("returns an injected localStorage reference", () => {
        expect.assertions(1);

        const localStorage: StorageLike = {
                getItem: () => "value",
            },
            runtime = getStorageUtilsRuntime({ localStorage });

        expect(runtime.getDefaultStorage()).toBe(localStorage);
    });

    it("returns null when localStorage is unavailable", () => {
        expect.assertions(1);

        const runtime = getStorageUtilsRuntime({
            getLocalStorage: () => null,
        });

        expect(runtime.getDefaultStorage()).toBeNull();
    });

    it("prefers the scoped provider over the static storage reference", () => {
        expect.assertions(1);

        const fallbackStorage: StorageLike = {
                getItem: () => "fallback",
            },
            providedStorage: StorageLike = {
                getItem: () => "provided",
            },
            runtime = getStorageUtilsRuntime({
                getLocalStorage: () => providedStorage,
                localStorage: fallbackStorage,
            });

        expect(runtime.getDefaultStorage()).toBe(providedStorage);
    });
});

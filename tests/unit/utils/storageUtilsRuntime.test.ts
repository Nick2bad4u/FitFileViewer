import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getStorageUtilsRuntime,
    type StorageLike,
} from "../../../electron-app/utils/storage/storageUtilsRuntime.js";

describe("storage utilities runtime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the default localStorage reference", () => {
        expect.assertions(1);

        const localStorage: StorageLike = {
            getItem: () => "default",
        };
        vi.stubGlobal("localStorage", localStorage);

        expect(getStorageUtilsRuntime().getDefaultStorage()).toBe(localStorage);
    });

    it("returns an injected localStorage reference", () => {
        expect.assertions(1);

        const localStorage: StorageLike = {
                getItem: () => "value",
            },
            runtime = getStorageUtilsRuntime({
                getLocalStorage: () => localStorage,
            });

        expect(runtime.getDefaultStorage()).toBe(localStorage);
    });

    it("returns null when localStorage is unavailable", () => {
        expect.assertions(1);

        const runtime = getStorageUtilsRuntime({
            getLocalStorage: () => null,
        });

        expect(runtime.getDefaultStorage()).toBeNull();
    });

    it("ignores legacy direct storage scope references", () => {
        expect.assertions(1);

        const localStorage: StorageLike = {
                getItem: () => "legacy",
            },
            runtime = getStorageUtilsRuntime({
                localStorage,
            } as unknown as Parameters<typeof getStorageUtilsRuntime>[0]);

        expect(runtime.getDefaultStorage()).toBeNull();
    });
});

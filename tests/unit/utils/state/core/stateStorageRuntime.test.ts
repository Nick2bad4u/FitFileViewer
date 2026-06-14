import { describe, expect, it, vi } from "vitest";

import { getStateStorageRuntime } from "../../../../../electron-app/utils/state/core/stateStorageRuntime.js";

function createStorage(): Storage {
    const values = new Map<string, string>();

    return {
        clear: vi.fn(() => values.clear()),
        getItem: vi.fn((key: string) => values.get(key) ?? null),
        key: vi.fn((index: number) => [...values.keys()][index] ?? null),
        get length() {
            return values.size;
        },
        removeItem: vi.fn((key: string) => values.delete(key)),
        setItem: vi.fn((key: string, value: string) => {
            values.set(key, value);
        }),
    } satisfies Storage;
}

describe("stateStorageRuntime", () => {
    it("reads and writes through the injected localStorage reference", () => {
        expect.assertions(5);

        const storage = createStorage();
        const runtime = getStateStorageRuntime({ localStorage: storage });

        expect(runtime.setItem("fitFileViewer_state", '{"ui":true}')).toBe(
            true
        );

        expect(storage.setItem).toHaveBeenCalledWith(
            "fitFileViewer_state",
            '{"ui":true}'
        );
        expect(runtime.getItem("fitFileViewer_state")).toBe('{"ui":true}');
        expect(storage.getItem).toHaveBeenCalledWith("fitFileViewer_state");
        expect(runtime.getLocalStorage()).toBe(storage);
    });

    it("no-ops cleanly when localStorage is unavailable", () => {
        expect.assertions(2);

        const runtime = getStateStorageRuntime({});

        expect(runtime.getItem("fitFileViewer_state")).toBeNull();
        expect(runtime.setItem("fitFileViewer_state", "{}")).toBe(false);
    });
});

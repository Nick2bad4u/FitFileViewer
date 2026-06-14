import { describe, expect, it, vi } from "vitest";

import { getSettingsStateCoreRuntime } from "../../../../../electron-app/utils/state/domain/settingsStateCoreRuntime.js";

describe("getSettingsStateCoreRuntime", () => {
    it("returns the injected localStorage reference", () => {
        expect.assertions(1);

        const storage = {
            clear: vi.fn(),
            getItem: vi.fn(),
            key: vi.fn(),
            length: 0,
            removeItem: vi.fn(),
            setItem: vi.fn(),
        } satisfies Storage;

        expect(
            getSettingsStateCoreRuntime({
                localStorage: storage,
            }).getLocalStorage()
        ).toBe(storage);
    });

    it("registers storage listeners through the injected event target", () => {
        expect.assertions(3);

        const addEventListener = vi.fn();
        const controller = new AbortController();
        const { signal } = controller;
        const listener = vi.fn();

        expect(
            getSettingsStateCoreRuntime({
                addEventListener,
            }).addStorageEventListener(listener, signal)
        ).toBe(true);
        expect(addEventListener).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledWith("storage", listener, {
            signal,
        });
        controller.abort();
    });

    it("returns false when storage listener registration is unavailable", () => {
        expect.assertions(1);

        const controller = new AbortController();

        expect(
            getSettingsStateCoreRuntime({}).addStorageEventListener(
                vi.fn(),
                controller.signal
            )
        ).toBe(false);
        controller.abort();
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getSettingsStateCoreRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getSettingsStateCoreRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "settingsStateCore requires an AbortController runtime"
        );
    });
});

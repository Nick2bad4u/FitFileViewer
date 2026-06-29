import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import type { SettingsStateCoreRuntimeScope } from "../../../../../electron-app/utils/state/domain/settingsStateCoreRuntime.js";
import { getSettingsStateCoreRuntime } from "../../../../../electron-app/utils/state/domain/settingsStateCoreRuntime.js";

function createRuntimeScope(
    overrides: Partial<SettingsStateCoreRuntimeScope> = {}
): SettingsStateCoreRuntimeScope {
    return {
        getAbortController: () => undefined,
        getAddEventListener: () => undefined,
        getDateNow: () => undefined,
        getLocalStorage: () => undefined,
        ...overrides,
    };
}

describe("getSettingsStateCoreRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("reads timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const runtime = getSettingsStateCoreRuntime(
            createRuntimeScope({
                getDateNow: () => dateNow,
            })
        );

        expect(runtime.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

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
                ...createRuntimeScope(),
                getLocalStorage: () => storage,
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
                ...createRuntimeScope(),
                getAddEventListener: () => addEventListener,
            }).addStorageEventListener(listener, signal)
        ).toBe(true);
        expect(addEventListener).toHaveBeenCalledOnce();
        expect(addEventListener).toHaveBeenCalledWith("storage", listener, {
            signal,
        });
        controller.abort();
    });

    it("uses browser runtime providers for production storage listeners", () => {
        expect.assertions(2);

        const target = new EventTarget();
        const controller = new AbortController();
        let storageEvents = 0;
        const listener = (): void => {
            storageEvents += 1;
        };
        vi.stubGlobal("addEventListener", target.addEventListener.bind(target));

        expect(
            getSettingsStateCoreRuntime().addStorageEventListener(
                listener,
                controller.signal
            )
        ).toBe(true);
        target.dispatchEvent(new StorageEvent("storage"));

        expect(storageEvents).toBe(1);

        controller.abort();
    });

    it("returns false when storage listener registration is unavailable", () => {
        expect.assertions(1);

        const controller = new AbortController();

        expect(
            getSettingsStateCoreRuntime(
                createRuntimeScope({
                    getAddEventListener: () => undefined,
                })
            ).addStorageEventListener(vi.fn(), controller.signal)
        ).toBe(false);
        controller.abort();
    });

    it("returns undefined when localStorage is unavailable", () => {
        expect.assertions(1);

        expect(
            getSettingsStateCoreRuntime(
                createRuntimeScope({
                    getLocalStorage: () => undefined,
                })
            ).getLocalStorage()
        ).toBeUndefined();
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getSettingsStateCoreRuntime(
            createRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            })
        );

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getSettingsStateCoreRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production date and storage defaults", () => {
        expect.assertions(2);

        const storage = {
            clear: vi.fn(),
            getItem: vi.fn(),
            key: vi.fn(),
            length: 0,
            removeItem: vi.fn(),
            setItem: vi.fn(),
        } satisfies Storage;
        vi.spyOn(Date, "now").mockReturnValue(5678);
        vi.stubGlobal("localStorage", storage);

        const runtime = getSettingsStateCoreRuntime();

        expect(runtime.dateNow()).toBe(5678);
        expect(runtime.getLocalStorage()).toBe(storage);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getSettingsStateCoreRuntime(
            createRuntimeScope({
                getAbortController: () => undefined,
            })
        );

        expect(() => runtime.createAbortController()).toThrow(
            "settingsStateCore requires an AbortController runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(5);

        const storage = {
            clear: vi.fn(),
            getItem: vi.fn(),
            key: vi.fn(),
            length: 0,
            removeItem: vi.fn(),
            setItem: vi.fn(),
        } satisfies Storage;
        const controller = new AbortController();
        const dateNow = vi.fn<() => number>(() => 1234);
        const legacyScope = {
            AbortController,
            addEventListener: vi.fn(),
            dateNow,
            localStorage: storage,
        } as unknown as SettingsStateCoreRuntimeScope;
        const runtime = getSettingsStateCoreRuntime(legacyScope);

        expect(runtime.getLocalStorage).toThrow(
            "settingsStateCore requires a localStorage provider"
        );
        expect(() =>
            runtime.addStorageEventListener(vi.fn(), controller.signal)
        ).toThrow("settingsStateCore requires an addEventListener provider");
        expect(() => runtime.createAbortController()).toThrow(
            "settingsStateCore requires an AbortController provider"
        );
        expect(() => runtime.dateNow()).toThrow(
            "settingsStateCore requires a dateNow provider"
        );
        expect(dateNow).not.toHaveBeenCalled();

        controller.abort();
    });

    it("fails clearly when named providers are omitted", () => {
        expect.assertions(4);

        const runtime = getSettingsStateCoreRuntime(
            {} as unknown as SettingsStateCoreRuntimeScope
        );
        const controller = new AbortController();

        expect(runtime.getLocalStorage).toThrow(
            "settingsStateCore requires a localStorage provider"
        );
        expect(() =>
            runtime.addStorageEventListener(vi.fn(), controller.signal)
        ).toThrow("settingsStateCore requires an addEventListener provider");
        expect(() => runtime.createAbortController()).toThrow(
            "settingsStateCore requires an AbortController provider"
        );
        expect(() => runtime.dateNow()).toThrow(
            "settingsStateCore requires a dateNow provider"
        );

        controller.abort();
    });

    it("fails clearly when date clocks are unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getSettingsStateCoreRuntime(
                createRuntimeScope({
                    getDateNow: () => undefined,
                })
            ).dateNow()
        ).toThrow("settingsStateCore requires dateNow");
    });
});

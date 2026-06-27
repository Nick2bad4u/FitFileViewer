import { afterEach, describe, expect, it, vi } from "vitest";

import {
    deleteBrowserLeafletGlobals,
    getBrowserClearTimeout,
    getBrowserDevelopmentFlag,
    getBrowserElectronApiCandidate,
    getBrowserProcessCandidate,
    getBrowserVitestImportMockCandidate,
    getBrowserSetTimeout,
    setBrowserProcessCandidate,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";

describe("browserRuntime global property boundary", () => {
    const originalProcessDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        "process"
    );

    afterEach(() => {
        vi.unstubAllGlobals();
        if (originalProcessDescriptor === undefined) {
            Reflect.deleteProperty(globalThis, "process");
            return;
        }
        Object.defineProperty(globalThis, "process", originalProcessDescriptor);
    });

    it("reads named runtime global candidates through explicit providers", () => {
        expect.assertions(3);

        const electronAPI = { openExternal: vi.fn() };
        const vitestCandidate = { importMock: vi.fn() };

        vi.stubGlobal("__DEVELOPMENT__", true);
        vi.stubGlobal("electronAPI", electronAPI);
        vi.stubGlobal("vi", vitestCandidate);

        expect(getBrowserDevelopmentFlag()).toBe(true);
        expect(getBrowserElectronApiCandidate()).toBe(electronAPI);
        expect(getBrowserVitestImportMockCandidate()).toBe(vitestCandidate);
    });

    it("deletes temporary Leaflet globals through a named provider", () => {
        expect.assertions(3);

        vi.stubGlobal("L", { version: "test" });
        vi.stubGlobal("Leaflet", { version: "test" });
        vi.stubGlobal("ffvNotLeaflet", { retained: true });

        deleteBrowserLeafletGlobals();

        expect(Reflect.has(globalThis, "L")).toBe(false);
        expect(Reflect.has(globalThis, "Leaflet")).toBe(false);
        expect(Reflect.has(globalThis, "ffvNotLeaflet")).toBe(true);
    });

    it("sets the process global through the named process provider", () => {
        expect.assertions(2);

        const value = { enabled: true };

        setBrowserProcessCandidate(value);

        expect(getBrowserProcessCandidate()).toBe(value);
        expect(globalThis).toHaveProperty("process", value);
    });

    it("defines the process global when direct assignment cannot update an accessor", () => {
        expect.assertions(1);

        const value = { enabled: true };

        Object.defineProperty(globalThis, "process", {
            configurable: true,
            get() {
                return undefined;
            },
        });

        setBrowserProcessCandidate(value);

        expect(getBrowserProcessCandidate()).toBe(value);
    });

    it("ignores process writes when a global property setter throws", () => {
        expect.assertions(2);

        Object.defineProperty(globalThis, "process", {
            configurable: true,
            get() {
                return undefined;
            },
            set() {
                throw new Error("runtime shim is read-only");
            },
        });

        expect(() => {
            setBrowserProcessCandidate({ enabled: true });
        }).not.toThrow();
        expect(getBrowserProcessCandidate()).toBeUndefined();
    });

    it("returns timer providers bound to the browser global", () => {
        expect.assertions(4);

        const originalSetTimeout = globalThis.setTimeout;
        const originalClearTimeout = globalThis.clearTimeout;
        const timer = 42 as unknown as ReturnType<typeof setTimeout>;

        vi.stubGlobal(
            "setTimeout",
            function setTimeoutFixture(
                this: typeof globalThis,
                callback: () => void,
                delay?: number
            ) {
                expect(this).toBe(globalThis);
                expect(delay).toBe(25);
                callback();
                return timer;
            }
        );
        vi.stubGlobal(
            "clearTimeout",
            function clearTimeoutFixture(
                this: typeof globalThis,
                handle: ReturnType<typeof setTimeout>
            ) {
                expect(this).toBe(globalThis);
                expect(handle).toBe(timer);
            }
        );

        const setTimeoutRef = getBrowserSetTimeout();
        const clearTimeoutRef = getBrowserClearTimeout();

        setTimeoutRef?.call({ notGlobalThis: true }, () => undefined, 25);
        clearTimeoutRef?.call({ notGlobalThis: true }, timer);

        vi.stubGlobal("setTimeout", originalSetTimeout);
        vi.stubGlobal("clearTimeout", originalClearTimeout);
    });
});

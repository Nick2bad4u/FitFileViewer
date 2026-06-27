import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getBrowserClearTimeout,
    getBrowserDevelopmentFlag,
    getBrowserElectronApiCandidate,
    getBrowserGlobalProperty,
    getBrowserVitestImportMockCandidate,
    getBrowserSetTimeout,
    setBrowserGlobalProperty,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";

describe("browserRuntime global property boundary", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reads named global properties through the shared boundary", () => {
        expect.assertions(4);

        const electronAPI = { openExternal: vi.fn() };
        const vitestCandidate = { importMock: vi.fn() };

        vi.stubGlobal("ffvRuntimeFlag", true);
        vi.stubGlobal("__DEVELOPMENT__", true);
        vi.stubGlobal("electronAPI", electronAPI);
        vi.stubGlobal("vi", vitestCandidate);

        expect(getBrowserGlobalProperty("ffvRuntimeFlag")).toBe(true);
        expect(getBrowserDevelopmentFlag()).toBe(true);
        expect(getBrowserElectronApiCandidate()).toBe(electronAPI);
        expect(getBrowserVitestImportMockCandidate()).toBe(vitestCandidate);
    });

    it("returns undefined when a global property accessor throws", () => {
        expect.assertions(1);

        vi.stubGlobal("ffvThrowingGlobal", undefined);
        Object.defineProperty(globalThis, "ffvThrowingGlobal", {
            configurable: true,
            get() {
                throw new Error("global is unavailable");
            },
        });

        expect(getBrowserGlobalProperty("ffvThrowingGlobal")).toBeUndefined();
    });

    it("sets named global properties through the shared boundary", () => {
        expect.assertions(2);

        const value = { enabled: true };

        vi.stubGlobal("ffvRuntimeShim", undefined);
        setBrowserGlobalProperty("ffvRuntimeShim", value);

        expect(getBrowserGlobalProperty("ffvRuntimeShim")).toBe(value);
        expect(globalThis).toHaveProperty("ffvRuntimeShim", value);
    });

    it("defines named globals when direct assignment cannot update an accessor", () => {
        expect.assertions(2);

        const value = { enabled: true };

        vi.stubGlobal("ffvAccessorRuntimeShim", undefined);
        Object.defineProperty(globalThis, "ffvAccessorRuntimeShim", {
            configurable: true,
            get() {
                return undefined;
            },
        });

        setBrowserGlobalProperty("ffvAccessorRuntimeShim", value);

        expect(getBrowserGlobalProperty("ffvAccessorRuntimeShim")).toBe(value);
        expect(globalThis).toHaveProperty("ffvAccessorRuntimeShim", value);
    });

    it("ignores writes when a global property setter throws", () => {
        expect.assertions(2);

        vi.stubGlobal("ffvReadonlyRuntimeShim", undefined);
        Object.defineProperty(globalThis, "ffvReadonlyRuntimeShim", {
            configurable: true,
            get() {
                return undefined;
            },
            set() {
                throw new Error("runtime shim is read-only");
            },
        });

        expect(() => {
            setBrowserGlobalProperty("ffvReadonlyRuntimeShim", {
                enabled: true,
            });
        }).not.toThrow();
        expect(
            getBrowserGlobalProperty("ffvReadonlyRuntimeShim")
        ).toBeUndefined();
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

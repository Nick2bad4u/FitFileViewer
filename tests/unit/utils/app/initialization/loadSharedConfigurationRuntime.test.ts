import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getLoadSharedConfigurationRuntime,
    type LoadSharedConfigurationTimerHandle,
    type LoadSharedConfigurationRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/loadSharedConfigurationRuntime.js";

describe("getLoadSharedConfigurationRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("reads the current location search from an injected runtime scope", () => {
        expect.assertions(1);

        const runtime = getLoadSharedConfigurationRuntime({
            getLocation: () => ({
                search: "?chartConfig=abc",
            }),
        });

        expect(runtime.locationSearch).toBe("?chartConfig=abc");
    });

    it("uses browser runtime providers for production location defaults", () => {
        expect.assertions(1);

        vi.stubGlobal("location", {
            search: "?chartConfig=production",
        });

        expect(getLoadSharedConfigurationRuntime().locationSearch).toBe(
            "?chartConfig=production"
        );
    });

    it("uses an empty search string when no location is available", () => {
        expect.assertions(1);

        expect(getLoadSharedConfigurationRuntime({}).locationSearch).toBe("");
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("100");
        const timer = 23 as LoadSharedConfigurationTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(
            () => timer as BrowserTimerHandle
        );
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const runtime = getLoadSharedConfigurationRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("100");
        const timer = 29 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getLoadSharedConfigurationRuntime();
        const timerHandle = runtime.setTimeout(callback, timeoutMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
        expect(clearTimeoutMock).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getLoadSharedConfigurationRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "loadSharedConfigurationRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as LoadSharedConfigurationTimerHandle)
        ).toThrow("loadSharedConfigurationRuntime requires clearTimeout");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timer = 23 as BrowserTimerHandle;
        const legacySetTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const legacyClearTimeout = vi.fn<BrowserClearTimeout>();
        const legacyScope = {
            clearTimeout: legacyClearTimeout,
            location: {
                search: "?chartConfig=abc",
            },
            setTimeout: legacySetTimeout,
        } as unknown as LoadSharedConfigurationRuntimeScope;
        const runtime = getLoadSharedConfigurationRuntime(legacyScope);

        expect(runtime.locationSearch).toBe("");
        expect(() => runtime.setTimeout(callback, 1)).toThrow(
            "loadSharedConfigurationRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "loadSharedConfigurationRuntime requires clearTimeout"
        );
    });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import type { UpdateTabVisibilityRuntimeScope } from "../../../../../electron-app/utils/ui/tabs/updateTabVisibilityRuntime.js";
import { getUpdateTabVisibilityRuntime } from "../../../../../electron-app/utils/ui/tabs/updateTabVisibilityRuntime.js";

function createRuntimeScope(
    overrides: Partial<UpdateTabVisibilityRuntimeScope> = {}
): UpdateTabVisibilityRuntimeScope {
    return {
        getClearTimeout: () => undefined,
        getDocument: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getUpdateTabVisibilityRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("returns the injected document", () => {
        expect.assertions(1);

        expect(
            getUpdateTabVisibilityRuntime(
                createRuntimeScope({
                    getDocument: () => document,
                })
            ).getDocument()
        ).toBe(document);
    });

    it("returns undefined when the document runtime is unavailable", () => {
        expect.assertions(1);

        expect(
            getUpdateTabVisibilityRuntime(createRuntimeScope()).getDocument()
        ).toBeUndefined();
    });

    it("wraps animation-frame scheduling", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 4);
        const utils = getUpdateTabVisibilityRuntime(
            createRuntimeScope({
                getRequestAnimationFrame: () => requestAnimationFrame,
            })
        );

        expect(utils.requestAnimationFrame(callback)).toBe(4);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getUpdateTabVisibilityRuntime(
                createRuntimeScope()
            ).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("wraps timer scheduling and cleanup", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 8);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const utils = getUpdateTabVisibilityRuntime(
            createRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );
        const timeoutMs = Number.parseInt("180", 10);

        expect(utils.setTimeout(callback, timeoutMs)).toBe(8);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);

        utils.clearTimeout(8);

        expect(clearTimeout).toHaveBeenCalledWith(8);
        expect(callback).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production scheduling defaults", () => {
        expect.assertions(8);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const timeoutMs = Number.parseInt("180", 10);
        const timer = 33 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrameMock = vi.fn<BrowserRequestAnimationFrame>(
            () => 12
        );

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getUpdateTabVisibilityRuntime();
        const timerHandle = runtime.setTimeout(callback, timeoutMs);
        runtime.clearTimeout(timerHandle);
        const animationFrameHandle =
            runtime.requestAnimationFrame(frameCallback);

        expect(timerHandle).toBe(timer);
        expect(animationFrameHandle).toBe(12);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(requestAnimationFrameMock).toHaveBeenCalledWith(frameCallback);
        expect(requestAnimationFrameMock.mock.contexts[0]).toBe(globalThis);
        expect(callback).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
    });

    it("fails clearly when providers are omitted", () => {
        expect.assertions(4);

        const runtime = getUpdateTabVisibilityRuntime(
            {} as UpdateTabVisibilityRuntimeScope
        );

        expect(() => runtime.getDocument()).toThrow(
            "updateTabVisibility requires a document provider"
        );
        expect(() => runtime.requestAnimationFrame(() => {})).toThrow(
            "updateTabVisibility requires a requestAnimationFrame provider"
        );

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "updateTabVisibility requires a setTimeout provider"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "updateTabVisibility requires a clearTimeout provider"
        );
    });

    it("fails clearly when individual provider slots are omitted", () => {
        expect.assertions(4);

        expect(() =>
            getUpdateTabVisibilityRuntime({
                ...createRuntimeScope(),
                getDocument: undefined,
            }).getDocument()
        ).toThrow("updateTabVisibility requires a document provider");
        expect(() =>
            getUpdateTabVisibilityRuntime({
                ...createRuntimeScope(),
                getRequestAnimationFrame: undefined,
            }).requestAnimationFrame(() => {})
        ).toThrow(
            "updateTabVisibility requires a requestAnimationFrame provider"
        );
        expect(() =>
            getUpdateTabVisibilityRuntime({
                ...createRuntimeScope(),
                getSetTimeout: undefined,
            }).setTimeout(() => {}, 0)
        ).toThrow("updateTabVisibility requires a setTimeout provider");
        expect(() =>
            getUpdateTabVisibilityRuntime({
                ...createRuntimeScope(),
                getClearTimeout: undefined,
            }).clearTimeout(0)
        ).toThrow("updateTabVisibility requires a clearTimeout provider");
    });

    it("does not borrow ambient timers for unavailable provider values", () => {
        expect.assertions(2);

        const runtime = getUpdateTabVisibilityRuntime(createRuntimeScope());

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "updateTabVisibility requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "updateTabVisibility requires a clearTimeout runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const legacyScope = {
            clearTimeout: vi.fn<(handle: number) => void>(),
            document,
            requestAnimationFrame: vi.fn<
                (callback: FrameRequestCallback) => number
            >(() => 4),
            setTimeout: vi.fn<
                (callback: () => void, timeout?: number) => number
            >(() => 8),
        } as unknown as UpdateTabVisibilityRuntimeScope;
        const runtime = getUpdateTabVisibilityRuntime(legacyScope);

        expect(() => runtime.getDocument()).toThrow(
            "updateTabVisibility requires a document provider"
        );
        expect(() => runtime.requestAnimationFrame(frameCallback)).toThrow(
            "updateTabVisibility requires a requestAnimationFrame provider"
        );
        expect(() => runtime.setTimeout(callback, 1)).toThrow(
            "updateTabVisibility requires a setTimeout provider"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "updateTabVisibility requires a clearTimeout provider"
        );
        expect(callback).not.toHaveBeenCalled();
    });
});

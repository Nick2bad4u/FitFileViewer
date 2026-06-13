import { describe, expect, it, vi } from "vitest";

import { getRecentFilesContextMenuRuntime } from "../../../../../electron-app/utils/app/lifecycle/recentFilesContextMenuRuntime.js";

describe("recentFilesContextMenuRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getRecentFilesContextMenuRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getRecentFilesContextMenuRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "recent files context menu requires an AbortController runtime"
        );
    });

    it("reads finite viewport dimensions from a scoped window", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({
                window: {
                    innerHeight: 720,
                    innerWidth: 1280,
                },
            }).getViewport()
        ).toStrictEqual({
            height: 720,
            width: 1280,
        });
    });

    it("falls back to zero dimensions outside renderer scopes", () => {
        expect.assertions(1);

        expect(getRecentFilesContextMenuRuntime({}).getViewport()).toStrictEqual(
            {
                height: 0,
                width: 0,
            }
        );
    });

    it("normalizes invalid dimensions to zero", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({
                window: {
                    innerHeight: Number.NaN,
                    innerWidth: Number.POSITIVE_INFINITY,
                },
            }).getViewport()
        ).toStrictEqual({
            height: 0,
            width: 0,
        });
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("0");
        const timer = 31 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getRecentFilesContextMenuRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getRecentFilesContextMenuRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "recent files context menu requires a setTimeout runtime"
        );
        expect(() => {
            runtime.clearTimeout(
                31 as ReturnType<typeof globalThis.setTimeout>
            );
        }).toThrow("recent files context menu requires a clearTimeout runtime");
    });
});

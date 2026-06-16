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
            getAbortController: () =>
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

    it("reads finite viewport dimensions from a scoped viewport", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({
                getViewport: () => ({
                    height: 720,
                    width: 1280,
                }),
            }).getViewport()
        ).toStrictEqual({
            height: 720,
            width: 1280,
        });
    });

    it("falls back to zero dimensions outside renderer scopes", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({}).getViewport()
        ).toStrictEqual({
            height: 0,
            width: 0,
        });
    });

    it("normalizes invalid dimensions to zero", () => {
        expect.assertions(1);

        expect(
            getRecentFilesContextMenuRuntime({
                getViewport: () => ({
                    height: Number.NaN,
                    width: Number.POSITIVE_INFINITY,
                }),
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
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const delayMs = Number("25");
        let mousedownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const mousedownListener = () => {
            mousedownCount += 1;
        };
        const timer = 47 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const runtime = getRecentFilesContextMenuRuntime({
            getAbortController: () => TestAbortController,
            getClearTimeout: () => clearTimeout,
            getDocumentEventTarget: () => documentEventTarget,
            getSetTimeout: () => setTimeout,
            getViewport: () => ({ height: 900, width: 1440 }),
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
        runtime.addDocumentMousedownListener(mousedownListener, {
            signal: runtime.createAbortController().signal,
        });
        documentEventTarget.dispatchEvent(new MouseEvent("mousedown"));
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(mousedownCount).toBe(1);
        expect(runtime.getViewport()).toStrictEqual({
            height: 900,
            width: 1440,
        });
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(3);

        const runtime = getRecentFilesContextMenuRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "recent files context menu requires a setTimeout runtime"
        );
        expect(() => {
            runtime.clearTimeout(
                31 as ReturnType<typeof globalThis.setTimeout>
            );
        }).toThrow("recent files context menu requires a clearTimeout runtime");
        expect(() =>
            runtime.addDocumentMousedownListener(() => undefined, {})
        ).toThrow(
            "recent files context menu requires a document event-target runtime"
        );
    });

    it("registers document mousedown listeners through the injected event target", () => {
        expect.assertions(3);

        let mousedownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const listener = () => {
            mousedownCount += 1;
        };
        const controller = new AbortController();
        const runtime = getRecentFilesContextMenuRuntime({
            getDocumentEventTarget: () => documentEventTarget,
        });

        runtime.addDocumentMousedownListener(listener, {
            signal: controller.signal,
        });
        documentEventTarget.dispatchEvent(new MouseEvent("mousedown"));

        expect(addEventListener).toHaveBeenCalledWith("mousedown", listener, {
            signal: controller.signal,
        });
        expect(mousedownCount).toBe(1);
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(11);

        const AbortControllerConstructor = vi.fn();
        const callback = vi.fn<() => void>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const runtime = getRecentFilesContextMenuRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            clearTimeout,
            documentEventTarget,
            setTimeout,
            viewport: {
                height: 720,
                width: 1280,
            },
        } as unknown as Parameters<typeof getRecentFilesContextMenuRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "recent files context menu requires an AbortController runtime"
        );
        expect(() =>
            runtime.addDocumentMousedownListener(() => undefined, {})
        ).toThrow(
            "recent files context menu requires a document event-target runtime"
        );
        expect(() => runtime.setTimeout(callback, 0)).toThrow(
            "recent files context menu requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(31 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("recent files context menu requires a clearTimeout runtime");
        expect(runtime.getViewport()).toStrictEqual({ height: 0, width: 0 });
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });
});

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

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getRecentFilesContextMenuRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
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
        expect.assertions(5);

        const callback = vi.fn<() => void>();
        const timestamp = Number("1700");
        const delayMs = Number("0");
        const timer = 31 as ReturnType<typeof globalThis.setTimeout>;
        const dateNow = vi.fn<() => number>(() => timestamp);
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getRecentFilesContextMenuRuntime({
            getClearTimeout: () => clearTimeout,
            getDateNow: () => dateNow,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.dateNow()).toBe(timestamp);
        expect(dateNow).toHaveBeenCalledOnce();
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(16);

        const callback = vi.fn<() => void>();
        const timestamp = Number("2400");
        const delayMs = Number("25");
        let mousedownCount = 0;
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const mousedownListener = () => {
            mousedownCount += 1;
        };
        const timer = 47 as ReturnType<typeof globalThis.setTimeout>;
        const dateNow = vi.fn<() => number>(() => timestamp);
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
            getDateNow: () => dateNow,
            getDocument: () => documentEventTarget,
            getDocumentEventTarget: () => documentEventTarget,
            getNode: () => Node,
            getSetTimeout: () => setTimeout,
            getViewport: () => ({ height: 900, width: 1440 }),
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
        expect(runtime.dateNow()).toBe(timestamp);
        expect(dateNow).toHaveBeenCalledOnce();
        runtime.addDocumentMousedownListener(mousedownListener, {
            signal: runtime.createAbortController().signal,
        });
        documentEventTarget.dispatchEvent(new MouseEvent("mousedown"));
        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(mousedownCount).toBe(1);
        const menu = runtime.createMenuElement();
        menu.id = "recent-files-menu";
        runtime.appendToBody(menu);
        expect(runtime.isNode(menu)).toBe(true);
        expect(runtime.isNode({})).toBe(false);
        expect(runtime.bodyContains(menu)).toBe(true);
        expect(runtime.isBodyParent(menu)).toBe(true);
        expect(runtime.findRecentFilesMenu()).toBe(menu);
        expect(runtime.hasRecentFilesMenu()).toBe(true);
        const firstMenu = runtime.createMenuElement();
        firstMenu.id = "first-menu";
        runtime.insertBeforeBodyFirstChild(firstMenu);
        expect(documentEventTarget.body.firstChild).toBe(firstMenu);
        expect(runtime.getBodyDebugInfo()).toMatchObject({
            canAppend: true,
            childElementCount: 2,
            childNodeCount: 2,
            constructorName: "HTMLBodyElement",
            present: true,
        });
        expect(runtime.getViewport()).toStrictEqual({
            height: 900,
            width: 1440,
        });
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(13);

        const runtime = getRecentFilesContextMenuRuntime({});
        const element = document.createElement("div");

        expect(() => runtime.dateNow()).toThrow(
            "recent files context menu requires a dateNow runtime"
        );
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
        expect(() => runtime.appendToBody(element)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.bodyContains(element)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.createMenuElement()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.findRecentFilesMenu()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.getBodyDebugInfo()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.hasRecentFilesMenu()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.insertBeforeBodyFirstChild(element)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.isBodyParent(element)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.isNode(element)).toThrow(
            "recent files context menu requires a Node runtime"
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

    it("derives document mousedown listeners from the scoped document provider", () => {
        expect.assertions(3);

        let mousedownCount = 0;
        const documentRef = document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const listener = () => {
            mousedownCount += 1;
        };
        const controller = new AbortController();
        const runtime = getRecentFilesContextMenuRuntime({
            getDocument: () => documentRef,
        });

        runtime.addDocumentMousedownListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new MouseEvent("mousedown"));

        expect(addEventListener).toHaveBeenCalledWith("mousedown", listener, {
            signal: controller.signal,
        });
        expect(mousedownCount).toBe(1);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(24);

        const AbortControllerConstructor = vi.fn();
        const callback = vi.fn<() => void>();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const dateNow = vi.fn<() => number>(() => Number("1700"));
        const setTimeout = vi.fn<typeof globalThis.setTimeout>();
        const documentEventTarget =
            document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(
            documentEventTarget,
            "addEventListener"
        );
        const createElement = vi.spyOn(documentEventTarget, "createElement");
        const querySelector = vi.spyOn(documentEventTarget, "querySelector");
        const runtime = getRecentFilesContextMenuRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            clearTimeout,
            dateNow,
            documentEventTarget,
            Node,
            setTimeout,
            viewport: {
                height: 720,
                width: 1280,
            },
        } as unknown as Parameters<typeof getRecentFilesContextMenuRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "recent files context menu requires an AbortController runtime"
        );
        expect(() => runtime.dateNow()).toThrow(
            "recent files context menu requires a dateNow runtime"
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
        expect(() => runtime.appendToBody(document.body)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.bodyContains(document.body)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.createMenuElement()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.findRecentFilesMenu()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.getBodyDebugInfo()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.hasRecentFilesMenu()).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.insertBeforeBodyFirstChild(document.body)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.isBodyParent(document.body)).toThrow(
            "recent files context menu requires a document runtime"
        );
        expect(() => runtime.isNode(document.body)).toThrow(
            "recent files context menu requires a Node runtime"
        );
        expect(runtime.getViewport()).toStrictEqual({ height: 0, width: 0 });
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(addEventListener).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
        expect(querySelector).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(dateNow).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(documentEventTarget.body.childElementCount).toBe(0);
    });
});

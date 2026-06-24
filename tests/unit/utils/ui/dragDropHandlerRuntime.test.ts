import { afterEach, describe, expect, it, vi } from "vitest";

import { getDragDropHandlerRuntime } from "../../../../electron-app/utils/ui/dragDropHandlerRuntime.js";

describe("getDragDropHandlerRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime provider", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getDragDropHandlerRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("creates file readers through the injected runtime provider", () => {
        expect.assertions(2);

        const reader = new FileReader();
        const FileReaderConstructor = vi.fn(function FakeFileReader() {
            return reader;
        });
        const runtime = getDragDropHandlerRuntime({
            getFileReader: () =>
                FileReaderConstructor as unknown as typeof FileReader,
        });

        expect(runtime.createFileReader()).toBe(reader);
        expect(FileReaderConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getDragDropHandlerRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "dragDropHandler requires an AbortController runtime"
        );
    });

    it("throws when file reader creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getDragDropHandlerRuntime({});

        expect(() => runtime.createFileReader()).toThrow(
            "dragDropHandler requires a FileReader runtime"
        );
    });

    it("schedules animation frames through the injected runtime provider", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 42);
        const scope = {
            getRequestAnimationFrame: () => requestAnimationFrame,
        };
        const runtime = getDragDropHandlerRuntime(scope);

        expect(runtime.requestAnimationFrame(callback)).toBe(42);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(requestAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("runs animation frame callbacks immediately when scheduling is unavailable", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const runtime = getDragDropHandlerRuntime({});

        expect(runtime.requestAnimationFrame(callback)).toBe(null);
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("cancels animation frames through the injected runtime provider", () => {
        expect.assertions(2);

        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const scope = {
            getCancelAnimationFrame: () => cancelAnimationFrame,
        };
        const runtime = getDragDropHandlerRuntime(scope);

        runtime.cancelAnimationFrame(17);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
        expect(cancelAnimationFrame.mock.contexts[0]).toBe(scope);
    });

    it("resolves date clocks through the injected runtime provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn(() => 123_456);
        const runtime = getDragDropHandlerRuntime({
            getDateNow: () => dateNow,
        });

        expect(runtime.dateNow()).toBe(123_456);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("throws when date clock resolution is unavailable", () => {
        expect.assertions(1);

        const runtime = getDragDropHandlerRuntime({});

        expect(() => runtime.dateNow()).toThrow(
            "dragDropHandler requires a date clock runtime"
        );
    });

    it("resolves document and event target through injected runtime providers", () => {
        expect.assertions(2);

        const documentTarget = document.implementation.createHTMLDocument();
        const eventTarget = new EventTarget();
        const runtime = getDragDropHandlerRuntime({
            getDocument: () => documentTarget,
            getEventTarget: () => eventTarget,
        });

        expect(runtime.getDocument()).toBe(documentTarget);
        expect(runtime.getEventTarget()).toBe(eventTarget);
    });

    it("throws when event target resolution is unavailable", () => {
        expect.assertions(1);

        const runtime = getDragDropHandlerRuntime({});

        expect(() => runtime.getEventTarget()).toThrow(
            "dragDropHandler requires an event target runtime"
        );
    });

    it("ignores frame cancellation when the runtime scope cannot cancel", () => {
        expect.assertions(1);

        expect(() =>
            getDragDropHandlerRuntime({}).cancelAnimationFrame(17)
        ).not.toThrow();
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(14);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const callback = vi.fn<FrameRequestCallback>();
        const documentTarget = document.implementation.createHTMLDocument();
        const eventTarget = new EventTarget();
        const reader = new FileReader();
        const FileReaderConstructor = vi.fn(function FakeFileReader() {
            return reader;
        });
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 53);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const dateNow = vi.fn(() => 123_456);
        const runtime = getDragDropHandlerRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            cancelAnimationFrame,
            dateNow,
            document: documentTarget,
            eventTarget,
            FileReader: FileReaderConstructor as unknown as typeof FileReader,
            requestAnimationFrame,
        } as unknown as Parameters<typeof getDragDropHandlerRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "dragDropHandler requires an AbortController runtime"
        );
        expect(() => runtime.createFileReader()).toThrow(
            "dragDropHandler requires a FileReader runtime"
        );
        expect(() => runtime.dateNow()).toThrow(
            "dragDropHandler requires a date clock runtime"
        );
        expect(runtime.getDocument()).toBeNull();
        expect(() => runtime.getEventTarget()).toThrow(
            "dragDropHandler requires an event target runtime"
        );
        expect(runtime.requestAnimationFrame(callback)).toBe(null);
        runtime.cancelAnimationFrame(53);

        expect(callback).toHaveBeenCalledWith(0);
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(FileReaderConstructor).not.toHaveBeenCalled();
        expect(dateNow).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(runtime.getDocument()).not.toBe(documentTarget);
        expect(() => runtime.getEventTarget()).toThrow(
            "dragDropHandler requires an event target runtime"
        );
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(11);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 41);
        const callback = vi.fn<FrameRequestCallback>();
        const dateNow = vi.fn(() => 654_321);
        const reader = new FileReader();
        const FileReaderConstructor = vi.fn(function FakeFileReader() {
            return reader;
        });
        const runtime = getDragDropHandlerRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);
        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
        vi.spyOn(Date, "now").mockImplementation(dateNow);
        vi.stubGlobal("FileReader", FileReaderConstructor);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);

        expect(runtime.createAbortController()).toBe(controller);
        expect(runtime.createFileReader()).toBe(reader);
        expect(runtime.dateNow()).toBe(654_321);
        expect(runtime.getDocument()).toBe(document);
        expect(runtime.getEventTarget()).toBe(globalThis);
        expect(runtime.requestAnimationFrame(callback)).toBe(41);
        runtime.cancelAnimationFrame(41);

        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(dateNow).toHaveBeenCalledOnce();
        expect(FileReaderConstructor).toHaveBeenCalledOnce();
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(41);
    });
});

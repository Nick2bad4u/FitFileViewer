import { afterEach, describe, expect, it, vi } from "vitest";

import { getRenderMapRuntime } from "../../../../electron-app/utils/maps/core/renderMapRuntime.js";

describe("getRenderMapRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("resolves the map container fallback through the injected document", () => {
        expect.assertions(3);

        const documentRef =
            document.implementation.createHTMLDocument("render map runtime");
        const mapContainer = documentRef.createElement("div");
        mapContainer.id = "leaflet-map";
        documentRef.body.append(mapContainer);
        const utils = getRenderMapRuntime({
            getDocument: () => documentRef,
        });

        expect(utils.getMapContainerFallback("#leaflet-map")).toBe(
            mapContainer
        );
        mapContainer.remove();
        expect(utils.getMapContainerFallback("#leaflet-map")).toBe(
            documentRef.body
        );
        expect(utils.getMapContainerFallback("#missing")).toBe(
            documentRef.body
        );
    });

    it("requires an explicit document provider for scoped fallback lookups", () => {
        expect.assertions(2);

        const staleDocument =
            document.implementation.createHTMLDocument("stale");
        const utils = getRenderMapRuntime({
            document: staleDocument,
        } as unknown as Parameters<typeof getRenderMapRuntime>[0]);

        expect(() => utils.getMapContainerFallback("#leaflet-map")).toThrow(
            "renderMap requires a document runtime"
        );
        expect(staleDocument.body.id).toBe("");
    });

    it("routes timers and abort controllers through provider functions", () => {
        expect.assertions(10);

        const callback = vi.fn<FrameRequestCallback>();
        const timerCallback = vi.fn<() => void>();
        const delayMs = Number("50");
        const timeout = 12 as ReturnType<typeof globalThis.setTimeout>;
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrame =
            vi.fn<typeof globalThis.requestAnimationFrame>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timeout);
        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const getEvent = vi.fn(() => TestEvent);
        const utils = getRenderMapRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
            getClearTimeout: () => clearTimeout,
            getEvent,
            getRequestAnimationFrame: () => requestAnimationFrame,
            getSetTimeout: () => setTimeout,
        });

        expect(utils.createAbortController()).toBe(controller);
        utils.clearTimeout(timeout);
        utils.requestAnimationFrame(callback);
        expect(utils.setTimeout(timerCallback, delayMs)).toBe(timeout);
        const changeEvent = utils.createChangeEvent();

        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(clearTimeout).toHaveBeenCalledWith(timeout);
        expect(getEvent).toHaveBeenCalledOnce();
        expect(changeEvent).toBeInstanceOf(TestEvent);
        expect(changeEvent.type).toBe("test:change");
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(setTimeout).toHaveBeenCalledWith(timerCallback, delayMs);
        expect(callback).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production scheduling defaults", () => {
        expect.assertions(8);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("125");
        const timer = 22 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(
            () => timer
        );
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();
        const requestAnimationFrameMock =
            vi.fn<typeof globalThis.requestAnimationFrame>(() => 5);

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const utils = getRenderMapRuntime();
        const timerHandle = utils.setTimeout(callback, delayMs);
        utils.clearTimeout(timerHandle);
        utils.requestAnimationFrame(frameCallback);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(requestAnimationFrameMock).toHaveBeenCalledWith(frameCallback);
        expect(requestAnimationFrameMock.mock.contexts[0]).toBe(globalThis);
        expect(callback).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
    });

    it("fails clearly when the Event runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime({});

        expect(() => utils.createChangeEvent()).toThrow(
            "renderMap requires an Event runtime"
        );
    });
});

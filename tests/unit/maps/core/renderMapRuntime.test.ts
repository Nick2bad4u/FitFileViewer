import { describe, expect, it, vi } from "vitest";

import { getRenderMapRuntime } from "../../../../electron-app/utils/maps/core/renderMapRuntime.js";

describe("getRenderMapRuntime", () => {
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

    it("fails clearly when the Event runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime({});

        expect(() => utils.createChangeEvent()).toThrow(
            "renderMap requires an Event runtime"
        );
    });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRenderMapRuntime,
    type RenderMapTimer,
    type RenderMapRuntimeScope,
} from "../../../../electron-app/utils/maps/core/renderMapRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserClearTimeout,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";

function createRenderMapRuntimeScope(
    overrides: Partial<RenderMapRuntimeScope> = {}
): RenderMapRuntimeScope {
    return {
        getAbortController: () => undefined,
        getClearTimeout: () => undefined,
        getDocument: () => undefined,
        getEvent: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

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
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getDocument: () => documentRef,
            })
        );

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
        const legacyScope = {
            document: staleDocument,
        } as unknown as RenderMapRuntimeScope;

        expect(() => getRenderMapRuntime(legacyScope)).toThrow(
            "renderMap requires an AbortController provider"
        );
        expect(staleDocument.body.id).toBe("");
    });

    it("routes timers and abort controllers through provider functions", () => {
        expect.assertions(10);

        const callback = vi.fn<FrameRequestCallback>();
        const timerCallback = vi.fn<() => void>();
        const delayMs = Number("50");
        const timeout = 12 as RenderMapTimer;
        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<BrowserRequestAnimationFrame>();
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timeout);
        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const getEvent = vi.fn(() => TestEvent);
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
                getClearTimeout: () => clearTimeout,
                getEvent,
                getRequestAnimationFrame: () => requestAnimationFrame,
                getSetTimeout: () => setTimeout,
            })
        );

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

    it("uses browser runtime providers for production document and Event defaults", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("render map runtime");
        const mapContainer = documentRef.createElement("div");
        mapContainer.id = "leaflet-map";
        documentRef.body.append(mapContainer);

        vi.stubGlobal("document", documentRef);
        vi.stubGlobal("Event", Event);

        const utils = getRenderMapRuntime();
        const changeEvent = utils.createChangeEvent();

        expect(utils.getMapContainerFallback("#leaflet-map")).toBe(
            mapContainer
        );
        expect(utils.getMapContainerFallback("#missing")).toBe(
            documentRef.body
        );
        expect(changeEvent).toBeInstanceOf(Event);
        expect(changeEvent.type).toBe("change");
    });

    it("uses browser runtime providers for production scheduling defaults", () => {
        expect.assertions(8);

        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("125");
        const timer = 22 as RenderMapTimer;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrameMock = vi.fn<BrowserRequestAnimationFrame>(
            () => 5
        );

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

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.createChangeEvent()).toThrow(
            "renderMap requires an Event runtime"
        );
    });

    it("fails clearly when runtime provider slots are omitted", () => {
        expect.assertions(1);

        expect(() =>
            getRenderMapRuntime({} as unknown as RenderMapRuntimeScope)
        ).toThrow("renderMap requires an AbortController provider");
    });

    it("fails clearly when runtime provider slots are undefined", () => {
        expect.assertions(6);

        expect(() =>
            getRenderMapRuntime(
                createRenderMapRuntimeScope({
                    getAbortController: undefined,
                })
            )
        ).toThrow("renderMap requires an AbortController provider");
        expect(() =>
            getRenderMapRuntime(
                createRenderMapRuntimeScope({
                    getClearTimeout: undefined,
                })
            )
        ).toThrow("renderMap requires a clearTimeout provider");
        expect(() =>
            getRenderMapRuntime(
                createRenderMapRuntimeScope({
                    getDocument: undefined,
                })
            )
        ).toThrow("renderMap requires a document provider");
        expect(() =>
            getRenderMapRuntime(
                createRenderMapRuntimeScope({
                    getEvent: undefined,
                })
            )
        ).toThrow("renderMap requires an Event provider");
        expect(() =>
            getRenderMapRuntime(
                createRenderMapRuntimeScope({
                    getRequestAnimationFrame: undefined,
                })
            )
        ).toThrow("renderMap requires a requestAnimationFrame provider");
        expect(() =>
            getRenderMapRuntime(
                createRenderMapRuntimeScope({
                    getSetTimeout: undefined,
                })
            )
        ).toThrow("renderMap requires a setTimeout provider");
    });
});

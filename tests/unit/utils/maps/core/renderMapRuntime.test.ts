import { describe, expect, it, vi } from "vitest";

import {
    getRenderMapRuntime,
    type RenderMapTimer,
    type RenderMapRuntimeScope,
} from "../../../../../electron-app/utils/maps/core/renderMapRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserClearTimeout,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

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
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getAbortController: () =>
                    AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            })
        );

        expect(utils.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("routes map scheduling dependencies through provider functions", () => {
        expect.assertions(15);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const callback = vi.fn<() => void>();
        const frameCallback = vi.fn<FrameRequestCallback>();
        const delayMs = Number("160");
        const timer = 123 as RenderMapTimer;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<BrowserRequestAnimationFrame>(
            () => 17
        );
        const getAbortController = vi.fn(
            () =>
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor
        );
        const getClearTimeout = vi.fn(() => clearTimeout);
        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const getEvent = vi.fn(() => TestEvent);
        const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
        const getSetTimeout = vi.fn(() => setTimeout);
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getAbortController,
                getClearTimeout,
                getEvent,
                getRequestAnimationFrame,
                getSetTimeout,
            })
        );

        expect(utils.createAbortController()).toBe(controller);
        expect(utils.setTimeout(callback, delayMs)).toBe(timer);
        utils.clearTimeout(timer);
        utils.requestAnimationFrame(frameCallback);
        const changeEvent = utils.createChangeEvent();

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(getEvent).toHaveBeenCalledOnce();
        expect(getRequestAnimationFrame).toHaveBeenCalledOnce();
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(changeEvent).toBeInstanceOf(TestEvent);
        expect(changeEvent.type).toBe("test:change");
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
        expect(callback).not.toHaveBeenCalled();
        expect(frameCallback).not.toHaveBeenCalled();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.createAbortController()).toThrow(
            "renderMap requires an AbortController runtime"
        );
    });

    it("creates change events through the injected Event runtime", () => {
        expect.assertions(3);

        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getEvent: () => TestEvent,
            })
        );
        const event = utils.createChangeEvent();

        expect(event).toBeInstanceOf(TestEvent);
        expect(event.type).toBe("test:change");
        expect(event.bubbles).toBe(false);
    });

    it("routes DOM creation and queries through the injected document provider", () => {
        expect.assertions(7);

        const documentRef =
            document.implementation.createHTMLDocument("render map runtime");
        documentRef.body.innerHTML = `
            <main id="content_map">
                <div id="leaflet-map"></div>
                <span class="overlay-filename-tooltip"></span>
                <span class="overlay-filename-tooltip"></span>
            </main>
        `;
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        const button = utils.createElement("button");
        const mapContainer = utils.querySelectorByIdFlexible("#content_map");
        const leafletMap = utils.querySelector<HTMLElement>("#leaflet-map");
        const tooltips = utils.querySelectorAll<HTMLElement>(
            ".overlay-filename-tooltip"
        );

        expect(button.ownerDocument).toBe(documentRef);
        expect(button.tagName).toBe("BUTTON");
        expect(mapContainer?.id).toBe("content_map");
        expect(leafletMap?.id).toBe("leaflet-map");
        expect(tooltips).toHaveLength(2);
        expect(utils.getMapContainerFallback("#leaflet-map")).toBe(leafletMap);
        expect(utils.getMapContainerFallback("#missing")).toBe(
            documentRef.body
        );
    });

    it("throws when change event creation is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.createChangeEvent()).toThrow(
            "renderMap requires an Event runtime"
        );
    });

    it("throws when DOM access is unavailable", () => {
        expect.assertions(5);

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.createElement("div")).toThrow(
            "renderMap requires a document runtime"
        );
        expect(() => utils.querySelector("#leaflet-map")).toThrow(
            "renderMap requires a document runtime"
        );
        expect(() =>
            utils.querySelectorAll(".overlay-filename-tooltip")
        ).toThrow("renderMap requires a document runtime");
        expect(() => utils.querySelectorByIdFlexible("#content_map")).toThrow(
            "renderMap requires a document runtime"
        );
        expect(() => utils.getMapContainerFallback("#leaflet-map")).toThrow(
            "renderMap requires a document runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = () => undefined;
        const delayMs = Number("240");
        const timer = 101 as RenderMapTimer;
        let scheduledCallback: unknown;
        let scheduledDelay: unknown;
        let clearedTimer: unknown;
        const setTimeout = ((handler: TimerHandler, timeout?: number) => {
            scheduledCallback = handler;
            scheduledDelay = timeout;
            return timer;
        }) as BrowserSetTimeout;
        const clearTimeout: BrowserClearTimeout = (handle) => {
            clearedTimer = handle;
        };
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(utils.setTimeout(callback, delayMs)).toBe(timer);
        utils.clearTimeout(timer);

        expect({ scheduledCallback, scheduledDelay }).toStrictEqual({
            scheduledCallback: callback,
            scheduledDelay: delayMs,
        });
        expect(clearedTimer).toBe(timer);
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.clearTimeout(101 as RenderMapTimer)).toThrow(
            "renderMap requires a clearTimeout runtime"
        );
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderMap requires a setTimeout runtime"
        );
    });

    it("schedules animation frames through the injected runtime scope", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        let scheduledFrameCallback: unknown;
        const requestAnimationFrame: BrowserRequestAnimationFrame = (
            frameCallback
        ) => {
            scheduledFrameCallback = frameCallback;
            return 13;
        };
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getRequestAnimationFrame: () => requestAnimationFrame,
            })
        );

        utils.requestAnimationFrame(callback);

        expect(scheduledFrameCallback).toBe(callback);
        expect(callback).not.toHaveBeenCalled();
    });

    it("falls back to a zero-delay timer when animation frames are unavailable", () => {
        expect.assertions(3);

        const callback = vi.fn<FrameRequestCallback>();
        let fallbackDelay: unknown;
        const setTimeout = ((handler: TimerHandler, delay?: number) => {
            fallbackDelay = delay;
            if (typeof handler === "function") {
                handler();
            }
            return 9 as RenderMapTimer;
        }) as BrowserSetTimeout;
        const utils = getRenderMapRuntime(
            createRenderMapRuntimeScope({
                getSetTimeout: () => setTimeout,
            })
        );

        utils.requestAnimationFrame(callback);

        expect(fallbackDelay).toBe(0);
        expect(callback).toHaveBeenCalledOnce();
        expect(callback).toHaveBeenCalledWith(0);
    });

    it("requires a timer runtime when animation frames are unavailable", () => {
        expect.assertions(1);

        const utils = getRenderMapRuntime(createRenderMapRuntimeScope());

        expect(() => utils.requestAnimationFrame(vi.fn())).toThrow(
            "renderMap requires a setTimeout runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(6);

        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return new AbortController();
            }
        );
        const setTimeout = vi.fn<BrowserSetTimeout>(
            () => 151 as RenderMapTimer
        );
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const requestAnimationFrame = vi.fn<BrowserRequestAnimationFrame>(
            () => 23
        );
        const EventConstructor = vi.fn(function FakeEvent() {
            return new Event("legacy");
        });
        const legacyScope = {
            AbortController:
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
            Event: EventConstructor as unknown as typeof Event,
            clearTimeout,
            requestAnimationFrame,
            setTimeout,
        } as unknown as RenderMapRuntimeScope;

        expect(() => getRenderMapRuntime(legacyScope)).toThrow(
            "renderMap requires an AbortController provider"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
        expect(EventConstructor).not.toHaveBeenCalled();
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
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

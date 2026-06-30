import { describe, expect, it, vi } from "vitest";

import {
    getListenersResizeRuntime,
    type ListenersResizeTimerHandle,
    type ListenersResizeRuntimeScope,
} from "../../../../../electron-app/utils/app/lifecycle/listenersResizeRuntime.js";
import type {
    BrowserCancelAnimationFrame,
    BrowserClearTimeout,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
}

function createListenersResizeRuntimeScope(
    overrides: Partial<ListenersResizeRuntimeScope> = {}
): ListenersResizeRuntimeScope {
    return {
        getAbortController: () => undefined,
        getCancelAnimationFrame: () => undefined,
        getClearTimeout: () => undefined,
        getDocument: () => undefined,
        getElement: () => undefined,
        getHTMLCanvasElement: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getResizeTarget: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getListenersResizeRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("listeners-resize-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getListenersResizeRuntime(
            createListenersResizeRuntimeScope({
                getAbortController: () => TestAbortController,
            })
        );

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getListenersResizeRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(14);

        const abortController = new AbortController();
        try {
            const controller = new AbortController();
            const AbortControllerConstructor = vi.fn(
                function AbortControllerDouble() {
                    return controller;
                }
            );
            const addEventListener = vi.fn();
            const animationCallback = vi.fn<FrameRequestCallback>();
            const cancelAnimationFrame = vi.fn<BrowserCancelAnimationFrame>();
            const clearTimeout = vi.fn<BrowserClearTimeout>();
            const frameHandle = Number.parseInt("23", 10);
            const timeoutHandle = Number.parseInt("31", 10);
            const timeoutMs = Number.parseInt("80", 10);
            const requestAnimationFrame = vi.fn<BrowserRequestAnimationFrame>(
                () => frameHandle
            );
            const setTimeout = vi.fn<BrowserSetTimeout>(
                () => timeoutHandle as ListenersResizeTimerHandle
            );
            vi.stubGlobal("AbortController", AbortControllerConstructor);
            vi.stubGlobal("addEventListener", addEventListener);
            vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
            vi.stubGlobal("clearTimeout", clearTimeout);
            vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
            vi.stubGlobal("setTimeout", setTimeout);

            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas);
            const runtime = getListenersResizeRuntime();

            runtime.addResizeListener(() => {}, {
                signal: abortController.signal,
            });
            expect(addEventListener).toHaveBeenCalledWith(
                "resize",
                expect.any(Function),
                {
                    signal: abortController.signal,
                }
            );
            expect(runtime.createAbortController()).toBe(controller);
            expect(AbortControllerConstructor).toHaveBeenCalledOnce();
            expect(runtime.queryChartCanvases()).toStrictEqual([canvas]);
            expect(runtime.queryChartTab("#tab_chart")).toBeNull();
            expect(runtime.getFullscreenElement()).toBeNull();
            expect(runtime.requestAnimationFrame(animationCallback)).toBe(
                frameHandle
            );
            expect(requestAnimationFrame).toHaveBeenCalledWith(
                animationCallback
            );
            runtime.cancelAnimationFrame(frameHandle);
            expect(cancelAnimationFrame).toHaveBeenCalledWith(frameHandle);
            expect(runtime.setTimeout(() => {}, timeoutMs)).toBe(timeoutHandle);
            expect(setTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                timeoutMs
            );
            runtime.clearTimeout(timeoutHandle);
            expect(clearTimeout).toHaveBeenCalledWith(timeoutHandle);
            expect(animationCallback).not.toHaveBeenCalled();
            expect(canvas.isConnected).toBe(true);
        } finally {
            abortController.abort();
            cleanupFixture();
        }
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getListenersResizeRuntime(
            createListenersResizeRuntimeScope()
        );

        expect(() => {
            runtime.createAbortController();
        }).toThrow("listenersResize requires an AbortController runtime");
    });

    it("registers resize listeners on the injected resize target", () => {
        expect.assertions(2);

        const abortController = new AbortController();
        try {
            let resizeCount = 0;
            const addEventListener = vi.fn(
                (
                    _type: string,
                    eventListener: EventListenerOrEventListenerObject
                ) => {
                    if (typeof eventListener === "function") {
                        eventListener(new Event("resize"));
                    }
                }
            );
            const listener = vi.fn(() => {
                resizeCount += 1;
            });
            const utils = getListenersResizeRuntime(
                createListenersResizeRuntimeScope({
                    getResizeTarget: () => ({ addEventListener }),
                })
            );

            utils.addResizeListener(listener, {
                signal: abortController.signal,
            });

            expect({ resizeCount }).toStrictEqual({ resizeCount: 1 });
            expect(addEventListener).toHaveBeenCalledWith("resize", listener, {
                signal: abortController.signal,
            });
        } finally {
            abortController.abort();
        }
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(11);

        try {
            const abortController = new AbortController();
            let controllerCount = 0;
            class TestAbortController extends AbortController {
                public constructor() {
                    super();
                    controllerCount += 1;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas);
            const addEventListener = vi.fn();
            const resizeListener = vi.fn<EventListener>();
            const animationCallback = vi.fn<FrameRequestCallback>();
            const timeoutCallback = vi.fn<() => void>();
            const requestAnimationFrame = vi.fn<
                (callback: FrameRequestCallback) => number
            >(() => 3);
            const cancelAnimationFrame = vi.fn<(handle: number) => void>();
            const setTimeout = vi.fn<
                (callback: () => void, timeout?: number) => number
            >(() => 11);
            const clearTimeout = vi.fn<(handle: number) => void>();
            const timeoutMs = Number.parseInt("80", 10);
            const runtime = getListenersResizeRuntime(
                createListenersResizeRuntimeScope({
                    getAbortController: () => TestAbortController,
                    getCancelAnimationFrame: () => cancelAnimationFrame,
                    getClearTimeout: () => clearTimeout,
                    getDocument: () => document,
                    getElement: () => Element,
                    getHTMLCanvasElement: () => HTMLCanvasElement,
                    getRequestAnimationFrame: () => requestAnimationFrame,
                    getResizeTarget: () => ({ addEventListener }),
                    getSetTimeout: () => setTimeout,
                })
            );

            runtime.addResizeListener(resizeListener, {
                signal: abortController.signal,
            });

            expect(runtime.createAbortController()).toBeInstanceOf(
                TestAbortController
            );
            expect(controllerCount).toBe(1);
            expect(addEventListener).toHaveBeenCalledWith(
                "resize",
                resizeListener,
                { signal: abortController.signal }
            );
            expect(runtime.queryChartCanvases()).toStrictEqual([canvas]);
            expect(runtime.queryChartTab("#tab_chart")).toBeNull();
            expect(runtime.requestAnimationFrame(animationCallback)).toBe(3);
            expect(requestAnimationFrame).toHaveBeenCalledWith(
                animationCallback
            );
            expect(runtime.setTimeout(timeoutCallback, timeoutMs)).toBe(11);

            runtime.cancelAnimationFrame(3);
            runtime.clearTimeout(11);

            expect(setTimeout).toHaveBeenCalledWith(timeoutCallback, timeoutMs);
            expect(cancelAnimationFrame).toHaveBeenCalledWith(3);
            expect(clearTimeout).toHaveBeenCalledWith(11);
        } finally {
            cleanupFixture();
        }
    });

    it("reads standard fullscreen elements from the injected document", () => {
        expect.assertions(1);

        try {
            const element = document.createElement("section");
            Object.defineProperty(document, "fullscreenElement", {
                configurable: true,
                value: element,
            });

            expect(
                getListenersResizeRuntime(
                    createListenersResizeRuntimeScope({
                        getDocument: () => document,
                        getElement: () => Element,
                    })
                ).getFullscreenElement()
            ).toBe(element);
        } finally {
            Reflect.deleteProperty(document, "fullscreenElement");
            cleanupFixture();
        }
    });

    it("falls back to valid vendor fullscreen elements", () => {
        expect.assertions(1);

        try {
            const element = document.createElement("section");
            Object.defineProperty(document, "fullscreenElement", {
                configurable: true,
                value: null,
            });
            Object.defineProperty(document, "webkitFullscreenElement", {
                configurable: true,
                value: "not-an-element",
            });
            Object.defineProperty(document, "mozFullScreenElement", {
                configurable: true,
                value: element,
            });

            expect(
                getListenersResizeRuntime(
                    createListenersResizeRuntimeScope({
                        getDocument: () => document,
                        getElement: () => Element,
                    })
                ).getFullscreenElement()
            ).toBe(element);
        } finally {
            Reflect.deleteProperty(document, "fullscreenElement");
            Reflect.deleteProperty(document, "webkitFullscreenElement");
            Reflect.deleteProperty(document, "mozFullScreenElement");
            cleanupFixture();
        }
    });

    it("queries registered chart canvases through the injected document", () => {
        expect.assertions(1);

        try {
            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas, document.createElement("canvas"));

            expect(
                getListenersResizeRuntime(
                    createListenersResizeRuntimeScope({
                        getDocument: () => document,
                        getHTMLCanvasElement: () => HTMLCanvasElement,
                    })
                ).queryChartCanvases()
            ).toStrictEqual([canvas]);
        } finally {
            cleanupFixture();
        }
    });

    it("queries chart tabs through the injected document", () => {
        expect.assertions(1);

        try {
            const tab = document.createElement("section");
            tab.id = "tab_chart";
            document.body.append(tab);

            expect(
                getListenersResizeRuntime(
                    createListenersResizeRuntimeScope({
                        getDocument: () => document,
                    })
                ).queryChartTab("#tab_chart")
            ).toBe(tab);
        } finally {
            cleanupFixture();
        }
    });

    it("wraps animation-frame and timer APIs", () => {
        expect.assertions(6);

        const animationCallback = vi.fn<FrameRequestCallback>();
        const timeoutCallback = vi.fn<() => void>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 2);
        const cancelAnimationFrame = vi.fn<(handle: number) => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 7);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const utils = getListenersResizeRuntime(
            createListenersResizeRuntimeScope({
                getCancelAnimationFrame: () => cancelAnimationFrame,
                getClearTimeout: () => clearTimeout,
                getRequestAnimationFrame: () => requestAnimationFrame,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(utils.requestAnimationFrame(animationCallback)).toBe(2);
        expect(requestAnimationFrame).toHaveBeenCalledWith(animationCallback);
        const timeoutMs = Number.parseInt("120", 10);

        expect(utils.setTimeout(timeoutCallback, timeoutMs)).toBe(7);
        expect(setTimeout).toHaveBeenCalledWith(timeoutCallback, timeoutMs);

        utils.cancelAnimationFrame(2);
        utils.clearTimeout(7);

        expect(cancelAnimationFrame).toHaveBeenCalledWith(2);
        expect(clearTimeout).toHaveBeenCalledWith(7);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getListenersResizeRuntime(
            createListenersResizeRuntimeScope()
        );

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "listenersResize requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(7)).toThrow(
            "listenersResize requires a clearTimeout runtime"
        );
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getListenersResizeRuntime(
                createListenersResizeRuntimeScope()
            ).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("fails clearly when resize listener provider slots are omitted", () => {
        expect.assertions(11);

        const runtime = getListenersResizeRuntime(
            {} as unknown as ListenersResizeRuntimeScope
        );
        const documentOnlyRuntime = getListenersResizeRuntime({
            getDocument: () => document,
        } as unknown as ListenersResizeRuntimeScope);
        const resizeAbortController = new AbortController();

        expect(() =>
            runtime.addResizeListener(vi.fn(), {
                signal: resizeAbortController.signal,
            })
        ).toThrow("listenersResize requires resizeTarget provider");
        resizeAbortController.abort();
        expect(() => runtime.cancelAnimationFrame(1)).toThrow(
            "listenersResize requires cancelAnimationFrame provider"
        );
        expect(() => runtime.clearTimeout(1)).toThrow(
            "listenersResize requires clearTimeout provider"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "listenersResize requires AbortController provider"
        );
        expect(() => runtime.getFullscreenElement()).toThrow(
            "listenersResize requires document provider"
        );
        expect(() => runtime.queryChartCanvases()).toThrow(
            "listenersResize requires document provider"
        );
        expect(() => runtime.queryChartTab("#tab_chart")).toThrow(
            "listenersResize requires document provider"
        );
        expect(() => runtime.requestAnimationFrame(() => {})).toThrow(
            "listenersResize requires requestAnimationFrame provider"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "listenersResize requires setTimeout provider"
        );
        expect(() => documentOnlyRuntime.getFullscreenElement()).toThrow(
            "listenersResize requires Element provider"
        );
        expect(() => documentOnlyRuntime.queryChartCanvases()).toThrow(
            "listenersResize requires HTMLCanvasElement provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(18);

        let abortController: AbortController | undefined;
        try {
            const element = document.createElement("section");
            Object.defineProperty(document, "fullscreenElement", {
                configurable: true,
                value: element,
            });
            const canvas = document.createElement("canvas");
            canvas.className = "chart-canvas";
            document.body.append(canvas);

            let controllerCount = 0;
            class TestAbortController extends AbortController {
                public constructor() {
                    super();
                    controllerCount += 1;
                }
            }
            const addEventListener = vi.fn();
            const requestAnimationFrame = vi.fn<
                (callback: FrameRequestCallback) => number
            >(() => 5);
            const cancelAnimationFrame = vi.fn<(handle: number) => void>();
            const setTimeout = vi.fn<
                (callback: () => void, timeout?: number) => number
            >(() => 13);
            const clearTimeout = vi.fn<(handle: number) => void>();
            abortController = new AbortController();
            const runtime = getListenersResizeRuntime({
                AbortController: TestAbortController,
                cancelAnimationFrame,
                clearTimeout,
                document,
                Element,
                HTMLCanvasElement,
                requestAnimationFrame,
                resizeTarget: { addEventListener },
                setTimeout,
            } as unknown as ListenersResizeRuntimeScope);

            expect(() =>
                runtime.addResizeListener(vi.fn(), {
                    signal: abortController.signal,
                })
            ).toThrow("listenersResize requires resizeTarget provider");
            expect(() => runtime.cancelAnimationFrame(5)).toThrow(
                "listenersResize requires cancelAnimationFrame provider"
            );
            expect(() => runtime.createAbortController()).toThrow(
                "listenersResize requires AbortController provider"
            );
            expect(() => runtime.getFullscreenElement()).toThrow(
                "listenersResize requires document provider"
            );
            expect(() => runtime.queryChartCanvases()).toThrow(
                "listenersResize requires document provider"
            );
            expect(() => runtime.queryChartTab("#tab_chart")).toThrow(
                "listenersResize requires document provider"
            );
            expect(() =>
                runtime.requestAnimationFrame(vi.fn<FrameRequestCallback>())
            ).toThrow(
                "listenersResize requires requestAnimationFrame provider"
            );
            expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
                "listenersResize requires setTimeout provider"
            );
            expect(() => runtime.clearTimeout(13)).toThrow(
                "listenersResize requires clearTimeout provider"
            );
            expect(controllerCount).toBe(0);
            expect(addEventListener).not.toHaveBeenCalled();
            expect(requestAnimationFrame).not.toHaveBeenCalled();
            expect(cancelAnimationFrame).not.toHaveBeenCalled();
            expect(setTimeout).not.toHaveBeenCalled();
            expect(clearTimeout).not.toHaveBeenCalled();
            expect(canvas.isConnected).toBe(true);
            expect(document.fullscreenElement).toBe(element);
            expect(element.isConnected).toBe(false);
        } finally {
            abortController?.abort();
            Reflect.deleteProperty(document, "fullscreenElement");
            cleanupFixture();
        }
    });
});

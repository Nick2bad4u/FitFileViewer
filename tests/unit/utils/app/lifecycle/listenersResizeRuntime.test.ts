import { describe, expect, it, vi } from "vitest";

import { getListenersResizeRuntime } from "../../../../../electron-app/utils/app/lifecycle/listenersResizeRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
    vi.restoreAllMocks();
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
        const runtime = getListenersResizeRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getListenersResizeRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("listenersResize requires an AbortController runtime");
    });

    it("registers resize listeners on the injected window", () => {
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
            const utils = getListenersResizeRuntime({
                window: { addEventListener },
            });

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

    it("reads standard fullscreen elements from the injected document", () => {
        expect.assertions(1);

        try {
            const element = document.createElement("section");
            Object.defineProperty(document, "fullscreenElement", {
                configurable: true,
                value: element,
            });

            expect(
                getListenersResizeRuntime({
                    document,
                    Element,
                }).getFullscreenElement()
            ).toBe(element);
        } finally {
            Reflect.deleteProperty(document, "fullscreenElement");
            cleanupFixture();
        }
    });

    it("falls back to vendor fullscreen elements", () => {
        expect.assertions(1);

        try {
            const element = document.createElement("section");
            Object.defineProperty(document, "fullscreenElement", {
                configurable: true,
                value: null,
            });
            Object.defineProperty(document, "webkitFullscreenElement", {
                configurable: true,
                value: element,
            });

            expect(
                getListenersResizeRuntime({
                    document,
                    Element,
                }).getFullscreenElement()
            ).toBe(element);
        } finally {
            Reflect.deleteProperty(document, "fullscreenElement");
            Reflect.deleteProperty(document, "webkitFullscreenElement");
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
                getListenersResizeRuntime({
                    document,
                    HTMLCanvasElement,
                }).queryChartCanvases()
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
                getListenersResizeRuntime({ document }).queryChartTab(
                    "#tab_chart"
                )
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
        const utils = getListenersResizeRuntime({
            cancelAnimationFrame,
            clearTimeout,
            requestAnimationFrame,
            setTimeout,
        });

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

        const runtime = getListenersResizeRuntime({});

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
            getListenersResizeRuntime({}).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });
});

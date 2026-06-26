import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getUnifiedControlBarRuntime,
    type UnifiedControlBarRuntimeScope,
} from "../../../../electron-app/utils/ui/unifiedControlBarRuntime.js";

describe("getUnifiedControlBarRuntime", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("unified-control-bar-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getUnifiedControlBarRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getUnifiedControlBarRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production DOM, observer, listener, and timer defaults", () => {
        expect.assertions(12);

        const callback = vi.fn<() => void>();
        const resizeListener = vi.fn<EventListener>();
        const timeoutMs = Number("250");
        const timer = 29 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();
        const mutationCallback = vi.fn<MutationCallback>();
        const observer = {
            disconnect: vi.fn<MutationObserver["disconnect"]>(),
            observe: vi.fn<MutationObserver["observe"]>(),
            takeRecords: vi.fn<MutationObserver["takeRecords"]>(() => []),
        } satisfies MutationObserver;
        const MutationObserverMock = vi.fn(function MutationObserverMock(
            callback: MutationCallback
        ) {
            mutationCallback([], observer);
            expect(callback).toBe(mutationCallback);
            return observer;
        });

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("MutationObserver", MutationObserverMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getUnifiedControlBarRuntime();
        const element = runtime.createElement("section");
        element.className = "target";
        document.body.append(element);

        const timerHandle = runtime.setTimeout(callback, timeoutMs);
        runtime.clearTimeout(timerHandle);
        runtime.addResizeListener(resizeListener, { passive: true });
        globalThis.dispatchEvent(new Event("resize"));
        runtime.removeResizeListener(resizeListener);
        globalThis.dispatchEvent(new Event("resize"));

        expect(runtime.getBody()).toBe(document.body);
        expect(runtime.querySelector(".target")).toBe(element);
        expect(runtime.isHTMLElement(element)).toBe(true);
        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
        expect(runtime.createMutationObserver(mutationCallback)).toBe(observer);
        expect(MutationObserverMock).toHaveBeenCalledWith(mutationCallback);
        expect(resizeListener).toHaveBeenCalledOnce();
        expect(setTimeoutMock).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUnifiedControlBarRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("unifiedControlBar requires an AbortController runtime");
    });

    it("creates elements and exposes the injected body", () => {
        expect.assertions(2);

        const runtime = getUnifiedControlBarRuntime({
            getDocument: () => document,
        });
        const element = runtime.createElement("div");

        expect(element).toBeInstanceOf(HTMLDivElement);
        expect(runtime.getBody()).toBe(document.body);
    });

    it("queries injected HTMLElements", () => {
        expect.assertions(2);

        try {
            const target = document.createElement("section");
            target.className = "target";
            document.body.append(target);
            const runtime = getUnifiedControlBarRuntime({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            });

            expect(runtime.querySelector(".target")).toBe(target);
            expect(runtime.isHTMLElement(target)).toBe(true);
        } finally {
            document.body.replaceChildren();
        }
    });

    it("wraps resize listener registration and removal", () => {
        expect.assertions(2);

        const eventTarget = new EventTarget();
        let resizeCount = 0;
        const listener = (): void => {
            resizeCount += 1;
        };
        const options = { passive: true };
        const runtime = getUnifiedControlBarRuntime({
            getEventTarget: () => eventTarget,
        });

        runtime.addResizeListener(listener, options);
        eventTarget.dispatchEvent(new Event("resize"));
        runtime.removeResizeListener(listener);
        eventTarget.dispatchEvent(new Event("resize"));

        expect(resizeCount).toBe(1);
        expect(options).toStrictEqual({ passive: true });
    });

    it("fails clearly when resize listener scope lacks an event target", () => {
        expect.assertions(2);

        const runtime = getUnifiedControlBarRuntime({});

        expect(() => runtime.addResizeListener(() => {}, {})).toThrow(
            "unifiedControlBar requires an event-target runtime"
        );
        expect(() => runtime.removeResizeListener(() => {})).toThrow(
            "unifiedControlBar requires an event-target runtime"
        );
    });

    it("creates mutation observers through the injected constructor", () => {
        expect.assertions(3);

        const disconnect = vi.fn<() => void>();
        const observe = vi.fn<MutationObserver["observe"]>();
        const takeRecords = vi.fn<MutationObserver["takeRecords"]>(() => []);
        const mutationObserverConstructor =
            vi.fn<(callback: MutationCallback) => void>();
        class MutationObserverMock implements MutationObserver {
            constructor(callback: MutationCallback) {
                mutationObserverConstructor(callback);
            }

            disconnect(): void {
                disconnect();
            }

            observe(target: Node, options?: MutationObserverInit): void {
                observe(target, options);
            }

            takeRecords(): MutationRecord[] {
                return takeRecords();
            }
        }

        const callback = vi.fn<MutationCallback>();
        const runtime = getUnifiedControlBarRuntime({
            getMutationObserver: () => MutationObserverMock,
        });

        const observer = runtime.createMutationObserver(callback);
        observer.disconnect();

        expect(mutationObserverConstructor).toHaveBeenCalledWith(callback);
        expect(observer).toBeInstanceOf(MutationObserverMock);
        expect(disconnect).toHaveBeenCalledOnce();
    });

    it("wraps timer scheduling and cleanup", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 13);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const runtime = getUnifiedControlBarRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });
        const timeoutMs = Number.parseInt("200", 10);

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(13);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);

        runtime.clearTimeout(13);

        expect(clearTimeout).toHaveBeenCalledWith(13);
        expect(callback).not.toHaveBeenCalled();
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getUnifiedControlBarRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "unifiedControlBar requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "unifiedControlBar requires a clearTimeout runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(8);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<(handle: number) => void>();
        const eventTarget = new EventTarget();
        const setTimeout = vi.fn(() => 13);
        const legacyScope = {
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            clearTimeout,
            document,
            eventTarget,
            HTMLElement,
            MutationObserver: "MutationObserver",
            setTimeout,
        } as unknown as UnifiedControlBarRuntimeScope;
        const runtime = getUnifiedControlBarRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "unifiedControlBar requires an AbortController runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "unifiedControlBar requires a document-like runtime"
        );
        expect(() => runtime.addResizeListener(() => {}, {})).toThrow(
            "unifiedControlBar requires an event-target runtime"
        );
        expect(() => runtime.createMutationObserver(() => {})).toThrow(
            "unifiedControlBar requires a MutationObserver runtime"
        );
        expect(runtime.isHTMLElement(document.body)).toBe(false);
        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "unifiedControlBar requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "unifiedControlBar requires a clearTimeout runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
    });
});

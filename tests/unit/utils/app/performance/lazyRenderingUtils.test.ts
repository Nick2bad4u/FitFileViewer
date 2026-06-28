import { describe, expect, it, vi } from "vitest";
import {
    batchDOMReads,
    batchDOMWrites,
    createLazyRenderer,
    deferUntilIdle,
    isElementVisible,
} from "../../../../../electron-app/utils/app/performance/lazyRenderingUtils.js";

type IntersectionObserverInitRecord = {
    callback: IntersectionObserverCallback;
    element?: Element;
    options?: IntersectionObserverInit;
};

const observers: IntersectionObserverInitRecord[] = [];

class FakeIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string;
    readonly thresholds: readonly number[];

    private readonly record: IntersectionObserverInitRecord;

    constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
    ) {
        this.rootMargin = options?.rootMargin ?? "0px";
        this.thresholds = Array.isArray(options?.threshold)
            ? options.threshold
            : [options?.threshold ?? 0];
        this.record = { callback, options };
        observers.push(this.record);
    }

    disconnect = vi.fn<() => void>();
    observe = vi.fn<(target: Element) => void>((target) => {
        this.record.element = target;
    });
    takeRecords = vi.fn<() => IntersectionObserverEntry[]>(() => []);
    unobserve = vi.fn<(target: Element) => void>();
}

function intersect(index = 0, isIntersecting = true): void {
    const record = observers[index];
    if (!record) {
        throw new Error("Missing fake observer");
    }

    record.callback(
        [
            {
                isIntersecting,
                target: record.element ?? document.createElement("div"),
            } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
    );
}

function cleanupFixture(): void {
    observers.length = 0;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
}

describe("lazy rendering utilities", () => {
    it("batches DOM reads and writes through requestAnimationFrame", async () => {
        expect.assertions(5);

        try {
            const requestAnimationFrame = vi.fn<
                (callback: FrameRequestCallback) => number
            >((callback) => {
                callback(1);
                return 1;
            });
            vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
            let writeCount = 0;

            const readResult = await batchDOMReads(() => ["height", "width"]);
            await batchDOMWrites(() => {
                writeCount += 1;
            });

            expect(readResult).toStrictEqual(["height", "width"]);
            expect({ writeCount }).toStrictEqual({ writeCount: 1 });
            expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
            const animationFrameCallbacks =
                requestAnimationFrame.mock.calls.map(
                    ([callback]) => typeof callback
                );
            expect(animationFrameCallbacks).toStrictEqual([
                "function",
                "function",
            ]);
            expect(requestAnimationFrame.mock.results).toStrictEqual([
                { type: "return", value: 1 },
                { type: "return", value: 1 },
            ]);
        } finally {
            cleanupFixture();
        }
    });

    it("recovers from DOM batch callback errors", async () => {
        expect.assertions(3);

        try {
            const readError = new Error("read failed");
            const writeError = new Error("write failed");
            const errorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {});
            vi.stubGlobal(
                "requestAnimationFrame",
                (callback: FrameRequestCallback) => {
                    callback(1);
                    return 1;
                }
            );

            await expect(
                batchDOMReads(() => {
                    throw readError;
                })
            ).resolves.toStrictEqual([]);
            await expect(
                batchDOMWrites(() => {
                    throw writeError;
                })
            ).resolves.toBeUndefined();

            expect(errorSpy.mock.calls).toStrictEqual([
                ["[BatchDOMReads] Read error:", readError],
                ["[BatchDOMWrites] Write error:", writeError],
            ]);
        } finally {
            cleanupFixture();
        }
    });

    it("renders once when an observed element becomes visible", () => {
        expect.assertions(5);

        try {
            vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
            const element = document.createElement("section");
            let renderCount = 0;

            const { disconnect, observe } = createLazyRenderer(element, () => {
                renderCount += 1;
            });
            observe();
            intersect();
            intersect();
            disconnect();

            expect(observers).toHaveLength(1);
            expect(observers[0]?.options).toStrictEqual({
                rootMargin: "0px",
                threshold: 0.1,
            });
            expect(observers[0]?.element).toBe(element);
            expect({ renderCount }).toStrictEqual({ renderCount: 1 });
            expect(observers[0]?.callback).toBeTypeOf("function");
        } finally {
            cleanupFixture();
        }
    });

    it("ignores array-shaped catch candidates returned by render callbacks", () => {
        expect.assertions(3);

        try {
            vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
            const catchMock = vi.fn();
            let renderCount = 0;
            const arrayResult = [] as unknown[] & {
                catch: typeof catchMock;
            };
            arrayResult.catch = catchMock;
            const renderCallback = vi.fn<() => Promise<void> | void>(() => {
                renderCount += 1;
                return arrayResult as unknown as Promise<void>;
            });

            createLazyRenderer(
                document.createElement("div"),
                renderCallback
            ).observe();
            intersect();

            expect(renderCount).toBe(1);
            expect(renderCallback).toHaveBeenCalledOnce();
            expect(catchMock).not.toHaveBeenCalled();
        } finally {
            cleanupFixture();
        }
    });

    it("falls back to immediate rendering when IntersectionObserver is unavailable", () => {
        expect.assertions(3);

        try {
            vi.stubGlobal("IntersectionObserver", undefined);
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            let renderCount = 0;

            createLazyRenderer(document.createElement("div"), () => {
                renderCount += 1;
            }).observe();

            expect({ renderCount }).toStrictEqual({ renderCount: 1 });
            expect(observers).toHaveLength(0);
            expect(warnSpy).toHaveBeenCalledWith(
                "[LazyRenderer] IntersectionObserver not available, rendering immediately"
            );
        } finally {
            cleanupFixture();
        }
    });

    it("defers callbacks to requestIdleCallback when available", () => {
        expect.assertions(5);

        try {
            let callbackCount = 0;
            const requestIdleCallback = vi.fn<
                (
                    idleCallback: IdleRequestCallback,
                    options?: IdleRequestOptions
                ) => number
            >((idleCallback) => {
                idleCallback({ didTimeout: false, timeRemaining: () => 10 });
                return 42;
            });
            vi.stubGlobal("requestIdleCallback", requestIdleCallback);

            const requestId = deferUntilIdle(
                () => {
                    callbackCount += 1;
                },
                { timeout: 123 }
            );

            expect(requestId).toBe(42);
            expect({ callbackCount }).toStrictEqual({ callbackCount: 1 });
            expect(requestIdleCallback).toHaveBeenCalledOnce();
            const idleCall = requestIdleCallback.mock.calls.at(0);
            if (idleCall === undefined) {
                throw new Error("requestIdleCallback was not called");
            }
            const [idleCallback, idleOptions] = idleCall;
            expect(idleCallback).toBeTypeOf("function");
            expect(idleOptions).toStrictEqual({ timeout: 123 });
        } finally {
            cleanupFixture();
        }
    });

    it("checks viewport visibility with threshold support", () => {
        expect.assertions(3);

        try {
            const visible = document.createElement("div");
            vi.spyOn(visible, "getBoundingClientRect").mockReturnValue(
                DOMRect.fromRect({
                    height: 100,
                    width: 100,
                    x: 10,
                    y: 10,
                })
            );
            document.body.append(visible);

            expect({
                visible: isElementVisible(visible),
            }).toStrictEqual({ visible: true });
            expect({
                visible: isElementVisible(null),
            }).toStrictEqual({ visible: false });
            expect({
                visible: isElementVisible(document.createTextNode("x")),
            }).toStrictEqual({ visible: false });
        } finally {
            cleanupFixture();
        }
    });
});

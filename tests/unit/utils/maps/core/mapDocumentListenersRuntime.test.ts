import { describe, expect, it, vi } from "vitest";

import { getMapDocumentListenersRuntime } from "../../../../../electron-app/utils/maps/core/mapDocumentListenersRuntime.js";

describe("getMapDocumentListenersRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-document-listeners-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapDocumentListenersRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapDocumentListenersRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapDocumentListeners requires an AbortController runtime");
    });

    it("registers document interaction listeners through the injected document", () => {
        expect.assertions(3);

        const eventTarget = new EventTarget();
        const documentRef = createDocumentListenerTarget(eventTarget);
        const controller = new AbortController();
        let mouseDownCount = 0;
        let mouseUpCount = 0;
        let touchEndCount = 0;
        const runtime = getMapDocumentListenersRuntime({
            document: documentRef,
        });

        runtime.addDocumentMousedownListener(
            () => {
                mouseDownCount += 1;
            },
            { signal: controller.signal }
        );
        runtime.addDocumentMouseupListener(
            () => {
                mouseUpCount += 1;
            },
            { signal: controller.signal }
        );
        runtime.addDocumentTouchendListener(
            () => {
                touchEndCount += 1;
            },
            { passive: true, signal: controller.signal }
        );
        eventTarget.dispatchEvent(new MouseEvent("mousedown"));
        eventTarget.dispatchEvent(new MouseEvent("mouseup"));
        eventTarget.dispatchEvent(new Event("touchend"));

        expect(mouseDownCount).toBe(1);
        expect(mouseUpCount).toBe(1);
        expect(touchEndCount).toBe(1);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(3);

        const runtime = getMapDocumentListenersRuntime({});
        const controller = new AbortController();
        const mouseListener = (): void => undefined;
        const touchListener = (): void => undefined;

        expect(() => {
            runtime.addDocumentMousedownListener(mouseListener, {
                signal: controller.signal,
            });
        }).toThrow("mapDocumentListeners requires a document runtime");
        expect(() => {
            runtime.addDocumentMouseupListener(mouseListener, {
                signal: controller.signal,
            });
        }).toThrow("mapDocumentListeners requires a document runtime");
        expect(() => {
            runtime.addDocumentTouchendListener(touchListener, {
                signal: controller.signal,
            });
        }).toThrow("mapDocumentListeners requires a document runtime");
        controller.abort();
    });

    it("registers resize listeners through the injected resize target", () => {
        expect.assertions(1);

        const eventTarget = new EventTarget();
        const resizeTarget = createResizeListenerTarget(eventTarget);
        const controller = new AbortController();
        let resizeCount = 0;
        const runtime = getMapDocumentListenersRuntime({
            resizeTarget,
        });

        runtime.addWindowResizeListener(
            () => {
                resizeCount += 1;
            },
            { signal: controller.signal }
        );
        eventTarget.dispatchEvent(new Event("resize"));

        expect(resizeCount).toBe(1);
    });

    it("fails clearly when the resize target runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapDocumentListenersRuntime({});
        const controller = new AbortController();

        expect(() => {
            runtime.addWindowResizeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapDocumentListeners requires a resize target runtime");
        controller.abort();
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(5);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const documentAddEventListener = vi.fn();
        const resizeAddEventListener = vi.fn();
        const runtime = getMapDocumentListenersRuntime({
            getAbortController: () => TestAbortController,
            getDocument: () => ({
                addEventListener: documentAddEventListener,
            }),
            getResizeTarget: () => ({
                addEventListener: resizeAddEventListener,
            }),
        });
        const controller = runtime.createAbortController();

        runtime.addDocumentMousedownListener(() => undefined, {
            signal: controller.signal,
        });
        runtime.addWindowResizeListener(() => undefined, {
            signal: controller.signal,
        });

        expect(controller).toBeInstanceOf(TestAbortController);
        expect(controllerCount).toBe(1);
        expect(documentAddEventListener).toHaveBeenCalledWith(
            "mousedown",
            expect.any(Function),
            { signal: controller.signal }
        );
        expect(resizeAddEventListener).toHaveBeenCalledWith(
            "resize",
            expect.any(Function),
            { signal: controller.signal }
        );
        expect(
            getMapDocumentListenersRuntime({}).createAbortController
        ).toThrow("mapDocumentListeners requires an AbortController runtime");
    });
});

function createDocumentListenerTarget(
    eventTarget: EventTarget
): Pick<Document, "addEventListener"> {
    return {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
    } as Pick<Document, "addEventListener">;
}

function createResizeListenerTarget(
    eventTarget: EventTarget
): Pick<Window, "addEventListener"> {
    return {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
    } as Pick<Window, "addEventListener">;
}

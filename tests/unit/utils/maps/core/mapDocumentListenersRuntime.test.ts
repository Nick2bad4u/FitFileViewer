import { describe, expect, it, vi } from "vitest";

import {
    getMapDocumentListenersRuntime,
    type MapDocumentListenersRuntimeScope,
} from "../../../../../electron-app/utils/maps/core/mapDocumentListenersRuntime.js";

function createMapDocumentListenersRuntimeScope(
    overrides: Partial<MapDocumentListenersRuntimeScope> = {}
): MapDocumentListenersRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getNode: () => undefined,
        getResizeTarget: () => undefined,
        ...overrides,
    };
}

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
        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope({
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

        const utils = getMapDocumentListenersRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production DOM defaults", () => {
        expect.assertions(5);

        const layersControl = document.createElement("div");
        layersControl.className = "leaflet-control-layers";
        document.body.append(layersControl);
        const controller = new AbortController();
        let resizeCount = 0;
        const utils = getMapDocumentListenersRuntime();

        try {
            utils.addWindowResizeListener(
                () => {
                    resizeCount += 1;
                },
                { signal: controller.signal }
            );
            window.dispatchEvent(new Event("resize"));

            expect(utils.getLayersControlElement()).toBe(layersControl);
            expect(utils.isHTMLElement(layersControl)).toBe(true);
            expect(utils.isHTMLElement({ nodeType: 1 })).toBe(false);
            expect(utils.isNode(layersControl)).toBe(true);
            expect(resizeCount).toBe(1);
        } finally {
            controller.abort();
            layersControl.remove();
        }
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope()
        );

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
        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope({
                getDocument: () => documentRef,
            })
        );

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

    it("finds and type-checks map document elements through injected providers", () => {
        expect.assertions(4);

        const documentRef = document.implementation.createHTMLDocument();
        const layersControl = documentRef.createElement("div");
        layersControl.className = "leaflet-control-layers";
        documentRef.body.append(layersControl);
        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope({
                getDocument: () => documentRef,
                getHTMLElement: () => HTMLElement,
                getNode: () => Node,
            })
        );

        expect(runtime.getLayersControlElement()).toBe(layersControl);
        expect(runtime.isHTMLElement(layersControl)).toBe(true);
        expect(runtime.isNode(layersControl)).toBe(true);
        expect(runtime.isNode({})).toBe(false);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(4);

        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope()
        );
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
        expect(() => {
            runtime.getLayersControlElement();
        }).toThrow("mapDocumentListeners requires a document runtime");
        controller.abort();
    });

    it("registers resize listeners through the injected resize target", () => {
        expect.assertions(1);

        const eventTarget = new EventTarget();
        const resizeTarget = createResizeListenerTarget(eventTarget);
        const controller = new AbortController();
        let resizeCount = 0;
        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope({
                getResizeTarget: () => resizeTarget,
            })
        );

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

        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope()
        );
        const controller = new AbortController();

        expect(() => {
            runtime.addWindowResizeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapDocumentListeners requires a resize target runtime");
        controller.abort();
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(8);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const documentAddEventListener = vi.fn();
        const layersControl = document.createElement("div");
        const resizeAddEventListener = vi.fn();
        const getHTMLElement = vi.fn(() => HTMLElement);
        const getNode = vi.fn(() => Node);
        const runtime = getMapDocumentListenersRuntime(
            createMapDocumentListenersRuntimeScope({
                getAbortController: () => TestAbortController,
                getDocument: () => ({
                    addEventListener: documentAddEventListener,
                    querySelector: vi.fn(() => layersControl),
                }),
                getHTMLElement,
                getNode,
                getResizeTarget: () => ({
                    addEventListener: resizeAddEventListener,
                }),
            })
        );
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
        expect(runtime.getLayersControlElement()).toBe(layersControl);
        expect(runtime.isHTMLElement(layersControl)).toBe(true);
        expect(runtime.isNode(layersControl)).toBe(true);
        expect(
            getMapDocumentListenersRuntime(
                createMapDocumentListenersRuntimeScope()
            ).createAbortController
        ).toThrow("mapDocumentListeners requires an AbortController runtime");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(5);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const documentAddEventListener = vi.fn();
        const documentQuerySelector = vi.fn();
        const resizeAddEventListener = vi.fn();
        const legacyScope = {
            AbortController: TestAbortController,
            document: {
                addEventListener: documentAddEventListener,
                querySelector: documentQuerySelector,
            },
            HTMLElement,
            Node,
            resizeTarget: { addEventListener: resizeAddEventListener },
        } as unknown as MapDocumentListenersRuntimeScope;

        expect(() => getMapDocumentListenersRuntime(legacyScope)).toThrow(
            "mapDocumentListeners requires an AbortController provider"
        );
        expect(documentAddEventListener).not.toHaveBeenCalled();
        expect(documentQuerySelector).not.toHaveBeenCalled();
        expect(resizeAddEventListener).not.toHaveBeenCalled();
        expect(controllerCount).toBe(0);
    });

    it("fails clearly when runtime provider slots are omitted", () => {
        expect.assertions(1);

        expect(() =>
            getMapDocumentListenersRuntime(
                {} as unknown as MapDocumentListenersRuntimeScope
            )
        ).toThrow("mapDocumentListeners requires an AbortController provider");
    });

    it("fails clearly when runtime provider slots are undefined", () => {
        expect.assertions(5);

        expect(() =>
            getMapDocumentListenersRuntime(
                createMapDocumentListenersRuntimeScope({
                    getAbortController: undefined,
                })
            )
        ).toThrow("mapDocumentListeners requires an AbortController provider");
        expect(() =>
            getMapDocumentListenersRuntime(
                createMapDocumentListenersRuntimeScope({
                    getDocument: undefined,
                })
            )
        ).toThrow("mapDocumentListeners requires a document provider");
        expect(() =>
            getMapDocumentListenersRuntime(
                createMapDocumentListenersRuntimeScope({
                    getHTMLElement: undefined,
                })
            )
        ).toThrow("mapDocumentListeners requires an HTMLElement provider");
        expect(() =>
            getMapDocumentListenersRuntime(
                createMapDocumentListenersRuntimeScope({
                    getNode: undefined,
                })
            )
        ).toThrow("mapDocumentListeners requires a Node provider");
        expect(() =>
            getMapDocumentListenersRuntime(
                createMapDocumentListenersRuntimeScope({
                    getResizeTarget: undefined,
                })
            )
        ).toThrow("mapDocumentListeners requires a resize target provider");
    });
});

function createDocumentListenerTarget(
    eventTarget: Readonly<EventTarget>
): Pick<Document, "addEventListener" | "querySelector"> {
    return {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        querySelector: vi.fn(),
    } as Pick<Document, "addEventListener" | "querySelector">;
}

function createResizeListenerTarget(
    eventTarget: Readonly<EventTarget>
): Pick<EventTarget, "addEventListener"> {
    return {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
    };
}

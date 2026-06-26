import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getMapFullscreenControlRuntime,
    type MapFullscreenControlRuntimeScope,
} from "../../../../electron-app/utils/maps/controls/mapFullscreenControlRuntime.js";

describe("getMapFullscreenControlRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-fullscreen-control-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapFullscreenControlRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getMapFullscreenControlRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapFullscreenControlRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapFullscreenControl requires an AbortController runtime");
    });

    it("registers document fullscreenchange listeners through the injected document", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("fullscreen control");
        const controller = new AbortController();
        let eventCount = 0;
        const listener = (): void => {
            eventCount += 1;
        };
        const runtime = getMapFullscreenControlRuntime({
            getDocument: () => documentRef,
        });

        runtime.addDocumentFullscreenChangeListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new Event("fullscreenchange"));
        controller.abort();
        documentRef.dispatchEvent(new Event("fullscreenchange"));

        expect(eventCount).toBe(1);
        expect(controller.signal.aborted).toBe(true);
    });

    it("resolves fullscreen document state through the injected document", async () => {
        expect.assertions(5);

        const documentRef =
            document.implementation.createHTMLDocument("fullscreen control");
        const mapContainer = documentRef.createElement("div");
        mapContainer.id = "leaflet-map";
        const mapControls = documentRef.createElement("div");
        mapControls.id = "map-controls";
        const legacyButton = documentRef.createElement("button");
        legacyButton.id = "fullscreen-btn";
        mapControls.append(legacyButton);
        documentRef.body.append(mapContainer, mapControls);
        const exitFullscreen = vi.fn<() => Promise<void>>().mockResolvedValue();
        Object.defineProperty(documentRef, "exitFullscreen", {
            configurable: true,
            value: exitFullscreen,
        });
        Object.defineProperty(documentRef, "fullscreenElement", {
            configurable: true,
            get: () => mapContainer,
        });
        const runtime = getMapFullscreenControlRuntime({
            getDocument: () => documentRef,
        });

        expect(runtime.getMapContainer()).toBe(mapContainer);
        expect(runtime.getLegacyFullscreenButton()).toBe(legacyButton);
        expect(runtime.isFullscreenElement(mapContainer)).toBe(true);
        expect(runtime.documentBodyContains(mapContainer)).toBe(true);
        await expect(runtime.exitFullscreen()).resolves.toBeUndefined();
    });

    it("uses the browser runtime provider for production document defaults", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("fullscreen control");
        const mapContainer = documentRef.createElement("div");
        mapContainer.id = "leaflet-map";
        const mapControls = documentRef.createElement("div");
        mapControls.id = "map-controls";
        const legacyButton = documentRef.createElement("button");
        legacyButton.id = "fullscreen-btn";
        mapControls.append(legacyButton);
        documentRef.body.append(mapContainer, mapControls);

        vi.stubGlobal("document", documentRef);

        const runtime = getMapFullscreenControlRuntime();

        expect(runtime.getMapContainer()).toBe(mapContainer);
        expect(runtime.getLegacyFullscreenButton()).toBe(legacyButton);
        expect(runtime.documentBodyContains(mapContainer)).toBe(true);
        expect(runtime.createElement("button").ownerDocument).toBe(documentRef);
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(6);

        const documentRef =
            document.implementation.createHTMLDocument("fullscreen control");
        const createElement = vi.spyOn(documentRef, "createElement");
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const runtime = getMapFullscreenControlRuntime({
            getDocument: () => documentRef,
        });

        const button = runtime.createElement("button");
        const svg = runtime.createSvgElement("svg");
        const rect = runtime.createSvgElement("rect");

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(svg.nodeName).toBe("svg");
        expect(rect.nodeName).toBe("rect");
        expect(rect.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(createElement).toHaveBeenCalledWith("button");
        expect(createElementNS).toHaveBeenCalledWith(
            "http://www.w3.org/2000/svg",
            "rect"
        );
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(8);

        const runtime = getMapFullscreenControlRuntime({});
        const controller = new AbortController();

        expect(() => {
            runtime.addDocumentFullscreenChangeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapFullscreenControl requires a document runtime");
        expect(() => runtime.getMapContainer()).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.getLegacyFullscreenButton()).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.isFullscreenElement(document.body)).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.documentBodyContains(document.body)).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.exitFullscreen()).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 67 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapFullscreenControlRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 68 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getMapFullscreenControlRuntime();
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapFullscreenControlRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapFullscreenControl requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapFullscreenControl requires a clearTimeout runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(14);

        const addEventListener = vi.fn();
        const querySelector = vi.fn();
        const exitFullscreen = vi.fn();
        const runtime = getMapFullscreenControlRuntime({
            AbortController: class LegacyAbortController {},
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            document: {
                addEventListener,
                body: document.body,
                createElement: document.createElement.bind(document),
                createElementNS: document.createElementNS.bind(document),
                exitFullscreen,
                fullscreenElement: document.body,
                querySelector,
            },
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as MapFullscreenControlRuntimeScope);
        const controller = new AbortController();

        expect(() => runtime.createAbortController()).toThrow(
            "mapFullscreenControl requires an AbortController runtime"
        );
        expect(() => {
            runtime.addDocumentFullscreenChangeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapFullscreenControl requires a document runtime");
        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapFullscreenControl requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapFullscreenControl requires a clearTimeout runtime");
        expect(() => runtime.getMapContainer()).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.getLegacyFullscreenButton()).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.isFullscreenElement(document.body)).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.documentBodyContains(document.body)).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(() => runtime.exitFullscreen()).toThrow(
            "mapFullscreenControl requires a document runtime"
        );
        expect(addEventListener).not.toHaveBeenCalled();
        expect(querySelector).not.toHaveBeenCalled();
        expect(exitFullscreen).not.toHaveBeenCalled();
        controller.abort();
    });
});

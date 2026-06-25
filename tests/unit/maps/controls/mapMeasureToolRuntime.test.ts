import { afterEach, describe, expect, it, vi } from "vitest";

import type { MapMeasureToolRuntimeScope } from "../../../../electron-app/utils/maps/controls/mapMeasureToolRuntime.js";
import { getMapMeasureToolRuntime } from "../../../../electron-app/utils/maps/controls/mapMeasureToolRuntime.js";

describe("getMapMeasureToolRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-measure-tool-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapMeasureToolRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getMapMeasureToolRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapMeasureToolRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapMeasureTool requires an AbortController runtime");
    });

    it("registers and removes document keydown listeners through the injected document", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("map measure tool");
        const controller = new AbortController();
        let keydownCount = 0;
        let lastKey = "";
        const listener = (event: KeyboardEvent): void => {
            keydownCount += 1;
            lastKey = event.key;
        };
        const runtime = getMapMeasureToolRuntime({
            getDocument: () => documentRef,
        });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
        runtime.removeDocumentKeydownListener(listener);
        documentRef.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(keydownCount).toBe(1);
        expect(lastKey).toBe("m");
    });

    it("creates document elements through the injected document", () => {
        expect.assertions(6);

        const documentRef =
            document.implementation.createHTMLDocument("map measure nodes");
        const runtime = getMapMeasureToolRuntime({
            getDocument: () => documentRef,
        });
        const button = runtime.createElement("button");
        const svg = runtime.createSvgElement("svg");
        const line = runtime.createSvgElement("line");
        const text = runtime.createTextNode("distance");

        svg.append(line);
        button.append(text);

        expect(button).toBeInstanceOf(HTMLButtonElement);
        expect(button.ownerDocument).toBe(documentRef);
        expect(button.textContent).toBe("distance");
        expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(line.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svg.firstElementChild).toBe(line);
    });

    it("checks HTMLElements through the injected constructor", () => {
        expect.assertions(2);

        const runtime = getMapMeasureToolRuntime({
            getHTMLElement: () => HTMLElement,
        });
        const button = document.createElement("button");

        expect(runtime.isHTMLElement(button)).toBe(true);
        expect(runtime.isHTMLElement({ classList: button.classList })).toBe(
            false
        );
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(5);

        const runtime = getMapMeasureToolRuntime({});
        const controller = new AbortController();
        const listener = (): void => undefined;
        const missingDocumentMessage =
            "mapMeasureTool requires a document runtime";

        expect(() => {
            runtime.addDocumentKeydownListener(listener, {
                signal: controller.signal,
            });
        }).toThrow(missingDocumentMessage);
        expect(() => {
            runtime.removeDocumentKeydownListener(listener);
        }).toThrow(missingDocumentMessage);
        expect(() => runtime.createElement("button")).toThrow(
            missingDocumentMessage
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            missingDocumentMessage
        );
        expect(() => runtime.createTextNode("distance")).toThrow(
            missingDocumentMessage
        );
        controller.abort();
    });

    it("fails clearly when the HTMLElement runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapMeasureToolRuntime({});

        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow("mapMeasureTool requires an HTMLElement runtime");
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("2000");
        const timer = 41 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapMeasureToolRuntime({
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
        const delayMs = Number("2000");
        const timer = 42 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(
            () => timer
        );
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getMapMeasureToolRuntime();
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapMeasureToolRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapMeasureTool requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapMeasureTool requires a clearTimeout runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(12);

        const documentRef =
            document.implementation.createHTMLDocument("legacy scope");
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const createElement = vi.spyOn(documentRef, "createElement");
        const createElementNS = vi.spyOn(documentRef, "createElementNS");
        const createTextNode = vi.spyOn(documentRef, "createTextNode");
        const legacyScope = {
            AbortController,
            clearTimeout: vi.fn<typeof globalThis.clearTimeout>(),
            document: documentRef,
            HTMLElement: documentRef.defaultView?.HTMLElement,
            setTimeout: vi.fn<typeof globalThis.setTimeout>(() => 41),
        } as unknown as MapMeasureToolRuntimeScope;
        const runtime = getMapMeasureToolRuntime(legacyScope);
        const missingDocumentMessage =
            "mapMeasureTool requires a document runtime";

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapMeasureTool requires an AbortController runtime");
        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapMeasureTool requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapMeasureTool requires a clearTimeout runtime");
        expect(() => {
            runtime.addDocumentKeydownListener(() => undefined, {});
        }).toThrow(missingDocumentMessage);
        expect(() => runtime.createElement("button")).toThrow(
            missingDocumentMessage
        );
        expect(() => runtime.createSvgElement("svg")).toThrow(
            missingDocumentMessage
        );
        expect(() => runtime.createTextNode("distance")).toThrow(
            missingDocumentMessage
        );
        expect(() =>
            runtime.isHTMLElement(document.createElement("button"))
        ).toThrow("mapMeasureTool requires an HTMLElement runtime");
        expect(addEventListener).not.toHaveBeenCalled();
        expect(createElement).not.toHaveBeenCalled();
        expect(createElementNS).not.toHaveBeenCalled();
        expect(createTextNode).not.toHaveBeenCalled();
    });
});

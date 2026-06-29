import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserClearTimeout,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getMapDrawLapsRuntime,
    type MapDrawLapsRuntimeScope,
    type MapDrawLapsTimer,
} from "../../../../electron-app/utils/maps/layers/mapDrawLapsRuntime.js";

describe("getMapDrawLapsRuntime", () => {
    const unavailableMapDrawLapsRuntimeScope = {
        getClearTimeout: () => undefined,
        getDocument: () => undefined,
        getSetTimeout: () => undefined,
        getSVGElement: () => undefined,
    } satisfies MapDrawLapsRuntimeScope;

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("50");
        const timer = 73 as MapDrawLapsTimer;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const runtime = getMapDrawLapsRuntime({
            getClearTimeout: () => clearTimeout,
            getDocument: () => document,
            getSetTimeout: () => setTimeout,
            getSVGElement: () => SVGElement,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("routes timers through provider functions", () => {
        expect.assertions(6);

        const callback = vi.fn<() => void>();
        const delayMs = Number("75");
        const timer = 79 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const runtime = getMapDrawLapsRuntime({
            getClearTimeout,
            getDocument: () => document,
            getSetTimeout,
            getSVGElement: () => SVGElement,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(getSetTimeout).toHaveBeenCalledOnce();
        expect(getClearTimeout).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
        expect(callback).not.toHaveBeenCalled();
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("50");
        const timer = 74 as BrowserTimerHandle;
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<BrowserClearTimeout>();

        vi.stubGlobal("clearTimeout", clearTimeoutMock);
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getMapDrawLapsRuntime();
        const timerHandle = runtime.setTimeout(callback, delayMs);
        runtime.clearTimeout(timerHandle);

        expect(timerHandle).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeoutMock).toHaveBeenCalledWith(timer);
    });

    it("uses browser runtime providers for production DOM defaults", () => {
        expect.assertions(6);

        const runtime = getMapDrawLapsRuntime();
        const paragraph = runtime.createElement("p");
        const text = runtime.createTextNode("Lap 1");
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        paragraph.append(text);

        expect(paragraph).toBeInstanceOf(HTMLParagraphElement);
        expect(paragraph.ownerDocument).toBe(document);
        expect(paragraph.textContent).toBe("Lap 1");
        expect(runtime.isSVGElement(svg)).toBe(true);
        expect(runtime.isSVGElement(paragraph)).toBe(false);
        expect(runtime.isSVGElement(null)).toBe(false);
    });

    it("creates DOM nodes through the injected document provider", () => {
        expect.assertions(9);

        const getDocument = vi.fn(() => document);
        const runtime = getMapDrawLapsRuntime({
            getClearTimeout: () => vi.fn<BrowserClearTimeout>(),
            getDocument,
            getSetTimeout: () => vi.fn<BrowserSetTimeout>(),
            getSVGElement: () => SVGElement,
        });

        const paragraph = runtime.createElement("p");
        const breakElement = runtime.createElement("br");
        const text = runtime.createTextNode("Lap 1");
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        expect(paragraph.tagName).toBe("P");
        expect(breakElement.tagName).toBe("BR");
        expect(text.nodeType).toBe(Node.TEXT_NODE);
        expect(text.textContent).toBe("Lap 1");
        expect(getDocument).toHaveBeenCalledTimes(3);
        expect(paragraph.ownerDocument).toBe(document);
        expect(runtime.isSVGElement(svg)).toBe(true);
        expect(runtime.isSVGElement(paragraph)).toBe(false);
        expect(runtime.isSVGElement(null)).toBe(false);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(5);

        const runtime = getMapDrawLapsRuntime(
            unavailableMapDrawLapsRuntimeScope
        );

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapDrawLapsRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapDrawLapsRuntime requires clearTimeout"
        );
        expect(() => runtime.createElement("p")).toThrow(
            "mapDrawLapsRuntime requires document"
        );
        expect(() => runtime.createTextNode("Lap 1")).toThrow(
            "mapDrawLapsRuntime requires document"
        );
        expect(() =>
            runtime.isSVGElement(document.createElement("div"))
        ).toThrow("mapDrawLapsRuntime requires SVGElement");
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(5);

        const runtime = getMapDrawLapsRuntime(
            {} as unknown as MapDrawLapsRuntimeScope
        );

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapDrawLapsRuntime requires a setTimeout provider"
        );
        expect(() => runtime.clearTimeout(1 as BrowserTimerHandle)).toThrow(
            "mapDrawLapsRuntime requires a clearTimeout provider"
        );
        expect(() => runtime.createElement("p")).toThrow(
            "mapDrawLapsRuntime requires a document provider"
        );
        expect(() => runtime.createTextNode("Lap 1")).toThrow(
            "mapDrawLapsRuntime requires a document provider"
        );
        expect(() =>
            runtime.isSVGElement(document.createElement("div"))
        ).toThrow("mapDrawLapsRuntime requires an SVGElement provider");
    });

    it("ignores legacy direct runtime scope timer properties", () => {
        expect.assertions(7);

        const callback = vi.fn<() => void>();
        const timer = 83 as BrowserTimerHandle;
        const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
        const clearTimeout = vi.fn<BrowserClearTimeout>();
        const runtime = getMapDrawLapsRuntime({
            ...unavailableMapDrawLapsRuntimeScope,
            clearTimeout,
            document,
            setTimeout,
            SVGElement,
        } as unknown as MapDrawLapsRuntimeScope);

        expect(() => runtime.setTimeout(callback, 1)).toThrow(
            "mapDrawLapsRuntime requires setTimeout"
        );
        expect(() => runtime.clearTimeout(timer)).toThrow(
            "mapDrawLapsRuntime requires clearTimeout"
        );
        expect(() => runtime.createElement("p")).toThrow(
            "mapDrawLapsRuntime requires document"
        );
        expect(() => runtime.createTextNode("Lap 1")).toThrow(
            "mapDrawLapsRuntime requires document"
        );
        expect(() =>
            runtime.isSVGElement(document.createElement("div"))
        ).toThrow("mapDrawLapsRuntime requires SVGElement");
        expect(setTimeout).not.toHaveBeenCalled();
        expect(clearTimeout).not.toHaveBeenCalled();
    });
});

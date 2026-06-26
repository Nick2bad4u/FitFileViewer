import { afterEach, describe, expect, it, vi } from "vitest";

import { getMapDrawLapsRuntime } from "../../../../electron-app/utils/maps/layers/mapDrawLapsRuntime.js";

describe("getMapDrawLapsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("50");
        const timer = 73 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapDrawLapsRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
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
        const timer = 79 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const getSetTimeout = vi.fn(() => setTimeout);
        const getClearTimeout = vi.fn(() => clearTimeout);
        const runtime = getMapDrawLapsRuntime({
            getClearTimeout,
            getSetTimeout,
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
        const timer = 74 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeoutMock = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeoutMock = vi.fn<typeof globalThis.clearTimeout>();

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
            getClearTimeout: () => vi.fn<typeof globalThis.clearTimeout>(),
            getDocument,
            getSetTimeout: () => vi.fn<typeof globalThis.setTimeout>(),
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

        const runtime = getMapDrawLapsRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapDrawLapsRuntime requires setTimeout"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapDrawLapsRuntime requires clearTimeout");
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

    it("ignores legacy direct runtime scope timer properties", () => {
        expect.assertions(7);

        const callback = vi.fn<() => void>();
        const timer = 83 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapDrawLapsRuntime({
            clearTimeout,
            document,
            setTimeout,
            SVGElement,
        } as unknown as Parameters<typeof getMapDrawLapsRuntime>[0]);

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

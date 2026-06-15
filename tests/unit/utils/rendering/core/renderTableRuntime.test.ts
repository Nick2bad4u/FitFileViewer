import { describe, expect, it, vi } from "vitest";

import { getRenderTableRuntime } from "../../../../../electron-app/utils/rendering/core/renderTableRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
    vi.restoreAllMocks();
}

describe("getRenderTableRuntime", () => {
    it("creates elements through the injected document", () => {
        expect.assertions(1);

        const element = getRenderTableRuntime({ document }).createElement(
            "div"
        );

        expect(element).toBeInstanceOf(HTMLDivElement);
    });

    it("returns injected elements by id when they are HTMLElements", () => {
        expect.assertions(1);

        try {
            const element = document.createElement("section");
            element.id = "target";
            document.body.append(element);

            expect(
                getRenderTableRuntime({
                    document,
                    HTMLElement,
                }).getElementById("target")
            ).toBe(element);
        } finally {
            cleanupFixture();
        }
    });

    it("checks HTMLElement and table-cell instances through the runtime scope", () => {
        expect.assertions(3);

        const cell = document.createElement("th");
        const element = document.createElement("div");
        const utils = getRenderTableRuntime({
            HTMLElement,
            HTMLTableCellElement,
        });

        expect(utils.isHTMLElement(element)).toBe(true);
        expect(utils.isTableCellElement(cell)).toBe(true);
        expect(getRenderTableRuntime({}).isHTMLElement(element)).toBe(false);
    });

    it("wraps computed style access", () => {
        expect.assertions(2);

        const element = document.createElement("div");
        const style = { display: "block" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const utils = getRenderTableRuntime({ getComputedStyle });

        expect(utils.getComputedStyle(element)).toBe(style);
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("wraps animation-frame scheduling", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 5);
        const utils = getRenderTableRuntime({ requestAnimationFrame });

        expect(utils.requestAnimationFrame(callback)).toBe(5);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getRenderTableRuntime({}).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("wraps timer scheduling and cleanup", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 9);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const utils = getRenderTableRuntime({ clearTimeout, setTimeout });
        const timeoutMs = Number.parseInt("50", 10);

        expect(utils.setTimeout(callback, timeoutMs)).toBe(9);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);

        utils.clearTimeout(9);

        expect(clearTimeout).toHaveBeenCalledWith(9);
        expect(callback).not.toHaveBeenCalled();
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderTableRuntime({});

        expect(() => utils.clearTimeout(9)).toThrow(
            "renderTable requires a clearTimeout runtime"
        );
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderTableRuntime({});

        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderTable requires a setTimeout runtime"
        );
    });
});

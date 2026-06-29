import { describe, expect, it, vi } from "vitest";

import {
    getRenderTableRuntime,
    type RenderTableTimerHandle,
    type RenderTableRuntimeScope,
} from "../../../../../electron-app/utils/rendering/core/renderTableRuntime.js";
import type {
    BrowserClearTimeout,
    BrowserGetComputedStyle,
    BrowserRequestAnimationFrame,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
}

describe("getRenderTableRuntime", () => {
    const unavailableRenderTableRuntimeScope = {
        getClearTimeout: () => undefined,
        getComputedStyleFunction: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getHTMLTableCellElement: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getSetTimeout: () => undefined,
    } satisfies RenderTableRuntimeScope;

    it("creates elements through the injected document", () => {
        expect.assertions(1);

        const element = getRenderTableRuntime({
            ...unavailableRenderTableRuntimeScope,
            getDocument: () => document,
        }).createElement("div");

        expect(element).toBeInstanceOf(HTMLDivElement);
    });

    it("routes table browser dependencies through provider functions", () => {
        expect.assertions(20);

        try {
            const target = document.createElement("section");
            target.id = "target";
            document.body.append(target);
            const cell = document.createElement("td");
            const style = { display: "table" } as CSSStyleDeclaration;
            const callback = vi.fn<() => void>();
            const frameCallback = vi.fn<FrameRequestCallback>();
            const timeoutMs = Number.parseInt("25", 10);
            const getComputedStyle = vi.fn<
                (element: Element) => CSSStyleDeclaration
            >(() => style);
            const requestAnimationFrame = vi.fn<
                (callback: FrameRequestCallback) => number
            >(() => 14);
            const setTimeout = vi.fn<
                (callback: () => void, timeout?: number) => number
            >(() => 11);
            const clearTimeout = vi.fn<(handle: number) => void>();
            const getDocument = vi.fn(() => document);
            const getHTMLElement = vi.fn(() => HTMLElement);
            const getHTMLTableCellElement = vi.fn(() => HTMLTableCellElement);
            const getComputedStyleFunction = vi.fn(() => getComputedStyle);
            const getRequestAnimationFrame = vi.fn(() => requestAnimationFrame);
            const getSetTimeout = vi.fn(() => setTimeout);
            const getClearTimeout = vi.fn(() => clearTimeout);
            const utils = getRenderTableRuntime({
                getClearTimeout,
                getComputedStyleFunction,
                getDocument,
                getHTMLElement,
                getHTMLTableCellElement,
                getRequestAnimationFrame,
                getSetTimeout,
            });

            expect(utils.createElement("span")).toBeInstanceOf(HTMLSpanElement);
            expect(utils.getElementById("target")).toBe(target);
            expect(utils.isHTMLElement(target)).toBe(true);
            expect(utils.isTableCellElement(cell)).toBe(true);
            expect(utils.getComputedStyle(target)).toBe(style);
            expect(utils.requestAnimationFrame(frameCallback)).toBe(14);
            expect(utils.setTimeout(callback, timeoutMs)).toBe(11);
            utils.clearTimeout(11);

            expect(getDocument).toHaveBeenCalled();
            expect(getHTMLElement).toHaveBeenCalled();
            expect(getHTMLTableCellElement).toHaveBeenCalled();
            expect(getComputedStyleFunction).toHaveBeenCalledOnce();
            expect(getRequestAnimationFrame).toHaveBeenCalledOnce();
            expect(getSetTimeout).toHaveBeenCalledOnce();
            expect(getClearTimeout).toHaveBeenCalledOnce();
            expect(getComputedStyle).toHaveBeenCalledWith(target);
            expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
            expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
            expect(clearTimeout).toHaveBeenCalledWith(11);
            expect(callback).not.toHaveBeenCalled();
            expect(frameCallback).not.toHaveBeenCalled();
        } finally {
            cleanupFixture();
        }
    });

    it("uses browser runtime providers for production table defaults", () => {
        expect.assertions(14);

        try {
            const target = document.createElement("section");
            target.id = "target";
            document.body.append(target);
            const cell = document.createElement("td");
            const callback = vi.fn<() => void>();
            const frameCallback = vi.fn<FrameRequestCallback>();
            const style = { display: "table" } as CSSStyleDeclaration;
            const timer = Symbol("timer") as RenderTableTimerHandle;
            const timeoutMs = Number.parseInt("35", 10);
            const getComputedStyle = vi.fn<BrowserGetComputedStyle>(
                () => style
            );
            const requestAnimationFrame = vi.fn<BrowserRequestAnimationFrame>(
                () => 17
            );
            const setTimeout = vi.fn<BrowserSetTimeout>(() => timer);
            const clearTimeout = vi.fn<BrowserClearTimeout>();
            vi.stubGlobal("clearTimeout", clearTimeout);
            vi.stubGlobal("getComputedStyle", getComputedStyle);
            vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
            vi.stubGlobal("setTimeout", setTimeout);
            const utils = getRenderTableRuntime();

            expect(utils.createElement("span")).toBeInstanceOf(HTMLSpanElement);
            expect(utils.getElementById("target")).toBe(target);
            expect(utils.isHTMLElement(target)).toBe(true);
            expect(utils.isTableCellElement(cell)).toBe(true);
            expect(utils.getComputedStyle(target)).toBe(style);
            expect(getComputedStyle).toHaveBeenCalledWith(target);
            expect(utils.requestAnimationFrame(frameCallback)).toBe(17);
            expect(requestAnimationFrame).toHaveBeenCalledWith(frameCallback);
            expect(utils.setTimeout(callback, timeoutMs)).toBe(timer);
            utils.clearTimeout(timer);

            expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
            expect(clearTimeout).toHaveBeenCalledWith(timer);
            expect(callback).not.toHaveBeenCalled();
            expect(frameCallback).not.toHaveBeenCalled();
            expect(requestAnimationFrame).toHaveBeenCalledOnce();
        } finally {
            cleanupFixture();
        }
    });

    it("returns injected elements by id when they are HTMLElements", () => {
        expect.assertions(1);

        try {
            const element = document.createElement("section");
            element.id = "target";
            document.body.append(element);

            expect(
                getRenderTableRuntime({
                    ...unavailableRenderTableRuntimeScope,
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
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
            ...unavailableRenderTableRuntimeScope,
            getHTMLElement: () => HTMLElement,
            getHTMLTableCellElement: () => HTMLTableCellElement,
        });

        expect(utils.isHTMLElement(element)).toBe(true);
        expect(utils.isTableCellElement(cell)).toBe(true);
        expect(
            getRenderTableRuntime(
                unavailableRenderTableRuntimeScope
            ).isHTMLElement(element)
        ).toBe(false);
    });

    it("wraps computed style access", () => {
        expect.assertions(2);

        const element = document.createElement("div");
        const style = { display: "block" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const utils = getRenderTableRuntime({
            ...unavailableRenderTableRuntimeScope,
            getComputedStyleFunction: () => getComputedStyle,
        });

        expect(utils.getComputedStyle(element)).toBe(style);
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("wraps animation-frame scheduling", () => {
        expect.assertions(2);

        const callback = vi.fn<FrameRequestCallback>();
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 5);
        const utils = getRenderTableRuntime({
            ...unavailableRenderTableRuntimeScope,
            getRequestAnimationFrame: () => requestAnimationFrame,
        });

        expect(utils.requestAnimationFrame(callback)).toBe(5);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
    });

    it("returns undefined when animation frames are unavailable", () => {
        expect.assertions(1);

        expect(
            getRenderTableRuntime(
                unavailableRenderTableRuntimeScope
            ).requestAnimationFrame(() => {})
        ).toBeUndefined();
    });

    it("wraps timer scheduling and cleanup", () => {
        expect.assertions(4);

        const callback = vi.fn<() => void>();
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 9);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const utils = getRenderTableRuntime({
            ...unavailableRenderTableRuntimeScope,
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });
        const timeoutMs = Number.parseInt("50", 10);

        expect(utils.setTimeout(callback, timeoutMs)).toBe(9);
        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);

        utils.clearTimeout(9);

        expect(clearTimeout).toHaveBeenCalledWith(9);
        expect(callback).not.toHaveBeenCalled();
    });

    it("throws when timer cleanup is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderTableRuntime(unavailableRenderTableRuntimeScope);

        expect(() => utils.clearTimeout(9)).toThrow(
            "renderTable requires a clearTimeout runtime"
        );
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderTableRuntime(unavailableRenderTableRuntimeScope);

        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderTable requires a setTimeout runtime"
        );
    });

    it("throws clearly when required providers are omitted", () => {
        expect.assertions(8);

        const utils = getRenderTableRuntime(
            {} as unknown as RenderTableRuntimeScope
        );
        const target = document.createElement("section");

        expect(() => utils.createElement("span")).toThrow(
            "renderTable requires a document provider"
        );
        expect(() => utils.getElementById("target")).toThrow(
            "renderTable requires a document provider"
        );
        expect(() => utils.getComputedStyle(target)).toThrow(
            "renderTable requires a getComputedStyle provider"
        );
        expect(() => utils.isHTMLElement(target)).toThrow(
            "renderTable requires an HTMLElement provider"
        );
        expect(() => utils.isTableCellElement(target)).toThrow(
            "renderTable requires an HTMLTableCellElement provider"
        );
        expect(() => utils.requestAnimationFrame(vi.fn())).toThrow(
            "renderTable requires a requestAnimationFrame provider"
        );
        expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
            "renderTable requires a setTimeout provider"
        );
        expect(() => utils.clearTimeout(1)).toThrow(
            "renderTable requires a clearTimeout provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(12);

        const target = document.createElement("section");
        target.id = "target";
        document.body.append(target);
        const style = { display: "table-row" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const requestAnimationFrame = vi.fn<
            (callback: FrameRequestCallback) => number
        >(() => 14);
        const setTimeout = vi.fn<
            (callback: () => void, timeout?: number) => number
        >(() => 11);
        const clearTimeout = vi.fn<(handle: number) => void>();
        const utils = getRenderTableRuntime({
            ...unavailableRenderTableRuntimeScope,
            HTMLElement,
            HTMLTableCellElement,
            clearTimeout,
            document,
            getComputedStyle,
            requestAnimationFrame,
            setTimeout,
        } as unknown as RenderTableRuntimeScope);

        try {
            expect(() => utils.createElement("span")).toThrow(
                "renderTable requires a document-like runtime"
            );
            expect(() => utils.getElementById("target")).toThrow(
                "renderTable requires a document-like runtime"
            );
            expect(utils.isHTMLElement(target)).toBe(false);
            expect(utils.isTableCellElement(document.createElement("td"))).toBe(
                false
            );
            expect(utils.getComputedStyle(target)).toBeUndefined();
            expect(utils.requestAnimationFrame(vi.fn())).toBeUndefined();
            expect(() => utils.setTimeout(vi.fn(), 1)).toThrow(
                "renderTable requires a setTimeout runtime"
            );
            expect(() => utils.clearTimeout(11)).toThrow(
                "renderTable requires a clearTimeout runtime"
            );
            expect(getComputedStyle).not.toHaveBeenCalled();
            expect(requestAnimationFrame).not.toHaveBeenCalled();
            expect(setTimeout).not.toHaveBeenCalled();
            expect(clearTimeout).not.toHaveBeenCalled();
        } finally {
            cleanupFixture();
        }
    });
});

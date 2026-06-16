import { describe, expect, it, vi } from "vitest";

import { getEnableTabButtonsHelpersRuntime } from "../../../../../electron-app/utils/ui/controls/enableTabButtonsHelpersRuntime.js";

describe("getEnableTabButtonsHelpersRuntime", () => {
    it("returns computed style when runtime APIs are available", () => {
        expect.assertions(2);

        const element = document.createElement("button");
        const style = { display: "block" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const runtime = getEnableTabButtonsHelpersRuntime({
            getComputedStyle,
            isRendererScope: () => true,
        });

        expect(runtime.getComputedStyle(element)).toBe(style);
        expect(getComputedStyle).toHaveBeenCalledWith(element);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(4);

        const element = document.createElement("button");
        const style = { display: "inline-flex" } as CSSStyleDeclaration;
        const first = document.createElement("button");
        const second = document.createElement("button");
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const querySelectorAll = vi.fn(
            () => [first, second] as unknown as NodeListOf<Element>
        );
        const runtime = getEnableTabButtonsHelpersRuntime({
            getComputedStyleFunction: () => getComputedStyle,
            getDocument: () => ({ querySelectorAll }),
            isRendererScope: () => true,
        });

        expect(runtime.getComputedStyle(element)).toBe(style);
        expect(getComputedStyle).toHaveBeenCalledWith(element);
        expect(runtime.queryTabButtons()).toStrictEqual([first, second]);
        expect(querySelectorAll).toHaveBeenCalledWith(".tab-button");
    });

    it("returns undefined computed style when browser APIs are unavailable", () => {
        expect.assertions(1);

        expect(
            getEnableTabButtonsHelpersRuntime({}).getComputedStyle(
                document.createElement("button")
            )
        ).toBeUndefined();
    });

    it("queries tab buttons using querySelectorAll first", () => {
        expect.assertions(1);

        const first = document.createElement("button");
        const second = document.createElement("button");
        const runtime = getEnableTabButtonsHelpersRuntime({
            document: {
                querySelectorAll: () =>
                    [first, second] as unknown as NodeListOf<Element>,
            },
        });

        expect(runtime.queryTabButtons()).toStrictEqual([first, second]);
    });

    it("falls back to getElementsByClassName for tab button queries", () => {
        expect.assertions(1);

        const button = document.createElement("button");
        const runtime = getEnableTabButtonsHelpersRuntime({
            document: {
                getElementsByClassName: () =>
                    [button] as unknown as HTMLCollectionOf<Element>,
            },
        });

        expect(runtime.queryTabButtons()).toStrictEqual([button]);
    });

    it("returns no tab buttons when document APIs are unavailable", () => {
        expect.assertions(1);

        expect(
            getEnableTabButtonsHelpersRuntime({}).queryTabButtons()
        ).toStrictEqual([]);
    });
});

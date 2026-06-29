import { describe, expect, it, vi } from "vitest";

import {
    getEnableTabButtonsHelpersRuntime,
    type EnableTabButtonsHelpersRuntimeScope,
} from "../../../../../electron-app/utils/ui/controls/enableTabButtonsHelpersRuntime.js";

function createUnavailableRuntimeScope(
    overrides: Partial<EnableTabButtonsHelpersRuntimeScope> = {}
): EnableTabButtonsHelpersRuntimeScope {
    return {
        getComputedStyleFunction: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        isRendererScope: () => false,
        ...overrides,
    };
}

describe("getEnableTabButtonsHelpersRuntime", () => {
    it("returns computed style when runtime APIs are available", () => {
        expect.assertions(2);

        const element = document.createElement("button");
        const style = { display: "block" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const runtime = getEnableTabButtonsHelpersRuntime(
            createUnavailableRuntimeScope({
                getComputedStyleFunction: () => getComputedStyle,
                isRendererScope: () => true,
            })
        );

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
        const runtime = getEnableTabButtonsHelpersRuntime(
            createUnavailableRuntimeScope({
                getComputedStyleFunction: () => getComputedStyle,
                getDocument: () => ({ querySelectorAll }),
                getHTMLElement: () => HTMLElement,
                isRendererScope: () => true,
            })
        );

        expect(runtime.getComputedStyle(element)).toBe(style);
        expect(getComputedStyle).toHaveBeenCalledWith(element);
        expect(runtime.queryTabButtons()).toStrictEqual([first, second]);
        expect(querySelectorAll).toHaveBeenCalledWith(".tab-button");
    });

    it("returns undefined computed style when browser APIs are unavailable", () => {
        expect.assertions(1);

        expect(
            getEnableTabButtonsHelpersRuntime(
                createUnavailableRuntimeScope()
            ).getComputedStyle(document.createElement("button"))
        ).toBeUndefined();
    });

    it("queries tab buttons using querySelectorAll first", () => {
        expect.assertions(1);

        const first = document.createElement("button");
        const second = document.createElement("button");
        const runtime = getEnableTabButtonsHelpersRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => ({
                    querySelectorAll: () =>
                        [first, second] as unknown as NodeListOf<Element>,
                }),
                getHTMLElement: () => HTMLElement,
            })
        );

        expect(runtime.queryTabButtons()).toStrictEqual([first, second]);
    });

    it("falls back to getElementsByClassName for tab button queries", () => {
        expect.assertions(1);

        const button = document.createElement("button");
        const runtime = getEnableTabButtonsHelpersRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => ({
                    getElementsByClassName: () =>
                        [button] as unknown as HTMLCollectionOf<Element>,
                }),
                getHTMLElement: () => HTMLElement,
            })
        );

        expect(runtime.queryTabButtons()).toStrictEqual([button]);
    });

    it("requires an HTMLElement provider before filtering tab button elements", () => {
        expect.assertions(1);

        const button = document.createElement("button");
        const runtime = getEnableTabButtonsHelpersRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => ({
                    querySelectorAll: () =>
                        [button] as unknown as NodeListOf<Element>,
                }),
            })
        );

        expect(() => runtime.queryTabButtons()).toThrow(
            "enableTabButtonsHelpers requires an HTMLElement runtime"
        );
    });

    it("returns no tab buttons when document APIs are unavailable", () => {
        expect.assertions(1);

        expect(
            getEnableTabButtonsHelpersRuntime(
                createUnavailableRuntimeScope()
            ).queryTabButtons()
        ).toStrictEqual([]);
    });

    it("throws clearly when required runtime providers are missing", () => {
        expect.assertions(4);

        expect(() =>
            getEnableTabButtonsHelpersRuntime({
                getComputedStyleFunction: () => undefined,
                getHTMLElement: () => HTMLElement,
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsHelpersRuntimeScope).queryTabButtons()
        ).toThrow("enableTabButtonsHelpers requires a document provider");
        expect(() =>
            getEnableTabButtonsHelpersRuntime({
                getDocument: () => undefined,
                getHTMLElement: () => HTMLElement,
                isRendererScope: () => true,
            } as unknown as EnableTabButtonsHelpersRuntimeScope).getComputedStyle(
                document.createElement("button")
            )
        ).toThrow(
            "enableTabButtonsHelpers requires a getComputedStyle provider"
        );
        expect(() =>
            getEnableTabButtonsHelpersRuntime({
                getComputedStyleFunction: () => undefined,
                getDocument: () => ({
                    querySelectorAll: () =>
                        [
                            document.createElement("button"),
                        ] as unknown as NodeListOf<Element>,
                }),
                isRendererScope: () => false,
            } as unknown as EnableTabButtonsHelpersRuntimeScope).queryTabButtons()
        ).toThrow("enableTabButtonsHelpers requires an HTMLElement provider");
        expect(() =>
            getEnableTabButtonsHelpersRuntime({
                getComputedStyleFunction: () => undefined,
                getDocument: () => undefined,
                getHTMLElement: () => HTMLElement,
            } as unknown as EnableTabButtonsHelpersRuntimeScope).getComputedStyle(
                document.createElement("button")
            )
        ).toThrow(
            "enableTabButtonsHelpers requires an isRendererScope provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(4);

        const element = document.createElement("button");
        const button = document.createElement("button");
        const style = { display: "grid" } as CSSStyleDeclaration;
        const getComputedStyle = vi.fn<
            (element: Element) => CSSStyleDeclaration
        >(() => style);
        const querySelectorAll = vi.fn(
            () => [button] as unknown as NodeListOf<Element>
        );
        const runtime = getEnableTabButtonsHelpersRuntime({
            HTMLElement,
            document: { querySelectorAll },
            getComputedStyle,
            isRendererScope: () => true,
        } as unknown as EnableTabButtonsHelpersRuntimeScope);

        expect(() => runtime.getComputedStyle(element)).toThrow(
            "enableTabButtonsHelpers requires a getComputedStyle provider"
        );
        expect(() => runtime.queryTabButtons()).toThrow(
            "enableTabButtonsHelpers requires a document provider"
        );
        expect(getComputedStyle).not.toHaveBeenCalled();
        expect(querySelectorAll).not.toHaveBeenCalled();
    });
});

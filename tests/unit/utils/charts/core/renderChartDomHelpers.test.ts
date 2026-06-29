// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
    isElement,
    renderNoDataMessage,
    safeAppend,
} from "../../../../../electron-app/utils/charts/core/renderChartDomHelpers.js";
import {
    getRenderChartDomHelpersRuntime,
    type RenderChartDomHelpersRuntime,
    type RenderChartDomHelpersRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartDomHelpersRuntime.js";

const unavailableDomHelpersScope = {
    getDocument: () => undefined,
    getHTMLElement: () => undefined,
} satisfies RenderChartDomHelpersRuntimeScope;

describe("renderChartDomHelpers", () => {
    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(3);

        const utils = getRenderChartDomHelpersRuntime();
        const element = utils.createElement("div");

        expect(element).toBeInstanceOf(HTMLDivElement);
        expect(utils.isHTMLElement(element)).toBe(true);
        expect(utils.isHTMLElement({ nodeType: 1 })).toBe(false);
    });

    it("renders a no-data message through the runtime-created element", () => {
        expect.assertions(4);

        const container = document.createElement("section");
        const stale = document.createElement("span");
        stale.textContent = "stale";
        container.append(stale);

        renderNoDataMessage(container, "No chart data");

        const message = container.querySelector(".no-data-message");
        expect(container.children).toHaveLength(1);
        expect(message).toBeInstanceOf(HTMLDivElement);
        expect(message?.textContent).toBe("No chart data");
        expect(container.textContent).not.toContain("stale");
    });

    it("renders a no-data message through an injected runtime", () => {
        expect.assertions(4);

        const container = document.createElement("section");
        const messageElement = document.createElement("div");
        const runtime: RenderChartDomHelpersRuntime = {
            createElement: vi.fn(() => messageElement),
            isHTMLElement: vi.fn(
                (value): value is HTMLElement => value instanceof HTMLElement
            ),
        };

        renderNoDataMessage(container, "Injected chart state", runtime);

        expect(runtime.createElement).toHaveBeenCalledExactlyOnceWith("div");
        expect(container.firstElementChild).toBe(messageElement);
        expect(messageElement.className).toBe("no-data-message");
        expect(messageElement.textContent).toBe("Injected chart state");
    });

    it("creates chart DOM elements through the injected document provider", () => {
        expect.assertions(3);

        const element = document.createElement("div");
        const createElement = vi.fn<Document["createElement"]>((tagName) =>
            tagName === "div" ? element : document.createElement(tagName)
        );
        const utils = getRenderChartDomHelpersRuntime({
            ...unavailableDomHelpersScope,
            getDocument: () => ({ createElement }),
        });

        expect(utils.createElement("div")).toBe(element);
        expect(createElement).toHaveBeenCalledExactlyOnceWith("div");
        expect(createElement.mock.contexts[0]).toMatchObject({
            createElement,
        });
    });

    it("checks elements through the injected HTMLElement provider", () => {
        expect.assertions(2);

        const utils = getRenderChartDomHelpersRuntime({
            ...unavailableDomHelpersScope,
            getHTMLElement: () => HTMLElement,
        });

        expect(utils.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(utils.isHTMLElement({ nodeType: 1 })).toBe(false);
    });

    it("requires explicit document providers for explicit scopes", () => {
        expect.assertions(2);

        const utils = getRenderChartDomHelpersRuntime(
            unavailableDomHelpersScope
        );

        expect(() => utils.createElement("div")).toThrow(
            "renderChartDomHelpers requires a document runtime"
        );
        expect(() =>
            utils.isHTMLElement(document.createElement("div"))
        ).toThrow("renderChartDomHelpers requires an HTMLElement runtime");
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(2);

        const omittedProviderScope =
            {} as unknown as RenderChartDomHelpersRuntimeScope;
        const utils = getRenderChartDomHelpersRuntime(omittedProviderScope);

        expect(() => utils.createElement("div")).toThrow(
            "renderChartDomHelpers requires a document provider"
        );
        expect(() =>
            utils.isHTMLElement(document.createElement("div"))
        ).toThrow("renderChartDomHelpers requires an HTMLElement provider");
    });

    it("ignores legacy direct document scope properties", () => {
        expect.assertions(3);

        const createElement = vi.fn<Document["createElement"]>(() =>
            document.createElement("div")
        );
        const utils = getRenderChartDomHelpersRuntime({
            ...unavailableDomHelpersScope,
            document: { createElement },
            HTMLElement,
        } as unknown as RenderChartDomHelpersRuntimeScope);

        expect(() => utils.createElement("div")).toThrow(
            "renderChartDomHelpers requires a document runtime"
        );
        expect(() =>
            utils.isHTMLElement(document.createElement("div"))
        ).toThrow("renderChartDomHelpers requires an HTMLElement runtime");
        expect(createElement).not.toHaveBeenCalled();
    });

    it("keeps safeAppend and isElement behavior intact", () => {
        expect.assertions(3);

        const parent = document.createElement("div");
        const child = document.createElement("span");

        safeAppend(parent, child);

        expect(parent.firstChild).toBe(child);
        expect(isElement(parent)).toBe(true);
        expect(isElement({ nodeType: 3 })).toBe(false);
    });
});

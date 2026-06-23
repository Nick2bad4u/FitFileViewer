// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
    isElement,
    renderNoDataMessage,
    safeAppend,
} from "../../../../../electron-app/utils/charts/core/renderChartDomHelpers.js";
import {
    getRenderChartDomHelpersRuntime,
    type RenderChartDomHelpersRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartDomHelpersRuntime.js";

describe("renderChartDomHelpers", () => {
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

    it("creates chart DOM elements through the injected document provider", () => {
        expect.assertions(3);

        const element = document.createElement("div");
        const createElement = vi.fn<Document["createElement"]>((tagName) =>
            tagName === "div" ? element : document.createElement(tagName)
        );
        const utils = getRenderChartDomHelpersRuntime({
            getDocument: () => ({ createElement }),
        });

        expect(utils.createElement("div")).toBe(element);
        expect(createElement).toHaveBeenCalledExactlyOnceWith("div");
        expect(createElement.mock.contexts[0]).toMatchObject({
            createElement,
        });
    });

    it("requires explicit document providers for explicit scopes", () => {
        expect.assertions(1);

        const utils = getRenderChartDomHelpersRuntime({});

        expect(() => utils.createElement("div")).toThrow(
            "renderChartDomHelpers requires a document runtime"
        );
    });

    it("ignores legacy direct document scope properties", () => {
        expect.assertions(2);

        const createElement = vi.fn<Document["createElement"]>(() =>
            document.createElement("div")
        );
        const utils = getRenderChartDomHelpersRuntime({
            document: { createElement },
        } as unknown as RenderChartDomHelpersRuntimeScope);

        expect(() => utils.createElement("div")).toThrow(
            "renderChartDomHelpers requires a document runtime"
        );
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

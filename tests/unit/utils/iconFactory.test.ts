// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    createAppIconElement,
    getAppIconSvg,
} from "../../../electron-app/utils/ui/icons/iconFactory.js";

function getRequiredSvgChild<T extends SVGElement>(
    icon: SVGSVGElement,
    selector: string
): T {
    const element = icon.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing expected SVG child: ${selector}`);
    }
    return element;
}

describe("iconFactory", () => {
    it("creates inline SVG elements without parsing markup", () => {
        expect.assertions(6);

        const icon = createAppIconElement("timer", {
            className: "lap-control-icon extra",
            size: 18,
            strokeWidth: 3,
            title: "<Timer>",
        });

        expect(icon.tagName.toLowerCase()).toBe("svg");
        expect(icon.className.baseVal).toBe("lap-control-icon extra");
        expect(icon.getAttribute("width")).toBe("18");
        expect(icon.getAttribute("stroke-width")).toBe("3");
        expect(
            getRequiredSvgChild<SVGTitleElement>(icon, "title").textContent
        ).toBe("<Timer>");
        expect(
            Array.from(icon.children, (child) => child.tagName)
        ).toStrictEqual([
            "title",
            "circle",
            "path",
            "path",
            "path",
        ]);
    });

    it("creates inline SVG elements through an injected runtime", () => {
        expect.assertions(4);

        const createSvgElement = vi.fn(
            <K extends keyof SVGElementTagNameMap>(
                tagName: K
            ): SVGElementTagNameMap[K] =>
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    tagName
                ) as SVGElementTagNameMap[K]
        );

        const icon = createAppIconElement(
            "circleHelp",
            { title: "Help" },
            { createSvgElement }
        );

        expect(icon.tagName.toLowerCase()).toBe("svg");
        expect(icon.querySelector("title")?.textContent).toBe("Help");
        expect(createSvgElement).toHaveBeenCalledWith("svg");
        expect(createSvgElement).toHaveBeenCalledWith("circle");
    });

    it("escapes dynamic values in the legacy SVG string API", () => {
        expect.assertions(3);

        const markup = getAppIconSvg("timer", {
            className: 'bad" class',
            title: "<Timer>",
        });

        expect(markup).toContain('class="bad&quot; class"');
        expect(markup).toContain("<title>&lt;Timer&gt;</title>");
        expect(markup).not.toContain("<title><Timer></title>");
    });
});

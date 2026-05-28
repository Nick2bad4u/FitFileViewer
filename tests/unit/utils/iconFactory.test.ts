// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
    createAppIconElement,
    getAppIconSvg,
} from "../../../electron-app/utils/ui/icons/iconFactory.js";

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
        expect(Array.from(icon.classList)).toStrictEqual([
            "lap-control-icon",
            "extra",
        ]);
        expect(icon.getAttribute("width")).toBe("18");
        expect(icon.getAttribute("stroke-width")).toBe("3");
        expect(icon.querySelector("title")?.textContent).toBe("<Timer>");
        expect(Array.from(icon.children, (child) => child.tagName)).toEqual([
            "title",
            "circle",
            "path",
            "path",
            "path",
        ]);
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

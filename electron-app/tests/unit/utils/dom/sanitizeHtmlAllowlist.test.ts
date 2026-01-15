import { describe, expect, it } from "vitest";

import { sanitizeHtmlAllowlist } from "../../../../utils/dom/index.js";

describe("sanitizeHtmlAllowlist", () => {
    it("removes disallowed tags and keeps their textContent", () => {
        const html = "<div>hello<img src=x onerror=alert(1)>world</div>";
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["class", "id", "style"],
            allowedTags: ["DIV"],
            stripUrlInStyle: true,
        });

        const container = document.createElement("div");
        container.append(fragment);

        // img must not exist
        expect(container.querySelector("img")).toBeNull();
        // Text content should be preserved (img has no text)
        expect(container.textContent).toBe("helloworld");
    });

    it("strips inline event handlers (on*) even when the tag is allowed", () => {
        const html = '<div id="x" onclick="alert(1)">hi</div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["id"],
            allowedTags: ["DIV"],
        });

        const container = document.createElement("div");
        container.append(fragment);

        const div = container.querySelector("div");
        expect(div).toBeTruthy();
        expect(div?.getAttribute("id")).toBe("x");
        expect(div?.getAttribute("onclick")).toBeNull();
    });

    it("strips href/src/xlink:href attributes defensively", () => {
        const html = '<div><a href="https://example.com" class="c">link</a></div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["class"],
            allowedTags: ["DIV", "A"],
        });

        const container = document.createElement("div");
        container.append(fragment);

        const anchor = container.querySelector("a");
        expect(anchor).toBeTruthy();
        expect(anchor?.getAttribute("href")).toBeNull();
        expect(anchor?.className).toBe("c");
    });

    it("removes style attributes containing url() when stripUrlInStyle is enabled", () => {
        const html = '<div style="background-image:url(https://evil.example/x)">x</div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["style"],
            allowedTags: ["DIV"],
            stripUrlInStyle: true,
        });

        const container = document.createElement("div");
        container.append(fragment);

        const div = container.querySelector("div");
        expect(div).toBeTruthy();
        expect(div?.hasAttribute("style")).toBe(false);
    });
});

import { describe, expect, it } from "vitest";

import { sanitizeHtmlAllowlist } from "../../../../electron-app/utils/dom/index.js";

interface DomPurifyTestGlobal {
    DOMPurify?: {
        sanitize: (
            html: string,
            options: { RETURN_DOM_FRAGMENT: true }
        ) => DocumentFragment;
    };
}

function getDomPurifyGlobal(): DomPurifyTestGlobal {
    return globalThis as DomPurifyTestGlobal;
}

function getRequiredElement<T extends Element>(
    element: T | null,
    selector: string
): T {
    if (!element) {
        throw new Error(`Expected sanitized element for selector: ${selector}`);
    }

    return element;
}

function getRequiredFragmentElement<T extends Element>(
    fragment: DocumentFragment,
    selector: string,
    constructor: { new (...args: any[]): T }
): T {
    const element = fragment.querySelector(selector);
    expect(element).toBeInstanceOf(constructor);
    return element as T;
}

function serializeFragment(fragment: DocumentFragment): string {
    const host = document.createElement("div");
    host.append(fragment.cloneNode(true));
    return host.textContent ?? "";
}

describe(sanitizeHtmlAllowlist, () => {
    it("removes forbidden tags and unsafe attributes in fallback mode", () => {
        expect.assertions(6);

        const globalRef = getDomPurifyGlobal();
        const previousPurifier = globalRef.DOMPurify;
        delete globalRef.DOMPurify;

        try {
            const fragment = sanitizeHtmlAllowlist(
                '<p class="ok" onclick="alert(1)" href="file:///x" style="color:red">safe</p><em>kept</em><script>alert(1)</script>',
                {
                    allowedAttributes: [
                        "class",
                        "href",
                        "style",
                    ],
                    allowedTags: ["p"],
                }
            );
            const paragraph = getRequiredFragmentElement(
                fragment,
                "p",
                HTMLParagraphElement
            );

            expect(paragraph.getAttribute("class")).toBe("ok");
            expect(paragraph.hasAttribute("onclick")).toBe(false);
            expect(paragraph.hasAttribute("href")).toBe(false);
            expect(fragment.querySelector("script")).toBeNull();
            expect(serializeFragment(fragment)).toBe("safekept");
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });

    it("removes disallowed tags and keeps their textContent", () => {
        expect.assertions(2);

        const html = "<div>hello<img src=x onerror=alert(1)>world</div>";
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: [
                "class",
                "id",
                "style",
            ],
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
        expect.assertions(3);

        const html = '<div id="x" onclick="alert(1)">hi</div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["id"],
            allowedTags: ["DIV"],
        });

        const container = document.createElement("div");
        container.append(fragment);

        const div = container.querySelector("div");
        expect(div).toBeInstanceOf(HTMLDivElement);
        const requiredDiv = getRequiredElement(div, "div");
        expect(requiredDiv.getAttribute("id")).toBe("x");
        expect(requiredDiv.getAttribute("onclick")).toBeNull();
    });

    it("strips href/src/xlink:href attributes defensively", () => {
        expect.assertions(3);

        const html =
            '<div><a href="https://example.com" class="c">link</a></div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["class"],
            allowedTags: ["DIV", "A"],
        });

        const container = document.createElement("div");
        container.append(fragment);

        const anchor = container.querySelector("a");
        expect(anchor).toBeInstanceOf(HTMLAnchorElement);
        const requiredAnchor = getRequiredElement(anchor, "a");
        expect(requiredAnchor.getAttribute("href")).toBeNull();
        expect(requiredAnchor.className).toBe("c");
    });

    it("removes style attributes containing url() when stripUrlInStyle is enabled", () => {
        expect.assertions(2);

        const html =
            '<div style="background-image:url(https://evil.example/x)">x</div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["style"],
            allowedTags: ["DIV"],
            stripUrlInStyle: true,
        });

        const container = document.createElement("div");
        container.append(fragment);

        const div = container.querySelector("div");
        expect(div).toBeInstanceOf(HTMLDivElement);
        expect({
            styleAttribute: div?.getAttribute("style"),
        }).toStrictEqual({
            styleAttribute: null,
        });
    });

    it("removes style attributes containing url() even when url is CSS-escaped", () => {
        expect.assertions(2);

        // u\72l == url
        const html =
            '<div style="background-image:u\\72l(https://evil.example/x)">x</div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["style"],
            allowedTags: ["DIV"],
            stripUrlInStyle: true,
        });

        const container = document.createElement("div");
        container.append(fragment);

        const div = container.querySelector("div");
        expect(div).toBeInstanceOf(HTMLDivElement);
        expect({
            styleAttribute: div?.getAttribute("style"),
        }).toStrictEqual({
            styleAttribute: null,
        });
    });

    it("removes style attributes containing @import even when escaped", () => {
        expect.assertions(2);

        // @\69mport == @import
        const html =
            '<div style="@\\69mport url(https://evil.example/x)">x</div>';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["style"],
            allowedTags: ["DIV"],
            stripUrlInStyle: true,
        });

        const container = document.createElement("div");
        container.append(fragment);

        const div = container.querySelector("div");
        expect(div).toBeInstanceOf(HTMLDivElement);
        expect({
            styleAttribute: div?.getAttribute("style"),
        }).toStrictEqual({
            styleAttribute: null,
        });
    });

    it("strips srcset defensively even when allowedAttributes includes it", () => {
        expect.assertions(3);

        const html = '<img srcset="https://evil.example/x 1x" class="c">';
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: ["class", "srcset"],
            allowedTags: ["IMG"],
        });

        const container = document.createElement("div");
        container.append(fragment);

        const img = container.querySelector("img");
        expect(img).toBeInstanceOf(HTMLImageElement);
        const requiredImg = getRequiredElement(img, "img");
        expect(requiredImg.getAttribute("srcset")).toBeNull();
        expect(requiredImg.className).toBe("c");
    });

    it("removes forbidden tags (script/style/svg) even when the caller allowlists them", () => {
        expect.assertions(6);

        const html =
            "<div>ok<script>alert(1)</script><style>body{color:red}</style><svg><circle /></svg>done</div>";
        const fragment = sanitizeHtmlAllowlist(html, {
            allowedAttributes: [
                "class",
                "id",
                "style",
            ],
            allowedTags: [
                "DIV",
                "SCRIPT",
                "STYLE",
                "SVG",
            ],
            stripUrlInStyle: true,
        });

        const container = document.createElement("div");
        container.append(fragment);

        expect(container.querySelector("script")).toBeNull();
        expect(container.querySelector("style")).toBeNull();
        expect(container.querySelector("svg")).toBeNull();

        // Ensure forbidden tag contents do not surface as visible text.
        expect(container.textContent).toBe("okdone");
        expect(container.textContent).not.toContain("alert(1)");
        expect(container.textContent).not.toContain("body{color:red}");
    });

    it("preserves style attributes when style url stripping is disabled", () => {
        expect.assertions(2);

        const globalRef = getDomPurifyGlobal();
        const previousPurifier = globalRef.DOMPurify;
        delete globalRef.DOMPurify;

        try {
            const fragment = sanitizeHtmlAllowlist(
                '<p style="background:url(https://example.test/x)">safe</p>',
                {
                    allowedAttributes: ["style"],
                    allowedTags: ["p"],
                    stripUrlInStyle: false,
                }
            );
            const paragraph = getRequiredFragmentElement(
                fragment,
                "p",
                HTMLParagraphElement
            );

            expect(paragraph.hasAttribute("style")).toBe(true);
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });

    it("uses global dompurify when available and still strips unsafe styles", () => {
        expect.assertions(5);

        const globalRef = getDomPurifyGlobal();
        const previousPurifier = globalRef.DOMPurify;
        let receivedHtml = "";
        globalRef.DOMPurify = {
            sanitize(html) {
                receivedHtml = html;
                const fragment = document.createDocumentFragment();
                const span = document.createElement("span");
                span.setAttribute(
                    "style",
                    "background:url(https://example.test/x)"
                );
                span.textContent = "purified";
                fragment.append(span);
                return fragment;
            },
        };

        try {
            const fragment = sanitizeHtmlAllowlist("<span>raw</span>", {
                allowedAttributes: ["style"],
                allowedTags: ["span"],
            });
            const span = getRequiredFragmentElement(
                fragment,
                "span",
                HTMLSpanElement
            );

            expect(receivedHtml).toBe("<span>raw</span>");
            expect(span.textContent).toBe("purified");
            expect(span.hasAttribute("style")).toBe(false);
            expect(fragment.querySelector("script")).toBeNull();
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });
});

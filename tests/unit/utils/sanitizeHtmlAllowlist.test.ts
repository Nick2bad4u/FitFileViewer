// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { sanitizeHtmlAllowlist } from "../../../electron-app/utils/dom/sanitizeHtmlAllowlist.js";

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

function serializeFragment(fragment: DocumentFragment): string {
    const host = document.createElement("div");
    host.append(fragment.cloneNode(true));
    return host.textContent ?? "";
}

describe("html allowlist sanitization", () => {
    it("removes forbidden tags and unsafe attributes in fallback mode", () => {
        expect.assertions(5);

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
            const paragraph = fragment.querySelector("p");

            expect(paragraph?.getAttribute("class")).toBe("ok");
            expect(
                paragraph?.hasAttribute("onclick") ? "present" : "missing"
            ).toBe("missing");
            expect(
                paragraph?.hasAttribute("href") ? "present" : "missing"
            ).toBe("missing");
            expect(fragment.querySelector("script")).toBeNull();
            expect(serializeFragment(fragment)).toBe("safekept");
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });

    it("rejects css url primitives including escaped spellings", () => {
        expect.assertions(2);

        const globalRef = getDomPurifyGlobal();
        const previousPurifier = globalRef.DOMPurify;
        delete globalRef.DOMPurify;
        try {
            const fragment = sanitizeHtmlAllowlist(
                String.raw`<p style="background:u\72l(https://example.test/x)">safe</p>`,
                {
                    allowedAttributes: ["style"],
                    allowedTags: ["p"],
                }
            );
            const paragraph = fragment.querySelector("p");

            expect(
                paragraph?.hasAttribute("style") ? "present" : "missing"
            ).toBe("missing");
            expect(paragraph?.textContent).toBe("safe");
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });

    it("preserves style attributes when style url stripping is disabled", () => {
        expect.assertions(1);

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

            expect(
                fragment.querySelector("p")?.hasAttribute("style")
                    ? "present"
                    : "missing"
            ).toBe("present");
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });

    it("uses global dompurify when available and still strips unsafe styles", () => {
        expect.assertions(4);

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
            const span = fragment.querySelector("span");

            expect(receivedHtml).toBe("<span>raw</span>");
            expect(span?.textContent).toBe("purified");
            expect(span?.hasAttribute("style") ? "present" : "missing").toBe(
                "missing"
            );
            expect(fragment.querySelector("script")).toBeNull();
        } finally {
            globalRef.DOMPurify = previousPurifier;
        }
    });
});

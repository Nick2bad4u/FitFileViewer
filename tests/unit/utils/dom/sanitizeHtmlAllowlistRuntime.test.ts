import { describe, expect, it } from "vitest";

import {
    getSanitizeHtmlAllowlistRuntime,
    type SanitizeHtmlAllowlistRuntimeScope,
} from "../../../../electron-app/utils/dom/sanitizeHtmlAllowlistRuntime.js";

describe("getSanitizeHtmlAllowlistRuntime", () => {
    it("creates and walks sanitizer DOM nodes through injected providers", () => {
        expect.assertions(7);

        const documentRef =
            document.implementation.createHTMLDocument("sanitize allowlist");
        const runtime = getSanitizeHtmlAllowlistRuntime({
            getDocument: () => documentRef,
            getDOMParser: () => DOMParser,
            getElement: () => Element,
            getNodeFilter: () => NodeFilter,
        });
        const fragment = runtime.createDocumentFragment();
        const parsed = runtime
            .createDomParser()
            .parseFromString(
                "<section><span>safe</span></section>",
                "text/html"
            );
        const text = runtime.createTextNode("fallback");
        const element = documentRef.createElement("div");

        fragment.append(element, text);
        const walker = runtime.createElementTreeWalker(parsed.body);
        const walkedElements: string[] = [];
        while (walker.nextNode()) {
            if (runtime.isElement(walker.currentNode)) {
                walkedElements.push(walker.currentNode.tagName.toLowerCase());
            }
        }

        expect(fragment).toBeInstanceOf(DocumentFragment);
        expect(text.textContent).toBe("fallback");
        expect(fragment.childNodes).toHaveLength(2);
        expect(runtime.isElement(element)).toBe(true);
        expect(runtime.isElement(text)).toBe(false);
        expect(walkedElements).toStrictEqual(["section", "span"]);
        expect(parsed.body.textContent).toBe("safe");
    });

    it("fails clearly when required browser primitives are unavailable", () => {
        expect.assertions(6);

        const documentRef = document.implementation.createHTMLDocument();
        const runtime = getSanitizeHtmlAllowlistRuntime({});
        const documentOnlyRuntime = getSanitizeHtmlAllowlistRuntime({
            getDocument: () => documentRef,
        });

        expect(runtime.createDocumentFragment).toThrow(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
        expect(runtime.createDomParser).toThrow(
            "sanitizeHtmlAllowlist requires a DOMParser runtime"
        );
        expect(() =>
            runtime.createElementTreeWalker(document.createDocumentFragment())
        ).toThrow("sanitizeHtmlAllowlist requires a document runtime");
        expect(() => runtime.createTextNode("fallback")).toThrow(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
        expect(() =>
            documentOnlyRuntime.createElementTreeWalker(
                documentRef.createDocumentFragment()
            )
        ).toThrow("sanitizeHtmlAllowlist requires a NodeFilter runtime");
        expect(runtime.isElement(document.createElement("div"))).toBe(false);
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(5);

        const documentRef = document.implementation.createHTMLDocument();
        const runtime = getSanitizeHtmlAllowlistRuntime({
            document: documentRef,
            DOMParser,
            Element,
            NodeFilter,
        } as unknown as SanitizeHtmlAllowlistRuntimeScope);

        expect(runtime.createDocumentFragment).toThrow(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
        expect(runtime.createDomParser).toThrow(
            "sanitizeHtmlAllowlist requires a DOMParser runtime"
        );
        expect(() =>
            runtime.createElementTreeWalker(
                documentRef.createDocumentFragment()
            )
        ).toThrow("sanitizeHtmlAllowlist requires a document runtime");
        expect(() => runtime.createTextNode("fallback")).toThrow(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
        expect(runtime.isElement(document.createElement("div"))).toBe(false);
    });
});

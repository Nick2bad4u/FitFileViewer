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

    it("creates sanitizer DOM values through default browser providers", () => {
        expect.assertions(6);

        const runtime = getSanitizeHtmlAllowlistRuntime();
        const fragment = runtime.createDocumentFragment();
        const parsed = runtime
            .createDomParser()
            .parseFromString("<main><strong>safe</strong></main>", "text/html");
        const text = runtime.createTextNode("fallback");

        fragment.append(text);
        const walker = runtime.createElementTreeWalker(parsed.body);

        expect(fragment).toBeInstanceOf(DocumentFragment);
        expect(text.textContent).toBe("fallback");
        expect(runtime.isElement(parsed.body)).toBe(true);
        expect(walker.nextNode()).toBe(parsed.querySelector("main"));
        expect(walker.nextNode()).toBe(parsed.querySelector("strong"));
        expect(parsed.body.textContent).toBe("safe");
    });

    it("fails clearly when required browser primitives are unavailable", () => {
        expect.assertions(5);

        const documentRef = document.implementation.createHTMLDocument();
        const documentOnlyRuntime = getSanitizeHtmlAllowlistRuntime({
            getDocument: () => documentRef,
            getDOMParser: () => undefined,
            getElement: () => undefined,
            getNodeFilter: () => undefined,
        });
        const unavailableRuntime = getSanitizeHtmlAllowlistRuntime({
            getDocument: () => undefined,
            getDOMParser: () => undefined,
            getElement: () => undefined,
            getNodeFilter: () => undefined,
        });

        expect(unavailableRuntime.createDocumentFragment).toThrow(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
        expect(unavailableRuntime.createDomParser).toThrow(
            "sanitizeHtmlAllowlist requires a DOMParser runtime"
        );
        expect(() =>
            unavailableRuntime.createElementTreeWalker(
                document.createDocumentFragment()
            )
        ).toThrow("sanitizeHtmlAllowlist requires a document runtime");
        expect(() => unavailableRuntime.createTextNode("fallback")).toThrow(
            "sanitizeHtmlAllowlist requires a document runtime"
        );
        expect(() =>
            documentOnlyRuntime.createElementTreeWalker(
                documentRef.createDocumentFragment()
            )
        ).toThrow("sanitizeHtmlAllowlist requires a NodeFilter runtime");
    });

    it("fails clearly when explicit scopes omit provider functions", () => {
        expect.assertions(5);

        const documentRef = document.implementation.createHTMLDocument();
        const runtime = getSanitizeHtmlAllowlistRuntime(
            {} as unknown as SanitizeHtmlAllowlistRuntimeScope
        );

        expect(runtime.createDocumentFragment).toThrow(
            "sanitizeHtmlAllowlist requires a document provider"
        );
        expect(runtime.createDomParser).toThrow(
            "sanitizeHtmlAllowlist requires a DOMParser provider"
        );
        expect(() =>
            runtime.createElementTreeWalker(
                documentRef.createDocumentFragment()
            )
        ).toThrow("sanitizeHtmlAllowlist requires a document provider");
        expect(() => runtime.createTextNode("fallback")).toThrow(
            "sanitizeHtmlAllowlist requires a document provider"
        );
        expect(() => runtime.isElement(document.createElement("div"))).toThrow(
            "sanitizeHtmlAllowlist requires an Element provider"
        );
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
            "sanitizeHtmlAllowlist requires a document provider"
        );
        expect(runtime.createDomParser).toThrow(
            "sanitizeHtmlAllowlist requires a DOMParser provider"
        );
        expect(() =>
            runtime.createElementTreeWalker(
                documentRef.createDocumentFragment()
            )
        ).toThrow("sanitizeHtmlAllowlist requires a document provider");
        expect(() => runtime.createTextNode("fallback")).toThrow(
            "sanitizeHtmlAllowlist requires a document provider"
        );
        expect(() => runtime.isElement(document.createElement("div"))).toThrow(
            "sanitizeHtmlAllowlist requires an Element provider"
        );
    });
});

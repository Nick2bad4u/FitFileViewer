import { describe, expect, it, vi } from "vitest";

import {
    getGetActiveTabContentRuntime,
    type GetActiveTabContentRuntimeScope,
} from "../../../../../electron-app/utils/rendering/helpers/getActiveTabContentRuntime.js";

describe("getGetActiveTabContentRuntime", () => {
    const unavailableGetActiveTabContentRuntimeScope = {
        getDocument: () => undefined,
    } satisfies GetActiveTabContentRuntimeScope;

    it("queries active-tab DOM through the injected document provider", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("active tab content");
        const content = documentRef.createElement("section");
        const activeContent = documentRef.createElement("section");
        const activeButton = documentRef.createElement("button");
        content.className = "tab-content";
        activeContent.className = "tab-content active";
        activeContent.id = "content_summary";
        activeButton.className = "tab-button active";
        activeButton.id = "tab-summary";
        documentRef.body.append(content, activeContent, activeButton);
        const runtime = getGetActiveTabContentRuntime({
            getDocument: () => documentRef,
        });

        expect(runtime.queryTabContents(".tab-content")).toHaveLength(2);
        expect(runtime.querySelector(".tab-content.active")).toBe(
            activeContent
        );
        expect(
            runtime.querySelector<HTMLButtonElement>(".tab-button.active")
        ).toBe(activeButton);
        expect(runtime.getElementByIdFlexible("content-summary")).toBe(
            activeContent
        );
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(3);

        const runtime = getGetActiveTabContentRuntime(
            unavailableGetActiveTabContentRuntimeScope
        );

        expect(() => runtime.queryTabContents(".tab-content")).toThrow(
            "getActiveTabContent requires a document runtime"
        );
        expect(() => runtime.querySelector(".tab-content.active")).toThrow(
            "getActiveTabContent requires a document runtime"
        );
        expect(() => runtime.getElementByIdFlexible("content-summary")).toThrow(
            "getActiveTabContent requires a document runtime"
        );
    });

    it("fails clearly when explicit scopes omit the document provider", () => {
        expect.assertions(3);

        const runtime = getGetActiveTabContentRuntime(
            {} as unknown as GetActiveTabContentRuntimeScope
        );

        expect(() => runtime.queryTabContents(".tab-content")).toThrow(
            "getActiveTabContent requires a document provider"
        );
        expect(() => runtime.querySelector(".tab-content.active")).toThrow(
            "getActiveTabContent requires a document provider"
        );
        expect(() => runtime.getElementByIdFlexible("content-summary")).toThrow(
            "getActiveTabContent requires a document provider"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const querySelector = vi.fn<Document["querySelector"]>();
        const querySelectorAll = vi.fn<Document["querySelectorAll"]>();
        const runtime = getGetActiveTabContentRuntime({
            ...unavailableGetActiveTabContentRuntimeScope,
            document: {
                querySelector,
                querySelectorAll,
            },
        } as unknown as GetActiveTabContentRuntimeScope);

        expect(() => runtime.queryTabContents(".tab-content")).toThrow(
            "getActiveTabContent requires a document runtime"
        );
        expect(() => runtime.querySelector(".tab-content.active")).toThrow(
            "getActiveTabContent requires a document runtime"
        );
        expect(querySelector).not.toHaveBeenCalled();
        expect(querySelectorAll).not.toHaveBeenCalled();
    });
});

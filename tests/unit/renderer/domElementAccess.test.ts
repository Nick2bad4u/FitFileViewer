import { afterEach, describe, expect, it, vi } from "vitest";

import { createRendererDomAccess } from "../../../electron-app/renderer/domElementAccess.js";

function appendRequiredElement(id: string, tagName = "div"): HTMLElement {
    const element = document.createElement(tagName);
    element.id = id;
    document.body.append(element);
    return element;
}

describe("renderer DOM element access", () => {
    afterEach(() => {
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("resolves renderer startup controls through focused accessors", () => {
        expect.assertions(2);

        const fileInput = appendRequiredElement(
            "fileInput",
            "input"
        ) as HTMLInputElement;
        const openFileButton = appendRequiredElement("openFileBtn", "button");
        const utils = createRendererDomAccess({
            documentTarget: document,
            logRenderer: vi.fn(),
        });

        expect(utils.getFileInput()).toBe(fileInput);
        expect(utils.getOpenFileButton()).toBe(openFileButton);
    });

    it("validates the required renderer DOM elements", () => {
        expect.assertions(2);

        for (const id of [
            "fileInput",
            "openFileBtn",
            "notification",
            "loadingOverlay",
        ]) {
            appendRequiredElement(id);
        }
        const logRenderer = vi.fn();
        const utils = createRendererDomAccess({
            documentTarget: document,
            logRenderer,
        });

        expect(utils.validateDOMElements()).toBe(true);
        expect(logRenderer).not.toHaveBeenCalledWith(
            "error",
            expect.any(String)
        );
    });
});

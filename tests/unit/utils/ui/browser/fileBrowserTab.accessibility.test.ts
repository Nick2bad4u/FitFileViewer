import { afterEach, describe, expect, it } from "vitest";

import { renderFileBrowserTab } from "../../../../../electron-app/utils/ui/browser/fileBrowserTab.js";

type BrowserTabTestGlobal = typeof globalThis & {
    electronAPI?: unknown;
};

function getTestGlobal(): BrowserTabTestGlobal {
    return globalThis as BrowserTabTestGlobal;
}

function getRequiredElement<T extends Element>(
    selector: string,
    constructor: { new (): T }
): T {
    const element = document.querySelector(selector);
    expect(element).toBeInstanceOf(constructor);
    return element as T;
}

afterEach(() => {
    document.body.replaceChildren();
    delete getTestGlobal().electronAPI;
});

describe("fileBrowserTab accessibility", () => {
    it("renders the Browser view switcher as a segmented button group", async () => {
        expect.assertions(12);

        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        await renderFileBrowserTab();

        const group = getRequiredElement(
            ".file-browser__segmented",
            HTMLDivElement
        );
        const filesButton = getRequiredElement(
            "#fit-browser-view-files",
            HTMLButtonElement
        );
        const libraryButton = getRequiredElement(
            "#fit-browser-view-library",
            HTMLButtonElement
        );
        const calendarButton = getRequiredElement(
            "#fit-browser-view-calendar",
            HTMLButtonElement
        );

        expect(group.getAttribute("role")).toBe("group");
        expect(group.getAttribute("aria-label")).toBe("Browser view");
        expect(filesButton.getAttribute("aria-pressed")).toBe("true");
        expect(libraryButton.getAttribute("aria-pressed")).toBe("false");
        expect(calendarButton.getAttribute("aria-pressed")).toBe("false");
        expect(filesButton.hasAttribute("aria-selected")).toBe(false);
        expect(libraryButton.hasAttribute("aria-selected")).toBe(false);
        expect(calendarButton.hasAttribute("aria-selected")).toBe(false);
    });
});

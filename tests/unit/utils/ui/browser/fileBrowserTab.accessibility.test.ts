import { afterEach, describe, expect, it } from "vitest";

import { renderFileBrowserTab } from "../../../../../electron-app/utils/ui/browser/fileBrowserTab.js";
import {
    __resetStateManagerForTests,
    getState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    registerRendererElectronApiCandidate,
    resetRendererElectronApiCandidate,
} from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

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
    resetRendererElectronApiCandidate();
    __resetStateManagerForTests();
});

describe("fileBrowserTab accessibility", () => {
    it("renders the Browser view switcher as a segmented button group", async () => {
        expect.assertions(15);

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

        const status = getRequiredElement(
            "#fit-browser-status",
            HTMLDivElement
        );
        expect(status.getAttribute("role")).toBe("status");
        expect(status.getAttribute("aria-live")).toBe("polite");
    });

    it("shows a loaded folder status after the files view refreshes", async () => {
        expect.assertions(3);

        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        registerRendererElectronApiCandidate({
            getFitBrowserFolder: async () => "C:\\rides",
            listFitBrowserFolder: async () => ({
                entries: [
                    {
                        fullPath: "C:\\rides\\2026",
                        kind: "dir",
                        name: "2026",
                        relPath: "2026",
                    },
                    {
                        fullPath: "C:\\rides\\old.fit",
                        kind: "file",
                        name: "old.fit",
                        relPath: "old.fit",
                    },
                ],
                relPath: "",
                root: "C:\\rides",
            }),
        });

        await renderFileBrowserTab();

        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\rides");
        expect(
            document.querySelector("#fit-browser-status")?.textContent
        ).toMatch(/^Loaded 2 items from root .* \(1 file, 1 folder\)\.$/u);
        expect(getState("browser.listing")).toStrictEqual({
            error: null,
            fileCount: 1,
            folderCount: 1,
            itemCount: 2,
            loadedAt: expect.any(Number),
            relPath: "",
            root: "C:\\rides",
            status: "loaded",
        });
    });
});

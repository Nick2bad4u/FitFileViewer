import { afterEach, describe, expect, it, vi } from "vitest";

import { renderFileBrowserTab } from "../../../../../electron-app/utils/ui/browser/fileBrowserTab.js";
import { __resetStateManagerForTests } from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getBrowserListingState,
    getBrowserScanState,
    getBrowserView,
} from "../../../../../electron-app/utils/state/domain/browserState.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
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

        const electronApiScope = createElectronApiScope({
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

        await renderFileBrowserTab({ electronApiScope });

        const listingState = getBrowserListingState();
        const loadedAtText = new Date(
            listingState.loadedAt ?? Number.NaN
        ).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\rides");
        expect(document.querySelector("#fit-browser-status")?.textContent).toBe(
            `Loaded 2 items from root at ${loadedAtText} (1 file, 1 folder).`
        );
        expect(listingState).toStrictEqual({
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

    it("records folder scan progress in explicit Browser state", async () => {
        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        const electronApiScope = createElectronApiScope({
            decodeFitFile: async () => ({
                sessionMesgs: [
                    {
                        sport: "cycling",
                        start_time: "2026-01-02T03:04:05.000Z",
                        total_distance: 1234,
                    },
                ],
            }),
            getFitBrowserFolder: async () => "C:\\rides",
            listFitBrowserFolder: async () => ({
                entries: [
                    {
                        fullPath: "C:\\rides\\activity.fit",
                        kind: "file",
                        name: "activity.fit",
                        relPath: "activity.fit",
                    },
                ],
                relPath: "",
                root: "C:\\rides",
            }),
            readFile: async () => new ArrayBuffer(4),
        });

        await renderFileBrowserTab({ electronApiScope });
        getRequiredElement(
            "#fit-browser-view-library",
            HTMLButtonElement
        ).click();

        await vi.waitFor(() => {
            expect(getBrowserView()).toBe("library");
        });

        getRequiredElement("#fit-library-scan", HTMLButtonElement).click();

        await vi.waitFor(() => {
            expect(getBrowserScanState()).toStrictEqual({
                decodedActivityCount: 1,
                error: null,
                fileCount: 1,
                processedFileCount: 1,
                root: "C:\\rides",
                scannedAt: expect.any(Number),
                status: "completed",
            });
        });

        expect(
            document.querySelector("#fit-browser-status")?.textContent
        ).toMatch(/^Decoded 1 activity from this folder at/u);
        expect(
            document.querySelector("#fit-library-status")?.textContent
        ).toContain("Scanned");
        expect(
            document.querySelector("#fit-library-cards")?.textContent
        ).toContain("Files1");
    });
});

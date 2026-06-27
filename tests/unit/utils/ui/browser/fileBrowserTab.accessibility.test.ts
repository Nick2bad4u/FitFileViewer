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

function createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
} {
    let resolveDeferred: (value: T) => void = () => {};
    const promise = new Promise<T>((resolve) => {
        resolveDeferred = resolve;
    });

    return {
        promise,
        resolve: resolveDeferred,
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

    it("rejects malformed Browser Electron API methods", async () => {
        expect.assertions(3);

        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        const electronApiScope = createElectronApiScope({
            getFitBrowserFolder: "not a folder getter",
            listFitBrowserFolder: async () => ({
                entries: [],
                relPath: "",
                root: "C:\\rides",
            }),
        });

        await renderFileBrowserTab({ electronApiScope });

        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("Browser unavailable (Electron API missing)");
        expect(document.querySelector("#fit-browser-status")?.textContent).toBe(
            "Browser unavailable."
        );
        expect(getBrowserListingState()).toMatchObject({
            error: "Electron Browser API is unavailable.",
            status: "error",
        });
    });

    it("uses the latest scoped Electron API after rerendering the Browser tab", async () => {
        expect.assertions(4);

        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        const firstOpenFolderDialog = vi.fn<() => Promise<string | null>>(
            async () => "C:\\first"
        );
        const secondOpenFolderDialog = vi.fn<() => Promise<string | null>>(
            async () => "C:\\second"
        );
        const createApi = (
            openFolderDialog: typeof firstOpenFolderDialog,
            root: string
        ) => ({
            getFitBrowserFolder: async () => root,
            listFitBrowserFolder: async () => ({
                entries: [],
                relPath: "",
                root,
            }),
            openFolderDialog,
        });

        await renderFileBrowserTab({
            electronApiScope: createElectronApiScope(
                createApi(firstOpenFolderDialog, "C:\\first")
            ),
        });
        await renderFileBrowserTab({
            electronApiScope: createElectronApiScope(
                createApi(secondOpenFolderDialog, "C:\\second")
            ),
        });

        getRequiredElement(
            "#fit-browser-pick-folder",
            HTMLButtonElement
        ).click();

        await vi.waitFor(() => {
            expect(secondOpenFolderDialog).toHaveBeenCalledOnce();
        });
        expect(firstOpenFolderDialog).not.toHaveBeenCalled();
        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\second");
    });

    it("ignores stale folder listing refreshes after a newer Browser render wins", async () => {
        expect.assertions(7);

        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        const firstRoot = createDeferred<string>();
        const firstGetFitBrowserFolder = vi.fn<() => Promise<string>>(
            () => firstRoot.promise
        );
        const firstListFitBrowserFolder = vi.fn();

        const view = renderFileBrowserTab({
            electronApiScope: createElectronApiScope({
                getFitBrowserFolder: firstGetFitBrowserFolder,
                listFitBrowserFolder: firstListFitBrowserFolder,
            }),
        });

        await vi.waitFor(() => {
            expect(firstGetFitBrowserFolder).toHaveBeenCalledOnce();
        });

        await renderFileBrowserTab({
            electronApiScope: createElectronApiScope({
                getFitBrowserFolder: async () => "C:\\new",
                listFitBrowserFolder: async () => ({
                    entries: [
                        {
                            fullPath: "C:\\new\\new.fit",
                            kind: "file",
                            name: "new.fit",
                            relPath: "new.fit",
                        },
                    ],
                    relPath: "",
                    root: "C:\\new",
                }),
            }),
        });

        const loadedState = getBrowserListingState();
        const loadedAtText = new Date(
            loadedState.loadedAt ?? Number.NaN
        ).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\new");
        expect(document.querySelector("#fit-browser-status")?.textContent).toBe(
            `Loaded 1 item from root at ${loadedAtText} (1 file, 0 folders).`
        );

        firstRoot.resolve("C:\\old");
        await view;

        expect(firstListFitBrowserFolder).not.toHaveBeenCalled();
        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\new");
        expect(document.querySelector("#fit-browser-status")?.textContent).toBe(
            `Loaded 1 item from root at ${loadedAtText} (1 file, 0 folders).`
        );
        expect(getBrowserListingState()).toStrictEqual(loadedState);
    });

    it("ignores stale in-flight folder listing responses", async () => {
        expect.assertions(9);

        const container = document.createElement("div");
        container.id = "content_browser";
        document.body.append(container);

        const firstListing = createDeferred<{
            entries: {
                fullPath: string;
                kind: "file";
                name: string;
                relPath: string;
            }[];
            relPath: string;
            root: string;
        }>();
        const firstListFitBrowserFolder = vi.fn(() => firstListing.promise);

        const view = renderFileBrowserTab({
            electronApiScope: createElectronApiScope({
                getFitBrowserFolder: async () => "C:\\old",
                listFitBrowserFolder: firstListFitBrowserFolder,
            }),
        });

        await vi.waitFor(() => {
            expect(firstListFitBrowserFolder).toHaveBeenCalledWith("");
        });

        await renderFileBrowserTab({
            electronApiScope: createElectronApiScope({
                getFitBrowserFolder: async () => "C:\\new",
                listFitBrowserFolder: async () => ({
                    entries: [
                        {
                            fullPath: "C:\\new\\new.fit",
                            kind: "file",
                            name: "new.fit",
                            relPath: "new.fit",
                        },
                    ],
                    relPath: "",
                    root: "C:\\new",
                }),
            }),
        });

        const loadedState = getBrowserListingState();
        const loadedAtText = new Date(
            loadedState.loadedAt ?? Number.NaN
        ).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\new");
        expect(document.querySelector("#fit-browser-status")?.textContent).toBe(
            `Loaded 1 item from root at ${loadedAtText} (1 file, 0 folders).`
        );

        firstListing.resolve({
            entries: [
                {
                    fullPath: "C:\\old\\old.fit",
                    kind: "file",
                    name: "old.fit",
                    relPath: "old.fit",
                },
            ],
            relPath: "",
            root: "C:\\old",
        });
        await view;

        expect(firstListFitBrowserFolder).toHaveBeenCalledOnce();
        expect(
            document.querySelector("#fit-browser-current-path")?.textContent
        ).toBe("C:\\new");
        expect(document.querySelector("#fit-browser-status")?.textContent).toBe(
            `Loaded 1 item from root at ${loadedAtText} (1 file, 0 folders).`
        );
        expect(document.querySelector("#fit-browser-list")?.textContent).toBe(
            "new.fit"
        );
        expect(getBrowserListingState()).toStrictEqual(loadedState);
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

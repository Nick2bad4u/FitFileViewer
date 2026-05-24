import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupListeners } from "../../../../utils/app/events.js";

const keyboardShortcutsModalMock = vi.hoisted(() => ({
    showKeyboardShortcutsModal: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../utils/ui/modals/keyboardShortcutsModal.js"),
    () => ({
        showKeyboardShortcutsModal:
            keyboardShortcutsModalMock.showKeyboardShortcutsModal,
    })
);

type TestGlobals = typeof globalThis & {
    electronAPI?: any;
    showFitData?: ReturnType<typeof vi.fn>;
    sendFitFileToAltFitReader?: ReturnType<typeof vi.fn>;
    copyTableAsCSV?: ReturnType<typeof vi.fn>;
    ChartUpdater?: { updateCharts: ReturnType<typeof vi.fn> };
    globalData?: any;
    loadedFitFiles?: any;
    showKeyboardShortcutsModal?: ReturnType<typeof vi.fn>;
};

const globalAny = globalThis as TestGlobals;

function requireElement<T extends Element>(
    element: T | null,
    label: string
): T {
    if (element === null) {
        throw new Error(`${label} was not rendered`);
    }

    return element;
}

function requireHandler<T extends (...args: any[]) => unknown>(
    handler: T | null | undefined,
    channel: string
): T {
    if (typeof handler !== "function") {
        throw new TypeError(`${channel} handler was not registered`);
    }

    return handler;
}

describe("setupListeners", () => {
    let openButton: HTMLButtonElement;
    let isOpeningFileRef: { current: boolean };
    let setLoading: ReturnType<typeof vi.fn>;
    let showNotification: ReturnType<typeof vi.fn>;
    let handleOpenFile: ReturnType<typeof vi.fn>;
    let showUpdateNotification: ReturnType<typeof vi.fn>;
    let showAboutModal: ReturnType<typeof vi.fn>;
    let electronAPI: any;
    let ipcHandlers: Map<string, (...args: any[]) => unknown>;
    let menuOpenHandler: ((...args: any[]) => unknown) | null;
    let recentOpenHandler: ((...args: any[]) => unknown) | null;
    let updateHandlers: Map<string, (...args: any[]) => unknown>;

    beforeEach(() => {
        vi.useRealTimers();
        const open = document.createElement("button");
        open.id = "open";
        open.textContent = "Open";
        const contentSummary = document.createElement("div");
        contentSummary.id = "content-summary";
        document.body.replaceChildren(open, contentSummary);
        openButton = document.getElementById("open") as HTMLButtonElement;
        isOpeningFileRef = { current: false };
        setLoading = vi.fn();
        showNotification = vi.fn();
        handleOpenFile = vi.fn();
        showUpdateNotification = vi.fn();
        showAboutModal = vi.fn();
        ipcHandlers = new Map();
        updateHandlers = new Map();
        menuOpenHandler = null;
        recentOpenHandler = null;

        electronAPI = {
            onIpc: vi.fn(
                (channel: string, handler: (...args: any[]) => unknown) => {
                    ipcHandlers.set(channel, handler);
                    return () => ipcHandlers.delete(channel);
                }
            ),
            send: vi.fn(),
            recentFiles: vi.fn(),
            readFile: vi.fn(),
            parseFitFile: vi.fn(),
            addRecentFile: vi.fn(),
            onMenuOpenFile: vi.fn((handler) => {
                menuOpenHandler = handler;
            }),
            onOpenRecentFile: vi.fn((handler) => {
                recentOpenHandler = handler;
            }),
            onUpdateEvent: vi.fn(
                (event: string, handler: (...args: any[]) => unknown) => {
                    updateHandlers.set(event, handler);
                }
            ),
        };

        delete (globalAny as { __ffvMenuForwardRegistry?: Set<string> })
            .__ffvMenuForwardRegistry;
        globalAny.electronAPI = electronAPI;
        globalAny.showFitData = vi.fn();
        globalAny.sendFitFileToAltFitReader = vi.fn();
        globalAny.copyTableAsCSV = vi.fn();
        globalAny.ChartUpdater = { updateCharts: vi.fn() };
        globalAny.globalData = { recordMesgs: [] };
        keyboardShortcutsModalMock.showKeyboardShortcutsModal.mockReset();
        globalAny.loadedFitFiles = [];

        setupListeners({
            openFileBtn: openButton,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        document.body.replaceChildren();
        globalAny.electronAPI = undefined;
        delete globalAny.showFitData;
        delete globalAny.sendFitFileToAltFitReader;
        delete globalAny.copyTableAsCSV;
        delete globalAny.ChartUpdater;
        delete globalAny.globalData;
        delete globalAny.loadedFitFiles;
        delete globalAny.showKeyboardShortcutsModal;
    });

    it("delegates open file clicks to the provided handler", () => {
        handleOpenFile.mockImplementationOnce(({ openFileBtn }) => {
            openFileBtn.dataset.openHandled = "true";
        });
        const clickEvent = new MouseEvent("click", { cancelable: true });

        const dispatchResult = openButton.dispatchEvent(clickEvent);

        expect(dispatchResult).toBe(true);
        expect(openButton.dataset.openHandled).toBe("true");
        expect(handleOpenFile).toHaveBeenCalledOnce();
        expect(handleOpenFile).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpeningFileRef,
                openFileBtn: openButton,
            })
        );
    });

    it("shows info notification when no recent files exist", async () => {
        electronAPI.recentFiles.mockResolvedValueOnce([]);
        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
        });
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        expect(event.defaultPrevented).toBe(true);
        expect(
            document.body.querySelectorAll("#recent-files-menu")
        ).toHaveLength(0);
        expect(showNotification).toHaveBeenCalledWith(
            "No recent files found.",
            "info",
            2000
        );
    });

    it("loads and opens a recent file from the context menu", async () => {
        electronAPI.recentFiles.mockResolvedValueOnce(["C:/rides/demo.fit"]);
        const arrayBuffer = new ArrayBuffer(16);
        electronAPI.readFile.mockResolvedValueOnce(arrayBuffer);
        electronAPI.parseFitFile.mockResolvedValueOnce({
            recordMesgs: [{ speed: 10 }],
        });
        electronAPI.addRecentFile.mockResolvedValueOnce(undefined);

        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
        });
        await openButton.dispatchEvent(event);
        await Promise.resolve();

        const menu = requireElement(
            document.getElementById("recent-files-menu"),
            "Recent files menu"
        );
        expect(menu.getAttribute("role")).toBe("menu");
        expect(menu.getAttribute("aria-label")).toBe("Recent files");
        const menuItem = requireElement(
            menu.querySelector<HTMLDivElement>("div"),
            "Recent file menu item"
        );
        expect(menuItem.textContent).toBe("rides\\demo.fit");
        expect(menuItem.title).toBe("C:/rides/demo.fit");
        expect(menuItem.getAttribute("role")).toBe("menuitem");

        // Canonical recent-file menu items are wired via addEventListener("click", async ...)
        // rather than assigning onclick.
        menuItem.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
        );

        // Wait a tick for the async click handler to finish.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setLoading).toHaveBeenCalledWith(true);
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(openButton.disabled).toBe(false);
        expect(globalAny.showFitData).toHaveBeenCalledWith(
            expect.anything(),
            "C:/rides/demo.fit"
        );
        expect(electronAPI.addRecentFile).toHaveBeenCalledWith(
            "C:/rides/demo.fit"
        );
    });

    it("supports keyboard navigation and outside interactions in the recent files menu", async () => {
        vi.useFakeTimers();
        electronAPI.recentFiles.mockResolvedValueOnce([
            "C:/rides/a.fit",
            "C:/rides/b.fit",
        ]);

        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
        });
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        vi.runAllTimers();

        const menu = requireElement(
            document.getElementById("recent-files-menu"),
            "Recent files menu"
        );
        expect(menu.id).toBe("recent-files-menu");
        const items = Array.from(menu.querySelectorAll<HTMLDivElement>("div"));
        expect(items).toHaveLength(2);
        const firstItem = items[0];
        const secondItem = items[1];
        const firstClick = vi
            .spyOn(firstItem, "click")
            .mockImplementation(() => {});
        const secondClick = vi
            .spyOn(secondItem, "click")
            .mockImplementation(() => {});

        menu.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
        );
        expect(secondItem.style.background).toBe("var(--color-glass-border)");
        expect(document.activeElement).toBe(secondItem);
        menu.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })
        );
        expect(secondItem.style.background).toBe("transparent");
        expect(document.activeElement).toBe(firstItem);
        menu.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
        );
        expect(firstClick).toHaveBeenCalledOnce();

        menu.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
        );
        expect(
            document.body.querySelectorAll("#recent-files-menu")
        ).toHaveLength(0);

        electronAPI.recentFiles.mockResolvedValueOnce(["C:/rides/a.fit"]);
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        vi.runAllTimers();
        const reopenedMenu = requireElement(
            document.getElementById("recent-files-menu"),
            "Reopened recent files menu"
        );
        expect(reopenedMenu.textContent).toBe("rides\\a.fit");
        document.body.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true })
        );
        expect(document.body.contains(reopenedMenu)).toBe(false);
        vi.useRealTimers();

        // prevent unused variable warning for secondClick mock
        expect(secondClick).not.toHaveBeenCalled();
    });

    it("handles menu forwarders by relaying to send", () => {
        const saveAsHandler = requireHandler(
            ipcHandlers.get("menu-save-as"),
            "menu-save-as"
        );
        expect(ipcHandlers.has("menu-save-as")).toBe(true);
        saveAsHandler({}, undefined);
        expect(electronAPI.send).toHaveBeenCalledWith("menu-save-as");

        const exportHandler = requireHandler(
            ipcHandlers.get("menu-export"),
            "menu-export"
        );
        expect(ipcHandlers.has("menu-export")).toBe(true);
        exportHandler({}, undefined);
        expect(electronAPI.send).toHaveBeenCalledWith("menu-export");
    });

    it("responds to menu open recent file requests", async () => {
        const handler = requireHandler(recentOpenHandler, "open recent file");
        electronAPI.readFile.mockResolvedValueOnce(new ArrayBuffer(8));
        electronAPI.parseFitFile.mockResolvedValueOnce({ recordMesgs: [] });
        await handler("C:/rides/other.fit");
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(openButton.disabled).toBe(false);
        expect(globalAny.showFitData).toHaveBeenCalledWith(
            { recordMesgs: [] },
            "C:/rides/other.fit"
        );
    });

    it("exports CSV files using copyTableAsCSV", async () => {
        vi.useFakeTimers();
        const csv = "header\nvalue";
        globalAny.copyTableAsCSV = vi.fn(() => csv);
        const summaryContainer = requireElement(
            document.getElementById("content-summary"),
            "Content summary"
        );
        expect(summaryContainer.id).toBe("content-summary");
        electronAPI.recentFiles.mockResolvedValue([]);

        const createObjectURLSpy = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:ffv");
        const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

        const exportHandler = requireHandler(
            ipcHandlers.get("export-file"),
            "export-file"
        );
        await exportHandler(undefined, "export.csv");

        expect(globalAny.copyTableAsCSV).toHaveBeenCalledWith({
            container: summaryContainer,
            data: globalAny.globalData,
        });
        expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
        const anchor = requireElement(
            document.body.querySelector<HTMLAnchorElement>(
                'a[download="export.csv"]'
            ),
            "CSV download anchor"
        );
        expect(anchor.href).toBe("blob:ffv");
        vi.runAllTimers();
        expect(revokeSpy).toHaveBeenCalledWith("blob:ffv");
        expect(
            document.body.querySelectorAll('a[download="export.csv"]')
        ).toHaveLength(0);
        vi.useRealTimers();
    });

    it("warns when GPX export has no data", async () => {
        const exportHandler = requireHandler(
            ipcHandlers.get("export-file"),
            "export-file"
        );
        globalAny.globalData = { recordMesgs: [] };
        await exportHandler(undefined, "activity.gpx");
        expect(showNotification).toHaveBeenCalledWith(
            "No data available for GPX export.",
            "info",
            3000
        );
        expect(
            document.body.querySelectorAll('a[download$=".gpx"]')
        ).toHaveLength(0);
    });

    it("builds GPX export when records exist", async () => {
        vi.useFakeTimers();
        const exportHandler = requireHandler(
            ipcHandlers.get("export-file"),
            "export-file"
        );
        globalAny.globalData = {
            recordMesgs: [
                {
                    positionLat: 1000,
                    positionLong: 1000,
                    timestamp: 10,
                    enhancedAltitude: 5,
                },
            ],
        };
        globalAny.loadedFitFiles = [{ displayName: "Demo Ride" }];

        const createObjectURLSpy = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:gpx");
        const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

        await exportHandler(undefined, "activity.gpx");
        expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
        const anchor = requireElement(
            document.body.querySelector<HTMLAnchorElement>("a[download]"),
            "GPX download anchor"
        );
        expect(anchor?.download.endsWith(".gpx")).toBe(true);
        expect(anchor.download).toBe("activity.gpx");
        expect(anchor.href).toBe("blob:gpx");
        vi.runAllTimers();
        expect(revokeSpy).toHaveBeenCalledWith("blob:gpx");
        expect(
            document.body.querySelectorAll('a[download="activity.gpx"]')
        ).toHaveLength(0);
        vi.useRealTimers();
    });

    it("shows update notifications for auto-updater events", () => {
        const events = [
            "update-checking",
            "update-available",
            "update-not-available",
            "update-error",
            "update-download-progress",
            "update-downloaded",
        ];
        for (const event of events) {
            const handler = requireHandler(updateHandlers.get(event), event);
            expect(updateHandlers.has(event)).toBe(true);
            handler(
                event === "update-download-progress" ? { percent: 42.2 } : "err"
            );
        }
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Checking for updates...",
            "info",
            3000
        );
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update available! Downloading...",
            4000
        );
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "You are using the latest version.",
            "success",
            4000
        );
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update error: err",
            "error",
            7000
        );
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: 42%",
            "info",
            2000
        );
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update downloaded! Restart to install the update now, or choose Later to finish your work.",
            "success",
            0,
            "update-downloaded"
        );
    });

    it("reports updater progress when percent data is missing", () => {
        const handler = requireHandler(
            updateHandlers.get("update-download-progress"),
            "update-download-progress"
        );
        expect(updateHandlers.has("update-download-progress")).toBe(true);
        handler(null);
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: progress information unavailable.",
            "info",
            2000
        );
    });

    it("updates accessibility classes for font and contrast modes", () => {
        const setFont = ipcHandlers.get("set-font-size");
        const setContrast = ipcHandlers.get("set-high-contrast");
        document.body.className = "";
        setFont?.(undefined, "large");
        expect(document.body.classList.contains("font-large")).toBe(true);
        setContrast?.(undefined, "black");
        expect(document.body.classList.contains("high-contrast")).toBe(true);
        setContrast?.(undefined, "white");
        expect(document.body.classList.contains("high-contrast-white")).toBe(
            true
        );
        setContrast?.(undefined, "yellow");
        expect(document.body.classList.contains("high-contrast-yellow")).toBe(
            true
        );
    });

    it("forwards print and update menu IPC events", () => {
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
        const printHandler = ipcHandlers.get("menu-print");
        printHandler?.();
        expect(printSpy).toHaveBeenCalled();

        const checkUpdatesHandler = requireHandler(
            ipcHandlers.get("menu-check-for-updates"),
            "menu-check-for-updates"
        );
        expect(ipcHandlers.has("menu-check-for-updates")).toBe(true);
        checkUpdatesHandler();
        expect(electronAPI.send).toHaveBeenCalledWith("menu-check-for-updates");
    });

    it("routes show-notification IPC messages through the notifier", () => {
        const handler = requireHandler(
            ipcHandlers.get("show-notification"),
            "show-notification"
        );
        expect(ipcHandlers.has("show-notification")).toBe(true);
        handler(undefined, "Hello from IPC");
        handler(undefined, " ");
        expect(showNotification).toHaveBeenCalledWith(
            "Hello from IPC",
            "info",
            3000
        );
        expect(showNotification).toHaveBeenCalledTimes(1);
    });

    it("loads keyboard shortcuts module and invokes the modal presenter when available", async () => {
        delete globalAny.showKeyboardShortcutsModal;

        const handler = ipcHandlers.get("menu-keyboard-shortcuts");
        await handler?.();

        expect(
            keyboardShortcutsModalMock.showKeyboardShortcutsModal
        ).toHaveBeenCalledOnce();
        expect(globalAny.showKeyboardShortcutsModal).toBe(
            keyboardShortcutsModalMock.showKeyboardShortcutsModal
        );
    });

    it("does not use script tag injection for keyboard shortcuts", async () => {
        delete globalAny.showKeyboardShortcutsModal;
        const shortcutsHandler = requireHandler(
            ipcHandlers.get("menu-keyboard-shortcuts"),
            "menu-keyboard-shortcuts"
        );
        expect(ipcHandlers.has("menu-keyboard-shortcuts")).toBe(true);

        const createdScripts: HTMLScriptElement[] = [];
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation(((
            tagName: string,
            options?: ElementCreationOptions
        ) => {
            const element = originalCreateElement(
                tagName,
                options
            ) as HTMLElement;
            if (tagName === "script") {
                createdScripts.push(element as HTMLScriptElement);
            }
            return element;
        }) as typeof document.createElement);

        await shortcutsHandler();

        expect(createdScripts).toHaveLength(0);
        expect(showAboutModal).not.toHaveBeenCalled();
    });

    it("invokes showKeyboardShortcutsModal when script already present", () => {
        globalAny.showKeyboardShortcutsModal = vi.fn(() => {
            document.body.dataset.shortcutsModal = "opened";
        });
        const handler = requireHandler(
            ipcHandlers.get("menu-keyboard-shortcuts"),
            "menu-keyboard-shortcuts"
        );
        handler();
        expect(document.body.dataset.shortcutsModal).toBe("opened");
        expect(globalAny.showKeyboardShortcutsModal).toHaveBeenCalledOnce();
    });
});

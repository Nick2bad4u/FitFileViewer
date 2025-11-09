import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupListeners } from "../../../../utils/app/events.js";

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
        document.body.innerHTML = '<button id="open">Open</button><div id="content-summary"></div>';
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
            onIpc: vi.fn((channel: string, handler: (...args: any[]) => unknown) => {
                ipcHandlers.set(channel, handler);
                return () => ipcHandlers.delete(channel);
            }),
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
            onUpdateEvent: vi.fn((event: string, handler: (...args: any[]) => unknown) => {
                updateHandlers.set(event, handler);
            }),
        };

        delete (globalAny as { __ffvMenuForwardRegistry?: Set<string> }).__ffvMenuForwardRegistry;
        globalAny.electronAPI = electronAPI;
        globalAny.showFitData = vi.fn();
        globalAny.sendFitFileToAltFitReader = vi.fn();
        globalAny.copyTableAsCSV = vi.fn();
        globalAny.ChartUpdater = { updateCharts: vi.fn() };
        globalAny.globalData = { recordMesgs: [] };
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
        document.body.innerHTML = "";
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
        openButton.click();
        expect(handleOpenFile).toHaveBeenCalledTimes(1);
        expect(handleOpenFile).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpeningFileRef,
                openFileBtn: openButton,
            })
        );
    });

    it("shows info notification when no recent files exist", async () => {
        electronAPI.recentFiles.mockResolvedValueOnce([]);
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        expect(showNotification).toHaveBeenCalledWith("No recent files found.", "info", 2000);
    });

    it("loads and opens a recent file from the context menu", async () => {
        electronAPI.recentFiles.mockResolvedValueOnce(["C:/rides/demo.fit"]);
        const arrayBuffer = new ArrayBuffer(16);
        electronAPI.readFile.mockResolvedValueOnce(arrayBuffer);
        electronAPI.parseFitFile.mockResolvedValueOnce({ recordMesgs: [{ speed: 10 }] });
        electronAPI.addRecentFile.mockResolvedValueOnce(undefined);

        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        await openButton.dispatchEvent(event);
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu");
        expect(menu).toBeTruthy();
        const item = menu?.querySelector<HTMLDivElement>("div");
        expect(item).toBeTruthy();
        const menuItem = item as HTMLDivElement;
        const handler = menuItem.onclick!;
        await handler.call(menuItem, new MouseEvent("click"));

        expect(setLoading).toHaveBeenCalledWith(true);
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(globalAny.showFitData).toHaveBeenCalledWith(expect.anything(), "C:/rides/demo.fit");
        expect(electronAPI.addRecentFile).toHaveBeenCalledWith("C:/rides/demo.fit");
    });

    it("supports keyboard navigation and outside interactions in the recent files menu", async () => {
        vi.useFakeTimers();
        electronAPI.recentFiles.mockResolvedValueOnce(["C:/rides/a.fit", "C:/rides/b.fit"]);

        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        vi.runAllTimers();

        const menu = document.getElementById("recent-files-menu");
        expect(menu).toBeTruthy();
        const items = Array.from(menu!.querySelectorAll<HTMLDivElement>("div"));
        expect(items).toHaveLength(2);
        const firstItem = items[0];
        const secondItem = items[1];
        const firstClick = vi.spyOn(firstItem, "click").mockImplementation(() => {});
        const secondClick = vi.spyOn(secondItem, "click").mockImplementation(() => {});

        menu!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(secondItem.style.background).toBe("var(--color-glass-border)");
        menu!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
        expect(secondItem.style.background).toBe("transparent");
        menu!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(firstClick).toHaveBeenCalled();

        menu!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        expect(document.getElementById("recent-files-menu")).toBeNull();

        electronAPI.recentFiles.mockResolvedValueOnce(["C:/rides/a.fit"]);
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        vi.runAllTimers();
        expect(document.getElementById("recent-files-menu")).not.toBeNull();
        document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        expect(document.getElementById("recent-files-menu")).toBeNull();
        vi.useRealTimers();

        // prevent unused variable warning for secondClick mock
        expect(secondClick).not.toBeCalled();
    });

    it("handles menu forwarders by relaying to send", () => {
        const saveAsHandler = ipcHandlers.get("menu-save-as");
        expect(saveAsHandler).toBeTruthy();
        saveAsHandler?.({}, undefined);
        expect(electronAPI.send).toHaveBeenCalledWith("menu-save-as");

        const exportHandler = ipcHandlers.get("menu-export");
        expect(exportHandler).toBeTruthy();
        exportHandler?.({}, undefined);
        expect(electronAPI.send).toHaveBeenCalledWith("menu-export");
    });

    it("responds to menu open recent file requests", async () => {
        expect(recentOpenHandler).toBeTruthy();
        electronAPI.readFile.mockResolvedValueOnce(new ArrayBuffer(8));
        electronAPI.parseFitFile.mockResolvedValueOnce({ recordMesgs: [] });
        await recentOpenHandler?.("C:/rides/other.fit");
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it("exports CSV files using copyTableAsCSV", async () => {
        vi.useFakeTimers();
        const csv = "header\nvalue";
        globalAny.copyTableAsCSV = vi.fn(() => csv);
        const summaryContainer = document.getElementById("content-summary");
        expect(summaryContainer).toBeTruthy();
        electronAPI.recentFiles.mockResolvedValue([]);

        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:ffv");
        const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

        const exportHandler = ipcHandlers.get("export-file");
        expect(exportHandler).toBeTruthy();
        await exportHandler?.(undefined, "export.csv");

        expect(globalAny.copyTableAsCSV).toHaveBeenCalled();
        expect(createObjectURLSpy).toHaveBeenCalled();
        vi.runAllTimers();
        expect(revokeSpy).toHaveBeenCalledWith("blob:ffv");
        vi.useRealTimers();
    });

    it("warns when GPX export has no data", async () => {
        const exportHandler = ipcHandlers.get("export-file");
        globalAny.globalData = { recordMesgs: [] };
        await exportHandler?.(undefined, "activity.gpx");
        expect(showNotification).toHaveBeenCalledWith("No data available for GPX export.", "info", 3000);
    });

    it("builds GPX export when records exist", async () => {
        vi.useFakeTimers();
        const exportHandler = ipcHandlers.get("export-file");
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

        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:gpx");
        const revokeSpy = vi.spyOn(URL, "revokeObjectURL");

        await exportHandler?.(undefined, "activity.gpx");
        expect(createObjectURLSpy).toHaveBeenCalled();
        const anchor = document.body.querySelector<HTMLAnchorElement>("a[download]");
        expect(anchor?.download.endsWith(".gpx")).toBe(true);
        vi.runAllTimers();
        expect(revokeSpy).toHaveBeenCalledWith("blob:gpx");
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
            const handler = updateHandlers.get(event);
            expect(handler).toBeTruthy();
            handler?.(event === "update-download-progress" ? { percent: 42.2 } : "err");
        }
        expect(showUpdateNotification).toHaveBeenCalledWith("Checking for updates...", "info", 3000);
        expect(showUpdateNotification).toHaveBeenCalledWith("Update available! Downloading...", 4000);
        expect(showUpdateNotification).toHaveBeenCalledWith("You are using the latest version.", "success", 4000);
        expect(showUpdateNotification).toHaveBeenCalledWith("Update error: err", "error", 7000);
        expect(showUpdateNotification).toHaveBeenCalledWith("Downloading update: 42%", "info", 2000);
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update downloaded! Restart to install the update now, or choose Later to finish your work.",
            "success",
            0,
            "update-downloaded"
        );
    });

    it("reports updater progress when percent data is missing", () => {
        const handler = updateHandlers.get("update-download-progress");
        handler?.(null);
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
        expect(document.body.classList.contains("high-contrast-white")).toBe(true);
        setContrast?.(undefined, "yellow");
        expect(document.body.classList.contains("high-contrast-yellow")).toBe(true);
    });

    it("forwards print and update menu IPC events", () => {
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
        const printHandler = ipcHandlers.get("menu-print");
        printHandler?.();
        expect(printSpy).toHaveBeenCalled();

        const checkUpdatesHandler = ipcHandlers.get("menu-check-for-updates");
        expect(checkUpdatesHandler).toBeTruthy();
        checkUpdatesHandler?.();
        expect(electronAPI.send).toHaveBeenCalledWith("menu-check-for-updates");
    });

    it("routes show-notification IPC messages through the notifier", () => {
        const handler = ipcHandlers.get("show-notification");
        handler?.("Hello from IPC");
        expect(showNotification).toHaveBeenCalledWith("Hello from IPC", "info", 3000);
    });

    it("loads keyboard shortcuts script and invokes the modal presenter when available", () => {
        delete globalAny.showKeyboardShortcutsModal;
        const originalCreateElement = document.createElement.bind(document);
        const createdScripts: HTMLScriptElement[] = [];
        vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
            const element = originalCreateElement(tagName, options) as HTMLElement;
            if (tagName === "script") {
                createdScripts.push(element as HTMLScriptElement);
            }
            return element;
        }) as typeof document.createElement);

        const handler = ipcHandlers.get("menu-keyboard-shortcuts");
        handler?.();
        expect(createdScripts).toHaveLength(1);
        const [script] = createdScripts;
        globalAny.showKeyboardShortcutsModal = vi.fn();
        script.onload?.(new Event("load"));
        expect(globalAny.showKeyboardShortcutsModal).toHaveBeenCalled();
    });

    it("falls back to inline shortcuts list when script fails to load", () => {
        delete globalAny.showKeyboardShortcutsModal;
        const handlers = ipcHandlers;
        const shortcutsHandler = handlers.get("menu-keyboard-shortcuts");
        expect(shortcutsHandler).toBeTruthy();

        const createdScripts: HTMLScriptElement[] = [];
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
            const element = originalCreateElement(tagName, options) as HTMLElement;
            if (tagName === "script") {
                createdScripts.push(element as HTMLScriptElement);
            }
            return element;
        }) as typeof document.createElement);

        shortcutsHandler?.();
        expect(createdScripts).toHaveLength(1);
        const [script] = createdScripts;
        expect(script.onerror).toBeTypeOf("function");
        script.onerror?.(new Event("error"));
        expect(showAboutModal).toHaveBeenCalled();
    });

    it("invokes showKeyboardShortcutsModal when script already present", () => {
        globalAny.showKeyboardShortcutsModal = vi.fn();
        const handler = ipcHandlers.get("menu-keyboard-shortcuts");
        handler?.();
        expect(globalAny.showKeyboardShortcutsModal).toHaveBeenCalled();
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setupListeners } from "../../../../electron-app/utils/app/events.js";
import type { SetupListenersOptions } from "../../../../electron-app/utils/app/lifecycle/listeners.js";

const keyboardShortcutsModalMock = vi.hoisted(() => ({
    showKeyboardShortcutsModal: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../electron-app/utils/ui/modals/keyboardShortcutsModal.js"),
    () => ({
        showKeyboardShortcutsModal:
            keyboardShortcutsModalMock.showKeyboardShortcutsModal,
    })
);

type CopyTableAsCsv = (options: {
    container: Element;
    data: unknown;
}) => string;
type IpcHandler = (...args: unknown[]) => unknown;
type LoadingCallback = SetupListenersOptions["setLoading"];
type NotificationCallback = SetupListenersOptions["showNotification"];
type ShowFitData = (data: unknown, filePath: string) => void;
type ShowKeyboardShortcutsModal = () => void;
type UpdateNotificationCallback =
    SetupListenersOptions["showUpdateNotification"];

type TestElectronAPI = {
    addRecentFile: ReturnType<
        typeof vi.fn<(filePath: string) => Promise<void>>
    >;
    onIpc: ReturnType<
        typeof vi.fn<(channel: string, handler: IpcHandler) => () => void>
    >;
    onMenuOpenFile: ReturnType<typeof vi.fn<(handler: IpcHandler) => void>>;
    onOpenRecentFile: ReturnType<typeof vi.fn<(handler: IpcHandler) => void>>;
    onUpdateEvent: ReturnType<
        typeof vi.fn<(event: string, handler: IpcHandler) => void>
    >;
    parseFitFile: ReturnType<
        typeof vi.fn<(buffer: ArrayBuffer) => Promise<unknown>>
    >;
    readFile: ReturnType<
        typeof vi.fn<(filePath: string) => Promise<ArrayBuffer>>
    >;
    recentFiles: ReturnType<typeof vi.fn<() => Promise<string[]>>>;
    send: ReturnType<typeof vi.fn<(channel: string) => void>>;
};

type TestGlobals = typeof globalThis & {
    ChartUpdater?: {
        updateCharts: ReturnType<typeof vi.fn<(reason?: string) => unknown>>;
    };
    copyTableAsCSV?: ReturnType<typeof vi.fn<CopyTableAsCsv>>;
    electronAPI?: TestElectronAPI;
    globalData?: unknown;
    loadedFitFiles?: unknown[];
    sendFitFileToAltFitReader?: ReturnType<
        typeof vi.fn<(arrayBuffer: ArrayBuffer) => unknown>
    >;
    showFitData?: ReturnType<typeof vi.fn<ShowFitData>>;
    showKeyboardShortcutsModal?: ReturnType<
        typeof vi.fn<ShowKeyboardShortcutsModal>
    >;
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

function requireHandler<T extends IpcHandler>(
    handler: T | null | undefined,
    channel: string
): T {
    if (typeof handler !== "function") {
        throw new TypeError(`${channel} handler was not registered`);
    }

    return handler;
}

function defineGlobalValue<K extends keyof TestGlobals>(
    key: K,
    value: TestGlobals[K]
): void {
    Object.defineProperty(globalAny, key, {
        configurable: true,
        value,
        writable: true,
    });
}

describe(setupListeners, () => {
    let openButton: HTMLButtonElement;
    let isOpeningFileRef: { current: boolean };
    let setLoading: ReturnType<typeof vi.fn<LoadingCallback>>;
    let showNotification: ReturnType<typeof vi.fn<NotificationCallback>>;
    let handleOpenFile: ReturnType<
        typeof vi.fn<SetupListenersOptions["handleOpenFile"]>
    >;
    let showUpdateNotification: ReturnType<
        typeof vi.fn<UpdateNotificationCallback>
    >;
    let showAboutModal: ReturnType<
        typeof vi.fn<SetupListenersOptions["showAboutModal"]>
    >;
    let electronAPI: TestElectronAPI;
    let ipcHandlers: Map<string, IpcHandler>;
    let menuOpenHandler: IpcHandler | null;
    let recentOpenHandler: IpcHandler | null;
    let updateHandlers: Map<string, IpcHandler>;

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
        setLoading = vi.fn<LoadingCallback>();
        showNotification = vi.fn<NotificationCallback>();
        handleOpenFile = vi.fn<SetupListenersOptions["handleOpenFile"]>();
        showUpdateNotification = vi.fn<UpdateNotificationCallback>();
        showAboutModal = vi.fn<SetupListenersOptions["showAboutModal"]>();
        ipcHandlers = new Map();
        updateHandlers = new Map();
        menuOpenHandler = null;
        recentOpenHandler = null;

        electronAPI = {
            onIpc: vi.fn<(channel: string, handler: IpcHandler) => () => void>(
                (channel, handler) => {
                    ipcHandlers.set(channel, handler);
                    return () => {
                        ipcHandlers.delete(channel);
                    };
                }
            ),
            send: vi.fn<(channel: string) => void>(),
            recentFiles: vi.fn<() => Promise<string[]>>(),
            readFile: vi.fn<(filePath: string) => Promise<ArrayBuffer>>(),
            parseFitFile: vi.fn<(buffer: ArrayBuffer) => Promise<unknown>>(),
            addRecentFile: vi.fn<(filePath: string) => Promise<void>>(),
            onMenuOpenFile: vi.fn<(handler: IpcHandler) => void>((handler) => {
                menuOpenHandler = handler;
            }),
            onOpenRecentFile: vi.fn<(handler: IpcHandler) => void>(
                (handler) => {
                    recentOpenHandler = handler;
                }
            ),
            onUpdateEvent: vi.fn<(event: string, handler: IpcHandler) => void>(
                (event, handler) => {
                    updateHandlers.set(event, handler);
                }
            ),
        };

        delete (globalAny as { __ffvMenuForwardRegistry?: Set<string> })
            .__ffvMenuForwardRegistry;
        defineGlobalValue("electronAPI", electronAPI);
        defineGlobalValue("showFitData", vi.fn<ShowFitData>());
        defineGlobalValue(
            "sendFitFileToAltFitReader",
            vi.fn<(arrayBuffer: ArrayBuffer) => unknown>()
        );
        defineGlobalValue("copyTableAsCSV", vi.fn<CopyTableAsCsv>());
        defineGlobalValue("ChartUpdater", {
            updateCharts: vi.fn<(reason?: string) => unknown>(),
        });
        defineGlobalValue("globalData", { recordMesgs: [] });
        keyboardShortcutsModalMock.showKeyboardShortcutsModal.mockReset();
        defineGlobalValue("loadedFitFiles", []);

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
        expect.assertions(3);
        handleOpenFile.mockImplementationOnce(({ openFileBtn }) => {
            openFileBtn.dataset.openHandled = "true";
        });
        const clickEvent = new MouseEvent("click", { cancelable: true });

        const dispatchResult = openButton.dispatchEvent(clickEvent);

        expect({
            defaultPrevented: clickEvent.defaultPrevented,
            dispatchResult,
        }).toStrictEqual({
            defaultPrevented: false,
            dispatchResult: true,
        });
        expect(openButton.dataset.openHandled).toBe("true");
        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                isOpeningFileRef,
                openFileBtn: openButton,
            })
        );
    });

    it("shows info notification when no recent files exist", async () => {
        expect.assertions(2);
        electronAPI.recentFiles.mockResolvedValueOnce([]);
        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
        });
        await openButton.dispatchEvent(event);
        await Promise.resolve();
        expect({
            defaultPrevented: event.defaultPrevented,
            recentMenuIds: Array.from(
                document.body.querySelectorAll("#recent-files-menu"),
                (element) => element.id
            ),
        }).toStrictEqual({
            defaultPrevented: true,
            recentMenuIds: [],
        });
        expect(showNotification).toHaveBeenCalledWith(
            "No recent files found.",
            "info",
            2000
        );
    });

    it("loads and opens a recent file from the context menu", async () => {
        expect.assertions(10);
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
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve();
            }, 0);
        });

        expect(setLoading).toHaveBeenCalledWith(true);
        expect(setLoading).toHaveBeenCalledWith(false);
        expect({
            openButtonDisabled: openButton.disabled,
        }).toStrictEqual({
            openButtonDisabled: false,
        });
        expect(globalAny.showFitData).toHaveBeenCalledWith(
            expect.anything(),
            "C:/rides/demo.fit"
        );
        expect(electronAPI.addRecentFile).toHaveBeenCalledWith(
            "C:/rides/demo.fit"
        );
    });

    it("supports keyboard navigation and outside interactions in the recent files menu", async () => {
        expect.assertions(11);
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
        expect([
            ...document.body.querySelectorAll("#recent-files-menu"),
        ]).toStrictEqual([]);

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
        expect({
            reopenedMenuParent: reopenedMenu.parentElement,
            recentMenuIds: Array.from(
                document.body.querySelectorAll("#recent-files-menu"),
                (element) => element.id
            ),
        }).toStrictEqual({
            recentMenuIds: [],
            reopenedMenuParent: null,
        });
        vi.useRealTimers();

        // prevent unused variable warning for secondClick mock
        expect(secondClick).not.toHaveBeenCalled();
    });

    it("handles menu forwarders by relaying to send", () => {
        expect.assertions(4);
        const saveAsHandler = requireHandler(
            ipcHandlers.get("menu-save-as"),
            "menu-save-as"
        );
        expect([...ipcHandlers.keys()]).toContain("menu-save-as");
        saveAsHandler({}, undefined);
        expect(electronAPI.send).toHaveBeenCalledWith("menu-save-as");

        const exportHandler = requireHandler(
            ipcHandlers.get("menu-export"),
            "menu-export"
        );
        expect([...ipcHandlers.keys()]).toContain("menu-export");
        exportHandler({}, undefined);
        expect(electronAPI.send).toHaveBeenCalledWith("menu-export");
    });

    it("responds to menu open recent file requests", async () => {
        expect.assertions(4);
        const handler = requireHandler(recentOpenHandler, "open recent file");
        electronAPI.readFile.mockResolvedValueOnce(new ArrayBuffer(8));
        electronAPI.parseFitFile.mockResolvedValueOnce({ recordMesgs: [] });
        await handler("C:/rides/other.fit");
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect({
            openButtonDisabled: openButton.disabled,
        }).toStrictEqual({
            openButtonDisabled: false,
        });
        expect(globalAny.showFitData).toHaveBeenCalledWith(
            { recordMesgs: [] },
            "C:/rides/other.fit"
        );
    });

    it("exports CSV files using copyTableAsCSV", async () => {
        expect.assertions(6);
        vi.useFakeTimers();
        const csv = "header\nvalue";
        const copyTableAsCSV = vi.fn<CopyTableAsCsv>(() => csv);
        defineGlobalValue("copyTableAsCSV", copyTableAsCSV);
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
            Array.from(
                document.body.querySelectorAll('a[download="export.csv"]'),
                (element) => element.getAttribute("download")
            )
        ).toStrictEqual([]);
        vi.useRealTimers();
    });

    it("warns when GPX export has no data", async () => {
        expect.assertions(2);
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
            Array.from(
                document.body.querySelectorAll('a[download$=".gpx"]'),
                (element) => element.getAttribute("download")
            )
        ).toStrictEqual([]);
    });

    it("builds GPX export when records exist", async () => {
        expect.assertions(6);
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
        expect(anchor.download).toMatch(/\.gpx$/u);
        expect(anchor.download).toBe("activity.gpx");
        expect(anchor.href).toBe("blob:gpx");
        vi.runAllTimers();
        expect(revokeSpy).toHaveBeenCalledWith("blob:gpx");
        expect(
            Array.from(
                document.body.querySelectorAll('a[download="activity.gpx"]'),
                (element) => element.getAttribute("download")
            )
        ).toStrictEqual([]);
        vi.useRealTimers();
    });

    it("shows update notifications for auto-updater events", () => {
        expect.assertions(12);
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
            expect([...updateHandlers.keys()]).toContain(event);
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
        expect.assertions(2);
        const handler = requireHandler(
            updateHandlers.get("update-download-progress"),
            "update-download-progress"
        );
        expect([...updateHandlers.keys()]).toContain(
            "update-download-progress"
        );
        handler(null);
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: progress information unavailable.",
            "info",
            2000
        );
    });

    it("updates accessibility classes for font and contrast modes", () => {
        expect.assertions(4);
        const setFont = ipcHandlers.get("set-font-size");
        const setContrast = ipcHandlers.get("set-high-contrast");
        document.body.className = "";
        setFont?.(undefined, "large");
        expect([...document.body.classList]).toStrictEqual(["font-large"]);
        setContrast?.(undefined, "black");
        expect([...document.body.classList]).toStrictEqual([
            "font-large",
            "high-contrast",
        ]);
        setContrast?.(undefined, "white");
        expect([...document.body.classList]).toStrictEqual([
            "font-large",
            "high-contrast-white",
        ]);
        setContrast?.(undefined, "yellow");
        expect([...document.body.classList]).toStrictEqual([
            "font-large",
            "high-contrast-yellow",
        ]);
    });

    it("forwards print and update menu IPC events", () => {
        expect.assertions(3);
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
        const printHandler = ipcHandlers.get("menu-print");
        printHandler?.();
        expect(printSpy).toHaveBeenCalledWith();

        const checkUpdatesHandler = requireHandler(
            ipcHandlers.get("menu-check-for-updates"),
            "menu-check-for-updates"
        );
        expect([...ipcHandlers.keys()]).toContain("menu-check-for-updates");
        checkUpdatesHandler();
        expect(electronAPI.send).toHaveBeenCalledWith("menu-check-for-updates");
    });

    it("routes show-notification IPC messages through the notifier", () => {
        expect.assertions(2);
        const handler = requireHandler(
            ipcHandlers.get("show-notification"),
            "show-notification"
        );
        expect([...ipcHandlers.keys()]).toContain("show-notification");
        handler(undefined, "Hello from IPC");
        handler(undefined, " ");
        expect(showNotification).toHaveBeenCalledExactlyOnceWith(
            "Hello from IPC",
            "info",
            3000
        );
    });

    it("loads keyboard shortcuts module and invokes the modal presenter when available", async () => {
        expect.assertions(2);
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
        expect.assertions(3);
        delete globalAny.showKeyboardShortcutsModal;
        const shortcutsHandler = requireHandler(
            ipcHandlers.get("menu-keyboard-shortcuts"),
            "menu-keyboard-shortcuts"
        );
        expect([...ipcHandlers.keys()]).toContain("menu-keyboard-shortcuts");

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

        expect(createdScripts).toStrictEqual([]);
        expect(showAboutModal).not.toHaveBeenCalled();
    });

    it("invokes showKeyboardShortcutsModal when script already present", () => {
        expect.assertions(2);
        const showKeyboardShortcutsModal = vi.fn<ShowKeyboardShortcutsModal>(
            () => {
                document.body.dataset.shortcutsModal = "opened";
            }
        );
        defineGlobalValue(
            "showKeyboardShortcutsModal",
            showKeyboardShortcutsModal
        );
        const handler = requireHandler(
            ipcHandlers.get("menu-keyboard-shortcuts"),
            "menu-keyboard-shortcuts"
        );
        handler();
        expect(document.body.dataset.shortcutsModal).toBe("opened");
        expect(globalAny.showKeyboardShortcutsModal).toHaveBeenCalledOnce();
    });
});

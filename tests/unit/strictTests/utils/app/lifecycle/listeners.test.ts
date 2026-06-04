// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

type AddRecentFileMock = (filePath: string) => Promise<void>;
type AnchorClickMock = () => void;
type AnchorRemoveMock = () => void;
type AppendNodeMock = (node: Node) => void;
type BlobMock = (
    parts: any[],
    options: any
) => {
    options: any;
    parts: any[];
    type: string;
};
type CopyTableAsCsvMock = () => string;
type CreateExportGpxButtonMock = () => boolean;
type CreateObjectUrlMock = (object: Blob | MediaSource) => string;
type CreateTestAnchorMock = (tagName: string) => HTMLAnchorElement;
type HandleOpenFileMock = (options: unknown) => Promise<void> | void;
type KeyboardShortcutsModalMock = () => void;
type OpenFileSelectorMock = () => Promise<void>;
type ParseFitFileMock = (buffer: ArrayBuffer) => Promise<any>;
type ReadFileMock = (filePath: string) => Promise<ArrayBuffer>;
type RecentFilesMock = () => Promise<string[]>;
type RevokeObjectUrlMock = (url: string) => void;
type SendFitFileToAltFitReaderMock = (buffer: ArrayBuffer) => void;
type SetLoadingMock = (isLoading: boolean) => void;
type ShowAboutModalMock = () => void;
type ShowFitDataMock = (data: unknown, filePath: string) => void;
type ShowNotificationMock = (
    message: string,
    type?: string,
    duration?: number
) => void;
type ShowUpdateNotificationMock = (...args: unknown[]) => void;

const dependencyMocks = vi.hoisted(() => ({
    keyboardShortcutsModal: vi.fn<KeyboardShortcutsModalMock>(),
    openFileSelector: vi.fn<OpenFileSelectorMock>(),
}));

vi.mock(
    import("../../../../../../electron-app/utils/files/import/openFileSelector.js"),
    () => ({
        openFileSelector: dependencyMocks.openFileSelector,
    })
);

vi.mock(
    import("../../../../../../electron-app/utils/ui/modals/keyboardShortcutsModal.js"),
    () => ({
        showKeyboardShortcutsModal: dependencyMocks.keyboardShortcutsModal,
    })
);

const openFileSelectorMock = dependencyMocks.openFileSelector;

// Import the module under test
import { setupListeners } from "../../../../../../electron-app/utils/app/lifecycle/listeners.js";

type IpcHandler = (...args: any[]) => any;

declare global {
    // extend window for tests
    interface Window {
        electronAPI: any;
        showFitData?: (...args: any[]) => any;
        ChartUpdater?: { updateCharts: (reason?: string) => any };
        renderChartJS?: () => any;
        globalData?: any;
        showKeyboardShortcutsModal?: () => void;
    }
}

function installURLMocks() {
    const createObjectURL = vi.fn<CreateObjectUrlMock>(() => "blob:mock");
    const revokeObjectURL = vi.fn<RevokeObjectUrlMock>();
    vi.stubGlobal("URL", {
        createObjectURL,
        revokeObjectURL,
    } as unknown as URL);
    return { createObjectURL, revokeObjectURL };
}

function createElectronAPIMock() {
    const ipcHandlers = new Map<string, IpcHandler>();
    const updateHandlers = new Map<string, IpcHandler>();
    let menuOpenFileCb: IpcHandler | null = null;
    let openRecentCb: ((fp: string) => any) | null = null;

    return {
        // Menu hooks
        onMenuOpenFile: (cb: IpcHandler) => {
            menuOpenFileCb = cb;
        },
        onOpenRecentFile: (cb: (filePath: string) => any) => {
            openRecentCb = cb;
        },
        triggerMenuOpenFile: () => menuOpenFileCb && menuOpenFileCb(),
        triggerOpenRecentFile: (fp: string) => openRecentCb && openRecentCb(fp),

        // Generic IPC
        onIpc: (channel: string, cb: IpcHandler) => {
            ipcHandlers.set(channel, cb);
        },
        emit: (channel: string, ...args: any[]) =>
            ipcHandlers.get(channel)?.(...args),

        // Updater
        onUpdateEvent: (event: string, cb: IpcHandler) => {
            updateHandlers.set(event, cb);
        },
        emitUpdate: (event: string, ...args: any[]) =>
            updateHandlers.get(event)?.(...args),

        // FS operations (can be overridden per test)
        recentFiles: vi.fn<RecentFilesMock>(),
        approveRecentFile: vi
            .fn<(fp: string) => Promise<boolean>>()
            .mockResolvedValue(true),
        readFile: vi.fn<ReadFileMock>(),
        parseFitFile: vi.fn<ParseFitFileMock>(),
        addRecentFile: vi.fn<AddRecentFileMock>(),

        // Main process send
        checkForUpdates: vi.fn<() => void>(),
        send: vi.fn<(channel: string) => void>(),
    };
}

function createButton(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.id = "open-file-btn";
    document.body.appendChild(btn);
    return btn as HTMLButtonElement;
}

function ensureContainers() {
    const summary = document.createElement("div");
    summary.id = "content-summary";
    document.body.appendChild(summary);
}

function createFitMessages() {
    return { recordMesgs: [] };
}

function expectHtmlDivElement(
    value: Element | null | undefined,
    message: string
): HTMLDivElement {
    expect(value).toBeInstanceOf(HTMLDivElement);
    if (!(value instanceof HTMLDivElement)) {
        throw new TypeError(message);
    }
    return value;
}

describe("setupListeners (utils/app/lifecycle/listeners)", () => {
    let openFileBtn: HTMLButtonElement;
    let electronAPI: any;
    let setLoading: Mock<SetLoadingMock>;
    let showNotification: Mock<ShowNotificationMock>;
    let handleOpenFile: Mock<HandleOpenFileMock>;
    let showUpdateNotification: Mock<ShowUpdateNotificationMock>;
    let showAboutModal: Mock<ShowAboutModalMock>;

    beforeEach(() => {
        openFileSelectorMock.mockReset();
        openFileSelectorMock.mockResolvedValue(undefined);
        Reflect.deleteProperty(globalThis, "__ffvMenuForwardRegistry");
        Reflect.deleteProperty(window, "__ffvMenuForwardRegistry");
        document.body.innerHTML = "";
        openFileBtn = createButton();
        electronAPI = createElectronAPIMock();

        // Synchronize electronAPI between window and globalThis scopes using property descriptor pattern
        Object.defineProperty(window, "electronAPI", {
            value: electronAPI as any,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "electronAPI", {
            value: electronAPI as any,
            writable: true,
            configurable: true,
        });

        setLoading = vi.fn<SetLoadingMock>();
        showNotification = vi.fn<ShowNotificationMock>();
        handleOpenFile = vi.fn<HandleOpenFileMock>();
        showUpdateNotification = vi.fn<ShowUpdateNotificationMock>();
        showAboutModal = vi.fn<ShowAboutModalMock>();
        ensureContainers();
    });

    afterEach(() => {
        // Clean up any dynamically created context menus
        const existingMenu = document.querySelector("#recent-files-menu");
        if (existingMenu) {
            existingMenu.remove();
        }

        // Clean up all DOM elements thoroughly
        document.body.innerHTML = "";

        // Clear any global state that might interfere (but preserve electronAPI)
        delete (globalThis as any).globalData;
        delete (globalThis as any).showFitData;
        delete (globalThis as any).sendFitFileToAltFitReader;
        delete (globalThis as any).ChartUpdater;
        delete (globalThis as any).renderChartJS;
        delete (globalThis as any).renderChart;
        delete (globalThis as any).copyTableAsCSV;

        // Clear any remaining timeouts that might interfere with subsequent tests
        for (let i = 1; i < 9999; i++) {
            clearTimeout(i);
            clearInterval(i);
        }

        // Force garbage collection of event listeners by removing all event listeners
        // from commonly used elements
        try {
            document.removeEventListener("mousedown", () => {}, {
                capture: true,
            });
            document.removeEventListener("mousedown", () => {}, {
                capture: false,
            });
            window.removeEventListener("resize", () => {});
        } catch (e) {
            // Ignore errors from trying to remove non-existent listeners
        }

        // Clear vi mocks to ensure clean state
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    it("wires openFile click to handleOpenFile", async () => {
        expect.hasAssertions();

        const isOpeningFileRef = { current: false };

        setupListeners({
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        openFileBtn.click();
        expect(openFileBtn.id).toBe("open-file-btn");
        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        });
    });

    it("contextmenu: no recentFiles available -> no action", async () => {
        expect.hasAssertions();

        // Remove recentFiles so early return triggers
        window.electronAPI.recentFiles = undefined;

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true });
        openFileBtn.dispatchEvent(evt);

        // Should not show notification nor create a menu
        expect(showNotification).not.toHaveBeenCalled();
        expect(document.getElementById("recent-files-menu")).toBeNull();
    });

    it("contextmenu: empty recent files -> shows info notification", async () => {
        expect.hasAssertions();

        vi.mocked(window.electronAPI.recentFiles).mockResolvedValue([]);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true });
        openFileBtn.dispatchEvent(evt);

        // Allow async handler to resolve
        await Promise.resolve();

        expect(document.getElementById("recent-files-menu")).toBeNull();
        expect(showNotification).toHaveBeenCalledWith(
            "No recent files found.",
            "info",
            2000
        );
    });

    it("contextmenu: renders items and clicking loads file and updates recent", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit", "C:/Users/Test/two.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        const arrayBuf = new ArrayBuffer(8);
        vi.mocked(electronAPI.readFile).mockResolvedValue(arrayBuf);
        const parseResult = { data: createFitMessages() };
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(parseResult);
        vi.mocked(electronAPI.addRecentFile).mockResolvedValue(undefined);
        const showFitData = vi.fn<ShowFitDataMock>();

        // Synchronize showFitData between window and globalThis scopes using property descriptor pattern
        Object.defineProperty(window, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });

        const isOpeningFileRef = { current: false };

        setupListeners({
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        // Wait for async menu creation to complete
        await vi.waitFor(
            () => {
                const menu = document.getElementById("recent-files-menu");
                expect(menu).toBeInstanceOf(HTMLDivElement);
            },
            { timeout: 1000 }
        );

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);
        const items = Array.from(menu.querySelectorAll("div"));
        expect(items).toHaveLength(files.length);

        // Click the second item properly using dispatchEvent instead of direct onclick call
        const second = items[1] as HTMLDivElement;
        const clickEvent = new MouseEvent("click", { bubbles: true });
        second.dispatchEvent(clickEvent);

        // readFile and parseFitFile should be called and then addRecentFile
        await vi.waitFor(() => {
            expect(electronAPI.readFile).toHaveBeenCalledWith(files[1]);
            expect(electronAPI.parseFitFile).toHaveBeenCalledOnce();
            expect(electronAPI.addRecentFile).toHaveBeenCalledWith(files[1]);
            expect(showFitData).toHaveBeenCalledWith(
                parseResult.data,
                files[1]
            );
        });
        // Loading toggled on/off
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        // Button re-enabled
        expect(openFileBtn.disabled).toBe(false);
    });

    it("window resize triggers ChartUpdater.updateCharts when tab active", async () => {
        expect.hasAssertions();

        // Prepare active tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        window.ChartUpdater = {
            updateCharts: vi.fn<(reason?: string) => void>(),
        };

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        vi.advanceTimersByTime(210);
        vi.useRealTimers();

        expect(
            document.getElementById("tab-chart")?.classList.contains("active")
        ).toBe(true);
        expect(window.ChartUpdater.updateCharts).toHaveBeenCalledWith(
            "window-resize"
        );
    });

    it("ipc: decoder-options-changed without cached file -> only info notification", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.electronAPI.emit("decoder-options-changed", { speed: true });
        expect(openFileBtn.disabled).toBe(false);
        expect(showNotification).toHaveBeenCalledWith(
            "Decoder options updated.",
            "info",
            2000
        );
        // Should not attempt read/parse
        expect(window.electronAPI.readFile).not.toHaveBeenCalled();
    });

    it("ipc: decoder-options-changed reloads cached file and calls showFitData", async () => {
        expect.hasAssertions();

        const arrayBuf = new ArrayBuffer(16);
        window.globalData = { cachedFilePath: "C:/tmp/sample.fit" } as any;
        vi.mocked(window.electronAPI.readFile).mockResolvedValue(arrayBuf);
        const parsed = createFitMessages();
        vi.mocked(window.electronAPI.parseFitFile).mockResolvedValue(parsed);
        const showFitData = vi.fn<ShowFitDataMock>();
        Object.defineProperty(globalThis, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(window, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.electronAPI.emit("decoder-options-changed", { foo: 1 });
        // Let promised chain resolve (flush a couple microtasks first)
        await Promise.resolve();
        await Promise.resolve();

        await vi.waitFor(() => {
            expect(window.electronAPI.readFile).toHaveBeenCalledWith(
                "C:/tmp/sample.fit"
            );
            expect(window.electronAPI.parseFitFile).toHaveBeenCalledWith(
                arrayBuf
            );
            expect(showFitData).toHaveBeenCalledWith(
                parsed,
                "C:/tmp/sample.fit"
            );
            // loading on/off around reload
            expect(setLoading).toHaveBeenCalledWith(true);
            expect(setLoading).toHaveBeenCalledWith(false);
        });
        expect(openFileBtn.disabled).toBe(false);
    });

    it("ipc: export-file csv creates and clicks download link", async () => {
        expect.hasAssertions();

        installURLMocks();
        const csv = "a,b\n1,2";
        const copyTableAsCsv = vi.fn<CopyTableAsCsvMock>(() => csv);
        Object.defineProperty(window, "copyTableAsCSV", {
            configurable: true,
            value: copyTableAsCsv,
            writable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Spy on anchor creation and click
        const createEl = document.createElement.bind(document);
        const clickSpy = vi.fn<() => void>();
        vi.spyOn(document, "createElement").mockImplementation((tag: any) => {
            const el = createEl(tag);
            if (tag === "a") {
                // @ts-ignore
                el.click = clickSpy;
            }
            return el;
        });

        window.globalData = { foo: "bar" } as any;

        await window.electronAPI.emit(
            "export-file",
            {} as any,
            "C:/tmp/out.csv"
        );

        expect(copyTableAsCsv).toHaveBeenCalledExactlyOnceWith({
            container: expect.any(HTMLDivElement),
            data: window.globalData,
        });
        expect(clickSpy).toHaveBeenCalledOnce();
        expect(document.querySelector("a[download]")).toBeInstanceOf(
            HTMLAnchorElement
        );
    });

    it("ipc: export-file gpx with coords triggers download, otherwise shows informative notices", async () => {
        expect.hasAssertions();

        installURLMocks();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Feature flag present
        (window as any).createExportGPXButton = (): void => {};

        // Case 1: valid coords -> click happens
        const clickSpy = vi.fn<() => void>();
        const createEl = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation((tag: any) => {
            const el = createEl(tag);
            if (tag === "a") {
                // @ts-ignore
                el.click = clickSpy;
            }
            return el;
        });

        // Provide two records, one invalid, one valid
        window.globalData = {
            recordMesgs: [
                { positionLat: undefined, positionLong: undefined },
                { positionLat: 1 << 30, positionLong: 1 << 30 },
            ],
        } as any;

        await window.electronAPI.emit(
            "export-file",
            {} as any,
            "C:/tmp/out.gpx"
        );
        expect(window.globalData.recordMesgs).toHaveLength(2);
        expect(clickSpy).toHaveBeenCalledOnce();

        // Case 2: no valid coords
        clickSpy.mockReset();
        window.globalData = {
            recordMesgs: [{}, {}],
        } as any;
        await window.electronAPI.emit(
            "export-file",
            {} as any,
            "C:/tmp/out.gpx"
        );
        expect(showNotification).toHaveBeenCalledWith(
            "No valid coordinates found for GPX export.",
            "info",
            3000
        );

        // Case 3: no data available
        window.globalData = {} as any;
        await window.electronAPI.emit(
            "export-file",
            {} as any,
            "C:/tmp/out.gpx"
        );
        expect(showNotification).toHaveBeenCalledWith(
            "No data available for GPX export.",
            "info",
            3000
        );
    });

    it("ipc: show-notification forwards to showNotification", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.electronAPI.emit("show-notification", "Hello", undefined);
        expect(openFileBtn.disabled).toBe(false);
        expect(showNotification).toHaveBeenCalledWith("Hello", "info", 3000);
    });

    it("ipc: menu print and forward sends", async () => {
        expect.hasAssertions();

        const printSpy = vi.fn<() => void>();
        // @ts-ignore
        window.print = printSpy;

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.electronAPI.emit("menu-print");
        expect(openFileBtn.isConnected).toBe(true);
        expect(printSpy).toHaveBeenCalledWith();

        window.electronAPI.emit("menu-check-for-updates");
        window.electronAPI.emit("menu-save-as");
        window.electronAPI.emit("menu-export");
        expect(window.electronAPI.checkForUpdates).toHaveBeenCalledWith();
        expect(window.electronAPI.send).toHaveBeenCalledWith("menu-save-as");
        expect(window.electronAPI.send).toHaveBeenCalledWith("menu-export");
    });

    it("ipc: menu-open-overlay triggers openFileSelector", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        await window.electronAPI.emit("menu-open-overlay");
        expect(openFileBtn.disabled).toBe(false);
        expect(openFileSelectorMock).toHaveBeenCalledOnce();
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("ipc: menu-open-overlay surfaces errors", async () => {
        expect.hasAssertions();

        openFileSelectorMock.mockRejectedValueOnce(new Error("fail"));

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        await window.electronAPI.emit("menu-open-overlay");
        expect(openFileBtn.disabled).toBe(false);
        expect(showNotification).toHaveBeenCalledWith(
            "Failed to open overlay selector.",
            "error",
            3000
        );
    });

    it("ipc: menu-about and keyboard-shortcuts flows", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // menu-about calls showAboutModal with no args
        window.electronAPI.emit("menu-about");
        expect(openFileBtn.isConnected).toBe(true);
        expect(showAboutModal).toHaveBeenCalledWith();

        await window.electronAPI.emit("menu-keyboard-shortcuts");

        expect(dependencyMocks.keyboardShortcutsModal).toHaveBeenCalledWith();

        // Second time: provide function so it calls directly
        const showKeyboardShortcutsModal = vi.fn<KeyboardShortcutsModalMock>();
        Object.defineProperty(globalThis, "showKeyboardShortcutsModal", {
            configurable: true,
            value: showKeyboardShortcutsModal,
            writable: true,
        });
        window.electronAPI.emit("menu-keyboard-shortcuts");
        expect(showKeyboardShortcutsModal).toHaveBeenCalledWith();
    });

    it("updater events forward to showUpdateNotification", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.electronAPI.emitUpdate("update-checking");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Checking for updates...",
            "info",
            3000
        );

        window.electronAPI.emitUpdate("update-available");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update available! Downloading...",
            4000
        );

        window.electronAPI.emitUpdate("update-not-available");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "You are using the latest version.",
            "success",
            4000
        );

        window.electronAPI.emitUpdate("update-error", new Error("boom"));
        expect(
            showUpdateNotification.mock.calls.some((c: any[]) =>
                String(c[0]).includes("Update error:")
            )
        ).toBe(true);

        window.electronAPI.emitUpdate("update-download-progress", {
            percent: 42.2,
        });
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: 42%",
            "info",
            2000
        );

        window.electronAPI.emitUpdate("update-download-progress", {});
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: progress information unavailable.",
            "info",
            2000
        );

        window.electronAPI.emitUpdate("update-downloaded");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update downloaded! Restart to install the update now, or choose Later to finish your work.",
            "success",
            0,
            "update-downloaded"
        );
    });

    it("accessibility events toggle classes", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Font size
        window.electronAPI.emit("set-font-size", {} as any, "small");
        expect(document.body.classList.contains("font-small")).toBe(true);

        // High contrast modes
        window.electronAPI.emit("set-high-contrast", {} as any, "black");
        expect(document.body.classList.contains("high-contrast")).toBe(true);
        window.electronAPI.emit("set-high-contrast", {} as any, "white");
        expect(document.body.classList.contains("high-contrast-white")).toBe(
            true
        );
        window.electronAPI.emit("set-high-contrast", {} as any, "yellow");
        expect(document.body.classList.contains("high-contrast-yellow")).toBe(
            true
        );
    });

    it("menu: onMenuOpenFile forwards to handleOpenFile; onOpenRecentFile loads and shows errors", async () => {
        expect.hasAssertions();

        const isOpeningFileRef = { current: false };

        // For open recent path success
        const arrayBuf = new ArrayBuffer(32);
        vi.mocked(window.electronAPI.readFile).mockResolvedValue(arrayBuf);
        vi.mocked(window.electronAPI.parseFitFile).mockResolvedValue(
            createFitMessages()
        );
        vi.mocked(window.electronAPI.addRecentFile).mockResolvedValue(
            undefined
        );

        setupListeners({
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Trigger menu open file
        window.electronAPI.triggerMenuOpenFile();
        expect(handleOpenFile).toHaveBeenCalledOnce();

        // Success case
        await window.electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
        expect(window.electronAPI.approveRecentFile).toHaveBeenCalledWith(
            "C:/tmp/recent.fit"
        );
        expect(window.electronAPI.readFile).toHaveBeenCalledWith(
            "C:/tmp/recent.fit"
        );
        expect(window.electronAPI.addRecentFile).toHaveBeenCalledWith(
            "C:/tmp/recent.fit"
        );

        // Denial case: approval fails -> do not read
        vi.mocked(window.electronAPI.approveRecentFile)
            .mockReset()
            .mockResolvedValue(false);
        vi.mocked(window.electronAPI.readFile)
            .mockClear()
            .mockResolvedValue(arrayBuf);
        await window.electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
        expect(window.electronAPI.readFile).not.toHaveBeenCalled();
        expect(showNotification).toHaveBeenCalledWith(
            "File access denied.",
            "error",
            4000
        );

        // Error case
        vi.mocked(window.electronAPI.approveRecentFile)
            .mockReset()
            .mockResolvedValue(true);
        vi.mocked(window.electronAPI.parseFitFile)
            .mockReset()
            .mockResolvedValue({ error: "bad" });
        await window.electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
        expect(
            showNotification.mock.calls.some((c: any[]) =>
                String(c[0]).includes("Error:")
            )
        ).toBe(true);
    });

    it("contextmenu: keyboard navigation works (ArrowDown, ArrowUp, Enter, Escape)", async () => {
        expect.hasAssertions();

        const files = [
            "C:/Users/Test/one.fit",
            "C:/Users/Test/two.fit",
            "C:/Users/Test/three.fit",
        ];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        const arrayBuf = new ArrayBuffer(8);
        vi.mocked(electronAPI.readFile).mockResolvedValue(arrayBuf);
        const parseResult = { data: createFitMessages() };
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(parseResult);
        vi.mocked(electronAPI.addRecentFile).mockResolvedValue(undefined);
        const showFitData = vi.fn<ShowFitDataMock>();

        Object.defineProperty(window, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });

        const isOpeningFileRef = { current: false };

        setupListeners({
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);

        // Test ArrowDown navigation
        const arrowDownEvent = new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true,
        });
        menu.dispatchEvent(arrowDownEvent);

        // Test ArrowUp navigation
        const arrowUpEvent = new KeyboardEvent("keydown", {
            key: "ArrowUp",
            bubbles: true,
        });
        menu.dispatchEvent(arrowUpEvent);

        // Test Enter key to select item
        const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
        });
        menu.dispatchEvent(enterEvent);

        // Wait for async operations
        await vi.waitFor(() => {
            expect(electronAPI.readFile).toHaveBeenCalledWith(files[0]);
            expect(electronAPI.parseFitFile).toHaveBeenCalledOnce();
            expect(electronAPI.addRecentFile).toHaveBeenCalledWith(files[0]);
            expect(showFitData).toHaveBeenCalledWith(
                parseResult.data,
                files[0]
            );
        });
    });

    it("contextmenu: Escape key closes menu", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);

        // Test Escape key to close menu
        const escapeEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
        });
        menu.dispatchEvent(escapeEvent);

        // Menu should be removed from DOM
        expect(document.getElementById("recent-files-menu")).toBeNull();
    });

    it("contextmenu: mouse events on menu items (mouseenter, mouseleave)", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit", "C:/Users/Test/two.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);
        const items = Array.from(menu.querySelectorAll("div"));
        expect(items).toHaveLength(files.length);

        const firstItem = items[0] as HTMLDivElement;
        const secondItem = items[1] as HTMLDivElement;

        // Test mouseenter event
        const mouseEnterEvent = new MouseEvent("mouseenter", { bubbles: true });
        firstItem.dispatchEvent(mouseEnterEvent);

        // Check that style changes were applied
        expect(firstItem.style.background).toBe("var(--color-glass-border)");
        expect(firstItem.style.color).toBe("var(--color-fg-alt)");

        // Test mouseleave event
        const mouseLeaveEvent = new MouseEvent("mouseleave", { bubbles: true });
        firstItem.dispatchEvent(mouseLeaveEvent);

        // Check that style was reset
        expect(firstItem.style.color).toBe("var(--color-fg)");
    });

    it("contextmenu: clicking outside menu removes it", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);

        // Create a dummy element outside the menu
        const outsideElement = document.createElement("div");
        document.body.appendChild(outsideElement);

        // Simulate clicking outside the menu
        const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true });
        Object.defineProperty(mouseDownEvent, "target", {
            value: outsideElement,
        });
        document.dispatchEvent(mouseDownEvent);

        // Menu should be removed from DOM
        expect(document.getElementById("recent-files-menu")).toBeNull();

        // Cleanup
        outsideElement.remove();
    });

    it("contextmenu: handles recent file error during loading", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);
        vi.mocked(electronAPI.readFile).mockRejectedValue(
            new Error("File read error")
        );

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        // Click the first item to trigger error
        const clickEvent = new MouseEvent("click", { bubbles: true });
        firstItem.dispatchEvent(clickEvent);

        // Wait for async operations and error handling
        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                expect.stringContaining("Error opening recent file"),
                "error"
            );
        });

        // Loading should be turned off and button re-enabled
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(openFileBtn.disabled).toBe(false);
    });

    it("window resize: no chart tabs active -> no chart update", async () => {
        expect.hasAssertions();

        // No chart tabs present or active
        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.ChartUpdater = {
            updateCharts: vi.fn<(reason?: string) => void>(),
        };

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        vi.advanceTimersByTime(210);
        vi.useRealTimers();

        // Should not call chart update when no chart tabs are active
        expect(document.getElementById("tab-chart")).toBeNull();
        expect(window.ChartUpdater.updateCharts).not.toHaveBeenCalled();
    });

    it("window resize: chart tab active with legacy renderChart fallback", async () => {
        expect.hasAssertions();

        // Prepare active chart tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        // Mock legacy renderChart fallback and ensure ChartUpdater and renderChartJS don't exist
        const renderChart = vi.fn<() => void>();
        Object.defineProperty(window, "renderChart", {
            configurable: true,
            value: renderChart,
            writable: true,
        });
        (window as any).ChartUpdater = undefined;
        (window as any).renderChartJS = undefined;

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        vi.advanceTimersByTime(210);
        vi.useRealTimers();

        expect(tab.classList.contains("active")).toBe(true);
        expect(renderChart).toHaveBeenCalledWith();
    });

    it("window resize: chartjs tab active with renderChartJS fallback", async () => {
        expect.hasAssertions();

        // Prepare active chartjs tab
        const tab = document.createElement("div");
        tab.id = "tab-chartjs";
        tab.classList.add("active");
        document.body.appendChild(tab);

        // Mock renderChartJS fallback and ensure ChartUpdater doesn't exist
        const renderChartJS = vi.fn<() => void>();
        Object.defineProperty(window, "renderChartJS", {
            configurable: true,
            value: renderChartJS,
            writable: true,
        });
        (window as any).ChartUpdater = undefined;

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        vi.advanceTimersByTime(210);
        vi.useRealTimers();

        expect(tab.id).toBe("tab-chartjs");
        expect(renderChartJS).toHaveBeenCalledWith();
    });

    it("decoder-options-changed: handles error during file reload", async () => {
        expect.hasAssertions();

        window.globalData = { cachedFilePath: "C:/tmp/sample.fit" } as any;
        vi.mocked(electronAPI.readFile).mockRejectedValue(
            new Error("File read failed")
        );

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        electronAPI.emit("decoder-options-changed", { speed: true });

        // Wait for async operations and error handling
        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                expect.stringContaining("Error reloading file"),
                "error"
            );
        });

        // Loading should be turned off
        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(openFileBtn.disabled).toBe(false);
    });

    it("export-file: handles unsupported file extensions", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.globalData = { some: "data" } as any;

        // Test unsupported extension
        await electronAPI.emit("export-file", {} as any, "C:/tmp/out.txt");

        // Should not call any notification or create download links
        expect(document.querySelectorAll("a")).toHaveLength(0);
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("export-file: csv without copyTableAsCSV function", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.globalData = { some: "data" } as any;
        (window as any).copyTableAsCSV = undefined;

        await electronAPI.emit("export-file", {} as any, "C:/tmp/out.csv");

        // Should not create download link without copyTableAsCSV
        const links = document.querySelectorAll("a");
        expect(links).toHaveLength(0);
    });

    it("export-file: csv without summary container", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.globalData = { some: "data" } as any;
        Object.defineProperty(window, "copyTableAsCSV", {
            configurable: true,
            value: vi.fn<CopyTableAsCsvMock>(() => "a,b\n1,2"),
            writable: true,
        });

        // Remove summary container
        document.querySelector("#content-summary")?.remove();

        await electronAPI.emit("export-file", {} as any, "C:/tmp/out.csv");

        // Should not create download link without container
        const links = document.querySelectorAll("a");
        expect(links).toHaveLength(0);
    });

    it("export-file: gpx without createExportGPXButton function", async () => {
        expect.hasAssertions();

        installURLMocks();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.globalData = {
            recordMesgs: [{ positionLat: 1 << 30, positionLong: 1 << 30 }],
        } as any;

        // Remove createExportGPXButton
        (window as any).createExportGPXButton = undefined;

        await electronAPI.emit("export-file", {} as any, "C:/tmp/out.gpx");

        expect(window.globalData.recordMesgs).toHaveLength(1);
        expect(showNotification).not.toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(
            expect.any(Blob)
        );
    });

    it("export-file: handles no globalData", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.globalData = undefined;

        await electronAPI.emit("export-file", {} as any, "C:/tmp/out.csv");

        // Should return early without action
        expect(document.querySelectorAll("a")).toHaveLength(0);
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("show-notification: handles undefined showNotification function", async () => {
        expect.hasAssertions();

        const originalShowNotification = showNotification;
        showNotification = undefined as any;

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Should not crash when showNotification is undefined
        expect(() => {
            electronAPI.emit("show-notification", "Hello", "info");
        }).not.toThrow();

        // Restore
        showNotification = originalShowNotification;
    });

    it("menu: handles missing electronAPI properties gracefully", async () => {
        expect.hasAssertions();

        // Create mock without some methods
        const limitedElectronAPI = {
            onIpc: vi.fn<(channel: string, cb: IpcHandler) => void>(),
            onUpdateEvent: vi.fn<(event: string, cb: IpcHandler) => void>(),
            // Missing onMenuOpenFile and onOpenRecentFile
        };

        Object.defineProperty(window, "electronAPI", {
            value: limitedElectronAPI,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "electronAPI", {
            value: limitedElectronAPI,
            writable: true,
            configurable: true,
        });

        // Should not crash when electronAPI is missing methods
        expect(() => {
            setupListeners({
                openFileBtn,
                isOpeningFileRef: { current: false },
                setLoading,
                showNotification,
                handleOpenFile,
                showUpdateNotification,
                showAboutModal,
            });
        }).not.toThrow();

        // Restore full electronAPI
        electronAPI = createElectronAPIMock();
        Object.defineProperty(window, "electronAPI", {
            value: electronAPI,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "electronAPI", {
            value: electronAPI,
            writable: true,
            configurable: true,
        });
    });

    it("menu: handles missing send method in electronAPI", async () => {
        expect.hasAssertions();

        const limitedElectronAPI = {
            ...electronAPI,
            send: undefined, // Remove send method
        };

        Object.defineProperty(window, "electronAPI", {
            value: limitedElectronAPI,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "electronAPI", {
            value: limitedElectronAPI,
            writable: true,
            configurable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Should not crash when send method is undefined
        expect(() => {
            electronAPI.emit("menu-check-for-updates");
            electronAPI.emit("menu-save-as");
            electronAPI.emit("menu-export");
        }).not.toThrow();

        // Restore full electronAPI
        electronAPI = createElectronAPIMock();
        Object.defineProperty(window, "electronAPI", {
            value: electronAPI,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "electronAPI", {
            value: electronAPI,
            writable: true,
            configurable: true,
        });
    });

    it("recent files context menu: removes old menu if exists", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Create first menu
        const evt1 = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt1);
        await Promise.resolve();

        const firstMenu = document.getElementById("recent-files-menu");
        expect(firstMenu).toBeInstanceOf(HTMLDivElement);

        // Create second menu (should remove first)
        const evt2 = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 20,
            clientY: 25,
        });
        openFileBtn.dispatchEvent(evt2);
        await Promise.resolve();

        const menus = document.querySelectorAll("#recent-files-menu");
        expect(menus).toHaveLength(1); // Only one menu should exist
    });

    it("recent files context menu: contextmenu event is prevented on menu", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(menu).toBeInstanceOf(HTMLDivElement);

        const preventDefault = vi.fn<() => void>();
        const contextMenuEvent = new MouseEvent("contextmenu", {
            bubbles: true,
        });
        Object.defineProperty(contextMenuEvent, "preventDefault", {
            value: preventDefault,
        });

        menu.dispatchEvent(contextMenuEvent);
        expect(preventDefault).toHaveBeenCalledWith();
    });

    it("recent files integration: calls sendFitFileToAltFitReader when available", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        const arrayBuf = new ArrayBuffer(8);
        vi.mocked(electronAPI.readFile).mockResolvedValue(arrayBuf);
        const parseResult = { data: createFitMessages() };
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(parseResult);
        vi.mocked(electronAPI.addRecentFile).mockResolvedValue(undefined);
        const showFitData = vi.fn<ShowFitDataMock>();
        const sendFitFileToAltFitReader =
            vi.fn<SendFitFileToAltFitReaderMock>();

        Object.defineProperty(window, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "showFitData", {
            value: showFitData,
            writable: true,
            configurable: true,
        });

        Object.defineProperty(window, "sendFitFileToAltFitReader", {
            value: sendFitFileToAltFitReader,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(globalThis, "sendFitFileToAltFitReader", {
            value: sendFitFileToAltFitReader,
            writable: true,
            configurable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);
        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        const clickEvent = new MouseEvent("click", { bubbles: true });
        firstItem.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
            expect(sendFitFileToAltFitReader).toHaveBeenCalledWith(arrayBuf);
        });
        expect(openFileBtn.disabled).toBe(false);
    });

    it("onOpenRecentFile integration: calls sendFitFileToAltFitReader when available", async () => {
        expect.hasAssertions();

        const arrayBuf = new ArrayBuffer(32);
        vi.mocked(electronAPI.readFile).mockResolvedValue(arrayBuf);
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(
            createFitMessages()
        );
        vi.mocked(electronAPI.addRecentFile).mockResolvedValue(undefined);

        const sendFitFileToAltFitReader =
            vi.fn<SendFitFileToAltFitReaderMock>();
        Object.defineProperty(globalThis, "sendFitFileToAltFitReader", {
            value: sendFitFileToAltFitReader,
            writable: true,
            configurable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        await electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");

        await vi.waitFor(() => {
            expect(sendFitFileToAltFitReader).toHaveBeenCalledWith(arrayBuf);
        });
        expect(openFileBtn.disabled).toBe(false);
    });

    it("onOpenRecentFile: handles exception during file processing", async () => {
        expect.hasAssertions();

        vi.mocked(electronAPI.readFile).mockRejectedValue(
            new Error("Network error")
        );

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        await electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");

        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                expect.stringContaining("Error opening recent file"),
                "error"
            );
        });

        expect(setLoading).toHaveBeenLastCalledWith(false);
        expect(openFileBtn.disabled).toBe(false);
    });

    // Tests for specific uncovered lines to achieve 100% coverage
    it("contextmenu: calls sendFitFileToAltFitReader when available (line 105)", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        const mockArrayBuffer = new ArrayBuffer(100);
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);
        vi.mocked(electronAPI.readFile).mockResolvedValue(mockArrayBuffer);
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(
            createFitMessages()
        );

        // Mock the integration function
        const sendFitFileToAltFitReader =
            vi.fn<SendFitFileToAltFitReaderMock>();
        const showFitData = vi.fn<ShowFitDataMock>();
        Object.defineProperty(globalThis, "sendFitFileToAltFitReader", {
            configurable: true,
            value: sendFitFileToAltFitReader,
            writable: true,
        });
        Object.defineProperty(globalThis, "showFitData", {
            configurable: true,
            value: showFitData,
            writable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        firstItem.click();

        await vi.waitFor(() => {
            expect(sendFitFileToAltFitReader).toHaveBeenCalledWith(
                mockArrayBuffer
            );
        });
        expect(openFileBtn.disabled).toBe(false);
    });

    it("contextmenu: calling origOnClick during item click (lines 200-201)", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        // Set original onclick handler before listener setup
        const origOnClick = vi.fn<() => void>();
        firstItem.onclick = origOnClick;

        // Click the item to trigger both cleanup and origOnClick
        const clickEvent = new MouseEvent("click", { bubbles: true });
        firstItem.dispatchEvent(clickEvent);

        await Promise.resolve();

        expect(document.body.contains(firstItem)).toBe(false);
        expect(origOnClick).toHaveBeenCalledWith(expect.any(MouseEvent));
    });

    it("contextmenu: Escape key triggers cleanupMenu (lines 181-182)", async () => {
        expect.hasAssertions();

        const files = ["C:/Users/Test/one.fit"];
        vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: 10,
            clientY: 15,
        });
        openFileBtn.dispatchEvent(evt);

        await Promise.resolve();

        const menu = document.getElementById(
            "recent-files-menu"
        ) as HTMLDivElement;
        expect(document.body.contains(menu)).toBe(true);

        // Press Escape key to trigger cleanupMenu
        const escapeEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true,
        });
        menu.dispatchEvent(escapeEvent);

        await Promise.resolve();

        // Menu should be removed from DOM
        expect(document.body.contains(menu)).toBe(false);
    });

    it("window resize: clearTimeout when timeout already exists (lines 218-219)", async () => {
        expect.hasAssertions();

        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        window.ChartUpdater = {
            updateCharts: vi.fn<(reason?: string) => void>(),
        };

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        vi.useFakeTimers();

        // First resize creates a timeout
        window.dispatchEvent(new Event("resize"));

        // Second resize should clear the first timeout before creating new one
        window.dispatchEvent(new Event("resize"));

        vi.advanceTimersByTime(210);
        vi.useRealTimers();

        expect(tab.classList.contains("active")).toBe(true);
        expect(window.ChartUpdater.updateCharts).toHaveBeenCalledWith(
            "window-resize"
        );
    });

    it("decoder-options-changed: catch block when file reload fails (line 279)", async () => {
        expect.hasAssertions();

        window.globalData = { cachedFilePath: "test.fit" };
        vi.mocked(electronAPI.readFile).mockRejectedValue(
            new Error("Read failed")
        );

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        electronAPI.emit("decoder-options-changed", { speed: true });

        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                "Error reloading file: Error: Read failed",
                "error"
            );
            expect(setLoading).toHaveBeenCalledWith(false);
        });
        expect(openFileBtn.disabled).toBe(false);
    });

    it("export-file: csv without copyTableAsCSV function (lines 317-318)", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Mock global state
        (globalThis as any).globalData = { data: "test" };

        // Setup #content-summary container (correct querySelector)
        const summaryContainer = document.createElement("div");
        summaryContainer.id = "content-summary";
        document.body.appendChild(summaryContainer);

        // Explicitly don't mock copyTableAsCSV function so it's undefined
        delete (window as any).copyTableAsCSV;

        electronAPI.emit("export-file", "test.csv");

        await Promise.resolve();

        // The function should complete without error - no else clause means no notification
        expect(document.querySelectorAll("a")).toHaveLength(0);
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("export-file: gpx with valid coordinates for setTimeout cleanup (lines 350-351)", async () => {
        expect.hasAssertions();

        // Mock createExportGPXButton to exist on globalThis
        const createExportGPXButton = vi.fn<CreateExportGpxButtonMock>(
            () => true
        );
        Object.defineProperty(globalThis, "createExportGPXButton", {
            configurable: true,
            value: createExportGPXButton,
            writable: true,
        });

        // Create valid coordinate data in semicircle format
        // Coordinates in semicircles: lat/lng * 2^31 / 180
        const semicircleConversion = (degrees: number) =>
            Math.round((degrees * 2 ** 31) / 180);

        // Mock globalData with valid coordinates
        (globalThis as any).globalData = {
            recordMesgs: [
                {
                    positionLat: semicircleConversion(40.7589), // NYC latitude in semicircles
                    positionLong: semicircleConversion(-73.9851), // NYC longitude in semicircles
                    timestamp: 1000000,
                },
                {
                    positionLat: semicircleConversion(40.7614), // Another NYC point
                    positionLong: semicircleConversion(-73.9776),
                    timestamp: 1000001,
                },
            ],
        };

        const createObjectURL = vi.fn<CreateObjectUrlMock>(
            () => "blob:test-url"
        );
        const revokeObjectURL = vi.fn<RevokeObjectUrlMock>();
        Object.defineProperty(global.URL, "createObjectURL", {
            configurable: true,
            value: createObjectURL,
            writable: true,
        });
        Object.defineProperty(global.URL, "revokeObjectURL", {
            configurable: true,
            value: revokeObjectURL,
            writable: true,
        });

        // Mock Blob constructor - must be a proper constructor function
        const blobMock = vi.fn<BlobMock>(function BlobMock(
            parts: any[],
            options: any
        ) {
            return {
                parts,
                options,
                type: options?.type || "",
            };
        });
        Object.defineProperty(global, "Blob", {
            configurable: true,
            value: blobMock,
            writable: true,
        });

        // Mock document.body.append and createElement
        const mockAnchorElement = {
            href: "",
            download: "",
            click: vi.fn<AnchorClickMock>(),
            remove: vi.fn<AnchorRemoveMock>(),
        } as unknown as HTMLAnchorElement;
        const createElement = vi.fn<CreateTestAnchorMock>(
            () => mockAnchorElement
        );
        Object.defineProperty(document, "createElement", {
            configurable: true,
            value: createElement,
            writable: true,
        });
        const append = vi.fn<AppendNodeMock>();
        Object.defineProperty(document.body, "append", {
            configurable: true,
            value: append,
            writable: true,
        });

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        vi.useFakeTimers();

        // Emit with the proper format that matches the listener expectations
        // The export-file handler expects (_event, filePath) - two parameters!
        electronAPI.emit("export-file", {} as any, "test-file.gpx");

        await Promise.resolve();

        // Verify the download path was triggered first
        expect((globalThis as any).globalData.recordMesgs).toHaveLength(2);
        expect(blobMock).toHaveBeenCalledWith(
            [expect.stringContaining("<gpx")],
            { type: "application/gpx+xml;charset=utf-8" }
        );
        expect(createObjectURL).toHaveBeenCalledWith(
            blobMock.mock.results[0].value
        );
        expect(mockAnchorElement.click).toHaveBeenCalledWith();

        // Advance timers to trigger the setTimeout cleanup callback
        vi.advanceTimersByTime(100);

        expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
        expect(mockAnchorElement.remove).toHaveBeenCalledWith();

        vi.useRealTimers();
    });

    it("menu events: handles keyboard shortcuts without script function (lines 402-409)", async () => {
        expect.hasAssertions();

        // Remove any existing script function to trigger the error path
        delete (window as any).showKeyboardShortcutsModal;

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // First time - should try to load script
        electronAPI.emit("menu-keyboard-shortcuts");

        // Wait for script loading attempt and error handling
        await vi.waitFor(() => {
            expect(
                dependencyMocks.keyboardShortcutsModal
            ).toHaveBeenCalledWith();
        });
        expect((globalThis as any).showKeyboardShortcutsModal).toBe(
            dependencyMocks.keyboardShortcutsModal
        );

        // Second time - should go through already loaded path
        electronAPI.emit("menu-keyboard-shortcuts");

        await vi.waitFor(() => {
            expect(
                dependencyMocks.keyboardShortcutsModal
            ).toHaveBeenCalledTimes(2);
        });
    });

    it(
        "error handling: parse error without details (line 105)",
        { timeout: 15000 },
        async () => {
            expect.hasAssertions();

            // Mock recent files as strings (this test targets recent file click handler)
            const files = ["/path/to/test.fit"];
            vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

            vi.mocked(electronAPI.readFile).mockResolvedValue(
                new ArrayBuffer(8)
            );
            vi.mocked(electronAPI.parseFitFile).mockResolvedValue({
                error: "Parse error",
                // No details property
            });

            setupListeners({
                openFileBtn,
                isOpeningFileRef: { current: false },
                setLoading,
                showNotification,
                handleOpenFile,
                showUpdateNotification,
                showAboutModal,
            });

            // Right-click to open context menu
            const contextEvent = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 100,
            });
            openFileBtn.dispatchEvent(contextEvent);

            // Wait for the async recentFiles call to complete and menu to be created
            await vi.waitFor(
                () => {
                    const contextMenu =
                        document.getElementById("recent-files-menu");
                    return contextMenu !== null;
                },
                { timeout: 15000, interval: 100 }
            );

            const contextMenu = document.getElementById("recent-files-menu");
            expect(contextMenu).toBeInstanceOf(HTMLDivElement);

            // Mock error result without details
            vi.mocked(electronAPI.readFile).mockResolvedValue(
                new ArrayBuffer(8)
            );
            vi.mocked(electronAPI.parseFitFile).mockResolvedValue({
                error: "Parse error",
                // No details property
            });

            // Click the menu item to trigger the error path
            const menu = document.getElementById("recent-files-menu");
            const menuItem = expectHtmlDivElement(
                menu?.querySelector("div[role='menuitem']"),
                "Expected recent file menu item."
            );
            menuItem.click();

            await vi.waitFor(() => {
                expect(showNotification).toHaveBeenCalledWith(
                    "Error: Parse error",
                    "error"
                );
            });

            // Explicit cleanup of context menu to prevent interference with subsequent tests
            const cleanupMenu = document.querySelector("#recent-files-menu");
            cleanupMenu?.remove();
        }
    );

    it(
        "context menu: cleanup on mousedown (lines 181-182)",
        { timeout: 15000 },
        async () => {
            expect.hasAssertions();

            // Mock recent files as string array
            const files = ["/path/to/file1.fit"];
            vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

            setupListeners({
                openFileBtn,
                isOpeningFileRef: { current: false },
                setLoading,
                showNotification,
                handleOpenFile,
                showUpdateNotification,
                showAboutModal,
            });

            // Right-click to open context menu
            const contextEvent = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 100,
            });
            openFileBtn.dispatchEvent(contextEvent);

            // Wait for the async recentFiles call to complete and menu to be created
            await vi.waitFor(
                () => {
                    const menu = document.getElementById("recent-files-menu");
                    return menu !== null;
                },
                { timeout: 15000, interval: 100 }
            );

            const menu = document.getElementById("recent-files-menu");
            expect(menu).toBeInstanceOf(HTMLDivElement);

            // Trigger mousedown to cleanup
            const mousedownEvent = new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(mousedownEvent);

            // Menu should be removed
            const removedMenu = document.getElementById("recent-files-menu");
            expect(removedMenu).toBeNull();
        }
    );

    it(
        "context menu: handles onclick function (lines 200-201)",
        { timeout: 15000 },
        async () => {
            expect.hasAssertions();

            // Mock recent files
            const files = ["/path/to/file1.fit"];
            vi.mocked(electronAPI.recentFiles).mockResolvedValue(files);

            setupListeners({
                openFileBtn,
                isOpeningFileRef: { current: false },
                setLoading,
                showNotification,
                handleOpenFile,
                showUpdateNotification,
                showAboutModal,
            });

            // Right-click to open context menu
            const contextEvent = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 100,
                clientY: 100,
            });
            openFileBtn.dispatchEvent(contextEvent);

            // Wait for the async recentFiles call to complete and menu to be created
            await vi.waitFor(
                () => {
                    const menu = document.getElementById("recent-files-menu");
                    return menu !== null;
                },
                { timeout: 15000, interval: 100 }
            );

            // Find the menu item (first child div of the menu)
            const menu = document.getElementById("recent-files-menu");
            expect(menu).toBeInstanceOf(HTMLDivElement);
            const menuItem = expectHtmlDivElement(
                menu?.querySelector("div[role='menuitem']"),
                "Expected recent file menu item."
            );

            // Set a mock onclick function to test the original onclick call path
            const mockOnclick = vi.fn<() => void>();
            menuItem.onclick = mockOnclick;

            // Click the menu item
            menuItem.dispatchEvent(
                new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true,
                })
            );

            // Wait for the click handler to complete
            await vi.waitFor(() => {
                expect(mockOnclick).toHaveBeenCalledWith(
                    expect.any(MouseEvent)
                );
            });

            // Explicit cleanup of context menu to prevent interference with subsequent tests
            const finalCleanupMenu =
                document.querySelector("#recent-files-menu");
            finalCleanupMenu?.remove();
        }
    );

    it("decoder options: error case (line 279)", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Setup globalData with cachedFilePath (not appCache)
        (globalThis as any).globalData = { cachedFilePath: "/test/file.fit" };

        // Mock error in file reload
        vi.mocked(electronAPI.readFile).mockRejectedValue(
            new Error("File read failed")
        );

        // Trigger decoder options changed
        electronAPI.emit("decoder-options-changed", { speed: true });

        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                "Error reloading file: Error: File read failed",
                "error"
            );
        });
        expect(openFileBtn.disabled).toBe(false);
    });

    it("export CSV: missing copyTableAsCSV function (lines 317-318)", async () => {
        expect.hasAssertions();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Mock global state
        (globalThis as any).globalData = { data: "test" };

        // Setup #content-summary container (correct querySelector)
        const summaryContainer = document.createElement("div");
        summaryContainer.id = "content-summary";
        document.body.appendChild(summaryContainer);

        // Remove copyTableAsCSV function to trigger fallback
        delete (globalThis as any).copyTableAsCSV;

        electronAPI.emit("export-file", {} as any, "test-file.csv");

        await Promise.resolve();

        // Since there's no error message in the actual code for missing copyTableAsCSV,
        // we verify that nothing happens (no download link created)
        const downloadLink = document.querySelector("a[download]");
        expect(downloadLink).toBeNull();
    });
});

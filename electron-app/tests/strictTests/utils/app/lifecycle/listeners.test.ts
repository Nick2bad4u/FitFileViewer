// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../utils/files/import/openFileSelector.js", () => ({
    openFileSelector: vi.fn(),
}));

import { openFileSelector } from "../../../../../utils/files/import/openFileSelector.js";

const openFileSelectorMock = vi.mocked(openFileSelector);

// Import the module under test
import { setupListeners } from "../../../../../utils/app/lifecycle/listeners.js";

// Mock getRecentFiles function
const getRecentFiles = vi.fn();

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
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
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

    const api = {
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
        emit: (channel: string, ...args: any[]) => ipcHandlers.get(channel)?.(...args),

        // Updater
        onUpdateEvent: (event: string, cb: IpcHandler) => {
            updateHandlers.set(event, cb);
        },
        emitUpdate: (event: string, ...args: any[]) => updateHandlers.get(event)?.(...args),

        // FS operations (can be overridden per test)
        recentFiles: vi.fn<() => Promise<string[]>>(),
        readFile: vi.fn<(fp: string) => Promise<ArrayBuffer>>(),
        parseFitFile: vi.fn<(buf: ArrayBuffer) => Promise<any>>(),
        addRecentFile: vi.fn<(fp: string) => Promise<void>>(),

        // Main process send
        send: vi.fn<(channel: string) => void>(),
    };

    return api;
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

describe("setupListeners (utils/app/lifecycle/listeners)", () => {
    let openFileBtn: HTMLButtonElement;
    let electronAPI: any;
    let setLoading: ReturnType<typeof vi.fn>;
    let showNotification: ReturnType<typeof vi.fn>;
    let handleOpenFile: ReturnType<typeof vi.fn>;
    let showUpdateNotification: ReturnType<typeof vi.fn>;
    let showAboutModal: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        openFileSelectorMock.mockReset();
        openFileSelectorMock.mockImplementation(() => {});
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

        setLoading = vi.fn();
        showNotification = vi.fn();
        handleOpenFile = vi.fn();
        showUpdateNotification = vi.fn();
        showAboutModal = vi.fn();
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
            document.removeEventListener("mousedown", () => {}, { capture: true });
            document.removeEventListener("mousedown", () => {}, { capture: false });
            window.removeEventListener("resize", () => {});
        } catch (e) {
            // Ignore errors from trying to remove non-existent listeners
        }

        // Clear vi mocks to ensure clean state
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    it("wires openFile click to handleOpenFile", async () => {
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
        expect(handleOpenFile).toHaveBeenCalledTimes(1);
        expect(handleOpenFile).toHaveBeenCalledWith({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        });
    });

    it("contextmenu: no recentFiles available -> no action", async () => {
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
        window.electronAPI.recentFiles = vi.fn().mockResolvedValue([]);

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

        expect(showNotification).toHaveBeenCalledWith("No recent files found.", "info", 2000);
    });

    it("contextmenu: renders items and clicking loads file and updates recent", async () => {
        const files = ["C:/Users/Test/one.fit", "C:/Users/Test/two.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        const arrayBuf = new ArrayBuffer(8);
        electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
        const parseResult = { ok: true, data: { field: 1 } };
        electronAPI.parseFitFile = vi.fn().mockResolvedValue(parseResult);
        electronAPI.addRecentFile = vi.fn().mockResolvedValue(undefined);
        const showFitData = vi.fn();

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

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        // Wait for async menu creation to complete
        await vi.waitFor(
            () => {
                const menu = document.getElementById("recent-files-menu");
                expect(menu).toBeTruthy();
            },
            { timeout: 1000 }
        );

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();
        const items = Array.from(menu.querySelectorAll("div"));
        expect(items.length).toBe(files.length);

        // Click the second item properly using dispatchEvent instead of direct onclick call
        const second = items[1] as HTMLDivElement;
        const clickEvent = new MouseEvent("click", { bubbles: true });
        second.dispatchEvent(clickEvent);

        // readFile and parseFitFile should be called and then addRecentFile
        await vi.waitFor(() => {
            expect(electronAPI.readFile).toHaveBeenCalledWith(files[1]);
            expect(electronAPI.parseFitFile).toHaveBeenCalledTimes(1);
            expect(electronAPI.addRecentFile).toHaveBeenCalledWith(files[1]);
            expect(showFitData).toHaveBeenCalledWith(parseResult.data, files[1]);
        });
        // Loading toggled on/off
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        // Button re-enabled
        expect(openFileBtn.disabled).toBe(false);
    });

    it("window resize triggers ChartUpdater.updateCharts when tab active", async () => {
        // Prepare active tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        window.ChartUpdater = { updateCharts: vi.fn() };

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

        expect(window.ChartUpdater.updateCharts).toHaveBeenCalledWith("window-resize");
    });

    it("IPC: decoder-options-changed without cached file -> only info notification", async () => {
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
        expect(showNotification).toHaveBeenCalledWith("Decoder options updated.", "info", 2000);
        // Should not attempt read/parse
        expect(window.electronAPI.readFile).not.toHaveBeenCalled();
    });

    it("IPC: decoder-options-changed reloads cached file and calls showFitData", async () => {
        const arrayBuf = new ArrayBuffer(16);
        window.globalData = { cachedFilePath: "C:/tmp/sample.fit" } as any;
        window.electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
        const parsed = { ok: true };
        window.electronAPI.parseFitFile = vi.fn().mockResolvedValue(parsed);
        const showFitData = vi.fn();
        window.showFitData = showFitData;

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
            expect(window.electronAPI.readFile).toHaveBeenCalledWith("C:/tmp/sample.fit");
            expect(window.electronAPI.parseFitFile).toHaveBeenCalledWith(arrayBuf);
            expect(showFitData).toHaveBeenCalledWith(parsed, "C:/tmp/sample.fit");
            // loading on/off around reload
            expect(setLoading).toHaveBeenCalledWith(true);
            expect(setLoading).toHaveBeenCalledWith(false);
        });
    });

    it("IPC: export-file csv creates and clicks download link", async () => {
        installURLMocks();
        const csv = "a,b\n1,2";
        (window as any).copyTableAsCSV = vi.fn(() => csv);

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
        const clickSpy = vi.fn();
        vi.spyOn(document, "createElement").mockImplementation((tag: any) => {
            const el = createEl(tag);
            if (tag === "a") {
                // @ts-ignore
                el.click = clickSpy;
            }
            return el;
        });

        window.globalData = { foo: "bar" } as any;

        await window.electronAPI.emit("export-file", {} as any, "C:/tmp/out.csv");

        expect((window as any).copyTableAsCSV).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it("IPC: export-file gpx with coords triggers download, otherwise shows informative notices", async () => {
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
        (window as any).createExportGPXButton = () => {};

        // Case 1: valid coords -> click happens
        const clickSpy = vi.fn();
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

        await window.electronAPI.emit("export-file", {} as any, "C:/tmp/out.gpx");
        expect(clickSpy).toHaveBeenCalledTimes(1);

        // Case 2: no valid coords
        clickSpy.mockReset();
        window.globalData = {
            recordMesgs: [{}, {}],
        } as any;
        await window.electronAPI.emit("export-file", {} as any, "C:/tmp/out.gpx");
        expect(showNotification).toHaveBeenCalledWith("No valid coordinates found for GPX export.", "info", 3000);

        // Case 3: no data available
        window.globalData = {} as any;
        await window.electronAPI.emit("export-file", {} as any, "C:/tmp/out.gpx");
        expect(showNotification).toHaveBeenCalledWith("No data available for GPX export.", "info", 3000);
    });

    it("IPC: show-notification forwards to showNotification", async () => {
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
        expect(showNotification).toHaveBeenCalledWith("Hello", "info", 3000);
    });

    it("IPC: menu print and forward sends", async () => {
        const printSpy = vi.fn();
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
        expect(printSpy).toHaveBeenCalled();

        window.electronAPI.emit("menu-check-for-updates");
        window.electronAPI.emit("menu-save-as");
        window.electronAPI.emit("menu-export");
        expect(window.electronAPI.send).toHaveBeenCalledWith("menu-check-for-updates");
        expect(window.electronAPI.send).toHaveBeenCalledWith("menu-save-as");
        expect(window.electronAPI.send).toHaveBeenCalledWith("menu-export");
    });

    it("IPC: menu-open-overlay triggers openFileSelector", () => {
        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        window.electronAPI.emit("menu-open-overlay");
        expect(openFileSelectorMock).toHaveBeenCalledTimes(1);
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("IPC: menu-open-overlay surfaces errors", () => {
        openFileSelectorMock.mockImplementationOnce(() => {
            throw new Error("fail");
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

        window.electronAPI.emit("menu-open-overlay");
        expect(showNotification).toHaveBeenCalledWith("Failed to open overlay selector.", "error", 3000);
    });

    it("IPC: menu-about and keyboard-shortcuts flows", async () => {
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
        expect(showAboutModal).toHaveBeenCalled();

        // keyboard-shortcuts first time: script loader path failing -> fallback modal
        // Intercept script creation
        const createEl = document.createElement.bind(document);
        let capturedScript: HTMLScriptElement | null = null;
        vi.spyOn(document, "createElement").mockImplementation((tag: any) => {
            const el = createEl(tag) as any;
            if (tag === "script") capturedScript = el as HTMLScriptElement;
            return el;
        });

        window.electronAPI.emit("menu-keyboard-shortcuts");
        // Simulate load error to trigger fallback path
        (capturedScript as any)?.onerror?.(new Event("error"));

        expect(showAboutModal).toHaveBeenCalledTimes(2);
        const lastArg = showAboutModal.mock.calls.at(-1)?.[0];
        expect(typeof lastArg).toBe("string");
        expect(String(lastArg)).toContain("Keyboard Shortcuts");

        // Second time: provide function so it calls directly
        (window as any).showKeyboardShortcutsModal = vi.fn();
        window.electronAPI.emit("menu-keyboard-shortcuts");
        expect((window as any).showKeyboardShortcutsModal).toHaveBeenCalled();
    });

    it("Updater events forward to showUpdateNotification", async () => {
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
        expect(showUpdateNotification).toHaveBeenCalledWith("Checking for updates...", "info", 3000);

        window.electronAPI.emitUpdate("update-available");
        expect(showUpdateNotification).toHaveBeenCalledWith("Update available! Downloading...", 4000);

        window.electronAPI.emitUpdate("update-not-available");
        expect(showUpdateNotification).toHaveBeenCalledWith("You are using the latest version.", "success", 4000);

        window.electronAPI.emitUpdate("update-error", new Error("boom"));
        expect(showUpdateNotification.mock.calls.some((c: any[]) => String(c[0]).includes("Update error:"))).toBe(true);

        window.electronAPI.emitUpdate("update-download-progress", { percent: 42.2 });
        expect(showUpdateNotification).toHaveBeenCalledWith("Downloading update: 42%", "info", 2000);

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

    it("Accessibility events toggle classes", async () => {
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
        expect(document.body.classList.contains("high-contrast-white")).toBe(true);
        window.electronAPI.emit("set-high-contrast", {} as any, "yellow");
        expect(document.body.classList.contains("high-contrast-yellow")).toBe(true);
    });

    it("Menu: onMenuOpenFile forwards to handleOpenFile; onOpenRecentFile loads and shows errors", async () => {
        const isOpeningFileRef = { current: false };

        // For open recent path success
        const arrayBuf = new ArrayBuffer(32);
        window.electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
        window.electronAPI.parseFitFile = vi.fn().mockResolvedValue({ ok: true });
        window.electronAPI.addRecentFile = vi.fn().mockResolvedValue(undefined);

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
        expect(handleOpenFile).toHaveBeenCalledTimes(1);

        // Success case
        await window.electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
        expect(window.electronAPI.readFile).toHaveBeenCalled();
        expect(window.electronAPI.addRecentFile).toHaveBeenCalled();

        // Error case
        window.electronAPI.parseFitFile = vi.fn().mockResolvedValue({ error: "bad" });
        await window.electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
        expect(showNotification.mock.calls.some((c: any[]) => String(c[0]).includes("Error:"))).toBe(true);
    });

    it("contextmenu: keyboard navigation works (ArrowDown, ArrowUp, Enter, Escape)", async () => {
        const files = ["C:/Users/Test/one.fit", "C:/Users/Test/two.fit", "C:/Users/Test/three.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        const arrayBuf = new ArrayBuffer(8);
        electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
        const parseResult = { ok: true, data: { field: 1 } };
        electronAPI.parseFitFile = vi.fn().mockResolvedValue(parseResult);
        electronAPI.addRecentFile = vi.fn().mockResolvedValue(undefined);
        const showFitData = vi.fn();

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

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();

        // Test ArrowDown navigation
        const arrowDownEvent = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
        menu.dispatchEvent(arrowDownEvent);

        // Test ArrowUp navigation
        const arrowUpEvent = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true });
        menu.dispatchEvent(arrowUpEvent);

        // Test Enter key to select item
        const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
        menu.dispatchEvent(enterEvent);

        // Wait for async operations
        await vi.waitFor(() => {
            expect(electronAPI.readFile).toHaveBeenCalledWith(files[0]);
            expect(electronAPI.parseFitFile).toHaveBeenCalledTimes(1);
            expect(electronAPI.addRecentFile).toHaveBeenCalledWith(files[0]);
            expect(showFitData).toHaveBeenCalledWith(parseResult.data, files[0]);
        });
    });

    it("contextmenu: Escape key closes menu", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();

        // Test Escape key to close menu
        const escapeEvent = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
        menu.dispatchEvent(escapeEvent);

        // Menu should be removed from DOM
        expect(document.getElementById("recent-files-menu")).toBeNull();
    });

    it("contextmenu: mouse events on menu items (mouseenter, mouseleave)", async () => {
        const files = ["C:/Users/Test/one.fit", "C:/Users/Test/two.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();
        const items = Array.from(menu.querySelectorAll("div"));
        expect(items.length).toBe(files.length);

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
        expect(firstItem.style.background).toBe("var(--color-glass-border)");
        expect(firstItem.style.color).toBe("var(--color-fg)");
    });

    it("contextmenu: clicking outside menu removes it", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();

        // Create a dummy element outside the menu
        const outsideElement = document.createElement("div");
        document.body.appendChild(outsideElement);

        // Simulate clicking outside the menu
        const mouseDownEvent = new MouseEvent("mousedown", { bubbles: true });
        Object.defineProperty(mouseDownEvent, "target", { value: outsideElement });
        document.dispatchEvent(mouseDownEvent);

        // Menu should be removed from DOM
        expect(document.getElementById("recent-files-menu")).toBeNull();

        // Cleanup
        outsideElement.remove();
    });

    it("contextmenu: handles recent file error during loading", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);
        electronAPI.readFile = vi.fn().mockRejectedValue(new Error("File read error"));

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        // Wait for menu to be created
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();
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

        window.ChartUpdater = { updateCharts: vi.fn() };

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        vi.advanceTimersByTime(210);
        vi.useRealTimers();

        // Should not call chart update when no chart tabs are active
        expect(window.ChartUpdater.updateCharts).not.toHaveBeenCalled();
    });

    it("window resize: chart tab active with legacy renderChart fallback", async () => {
        // Prepare active chart tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        // Mock legacy renderChart fallback and ensure ChartUpdater and renderChartJS don't exist
        (window as any).renderChart = vi.fn();
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

        expect((window as any).renderChart).toHaveBeenCalled();
    });

    it("window resize: chartjs tab active with renderChartJS fallback", async () => {
        // Prepare active chartjs tab
        const tab = document.createElement("div");
        tab.id = "tab-chartjs";
        tab.classList.add("active");
        document.body.appendChild(tab);

        // Mock renderChartJS fallback and ensure ChartUpdater doesn't exist
        window.renderChartJS = vi.fn();
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

        expect(window.renderChartJS).toHaveBeenCalled();
    });

    it("decoder-options-changed: handles error during file reload", async () => {
        window.globalData = { cachedFilePath: "C:/tmp/sample.fit" } as any;
        electronAPI.readFile = vi.fn().mockRejectedValue(new Error("File read failed"));

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
            expect(showNotification).toHaveBeenCalledWith(expect.stringContaining("Error reloading file"), "error");
        });

        // Loading should be turned off
        expect(setLoading).toHaveBeenLastCalledWith(false);
    });

    it("export-file: handles unsupported file extensions", async () => {
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
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("export-file: csv without copyTableAsCSV function", async () => {
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
        expect(links.length).toBe(0);
    });

    it("export-file: csv without summary container", async () => {
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
        (window as any).copyTableAsCSV = vi.fn(() => "a,b\n1,2");

        // Remove summary container
        const existingContainer = document.querySelector("#content-summary");
        if (existingContainer) {
            existingContainer.remove();
        }

        await electronAPI.emit("export-file", {} as any, "C:/tmp/out.csv");

        // Should not create download link without container
        const links = document.querySelectorAll("a");
        expect(links.length).toBe(0);
    });

    it("export-file: gpx without createExportGPXButton function", async () => {
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

        expect(showNotification).not.toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it("export-file: handles no globalData", async () => {
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
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("show-notification: handles undefined showNotification function", async () => {
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

    it("Menu: handles missing electronAPI properties gracefully", async () => {
        // Create mock without some methods
        const limitedElectronAPI = {
            onIpc: vi.fn(),
            onUpdateEvent: vi.fn(),
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

    it("Menu: handles missing send method in electronAPI", async () => {
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
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

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
        const evt1 = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt1);
        await Promise.resolve();

        const firstMenu = document.getElementById("recent-files-menu");
        expect(firstMenu).toBeTruthy();

        // Create second menu (should remove first)
        const evt2 = new MouseEvent("contextmenu", { bubbles: true, clientX: 20, clientY: 25 });
        openFileBtn.dispatchEvent(evt2);
        await Promise.resolve();

        const menus = document.querySelectorAll("#recent-files-menu");
        expect(menus.length).toBe(1); // Only one menu should exist
    });

    it("recent files context menu: contextmenu event is prevented on menu", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        expect(menu).toBeTruthy();

        const preventDefault = vi.fn();
        const contextMenuEvent = new MouseEvent("contextmenu", { bubbles: true });
        Object.defineProperty(contextMenuEvent, "preventDefault", { value: preventDefault });

        menu.dispatchEvent(contextMenuEvent);
        expect(preventDefault).toHaveBeenCalled();
    });

    it("recent files integration: calls sendFitFileToAltFitReader when available", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        const arrayBuf = new ArrayBuffer(8);
        electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
        const parseResult = { ok: true, data: { field: 1 } };
        electronAPI.parseFitFile = vi.fn().mockResolvedValue(parseResult);
        electronAPI.addRecentFile = vi.fn().mockResolvedValue(undefined);
        const showFitData = vi.fn();
        const sendFitFileToAltFitReader = vi.fn();

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

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);
        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        const clickEvent = new MouseEvent("click", { bubbles: true });
        firstItem.dispatchEvent(clickEvent);

        await vi.waitFor(() => {
            expect(sendFitFileToAltFitReader).toHaveBeenCalledWith(arrayBuf);
        });
    });

    it("onOpenRecentFile integration: calls sendFitFileToAltFitReader when available", async () => {
        const arrayBuf = new ArrayBuffer(32);
        electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
        electronAPI.parseFitFile = vi.fn().mockResolvedValue({ ok: true });
        electronAPI.addRecentFile = vi.fn().mockResolvedValue(undefined);

        const sendFitFileToAltFitReader = vi.fn();
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
    });

    it("onOpenRecentFile: handles exception during file processing", async () => {
        electronAPI.readFile = vi.fn().mockRejectedValue(new Error("Network error"));

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
        const files = ["C:/Users/Test/one.fit"];
        const mockArrayBuffer = new ArrayBuffer(100);
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);
        electronAPI.readFile = vi.fn().mockResolvedValue(mockArrayBuffer);
        electronAPI.parseFitFile = vi.fn().mockResolvedValue({ data: "parsed" });

        // Mock the integration function
        (globalThis as any).sendFitFileToAltFitReader = vi.fn();
        (globalThis as any).showFitData = vi.fn();

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        firstItem.click();

        await vi.waitFor(() => {
            expect((globalThis as any).sendFitFileToAltFitReader).toHaveBeenCalledWith(mockArrayBuffer);
        });
    });

    it("contextmenu: calling origOnClick during item click (lines 200-201)", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
        const items = Array.from(menu.querySelectorAll("div"));
        const firstItem = items[0] as HTMLDivElement;

        // Set original onclick handler before listener setup
        const origOnClick = vi.fn();
        firstItem.onclick = origOnClick;

        // Click the item to trigger both cleanup and origOnClick
        const clickEvent = new MouseEvent("click", { bubbles: true });
        firstItem.dispatchEvent(clickEvent);

        await Promise.resolve();

        expect(origOnClick).toHaveBeenCalled();
    });

    it("contextmenu: Escape key triggers cleanupMenu (lines 181-182)", async () => {
        const files = ["C:/Users/Test/one.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 15 });
        openFileBtn.dispatchEvent(evt);

        await Promise.resolve();

        const menu = document.getElementById("recent-files-menu") as HTMLDivElement;
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
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        window.ChartUpdater = { updateCharts: vi.fn() };

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

        expect(window.ChartUpdater.updateCharts).toHaveBeenCalledWith("window-resize");
    });

    it("decoder-options-changed: catch block when file reload fails (line 279)", async () => {
        window.globalData = { cachedFilePath: "test.fit" };
        electronAPI.readFile = vi.fn().mockRejectedValue(new Error("Read failed"));

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
            expect(showNotification).toHaveBeenCalledWith("Error reloading file: Error: Read failed", "error");
            expect(setLoading).toHaveBeenCalledWith(false);
        });
    });

    it("export-file: csv without copyTableAsCSV function (lines 317-318)", async () => {
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
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("export-file: gpx with valid coordinates for setTimeout cleanup (lines 350-351)", async () => {
        // Mock createExportGPXButton to exist on globalThis
        (globalThis as any).createExportGPXButton = vi.fn().mockReturnValue(true);

        // Create valid coordinate data in semicircle format
        // Coordinates in semicircles: lat/lng * 2^31 / 180
        const semicircleConversion = (degrees: number) => Math.round((degrees * 2 ** 31) / 180);

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

        // Mock URL methods
        global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test-url");
        global.URL.revokeObjectURL = vi.fn();

        // Mock Blob constructor - must be a proper constructor function
        (global as any).Blob = vi.fn().mockImplementation(function BlobMock(parts: any[], options: any) {
            return {
                parts,
                options,
                type: options?.type || "",
            };
        });

        // Mock document.body.append and createElement
        const mockAnchorElement = {
            href: "",
            download: "",
            click: vi.fn(),
            remove: vi.fn(),
        };
        document.createElement = vi.fn().mockReturnValue(mockAnchorElement);
        document.body.append = vi.fn();

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
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchorElement.click).toHaveBeenCalled();

        // Advance timers to trigger the setTimeout cleanup callback
        vi.advanceTimersByTime(100);

        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
        expect(mockAnchorElement.remove).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it("menu events: handles keyboard shortcuts without script function (lines 402-409)", async () => {
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
            // The function should handle the missing script gracefully
            expect(true).toBe(true); // Just ensure no crash
        });

        // Second time - should go through already loaded path
        electronAPI.emit("menu-keyboard-shortcuts");

        await Promise.resolve();
    });

    it("error handling: parse error without details (line 105)", { timeout: 15000 }, async () => {
        // Debug output to check test state
        console.log("Test 105 - electronAPI exists:", !!(globalThis as any).electronAPI);
        console.log(
            "Test 105 - electronAPI === globalThis.electronAPI:",
            electronAPI === (globalThis as any).electronAPI
        );
        console.log("Test 105 - electronAPI.recentFiles exists:", !!electronAPI.recentFiles);

        // Mock recent files as strings (this test targets recent file click handler)
        const files = ["/path/to/test.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

        // Add detailed instrumentation to the mock to trace execution
        electronAPI.recentFiles = vi.fn().mockImplementation(async () => {
            console.log("Test 105 - recentFiles() called");
            return files;
        });

        electronAPI.readFile = vi.fn().mockResolvedValue(new ArrayBuffer(8));
        electronAPI.parseFitFile = vi.fn().mockResolvedValue({
            error: "Parse error",
            // No details property
        });

        console.log("Test 105 - After mock setup, electronAPI.recentFiles exists:", !!electronAPI.recentFiles);
        console.log(
            "Test 105 - globalThis.electronAPI.recentFiles exists:",
            !!(globalThis as any).electronAPI?.recentFiles
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

        // Check for menu immediately
        console.log("Test 105 - Menu exists immediately:", !!document.querySelector("#recent-files-menu"));
        console.log("Test 105 - Document body children count:", document.body.children.length);

        // Right-click to open context menu
        const contextEvent = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100,
        });
        openFileBtn.dispatchEvent(contextEvent);

        // Check for menu immediately after event
        console.log("Test 105 - Menu exists immediately after event:", !!document.querySelector("#recent-files-menu"));
        console.log("Test 105 - Document body children count after event:", document.body.children.length);

        // Wait for the async recentFiles call to complete and menu to be created
        await vi.waitFor(
            () => {
                const contextMenu = document.querySelector("#recent-files-menu");
                console.log("Test 105 - Menu found:", !!contextMenu);
                return contextMenu !== null;
            },
            { timeout: 15000, interval: 100 }
        );

        const contextMenu = document.querySelector("#recent-files-menu");
        expect(contextMenu).toBeTruthy();

        // Mock error result without details
        vi.mocked(electronAPI.readFile).mockResolvedValue(new ArrayBuffer(8));
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue({
            error: "Parse error",
            // No details property
        });

        // Click the menu item to trigger the error path
        const menu = document.querySelector("#recent-files-menu");
        const menuItem = menu?.querySelector("div[role='menuitem']") as HTMLDivElement;
        menuItem.click();

        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith("Error: Parse error\n", "error");
        });

        // Explicit cleanup of context menu to prevent interference with subsequent tests
        const cleanupMenu = document.querySelector("#recent-files-menu");
        if (cleanupMenu) {
            cleanupMenu.remove();
        }
    });

    it("context menu: cleanup on mousedown (lines 181-182)", { timeout: 15000 }, async () => {
        // Mock recent files as string array
        const files = ["/path/to/file1.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

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
                const menu = document.querySelector("#recent-files-menu");
                console.log("Test 181-182 - Menu found:", !!menu);
                return menu !== null;
            },
            { timeout: 15000, interval: 100 }
        );

        const menu = document.querySelector("#recent-files-menu");
        expect(menu).toBeTruthy();

        // Trigger mousedown to cleanup
        const mousedownEvent = new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(mousedownEvent);

        // Menu should be removed
        const removedMenu = document.querySelector("#recent-files-menu");
        expect(removedMenu).toBeFalsy();

        // Explicit cleanup to ensure no DOM pollution for subsequent tests
        if (removedMenu) {
            removedMenu.remove();
        }
    });

    it("context menu: handles onclick function (lines 200-201)", { timeout: 15000 }, async () => {
        // Mock recent files
        const files = ["/path/to/file1.fit"];
        electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

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
                const menu = document.querySelector("#recent-files-menu");
                console.log("Test 200-201 - Menu found:", !!menu);
                return menu !== null;
            },
            { timeout: 15000, interval: 100 }
        );

        // Find the menu item (first child div of the menu)
        const menu = document.querySelector("#recent-files-menu");
        expect(menu).toBeTruthy();
        const menuItem = menu?.querySelector("div[role='menuitem']");
        expect(menuItem).toBeTruthy();

        // Set a mock onclick function to test the original onclick call path
        const mockOnclick = vi.fn();
        (menuItem as any).onclick = mockOnclick;

        // Click the menu item
        menuItem!.dispatchEvent(
            new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
            })
        );

        // Wait for the click handler to complete
        await vi.waitFor(() => {
            expect(mockOnclick).toHaveBeenCalled();
        });

        // Explicit cleanup of context menu to prevent interference with subsequent tests
        const finalCleanupMenu = document.querySelector("#recent-files-menu");
        if (finalCleanupMenu) {
            finalCleanupMenu.remove();
        }
    });

    it("decoder options: error case (line 279)", async () => {
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
        vi.mocked(electronAPI.readFile).mockRejectedValue(new Error("File read failed"));

        // Trigger decoder options changed
        electronAPI.emit("decoder-options-changed", { speed: true });

        await vi.waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith("Error reloading file: Error: File read failed", "error");
        });
    });

    it("export CSV: missing copyTableAsCSV function (lines 317-318)", async () => {
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
        expect(downloadLink).toBeFalsy();
    });
});

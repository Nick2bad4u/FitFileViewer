// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { RendererElectronApiScope } from "../../../../../../electron-app/utils/runtime/electronApiRuntime.js";

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

const csvExportMocks = vi.hoisted(() => ({
    serializeTableToCSV: vi.fn<(table: unknown) => string>(),
}));

const fitDataRendererMocks = vi.hoisted(() => ({
    renderDecodedFitData: vi.fn<
        (data: unknown, filePath: string) => Promise<void>
    >(async () => {}),
}));
const altFitMocks = vi.hoisted(() => ({
    sendFitFileToAltFitReader: vi.fn<SendFitFileToAltFitReaderMock>(),
}));
const chartRenderMocks = vi.hoisted(() => ({
    renderChartJS: vi.fn<() => Promise<boolean> | boolean>(() => true),
}));
const chartUpdateMocks = vi.hoisted(() => ({
    updateCharts: vi.fn<(reason: string) => Promise<boolean>>(() =>
        Promise.resolve(true)
    ),
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

vi.mock(
    import("../../../../../../electron-app/utils/files/export/copyTableAsCSV.js"),
    () => ({
        copyTableAsCSV: vi.fn<() => Promise<void>>(),
        serializeTableToCSV: csvExportMocks.serializeTableToCSV,
    })
);

vi.mock(
    import("../../../../../../electron-app/utils/rendering/core/renderDecodedFitData.js"),
    () => ({ renderDecodedFitData: fitDataRendererMocks.renderDecodedFitData })
);

vi.mock(
    import("../../../../../../electron-app/utils/files/import/sendFitFileToAltFitReader.js"),
    () => altFitMocks
);

vi.mock(
    import("../../../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => chartRenderMocks
);

vi.mock(
    import("../../../../../../electron-app/utils/charts/core/chartUpdater.js"),
    () => chartUpdateMocks
);

const openFileSelectorMock = dependencyMocks.openFileSelector;

// Import the module under test
import { setupListeners as setupLifecycleListeners } from "../../../../../../electron-app/utils/app/lifecycle/listeners.js";
import { resetMenuIpcListenerStateForTests } from "../../../../../../electron-app/utils/app/lifecycle/menuIpcListeners.js";
import {
    getActiveFitRawData,
    setActiveFitRawData,
} from "../../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../../../../electron-app/utils/state/core/stateManager.js";

type IpcHandler = (...args: any[]) => any;

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
    const registerMenuHandler = (channel: string) => (cb: IpcHandler) => {
        ipcHandlers.set(channel, cb);
    };

    return {
        // Menu hooks
        onDecoderOptionsChanged: registerMenuHandler("decoder-options-changed"),
        onExportFile: registerMenuHandler("export-file"),
        onMenuAbout: registerMenuHandler("menu-about"),
        onMenuCheckForUpdates: registerMenuHandler("menu-check-for-updates"),
        onMenuExport: registerMenuHandler("menu-export"),
        onMenuKeyboardShortcuts: registerMenuHandler("menu-keyboard-shortcuts"),
        onMenuOpenFile: (cb: IpcHandler) => {
            menuOpenFileCb = cb;
        },
        onMenuOpenOverlay: registerMenuHandler("menu-open-overlay"),
        onMenuPrint: registerMenuHandler("menu-print"),
        onMenuRestartUpdate: registerMenuHandler("menu-restart-update"),
        onMenuSaveAs: registerMenuHandler("menu-save-as"),
        onOpenAccentColorPicker: registerMenuHandler(
            "open-accent-color-picker"
        ),
        onOpenRecentFile: (cb: (filePath: string) => any) => {
            openRecentCb = cb;
        },
        onSetFontSize: registerMenuHandler("set-font-size"),
        onSetHighContrast: registerMenuHandler("set-high-contrast"),
        onShowNotification: registerMenuHandler("show-notification"),
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
        readFile: vi.fn<ReadFileMock>(),
        parseFitFile: vi.fn<ParseFitFileMock>(),
        addRecentFile: vi.fn<AddRecentFileMock>(),

        // Main process send
        checkForUpdates: vi.fn<() => void>(),
        requestExport: vi.fn<() => void>(),
        requestSaveAs: vi.fn<() => void>(),
        send: vi.fn<(channel: string) => void>(),
    };
}

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

let electronApiScope: RendererElectronApiScope | undefined;

function registerLifecycleElectronAPI(api: any) {
    electronApiScope = createElectronApiScope(api);
    return api;
}

function setupListeners(options: any): void {
    setupLifecycleListeners({
        electronApiScope,
        ...options,
    });
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
        __resetStateManagerForTests();
        openFileSelectorMock.mockReset();
        openFileSelectorMock.mockResolvedValue(undefined);
        resetMenuIpcListenerStateForTests();
        document.body.innerHTML = "";
        openFileBtn = createButton();
        electronAPI = createElectronAPIMock();
        electronApiScope = createElectronApiScope(electronAPI);

        setLoading = vi.fn<SetLoadingMock>();
        showNotification = vi.fn<ShowNotificationMock>();
        handleOpenFile = vi.fn<HandleOpenFileMock>();
        showUpdateNotification = vi.fn<ShowUpdateNotificationMock>();
        showAboutModal = vi.fn<ShowAboutModalMock>();
        ensureContainers();
        csvExportMocks.serializeTableToCSV.mockReset();
        csvExportMocks.serializeTableToCSV.mockReturnValue("a,b\n1,2");
        fitDataRendererMocks.renderDecodedFitData.mockReset();
        fitDataRendererMocks.renderDecodedFitData.mockResolvedValue(undefined);
        altFitMocks.sendFitFileToAltFitReader.mockReset();
        chartRenderMocks.renderChartJS.mockReset();
        chartRenderMocks.renderChartJS.mockReturnValue(true);
        chartUpdateMocks.updateCharts.mockReset();
        chartUpdateMocks.updateCharts.mockResolvedValue(true);
    });

    afterEach(() => {
        __resetStateManagerForTests();
        electronApiScope = undefined;
        // Clean up any dynamically created context menus
        const existingMenu = document.querySelector("#recent-files-menu");
        if (existingMenu) {
            existingMenu.remove();
        }

        // Clean up all DOM elements thoroughly
        document.body.innerHTML = "";

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

    it("does not publish retired lifecycle helper globals", () => {
        expect.assertions(1);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        expect(
            [
                "copyTableAsCSV",
                "createExportGPXButton",
                "globalData",
                "renderChartJS",
                "sendFitFileToAltFitReader",
            ].filter((globalName) => Reflect.has(globalThis, globalName))
        ).toStrictEqual([]);
    });

    it("contextmenu: no recentFiles available -> no action", async () => {
        expect.hasAssertions();

        // Remove recentFiles so early return triggers
        electronAPI.recentFiles = undefined;

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

        vi.mocked(electronAPI.recentFiles).mockResolvedValue([]);

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
            expect(
                fitDataRendererMocks.renderDecodedFitData
            ).toHaveBeenCalledWith(parseResult.data, files[1]);
        });
        // Loading toggled on/off
        expect(setLoading).toHaveBeenNthCalledWith(1, true);
        expect(setLoading).toHaveBeenLastCalledWith(false);
        // Button re-enabled
        expect(openFileBtn.disabled).toBe(false);
    });

    it("window resize triggers typed chart updates when tab active", async () => {
        expect.hasAssertions();

        // Prepare active tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

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
        await vi.advanceTimersByTimeAsync(210);
        vi.useRealTimers();

        expect(
            document.getElementById("tab-chart")?.classList.contains("active")
        ).toBe(true);
        expect(chartUpdateMocks.updateCharts).toHaveBeenCalledWith(
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

        electronAPI.emit("decoder-options-changed", { speed: true });
        expect(openFileBtn.disabled).toBe(false);
        expect(showNotification).toHaveBeenCalledWith(
            "Decoder options updated.",
            "info",
            2000
        );
        // Should not attempt read/parse
        expect(electronAPI.readFile).not.toHaveBeenCalled();
    });

    it("ipc: decoder-options-changed reloads cached file and renders decoded FIT data", async () => {
        expect.hasAssertions();

        const arrayBuf = new ArrayBuffer(16);
        setActiveFitRawData(
            { cachedFilePath: "C:/tmp/sample.fit" },
            { source: "test" }
        );
        vi.mocked(electronAPI.readFile).mockResolvedValue(arrayBuf);
        const parsed = createFitMessages();
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(parsed);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        electronAPI.emit("decoder-options-changed", { foo: 1 });
        // Let promised chain resolve (flush a couple microtasks first)
        await Promise.resolve();
        await Promise.resolve();

        await vi.waitFor(() => {
            expect(electronAPI.readFile).toHaveBeenCalledWith(
                "C:/tmp/sample.fit"
            );
            expect(electronAPI.parseFitFile).toHaveBeenCalledWith(arrayBuf);
            expect(
                fitDataRendererMocks.renderDecodedFitData
            ).toHaveBeenCalledWith(parsed, "C:/tmp/sample.fit");
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
        csvExportMocks.serializeTableToCSV.mockReturnValueOnce(csv);

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

        setActiveFitRawData(
            { recordMesgs: [{ a: 1, b: 2 }] },
            { source: "test" }
        );

        await electronAPI.emit("export-file", "C:/tmp/out.csv");

        expect(csvExportMocks.serializeTableToCSV).toHaveBeenCalledWith([
            { a: 1, b: 2 },
        ]);
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
        setActiveFitRawData(
            {
                recordMesgs: [
                    { positionLat: undefined, positionLong: undefined },
                    { positionLat: 1 << 30, positionLong: 1 << 30 },
                ],
            },
            { source: "test" }
        );

        await electronAPI.emit("export-file", "C:/tmp/out.gpx");
        expect(getActiveFitRawData()?.recordMesgs).toHaveLength(2);
        expect(clickSpy).toHaveBeenCalledOnce();

        // Case 2: no valid coords
        clickSpy.mockReset();
        setActiveFitRawData(
            {
                recordMesgs: [{}, {}],
            },
            { source: "test" }
        );
        await electronAPI.emit("export-file", "C:/tmp/out.gpx");
        expect(showNotification).toHaveBeenCalledWith(
            "No valid coordinates found for GPX export.",
            "info",
            3000
        );

        // Case 3: no data available
        setActiveFitRawData({}, { source: "test" });
        await electronAPI.emit("export-file", "C:/tmp/out.gpx");
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

        electronAPI.emit("show-notification", "Hello", undefined);
        expect(openFileBtn.disabled).toBe(false);
        expect(showNotification).toHaveBeenCalledWith("Hello", "info", 3000);
    });

    it("ipc: menu print and forward sends", async () => {
        expect.hasAssertions();

        const printSpy = vi.fn<() => void>();
        vi.spyOn(window, "print").mockImplementation(printSpy);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        electronAPI.emit("menu-print");
        expect(openFileBtn.isConnected).toBe(true);
        expect(printSpy).toHaveBeenCalledWith();

        electronAPI.emit("menu-check-for-updates");
        electronAPI.emit("menu-save-as");
        electronAPI.emit("menu-export");
        expect(electronAPI.checkForUpdates).toHaveBeenCalledWith();
        expect(electronAPI.requestSaveAs).toHaveBeenCalledWith();
        expect(electronAPI.requestExport).toHaveBeenCalledWith();
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

        await electronAPI.emit("menu-open-overlay");
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

        await electronAPI.emit("menu-open-overlay");
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
        electronAPI.emit("menu-about");
        expect(openFileBtn.isConnected).toBe(true);
        expect(showAboutModal).toHaveBeenCalledWith("", { electronApiScope });

        await electronAPI.emit("menu-keyboard-shortcuts");

        expect(dependencyMocks.keyboardShortcutsModal).toHaveBeenCalledWith({
            electronApiScope,
        });

        await electronAPI.emit("menu-keyboard-shortcuts");
        expect(dependencyMocks.keyboardShortcutsModal).toHaveBeenCalledTimes(2);
        expect("showKeyboardShortcutsModal" in globalThis).toBe(false);
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

        electronAPI.emitUpdate("update-checking");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Checking for updates...",
            "info",
            3000
        );

        electronAPI.emitUpdate("update-available");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Update available! Downloading...",
            4000
        );

        electronAPI.emitUpdate("update-not-available");
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "You are using the latest version.",
            "success",
            4000
        );

        electronAPI.emitUpdate("update-error", new Error("boom"));
        expect(
            showUpdateNotification.mock.calls.some((c: any[]) =>
                String(c[0]).includes("Update error:")
            )
        ).toBe(true);

        electronAPI.emitUpdate("update-download-progress", {
            percent: 42.2,
        });
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: 42%",
            "info",
            2000
        );

        electronAPI.emitUpdate("update-download-progress", {});
        expect(showUpdateNotification).toHaveBeenCalledWith(
            "Downloading update: progress information unavailable.",
            "info",
            2000
        );

        electronAPI.emitUpdate("update-downloaded");
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
        electronAPI.emit("set-font-size", "small");
        expect(document.body.classList.contains("font-small")).toBe(true);

        // High contrast modes
        electronAPI.emit("set-high-contrast", "black");
        expect(document.body.classList.contains("high-contrast")).toBe(true);
        electronAPI.emit("set-high-contrast", "white");
        expect(document.body.classList.contains("high-contrast-white")).toBe(
            true
        );
        electronAPI.emit("set-high-contrast", "yellow");
        expect(document.body.classList.contains("high-contrast-yellow")).toBe(
            true
        );
    });

    it("menu: onMenuOpenFile forwards to handleOpenFile; onOpenRecentFile loads and shows errors", async () => {
        expect.hasAssertions();

        const isOpeningFileRef = { current: false };

        // For open recent path success
        const arrayBuf = new ArrayBuffer(32);
        vi.mocked(electronAPI.readFile).mockResolvedValue(arrayBuf);
        vi.mocked(electronAPI.parseFitFile).mockResolvedValue(
            createFitMessages()
        );
        vi.mocked(electronAPI.addRecentFile).mockResolvedValue(undefined);

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
        electronAPI.triggerMenuOpenFile();
        expect(handleOpenFile).toHaveBeenCalledOnce();

        // Success case
        await electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
        expect(electronAPI.readFile).toHaveBeenCalledWith("C:/tmp/recent.fit");
        expect(electronAPI.addRecentFile).toHaveBeenCalledWith(
            "C:/tmp/recent.fit"
        );

        // Error case
        vi.mocked(electronAPI.parseFitFile)
            .mockReset()
            .mockResolvedValue({ error: "bad" });
        await electronAPI.triggerOpenRecentFile("C:/tmp/recent.fit");
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
            expect(
                fitDataRendererMocks.renderDecodedFitData
            ).toHaveBeenCalledWith(parseResult.data, files[0]);
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

        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        await vi.advanceTimersByTimeAsync(210);
        vi.useRealTimers();

        // Should not call chart update when no chart tabs are active
        expect(document.getElementById("tab-chart")).toBeNull();
        expect(chartUpdateMocks.updateCharts).not.toHaveBeenCalled();
    });

    it("window resize: chart tab active uses imported chart render fallback when typed update fails", async () => {
        expect.hasAssertions();

        // Prepare active chart tab
        const tab = document.createElement("div");
        tab.id = "tab-chart";
        tab.classList.add("active");
        document.body.appendChild(tab);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        chartUpdateMocks.updateCharts.mockRejectedValueOnce(
            new Error("update failed")
        );
        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        await vi.advanceTimersByTimeAsync(210);
        vi.useRealTimers();

        expect(tab.classList.contains("active")).toBe(true);
        expect(chartRenderMocks.renderChartJS).toHaveBeenCalledWith();
    });

    it("window resize: chartjs tab active uses imported chart render fallback when typed update fails", async () => {
        expect.hasAssertions();

        // Prepare active chartjs tab
        const tab = document.createElement("div");
        tab.id = "tab-chartjs";
        tab.classList.add("active");
        document.body.appendChild(tab);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        chartUpdateMocks.updateCharts.mockRejectedValueOnce(
            new Error("update failed")
        );
        vi.useFakeTimers();
        window.dispatchEvent(new Event("resize"));
        // run debounce timer
        await vi.advanceTimersByTimeAsync(210);
        vi.useRealTimers();

        expect(tab.id).toBe("tab-chartjs");
        expect(chartRenderMocks.renderChartJS).toHaveBeenCalledWith();
    });

    it("decoder-options-changed: handles error during file reload", async () => {
        expect.hasAssertions();

        setActiveFitRawData(
            { cachedFilePath: "C:/tmp/sample.fit" },
            { source: "test" }
        );
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

        setActiveFitRawData({ some: "data" }, { source: "test" });

        // Test unsupported extension
        await electronAPI.emit("export-file", "C:/tmp/out.txt");

        // Should not call any notification or create download links
        expect(document.querySelectorAll("a")).toHaveLength(0);
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("export-file: csv without exportable rows", async () => {
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

        setActiveFitRawData({ some: "data" }, { source: "test" });

        await electronAPI.emit("export-file", "C:/tmp/out.csv");

        // Should not create a blank download link without exportable rows.
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

        setActiveFitRawData({ some: "data" }, { source: "test" });

        // Remove summary container
        document.querySelector("#content-summary")?.remove();

        await electronAPI.emit("export-file", "C:/tmp/out.csv");

        // Should not create download link without container
        const links = document.querySelectorAll("a");
        expect(links).toHaveLength(0);
    });

    it("export-file: gpx downloads without renderer global helpers", async () => {
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

        setActiveFitRawData(
            {
                recordMesgs: [{ positionLat: 1 << 30, positionLong: 1 << 30 }],
            },
            { source: "test" }
        );

        await electronAPI.emit("export-file", "C:/tmp/out.gpx");

        expect(getActiveFitRawData()?.recordMesgs).toHaveLength(1);
        expect(showNotification).not.toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(
            expect.any(Blob)
        );
    });

    it("export-file: handles missing active FIT raw data", async () => {
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

        setActiveFitRawData(null, { source: "test.clear" });

        await electronAPI.emit("export-file", "C:/tmp/out.csv");

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

        electronAPI = registerLifecycleElectronAPI(limitedElectronAPI);

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

        electronAPI = registerLifecycleElectronAPI(createElectronAPIMock());
    });

    it("menu: handles missing named request methods in electronAPI", async () => {
        expect.hasAssertions();

        const limitedElectronAPI = Object.assign({}, electronAPI, {
            requestExport: undefined,
            requestSaveAs: undefined,
        });

        electronAPI = registerLifecycleElectronAPI(limitedElectronAPI);

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        // Should not crash when named request methods are undefined
        expect(() => {
            electronAPI.emit("menu-check-for-updates");
            electronAPI.emit("menu-save-as");
            electronAPI.emit("menu-export");
        }).not.toThrow();

        electronAPI = registerLifecycleElectronAPI(createElectronAPIMock());
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
        const sendFitFileToAltFitReader = altFitMocks.sendFitFileToAltFitReader;

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

        const sendFitFileToAltFitReader = altFitMocks.sendFitFileToAltFitReader;

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

        const sendFitFileToAltFitReader = altFitMocks.sendFitFileToAltFitReader;

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
        expect(chartUpdateMocks.updateCharts).toHaveBeenCalledWith(
            "window-resize"
        );
    });

    it("decoder-options-changed: catch block when file reload fails (line 279)", async () => {
        expect.hasAssertions();

        setActiveFitRawData({ cachedFilePath: "test.fit" }, { source: "test" });
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

    it("export-file: csv without rows (lines 317-318)", async () => {
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
        setActiveFitRawData({ data: "test" }, { source: "test" });

        // Setup #content-summary container (correct querySelector)
        const summaryContainer = document.createElement("div");
        summaryContainer.id = "content-summary";
        document.body.appendChild(summaryContainer);

        electronAPI.emit("export-file", "test.csv");

        await Promise.resolve();

        // The function should complete without error - no else clause means no notification
        expect(document.querySelectorAll("a")).toHaveLength(0);
        expect(showNotification).not.toHaveBeenCalled();
    });

    it("export-file: gpx with valid coordinates for setTimeout cleanup (lines 350-351)", async () => {
        expect.hasAssertions();

        // Create valid coordinate data in semicircle format
        // Coordinates in semicircles: lat/lng * 2^31 / 180
        const semicircleConversion = (degrees: number) =>
            Math.round((degrees * 2 ** 31) / 180);

        // Seed active FIT raw data with valid coordinates.
        setActiveFitRawData(
            {
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
            },
            { source: "test" }
        );

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
        electronAPI.emit("export-file", "test-file.gpx");

        await Promise.resolve();

        // Verify the download path was triggered first
        expect(getActiveFitRawData()?.recordMesgs).toHaveLength(2);
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

        setupListeners({
            openFileBtn,
            isOpeningFileRef: { current: false },
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
        });

        electronAPI.emit("menu-keyboard-shortcuts");

        await vi.waitFor(() => {
            expect(dependencyMocks.keyboardShortcutsModal).toHaveBeenCalledWith(
                { electronApiScope }
            );
        });
        expect("showKeyboardShortcutsModal" in globalThis).toBe(false);

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

        setActiveFitRawData(
            { cachedFilePath: "/test/file.fit" },
            { source: "test" }
        );

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

    it("export CSV: no rows available (lines 317-318)", async () => {
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

        setActiveFitRawData({ data: "test" }, { source: "test" });

        // Setup #content-summary container (correct querySelector)
        const summaryContainer = document.createElement("div");
        summaryContainer.id = "content-summary";
        document.body.appendChild(summaryContainer);

        electronAPI.emit("export-file", "test-file.csv");

        await Promise.resolve();

        // No exportable rows means no blank download is created.
        const downloadLink = document.querySelector("a[download]");
        expect(downloadLink).toBeNull();
    });
});

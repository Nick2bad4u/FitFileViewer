import { beforeEach, describe, expect, it, vi } from "vitest";

// Import the module under test
import { setupListeners } from "../../../../../utils/app/lifecycle/listeners.js";

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
    document.body.innerHTML = "";
    openFileBtn = createButton();
    electronAPI = createElectronAPIMock();
    // @ts-ignore
    window.electronAPI = electronAPI;
    setLoading = vi.fn();
    showNotification = vi.fn();
    handleOpenFile = vi.fn();
    showUpdateNotification = vi.fn();
    showAboutModal = vi.fn();
    ensureContainers();
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
    const files = [
      "C:/Users/Test/one.fit",
      "C:/Users/Test/two.fit",
    ];
    window.electronAPI.recentFiles = vi.fn().mockResolvedValue(files);

    const arrayBuf = new ArrayBuffer(8);
    window.electronAPI.readFile = vi.fn().mockResolvedValue(arrayBuf);
    const parseResult = { ok: true, data: { field: 1 } };
    window.electronAPI.parseFitFile = vi.fn().mockResolvedValue(parseResult);
    window.electronAPI.addRecentFile = vi.fn().mockResolvedValue(undefined);
    const showFitData = vi.fn();
    window.showFitData = showFitData;

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
    const items = Array.from(menu.querySelectorAll("div"));
    expect(items.length).toBe(files.length);

  // Click the second item and await async handler completion
  const second = items[1] as HTMLDivElement & { onclick?: (ev: any) => Promise<void> | void };
  await second.onclick?.(new MouseEvent("click"));

    // readFile and parseFitFile should be called and then addRecentFile
    await vi.waitFor(() => {
      expect(window.electronAPI.readFile).toHaveBeenCalledWith(files[1]);
      expect(window.electronAPI.parseFitFile).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.addRecentFile).toHaveBeenCalledWith(files[1]);
      expect(showFitData).toHaveBeenCalledWith(parseResult, files[1]);
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
    ;(window as any).showKeyboardShortcutsModal = vi.fn();
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
});

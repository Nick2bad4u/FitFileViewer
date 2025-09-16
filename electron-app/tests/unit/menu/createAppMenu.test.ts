import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Capture passed template for assertions
let capturedTemplate: any[] | null = null;

vi.mock("electron", () => {
  const buildFromTemplate = vi.fn((template: any[]) => {
    capturedTemplate = template;
    return { items: template } as any;
  });
  const setApplicationMenu = vi.fn();
  const send = vi.fn();
  const getFocusedWindow = vi.fn(() => ({ webContents: { send } }));
  return {
    Menu: { buildFromTemplate, setApplicationMenu },
    BrowserWindow: { getFocusedWindow },
    app: { isPackaged: true, name: "FitFileViewer" },
    shell: { openExternal: vi.fn() },
  };
});

// Mock recent files utilities
vi.mock("../../../utils/files/recent/recentFiles", () => ({
  loadRecentFiles: vi.fn(() => [
    "C:/Users/Test/Documents/activity1.fit",
    "C:/Users/Test/Documents/activity2.fit",
  ]),
  getShortRecentName: vi.fn((p: string) => p.split(/\\|\//g).slice(-2).join("\\")),
}));

// Do not mock electron-conf to exercise fallback if not present; if present, it's fine.

describe("createAppMenu", () => {
  beforeEach(() => {
    capturedTemplate = null;
    vi.resetModules();
    // Inject recent files via global hook consumed by createAppMenu
    (globalThis as any).__mockRecentFiles = [
      "C:/Users/Test/Documents/activity1.fit",
      "C:/Users/Test/Documents/activity2.fit",
    ];
  });

  afterEach(() => {
    capturedTemplate = null;
    // Cleanup injected global
    try { delete (globalThis as any).__mockRecentFiles; } catch {}
  });

  function importCreateAppMenu() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("../../../utils/app/menu/createAppMenu.js");
    return mod.createAppMenu as (mainWindow: any, currentTheme?: string, loadedFitFilePath?: string | null) => void;
  }

  it("builds a menu with File/View/Settings/Help and recent files", () => {
    const createAppMenu = importCreateAppMenu();
    const fakeWin = { webContents: { send: vi.fn() } };
    createAppMenu(fakeWin as any, "dark", null);

  const tpl = (capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate);
  expect(tpl).toBeTruthy();
  const labels = (tpl || []).map((i: any) => i.label);
    expect(labels).toEqual(expect.arrayContaining(["📁 File", "👁️ View", "⚙️ Settings", "❓ Help"]));

  // Find Open Recent submenu and verify it contains mapped items
  const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
    expect(fileMenu).toBeTruthy();
  const openRecent = fileMenu.submenu.find((i: any) => i.label === "🕑 Open Recent");
    expect(openRecent).toBeTruthy();
  const recentLabels = openRecent.submenu.map((i: any) => i.label);
    expect(recentLabels.some((l: string) => l.includes("activity1.fit"))).toBe(true);
  });

  it("enables Summary Columns when a file is loaded and triggers IPC on click", () => {
    const createAppMenu = importCreateAppMenu();
    const send = vi.fn();
    const fakeWin = { webContents: { send } };
    createAppMenu(fakeWin as any, "dark", "C:/path/to/file.fit");
  const tpl = (capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate);
  expect(tpl).toBeTruthy();
  const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
    const summary = settingsMenu.submenu.find((i: any) => i.label === "📊 Summary Columns...");
    expect(summary.enabled).toBe(true);
    summary.click();
    expect(send).toHaveBeenCalledWith("open-summary-column-selector");
  });

  it("clear recent files item sends notification and unload-fit-file", () => {
    const createAppMenu = importCreateAppMenu();
    const send = vi.fn();
    const fakeWin = { webContents: { send } };
    createAppMenu(fakeWin as any, "dark", "C:/x.fit");
  const tpl = (capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate);
  const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
    const openRecent = fileMenu.submenu.find((i: any) => i.label === "🕑 Open Recent");
    const clearItem = openRecent.submenu.find((i: any) => i.label === "🧹 Clear Recent Files");
    expect(clearItem.enabled).toBe(true);
    clearItem.click();
    expect(send).toHaveBeenCalledWith("show-notification", "Recent files cleared.", "info");
    expect(send).toHaveBeenCalledWith("unload-fit-file");
  });
});

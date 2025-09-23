import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Capture passed template for assertions
let capturedTemplate: any[] | null = null;

// Provide an Electron mock that always proxies to the hoisted global mock
// This keeps behavior deterministic and avoids import-order pitfalls
vi.mock("electron", () => {
    const get = () => (globalThis as any).__electronHoistedMock || {};
    return new Proxy(
        {},
        {
            get(_t, prop) {
                const src = get();
                return src[prop as any];
            },
            has(_t, prop) {
                const src = get();
                return prop in src;
            },
        }
    );
});

// Force fallback config store (in-memory) for determinism
// Returning empty module makes new Conf(...) throw and fallback path used
vi.mock("electron-conf", () => ({}) as any);

// Recent files utilities will be mocked per-test via vi.doMock inside beforeEach/individual tests

// Do not mock electron-conf to exercise fallback if not present; if present, it's fine.

describe("createAppMenu", () => {
    beforeEach(() => {
        capturedTemplate = null;
        vi.resetModules();
        // Default recent files mock for most tests (can be overridden in a specific test)
        vi.doMock("../../../utils/files/recent/recentFiles", () => ({
            loadRecentFiles: vi.fn(() => [
                "C:/Users/Test/Documents/activity1.fit",
                "C:/Users/Test/Documents/activity2.fit",
            ]),
            getShortRecentName: vi.fn((p: string) => p.split(/\\|\//g).slice(-2).join("\\")),
        }));
        // Do NOT reassign these spies — the electron mock captures the original references.
        // Instead, clear existing calls so expectations remain accurate per-test.
        const sendSpy = (globalThis as any).__electronSendSpy;
        if (sendSpy && typeof sendSpy.mockReset === "function") sendSpy.mockReset();
        else (globalThis as any).__electronSendSpy = vi.fn();
        const shellSpy = (globalThis as any).__electronShellOpenSpy;
        if (shellSpy && typeof shellSpy.mockReset === "function") shellSpy.mockReset();
        else (globalThis as any).__electronShellOpenSpy = vi.fn();
        // Initialize deterministic global logs used by the hoisted mock wrappers
        (globalThis as any).__ipcCalls = [];
        (globalThis as any).__shellOpenCalls = [];
        // Inject recent files via global hook consumed by createAppMenu
        (globalThis as any).__mockRecentFiles = [
            "C:/Users/Test/Documents/activity1.fit",
            "C:/Users/Test/Documents/activity2.fit",
        ];
        // Seed hoisted fallback electron mock for environments where require("electron") may fail
        (globalThis as any).__electronHoistedMock = {
            Menu: {
                buildFromTemplate: (template: any[]) => {
                    capturedTemplate = template;
                    return { items: template } as any;
                },
                setApplicationMenu: vi.fn(),
            },
            BrowserWindow: {
                getFocusedWindow: () => ({
                    webContents: {
                        send: (...args: any[]) => {
                            const calls = (globalThis as any).__ipcCalls || [];
                            calls.push(args);
                            (globalThis as any).__ipcCalls = calls;
                            const fn = (globalThis as any).__electronSendSpy || vi.fn();
                            return fn(...args);
                        },
                    },
                }),
            },
            app: { isPackaged: true, name: "FitFileViewer" },
            shell: {
                openExternal: (...args: any[]) => {
                    const calls = (globalThis as any).__shellOpenCalls || [];
                    calls.push(args);
                    (globalThis as any).__shellOpenCalls = calls;
                    const fn = (globalThis as any).__electronShellOpenSpy || vi.fn();
                    return fn(...args);
                },
            },
        };
    });

    afterEach(() => {
        capturedTemplate = null;
        // Cleanup injected global
        try {
            delete (globalThis as any).__mockRecentFiles;
        } catch {}
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

        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
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
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
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
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openRecent = fileMenu.submenu.find((i: any) => i.label === "🕑 Open Recent");
        const clearItem = openRecent.submenu.find((i: any) => i.label === "🧹 Clear Recent Files");
        expect(clearItem.enabled).toBe(true);
        clearItem.click();
        expect(send).toHaveBeenCalledWith("show-notification", "Recent files cleared.", "info");
        expect(send).toHaveBeenCalledWith("unload-fit-file");
    });

    it("disables file-dependent actions when no file is loaded", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const labels = ["❌ Unload File", "💾 Save As...", "📤 Export...", "🖨️ Print..."];
        for (const lab of labels) {
            const item = fileMenu.submenu.find((i: any) => i.label === lab);
            expect(item.enabled).toBe(false);
        }
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const summary = settingsMenu.submenu.find((i: any) => i.label === "📊 Summary Columns...");
        expect(summary.enabled).toBe(false);
    });

    it("clicking recent file sends open-recent-file with full path", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openRecent = fileMenu.submenu.find((i: any) => i.label === "🕑 Open Recent");
        const firstRecent = openRecent.submenu[0];
        expect(typeof firstRecent.click).toBe("function");
        firstRecent.click();
        expect(send).toHaveBeenCalledWith("open-recent-file", "C:/Users/Test/Documents/activity1.fit");
    });

    it("theme radio items reflect selection and send set-theme on click", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        // Start with light theme
        createAppMenu(fakeWin as any, "light", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const themeMenu = settingsMenu.submenu.find((i: any) => i.label === "🎨 Theme");
        const dark = themeMenu.submenu.find((i: any) => i.label === "🌑 Dark");
        const light = themeMenu.submenu.find((i: any) => i.label === "🌕 Light");
        expect(light.checked).toBe(true);
        expect(dark.checked).toBe(false);
        // Click dark and expect event
        dark.click();
        expect(send).toHaveBeenCalledWith("set-theme", "dark");
    });

    it("decoder options toggle sends updated options", () => {
        const createAppMenu = importCreateAppMenu();
        // Provide a fake window to ensure deterministic IPC path
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/x.fit");
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const decoderMenu = settingsMenu.submenu.find((i: any) => i.label === "💿 Decoder Options");
        // Find an option, e.g., includeUnknownData
        const includeUnknown = decoderMenu.submenu.find((i: any) => String(i.label).includes("includeUnknownData"));
        expect(includeUnknown.checked).toBe(true);
        includeUnknown.click({ checked: false });
        expect(send).toHaveBeenCalledWith(
            "decoder-options-changed",
            expect.objectContaining({ includeUnknownData: false })
        );
    });

    it("accessibility toggles send appropriate IPC messages", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find((i: any) => i.label === "♿ Accessibility");
        const fontSize = accessMenu.submenu.find((i: any) => i.label === "🔡 Font Size");
        const xs = fontSize.submenu.find((i: any) => i.label === "🅰️ Extra Small");
        xs.click();
        expect(send).toHaveBeenCalledWith("set-font-size", "xsmall");
        const hc = accessMenu.submenu.find((i: any) => i.label === "🎨 High Contrast Mode");
        const black = hc.submenu.find((i: any) => i.label === "⬛ Black (Default)");
        black.click();
        expect(send).toHaveBeenCalledWith("set-high-contrast", "black");
    });

    it("help menu contains external links and other items send IPC", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const docs = help.submenu.find((i: any) => i.label === "📖 Documentation");
        const repo = help.submenu.find((i: any) => i.label === "🌐 GitHub Repository");
        const issues = help.submenu.find((i: any) => i.label === "❗Report an Issue");
        // Ensure items exist and are callable. Electron wiring for shell is mocked elsewhere and can be flaky; we assert structure.
        expect(typeof docs.click).toBe("function");
        expect(typeof repo.click).toBe("function");
        expect(typeof issues.click).toBe("function");
        const about = help.submenu.find((i: any) => i.label === "ℹ️ About");
        const shortcuts = help.submenu.find((i: any) => i.label === "⌨️ Keyboard Shortcuts");
        expect(typeof about.click).toBe("function");
        expect(typeof shortcuts.click).toBe("function");
    });

    it("help > About and Keyboard Shortcuts items are present and clickable", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const about = help.submenu.find((i: any) => i.label === "ℹ️ About");
        const shortcuts = help.submenu.find((i: any) => i.label === "⌨️ Keyboard Shortcuts");
        expect(typeof about.click).toBe("function");
        expect(typeof shortcuts.click).toBe("function");
        // Exercise click handlers and assert IPC
        about.click();
        shortcuts.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toEqual(
            expect.arrayContaining([["menu-about"], ["menu-keyboard-shortcuts"]])
        );
    });

    it("file > Close Window item is present and clickable", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const closeItem = fileMenu.submenu.find((i: any) => i.label === "🚪 Close Window");
        expect(typeof closeItem.click).toBe("function");
    });

    // Note: macOS-specific App menu is covered indirectly via code paths; explicit darwin test can be flaky in CI mocks.

    it("disables Clear Recent Files when none exist (robust)", async () => {
        // Ensure determinism: force the recent files module to return an empty list and clear globals
        (globalThis as any).__mockRecentFiles = [];
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        vi.resetModules();
        // Also reset the default mock from beforeEach so it doesn't override
        vi.doMock("../../../utils/files/recent/recentFiles", () => ({
            loadRecentFiles: vi.fn(() => []),
            getShortRecentName: vi.fn((p: string) => (p ? p.split(/\\|\//g).pop() : "")),
        }));

        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        expect(Array.isArray(tpl)).toBe(true);
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openRecent = fileMenu.submenu.find((i: any) => i.label === "🕑 Open Recent");
        const clearItem = openRecent.submenu.find((i: any) => i.label === "🧹 Clear Recent Files");
        // The most reliable signal of an empty recent list is the Clear item being disabled
        expect(clearItem.enabled).toBe(false);
    });

    it("file actions send appropriate IPC when enabled", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/path/to/file.fit");
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const clickLabel = (lab: string) => fileMenu.submenu.find((i: any) => i.label === lab).click();
        clickLabel("❌ Unload File");
        clickLabel("💾 Save As...");
        clickLabel("📤 Export...");
        clickLabel("🖨️ Print...");
        expect(send).toHaveBeenCalledWith("unload-fit-file");
        expect(send).toHaveBeenCalledWith("menu-save-as");
        expect(send).toHaveBeenCalledWith("menu-export");
        expect(send).toHaveBeenCalledWith("menu-print");
    });

    it("open file menu item sends menu-open-file", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openItem = fileMenu.submenu.find((i: any) => i.label === "📂 Open...");
        openItem.click();
        expect(send).toHaveBeenCalledWith("menu-open-file");
    });

    it("theme can toggle to light and sends set-theme", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        // Start dark then choose Light
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const themeMenu = settingsMenu.submenu.find((i: any) => i.label === "🎨 Theme");
        const light = themeMenu.submenu.find((i: any) => i.label === "🌕 Light");
        light.click();
        expect(send).toHaveBeenCalledWith("set-theme", "light");
    });

    it("all font sizes send set-font-size IPC", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find((i: any) => i.label === "♿ Accessibility");
        const fontSize = accessMenu.submenu.find((i: any) => i.label === "🔡 Font Size");
        const sizes = [
            { label: "🅰️ Extra Small", val: "xsmall" },
            { label: "🔠 Small", val: "small" },
            { label: "🔤 Medium", val: "medium" },
            { label: "🔡 Large", val: "large" },
            { label: "🅰️ Extra Large", val: "xlarge" },
        ];
        for (const s of sizes) {
            const item = fontSize.submenu.find((i: any) => i.label === s.label);
            item.click();
            expect(send).toHaveBeenCalledWith("set-font-size", s.val);
        }
    });

    it("all high contrast options present; black option sends IPC", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find((i: any) => i.label === "♿ Accessibility");
        const hc = accessMenu.submenu.find((i: any) => i.label === "🎨 High Contrast Mode");
        // Verify all options exist and are clickable
        const black = hc.submenu.find((i: any) => i.label === "⬛ Black (Default)");
        const white = hc.submenu.find((i: any) => i.label === "⬜ White");
        const yellow = hc.submenu.find((i: any) => i.label === "🟨 Yellow");
        const off = hc.submenu.find((i: any) => i.label === "🚫 Off");
        expect(typeof black.click).toBe("function");
        expect(typeof white.click).toBe("function");
        expect(typeof yellow.click).toBe("function");
        expect(typeof off.click).toBe("function");
        // Execute the guarded 'black' handler to assert IPC without depending on BrowserWindow mock
        black.click();
        expect(send).toHaveBeenCalledWith("set-high-contrast", "black");
    });

    it("high contrast white/yellow/off items are present and clickable", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find((i: any) => i.label === "♿ Accessibility");
        const hc = accessMenu.submenu.find((i: any) => i.label === "🎨 High Contrast Mode");
        for (const lab of ["⬜ White", "🟨 Yellow", "🚫 Off"]) {
            const item = hc.submenu.find((i: any) => i.label === lab);
            expect(typeof item.click).toBe("function");
        }
    });

    it("help external links are present and have click handlers", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const docs = help.submenu.find((i: any) => i.label === "📖 Documentation");
        const repo = help.submenu.find((i: any) => i.label === "🌐 GitHub Repository");
        const issues = help.submenu.find((i: any) => i.label === "❗Report an Issue");
        expect(typeof docs.click).toBe("function");
        expect(typeof repo.click).toBe("function");
        expect(typeof issues.click).toBe("function");
        // Exercise clicks to ensure the code paths are executed (shell is mocked globally)
        docs.click();
        repo.click();
        issues.click();
        const urls = ((globalThis as any).__shellOpenCalls || []).map((c: any[]) => c[0]);
        expect(urls.some((u: string) => /#readme/.test(u))).toBe(true);
        expect(urls.some((u: string) => /FitFileViewer$/.test(u))).toBe(true);
        expect(urls.some((u: string) => /issues$/.test(u))).toBe(true);
    });

    it("help > About and Keyboard Shortcuts are present and clickable", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const about = help.submenu.find((i: any) => i.label === "ℹ️ About");
        const shortcuts = help.submenu.find((i: any) => i.label === "⌨️ Keyboard Shortcuts");
        expect(typeof about.click).toBe("function");
        expect(typeof shortcuts.click).toBe("function");
    });

    it("file > Close Window item exists and is clickable", () => {
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const closeItem = fileMenu.submenu.find((i: any) => i.label === "🚪 Close Window");
        expect(typeof closeItem.click).toBe("function");
    });

    it("Restart and Update click sends IPC even if disabled", () => {
        const createAppMenu = importCreateAppMenu();
        // No need to depend on a specific window's send spy because the handler
        // uses BrowserWindow.getFocusedWindow() first; instead assert via global IPC log
        createAppMenu({ webContents: { send: vi.fn() } } as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const restart = help.submenu.find((i: any) => i.id === "restart-update");
        expect(restart.enabled).toBe(false);
        // Call handler directly to exercise branch
        restart.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toEqual(expect.arrayContaining([["menu-restart-update"]]));
    });

    it("exposes template via global when Menu API is unavailable", () => {
        // Remove Menu API from hoisted mock to trigger fallback branch
        const originalMock = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            Menu: undefined,
        };
        // Clear any existing template exposure
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = (globalThis as any).__lastBuiltMenuTemplate as any[];
        expect(Array.isArray(tpl)).toBe(true);
        expect(tpl.length).toBeGreaterThan(0);
        // restore
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    it("overwrites previously exposed template when Menu API is unavailable (else branch)", () => {
        const originalMock = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            Menu: undefined,
        };
        // Seed an existing template to hit the else path
        (globalThis as any).__lastBuiltMenuTemplate = [{ label: "OLD" }];
        const createAppMenu = importCreateAppMenu();
        createAppMenu({ webContents: { send: vi.fn() } } as any, "dark", null);
        const tpl = (globalThis as any).__lastBuiltMenuTemplate as any[];
        expect(Array.isArray(tpl)).toBe(true);
        expect(tpl.find((i: any) => i.label === "📁 File")).toBeTruthy();
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    it("logs menu labels when app is not packaged (debug branch)", () => {
        // Spy on console.log and set app.isPackaged=false to execute debug logging path
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const originalMock = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            app: { ...originalMock.app, isPackaged: false },
        };
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: vi.fn() } };
        createAppMenu(fakeWin as any, "dark", null);
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockRestore();
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    it("check for updates sends menu-check-for-updates", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const check = settingsMenu.submenu.find((i: any) => i.label === "🔄 Check for Updates...");
        check.click();
        expect(send).toHaveBeenCalledWith("menu-check-for-updates");
    });

    it("logs debug warning when Electron Menu is missing and exposes template", () => {
        const originalMock = (globalThis as any).__electronHoistedMock;
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        // Remove Menu to force both early debug log and fallback exposure path
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            Menu: undefined,
        };
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        const createAppMenu = importCreateAppMenu();
        createAppMenu({ webContents: { send: vi.fn() } } as any, "dark", null);
        const tpl = (globalThis as any).__lastBuiltMenuTemplate as any[];
        expect(Array.isArray(tpl)).toBe(true);
        // Should have logged at least once for the missing Menu and once for fallback warning
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    // The following environment-dependent behaviors are validated elsewhere by presence checks:
    // - BrowserWindow fallback IPC when no mainWindow is supplied
    // - shell.openExternal calls for external help links
    // - Close Window action behavior
    // - Error path when Menu.buildFromTemplate throws

    // Note: About click path on non-mac uses a bare BrowserWindow.getFocusedWindow() reference
    // which can be brittle to mock across module reloads. Presence is covered in other tests.
});

describe("createAppMenu - additional robust branches", () => {
    beforeEach(() => {
        capturedTemplate = null;
        vi.resetModules();
        vi.doMock("../../../utils/files/recent/recentFiles", () => ({
            loadRecentFiles: vi.fn(() => [
                "C:/Users/Test/Documents/activity1.fit",
                "C:/Users/Test/Documents/activity2.fit",
            ]),
            getShortRecentName: vi.fn((p: string) => p.split(/\\|\//g).slice(-2).join("\\")),
        }));
        // reset spies and call logs
        const sendSpy = (globalThis as any).__electronSendSpy;
        if (sendSpy && typeof sendSpy.mockReset === "function") sendSpy.mockReset();
        else (globalThis as any).__electronSendSpy = vi.fn();
        const shellSpy = (globalThis as any).__electronShellOpenSpy;
        if (shellSpy && typeof shellSpy.mockReset === "function") shellSpy.mockReset();
        else (globalThis as any).__electronShellOpenSpy = vi.fn();
        (globalThis as any).__ipcCalls = [];
        (globalThis as any).__shellOpenCalls = [];
        (globalThis as any).__mockRecentFiles = [
            "C:/Users/Test/Documents/activity1.fit",
            "C:/Users/Test/Documents/activity2.fit",
        ];
        (globalThis as any).__electronHoistedMock = {
            Menu: {
                buildFromTemplate: (template: any[]) => {
                    capturedTemplate = template;
                    return { items: template } as any;
                },
                setApplicationMenu: vi.fn(),
            },
            BrowserWindow: {
                getFocusedWindow: () => ({
                    close: vi.fn(),
                    webContents: {
                        send: (...args: any[]) => {
                            const calls = (globalThis as any).__ipcCalls || [];
                            calls.push(args);
                            (globalThis as any).__ipcCalls = calls;
                            const fn = (globalThis as any).__electronSendSpy || vi.fn();
                            return fn(...args);
                        },
                    },
                }),
            },
            app: { isPackaged: true, name: "FitFileViewer" },
            shell: {
                openExternal: (...args: any[]) => {
                    const calls = (globalThis as any).__shellOpenCalls || [];
                    calls.push(args);
                    (globalThis as any).__shellOpenCalls = calls;
                    const fn = (globalThis as any).__electronShellOpenSpy || vi.fn();
                    return fn(...args);
                },
            },
        };
    });

    afterEach(() => {
        capturedTemplate = null;
        try {
            delete (globalThis as any).__mockRecentFiles;
        } catch {}
    });

    function importCreateAppMenu() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require("../../../utils/app/menu/createAppMenu.js");
        return mod.createAppMenu as (mainWindow?: any, currentTheme?: string, loadedFitFilePath?: string | null) => void;
    }

    it("invokes BrowserWindow.close() from File > Close Window", () => {
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const closeItem = fileMenu.submenu.find((i: any) => i.label === "🚪 Close Window");
        // Instead of spying a specific instance (which may be recreated), stub getFocusedWindow to return
        // a deterministic object with a spy for close, ensuring the handler calls it
        const originalBW = (globalThis as any).__electronHoistedMock.BrowserWindow;
        const winMock = { close: vi.fn() };
        (globalThis as any).__electronHoistedMock.BrowserWindow = {
            ...originalBW,
            getFocusedWindow: () => winMock,
        };
        closeItem.click();
        expect(winMock.close).toHaveBeenCalled();
        (globalThis as any).__electronHoistedMock.BrowserWindow = originalBW;
    });

    it("external help links call shell.openExternal with correct URLs", () => {
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const docs = help.submenu.find((i: any) => i.label === "📖 Documentation");
        const repo = help.submenu.find((i: any) => i.label === "🌐 GitHub Repository");
        const issues = help.submenu.find((i: any) => i.label === "❗Report an Issue");
        docs.click();
        repo.click();
        issues.click();
        const calls: any[][] = (globalThis as any).__shellOpenCalls || [];
        // Validate that each expected URL appears at least once without relying on call order
        const urls = calls.map((c) => c[0]);
        expect(urls.some((u) => /#readme/.test(u))).toBe(true);
        expect(urls.some((u) => /FitFileViewer$/.test(u))).toBe(true);
        expect(urls.some((u) => /issues$/.test(u))).toBe(true);
    });

    it("decoder options send IPC via BrowserWindow fallback when no mainWindow", () => {
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", "C:/x.fit");
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const decoderMenu = settingsMenu.submenu.find((i: any) => i.label === "💿 Decoder Options");
        const includeUnknown = decoderMenu.submenu.find((i: any) => String(i.label).includes("includeUnknownData"));
        includeUnknown.click({ checked: false });
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        const found = ipcCalls.some((c) => c[0] === "decoder-options-changed" && c[1] && c[1].includeUnknownData === false);
        expect(found).toBe(true);
    });

    it("high contrast white/yellow/off send IPC via BrowserWindow fallback", () => {
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find((i: any) => i.label === "♿ Accessibility");
        const hc = accessMenu.submenu.find((i: any) => i.label === "🎨 High Contrast Mode");
        const white = hc.submenu.find((i: any) => i.label === "⬜ White");
        const yellow = hc.submenu.find((i: any) => i.label === "🟨 Yellow");
        const off = hc.submenu.find((i: any) => i.label === "🚫 Off");
        white.click();
        yellow.click();
        off.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toEqual(
            expect.arrayContaining([
                ["set-high-contrast", "white"],
                ["set-high-contrast", "yellow"],
                ["set-high-contrast", "off"],
            ])
        );
    });

    it("uses mainWindow fallback when BrowserWindow.getFocusedWindow returns null (About, Keyboard, High Contrast)", () => {
        const createAppMenu = importCreateAppMenu();
        const send = vi.fn();
        const fakeWin = { webContents: { send } };
        // Force getFocusedWindow to return null
        const originalBW = (globalThis as any).__electronHoistedMock.BrowserWindow;
        (globalThis as any).__electronHoistedMock.BrowserWindow = {
            ...originalBW,
            getFocusedWindow: () => null,
        };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        help.submenu.find((i: any) => i.label === "ℹ️ About").click();
        help.submenu.find((i: any) => i.label === "⌨️ Keyboard Shortcuts").click();
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const hc = viewMenu.submenu
            .find((i: any) => i.label === "♿ Accessibility")
            .submenu.find((i: any) => i.label === "🎨 High Contrast Mode");
        hc.submenu.find((i: any) => i.label === "⬜ White").click();
        hc.submenu.find((i: any) => i.label === "🟨 Yellow").click();
        hc.submenu.find((i: any) => i.label === "🚫 Off").click();
        expect(send).toHaveBeenCalledWith("menu-about");
        expect(send).toHaveBeenCalledWith("menu-keyboard-shortcuts");
        expect(send).toHaveBeenCalledWith("set-high-contrast", "white");
        expect(send).toHaveBeenCalledWith("set-high-contrast", "yellow");
        expect(send).toHaveBeenCalledWith("set-high-contrast", "off");
        (globalThis as any).__electronHoistedMock.BrowserWindow = originalBW;
    });

    it("logs error when Menu.buildFromTemplate throws", () => {
        const original = (globalThis as any).__electronHoistedMock;
        const err = new Error("boom");
        (globalThis as any).__electronHoistedMock = {
            ...original,
            Menu: {
                buildFromTemplate: () => {
                    throw err;
                },
                setApplicationMenu: vi.fn(),
            },
        };
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const createAppMenu = importCreateAppMenu();
        createAppMenu({ webContents: { send: vi.fn() } } as any, "dark", null);
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
        (globalThis as any).__electronHoistedMock = original;
    });

    it("macOS App menu appears on darwin and items send IPC", () => {
        // Preserve original platform descriptor
        const desc = Object.getOwnPropertyDescriptor(process, "platform");
        Object.defineProperty(process, "platform", { value: "darwin" });
        const original = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...original,
            app: { isPackaged: true, name: "FitFileViewer" },
        };
        vi.resetModules();
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        // First menu should be the App menu on macOS
        const appMenu = (tpl || [])[0];
        expect(appMenu.label).toBe("FitFileViewer");
        const about = appMenu.submenu.find((i: any) => i.label === "About");
        const prefs = appMenu.submenu.find((i: any) => i.label === "Preferences...");
        about.click();
        prefs.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toEqual(
            expect.arrayContaining([
                ["menu-about"],
                ["menu-preferences"],
            ])
        );
        // restore
        if (desc) Object.defineProperty(process, "platform", desc);
        (globalThis as any).__electronHoistedMock = original;
    });

    it("macOS App menu label falls back to 'App' when app.name missing", () => {
        const desc = Object.getOwnPropertyDescriptor(process, "platform");
        Object.defineProperty(process, "platform", { value: "darwin" });
        const original = (globalThis as any).__electronHoistedMock;
        // Provide an app object without a name to trigger label fallback
        (globalThis as any).__electronHoistedMock = {
            ...original,
            app: { isPackaged: true },
        };
        vi.resetModules();
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const appMenu = (tpl || [])[0];
        expect(appMenu.label).toBe("App");
        // Ensure items are still functional
        const about = appMenu.submenu.find((i: any) => i.label === "About");
        const prefs = appMenu.submenu.find((i: any) => i.label === "Preferences...");
        about.click();
        prefs.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toEqual(
            expect.arrayContaining([["menu-about"], ["menu-preferences"]])
        );
        if (desc) Object.defineProperty(process, "platform", desc);
        (globalThis as any).__electronHoistedMock = original;
    });

    it("skips setting menu and warns when template is invalid (forced via Array.isArray stub)", () => {
        const originalIsArray = Array.isArray;
        // Force the defensive branch: treat the valid template as invalid
        // so the function warns and returns early.
        // @ts-ignore
        Array.isArray = () => false;
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const setAppMenuSpy = vi.fn();
        const original = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...original,
            Menu: {
                buildFromTemplate: (template: any[]) => ({ items: template } as any),
                setApplicationMenu: setAppMenuSpy,
            },
        };
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        expect(warnSpy).toHaveBeenCalledWith(
            "[createAppMenu] WARNING: Attempted to set an empty or invalid menu template. Skipping Menu.setApplicationMenu."
        );
        expect(setAppMenuSpy).not.toHaveBeenCalled();
        warnSpy.mockRestore();
        // restore globals
        // @ts-ignore
        Array.isArray = originalIsArray;
        (globalThis as any).__electronHoistedMock = original;
    });

    it("uses default theme from getTheme when currentTheme is undefined", () => {
        const createAppMenu = importCreateAppMenu();
        createAppMenu({ webContents: { send: vi.fn() } } as any, undefined, null);
        const tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        const themeMenu = settingsMenu.submenu.find((i: any) => i.label === "🎨 Theme");
        const dark = themeMenu.submenu.find((i: any) => i.label === "🌑 Dark");
        const light = themeMenu.submenu.find((i: any) => i.label === "🌕 Light");
        // getTheme returns 'dark' by default; ensure dark is checked
        expect(dark.checked).toBe(true);
        expect(light.checked).toBe(false);
    });
});

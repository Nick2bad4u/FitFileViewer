import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

// Capture passed template for assertions
let capturedTemplate: any[] | null = null;

type AnyMockFn = (...args: any[]) => unknown;
type GetShortRecentName = (path: string) => string;
type LoadRecentFiles = () => string[];

const createMock = (): Mock<AnyMockFn> => vi.fn<AnyMockFn>();

function getRequiredMockResult<T>(
    results: Array<{ type: string; value?: T }>,
    index: number
): { type: string; value?: T } {
    const result = results[index];

    if (!result) {
        throw new Error(`Expected mock result ${index}`);
    }

    return result;
}

function pickMenuFields(
    item: Record<string, unknown>,
    fields: string[]
): Record<string, unknown> {
    return Object.fromEntries(fields.map((field) => [field, item[field]]));
}

function restoreDebugMenuEnv(originalEnv: string | undefined): void {
    if (originalEnv === undefined) {
        delete process.env.FFV_DEBUG_MENU;
        return;
    }

    process.env.FFV_DEBUG_MENU = originalEnv;
}

function restoreProcessPlatform(
    descriptor: PropertyDescriptor | undefined
): void {
    if (descriptor) Object.defineProperty(process, "platform", descriptor);
}

// Provide an Electron mock that always proxies to the hoisted global mock
// This keeps behavior deterministic and avoids import-order pitfalls
vi.mock(import("electron"), () => {
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
vi.mock(import("electron-conf"), () => ({}) as any);

// Recent files utilities will be mocked per-test via vi.doMock inside beforeEach/individual tests

// Do not mock electron-conf to exercise fallback if not present; if present, it's fine.

describe("createAppMenu", () => {
    beforeEach(() => {
        capturedTemplate = null;
        vi.resetModules();
        try {
            delete (globalThis as any).__FFV_createAppMenuExports;
        } catch {}
        // Default recent files mock for most tests (can be overridden in a specific test)
        vi.doMock(
            import("../../../electron-app/utils/files/recent/recentFiles"),
            () => ({
                loadRecentFiles: vi.fn<LoadRecentFiles>(() => [
                    "C:/Users/Test/Documents/activity1.fit",
                    "C:/Users/Test/Documents/activity2.fit",
                ]),
                getShortRecentName: vi.fn<GetShortRecentName>((p) =>
                    p.split(/\\|\//g).slice(-2).join("\\")
                ),
            })
        );
        // Do NOT reassign these spies — the electron mock captures the original references.
        // Instead, clear existing calls so expectations remain accurate per-test.
        const sendSpy = (globalThis as any).__electronSendSpy;
        if (sendSpy && typeof sendSpy.mockReset === "function")
            sendSpy.mockReset();
        else (globalThis as any).__electronSendSpy = createMock();
        const shellSpy = (globalThis as any).__electronShellOpenSpy;
        if (shellSpy && typeof shellSpy.mockReset === "function")
            shellSpy.mockReset();
        else (globalThis as any).__electronShellOpenSpy = createMock();
        const shellShowSpy = (globalThis as any).__electronShellShowSpy;
        if (shellShowSpy && typeof shellShowSpy.mockReset === "function")
            shellShowSpy.mockReset();
        else (globalThis as any).__electronShellShowSpy = createMock();
        const clipboardSpy = (globalThis as any).__electronClipboardWriteSpy;
        if (clipboardSpy && typeof clipboardSpy.mockReset === "function")
            clipboardSpy.mockReset();
        else (globalThis as any).__electronClipboardWriteSpy = createMock();
        // Initialize deterministic global logs used by the hoisted mock wrappers
        (globalThis as any).__ipcCalls = [];
        (globalThis as any).__shellOpenCalls = [];
        (globalThis as any).__shellRevealCalls = [];
        (globalThis as any).__clipboardWrites = [];
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
                setApplicationMenu: createMock(),
            },
            BrowserWindow: {
                getFocusedWindow: () => ({
                    webContents: {
                        send: (...args: any[]) => {
                            const calls = (globalThis as any).__ipcCalls || [];
                            calls.push(args);
                            (globalThis as any).__ipcCalls = calls;
                            const fn =
                                (globalThis as any).__electronSendSpy ||
                                createMock();
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
                    const fn =
                        (globalThis as any).__electronShellOpenSpy ||
                        createMock();
                    return fn(...args);
                },
                showItemInFolder: (...args: any[]) => {
                    const calls = (globalThis as any).__shellRevealCalls || [];
                    calls.push(args);
                    (globalThis as any).__shellRevealCalls = calls;
                    const fn =
                        (globalThis as any).__electronShellShowSpy ||
                        createMock();
                    return fn(...args);
                },
            },
            clipboard: {
                writeText: (...args: any[]) => {
                    const calls = (globalThis as any).__clipboardWrites || [];
                    calls.push(args);
                    (globalThis as any).__clipboardWrites = calls;
                    const fn =
                        (globalThis as any).__electronClipboardWriteSpy ||
                        createMock();
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
        const mod = require("../../../electron-app/utils/app/menu/createAppMenu.js");
        return mod.createAppMenu as (
            mainWindow: any,
            currentTheme?: string,
            loadedFitFilePath?: string | null
        ) => void;
    }

    it("builds a menu with File/View/Settings/Help and recent files", () => {
        expect.assertions(5);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);

        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const labels = tpl.map((i: any) => i.label);
        expect({
            labels,
        }).toStrictEqual({
            labels: [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ],
        });
        expect(labels).toStrictEqual([
            "📁 File",
            "👁️ View",
            "⚙️ Settings",
            "❓ Help",
        ]);

        // Find Open Recent submenu and verify it contains mapped items
        const fileMenu = tpl.find((i: any) => i.label === "📁 File");
        expect({
            label: "📁 File",
            submenuIsArray: Array.isArray(fileMenu.submenu),
        }).toStrictEqual({
            label: "📁 File",
            submenuIsArray: true,
        });
        const openRecent = fileMenu.submenu.find(
            (i: any) => i.label === "🕑 Open Recent"
        );
        expect({
            label: "🕑 Open Recent",
            submenuIsArray: Array.isArray(openRecent.submenu),
        }).toStrictEqual({
            label: "🕑 Open Recent",
            submenuIsArray: true,
        });
        const recentLabels = openRecent.submenu.map((i: any) => i.label);
        expect(recentLabels).toStrictEqual([
            "activity1.fit",
            "activity2.fit",
            undefined,
            "🧹 Clear Recent Files",
        ]);
    });

    it("enables Summary Columns when a file is loaded and triggers IPC on click", () => {
        expect.assertions(3);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/path/to/file.fit");
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        expect({
            labels: tpl.map((i: any) => i.label),
        }).toStrictEqual({
            labels: [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ],
        });
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const summary = settingsMenu.submenu.find(
            (i: any) => i.label === "📊 Summary Columns..."
        );
        expect(pickMenuFields(summary, ["enabled", "label"])).toStrictEqual({
            enabled: true,
            label: "📊 Summary Columns...",
        });
        summary.click();
        expect(send).toHaveBeenCalledWith("open-summary-column-selector");
    });

    it("clear recent files item sends notification and unload-fit-file", () => {
        expect.assertions(3);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/x.fit");
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openRecent = fileMenu.submenu.find(
            (i: any) => i.label === "🕑 Open Recent"
        );
        const clearItem = openRecent.submenu.find(
            (i: any) => i.label === "🧹 Clear Recent Files"
        );
        expect(pickMenuFields(clearItem, ["enabled", "label"])).toStrictEqual({
            enabled: true,
            label: "🧹 Clear Recent Files",
        });
        clearItem.click();
        expect(send).toHaveBeenCalledWith(
            "show-notification",
            "Recent files cleared.",
            "info"
        );
        expect(send).toHaveBeenCalledWith("unload-fit-file");
    });

    it("disables file-dependent actions when no file is loaded", () => {
        expect.assertions(8);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const labels = [
            "➕ Add FIT Files as Overlays...",
            "❌ Unload File",
            "💾 Save As...",
            "📤 Export...",
            "🖨️ Print...",
        ];
        for (const lab of labels) {
            const item = fileMenu.submenu.find((i: any) => i.label === lab);
            expect(pickMenuFields(item, ["enabled", "label"])).toStrictEqual({
                enabled: false,
                label: lab,
            });
        }
        const revealItem = fileMenu.submenu.find(
            (i: any) =>
                typeof i.label === "string" && i.label.startsWith("📂 Reveal")
        );
        expect(pickMenuFields(revealItem, ["enabled"])).toStrictEqual({
            enabled: false,
        });
        const copyItem = fileMenu.submenu.find(
            (i: any) => i.label === "📋 Copy File Path"
        );
        expect(pickMenuFields(copyItem, ["enabled", "label"])).toStrictEqual({
            enabled: false,
            label: "📋 Copy File Path",
        });
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const summary = settingsMenu.submenu.find(
            (i: any) => i.label === "📊 Summary Columns..."
        );
        expect(pickMenuFields(summary, ["enabled", "label"])).toStrictEqual({
            enabled: false,
            label: "📊 Summary Columns...",
        });
    });

    it("clicking recent file sends open-recent-file with full path", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openRecent = fileMenu.submenu.find(
            (i: any) => i.label === "🕑 Open Recent"
        );
        const firstRecent = openRecent.submenu[0];
        expect(pickMenuFields(firstRecent, ["label"])).toStrictEqual({
            label: "activity1.fit",
        });
        firstRecent.click();
        expect(send).toHaveBeenCalledWith(
            "open-recent-file",
            "C:/Users/Test/Documents/activity1.fit"
        );
    });

    it("theme radio items reflect selection and send set-theme on click", () => {
        expect.assertions(3);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        // Start with light theme
        createAppMenu(fakeWin as any, "light", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const themeMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "🎨 Theme"
        );
        const dark = themeMenu.submenu.find((i: any) => i.label === "🌑 Dark");
        const light = themeMenu.submenu.find(
            (i: any) => i.label === "🌕 Light"
        );
        expect({
            darkChecked: dark.checked,
            lightChecked: light.checked,
        }).toStrictEqual({
            darkChecked: false,
            lightChecked: true,
        });
        // Click dark and expect event
        dark.click();
        expect(send).toHaveBeenCalledWith("set-theme", "dark");
        // Click light to ensure toggling back also emits IPC
        light.click();
        expect(send).toHaveBeenCalledWith("set-theme", "light");
    });

    it("decoder options toggle sends updated options", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        // Provide a fake window to ensure deterministic IPC path
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/x.fit");
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const decoderMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "💿 Decoder Options"
        );
        // Find an option, e.g., includeUnknownData
        const includeUnknown = decoderMenu.submenu.find(
            (i: any) => i.label === "❓ includeUnknownData"
        );
        expect(pickMenuFields(includeUnknown, ["checked"])).toStrictEqual({
            checked: true,
        });
        includeUnknown.click({ checked: false });
        expect(send).toHaveBeenCalledWith("decoder-options-changed", {
            applyScaleAndOffset: true,
            convertDateTimesToDates: true,
            convertTypesToStrings: true,
            expandComponents: true,
            expandSubFields: true,
            includeUnknownData: false,
            mergeHeartRates: true,
        });
    });

    it("persists decoder options after toggling", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", "C:/x.fit");
        let tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        let settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        let decoderMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "💿 Decoder Options"
        );
        const includeUnknown = decoderMenu.submenu.find(
            (i: any) => i.label === "❓ includeUnknownData"
        );
        includeUnknown.click({ checked: false });
        createAppMenu(fakeWin as any, "dark", "C:/x.fit");
        tpl = capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        settingsMenu = (tpl || []).find((i: any) => i.label === "⚙️ Settings");
        decoderMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "💿 Decoder Options"
        );
        const refreshed = decoderMenu.submenu.find(
            (i: any) => i.label === "❓ includeUnknownData"
        );
        expect(pickMenuFields(refreshed, ["checked"])).toStrictEqual({
            checked: false,
        });
    });

    it("accessibility toggles send appropriate IPC messages", () => {
        expect.assertions(5);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find(
            (i: any) => i.label === "♿ Accessibility"
        );
        const fontSize = accessMenu.submenu.find(
            (i: any) => i.label === "🔡 Font Size"
        );
        const xs = fontSize.submenu.find(
            (i: any) => i.label === "🅰️ Extra Small"
        );
        expect(fontSize.submenu.map((i: any) => i.label)).toStrictEqual([
            "🅰️ Extra Small",
            "🔠 Small",
            "🔤 Medium",
            "🔡 Large",
            "🅰️ Extra Large",
        ]);
        expect(
            pickMenuFields(xs, [
                "checked",
                "label",
                "type",
            ])
        ).toStrictEqual({
            checked: false,
            label: "🅰️ Extra Small",
            type: "radio",
        });
        xs.click();
        expect(send).toHaveBeenCalledWith("set-font-size", "xsmall");
        const hc = accessMenu.submenu.find(
            (i: any) => i.label === "🎨 High Contrast Mode"
        );
        const black = hc.submenu.find(
            (i: any) => i.label === "⬛ Black (Default)"
        );
        expect(
            pickMenuFields(black, [
                "checked",
                "label",
                "type",
            ])
        ).toStrictEqual({
            checked: true,
            label: "⬛ Black (Default)",
            type: "radio",
        });
        black.click();
        expect(send).toHaveBeenCalledWith("set-high-contrast", "black");
    });

    it("help menu contains external links and other items send IPC", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const docs = help.submenu.find(
            (i: any) => i.label === "📖 Documentation"
        );
        const repo = help.submenu.find(
            (i: any) => i.label === "🌐 GitHub Repository"
        );
        const issues = help.submenu.find(
            (i: any) => i.label === "❗Report an Issue"
        );
        docs.click();
        repo.click();
        issues.click();
        expect(
            ((globalThis as any).__shellOpenCalls || []).map(
                (call: any[]) => call[0]
            )
        ).toStrictEqual([
            "https://github.com/Nick2bad4u/FitFileViewer#readme",
            "https://github.com/Nick2bad4u/FitFileViewer",
            "https://github.com/Nick2bad4u/FitFileViewer/issues",
        ]);

        const about = help.submenu.find((i: any) => i.label === "ℹ️ About");
        const shortcuts = help.submenu.find(
            (i: any) => i.label === "⌨️ Keyboard Shortcuts"
        );
        about.click();
        shortcuts.click();
        expect((globalThis as any).__ipcCalls).toStrictEqual([
            ["menu-about"],
            ["menu-keyboard-shortcuts"],
        ]);
    });

    it("help > About and Keyboard Shortcuts items are present and clickable", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const about = help.submenu.find((i: any) => i.label === "ℹ️ About");
        const shortcuts = help.submenu.find(
            (i: any) => i.label === "⌨️ Keyboard Shortcuts"
        );
        about.click();
        shortcuts.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toStrictEqual([
            ["menu-about"],
            ["menu-keyboard-shortcuts"],
        ]);
    });

    it("file > Close Window item is present and clickable", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        let closed = false;
        (globalThis as any).__electronHoistedMock.BrowserWindow = {
            getFocusedWindow: () => ({
                close: () => {
                    closed = true;
                },
            }),
        };
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const closeItem = fileMenu.submenu.find(
            (i: any) => i.label === "🚪 Close Window"
        );
        closeItem.click();

        expect(closed).toBe(true);
    });

    // Note: macOS-specific App menu is covered indirectly via code paths; explicit darwin test can be flaky in CI mocks.

    it("disables Clear Recent Files when none exist (robust)", async () => {
        expect.assertions(2);
        // Ensure determinism: force the recent files module to return an empty list and clear globals
        (globalThis as any).__mockRecentFiles = [];
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        vi.resetModules();
        // Also reset the default mock from beforeEach so it doesn't override
        vi.doMock(
            import("../../../electron-app/utils/files/recent/recentFiles"),
            () => ({
                loadRecentFiles: vi.fn<LoadRecentFiles>(() => []),
                getShortRecentName: vi.fn<GetShortRecentName>((p) =>
                    p ? p.split(/\\|\//g).pop() : ""
                ),
            })
        );

        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        expect({
            labels: (tpl || []).map((i: any) => i.label),
        }).toStrictEqual({
            labels: [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ],
        });
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openRecent = fileMenu.submenu.find(
            (i: any) => i.label === "🕑 Open Recent"
        );
        const clearItem = openRecent.submenu.find(
            (i: any) => i.label === "🧹 Clear Recent Files"
        );
        // The most reliable signal of an empty recent list is the Clear item being disabled
        expect(pickMenuFields(clearItem, ["enabled", "label"])).toStrictEqual({
            enabled: false,
            label: "🧹 Clear Recent Files",
        });
    });

    it("file actions send appropriate IPC when enabled", () => {
        expect.assertions(8);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/path/to/file.fit");
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const unloadItem = fileMenu.submenu.find(
            (i: any) => i.label === "❌ Unload File"
        );
        expect(pickMenuFields(unloadItem, ["enabled", "label"])).toStrictEqual({
            enabled: true,
            label: "❌ Unload File",
        });
        unloadItem.click();
        const saveAsItem = fileMenu.submenu.find(
            (i: any) => i.label === "💾 Save As..."
        );
        const exportItem = fileMenu.submenu.find(
            (i: any) => i.label === "📤 Export..."
        );
        const printItem = fileMenu.submenu.find(
            (i: any) => i.label === "🖨️ Print..."
        );
        expect(
            pickMenuFields(saveAsItem, [
                "accelerator",
                "enabled",
                "label",
            ])
        ).toStrictEqual({
            accelerator: "CmdOrCtrl+S",
            enabled: true,
            label: "💾 Save As...",
        });
        expect(pickMenuFields(exportItem, ["enabled", "label"])).toStrictEqual({
            enabled: true,
            label: "📤 Export...",
        });
        expect(
            pickMenuFields(printItem, [
                "accelerator",
                "enabled",
                "label",
            ])
        ).toStrictEqual({
            accelerator: "CmdOrCtrl+P",
            enabled: true,
            label: "🖨️ Print...",
        });
        saveAsItem.click();
        exportItem.click();
        printItem.click();
        expect(send).toHaveBeenCalledWith("unload-fit-file");
        expect(send).toHaveBeenCalledWith("menu-save-as");
        expect(send).toHaveBeenCalledWith("menu-export");
        expect(send).toHaveBeenCalledWith("menu-print");
    });

    it("open file menu item sends menu-open-file", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const openItem = fileMenu.submenu.find(
            (i: any) => i.label === "📂 Open FIT File..."
        );
        expect(
            pickMenuFields(openItem, ["accelerator", "label"])
        ).toStrictEqual({
            accelerator: "CmdOrCtrl+O",
            label: "📂 Open FIT File...",
        });
        openItem.click();
        expect(send).toHaveBeenCalledWith("menu-open-file");
    });

    it("overlay menu item sends menu-open-overlay", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", "C:/path/to/file.fit");
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const overlayItem = fileMenu.submenu.find(
            (i: any) => i.label === "➕ Add FIT Files as Overlays..."
        );
        expect(pickMenuFields(overlayItem, ["enabled", "label"])).toStrictEqual(
            {
                enabled: true,
                label: "➕ Add FIT Files as Overlays...",
            }
        );
        overlayItem.click();
        expect(send).toHaveBeenCalledWith("menu-open-overlay");
    });

    it("reveal action calls shell.showItemInFolder when file loaded", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        const filePath = "C:/Users/Test/Documents/activity1.fit";
        createAppMenu(fakeWin as any, "dark", filePath);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const revealItem = fileMenu.submenu.find(
            (i: any) =>
                typeof i.label === "string" && i.label.startsWith("📂 Reveal")
        );
        expect(pickMenuFields(revealItem, ["enabled"])).toStrictEqual({
            enabled: true,
        });
        revealItem.click();
        const revealSpy = vi.mocked((globalThis as any).__electronShellShowSpy);
        expect(revealSpy).toHaveBeenCalledWith(filePath);
    });

    it("copy file path writes to clipboard and notifies", () => {
        expect.assertions(3);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        const filePath = "C:/Users/Test/Documents/activity2.fit";
        createAppMenu(fakeWin as any, "dark", filePath);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const copyItem = fileMenu.submenu.find(
            (i: any) => i.label === "📋 Copy File Path"
        );
        expect(
            pickMenuFields(copyItem, [
                "accelerator",
                "enabled",
                "label",
            ])
        ).toStrictEqual({
            accelerator: "CmdOrCtrl+Alt+C",
            enabled: true,
            label: "📋 Copy File Path",
        });
        copyItem.click();
        const clipboardSpy = vi.mocked(
            (globalThis as any).__electronClipboardWriteSpy
        );
        expect(clipboardSpy).toHaveBeenCalledWith(filePath);
        expect(send).toHaveBeenCalledWith(
            "show-notification",
            "File path copied to clipboard.",
            "success"
        );
    });

    it("theme can toggle to light and sends set-theme", () => {
        expect.assertions(3);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        // Start dark then choose Light
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const themeMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "🎨 Theme"
        );
        const light = themeMenu.submenu.find(
            (i: any) => i.label === "🌕 Light"
        );
        expect(
            pickMenuFields(light, [
                "checked",
                "label",
                "type",
            ])
        ).toStrictEqual({
            checked: false,
            label: "🌕 Light",
            type: "radio",
        });
        light.click();
        expect(send).toHaveBeenCalledWith("set-theme", "light");
        createAppMenu(fakeWin as any, undefined, null);
        const refreshedTemplate =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const refreshedSettingsMenu = refreshedTemplate.find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const refreshedThemeMenu = refreshedSettingsMenu.submenu.find(
            (i: any) => i.label === "🎨 Theme"
        );
        const refreshedLight = refreshedThemeMenu.submenu.find(
            (i: any) => i.label === "🌕 Light"
        );
        expect(
            pickMenuFields(refreshedLight, ["checked", "label"])
        ).toStrictEqual({
            checked: false,
            label: "🌕 Light",
        });
    });

    it("all font sizes send set-font-size IPC", () => {
        expect.assertions(11);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find(
            (i: any) => i.label === "♿ Accessibility"
        );
        const fontSize = accessMenu.submenu.find(
            (i: any) => i.label === "🔡 Font Size"
        );
        const sizes = [
            { label: "🅰️ Extra Small", val: "xsmall" },
            { label: "🔠 Small", val: "small" },
            { label: "🔤 Medium", val: "medium" },
            { label: "🔡 Large", val: "large" },
            { label: "🅰️ Extra Large", val: "xlarge" },
        ];
        for (const s of sizes) {
            const item = fontSize.submenu.find((i: any) => i.label === s.label);
            expect(pickMenuFields(item, ["label", "type"])).toStrictEqual({
                label: s.label,
                type: "radio",
            });
            item.click();
            expect(send).toHaveBeenCalledWith("set-font-size", s.val);
        }
        expect(fontSize.submenu.map((i: any) => i.label)).toStrictEqual(
            sizes.map((s) => s.label)
        );
    });

    it("all high contrast options present; black option sends IPC", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find(
            (i: any) => i.label === "♿ Accessibility"
        );
        const hc = accessMenu.submenu.find(
            (i: any) => i.label === "🎨 High Contrast Mode"
        );
        // Verify all options exist and are clickable
        const black = hc.submenu.find(
            (i: any) => i.label === "⬛ Black (Default)"
        );
        const white = hc.submenu.find((i: any) => i.label === "⬜ White");
        const yellow = hc.submenu.find((i: any) => i.label === "🟨 Yellow");
        const off = hc.submenu.find((i: any) => i.label === "🚫 Off");
        expect(
            [
                black,
                white,
                yellow,
                off,
            ].map((item: any) => pickMenuFields(item, ["label", "type"]))
        ).toStrictEqual([
            {
                label: "⬛ Black (Default)",
                type: "radio",
            },
            {
                label: "⬜ White",
                type: "radio",
            },
            {
                label: "🟨 Yellow",
                type: "radio",
            },
            {
                label: "🚫 Off",
                type: "radio",
            },
        ]);

        black.click();
        expect(send).toHaveBeenCalledWith("set-high-contrast", "black");
    });

    it("high contrast white/yellow/off items send IPC values", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find(
            (i: any) => i.label === "♿ Accessibility"
        );
        const hc = accessMenu.submenu.find(
            (i: any) => i.label === "🎨 High Contrast Mode"
        );
        for (const lab of [
            "⬜ White",
            "🟨 Yellow",
            "🚫 Off",
        ]) {
            const item = hc.submenu.find((i: any) => i.label === lab);
            item.click();
        }

        expect((globalThis as any).__ipcCalls).toStrictEqual([
            ["set-high-contrast", "white"],
            ["set-high-contrast", "yellow"],
            ["set-high-contrast", "off"],
        ]);
    });

    it("help external links are present and have click handlers", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const docs = help.submenu.find(
            (i: any) => i.label === "📖 Documentation"
        );
        const repo = help.submenu.find(
            (i: any) => i.label === "🌐 GitHub Repository"
        );
        const issues = help.submenu.find(
            (i: any) => i.label === "❗Report an Issue"
        );
        // Exercise clicks to ensure the code paths are executed (shell is mocked globally)
        docs.click();
        repo.click();
        issues.click();
        const urls = ((globalThis as any).__shellOpenCalls || []).map(
            (c: any[]) => c[0]
        );
        expect(urls).toStrictEqual([
            "https://github.com/Nick2bad4u/FitFileViewer#readme",
            "https://github.com/Nick2bad4u/FitFileViewer",
            "https://github.com/Nick2bad4u/FitFileViewer/issues",
        ]);
    });

    it("help > About and Keyboard Shortcuts send IPC", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const about = help.submenu.find((i: any) => i.label === "ℹ️ About");
        const shortcuts = help.submenu.find(
            (i: any) => i.label === "⌨️ Keyboard Shortcuts"
        );
        about.click();
        shortcuts.click();

        expect((globalThis as any).__ipcCalls).toStrictEqual([
            ["menu-about"],
            ["menu-keyboard-shortcuts"],
        ]);
    });

    it("file > Close Window closes the focused window", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        let closed = false;
        (globalThis as any).__electronHoistedMock.BrowserWindow = {
            getFocusedWindow: () => ({
                close: () => {
                    closed = true;
                },
            }),
        };
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const closeItem = fileMenu.submenu.find(
            (i: any) => i.label === "🚪 Close Window"
        );
        closeItem.click();

        expect(closed).toBe(true);
    });

    it("restart and Update click sends IPC even if disabled", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        // No need to depend on a specific window's send spy because the handler
        // uses BrowserWindow.getFocusedWindow() first; instead assert via global IPC log
        createAppMenu(
            { webContents: { send: createMock() } } as any,
            "dark",
            null
        );
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const restart = help.submenu.find(
            (i: any) => i.id === "restart-update"
        );
        expect(pickMenuFields(restart, ["enabled", "id"])).toStrictEqual({
            enabled: false,
            id: "restart-update",
        });
        // Call handler directly to exercise branch
        restart.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toStrictEqual([["menu-restart-update"]]);
    });

    it("exposes template via global when Menu API is unavailable", () => {
        expect.assertions(1);
        // Remove Menu API from hoisted mock to trigger fallback branch
        const originalMock = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            Menu: undefined,
        };
        // Clear any existing template exposure
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl = (globalThis as any).__lastBuiltMenuTemplate as any[];
        expect({
            labels: tpl.map((item) => item.label),
        }).toStrictEqual({
            labels: [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ],
        });
        // restore
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    it("overwrites previously exposed template when Menu API is unavailable (else branch)", () => {
        expect.assertions(2);
        const originalMock = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            Menu: undefined,
        };
        // Seed an existing template to hit the else path
        (globalThis as any).__lastBuiltMenuTemplate = [{ label: "OLD" }];
        const createAppMenu = importCreateAppMenu();
        createAppMenu(
            { webContents: { send: createMock() } } as any,
            "dark",
            null
        );
        const tpl = (globalThis as any).__lastBuiltMenuTemplate as any[];
        expect({
            labels: tpl.map((item) => item.label),
        }).toStrictEqual({
            labels: [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ],
        });
        const fileMenu = tpl.find((i: any) => i.label === "📁 File");
        expect({
            label: "📁 File",
            submenuIsArray: Array.isArray(fileMenu.submenu),
        }).toStrictEqual({
            label: "📁 File",
            submenuIsArray: true,
        });
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    it("logs menu labels when app is not packaged (debug branch)", () => {
        expect.assertions(2);
        // Spy on console.log and set app.isPackaged=false to execute debug logging path
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        const originalMock = (globalThis as any).__electronHoistedMock;
        const originalEnv = process.env.FFV_DEBUG_MENU;
        process.env.FFV_DEBUG_MENU = "1";
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            app: { ...originalMock.app, isPackaged: false },
        };
        const createAppMenu = importCreateAppMenu();
        const fakeWin = { webContents: { send: createMock() } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        expect(tpl.map((i: any) => i.label)).toStrictEqual([
            "📁 File",
            "👁️ View",
            "⚙️ Settings",
            "❓ Help",
        ]);
        expect(logSpy).toHaveBeenCalledWith(
            "[createAppMenu] Setting application menu. Menu labels:",
            [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ]
        );
        logSpy.mockRestore();
        restoreDebugMenuEnv(originalEnv);
        (globalThis as any).__electronHoistedMock = originalMock;
    });

    it("check for updates sends menu-check-for-updates", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const check = settingsMenu.submenu.find(
            (i: any) => i.label === "🔄 Check for Updates..."
        );
        expect(pickMenuFields(check, ["label"])).toStrictEqual({
            label: "🔄 Check for Updates...",
        });
        check.click();
        expect(send).toHaveBeenCalledWith("menu-check-for-updates");
    });

    it("logs debug warning when Electron Menu is missing and exposes template", () => {
        expect.assertions(2);
        const originalMock = (globalThis as any).__electronHoistedMock;
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        // Remove Menu to force both early debug log and fallback exposure path
        (globalThis as any).__electronHoistedMock = {
            ...originalMock,
            Menu: undefined,
        };
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        const createAppMenu = importCreateAppMenu();
        createAppMenu(
            { webContents: { send: createMock() } } as any,
            "dark",
            null
        );
        const tpl = (globalThis as any).__lastBuiltMenuTemplate as any[];
        expect({
            labels: tpl.map((item) => item.label),
        }).toStrictEqual({
            labels: [
                "📁 File",
                "👁️ View",
                "⚙️ Settings",
                "❓ Help",
            ],
        });
        expect(warnSpy).toHaveBeenCalledWith(
            "[createAppMenu] WARNING: Electron Menu API unavailable; template exposed for tests."
        );
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
        try {
            delete (globalThis as any).__FFV_createAppMenuExports;
        } catch {}
        vi.doMock(
            import("../../../electron-app/utils/files/recent/recentFiles"),
            () => ({
                loadRecentFiles: vi.fn<LoadRecentFiles>(() => [
                    "C:/Users/Test/Documents/activity1.fit",
                    "C:/Users/Test/Documents/activity2.fit",
                ]),
                getShortRecentName: vi.fn<GetShortRecentName>((p) =>
                    p.split(/\\|\//g).slice(-2).join("\\")
                ),
            })
        );
        // reset spies and call logs
        const sendSpy = (globalThis as any).__electronSendSpy;
        if (sendSpy && typeof sendSpy.mockReset === "function")
            sendSpy.mockReset();
        else (globalThis as any).__electronSendSpy = createMock();
        const shellSpy = (globalThis as any).__electronShellOpenSpy;
        if (shellSpy && typeof shellSpy.mockReset === "function")
            shellSpy.mockReset();
        else (globalThis as any).__electronShellOpenSpy = createMock();
        const shellShowSpy = (globalThis as any).__electronShellShowSpy;
        if (shellShowSpy && typeof shellShowSpy.mockReset === "function")
            shellShowSpy.mockReset();
        else (globalThis as any).__electronShellShowSpy = createMock();
        const clipboardSpy = (globalThis as any).__electronClipboardWriteSpy;
        if (clipboardSpy && typeof clipboardSpy.mockReset === "function")
            clipboardSpy.mockReset();
        else (globalThis as any).__electronClipboardWriteSpy = createMock();
        (globalThis as any).__ipcCalls = [];
        (globalThis as any).__shellOpenCalls = [];
        (globalThis as any).__shellRevealCalls = [];
        (globalThis as any).__clipboardWrites = [];
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
                setApplicationMenu: createMock(),
            },
            BrowserWindow: {
                getFocusedWindow: () => ({
                    close: createMock(),
                    webContents: {
                        send: (...args: any[]) => {
                            const calls = (globalThis as any).__ipcCalls || [];
                            calls.push(args);
                            (globalThis as any).__ipcCalls = calls;
                            const fn =
                                (globalThis as any).__electronSendSpy ||
                                createMock();
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
                    const fn =
                        (globalThis as any).__electronShellOpenSpy ||
                        createMock();
                    return fn(...args);
                },
                showItemInFolder: (...args: any[]) => {
                    const calls = (globalThis as any).__shellRevealCalls || [];
                    calls.push(args);
                    (globalThis as any).__shellRevealCalls = calls;
                    const fn =
                        (globalThis as any).__electronShellShowSpy ||
                        createMock();
                    return fn(...args);
                },
            },
            clipboard: {
                writeText: (...args: any[]) => {
                    const calls = (globalThis as any).__clipboardWrites || [];
                    calls.push(args);
                    (globalThis as any).__clipboardWrites = calls;
                    const fn =
                        (globalThis as any).__electronClipboardWriteSpy ||
                        createMock();
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
        const mod = require("../../../electron-app/utils/app/menu/createAppMenu.js");
        return mod.createAppMenu as (
            mainWindow?: any,
            currentTheme?: string,
            loadedFitFilePath?: string | null
        ) => void;
    }

    it("invokes BrowserWindow.close() from File > Close Window", () => {
        expect.assertions(2);
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const fileMenu = (tpl || []).find((i: any) => i.label === "📁 File");
        const closeItem = fileMenu.submenu.find(
            (i: any) => i.label === "🚪 Close Window"
        );
        // Instead of spying a specific instance (which may be recreated), stub getFocusedWindow to return
        // a deterministic object with a spy for close, ensuring the handler calls it
        const originalBW = (globalThis as any).__electronHoistedMock
            .BrowserWindow;
        const winMock = { close: createMock() };
        (globalThis as any).__electronHoistedMock.BrowserWindow = {
            ...originalBW,
            getFocusedWindow: () => winMock,
        };
        closeItem.click();
        expect(winMock.close).toHaveBeenCalledWith();
        expect(
            pickMenuFields(closeItem, ["accelerator", "label"])
        ).toStrictEqual({
            accelerator: "CmdOrCtrl+W",
            label: "🚪 Close Window",
        });
        (globalThis as any).__electronHoistedMock.BrowserWindow = originalBW;
    });

    it("external help links call shell.openExternal with correct URLs", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        const docs = help.submenu.find(
            (i: any) => i.label === "📖 Documentation"
        );
        const repo = help.submenu.find(
            (i: any) => i.label === "🌐 GitHub Repository"
        );
        const issues = help.submenu.find(
            (i: any) => i.label === "❗Report an Issue"
        );
        docs.click();
        repo.click();
        issues.click();
        const calls: any[][] = (globalThis as any).__shellOpenCalls || [];
        // Validate the exact help-link click order used by the menu.
        const urls = calls.map((c) => c[0]);
        expect(urls).toStrictEqual([
            "https://github.com/Nick2bad4u/FitFileViewer#readme",
            "https://github.com/Nick2bad4u/FitFileViewer",
            "https://github.com/Nick2bad4u/FitFileViewer/issues",
        ]);
    });

    it("decoder options send IPC via BrowserWindow fallback when no mainWindow", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", "C:/x.fit");
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const decoderMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "💿 Decoder Options"
        );
        const includeUnknown = decoderMenu.submenu.find(
            (i: any) => i.label === "❓ includeUnknownData"
        );
        includeUnknown.click({ checked: false });
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toStrictEqual([
            [
                "decoder-options-changed",
                {
                    applyScaleAndOffset: true,
                    convertDateTimesToDates: true,
                    convertTypesToStrings: true,
                    expandComponents: true,
                    expandSubFields: true,
                    includeUnknownData: false,
                    mergeHeartRates: true,
                },
            ],
        ]);
    });

    it("high contrast white/yellow/off send IPC via BrowserWindow fallback", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        createAppMenu(undefined, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const accessMenu = viewMenu.submenu.find(
            (i: any) => i.label === "♿ Accessibility"
        );
        const hc = accessMenu.submenu.find(
            (i: any) => i.label === "🎨 High Contrast Mode"
        );
        const white = hc.submenu.find((i: any) => i.label === "⬜ White");
        const yellow = hc.submenu.find((i: any) => i.label === "🟨 Yellow");
        const off = hc.submenu.find((i: any) => i.label === "🚫 Off");
        white.click();
        yellow.click();
        off.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toStrictEqual([
            ["set-high-contrast", "white"],
            ["set-high-contrast", "yellow"],
            ["set-high-contrast", "off"],
        ]);
    });

    it("uses mainWindow fallback when BrowserWindow.getFocusedWindow returns null (About, Keyboard, High Contrast)", () => {
        expect.assertions(7);
        const createAppMenu = importCreateAppMenu();
        const send = createMock();
        const fakeWin = { webContents: { send } };
        // Force getFocusedWindow to return null
        const originalBW = (globalThis as any).__electronHoistedMock
            .BrowserWindow;
        (globalThis as any).__electronHoistedMock.BrowserWindow = {
            ...originalBW,
            getFocusedWindow: () => null,
        };
        createAppMenu(fakeWin as any, "dark", null);
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const help = (tpl || []).find((i: any) => i.label === "❓ Help");
        help.submenu.find((i: any) => i.label === "ℹ️ About").click();
        help.submenu
            .find((i: any) => i.label === "⌨️ Keyboard Shortcuts")
            .click();
        const viewMenu = (tpl || []).find((i: any) => i.label === "👁️ View");
        const hc = viewMenu.submenu
            .find((i: any) => i.label === "♿ Accessibility")
            .submenu.find((i: any) => i.label === "🎨 High Contrast Mode");
        hc.submenu.find((i: any) => i.label === "⬜ White").click();
        hc.submenu.find((i: any) => i.label === "🟨 Yellow").click();
        hc.submenu.find((i: any) => i.label === "🚫 Off").click();
        expect(help.submenu.map((i: any) => i.label ?? i.type)).toStrictEqual([
            "ℹ️ About",
            "separator",
            "📖 Documentation",
            "🌐 GitHub Repository",
            "❗Report an Issue",
            "separator",
            "⌨️ Keyboard Shortcuts",
            "🔄 Restart and Update",
        ]);
        expect(hc.submenu.map((i: any) => i.label)).toStrictEqual([
            "⬛ Black (Default)",
            "⬜ White",
            "🟨 Yellow",
            "🚫 Off",
        ]);
        expect(send).toHaveBeenCalledWith("menu-about");
        expect(send).toHaveBeenCalledWith("menu-keyboard-shortcuts");
        expect(send).toHaveBeenCalledWith("set-high-contrast", "white");
        expect(send).toHaveBeenCalledWith("set-high-contrast", "yellow");
        expect(send).toHaveBeenCalledWith("set-high-contrast", "off");
        (globalThis as any).__electronHoistedMock.BrowserWindow = originalBW;
    });

    it("logs error when Menu.buildFromTemplate throws", () => {
        expect.assertions(2);
        const original = (globalThis as any).__electronHoistedMock;
        const err = new Error("boom");
        (globalThis as any).__electronHoistedMock = {
            ...original,
            Menu: {
                buildFromTemplate: () => {
                    throw err;
                },
                setApplicationMenu: createMock(),
            },
        };
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        (globalThis as any).__lastBuiltMenuTemplate = undefined;
        const createAppMenu = importCreateAppMenu();
        createAppMenu(
            { webContents: { send: createMock() } } as any,
            "dark",
            null
        );
        expect({
            lastBuiltMenuTemplate: (globalThis as any).__lastBuiltMenuTemplate,
        }).toStrictEqual({
            lastBuiltMenuTemplate: undefined,
        });
        expect(errorSpy).toHaveBeenCalledWith(
            "[createAppMenu] ERROR: Failed to set application menu:",
            err
        );
        errorSpy.mockRestore();
        (globalThis as any).__electronHoistedMock = original;
    });

    it("macOS App menu appears on darwin and items send IPC", () => {
        expect.assertions(3);
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
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        // First menu should be the App menu on macOS
        const appMenu = (tpl || [])[0];
        expect(appMenu.label).toBe("FitFileViewer");
        const about = appMenu.submenu.find((i: any) => i.label === "About");
        about.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toStrictEqual([["menu-about"]]);
        expect(appMenu.submenu.map((i: any) => i.label)).not.toContain(
            "Preferences..."
        );
        // restore
        restoreProcessPlatform(desc);
        (globalThis as any).__electronHoistedMock = original;
    });

    it("macOS App menu label falls back to 'App' when app.name missing", () => {
        expect.assertions(3);
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
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const appMenu = (tpl || [])[0];
        expect(appMenu.label).toBe("App");
        // Ensure items are still functional
        const about = appMenu.submenu.find((i: any) => i.label === "About");
        about.click();
        const ipcCalls: any[][] = (globalThis as any).__ipcCalls || [];
        expect(ipcCalls).toStrictEqual([["menu-about"]]);
        expect(appMenu.submenu.map((i: any) => i.label)).not.toContain(
            "Preferences..."
        );
        restoreProcessPlatform(desc);
        (globalThis as any).__electronHoistedMock = original;
    });

    it("skips setting menu and warns when template is invalid (forced via Array.isArray stub)", () => {
        expect.assertions(3);
        // Force the defensive branch: treat the valid template as invalid
        // so the function warns and returns early.
        const isArraySpy = vi.spyOn(Array, "isArray").mockReturnValue(false);
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const setAppMenuSpy = createMock();
        const original = (globalThis as any).__electronHoistedMock;
        (globalThis as any).__electronHoistedMock = {
            ...original,
            Menu: {
                buildFromTemplate: (template: any[]) =>
                    ({ items: template }) as any,
                setApplicationMenu: setAppMenuSpy,
            },
        };
        try {
            const createAppMenu = importCreateAppMenu();
            createAppMenu(undefined, "dark", null);
            expect(capturedTemplate).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                "[createAppMenu] WARNING: Attempted to set an empty or invalid menu template. Skipping Menu.setApplicationMenu."
            );
            expect(setAppMenuSpy).not.toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
            isArraySpy.mockRestore();
            (globalThis as any).__electronHoistedMock = original;
        }
    });

    it("uses default theme from getTheme when currentTheme is undefined", () => {
        expect.assertions(1);
        const createAppMenu = importCreateAppMenu();
        createAppMenu(
            { webContents: { send: createMock() } } as any,
            undefined,
            null
        );
        const tpl =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const settingsMenu = (tpl || []).find(
            (i: any) => i.label === "⚙️ Settings"
        );
        const themeMenu = settingsMenu.submenu.find(
            (i: any) => i.label === "🎨 Theme"
        );
        const dark = themeMenu.submenu.find((i: any) => i.label === "🌑 Dark");
        const light = themeMenu.submenu.find(
            (i: any) => i.label === "🌕 Light"
        );
        // getTheme returns 'dark' by default; ensure dark is checked
        expect({
            darkChecked: dark.checked,
            lightChecked: light.checked,
        }).toStrictEqual({
            darkChecked: true,
            lightChecked: false,
        });
    });

    it("falls back to assigning exports when defineProperty throws", () => {
        expect.assertions(3);
        const originalDefineProperty = Object.defineProperty;
        const defineSpy = vi
            .spyOn(Object, "defineProperty")
            .mockImplementation(
                (
                    target: any,
                    property: PropertyKey,
                    descriptor: PropertyDescriptor
                ) => {
                    if (property === "__FFV_createAppMenuExports") {
                        throw new Error("defineProperty blocked");
                    }
                    return originalDefineProperty(target, property, descriptor);
                }
            );

        try {
            delete (globalThis as any).__FFV_createAppMenuExports;
            const modulePath =
                require.resolve("../../../electron-app/utils/app/menu/createAppMenu.js");
            delete require.cache[modulePath];
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = require("../../../electron-app/utils/app/menu/createAppMenu.js");
            expect(mod.createAppMenu).toBeTypeOf("function");
            const defineMock = vi.mocked(defineSpy);
            const calls = defineMock.mock.calls as Array<
                [
                    any,
                    PropertyKey,
                    PropertyDescriptor,
                ]
            >;
            const targetedIndex = calls.findIndex(
                ([, prop]) => prop === "__FFV_createAppMenuExports"
            );
            expect(targetedIndex).not.toBe(-1);
            const results = defineMock.mock.results as Array<{ type: string }>;
            expect(getRequiredMockResult(results, targetedIndex).type).toBe(
                "throw"
            );
        } finally {
            defineSpy.mockRestore();
            delete (globalThis as any).__FFV_createAppMenuExports;
            vi.resetModules();
        }
    });

    it("executes all menu click handlers without throwing", async () => {
        expect.assertions(7);
        const createAppMenu = importCreateAppMenu();
        const fakeWebContents = {
            send: createMock(),
            reload: createMock(),
            openDevTools: createMock(),
            closeDevTools: createMock(),
            toggleDevTools: createMock(),
            isDevToolsOpened: createMock().mockReturnValue(false),
            executeJavaScript: createMock().mockResolvedValue(undefined),
        };
        const fakeWindow = {
            webContents: fakeWebContents,
            close: createMock(),
            focus: createMock(),
            show: createMock(),
            isDestroyed: createMock().mockReturnValue(false),
            setFullScreen: createMock(),
            isFullScreen: createMock().mockReturnValue(false),
        };
        const electronMock = (globalThis as any).__electronHoistedMock as {
            BrowserWindow: { getFocusedWindow: Mock };
        };
        vi.spyOn(
            electronMock.BrowserWindow,
            "getFocusedWindow"
        ).mockReturnValue(fakeWindow);

        createAppMenu(fakeWindow as any, "dark", "C:/activities/sample.fit");
        const template =
            capturedTemplate || (globalThis as any).__lastBuiltMenuTemplate;
        const clickableItems: Array<Record<string, any>> = [];

        function collect(items: Array<Record<string, any>> | undefined) {
            if (!Array.isArray(items)) {
                return;
            }
            for (const item of items) {
                if (item.type === "separator") {
                    continue;
                }
                clickableItems.push(item);
                if (item.submenu) {
                    collect(item.submenu);
                }
            }
        }
        collect(template);
        const clickableLabels = clickableItems.map((item) => item.label);
        expect(clickableLabels).toContain("📁 File");
        expect(clickableLabels).toContain("📂 Open FIT File...");
        expect(clickableLabels).toContain("💿 Decoder Options");
        expect(clickableLabels).toContain("❓ Help");
        expect(clickableLabels).toContain("⌨️ Keyboard Shortcuts");

        const handlerFailures: Array<{ error: unknown; label: unknown }> = [];
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        try {
            // Exercise each item's click handler with the menu item argument Electron supplies.
            for (const item of clickableItems) {
                const { click } = item;
                if (typeof click !== "function") {
                    continue;
                }
                const menuItemArgument = {
                    ...item,
                    checked: item.checked ?? true,
                };
                try {
                    click(menuItemArgument);
                } catch (error) {
                    handlerFailures.push({ error, label: item.label });
                }
            }
            expect(handlerFailures).toStrictEqual([]);
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });
});

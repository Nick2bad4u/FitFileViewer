/**
 * @fileoverview Tests for registerDialogHandlers IPC registration.
 */

import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModule = createRequire(import.meta.url);
const modulePath = "../../../../main/ipc/registerDialogHandlers.js";

const loadModule = async () => {
    vi.resetModules();
    const resolved = requireModule.resolve(modulePath);
    if (requireModule.cache?.[resolved]) {
        delete requireModule.cache[resolved];
    }
    return requireModule(modulePath);
};

const CONSTANTS = {
    DIALOG_FILTERS: {
        FIT_FILES: [{ name: "FIT Files", extensions: ["fit"] }],
    },
};

describe("registerDialogHandlers", () => {
    let mockRegisterIpcHandle: ReturnType<typeof vi.fn>;
    let mockDialog: { showOpenDialog: ReturnType<typeof vi.fn> };
    let mockAddRecentFile: ReturnType<typeof vi.fn>;
    let mockSetAppState: ReturnType<typeof vi.fn>;
    let mockBrowserWindowRef: ReturnType<typeof vi.fn>;
    let mockGetThemeFromRenderer: ReturnType<typeof vi.fn>;
    let mockSafeCreateAppMenu: ReturnType<typeof vi.fn>;
    let mockLogWithContext: ReturnType<typeof vi.fn>;
    let mainWindow: { id: string };

    beforeEach(() => {
        mockRegisterIpcHandle = vi.fn();
        mockDialog = { showOpenDialog: vi.fn() };
        mockAddRecentFile = vi.fn();
        mockSetAppState = vi.fn();
        mockGetThemeFromRenderer = vi.fn().mockResolvedValue("dark");
        mockSafeCreateAppMenu = vi.fn();
        mockLogWithContext = vi.fn();
        mainWindow = { id: "main-window" };
        mockBrowserWindowRef = vi.fn().mockReturnValue({
            getFocusedWindow: vi.fn().mockReturnValue({ id: "focused" }),
        });
    });

    const buildArgs = (overrides: Record<string, unknown> = {}) => ({
        registerIpcHandle: mockRegisterIpcHandle,
        dialogRef: () => mockDialog,
        CONSTANTS,
        addRecentFile: mockAddRecentFile,
        setAppState: mockSetAppState,
        browserWindowRef: mockBrowserWindowRef,
        getThemeFromRenderer: mockGetThemeFromRenderer,
        safeCreateAppMenu: mockSafeCreateAppMenu,
        logWithContext: mockLogWithContext,
        mainWindow,
        ...overrides,
    });

    const getHandler = (channel: string) =>
        mockRegisterIpcHandle.mock.calls.find(([name]) => name === channel)?.[1];

    it("registers handlers when provided with a valid register function", async () => {
        const { registerDialogHandlers } = await loadModule();

        registerDialogHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("dialog:openFile", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("dialog:openOverlayFiles", expect.any(Function));
    });

    it("does nothing when registerIpcHandle is not a function", async () => {
        const { registerDialogHandlers } = await loadModule();

        registerDialogHandlers(buildArgs({ registerIpcHandle: undefined }));

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    it("returns the selected file path and updates application state", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/files/activity.fit"] });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openFile");
        const result = await handler({}, {});

        expect(result).toBe("/files/activity.fit");
        expect(mockAddRecentFile).toHaveBeenCalledWith("/files/activity.fit");
        expect(mockSetAppState).toHaveBeenCalledWith("loadedFitFilePath", "/files/activity.fit");
        expect(mockGetThemeFromRenderer).toHaveBeenCalledWith({ id: "focused" });
        expect(mockSafeCreateAppMenu).toHaveBeenCalledWith({ id: "focused" }, "dark", "/files/activity.fit");
    });

    it("uses the fallback window when no focused window exists", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/files/activity.fit"] });
        mockBrowserWindowRef.mockReturnValue({ getFocusedWindow: vi.fn().mockReturnValue(null) });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openFile");
        await handler({}, {});

        expect(mockSafeCreateAppMenu).toHaveBeenCalledWith(mainWindow, "dark", "/files/activity.fit");
    });

    it("falls back to the main window when browserWindowRef throws", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/files/activity.fit"] });
        mockBrowserWindowRef = vi.fn(() => {
            throw new Error("lookup failure");
        });

        registerDialogHandlers(buildArgs({ browserWindowRef: mockBrowserWindowRef }));

        const handler = getHandler("dialog:openFile");
        await handler({}, {});

        expect(mockSafeCreateAppMenu).toHaveBeenCalledWith(mainWindow, "dark", "/files/activity.fit");
    });

    it("returns null when the dialog is canceled", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: ["/files/activity.fit"] });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openFile");
        const result = await handler({}, {});

        expect(result).toBeNull();
        expect(mockAddRecentFile).not.toHaveBeenCalled();
    });

    it("returns null when no paths are provided", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openFile");
        const result = await handler({}, {});

        expect(result).toBeNull();
    });

    it("returns null when the first path is falsy", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [""] });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openFile");
        const result = await handler({}, {});

        expect(result).toBeNull();
    });

    it("logs and rethrows when the dialog module is unavailable", async () => {
        const { registerDialogHandlers } = await loadModule();

        registerDialogHandlers(buildArgs({ dialogRef: undefined }));

        const handler = getHandler("dialog:openFile");

        await expect(handler({}, {})).rejects.toThrow("Dialog module unavailable");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in dialog:openFile", {
            error: "Dialog module unavailable",
        });
    });

    it("logs a warning when the menu cannot be refreshed", async () => {
        const { registerDialogHandlers } = await loadModule();
        const failure = new Error("menu failure");
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/files/activity.fit"] });
        mockGetThemeFromRenderer.mockRejectedValueOnce(failure);

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openFile");
        await handler({}, {});

        expect(mockLogWithContext).toHaveBeenCalledWith("warn", "Failed to refresh menu after file dialog selection", {
            error: "menu failure",
        });
    });

    it("handles missing optional callbacks without throwing", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/files/activity.fit"] });

        registerDialogHandlers(
            buildArgs({
                addRecentFile: undefined,
                setAppState: undefined,
                logWithContext: undefined,
            })
        );

        const handler = getHandler("dialog:openFile");
        const result = await handler({}, {});

        expect(result).toBe("/files/activity.fit");
    });

    it("filters overlay selections to non-empty strings", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ["/files/a.fit", "", "  ", 42 as any, null as any, "/files/b.fit"],
        });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openOverlayFiles");
        const result = await handler({}, {});

        expect(result).toEqual(["/files/a.fit", "/files/b.fit"]);
    });

    it("returns an empty array when overlay selection is canceled", async () => {
        const { registerDialogHandlers } = await loadModule();
        mockDialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: ["/files/a.fit"] });

        registerDialogHandlers(buildArgs());

        const handler = getHandler("dialog:openOverlayFiles");
        const result = await handler({}, {});

        expect(result).toEqual([]);
    });

    it("logs and rethrows when overlay dialog fails", async () => {
        const { registerDialogHandlers } = await loadModule();

        registerDialogHandlers(buildArgs({ dialogRef: () => ({}) }));

        const handler = getHandler("dialog:openOverlayFiles");

        await expect(handler({}, {})).rejects.toThrow("Dialog module unavailable");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in dialog:openOverlayFiles", {
            error: "Dialog module unavailable",
        });
    });
});

describe("ensureDialogModule", () => {
    it("returns the dialog when showOpenDialog is provided", async () => {
        const { ensureDialogModule } = await loadModule();
        const dialog = { showOpenDialog: vi.fn() };

        expect(ensureDialogModule(() => dialog)).toBe(dialog);
    });

    it("throws when the dialog reference is invalid", async () => {
        const { ensureDialogModule } = await loadModule();

        expect(() => ensureDialogModule(undefined)).toThrow("Dialog module unavailable");
        expect(() => ensureDialogModule(() => ({}))).toThrow("Dialog module unavailable");
    });
});

describe("resolveTargetWindow", () => {
    it("returns the focused window when available", async () => {
        const { resolveTargetWindow } = await loadModule();
        const focused = { id: "focused" };

        const result = resolveTargetWindow(() => ({ getFocusedWindow: () => focused }), { id: "fallback" });

        expect(result).toBe(focused);
    });

    it("falls back to the provided window when no focused window exists", async () => {
        const { resolveTargetWindow } = await loadModule();
        const fallback = { id: "fallback" };

        const result = resolveTargetWindow(() => ({ getFocusedWindow: () => null }), fallback);

        expect(result).toBe(fallback);
    });

    it("returns null when no window can be resolved", async () => {
        const { resolveTargetWindow } = await loadModule();

        const result = resolveTargetWindow(() => {
            throw new Error("fail");
        }, null);

        expect(result).toBeNull();
    });
});

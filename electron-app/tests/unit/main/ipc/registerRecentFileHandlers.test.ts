/**
 * @fileoverview Tests for registerRecentFileHandlers IPC registration.
 */

import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModule = createRequire(import.meta.url);
const modulePath = "../../../../main/ipc/registerRecentFileHandlers.js";

const loadModule = async () => {
    vi.resetModules();
    const resolved = requireModule.resolve(modulePath);
    if (requireModule.cache?.[resolved]) {
        delete requireModule.cache[resolved];
    }
    return requireModule(modulePath);
};

describe("registerRecentFileHandlers", () => {
    let mockRegisterIpcHandle: ReturnType<typeof vi.fn>;
    let mockAddRecentFile: ReturnType<typeof vi.fn>;
    let mockLoadRecentFiles: ReturnType<typeof vi.fn>;
    let mockBrowserWindowRef: ReturnType<typeof vi.fn>;
    let mockGetThemeFromRenderer: ReturnType<typeof vi.fn>;
    let mockSafeCreateAppMenu: ReturnType<typeof vi.fn>;
    let mockGetAppState: ReturnType<typeof vi.fn>;
    let mockLogWithContext: ReturnType<typeof vi.fn>;
    let mainWindow: { id: string } | null;

    beforeEach(() => {
        mockRegisterIpcHandle = vi.fn();
        mockAddRecentFile = vi.fn();
        mockLoadRecentFiles = vi.fn().mockReturnValue(["/files/one.fit", "/files/two.fit"]);
        mockGetThemeFromRenderer = vi.fn().mockResolvedValue("dark");
        mockSafeCreateAppMenu = vi.fn();
        mockGetAppState = vi.fn().mockReturnValue("/files/current.fit");
        mockLogWithContext = vi.fn();
        mainWindow = { id: "main-window" };
        mockBrowserWindowRef = vi.fn().mockReturnValue({
            getFocusedWindow: vi.fn().mockReturnValue({ id: "focused" }),
        });
    });

    const buildArgs = (overrides: Record<string, unknown> = {}) => ({
        registerIpcHandle: mockRegisterIpcHandle,
        addRecentFile: mockAddRecentFile,
        loadRecentFiles: mockLoadRecentFiles,
        browserWindowRef: mockBrowserWindowRef,
        mainWindow,
        getThemeFromRenderer: mockGetThemeFromRenderer,
        safeCreateAppMenu: mockSafeCreateAppMenu,
        getAppState: mockGetAppState,
        logWithContext: mockLogWithContext,
        ...overrides,
    });

    const getHandler = (channel: string) =>
        mockRegisterIpcHandle.mock.calls.find(([name]) => name === channel)?.[1];

    it("registers handlers when provided with a valid register function", async () => {
        const { registerRecentFileHandlers } = await loadModule();

        registerRecentFileHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("recentFiles:get", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("recentFiles:add", expect.any(Function));
    });

    it("wires handlers via the helper to cover internal logic", async () => {
        const { wireRecentFileHandlers } = await loadModule();

        wireRecentFileHandlers(buildArgs());

        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("recentFiles:get", expect.any(Function));
        expect(mockRegisterIpcHandle).toHaveBeenCalledWith("recentFiles:add", expect.any(Function));
    });

    it("does nothing when registerIpcHandle is not a function", async () => {
        const { registerRecentFileHandlers } = await loadModule();

        registerRecentFileHandlers(buildArgs({ registerIpcHandle: undefined }));

        expect(mockRegisterIpcHandle).not.toHaveBeenCalled();
    });

    it("returns recent files when requested", async () => {
        const { registerRecentFileHandlers } = await loadModule();

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:get");
        const result = await handler({}, {});

        expect(result).toEqual(["/files/one.fit", "/files/two.fit"]);
    });

    it("logs and rethrows when loading recent files fails", async () => {
        const { registerRecentFileHandlers } = await loadModule();
        const failure = new Error("load failed");
        mockLoadRecentFiles.mockImplementationOnce(() => {
            throw failure;
        });

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:get");

        await expect(handler({}, {})).rejects.toThrow("load failed");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in recentFiles:get:", {
            error: "load failed",
        });
    });

    it("adds a recent file, refreshes the menu, and returns the updated list", async () => {
        const { registerRecentFileHandlers } = await loadModule();

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, "/files/new.fit");

        expect(mockAddRecentFile).toHaveBeenCalledWith("/files/new.fit");
        expect(mockGetThemeFromRenderer).toHaveBeenCalledWith({ id: "focused" });
        expect(mockSafeCreateAppMenu).toHaveBeenCalledWith({ id: "focused" }, "dark", "/files/current.fit");
        expect(result).toEqual(["/files/one.fit", "/files/two.fit"]);
    });

    it("falls back to the main window when no focused window exists", async () => {
        const { registerRecentFileHandlers } = await loadModule();
        mockBrowserWindowRef.mockReturnValue({ getFocusedWindow: vi.fn().mockReturnValue(null) });

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:add");
        await handler({}, "/files/new.fit");

        expect(mockSafeCreateAppMenu).toHaveBeenCalledWith(mainWindow, "dark", "/files/current.fit");
    });

    it("returns recent files without attempting menu refresh when no window is available", async () => {
        const { registerRecentFileHandlers } = await loadModule();
        mainWindow = null;

        registerRecentFileHandlers(buildArgs({ mainWindow, browserWindowRef: null }));

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, "/files/new.fit");

        expect(mockSafeCreateAppMenu).not.toHaveBeenCalled();
        expect(result).toEqual(["/files/one.fit", "/files/two.fit"]);
    });

    it("logs a warning when menu refresh fails but still returns the list", async () => {
        const { registerRecentFileHandlers } = await loadModule();
        const failure = new Error("menu failure");
        mockGetThemeFromRenderer.mockRejectedValueOnce(failure);

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, "/files/new.fit");

        expect(mockLogWithContext).toHaveBeenCalledWith("warn", "Failed to refresh menu after recent file add", {
            error: "menu failure",
        });
        expect(result).toEqual(["/files/one.fit", "/files/two.fit"]);
    });

    it("logs and rethrows when addRecentFile fails", async () => {
        const { registerRecentFileHandlers } = await loadModule();
        const failure = new Error("add failed");
        mockAddRecentFile.mockImplementationOnce(() => {
            throw failure;
        });

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:add");

        await expect(handler({}, "/files/new.fit")).rejects.toThrow("add failed");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in recentFiles:add:", {
            error: "add failed",
        });
    });

    it("logs and rethrows when loadRecentFiles fails during menu update", async () => {
        const { registerRecentFileHandlers } = await loadModule();
        const failure = new Error("load failed");
        mockLoadRecentFiles.mockImplementationOnce(() => {
            throw failure;
        });

        registerRecentFileHandlers(buildArgs());

        const handler = getHandler("recentFiles:add");

        await expect(handler({}, "/files/new.fit")).rejects.toThrow("load failed");
        expect(mockLogWithContext).toHaveBeenCalledWith("error", "Error in recentFiles:add:", {
            error: "load failed",
        });
    });

    it("falls back to the main window when browserWindowRef throws", async () => {
        const { registerRecentFileHandlers } = await loadModule();

        registerRecentFileHandlers(
            buildArgs({
                browserWindowRef: () => {
                    throw new Error("lookup failure");
                },
            })
        );

        const handler = getHandler("recentFiles:add");
        await handler({}, "/files/new.fit");

        expect(mockSafeCreateAppMenu).toHaveBeenCalledWith(mainWindow, "dark", "/files/current.fit");
    });
});

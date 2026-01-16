/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it } from "vitest";

import { approveFilePath, isApprovedFilePath, __resetForTests } from "../../../../main/security/fileAccessPolicy.js";
import { registerRecentFileHandlers } from "../../../../main/ipc/registerRecentFileHandlers.js";

describe("registerRecentFileHandlers", () => {
    /** @type {Map<string, Function>} */
    let handlers;

    /** @type {string[]} */
    let added;

    /** @type {Array<{ level: string; message: string }>} */
    let logs;

    beforeEach(() => {
        __resetForTests?.();
        handlers = new Map();
        added = [];
        logs = [];
    });

    it("no-ops when registerIpcHandle is invalid", () => {
        registerRecentFileHandlers({
            // @ts-expect-error - intentionally invalid to ensure the module no-ops
            registerIpcHandle: undefined,
            addRecentFile: () => void 0,
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: () => void 0,
        });
        expect(handlers.size).toBe(0);
    });

    it("rejects invalid filePath types", async () => {
        registerRecentFileHandlers({
            registerIpcHandle: (channel, handler) => {
                handlers.set(channel, handler);
            },
            addRecentFile: (filePath) => {
                added.push(filePath);
            },
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: (level, message) => {
                logs.push({ level, message });
            },
        });

        const handler = handlers.get("recentFiles:add");
        expect(handler).toBeTypeOf("function");

        if (!handler) throw new Error("recentFiles:add handler not registered");

        const result = await handler({}, 123);
        expect(result).toEqual(["C:/a.fit"]);
        expect(added).toEqual([]);
    });

    it("rejects unapproved paths", async () => {
        registerRecentFileHandlers({
            registerIpcHandle: (channel, handler) => {
                handlers.set(channel, handler);
            },
            addRecentFile: (filePath) => {
                added.push(filePath);
            },
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: (level, message) => {
                logs.push({ level, message });
            },
        });

        const handler = handlers.get("recentFiles:add");
        if (!handler) throw new Error("recentFiles:add handler not registered");
        await expect(handler({}, "C:/unapproved.fit")).resolves.toEqual(["C:/a.fit"]);
        expect(added).toEqual([]);
    });

    it("accepts approved paths and calls addRecentFile", async () => {
        registerRecentFileHandlers({
            registerIpcHandle: (channel, handler) => {
                handlers.set(channel, handler);
            },
            addRecentFile: (filePath) => {
                added.push(filePath);
            },
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: (level, message) => {
                logs.push({ level, message });
            },
        });

        const approved = approveFilePath("C:/ok.fit", { source: "test" });

        const handler = handlers.get("recentFiles:add");
        if (!handler) throw new Error("recentFiles:add handler not registered");
        const result = await handler({}, approved);

        expect(added).toEqual([approved]);
        expect(result).toEqual(["C:/a.fit"]);
    });

    it("recentFiles:get does not implicitly approve file reads", async () => {
        registerRecentFileHandlers({
            registerIpcHandle: (channel, handler) => {
                handlers.set(channel, handler);
            },
            addRecentFile: () => void 0,
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: () => void 0,
        });

        const getHandler = handlers.get("recentFiles:get");
        if (!getHandler) throw new Error("recentFiles:get handler not registered");

        const list = await getHandler();
        expect(list).toEqual(["C:/a.fit"]);

        // No approval should have been seeded.
        expect(isApprovedFilePath("C:/a.fit")).toBe(false);
    });

    it("recentFiles:approve approves only paths in the recent list", async () => {
        registerRecentFileHandlers({
            registerIpcHandle: (channel, handler) => {
                handlers.set(channel, handler);
            },
            addRecentFile: () => void 0,
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: () => void 0,
        });

        const approveHandler = handlers.get("recentFiles:approve");
        if (!approveHandler) throw new Error("recentFiles:approve handler not registered");

        await expect(approveHandler({}, "C:/not-in-list.fit")).resolves.toBe(false);
        expect(isApprovedFilePath("C:/not-in-list.fit")).toBe(false);

        await expect(approveHandler({}, "C:/a.fit")).resolves.toBe(true);
        expect(isApprovedFilePath("C:/a.fit")).toBe(true);
    });
});

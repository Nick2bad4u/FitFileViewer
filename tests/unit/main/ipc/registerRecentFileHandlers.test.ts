// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import {
    approveFilePath,
    isApprovedFilePath,
    __resetForTests,
} from "../../../../electron-app/main/security/fileAccessPolicy.js";
import { registerRecentFileHandlers } from "../../../../electron-app/main/ipc/registerRecentFileHandlers.js";

type RecentFilesInvokeChannel =
    | "recentFiles:add"
    | "recentFiles:approve"
    | "recentFiles:get";
type RecentFileIpcHandler = (
    event?: unknown,
    ...args: unknown[]
) => Promise<unknown> | unknown;
type RegisterIpcHandle = (
    channel: RecentFilesInvokeChannel,
    handler: RecentFileIpcHandler
) => void;
type LogEntry = {
    context?: Record<string, unknown>;
    level: "error" | "info" | "warn";
    message: string;
};
type RegisterRecentFileHandlersOptions = Parameters<
    typeof registerRecentFileHandlers
>[0];

describe("registerRecentFileHandlers", () => {
    let handlers: Map<RecentFilesInvokeChannel, RecentFileIpcHandler>;
    let added: string[];
    let logs: LogEntry[];

    beforeEach(() => {
        __resetForTests?.();
        handlers = new Map();
        added = [];
        logs = [];
    });

    function registerDefaultHandlers(
        overrides: Partial<RegisterRecentFileHandlersOptions> = {}
    ): void {
        registerRecentFileHandlers({
            registerIpcHandle: ((channel, handler) => {
                handlers.set(channel, handler);
            }) as RegisterIpcHandle,
            addRecentFile: (filePath) => {
                added.push(filePath);
            },
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getThemeFromRenderer: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getAppState: () => null,
            logWithContext: (level, message, context) => {
                logs.push({
                    context,
                    level,
                    message,
                });
            },
            ...overrides,
        });
    }

    function getHandler(
        channel: RecentFilesInvokeChannel
    ): RecentFileIpcHandler {
        const handler = handlers.get(channel);

        expect(handler).toBeTypeOf("function");

        if (typeof handler !== "function") {
            throw new TypeError(`${channel} handler not registered`);
        }

        return handler;
    }

    it("no-ops when registerIpcHandle is invalid", () => {
        expect.hasAssertions();

        registerRecentFileHandlers({
            registerIpcHandle: undefined as unknown as RegisterIpcHandle,
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
        expect.hasAssertions();

        registerDefaultHandlers();

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, 123);

        expect(result).toEqual(["C:/a.fit"]);
        expect(added).toEqual([]);
        expect(logs).toContainEqual({
            context: {
                filePath: 123,
            },
            level: "warn",
            message: "Rejected recentFiles:add for invalid path",
        });
    });

    it("rejects unapproved paths", async () => {
        expect.hasAssertions();

        registerDefaultHandlers();

        const handler = getHandler("recentFiles:add");

        await expect(handler({}, "C:/unapproved.fit")).resolves.toEqual([
            "C:/a.fit",
        ]);
        expect(added).toEqual([]);
        expect(logs).toContainEqual({
            context: {
                filePath: "C:/unapproved.fit",
            },
            level: "warn",
            message: "Rejected recentFiles:add for unapproved path",
        });
    });

    it("accepts approved paths and calls addRecentFile", async () => {
        expect.hasAssertions();

        registerDefaultHandlers();

        const approved = approveFilePath("C:/ok.fit", { source: "test" });

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, approved);

        expect(added).toEqual([approved]);
        expect(result).toEqual(["C:/a.fit"]);
        expect(logs).toEqual([]);
    });

    it("recentFiles:get does not implicitly approve file reads", async () => {
        expect.hasAssertions();

        registerDefaultHandlers({
            addRecentFile: () => void 0,
            logWithContext: () => void 0,
        });

        const getHandlerResult = getHandler("recentFiles:get");

        const list = await getHandlerResult();
        expect(list).toEqual(["C:/a.fit"]);
        expect(isApprovedFilePath("C:/a.fit")).toBe(false);
    });

    it("recentFiles:approve approves only paths in the recent list", async () => {
        expect.hasAssertions();

        registerDefaultHandlers({
            addRecentFile: () => void 0,
            logWithContext: () => void 0,
        });

        const approveHandler = getHandler("recentFiles:approve");

        await expect(approveHandler({}, "C:/not-in-list.fit")).resolves.toBe(
            false
        );
        expect(isApprovedFilePath("C:/not-in-list.fit")).toBe(false);

        await expect(approveHandler({}, "C:/a.fit")).resolves.toBe(true);
        expect(isApprovedFilePath("C:/a.fit")).toBe(true);
    });
});

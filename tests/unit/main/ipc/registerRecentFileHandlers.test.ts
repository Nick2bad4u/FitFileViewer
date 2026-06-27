// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import {
    approveFilePath,
    isApprovedFilePath,
    __resetForTests,
} from "../../../../electron-app/main/security/fileAccessPolicy.js";
import { registerRecentFileHandlers } from "../../../../electron-app/main/ipc/registerRecentFileHandlers.js";

type RecentFilesInvokeChannel = "recentFiles:add" | "recentFiles:get";
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
            getPersistedThemePreference: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getLoadedFitFilePath: () => null,
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

        if (typeof handler !== "function") {
            throw new TypeError(`${channel} handler not registered`);
        }

        return handler;
    }

    function getRecentFileState(filePaths: string[] = []): {
        added: string[];
        approvals: Record<string, boolean>;
        logs: LogEntry[];
    } {
        return {
            added: [...added],
            approvals: Object.fromEntries(
                filePaths.map((filePath) => [
                    filePath,
                    isApprovedFilePath(filePath),
                ])
            ),
            logs: [...logs],
        };
    }

    it("no-ops when registerIpcHandle is invalid", () => {
        expect.assertions(1);

        registerRecentFileHandlers({
            registerIpcHandle: undefined as unknown as RegisterIpcHandle,
            addRecentFile: () => void 0,
            loadRecentFiles: () => ["C:/a.fit"],
            browserWindowRef: () => null,
            mainWindow: null,
            getPersistedThemePreference: async () => "dark",
            safeCreateAppMenu: () => void 0,
            getLoadedFitFilePath: () => null,
            logWithContext: () => void 0,
        });

        expect({
            handlerChannels: [...handlers.keys()],
            handlerCount: handlers.size,
        }).toStrictEqual({
            handlerChannels: [],
            handlerCount: 0,
        });
    });

    it("rejects invalid filePath types", async () => {
        expect.assertions(2);

        registerDefaultHandlers();

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, 123);

        expect(result).toStrictEqual(["C:/a.fit"]);
        expect(getRecentFileState()).toStrictEqual({
            added: [],
            approvals: {},
            logs: [
                {
                    context: {
                        filePath: 123,
                    },
                    level: "warn",
                    message: "Rejected recentFiles:add for invalid path",
                },
            ],
        });
    });

    it("rejects unapproved paths", async () => {
        expect.assertions(2);

        registerDefaultHandlers();

        const handler = getHandler("recentFiles:add");

        await expect(handler({}, "C:/unapproved.fit")).resolves.toStrictEqual([
            "C:/a.fit",
        ]);
        expect(getRecentFileState(["C:/unapproved.fit"])).toStrictEqual({
            added: [],
            approvals: {
                "C:/unapproved.fit": false,
            },
            logs: [
                {
                    context: {
                        filePath: "C:/unapproved.fit",
                    },
                    level: "warn",
                    message: "Rejected recentFiles:add for unapproved path",
                },
            ],
        });
    });

    it("accepts approved paths and calls addRecentFile", async () => {
        expect.assertions(2);

        registerDefaultHandlers();

        const approved = approveFilePath("C:/ok.fit", { source: "test" });

        const handler = getHandler("recentFiles:add");
        const result = await handler({}, approved);

        expect(result).toStrictEqual(["C:/a.fit"]);
        expect(getRecentFileState([approved])).toStrictEqual({
            added: [approved],
            approvals: {
                [approved]: true,
            },
            logs: [],
        });
    });

    it("refreshes the app menu after adding an approved recent file", async () => {
        expect.assertions(4);

        const recentFiles: string[] = ["C:/a.fit"];
        const menuCalls: unknown[][] = [];
        const focusedWindow = { marker: "focused-window" };
        const approved = approveFilePath("C:/ok.fit", { source: "test" });

        registerDefaultHandlers({
            addRecentFile: (filePath) => {
                added.push(filePath);
                recentFiles.push(filePath);
            },
            browserWindowRef: () => ({
                getFocusedWindow: () => focusedWindow as never,
            }),
            getLoadedFitFilePath: () => "C:/loaded.fit",
            getPersistedThemePreference: async () => "auto",
            loadRecentFiles: () => [...recentFiles],
            safeCreateAppMenu: (...args) => {
                menuCalls.push(args);
            },
        });

        const handler = getHandler("recentFiles:add");

        await expect(handler({}, approved)).resolves.toStrictEqual([
            "C:/a.fit",
            approved,
        ]);
        expect(getRecentFileState([approved])).toStrictEqual({
            added: [approved],
            approvals: {
                [approved]: true,
            },
            logs: [],
        });
        expect(menuCalls).toStrictEqual([
            [
                focusedWindow,
                "auto",
                "C:/loaded.fit",
            ],
        ]);
        expect(logs).toStrictEqual([]);
    });

    it("recentFiles:get does not implicitly approve file reads", async () => {
        expect.assertions(2);

        registerDefaultHandlers({
            addRecentFile: () => void 0,
            logWithContext: () => void 0,
        });

        const getHandlerResult = getHandler("recentFiles:get");

        const list = await getHandlerResult();
        expect(list).toStrictEqual(["C:/a.fit"]);
        expect(getRecentFileState(["C:/a.fit"]).approvals).toStrictEqual({
            "C:/a.fit": false,
        });
    });
});

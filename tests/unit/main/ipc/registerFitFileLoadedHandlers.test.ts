// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerFitFileLoadedHandlers } from "../../../../electron-app/main/ipc/registerFitFileLoadedHandlers.js";

type MainProcessIpcEventChannel = "fit-file-loaded";
type FitFileLoadedListener = (
    event?: unknown,
    ...args: unknown[]
) => Promise<unknown> | unknown;
type LogEntry = {
    context?: Record<string, unknown>;
    level: "error" | "info" | "warn";
    message: string;
};
type RegisterFitFileLoadedHandlersOptions = Parameters<
    typeof registerFitFileLoadedHandlers
>[0];

describe("registerFitFileLoadedHandlers", () => {
    let loadedFitFilePath: null | string;
    let listener: FitFileLoadedListener | undefined;
    let logs: LogEntry[];
    let menuCalls: unknown[][];

    beforeEach(() => {
        loadedFitFilePath = "C:/previous.fit";
        listener = undefined;
        logs = [];
        menuCalls = [];
    });

    function registerDefaultHandlers(
        overrides: Partial<RegisterFitFileLoadedHandlersOptions> = {}
    ): void {
        registerFitFileLoadedHandlers({
            assertFileReadAllowed: (filePath) => {
                if (filePath === "C:/approved.fit") {
                    return filePath;
                }

                throw new Error("not approved");
            },
            browserWindowRef: () => ({
                fromWebContents: (webContents) =>
                    webContents === "sender"
                        ? ({ marker: "main-window" } as never)
                        : null,
            }),
            getLoadedFitFilePath: () => loadedFitFilePath,
            getPersistedThemePreference: async () => "dark",
            logWithContext: (level, message, context) => {
                logs.push({ context, level, message });
            },
            registerIpcListener: (
                channel: MainProcessIpcEventChannel,
                registeredListener: FitFileLoadedListener
            ) => {
                if (channel === "fit-file-loaded") {
                    listener = registeredListener;
                }
            },
            safeCreateAppMenu: (...args) => {
                menuCalls.push(args);
            },
            setLoadedFitFilePath: (filePath) => {
                loadedFitFilePath = filePath;
            },
            ...overrides,
        });
    }

    function getListener(): FitFileLoadedListener {
        if (typeof listener !== "function") {
            throw new TypeError("fit-file-loaded listener was not registered");
        }

        return listener;
    }

    it("no-ops when listener registration is unavailable", () => {
        expect.assertions(1);

        registerFitFileLoadedHandlers({
            assertFileReadAllowed: () => "C:/approved.fit",
            browserWindowRef: () => ({
                fromWebContents: () => null,
            }),
            getLoadedFitFilePath: () => null,
            getPersistedThemePreference: async () => "dark",
            logWithContext: () => void 0,
            registerIpcListener:
                undefined as unknown as RegisterFitFileLoadedHandlersOptions["registerIpcListener"],
            safeCreateAppMenu: () => void 0,
            setLoadedFitFilePath: () => void 0,
        });

        expect(listener).toBeUndefined();
    });

    it("stores approved loaded FIT paths and refreshes the app menu", async () => {
        expect.assertions(3);

        registerDefaultHandlers();

        await getListener()({ sender: "sender" }, "C:/approved.fit");

        expect(loadedFitFilePath).toBe("C:/approved.fit");
        expect(menuCalls).toStrictEqual([
            [
                { marker: "main-window" },
                "dark",
                "C:/approved.fit",
            ],
        ]);
        expect(logs).toStrictEqual([]);
    });

    it("clears loaded FIT path state when the renderer reports no file", async () => {
        expect.assertions(3);

        registerDefaultHandlers();

        await getListener()({ sender: "sender" }, "   ");

        expect(loadedFitFilePath).toBeNull();
        expect(menuCalls).toStrictEqual([
            [
                { marker: "main-window" },
                "dark",
                null,
            ],
        ]);
        expect(logs).toStrictEqual([]);
    });

    it("rejects unapproved renderer paths without mutating loaded state", async () => {
        expect.assertions(3);

        registerDefaultHandlers();

        await getListener()({ sender: "sender" }, "C:/unapproved.fit");

        expect(loadedFitFilePath).toBe("C:/previous.fit");
        expect(menuCalls).toStrictEqual([]);
        expect(logs).toStrictEqual([
            {
                context: {
                    error: "not approved",
                    filePath: "C:/unapproved.fit",
                },
                level: "warn",
                message: "Rejected fit-file-loaded with unapproved path",
            },
        ]);
    });

    it("ignores malformed IPC events before mutating loaded state", async () => {
        expect.assertions(3);

        registerDefaultHandlers();

        await getListener()(null, "C:/approved.fit");

        expect(loadedFitFilePath).toBe("C:/previous.fit");
        expect(menuCalls).toStrictEqual([]);
        expect(logs).toStrictEqual([]);
    });

    it("logs menu refresh failures after updating loaded state", async () => {
        expect.assertions(3);

        registerDefaultHandlers({
            getPersistedThemePreference: vi
                .fn<() => Promise<string>>()
                .mockRejectedValue(new Error("theme failed")),
        });

        await getListener()({ sender: "sender" }, "C:/approved.fit");

        expect(loadedFitFilePath).toBe("C:/approved.fit");
        expect(menuCalls).toStrictEqual([]);
        expect(logs).toStrictEqual([
            {
                context: {
                    error: "theme failed",
                },
                level: "error",
                message: "Failed to update menu after fit file loaded:",
            },
        ]);
    });
});

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerFileMenuHandlers } from "../../../../electron-app/main/menu/registerFileMenuHandlers.js";

type FileMenuChannel = "menu-export" | "menu-save-as";
type FileMenuListener = (event?: unknown, ...args: unknown[]) => unknown;
type RegisterFileMenuHandlersOptions = Parameters<
    typeof registerFileMenuHandlers
>[0];

describe("registerFileMenuHandlers", () => {
    let listeners: Partial<Record<FileMenuChannel, FileMenuListener>>;
    let dialogCalls: unknown[][];
    let logCalls: unknown[][];
    let rendererMessages: unknown[][];

    beforeEach(() => {
        listeners = {};
        dialogCalls = [];
        logCalls = [];
        rendererMessages = [];
    });

    function registerDefaultHandlers(
        overrides: Partial<RegisterFileMenuHandlersOptions> = {}
    ): {
        readonly copyFile: ReturnType<typeof vi.fn>;
        readonly isApprovedFilePath: ReturnType<typeof vi.fn<() => boolean>>;
        readonly showSaveDialog: ReturnType<typeof vi.fn>;
    } {
        const copyFile = vi.fn(async () => void 0);
        const isApprovedFilePath = vi.fn<() => boolean>(() => true);
        const showSaveDialog = vi.fn(async (_window, options) => {
            dialogCalls.push([_window, options]);
            return {
                canceled: false,
                filePath:
                    options.title === "Export As"
                        ? "C:/rides/current.csv"
                        : "C:/rides/copy.fit",
            };
        });

        registerFileMenuHandlers({
            browserWindowRef: () => ({
                fromWebContents: (sender) =>
                    sender === "sender"
                        ? ({ marker: "main-window" } as never)
                        : null,
            }),
            constants: {
                DIALOG_FILTERS: {
                    ALL_FILES: [
                        {
                            extensions: ["*"],
                            name: "All Files",
                        },
                    ],
                    EXPORT_FILES: [
                        {
                            extensions: ["csv"],
                            name: "CSV",
                        },
                    ],
                },
            },
            dialogRef: () => ({ showSaveDialog }),
            fs: {
                promises: {
                    copyFile,
                },
            },
            getLoadedFitFilePath: () => "C:/rides/current.fit",
            isApprovedFilePath,
            logWithContext: (...args) => {
                logCalls.push(args);
            },
            registerIpcListener: (channel, listener) => {
                if (channel === "menu-export" || channel === "menu-save-as") {
                    listeners[channel] = listener;
                }
            },
            sendToRenderer: (...args) => {
                rendererMessages.push(args);
            },
            ...overrides,
        });

        return {
            copyFile:
                (overrides.fs?.promises?.copyFile as typeof copyFile) ??
                copyFile,
            isApprovedFilePath:
                (overrides.isApprovedFilePath as typeof isApprovedFilePath) ??
                isApprovedFilePath,
            showSaveDialog,
        };
    }

    function getListener(channel: FileMenuChannel): FileMenuListener {
        const listener = listeners[channel];
        if (typeof listener !== "function") {
            throw new TypeError(`${channel} listener was not registered`);
        }

        return listener;
    }

    it("no-ops when listener registration is unavailable", () => {
        expect.assertions(1);

        registerFileMenuHandlers({
            browserWindowRef: () => null,
            registerIpcListener:
                undefined as unknown as RegisterFileMenuHandlersOptions["registerIpcListener"],
        });

        expect(listeners).toStrictEqual({});
    });

    it("registers file menu IPC listeners", () => {
        expect.assertions(1);

        registerDefaultHandlers();

        expect(Object.keys(listeners).sort()).toStrictEqual([
            "menu-export",
            "menu-save-as",
        ]);
    });

    it("opens the export dialog and dispatches the selected export path", async () => {
        expect.assertions(3);

        registerDefaultHandlers();

        await getListener("menu-export")({ sender: "sender" });

        expect(dialogCalls).toStrictEqual([
            [
                { marker: "main-window" },
                {
                    defaultPath: "C:/rides/current.csv",
                    filters: [
                        {
                            extensions: ["csv"],
                            name: "CSV",
                        },
                    ],
                    title: "Export As",
                },
            ],
        ]);
        expect(rendererMessages).toStrictEqual([
            [
                { marker: "main-window" },
                "export-file",
                "C:/rides/current.csv",
            ],
        ]);
        expect(logCalls).toStrictEqual([]);
    });

    it("blocks Save As before opening the dialog when the source path is unapproved", async () => {
        expect.assertions(5);

        const { copyFile, isApprovedFilePath, showSaveDialog } =
            registerDefaultHandlers({
                isApprovedFilePath: vi.fn<() => boolean>(() => false),
            });

        await getListener("menu-save-as")({ sender: "sender" });

        expect(isApprovedFilePath).toHaveBeenCalledWith("C:/rides/current.fit");
        expect(showSaveDialog).not.toHaveBeenCalled();
        expect(copyFile).not.toHaveBeenCalled();
        expect(rendererMessages).toStrictEqual([
            [
                { marker: "main-window" },
                "show-notification",
                "Save failed: File access denied",
                "error",
            ],
        ]);
        expect(logCalls).toStrictEqual([
            [
                "warn",
                "Blocked Save As for unapproved source path",
                { path: "C:/rides/current.fit" },
            ],
        ]);
    });

    it("copies the loaded file and shows a success notification", async () => {
        expect.assertions(3);

        const { copyFile } = registerDefaultHandlers();

        await getListener("menu-save-as")({ sender: "sender" });

        expect(copyFile).toHaveBeenCalledWith(
            "C:/rides/current.fit",
            "C:/rides/copy.fit"
        );
        expect(dialogCalls).toStrictEqual([
            [
                { marker: "main-window" },
                {
                    defaultPath: "C:/rides/current.fit",
                    filters: [
                        {
                            extensions: ["*"],
                            name: "All Files",
                        },
                    ],
                    title: "Save As",
                },
            ],
        ]);
        expect(rendererMessages).toStrictEqual([
            [
                { marker: "main-window" },
                "show-notification",
                "File saved successfully.",
                "success",
            ],
        ]);
    });

    it("reports Save As failures to the renderer and log", async () => {
        expect.assertions(2);

        registerDefaultHandlers({
            fs: {
                promises: {
                    copyFile: vi.fn(async () => {
                        throw new Error("disk full");
                    }),
                },
            },
        });

        await getListener("menu-save-as")({ sender: "sender" });

        expect(rendererMessages).toStrictEqual([
            [
                { marker: "main-window" },
                "show-notification",
                "Save failed: disk full",
                "error",
            ],
        ]);
        expect(logCalls).toStrictEqual([
            [
                "error",
                "Failed to save file:",
                { error: "disk full" },
            ],
        ]);
    });
});
